"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Chess } from "chess.js";
import MoveList from "../../components/MoveList";
import AnalysisPanel from "../../components/AnalysisPanel";
import CoachPanel from "../../components/CoachPanel";
import useStockfish from "../../hooks/useStockfish";
import {
  classifyMove,
  isMoveBest,
  uciToArrow,
} from "../../lib/chessAnalysis";
import { coachMove, coachMoveWithoutEval } from "../../lib/chessCoach";
import SimilarGamesPanel from "../../components/SimilarGamesPanel";

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

  // Check for game URLs — must start with http(s):// or www.
  // (PGN headers contain "chess.com"/"lichess.org" in [Site "..."],
  //  so checking for domain names anywhere would misidentify PGNs as URLs)
  if (/^(https?:\/\/)?(www\.)?(lichess\.org|chess\.com)\//.test(trimmed)) {
    return "gameid";
  }

  // Check for bare game IDs (8+ alphanumeric chars, no slashes)
  if (/^[a-zA-Z0-9]{8,}$/.test(trimmed)) {
    return "gameid";
  }

  // FEN: must have 8 ranks separated by "/" and a side-to-move field
  // Pattern: 8 segments of [rnbqkpRNBQKP1-8] separated by /
  const fenBoardPattern = /^([rnbqkpRNBQKP1-8]+\/){7}[rnbqkpRNBQKP1-8]+/;
  if (fenBoardPattern.test(trimmed)) {
    return "fen";
  }

  // PGN: starts with header tags ([Event, [Site, etc.) or has move numbers (1. )
  // or starts with a SAN move
  if (/^\s*\[/.test(trimmed) || /\d+\.\s/.test(trimmed) || /^\s*[a-hNBRQKOx]/.test(trimmed)) {
    return "pgn";
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

  const [evalCache, setEvalCache] = useState({});
  const [classifications, setClassifications] = useState({});
  const [coachMessage, setCoachMessage] = useState("");
  const [coachClassification, setCoachClassification] = useState(null);
  const [showArrow, setShowArrow] = useState(true);

  // Try-line mode: when user makes a move during PGN review, we branch
  // but preserve the original game so they can return to it
  const [savedGame, setSavedGame] = useState(null); // { pgnMoves, positionFens, currentPly }

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

  // Queue background analysis for all unanalyzed positions (PGN mode)
  const analysisQueueRef = useRef(null);
  useEffect(() => {
    if (!stockfish.isReady || !pgnMoves || positionFens.length <= 1) return;

    // Find positions that haven't been analyzed yet
    const unanalyzed = positionFens.filter((f) => !evalCache[f]);
    if (unanalyzed.length === 0) return;

    // Don't interfere with the current position's analysis
    // Queue analysis one at a time after the current analysis completes
    if (analysisQueueRef.current) clearTimeout(analysisQueueRef.current);

    let queueIdx = 0;
    const processQueue = () => {
      // Skip the current FEN (it's being analyzed by the other effect)
      while (queueIdx < unanalyzed.length && unanalyzed[queueIdx] === fen) {
        queueIdx++;
      }
      if (queueIdx >= unanalyzed.length) return;

      const nextFen = unanalyzed[queueIdx];
      queueIdx++;

      // Check if it got analyzed while waiting
      if (evalCache[nextFen]) {
        processQueue();
        return;
      }

      stockfish.analyze(nextFen, { depth: MAX_DEPTH });
      // Wait for this analysis to complete before starting the next
      analysisQueueRef.current = setTimeout(processQueue, 3000);
    };

    // Start queue after a delay to let current analysis finish
    analysisQueueRef.current = setTimeout(processQueue, 3500);

    return () => {
      if (analysisQueueRef.current) clearTimeout(analysisQueueRef.current);
    };
  }, [stockfish.isReady, pgnMoves, positionFens, evalCache, fen]);

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

  // Current game object for coach analysis
  const currentGame = useMemo(() => {
    const g = new Chess();
    try {
      g.load(fen);
      return g;
    } catch {
      return null;
    }
  }, [fen]);

  // Generate coach message when position changes or classifications update
  const lastCoachKeyRef = useRef("");
  useEffect(() => {
    const activeIndex = pgnMoves ? currentPly : moves.length - 1;

    if (activeIndex < 0 || !displayedMoves[activeIndex]) {
      setCoachClassification(null);
      setCoachMessage("Make a move and I'll coach you through it!");
      lastCoachKeyRef.current = "empty";
      return;
    }

    const classification = classifications[activeIndex];
    const move = displayedMoves[activeIndex];
    const beforeFen = positionFens[activeIndex];
    const afterFen = positionFens[activeIndex + 1];
    const before = evalCache[beforeFen];
    const after = evalCache[afterFen];

    // Build a unique key for this message — only re-generate if something changed
    const hasFullEval = classification && before && after && currentGame;
    const messageKey = `${activeIndex}:${fen}:${classification || "none"}:${hasFullEval ? "full" : "partial"}`;

    // Skip if we already generated this exact message
    if (messageKey === lastCoachKeyRef.current) return;
    lastCoachKeyRef.current = messageKey;

    setCoachClassification(classification);

    if (hasFullEval) {
      const message = coachMove(
        move,
        classification,
        before,
        after,
        before.bestMove,
        currentGame
      );
      setCoachMessage(message);
    } else {
      const gameBefore = new Chess();
      try {
        gameBefore.load(beforeFen);
      } catch {
        // ignore
      }
      if (currentGame) {
        const message = coachMoveWithoutEval(move, currentGame, gameBefore);
        setCoachMessage(message);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classifications, currentPly, moves.length, fen, evalCache]);

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

  const handleLoad = useCallback(async () => {
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
      setError("Fetching game from URL…");
      try {
        const apiUrl = `/api/game?url=${encodeURIComponent(text)}`;
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to fetch game.");
          return;
        }

        const pgnText = data.pgn;
        const game = new Chess();
        try {
          game.loadPgn(pgnText);
        } catch {
          setError("Fetched game but couldn't parse the PGN.");
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
        setInputText(pgnText);
        setError("");
        updateStatus(game);
      } catch (e) {
        setError("Network error fetching game: " + e.message);
      }
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
      // If in PGN mode, save the game state and enter try-line mode
      if (pgnMoves) {
        const keptMoves = pgnMoves.slice(0, currentPly + 1);
        const keptFens = positionFens.slice(0, currentPly + 2);

        // Save the original game so we can return to it
        setSavedGame({
          pgnMoves: [...pgnMoves],
          positionFens: [...positionFens],
          currentPly,
        });

        // Start try-line from current position
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

  // Return to the original game from try-line mode
  const returnToGame = useCallback(() => {
    if (!savedGame) return;
    setPgnMoves(savedGame.pgnMoves);
    setPositionFens(savedGame.positionFens);
    setCurrentPly(savedGame.currentPly);
    setFen(savedGame.positionFens[savedGame.currentPly + 1]);
    setMoves([]);
    setSavedGame(null);
    const game = new Chess();
    try {
      game.load(savedGame.positionFens[savedGame.currentPly + 1]);
      updateStatus(game);
    } catch {
      // ignore
    }
  }, [savedGame, updateStatus]);

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
    setSavedGame(null);
  }

  const handleLoadSimilarGame = useCallback(
    (pgnText, moveToPly) => {
      const game = new Chess();
      try {
        game.loadPgn(pgnText);
      } catch {
        setError("Could not load the master game PGN.");
        return;
      }
      const sans = game.history();
      const { fens, moves: verboseMoves } = buildHistory(sans);
      setPgnMoves(verboseMoves);
      setMoves([]);
      setEvalCache({});
      setClassifications({});
      setSavedGame(null);
      setPositionFens(fens);

      const clampedPly = Math.max(-1, Math.min(moveToPly, sans.length - 1));
      setCurrentPly(clampedPly);
      setFen(fens[clampedPly + 1]);
      setInputText(pgnText);
      setError("");
      updateStatus(game);
    },
    [updateStatus]
  );

  function flip() {
    setOrientation((o) => (o === "white" ? "black" : "white"));
  }

  const activeIndex = pgnMoves ? currentPly : -1;

  return (
    <div>
      <h1>Analyze a game</h1>

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

      <div className="board-layout-coach">
        <CoachPanel
          message={coachMessage}
          evalScore={displayEval.evalScore}
          evalType={displayEval.evalType}
          turn={turn}
          game={currentGame}
          bestMoveUci={displayEval.bestMove}
          classification={coachClassification}
          isAnalyzing={stockfish.isAnalyzing}
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

          {savedGame && (
            <div className="try-line-banner">
              <span className="try-line-label">Try line mode</span>
              <button className="btn" onClick={returnToGame}>
                ← Back to game
              </button>
            </div>
          )}

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

          <SimilarGamesPanel fen={fen} onLoadGame={handleLoadSimilarGame} />
        </aside>
        </div>
      </div>
    </div>
  );
}
