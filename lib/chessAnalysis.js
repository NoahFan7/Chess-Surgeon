/**
 * Move classification logic — compares user's move with Stockfish evaluation.
 * Labels mirror chess.com: Best, Great, Good, Inaccuracy, Mistake, Blunder.
 */

import { Chess } from "chess.js";

export const CLASSIFICATION_META = {
  best: { label: "Best", color: "#22b14c", symbol: "!" },
  great: { label: "Great", color: "#4a90e2", symbol: "!" },
  good: { label: "Good", color: "#7bc043", symbol: "" },
  inaccuracy: { label: "Inaccuracy", color: "#e6c020", symbol: "?!" },
  mistake: { label: "Mistake", color: "#e8852a", symbol: "?" },
  blunder: { label: "Blunder", color: "#e23838", symbol: "??" },
};

/**
 * Convert eval to a centipawn-equivalent number from side-to-move's perspective.
 * Mate scores are mapped to large numbers.
 */
function evalToCp(evalScore, evalType) {
  if (evalScore === null || evalType === null) return 0;
  if (evalType === "mate") {
    return evalScore > 0 ? 100000 - evalScore : -100000 - evalScore;
  }
  return evalScore;
}

/**
 * Classify a move based on eval before and after.
 *
 * evalBefore: { evalScore, evalType } for position BEFORE the move (mover's perspective)
 * evalAfter: { evalScore, evalType } for position AFTER the move (opponent's perspective)
 * isBestMove: true if the played move matches Stockfish's top choice
 *
 * Returns a classification key: "best" | "great" | "good" | "inaccuracy" | "mistake" | "blunder"
 */
export function classifyMove(evalBefore, evalAfter, isBestMove) {
  if (isBestMove) return "best";

  if (
    !evalBefore ||
    !evalAfter ||
    evalBefore.evalScore === null ||
    evalAfter.evalScore === null
  ) {
    return null;
  }

  const before = evalToCp(evalBefore.evalScore, evalBefore.evalType);
  const after = evalToCp(evalAfter.evalScore, evalAfter.evalType);

  // loss = before + after (because after is from opponent's perspective)
  const loss = before + after;

  if (loss <= 10) return "best";
  if (loss <= 30) return "great";
  if (loss <= 60) return "good";
  if (loss <= 120) return "inaccuracy";
  if (loss <= 250) return "mistake";
  return "blunder";
}

/**
 * Check if a played move matches the engine's best move (UCI format).
 */
export function isMoveBest(playedFrom, playedTo, bestMoveUci) {
  if (!bestMoveUci || bestMoveUci.length < 4) return false;
  return (
    bestMoveUci.slice(0, 2) === playedFrom &&
    bestMoveUci.slice(2, 4) === playedTo
  );
}

/**
 * Convert UCI move string to arrow tuple for react-chessboard.
 * e.g. "e2e4" -> ["e2", "e4", "rgb(74,144,226)"]
 */
export function uciToArrow(uci, color = "rgb(74, 144, 226)") {
  if (!uci || uci.length < 4) return null;
  return [uci.slice(0, 2), uci.slice(2, 4), color];
}

/**
 * Convert UCI move string to human-readable SAN notation.
 * e.g. "b1f3" -> "Nf3", "e7e8q" -> "e8=Q"
 * Returns null if the move is illegal in the given position.
 */
export function uciToSan(uci, fen) {
  if (!uci || uci.length < 4 || !fen) return null;
  try {
    const game = new Chess();
    game.load(fen);
    const move = game.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? uci[4] : "q",
    });
    return move ? move.san : null;
  } catch {
    return null;
  }
}
