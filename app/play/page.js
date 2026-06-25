"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Chess } from "chess.js";
import MoveList from "../../components/MoveList";
import CoachPanel from "../../components/CoachPanel";
import useStockfishPlayer from "../../hooks/useStockfishPlayer";
import { ELO_PRESETS, DEFAULT_ELO, getPresetByElo } from "../../lib/eloLevels";
import { classifyMove, isMoveBest, uciToArrow, uciToSan } from "../../lib/chessAnalysis";
import { coachMoveWithoutEval, detectBlunder, PIECE_NAMES } from "../../lib/chessCoach";

const ChessBoard = dynamic(() => import("../../components/ChessBoard"), {
  ssr: false,
  loading: () => <div className="placeholder">Loading board…</div>,
});

const STARTING_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const COACH_DEPTH = 12;
const ADAPTIVE_INTERVAL = 8;
const ADAPTIVE_RANGE = 300;

export default function PlayPage() {
  // Game state
  const [fen, setFen] = useState(STARTING_FEN);
  const [moves, setMoves] = useState([]);
  const [positionFens, setPositionFens] = useState([STARTING_FEN]);
  const [status, setStatus] = useState("White to move");
  const [gameOver, setGameOver] = useState(false);
  const [lastMove, setLastMove] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [result, setResult] = useState(null);

  // Settings
  const [elo, setElo] = useState(DEFAULT_ELO);
  const [playerColor, setPlayerColor] = useState("white");
  const [coachEnabled, setCoachEnabled] = useState(true);
  const [showHint, setShowHint] = useState(false);

  // Coach state
  const [coachMessage, setCoachMessage] = useState(
    "Start a game and I'll coach you through it!"
  );
  const [coachClassification, setCoachClassification] = useState(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [evalCache, setEvalCache] = useState({});
  const [classifications, setClassifications] = useState({});

  // Adaptive AI
  const [adaptiveNote, setAdaptiveNote] = useState("");
  const [effectiveElo, setEffectiveElo] = useState(DEFAULT_ELO);
  const [botRetry, setBotRetry] = useState(0);
  const lastAdaptedAtRef = useRef(0);

  // Engine
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

  const stockfish = useStockfishPlayer({ onComplete });

  const playerColorCode = playerColor === "white" ? "w" : "b";
  const botColorCode = playerColor === "white" ? "b" : "w";
  const orientation = playerColor;
  const preset = getPresetByElo(effectiveElo);

  // Refs to avoid retriggering the bot effect when non-essential state changes
  const presetRef = useRef(preset);
  const gameOverRef = useRef(gameOver);

  useEffect(() => {
    presetRef.current = preset;
  }, [preset]);

  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  const turn = useMemo(() => fen.split(" ")[1] || "w", [fen]);
  const isPlayerTurn = turn === playerColorCode && !gameOver && gameStarted;
  const isBotTurn = turn === botColorCode && !gameOver && gameStarted;

  const currentGame = useMemo(() => {
    const g = new Chess();
    try {
      g.load(fen);
    } catch {
      // ignore
    }
    return g;
  }, [fen]);

  const updateStatus = useCallback((game) => {
    if (game.isCheckmate()) {
      const winner = game.turn() === "w" ? "Black" : "White";
      setStatus(`Checkmate — ${winner} wins`);
      setGameOver(true);
      setResult(winner === (playerColor === "white" ? "White" : "Black") ? "win" : "loss");
    } else if (game.isStalemate()) {
      setStatus("Stalemate — Draw");
      setGameOver(true);
      setResult("draw");
    } else if (game.isInsufficientMaterial()) {
      setStatus("Insufficient material — Draw");
      setGameOver(true);
      setResult("draw");
    } else if (game.isThreefoldRepetition()) {
      setStatus("Threefold repetition — Draw");
      setGameOver(true);
      setResult("draw");
    } else if (game.isDraw()) {
      setStatus("Draw");
      setGameOver(true);
      setResult("draw");
    } else if (game.inCheck()) {
      setStatus(
        `${game.turn() === "w" ? "White" : "Black"} to move — Check!`
      );
    } else {
      setStatus(`${game.turn() === "w" ? "White" : "Black"} to move`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerColor]);

  // ---- Bot move effect ----
  // Uses fen guard + presetRef so adaptive ELO changes or evalCache updates
  // don't cancel an in-flight bot move (which was causing freezes).
  const botThinkingForRef = useRef(null);

  useEffect(() => {
    if (!stockfish.isReady || !isBotTurn) return;
    if (botThinkingForRef.current === fen) return;
    botThinkingForRef.current = fen;
    const targetFen = fen;

    (async () => {
      const p = presetRef.current;
      const res = await stockfish.getMove(targetFen, {
        depth: p.depth,
        skillLevel: p.skillLevel,
        movetime: p.movetime,
      });

      // Skip if superseded (game reset, undo, or resigned)
      if (botThinkingForRef.current !== targetFen) return;
      if (gameOverRef.current) return;

      if (!res.move) {
        botThinkingForRef.current = null;
        setBotRetry((r) => r + 1);
        return;
      }

      const game = new Chess();
      try {
        game.load(targetFen);
      } catch {
        botThinkingForRef.current = null;
        return;
      }

      const from = res.move.slice(0, 2);
      const to = res.move.slice(2, 4);
      const promotion = res.move.length > 4 ? res.move[4] : "q";

      let move;
      try {
        move = game.move({ from, to, promotion });
      } catch {
        move = null;
      }

      if (!move) {
        botThinkingForRef.current = null;
        setBotRetry((r) => r + 1);
        return;
      }

      const newFen = game.fen();

      setMoves((prev) => [
        ...prev,
        {
          from: move.from,
          to: move.to,
          san: move.san,
          color: move.color,
          piece: move.piece,
          captured: move.captured,
        },
      ]);
      setPositionFens((prev) => [...prev, newFen]);
      setFen(newFen);
      setLastMove({ from: move.from, to: move.to });
      botThinkingForRef.current = null;

      // Store eval from bot's search (eval of the position the bot moved from)
      if (res.evalScore !== null) {
        setEvalCache((prev) => ({
          ...prev,
          [targetFen]: {
            evalScore: res.evalScore,
            evalType: res.evalType,
            bestMove: res.move,
            depth: res.depth,
            pv: res.pv,
          },
        }));
      }

      updateStatus(game);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    stockfish.isReady,
    fen,
    isBotTurn,
    botRetry,
    updateStatus,
  ]);

  // ---- Coach analysis effect (player's turn) ----
  const coachAnalyzedRef = useRef({});

  useEffect(() => {
    if (!stockfish.isReady || !gameStarted || gameOver) return;
    if (turn !== playerColorCode) return;
    if (!coachEnabled) return;
    if (evalCache[fen] || coachAnalyzedRef.current[fen]) return;

    coachAnalyzedRef.current[fen] = true;

    const timer = setTimeout(() => {
      stockfish.analyze(fen, { depth: COACH_DEPTH });
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    stockfish.isReady,
    fen,
    turn,
    playerColorCode,
    gameStarted,
    gameOver,
    coachEnabled,
    evalCache,
  ]);

  // ---- Move classification (when both before/after evals available) ----
  useEffect(() => {
    if (moves.length === 0) return;

    const newClassifications = {};
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      if (move.color !== playerColorCode) continue;

      const beforeFen = positionFens[i];
      const afterFen = positionFens[i + 1];
      const before = evalCache[beforeFen];
      const after = evalCache[afterFen];

      if (!before || !after) continue;

      const best = isMoveBest(move.from, move.to, before.bestMove);
      const label = classifyMove(before, after, best);
      if (label) newClassifications[i] = label;
    }

    setClassifications(newClassifications);

    // ---- Adaptive AI ----
    // Only adapt after enough NEW classifications since the last adaptation,
    // and cap the effective ELO to ±ADAPTIVE_RANGE of the base difficulty.
    const playerClassifications = Object.entries(newClassifications).map(
      ([idx, label]) => ({ idx: parseInt(idx, 10), label })
    );

    const totalClassified = playerClassifications.length;
    if (totalClassified - lastAdaptedAtRef.current < ADAPTIVE_INTERVAL) return;

    const recent = playerClassifications.slice(-ADAPTIVE_INTERVAL);
    const scores = {
      best: 100,
      great: 95,
      good: 85,
      inaccuracy: 65,
      mistake: 45,
      blunder: 10,
    };
    const avg =
      recent.reduce((sum, { label }) => sum + (scores[label] || 50), 0) /
      recent.length;

    const minElo = Math.max(ELO_PRESETS[0].elo, elo - ADAPTIVE_RANGE);
    const maxElo = Math.min(
      ELO_PRESETS[ELO_PRESETS.length - 1].elo,
      elo + ADAPTIVE_RANGE
    );

    const currentIdx = ELO_PRESETS.findIndex((p) => p.elo === effectiveElo);

    if (avg > 88 && currentIdx < ELO_PRESETS.length - 1) {
      const nextElo = ELO_PRESETS[currentIdx + 1].elo;
      if (nextElo <= maxElo) {
        setEffectiveElo(nextElo);
        lastAdaptedAtRef.current = totalClassified;
        setAdaptiveNote(
          `You're playing well! Bumping up to ${nextElo} ELO.`
        );
        setTimeout(() => setAdaptiveNote(""), 5000);
      }
    } else if (avg < 42 && currentIdx > 0) {
      const prevElo = ELO_PRESETS[currentIdx - 1].elo;
      if (prevElo >= minElo) {
        setEffectiveElo(prevElo);
        lastAdaptedAtRef.current = totalClassified;
        setAdaptiveNote(
          `Adjusting down to ${prevElo} ELO — let's find your rhythm.`
        );
        setTimeout(() => setAdaptiveNote(""), 5000);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evalCache, moves, positionFens, playerColorCode]);

  // ---- Post-bot-move coach update ----
  // After the bot moves, it stores the eval of the position after the player's
  // move. This effect detects when a NEW classification comes in for the
  // player's most recent move and updates the coach message with accurate
  // feedback, then calls the LLM once with full classification data.
  //
  // This is the ONLY place the LLM coach is called — handleBoardMove just
  // shows immediate feedback, and this effect fires after the bot responds
  // with accurate eval data. This prevents critical feedback from being
  // overwritten by a generic LLM response before the player can read it.
  const lastCoachedMoveIdxRef = useRef(-1);
  const coachMessageTimeRef = useRef(0);

  useEffect(() => {
    if (!coachEnabled || !gameStarted || gameOver) return;

    // Find the player's most recent move
    let lastPlayerMoveIdx = -1;
    for (let i = moves.length - 1; i >= 0; i--) {
      if (moves[i].color === playerColorCode) {
        lastPlayerMoveIdx = i;
        break;
      }
    }
    if (lastPlayerMoveIdx < 0) return;

    // Only update if this move just got classified and we haven't coached it yet
    const classification = classifications[lastPlayerMoveIdx];
    if (!classification) return;
    if (lastCoachedMoveIdxRef.current >= lastPlayerMoveIdx) return;

    lastCoachedMoveIdxRef.current = lastPlayerMoveIdx;

    const move = moves[lastPlayerMoveIdx];
    const beforeFen = positionFens[lastPlayerMoveIdx];
    const afterFen = positionFens[lastPlayerMoveIdx + 1];
    const before = evalCache[beforeFen];
    const after = evalCache[afterFen];

    if (!before || !after) return;

    // Build updated feedback with accurate classification
    const bestSan = before.bestMove ? uciToSan(before.bestMove, beforeFen) : null;
    const isCritical = ["inaccuracy", "mistake", "blunder"].includes(classification);

    const classLabels = {
      best: "the engine's top choice",
      great: "a great move",
      good: "a decent move",
      inaccuracy: "a slight inaccuracy",
      mistake: "a mistake",
      blunder: "a blunder",
    };

    let updatedMessage;
    if (isCritical) {
      if (bestSan) {
        updatedMessage = `${move.san} was ${classLabels[classification]}. The engine suggests ${bestSan} instead. Let me break down what went wrong...`;
      } else {
        updatedMessage = `${move.san} was ${classLabels[classification]}. Let me break down what went wrong...`;
      }
    } else if (classification === "best") {
      updatedMessage = `Excellent! ${move.san} was ${classLabels[classification]}. Let me tell you why it's so good...`;
    } else {
      if (bestSan) {
        updatedMessage = `${move.san} was ${classLabels[classification]}, but the engine suggests ${bestSan} was slightly better. Let me explain...`;
      } else {
        updatedMessage = `${move.san} was ${classLabels[classification]}. Let me explain...`;
      }
    }

    setCoachMessage(updatedMessage);
    setCoachClassification(classification);
    coachMessageTimeRef.current = Date.now();

    // Call LLM coach with full classification + eval info
    setCoachLoading(true);
    const recentSans = moves
      .slice(Math.max(0, lastPlayerMoveIdx - 5), lastPlayerMoveIdx + 1)
      .map((m) => m.san);

    // Delay LLM call for critical feedback so the player has time to read it
    const llmDelay = isCritical ? 3500 : 1000;

    const timer = setTimeout(() => {
      fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fen: afterFen,
          moveSan: move.san,
          movePiece: move.piece,
          moveCaptured: move.captured,
          classification,
          blunderDetail: null,
          bestMoveUci: before.bestMove || null,
          playerPlayedBest: classification === "best",
          evalBefore: before,
          evalAfter: after,
          moveNumber: Math.floor(lastPlayerMoveIdx / 2) + 1,
          turn: move.color === "w" ? "black" : "white",
          pgnMoves: recentSans,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          // Only overwrite if enough time has passed (player could have
          // started a new move)
          if (data.message && lastCoachedMoveIdxRef.current === lastPlayerMoveIdx) {
            setCoachMessage(data.message);
          }
        })
        .catch(() => {})
        .finally(() => setCoachLoading(false));
    }, llmDelay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classifications, evalCache, moves, positionFens, playerColorCode, coachEnabled, gameStarted, gameOver]);

  // ---- Player move handler ----
  const handleBoardMove = useCallback(
    ({ move, fen: newFen, isCheck, isCheckmate, isDraw }) => {
      const moveIdx = moves.length;

      setMoves((prev) => [
        ...prev,
        {
          from: move.from,
          to: move.to,
          san: move.san,
          color: move.color,
          piece: move.piece,
          captured: move.captured,
        },
      ]);
      setPositionFens((prev) => [...prev, newFen]);
      setFen(newFen);
      setLastMove({ from: move.from, to: move.to });
      setShowHint(false);

      // Check game over
      const game = new Chess();
      try {
        game.load(newFen);
      } catch {
        return;
      }
      updateStatus(game);

      // Coach feedback
      if (coachEnabled) {
        const prevFen = positionFens[positionFens.length - 1];
        const gameBefore = new Chess();
        try {
          gameBefore.load(prevFen);
        } catch {
          // ignore
        }

        // Look up engine eval of the position BEFORE the player's move
        const beforeEval = evalCache[prevFen];
        const playerPlayedBest = beforeEval?.bestMove
          ? isMoveBest(move.from, move.to, beforeEval.bestMove)
          : false;

        // Detect blunders heuristically
        const blunder = detectBlunder(game);

        // Classify: blunder (heuristic) > best (engine) > unknown
        let heuristicClassification = null;
        if (blunder) {
          heuristicClassification = "blunder";
        } else if (playerPlayedBest) {
          heuristicClassification = "best";
        }

        // Build immediate feedback
        let immediate;
        if (blunder) {
          immediate = coachMoveWithoutEval(move, game, gameBefore);
        } else if (beforeEval?.bestMove && !playerPlayedBest) {
          // Player didn't play the best move — suggest it in SAN
          const bestSan = uciToSan(beforeEval.bestMove, prevFen);
          if (bestSan) {
            immediate = `${move.san} is okay, but the engine suggests ${bestSan} was stronger. I'm getting you a deeper analysis...`;
          } else {
            immediate = `${move.san} is okay, but there was a stronger move available. I'm getting you a deeper analysis...`;
          }
        } else if (playerPlayedBest) {
          immediate = `Excellent! ${move.san} is the engine's top choice. I'm getting you a deeper analysis...`;
        } else {
          immediate = coachMoveWithoutEval(move, game, gameBefore);
        }

        setCoachMessage(immediate);
        setCoachClassification(heuristicClassification);
        setCoachLoading(false);
        // LLM coach call is handled by the post-bot-move effect, which has
        // accurate classification data (before + after eval comparison).
        // This prevents the critical feedback from being overwritten by a
        // generic LLM response before the player has time to read it.
      }
    },
    [coachEnabled, moves, positionFens, updateStatus]
  );

  // ---- Hint: analyze current position on demand ----
  const hintRequestedRef = useRef(null);

  useEffect(() => {
    if (!showHint || !isPlayerTurn || !stockfish.isReady) return;
    if (evalCache[fen]?.bestMove) return;
    if (hintRequestedRef.current === fen) return;
    hintRequestedRef.current = fen;

    stockfish.analyze(fen, { depth: 15 });
  }, [
    showHint,
    isPlayerTurn,
    fen,
    stockfish,
    evalCache,
  ]);

  // Hint arrow
  const hintArrow = useMemo(() => {
    if (!showHint || !isPlayerTurn) return [];
    const cached = evalCache[fen];
    if (!cached?.bestMove) return [];
    const arrow = uciToArrow(cached.bestMove, "rgb(34, 177, 76)");
    return arrow ? [arrow] : [];
  }, [showHint, isPlayerTurn, fen, evalCache]);

  // Current eval for display
  const currentEval = evalCache[fen] || {
    evalScore: stockfish.evalScore,
    evalType: stockfish.evalType,
    bestMove: stockfish.bestMove,
    pv: stockfish.pv,
    depth: stockfish.depth,
  };

  // ---- Game controls ----
  function startGame() {
    setFen(STARTING_FEN);
    setMoves([]);
    setPositionFens([STARTING_FEN]);
    setStatus(
      `${playerColor === "white" ? "White" : "Black"} to move`
    );
    setGameOver(false);
    setResult(null);
    setLastMove(null);
    setGameStarted(true);
    setEvalCache({});
    setClassifications({});
    setCoachMessage(
      `${playerColor === "white" ? "You're playing White" : "You're playing Black"}. Make your move!`
    );
    setCoachClassification(null);
    setAdaptiveNote("");
    setEffectiveElo(elo);
    lastAdaptedAtRef.current = 0;
    setBotRetry(0);
    lastCoachedMoveIdxRef.current = -1;
    coachAnalyzedRef.current = {};
    hintRequestedRef.current = null;
    botThinkingForRef.current = null;
  }

  function resign() {
    setGameOver(true);
    setResult("loss");
    setStatus(`You resigned — ${playerColor === "white" ? "Black" : "White"} (bot) wins`);
    setCoachMessage("No worries — every game is a learning opportunity. Want to play another?");
    botThinkingForRef.current = null;
  }

  function undoMove() {
    if (moves.length < 2 || gameOver) return;
    const undoCount = moves.length >= 2 ? 2 : 1;
    const newMoves = moves.slice(0, -undoCount);
    const newFens = positionFens.slice(0, -undoCount);

    setMoves(newMoves);
    setPositionFens(newFens);
    setFen(newFens[newFens.length - 1]);
    setLastMove(
      newMoves.length > 0
        ? {
            from: newMoves[newMoves.length - 1].from,
            to: newMoves[newMoves.length - 1].to,
          }
        : null
    );
    setStatus(
      `${playerColor === "white" ? "White" : "Black"} to move`
    );
    botThinkingForRef.current = null;
  }

  // Accuracy for display
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
    return (
      labels.reduce((sum, l) => sum + (scores[l] || 50), 0) / labels.length
    );
  }, [classifications]);

  return (
    <div>
      <h1>Play vs AI</h1>

      {/* Settings bar */}
      <div className="play-settings">
        <div className="setting-group">
          <span className="setting-label">Difficulty</span>
          <div className="elo-buttons">
            {ELO_PRESETS.map((p) => (
              <button
                key={p.elo}
                className={`elo-btn ${elo === p.elo ? "active" : ""}`}
                onClick={() => setElo(p.elo)}
                disabled={gameStarted && !gameOver}
                title={p.description}
              >
                {p.elo}
              </button>
            ))}
          </div>
          <span className="elo-label">
            {preset.label} — {preset.description}
          </span>
        </div>

        <div className="setting-group">
          <span className="setting-label">Play as</span>
          <div className="color-buttons">
            <button
              className={`color-btn ${playerColor === "white" ? "active" : ""}`}
              onClick={() => setPlayerColor("white")}
              disabled={gameStarted && !gameOver}
            >
              White
            </button>
            <button
              className={`color-btn ${playerColor === "black" ? "active" : ""}`}
              onClick={() => setPlayerColor("black")}
              disabled={gameStarted && !gameOver}
            >
              Black
            </button>
          </div>
        </div>

        <div className="setting-group">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={coachEnabled}
              onChange={(e) => setCoachEnabled(e.target.checked)}
            />
            <span>Coach</span>
          </label>
        </div>

        <div className="setting-group">
          {!gameStarted || gameOver ? (
            <button className="btn" onClick={startGame}>
              {gameOver ? "New Game" : "Start Game"}
            </button>
          ) : (
            <div className="play-controls-inline">
              <button
                className="btn secondary"
                onClick={() => setShowHint((s) => !s)}
                disabled={!isPlayerTurn}
              >
                {showHint ? "Hide Hint" : "Hint"}
              </button>
              <button
                className="btn secondary"
                onClick={undoMove}
                disabled={moves.length < 2 || stockfish.isThinking}
              >
                Undo
              </button>
              <button className="btn danger" onClick={resign}>
                Resign
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Adaptive note */}
      {adaptiveNote && (
        <div className="adaptive-note">{adaptiveNote}</div>
      )}

      {/* Engine loading */}
      {!stockfish.isReady && (
        <div className="placeholder">Loading Stockfish engine…</div>
      )}

      {/* Game over banner */}
      {gameOver && result && (
        <div className={`game-over-banner ${result}`}>
          {result === "win"
            ? "You won!"
            : result === "loss"
            ? "Bot wins"
            : "Draw"}
          <button className="btn" onClick={startGame} style={{ marginLeft: "1rem" }}>
            Rematch
          </button>
        </div>
      )}

      {/* FEN/PGN export after game over */}
      {gameOver && (
        <GameExportPanel fen={fen} moves={moves} playerColor={playerColor} />
      )}

      {/* Main layout */}
      {coachEnabled ? (
        <div className="board-layout-coach">
          <CoachPanel
            message={coachMessage}
            evalScore={currentEval.evalScore}
            evalType={currentEval.evalType}
            turn={turn}
            game={currentGame}
            bestMoveUci={currentEval.bestMove}
            classification={coachClassification}
            isAnalyzing={stockfish.isThinking}
            isThinking={coachLoading}
          />
          <div className="board-layout">
            <div className="play-board-area">
              <ChessBoard
                fen={fen}
                orientation={orientation}
                interactive={isPlayerTurn}
                arrows={hintArrow}
                lastMove={lastMove}
                onMove={handleBoardMove}
              />
              {stockfish.isThinking && isBotTurn && (
                <div className="bot-thinking">
                  <span className="bot-thinking-dot" />
                  <span className="bot-thinking-dot" />
                  <span className="bot-thinking-dot" />
                  Bot is thinking…
                </div>
              )}
            </div>
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
              {gameStarted && (
                <div className="play-info">
                  <div className="play-info-row">
                    <span className="label">Bot ELO</span>
                    <span className="value">{effectiveElo}</span>
                  </div>
                  {accuracy !== null && (
                    <div className="play-info-row">
                      <span className="label">Your accuracy</span>
                      <span className="value">{accuracy.toFixed(0)}%</span>
                    </div>
                  )}
                  {currentEval.evalScore !== null && (
                    <div className="play-info-row">
                      <span className="label">Engine eval</span>
                      <span className="value">
                        {currentEval.evalType === "mate"
                          ? `M${Math.abs(currentEval.evalScore)}`
                          : (currentEval.evalScore / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}
              <p className="move-side-title">Moves</p>
              <MoveList
                moves={moves}
                currentIndex={moves.length - 1}
                classifications={classifications}
              />
            </aside>
          </div>
        </div>
      ) : (
        <div className="board-layout">
          <div className="play-board-area">
            <ChessBoard
              fen={fen}
              orientation={orientation}
              interactive={isPlayerTurn}
              arrows={hintArrow}
              lastMove={lastMove}
              onMove={handleBoardMove}
            />
            {stockfish.isThinking && isBotTurn && (
              <div className="bot-thinking">
                <span className="bot-thinking-dot" />
                <span className="bot-thinking-dot" />
                <span className="bot-thinking-dot" />
                Bot is thinking…
              </div>
            )}
          </div>
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
            {gameStarted && (
              <div className="play-info">
                <div className="play-info-row">
                  <span className="label">Bot ELO</span>
                  <span className="value">{effectiveElo}</span>
                </div>
                {accuracy !== null && (
                  <div className="play-info-row">
                    <span className="label">Your accuracy</span>
                    <span className="value">{accuracy.toFixed(0)}%</span>
                  </div>
                )}
                {currentEval.evalScore !== null && (
                  <div className="play-info-row">
                    <span className="label">Engine eval</span>
                    <span className="value">
                      {currentEval.evalType === "mate"
                        ? `M${Math.abs(currentEval.evalScore)}`
                        : (currentEval.evalScore / 100).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}
            <p className="move-side-title">Moves</p>
            <MoveList
              moves={moves}
              currentIndex={moves.length - 1}
              classifications={classifications}
            />
          </aside>
        </div>
      )}
    </div>
  );
}

function GameExportPanel({ fen, moves, playerColor }) {
  const [copied, setCopied] = useState("");

  const pgn = useMemo(() => {
    const game = new Chess();
    const sans = [];
    for (const m of moves) {
      try {
        game.move(m.san);
        sans.push(m.san);
      } catch {
        break;
      }
    }

    const date = new Date();
    const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;

    const white = playerColor === "white" ? "You" : "Chess-Surgeon Bot";
    const black = playerColor === "white" ? "Chess-Surgeon Bot" : "You";
    const result = game.isCheckmate()
      ? game.turn() === "w" ? "0-1" : "1-0"
      : game.isDraw() ? "1/2-1/2" : "*";

    let pgnText = `[Event "Chess-Surgeon Play"]\n[Date "${dateStr}"]\n[White "${white}"]\n[Black "${black}"]\n[Result "${result}"]\n\n`;

    for (let i = 0; i < sans.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const whiteMove = sans[i] || "";
      const blackMove = sans[i + 1] || "";
      pgnText += `${moveNum}. ${whiteMove}`;
      if (blackMove) pgnText += ` ${blackMove}`;
      pgnText += " ";
    }

    pgnText += result;
    return pgnText;
  }, [moves, playerColor]);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(""), 2000);
    });
  };

  return (
    <div className="game-export-panel">
      <h3>Game Export</h3>

      <div className="export-section">
        <div className="export-header">
          <span className="export-label">FEN (current position)</span>
          <button
            className="btn secondary export-copy-btn"
            onClick={() => copyToClipboard(fen, "fen")}
          >
            {copied === "fen" ? "Copied!" : "Copy"}
          </button>
        </div>
        <code className="export-code">{fen}</code>
      </div>

      <div className="export-section">
        <div className="export-header">
          <span className="export-label">PGN (full game)</span>
          <button
            className="btn secondary export-copy-btn"
            onClick={() => copyToClipboard(pgn, "pgn")}
          >
            {copied === "pgn" ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre className="export-pgn">{pgn}</pre>
      </div>

      <p className="export-hint">
        Paste the PGN into the Analyze page to review every move with the engine.
      </p>
    </div>
  );
}
