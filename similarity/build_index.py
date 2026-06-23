"""
Downloads master games from Lichess, generates embeddings, and builds a FAISS index.

Usage:
    python build_index.py [--max-games 5000] [--min-elo 2400]

Outputs:
    - embeddings.index  (FAISS vector index)
    - metadata.db       (SQLite database with game/position metadata)
"""

import argparse
import io
import os
import sqlite3
import urllib.request
import zstandard as zstd
from datetime import datetime

import chess
import chess.pgn
import faiss
import numpy as np

from encoder import fen_to_board_matrix, fen_to_turn, get_model

EMBED_DIM = 256
INDEX_FILE = os.path.join(os.path.dirname(__file__), "embeddings.index")
DB_FILE = os.path.join(os.path.dirname(__file__), "metadata.db")


def init_db(db_path):
    conn = sqlite3.connect(db_path)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS positions (
            id INTEGER PRIMARY KEY,
            fen TEXT NOT NULL,
            game_id INTEGER NOT NULL,
            move_number INTEGER NOT NULL,
            turn TEXT NOT NULL,
            FOREIGN KEY (game_id) REFERENCES games(id)
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            white TEXT,
            black TEXT,
            white_elo INTEGER,
            black_elo INTEGER,
            result TEXT,
            date TEXT,
            eco TEXT,
            opening TEXT,
            site TEXT,
            pgn TEXT
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_positions_game ON positions(game_id)")
    conn.commit()
    return conn


def load_games_from_pgn(pgn_path, min_elo=0, max_games=5000):
    """Load games from a local PGN file."""
    print(f"Loading games from {pgn_path}...")
    games = []

    with open(pgn_path, "r", encoding="utf-8", errors="replace") as f:
        while len(games) < max_games:
            game = chess.pgn.read_game(f)
            if game is None:
                break

            headers = game.headers
            white_elo = int(headers.get("WhiteElo", 0) or headers.get("WhiteUSCF", 0) or 2200)
            black_elo = int(headers.get("BlackElo", 0) or headers.get("BlackUSCF", 0) or 2200)

            if min_elo > 0 and (white_elo < min_elo or black_elo < min_elo):
                continue

            games.append(game)

    print(f"Loaded {len(games)} games")
    return games


def download_lichess_games(year, month, min_elo=0, max_games=5000):
    """Download games from Lichess API for top players (faster than full database)."""
    top_players = [
        "drnykterstein",  # Magnus Carlsen
        "hikarunakamura",
        "gmbenjaminfinegold",
        "anne_leipzig",
        "penguingm1",
        "mishanick",
        "wonderfultime",
        "livchessblogger",
        "thibault",
        "gmljuca",
    ]

    games = []
    for player in top_players:
        if len(games) >= max_games:
            break

        url = f"https://lichess.org/api/games/user/{player}?max=100&rated=true&perfType=classical&opening=true"
        print(f"  Fetching games from {player}...")
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Chess-Surgeon/1.0", "Accept": "application/x-chess-pgn"})
            response = urllib.request.urlopen(req, timeout=30)
            pgn_text = response.read().decode("utf-8", errors="replace")
        except Exception as e:
            print(f"    Error: {e}")
            continue

        pgn_io = io.StringIO(pgn_text)
        count_before = len(games)

        while len(games) < max_games:
            game = chess.pgn.read_game(pgn_io)
            if game is None:
                break

            headers = game.headers
            white_elo = int(headers.get("WhiteElo", 0) or 0)
            black_elo = int(headers.get("BlackElo", 0) or 0)

            if white_elo < min_elo or black_elo < min_elo:
                continue

            games.append(game)

        print(f"    Got {len(games) - count_before} games from {player}")

    print(f"Collected {len(games)} games total")
    return games


def game_to_positions(game):
    """Extract all positions from a game as (fen, move_number, turn) tuples."""
    positions = []
    board = game.board()
    move_num = 0

    positions.append((board.fen(), 0, "white" if board.turn == chess.WHITE else "black"))

    for move in game.mainline_moves():
        board.push(move)
        move_num += 1
        turn = "white" if board.turn == chess.WHITE else "black"
        positions.append((board.fen(), move_num, turn))

    return positions


def build_index(max_games=5000, min_elo=2400, source="local"):
    print(f"=== Building similarity index ===")
    print(f"Max games: {max_games}, Min ELO: {min_elo}, Source: {source}")

    conn = init_db(DB_FILE)

    if source == "local":
        pgn_path = os.path.join(os.path.dirname(__file__), "sample_games.pgn")
        games = load_games_from_pgn(pgn_path, min_elo=0, max_games=max_games)
    else:
        year = datetime.now().year
        month = datetime.now().month - 1
        if month < 1:
            year -= 1
            month = 12
        games = download_lichess_games(year, month, min_elo, max_games)

        if not games:
            print("No games found! Trying previous month...")
            month -= 1
            if month < 1:
                year -= 1
                month = 12
            games = download_lichess_games(year, month, min_elo, max_games)

    if not games:
        print("ERROR: Could not load any games.")
        return

    print(f"\nLoading ChessLM model...")
    model = get_model()

    all_embeddings = []
    position_id = 0
    seen_fens = set()

    for game_idx, game in enumerate(games):
        headers = game.headers
        white = headers.get("White", "?")
        black = headers.get("Black", "?")
        white_elo = int(headers.get("WhiteElo", 0) or 0)
        black_elo = int(headers.get("BlackElo", 0) or 0)
        result = headers.get("Result", "*")
        date = headers.get("UTCDate", "")
        eco = headers.get("ECO", "")
        opening = headers.get("Opening", "")
        site = headers.get("Site", "")

        exporter = chess.pgn.StringExporter()
        pgn_text = game.accept(exporter)

        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO games (white, black, white_elo, black_elo, result, date, eco, opening, site, pgn)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (white, black, white_elo, black_elo, result, date, eco, opening, site, pgn_text)
        )
        game_id = cursor.lastrowid

        positions = game_to_positions(game)
        game_fens = []
        game_moves = []
        game_turns = []

        for fen, move_num, turn in positions:
            if fen in seen_fens:
                continue
            seen_fens.add(fen)
            game_fens.append(fen)
            game_moves.append(move_num)
            game_turns.append(turn)

        if not game_fens:
            continue

        batch_size = 32
        for i in range(0, len(game_fens), batch_size):
            batch_fens = game_fens[i:i+batch_size]
            batch_moves = game_moves[i:i+batch_size]
            batch_turns = game_turns[i:i+batch_size]

            matrices = [fen_to_board_matrix(f) for f in batch_fens]
            turns = [0 if t == "white" else 1 for t in batch_turns]
            embeddings = model.encode_batch(matrices, turns)

            for j, (fen, move_num, turn) in enumerate(zip(batch_fens, batch_moves, batch_turns)):
                all_embeddings.append(embeddings[j])
                cursor.execute(
                    "INSERT INTO positions (fen, game_id, move_number, turn) VALUES (?, ?, ?, ?)",
                    (fen, game_id, move_num, turn)
                )
                position_id += 1

        conn.commit()

        if (game_idx + 1) % 100 == 0:
            print(f"  Processed {game_idx + 1}/{len(games)} games, {position_id} unique positions so far")

    conn.close()

    print(f"\nTotal unique positions: {len(all_embeddings)}")
    print(f"Building FAISS index...")

    embeddings_array = np.array(all_embeddings, dtype=np.float32)
    index = faiss.IndexFlatIP(EMBED_DIM)
    index.add(embeddings_array)

    faiss.write_index(index, INDEX_FILE)
    print(f"FAISS index saved to {INDEX_FILE}")
    print(f"Done! {index.ntotal} vectors indexed.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build similarity index from master games")
    parser.add_argument("--max-games", type=int, default=5000, help="Maximum number of games to process")
    parser.add_argument("--min-elo", type=int, default=2400, help="Minimum ELO for both players")
    parser.add_argument("--source", choices=["local", "lichess"], default="local", help="Game data source")
    args = parser.parse_args()
    build_index(max_games=args.max_games, min_elo=args.min_elo, source=args.source)
