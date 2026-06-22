"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Chess } from "chess.js";
import MoveList from "../../components/MoveList";
import AnalysisPanel from "../../components/AnalysisPanel";
import ImageInput from "../../components/ImageInput";
import useStockfish from "../../hooks/useStockfish";
import {
  classifyMove,
  isMoveBest,
  uciToArrow,
} from "../../lib/chessAnalysis";

const ChessBoard = dynamic(() => import("../../components/ChessBoard"), {
  ssr: false,
  loading: () => <div className="placeholder">Loading board…</div>,
});

const STARTING_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const MAX_DEPTH = 12;

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

function buildHistory(sans) {
  const game = new Chess();
  const fens = [game.fen()];
  const moves = [];
  for (const san of sans) {
    try {
      const move = game.move(san);
      moves.push({
        from: move.from,
        to: move.to,
        san: move.san,
        color: move.color,
      });
      fens.push(game.fen());
    } catch {
      break;
    }
  }
  return { fens, moves };
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
  const [positionFens, setPositionFens] = useState([STARTING_FEN]);
  const [inputMode, setInputMode] = useState("text");

  const [evalCache, setEvalCache] = useState({});
  const [classifications, setClassifications] = useState({});
  const [showArrow, setShowArrow] = useState(true);

  const onComplete = useCallback((analyzedFen, result) => {
    setEvalCache((prev) => ({
      ...prev,
      [analyzedFen]: {
        evalScore: result.evalScore,
        evalType: result.evalType,
        bestMove: result.bestMove,
        depth: result.depth,
        pv: result.pv,
      },
    }));
  }, []);

  const stockfish = useStockfish({ onComplete });

  const turn = useMemo(() => {
    const parts = fen.split(" ");
    return parts[1] || "w";
  }, [fen]);

  // Auto-analyze when FEN changes (debounced)
  const analyzeTimerRef = useRef(null);
  useEffect(() => {
    if (!stockfish.isReady) return;

    const game = new Chess();
    try {
      game.load(fen);
    } catch {
      return;
    }
    if (game.isGameOver()) return;

    if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
    analyzeTimerRef.current = setTimeout(() => {
      stockfish.analyze(fen, { depth: MAX_DEPTH });
    }, 300);

    return () => {
      if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
    };
  }, [fen, stockfish.isReady]);

  // Calculate classifications whenever evalCache or positionFens change
  const displayedMoves = pgnMoves || moves;

  useEffect(() => {
    const newClassifications = {};
    for (let i = 1; i < positionFens.length; i++) {
      const beforeFen = positionFens[i - 1];
      const afterFen = positionFens[i];
      const before = evalCache[beforeFen];
      const after = evalCache[afterFen];

      if (!before || !after) continue;

      const move = displayedMoves[i - 1];
      if (!move) continue;

      const best = isMoveBest(move.from, move.to, before.bestMove);
      const label = classifyMove(before, after, best);
      if (label) newClassifications[i - 1] = label;
    }
    setClassifications(newClassifications);
  }, [evalCache, positionFens, displayedMoves]);

  // Calculate overall accuracy
  const accuracy = useMemo(() => {
    const labels = Object.values(classifications);
    if (!labels.length) return null;

    const scores = {
      best: 100,
      great: 95,
      good: 85,
      inaccuracy: 65,
      mistake: 45,
      blunder: 10,
    };

    const total = labels.reduce((sum, l) => sum + (scores[l] || 50), 0);
    return total / labels.length;
  }, [classifications]);

  // Current display eval: prefer cached, fall back to live
  const currentCached = evalCache[fen];
  const displayEval = currentCached || {
    evalScore: stockfish.evalScore,
    evalType: stockfish.evalType,
    bestMove: stockfish.bestMove,
    pv: stockfish.pv,
    depth: stockfish.depth,
  };

  // Best move arrow
  const arrows = useMemo(() => {
    if (!showArrow || !displayEval.bestMove) return [];
    const arrow = uciToArrow(displayEval.bestMove);
    return arrow ? [arrow] : [];
  }, [showArrow, displayEval.bestMove]);

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
      setPositionFens([game.fen()]);
      setEvalCache({});
      setClassifications({});
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
      const sans = game.history();
      const { fens, moves: verboseMoves } = buildHistory(sans);
      setPgnMoves(verboseMoves);
      setCurrentPly(sans.length - 1);
      setPositionFens(fens);
      setFen(fens[fens.length - 1]);
      setMoves([]);
      setEvalCache({});
      setClassifications({});
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
      const fenIndex = clamped + 1;
      setCurrentPly(clamped);
      setFen(positionFens[fenIndex]);
      const game = new Chess();
      try {
        game.load(positionFens[fenIndex]);
        updateStatus(game);
      } catch {
        // ignore
      }
    },
    [pgnMoves, positionFens, updateStatus]
  );

  const handleBoardMove = useCallback(
    ({ move, fen, isCheck, isCheckmate, isDraw, turn }) => {
      // If in PGN mode, switch to free play from current position
      if (pgnMoves) {
        const keptMoves = pgnMoves.slice(0, currentPly + 1);
        const keptFens = positionFens.slice(0, currentPly + 2);
        setMoves([
          ...keptMoves,
          { from: move.from, to: move.to, san: move.san, color: move.color },
        ]);
        setPgnMoves(null);
        setPositionFens([...keptFens, fen]);
      } else {
        setMoves((prev) => [
          ...prev,
          { from: move.from, to: move.to, san: move.san, color: move.color },
        ]);
        setPositionFens((prev) => [...prev, fen]);
      }
      setFen(fen);
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
    [pgnMoves, currentPly, positionFens]
  );

  function reset() {
    setFen(STARTING_FEN);
    setMoves([]);
    setPgnMoves(null);
    setCurrentPly(-1);
    setPositionFens([STARTING_FEN]);
    setStatus("White to move");
    setInputText("");
    setError("");
    setEvalCache({});
    setClassifications({});
  }

  function flip() {
    setOrientation((o) => (o === "white" ? "black" : "white"));
  }

  const activeIndex = pgnMoves ? currentPly : -1;

  return (
    <div>
      <h1>Analyze a game</h1>

      <div className="input-tabs">
        <button
          className={`input-tab ${inputMode === "text" ? "active" : ""}`}
          onClick={() => setInputMode("text")}
        >
          Paste Text
        </button>
        <button
          className={`input-tab ${inputMode === "image" ? "active" : ""}`}
          onClick={() => setInputMode("image")}
        >
          Screenshot OCR
        </button>
      </div>

      {inputMode === "text" ? (
        <div className="input-section">
          <textarea
            className="pgn-input"
            placeholder={"Paste a PGN, FEN, or game URL here…\n\nPGN: 1. e4 e5 2. Nf3 Nc6\nFEN: rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"}
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
      ) : (
        <ImageInput
          onExtract={({ type, value }) => {
            setError("");
            setInputText(value);
            if (type === "fen") {
              const game = new Chess();
              try {
                game.load(value);
                setFen(game.fen());
                setMoves([]);
                setPgnMoves(null);
                setCurrentPly(-1);
                setPositionFens([game.fen()]);
                setEvalCache({});
                setClassifications({});
                updateStatus(game);
              } catch {
                setError("OCR found a FEN but it was invalid. Try a clearer screenshot.");
              }
            } else if (type === "pgn") {
              const game = new Chess();
              try {
                game.loadPgn(value);
                const sans = game.history();
                const { fens, moves: verboseMoves } = buildHistory(sans);
                setPgnMoves(verboseMoves);
                setCurrentPly(sans.length - 1);
                setPositionFens(fens);
                setFen(fens[fens.length - 1]);
                setMoves([]);
                setEvalCache({});
                setClassifications({});
                updateStatus(game);
              } catch {
                setError("OCR found moves but couldn't parse them as PGN. Try a clearer screenshot.");
              }
            }
          }}
        />
      )}

      <AnalysisPanel
        isReady={stockfish.isReady}
        isAnalyzing={stockfish.isAnalyzing}
        evalScore={displayEval.evalScore}
        evalType={displayEval.evalType}
        bestMove={displayEval.bestMove}
        pv={displayEval.pv}
        depth={displayEval.depth}
        maxDepth={MAX_DEPTH}
        turn={turn}
        showArrow={showArrow}
        onToggleArrow={() => setShowArrow((s) => !s)}
        accuracy={accuracy}
      />

      <div className="board-layout">
        <ChessBoard
          fen={fen}
          orientation={orientation}
          onMove={handleBoardMove}
          arrows={arrows}
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
            classifications={classifications}
          />
        </aside>
      </div>
    </div>
  );
}
