"""
FastAPI service for chess position similarity search.
Loads the ChessLM model and pre-built FAISS index, serves similarity queries.

Usage:
    uvicorn serve:app --host 0.0.0.0 --port 8000
"""

import os
import sqlite3

import faiss
import numpy as np
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from encoder import fen_to_embedding

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_FILE = os.path.join(BASE_DIR, "embeddings.index")
DB_FILE = os.path.join(BASE_DIR, "metadata.db")

app = FastAPI(title="Chess-Surgeon Similarity Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

index = None
db_conn = None


@app.on_event("startup")
def load_resources():
    global index, db_conn
    if os.path.exists(INDEX_FILE):
        print(f"Loading FAISS index from {INDEX_FILE}...")
        index = faiss.read_index(INDEX_FILE)
        print(f"Loaded {index.ntotal} vectors.")
    else:
        print("WARNING: No FAISS index found. Run build_index.py first.")

    if os.path.exists(DB_FILE):
        db_conn = sqlite3.connect(DB_FILE, check_same_thread=False)
        db_conn.row_factory = sqlite3.Row
        print(f"Loaded metadata database from {DB_FILE}.")
    else:
        print("WARNING: No metadata database found.")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "index_loaded": index is not None,
        "db_loaded": db_conn is not None,
        "num_vectors": index.ntotal if index else 0,
    }


@app.get("/similar")
def find_similar(
    fen: str = Query(..., description="FEN string of the position to search"),
    k: int = Query(10, description="Number of similar positions to return"),
):
    if index is None:
        return {"error": "FAISS index not loaded. Run build_index.py first."}
    if db_conn is None:
        return {"error": "Metadata database not loaded."}

    try:
        query_embedding = fen_to_embedding(fen).reshape(1, -1).astype(np.float32)
    except Exception as e:
        return {"error": f"Failed to generate embedding: {str(e)}"}

    k = min(k, index.ntotal)
    if k == 0:
        return {"results": []}

    scores, indices = index.search(query_embedding, k)

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx < 0:
            continue

        row = db_conn.execute(
            "SELECT fen, game_id, move_number, turn FROM positions WHERE id = ?",
            (int(idx),)
        ).fetchone()

        if not row:
            continue

        game = db_conn.execute(
            "SELECT white, black, white_elo, black_elo, result, date, eco, opening, site FROM games WHERE id = ?",
            (row["game_id"],)
        ).fetchone()

        results.append({
            "similarity": float(score),
            "fen": row["fen"],
            "move_number": row["move_number"],
            "turn": row["turn"],
            "game": {
                "white": game["white"] if game else None,
                "black": game["black"] if game else None,
                "white_elo": game["white_elo"] if game else None,
                "black_elo": game["black_elo"] if game else None,
                "result": game["result"] if game else None,
                "date": game["date"] if game else None,
                "eco": game["eco"] if game else None,
                "opening": game["opening"] if game else None,
                "site": game["site"] if game else None,
            } if game else None,
        })

    return {"query_fen": fen, "results": results}
