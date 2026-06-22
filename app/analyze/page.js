"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { Chess } from "chess.js";
import MoveList from "../../components/MoveList";
import AnalysisPanel from "../../components/AnalysisPanel";
import useStockfish from "../../hooks/useStockfish";

const ChessBoard = dynamic(() => import("../../components/ChessBoard"), {
  ssr: false,
  loading: () => <div className="placeholder">Loading board…</div>,
});

const MAX_DEPTH = 18;

const STARTING_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function detectFormat(text) {
  const trimmed = text.trim();
  if (!trimmed) return "empty";

  if (trimmed.includes("/") && trimmed.split(" ").length <= 6) {
    return "fen";
  }

  if (/\d+\.\s/.test(trimmed) || /^\s*[a-hNBRQK]/.test(trimmed)) {
    return "pgn";
  }

  if (/lichess\.org|chess\.com/.test(trimmed) || /^[a-zA-Z0-9]{8,}$/.test(trimmed)) {
    return "gameid";
  }

  return "unknown";
}

export default function AnalyzePage() {
  const [fen, setFen] = useState(STARTING_FEN);
  const [moves, setMoves] = useState([]);
  const [status, setStatus] = useState("White to move");
  const [orientation, setOrientation] = useState("white");

  const [inputText, setInputText] = useState("");
  const [error, setError] = useState("");
  const [pgnMoves, setPgnMoves] = useState(null);
  const [currentPly, setCurrentPly] = useState(-1);

  const stockfish = useStockfish();

  const turn = useMemo(() => {
    const parts = fen.split(" ");
    return parts[1] || "w";
  }, [fen]);

  const updateStatus = useCallback((game) => {
    if (game.isCheckmate()) {
      setStatus(`Checkmate — ${game.turn() === "w" ? "Black" : "White"} wins`);
    } else if (game.isDraw()) {
      setStatus("Draw");
    } else if (game.inCheck()) {
      setStatus(`${game.turn() === "w" ? "White" : "Black"} to move — Check!`);
    } else {
      setStatus(`${game.turn() === "w" ? "White" : "Black"} to move`);
    }
  }, []);

  const handleLoad = useCallback(() => {
    setError("");
    const text = inputText.trim();
    if (!text) {
      setError("Paste a PGN, FEN, or game URL first.");
      return;
    }

    const format = detectFormat(text);

    if (format === "fen") {
      const game = new Chess();
      try {
        game.load(text);
      } catch {
        setError("Invalid FEN string. Check the format and try again.");
        return;
      }
      setFen(game.fen());
      setMoves([]);
      setPgnMoves(null);
      setCurrentPly(-1);
      updateStatus(game);
      return;
    }

    if (format === "pgn") {
      const game = new Chess();
      try {
        game.loadPgn(text);
      } catch {
        setError("Invalid PGN. Check the format and try again.");
        return;
      }
      const history = game.history();
      const moveList = history.map((san, i) => ({
        san,
        color: i % 2 === 0 ? "w" : "b",
      }));
      setPgnMoves(moveList);
      setCurrentPly(history.length - 1);
      setFen(game.fen());
      setMoves([]);
      updateStatus(game);
      return;
    }

    if (format === "gameid") {
      setError(
        "Loading games by ID/URL requires an API call. Paste the PGN directly for now."
      );
      return;
    }

    setError("Could not detect format. Paste a valid FEN or PGN.");
  }, [inputText, updateStatus]);

  const navigateTo = useCallback(
    (ply) => {
      if (!pgnMoves) return;
      const clamped = Math.max(-1, Math.min(ply, pgnMoves.length - 1));
      const game = new Chess();
      const sans = pgnMoves.slice(0, clamped + 1).map((m) => m.san);
      for (const san of sans) {
        try {
          game.move(san);
        } catch {
          break;
        }
      }
      setCurrentPly(clamped);
      setFen(game.fen());
      updateStatus(game);
    },
    [pgnMoves, updateStatus]
  );

  const handleBoardMove = useCallback(
    ({ move, fen, isCheck, isCheckmate, isDraw, turn }) => {
      setFen(fen);
      setMoves((prev) => [
        ...prev,
        { from: move.from, to: move.to, san: move.san, color: move.color },
      ]);
      if (isCheckmate) {
        setStatus(`Checkmate — ${turn === "w" ? "Black" : "White"} wins`);
      } else if (isDraw) {
        setStatus("Draw");
      } else if (isCheck) {
        setStatus(`${turn === "w" ? "White" : "Black"} to move — Check!`);
      } else {
        setStatus(`${turn === "w" ? "White" : "Black"} to move`);
      }
    },
    []
  );

  function reset() {
    setFen(STARTING_FEN);
    setMoves([]);
    setPgnMoves(null);
    setCurrentPly(-1);
    setStatus("White to move");
    setInputText("");
    setError("");
  }

  function flip() {
    setOrientation((o) => (o === "white" ? "black" : "white"));
  }

  const displayedMoves = pgnMoves || moves;
  const activeIndex = pgnMoves ? currentPly : -1;

  const handleAnalyze = useCallback(() => {
    stockfish.analyze(fen, { depth: MAX_DEPTH });
  }, [stockfish, fen]);

  return (
    <div>
      <h1>Analyze a game</h1>

      <div className="input-section">
        <textarea
          className="pgn-input"
          placeholder="Paste a PGN, FEN, or game URL here…&#10;&#10;PGN: 1. e4 e5 2. Nf3 Nc6&#10;FEN: rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={4}
        />
        <div className="input-actions">
          <button className="btn" onClick={handleLoad}>
            Load
          </button>
          <button className="btn secondary" onClick={reset}>
            Clear
          </button>
        </div>
        {error && <p className="input-error">{error}</p>}
      </div>

      <AnalysisPanel
        isReady={stockfish.isReady}
        isAnalyzing={stockfish.isAnalyzing}
        evalScore={stockfish.evalScore}
        evalType={stockfish.evalType}
        bestMove={stockfish.bestMove}
        pv={stockfish.pv}
        depth={stockfish.depth}
        maxDepth={MAX_DEPTH}
        turn={turn}
        onAnalyze={handleAnalyze}
      />

      <div className="board-layout">
        <ChessBoard
          fen={fen}
          orientation={orientation}
          onMove={handleBoardMove}
        />
        <aside className="board-side">
          <p
            className="board-status"
            dangerouslySetInnerHTML={{
              __html: status.replace(
                /(White|Black) to move/,
                (m, c) =>
                  `<span class="turn-${c === "White" ? "w" : "b"}">${m}</span>`
              ),
            }}
          />
          <div className="board-actions">
            <button className="btn secondary" onClick={flip}>
              Flip board
            </button>
            <button className="btn secondary" onClick={reset}>
              Reset
            </button>
          </div>

          {pgnMoves && (
            <div className="nav-actions">
              <button
                className="btn secondary"
                onClick={() => navigateTo(-1)}
                disabled={currentPly <= -1}
              >
                ⏮ Start
              </button>
              <button
                className="btn secondary"
                onClick={() => navigateTo(currentPly - 1)}
                disabled={currentPly <= -1}
              >
                ◀ Prev
              </button>
              <button
                className="btn secondary"
                onClick={() => navigateTo(currentPly + 1)}
                disabled={currentPly >= pgnMoves.length - 1}
              >
                Next ▶
              </button>
              <button
                className="btn secondary"
                onClick={() => navigateTo(pgnMoves.length - 1)}
                disabled={currentPly >= pgnMoves.length - 1}
              >
                End ⏭
              </button>
            </div>
          )}

          <p className="move-side-title">Moves</p>
          <MoveList
            moves={displayedMoves}
            currentIndex={activeIndex}
            onMoveClick={pgnMoves ? (idx) => navigateTo(idx) : undefined}
          />
        </aside>
      </div>
    </div>
  );
}
