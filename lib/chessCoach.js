/**
 * Chess coach logic — generates beginner-friendly explanations
 * for moves and positions based on engine analysis + position features.
 */

import { Chess } from "chess.js";

const CLASSIFICATION_MESSAGES = {
  best: [
    "Excellent move! That's exactly what I would have played.",
    "Perfect! The engine agrees this is the best move.",
    "Brilliant choice — you found the optimal move!",
    "Spot on! This move maintains the best possible position for you.",
  ],
  great: [
    "Great move! Very close to the best choice.",
    "Strong move! You're playing well here.",
    "Nice! That's nearly the best move available.",
    "Good find — that keeps your advantage solid.",
  ],
  good: [
    "Decent move, but there was something slightly better.",
    "Not bad! A reasonable choice, though not optimal.",
    "Acceptable move. Consider looking for stronger alternatives.",
    "That works, but the engine found a slightly better option.",
  ],
  inaccuracy: [
    "Hmm, that move is a slight inaccuracy. Let me explain why...",
    "That's not quite right — you're giving up a small advantage here.",
    "Careful! There was a better move that keeps more of your edge.",
    "This move loses a bit of your advantage. Here's what to look for instead...",
  ],
  mistake: [
    "That's a mistake. You're losing significant ground here.",
    "Ouch — that move costs you. Let me show you what went wrong.",
    "I wouldn't recommend that. You're giving your opponent an opportunity.",
    "That move drops the eval noticeably. Here's what you should consider...",
  ],
  blunder: [
    "That's a blunder! This move seriously weakens your position.",
    "Oh no — that's a big mistake. You're throwing away the game here.",
    "Be careful! That move loses material or allows a tactic.",
    "That's a critical error. Let me explain what you missed...",
  ],
};

export const PIECE_NAMES = {
  p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king",
  P: "pawn", N: "knight", B: "bishop", R: "rook", Q: "queen", K: "king",
};

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Analyze position features from a FEN and game state.
 */
export function analyzePosition(fen, game) {
  if (!game) return null;

  const board = game.board();
  let whiteMaterial = 0;
  let blackMaterial = 0;
  let whitePieces = 0;
  let blackPieces = 0;
  let centerWhite = 0;
  let centerBlack = 0;
  let whiteDeveloped = 0;
  let blackDeveloped = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const value = PIECE_VALUES[piece.type] || 0;
      if (piece.color === "w") {
        whiteMaterial += value;
        whitePieces++;
        if (r >= 3 && r <= 4 && c >= 2 && c <= 5) centerWhite++;
        if (piece.type !== "p" && piece.type !== "k" && r < 6) whiteDeveloped++;
      } else {
        blackMaterial += value;
        blackPieces++;
        if (r >= 3 && r <= 4 && c >= 2 && c <= 5) centerBlack++;
        if (piece.type !== "p" && piece.type !== "k" && r > 1) blackDeveloped++;
      }
    }
  }

  const materialDiff = whiteMaterial - blackMaterial;
  const inCheck = game.inCheck();
  const isCheckmate = game.isCheckmate();
  const isStalemate = game.isStalemate();
  const turn = game.turn();

  return {
    materialDiff,
    whiteMaterial,
    blackMaterial,
    centerWhite,
    centerBlack,
    whiteDeveloped,
    blackDeveloped,
    inCheck,
    isCheckmate,
    isStalemate,
    turn,
    moveCount: game.history().length,
  };
}

/**
 * Generate a coaching message for a specific move.
 */
export function coachMove(move, classification, evalBefore, evalAfter, bestMoveUci, game) {
  const messages = [];

  // Base message from classification
  const classMsgs = CLASSIFICATION_MESSAGES[classification];
  if (classMsgs) {
    messages.push(pickRandom(classMsgs));
  }

  // Check if a capture happened
  if (move.captured) {
    const capturedName = PIECE_NAMES[move.captured] || move.captured;
    const capturedValue = PIECE_VALUES[move.captured] || 0;
    if (capturedValue >= 3) {
      messages.push(`You captured a ${capturedName} worth ${capturedValue} points — that's great material gain!`);
    } else if (capturedValue > 0) {
      messages.push(`You took their ${capturedName}.`);
    }
  }

  // Check if it's a check
  if (move.san && move.san.includes("+")) {
    messages.push("And you put them in check — forcing them to respond to your threat!");
  }

  // Checkmate
  if (move.san && move.san.includes("#")) {
    messages.push("Checkmate! Great job finishing the game!");
  }

  // If it was a blunder/mistake, explain what the best move was
  if ((classification === "blunder" || classification === "mistake" || classification === "inaccuracy") && bestMoveUci) {
    const bestFrom = bestMoveUci.slice(0, 2);
    const bestTo = bestMoveUci.slice(2, 4);
    messages.push(`Instead, the best move was ${bestFrom} to ${bestTo}. That keeps your position stronger.`);
  }

  // Position-based coaching
  const posAnalysis = analyzePosition(null, game);
  if (posAnalysis) {
    if (posAnalysis.isCheckmate) {
      messages.push("The game is over — checkmate!");
    } else if (posAnalysis.inCheck) {
      messages.push(`${posAnalysis.turn === "w" ? "White" : "Black"} is in check — they must respond to the threat!`);
    }
  }

  return messages.join(" ");
}

/**
 * Detect if the player just hung a piece or left material undefended.
 * Checks all opponent captures — if any capture is "free" (player
 * can't recapture), it's a blunder.
 *
 * Returns { type, piece, square, capturedBy, detail } or null.
 */
export function detectBlunder(game) {
  if (!game || game.isGameOver()) return null;

  const opponentMoves = game.moves({ verbose: true });
  const captures = opponentMoves.filter((m) => m.captured);

  if (captures.length === 0) return null;

  let worst = null;

  for (const cap of captures) {
    const capturedValue = PIECE_VALUES[cap.captured] || 0;
    const capturingValue = PIECE_VALUES[cap.piece] || 0;

    // Simulate the capture and check if the player can recapture
    const testGame = new Chess();
    try {
      testGame.load(game.fen());
      testGame.move({ from: cap.from, to: cap.to, promotion: "q" });
    } catch {
      continue;
    }

    const recaptures = testGame
      .moves({ verbose: true })
      .filter((m) => m.to === cap.to && m.captured);

    const canRecapture = recaptures.length > 0;

    // Free capture — piece is completely hanging
    if (!canRecapture && capturedValue > 0) {
      if (!worst || capturedValue > worst.capturedValue) {
        const pieceName = PIECE_NAMES[cap.captured] || cap.captured;
        const capName = PIECE_NAMES[cap.piece] || cap.piece;
        worst = {
          type: "hanging",
          piece: cap.captured,
          square: cap.to,
          capturedBy: cap.piece,
          capturedValue,
          detail:
            capturedValue >= 5
              ? `Your ${pieceName} on ${cap.to} is hanging — they can grab it for free with their ${capName}! That's a major piece you're losing.`
              : `Your ${pieceName} on ${cap.to} is undefended — they can take it for free with their ${capName}!`,
        };
      }
    }
    // Unfavorable trade — opponent captures a higher-value piece with a lower-value one
    else if (canRecapture && capturingValue < capturedValue && capturedValue - capturingValue >= 2) {
      if (!worst || capturedValue - capturingValue > (worst.capturedValue - (PIECE_VALUES[worst.capturedBy] || 0))) {
        const pieceName = PIECE_NAMES[cap.captured] || cap.captured;
        const capName = PIECE_NAMES[cap.piece] || cap.piece;
        worst = {
          type: "unfavorable_trade",
          piece: cap.captured,
          square: cap.to,
          capturedBy: cap.piece,
          capturedValue,
          detail: `Your ${pieceName} on ${cap.to} can be captured by their ${capName}. Even though you can recapture, you'd be trading a more valuable piece for a weaker one — that's losing material.`,
        };
      }
    }
  }

  return worst;
}

/**
 * Generate a coaching message for a move WITHOUT engine evaluation.
 * Uses position features, move characteristics, and basic heuristics.
 * This gives immediate feedback when navigating through games.
 */
export function coachMoveWithoutEval(move, game, gameBeforeMove) {
  const messages = [];

  if (!move) return "";

  const moverColor = move.color === "w" ? "White" : "Black";
  const pieceName = PIECE_NAMES[move.piece] || move.piece;

  // ---- Blunder detection (highest priority) ----
  const blunder = detectBlunder(game);
  if (blunder) {
    messages.push(`Uh oh! ${blunder.detail}`);
    messages.push(
      "Always check if your opponent can capture your pieces after every move. A good habit: before you move, ask yourself 'can they take anything for free after this?'"
    );
    return messages.join(" ");
  }

  // Check if it's a check
  if (move.san && move.san.includes("+")) {
    messages.push(`${move.san} gives check — the opponent must respond!`);
    return messages.join(" ");
  }

  // Checkmate
  if (move.san && move.san.includes("#")) {
    messages.push(`${move.san} — checkmate! The game is over!`);
    return messages.join(" ");
  }

  // Castling
  if (move.san && move.san.includes("O-O")) {
    if (move.san.includes("O-O-O")) {
      messages.push(`${moverColor} castles queenside — secures the king and brings the rook into play.`);
    } else {
      messages.push(`${moverColor} castles kingside — a solid move for king safety.`);
    }
    return messages.join(" ");
  }

  // Promotion
  if (move.promotion) {
    const promoName = PIECE_NAMES[move.promotion] || move.promotion;
    messages.push(`${moverColor} promotes to a ${promoName} with ${move.san}! Huge material upgrade.`);
    return messages.join(" ");
  }

  // Compare material before and after to detect sacrifices/wins
  const beforeAnalysis = analyzePosition(null, gameBeforeMove);
  const afterAnalysis = analyzePosition(null, game);

  if (beforeAnalysis && afterAnalysis) {
    const moverIsWhite = move.color === "w";
    const beforeDiff = beforeAnalysis.materialDiff;
    const afterDiff = afterAnalysis.materialDiff;
    const materialChange = moverIsWhite
      ? afterDiff - beforeDiff
      : beforeDiff - afterDiff;

    // Detect a sacrifice
    if (materialChange <= -3 && !move.captured) {
      messages.push(`${moverColor} sacrifices material with ${move.san}! This could be a tactical combination or a positional sacrifice.`);
      return messages.join(" ");
    }
  }

  // Game phase context
  if (afterAnalysis) {
    if (afterAnalysis.moveCount < 10) {
      // Opening — comment on piece development
      if (["n", "b", "N", "B"].includes(move.piece)) {
        messages.push(`${move.san} develops a ${pieceName} — good opening principle.`);
      } else if (["p", "P"].includes(move.piece)) {
        messages.push(`${move.san} — a pawn move in the opening.`);
      }
    } else if (afterAnalysis.moveCount > 30 && (afterAnalysis.whiteMaterial + afterAnalysis.blackMaterial) < 15) {
      messages.push(`Endgame — ${moverColor} should focus on activating the king and pushing passed pawns.`);
    }

    // Material situation
    if (afterAnalysis.materialDiff >= 5) {
      messages.push(`White is up a lot of material — White is winning.`);
    } else if (afterAnalysis.materialDiff <= -5) {
      messages.push(`Black is up a lot of material — Black is winning.`);
    }
  }

  if (messages.length === 0) {
    messages.push(`${moverColor} plays ${move.san}.`);
  }

  return messages.join(" ");
}

/**
 * Generate a position assessment summary.
 */
export function coachPosition(evalScore, evalType, turn, game) {
  const messages = [];

  if (evalType === "mate") {
    if (evalScore > 0) {
      messages.push(`White has a forced mate in ${Math.abs(evalScore)}!`);
    } else {
      messages.push(`Black has a forced mate in ${Math.abs(evalScore)}!`);
    }
    return messages.join(" ");
  }

  if (evalScore === null) {
    return "Analyzing the position...";
  }

  // Convert to perspective of side to move
  let evalPawns = evalScore / 100;
  if (turn === "b") evalPawns = -evalPawns;

  if (evalPawns > 5) {
    messages.push(`${turn === "w" ? "White" : "Black"} is completely winning.`);
  } else if (evalPawns > 2) {
    messages.push(`${turn === "w" ? "White" : "Black"} has a clear advantage.`);
  } else if (evalPawns > 0.5) {
    messages.push(`${turn === "w" ? "White" : "Black"} is slightly better.`);
  } else if (evalPawns > -0.5) {
    messages.push("The position is roughly equal.");
  } else if (evalPawns > -2) {
    messages.push(`${turn === "w" ? "White" : "Black"} is slightly worse.`);
  } else if (evalPawns > -5) {
    messages.push(`${turn === "w" ? "White" : "Black"} is at a clear disadvantage.`);
  } else {
    messages.push(`${turn === "w" ? "White" : "Black"} is in serious trouble.`);
  }

  const analysis = analyzePosition(null, game);
  if (analysis) {
    if (analysis.inCheck) {
      messages.push(`${analysis.turn === "w" ? "White" : "Black"} is in check.`);
    }
  }

  return messages.join(" ");
}

/**
 * Get a list of threats and candidate moves for the current position.
 */
export function getPositionInsights(game, bestMoveUci) {
  const insights = [];

  if (!game) return insights;

  // Check threats
  if (game.inCheck()) {
    insights.push({
      type: "threat",
      icon: "!",
      label: "King in check",
      detail: `${game.turn() === "w" ? "White" : "Black"} must respond to the check immediately.`,
    });
  }

  // Get legal moves and look for captures
  const moves = game.moves({ verbose: true });
  const captures = moves.filter((m) => m.captured);

  if (captures.length > 0) {
    const bestCapture = captures.reduce((best, m) =>
      (PIECE_VALUES[m.captured] || 0) > (PIECE_VALUES[best.captured] || 0) ? m : best
    );
    insights.push({
      type: "capture",
      icon: "x",
      label: `${captures.length} capture${captures.length > 1 ? "s" : ""} available`,
      detail: `You can capture a ${PIECE_NAMES[bestCapture.captured]} on ${bestCapture.to}.`,
    });
  }

  // Checks available
  const checks = moves.filter((m) => m.san && m.san.includes("+"));
  if (checks.length > 0) {
    insights.push({
      type: "check",
      icon: "+",
      label: `${checks.length} checking move${checks.length > 1 ? "s" : ""} available`,
      detail: `You can give check with ${checks.map((m) => m.san.replace("+", "")).slice(0, 3).join(", ")}.`,
    });
  }

  // Best move
  if (bestMoveUci) {
    insights.push({
      type: "best",
      icon: "*",
      label: "Engine's top choice",
      detail: `Best move: ${bestMoveUci.slice(0, 2)} to ${bestMoveUci.slice(2, 4)}`,
    });
  }

  // Game phase
  const moveCount = game.history().length;
  if (moveCount < 12) {
    insights.push({
      type: "phase",
      icon: "i",
      label: "Opening phase",
      detail: "Focus on development, center control, and king safety.",
    });
  } else if (moveCount < 30) {
    insights.push({
      type: "phase",
      icon: "i",
      label: "Middlegame",
      detail: "Look for tactics, improve your pieces, and create threats.",
    });
  } else {
    insights.push({
      type: "phase",
      icon: "i",
      label: "Endgame",
      detail: "Activate your king, push passed pawns, and simplify when ahead.",
    });
  }

  return insights;
}

// ===========================================================================
// Engine-grounded coach feedback (chess.com style)
// Generates specific, accurate feedback from engine eval data + board analysis.
// No LLM call — instant and deterministic. Set once, never overwritten.
// ===========================================================================

const BEST_OPENERS = [
  "Excellent move!",
  "Brilliant — you found the best move!",
  "Spot on! The engine agrees with you.",
  "Perfect choice!",
  "That's the move I would have played!",
];

const GREAT_OPENERS = [
  "Great move!",
  "Strong play — that's nearly perfect.",
  "Nice find! Very close to the engine's top choice.",
  "Excellent — just about the best move available.",
];

const GOOD_OPENERS = [
  "That's a decent move, though not the strongest.",
  "Reasonable choice, but there was something better.",
  "Not bad, but the engine found a slightly better option.",
  "That works, though it's not the most precise.",
];

const CRITICAL_OPENERS = {
  inaccuracy: [
    "Careful — that's a slight inaccuracy.",
    "Hmm, not quite the best choice there.",
    "That loses a bit of your edge.",
    "There was something better here.",
  ],
  mistake: [
    "That's a mistake — you're losing ground here.",
    "Ouch, that costs you.",
    "That move weakens your position.",
    "I wouldn't recommend that — it gives your opponent an opportunity.",
  ],
  blunder: [
    "Uh oh! That's a blunder.",
    "Oh no — that's a serious mistake!",
    "Careful! That move loses material.",
    "That's a critical error.",
  ],
};

const CENTER_SQUARES = ["d4", "e4", "d5", "e5"];
const EXTENDED_CENTER = [
  "c3", "c4", "d3", "e3", "f3", "f4",
  "c5", "c6", "d6", "e6", "f5", "f6",
];

/**
 * Describe what a move accomplishes (development, center control, capture, etc.)
 * Returns an array of verb phrases suitable for joining.
 */
function describeMoveAchievements(move, moveNumber) {
  const achievements = [];
  if (!move) return achievements;

  const pieceName = PIECE_NAMES[move.piece] || move.piece || "piece";

  if (move.san && move.san.includes("O-O-O")) {
    achievements.push("castles queenside for king safety");
  } else if (move.san && move.san.includes("O-O")) {
    achievements.push("castles kingside for king safety");
  }

  if (move.captured) {
    const capturedName = PIECE_NAMES[move.captured] || move.captured;
    const capturedValue = PIECE_VALUES[move.captured] || 0;
    if (capturedValue >= 5) {
      achievements.push(`wins a ${capturedName}`);
    } else {
      achievements.push(`captures a ${capturedName}`);
    }
  }

  if (move.san && move.san.includes("+") && !move.san.includes("#")) {
    achievements.push("gives check");
  }

  if (
    moveNumber < 14 &&
    move.piece &&
    ["n", "b"].includes(move.piece.toLowerCase()) &&
    !(move.san && move.san.includes("O-O"))
  ) {
    const fromRank = parseInt(move.from[1], 10);
    const isBackRank = move.color === "w" ? fromRank === 1 : fromRank === 8;
    if (isBackRank) {
      achievements.push(`develops the ${pieceName}`);
    }
  }

  if (CENTER_SQUARES.includes(move.to)) {
    achievements.push("seizes the center");
  } else if (EXTENDED_CENTER.includes(move.to)) {
    achievements.push("influences the center");
  }

  if (move.promotion) {
    achievements.push(
      `promotes to a ${PIECE_NAMES[move.promotion] || move.promotion}`
    );
  }

  return achievements;
}

function joinAchievements(achievements) {
  if (achievements.length === 0) return "";
  if (achievements.length === 1) return achievements[0];
  if (achievements.length === 2)
    return `${achievements[0]} and ${achievements[1]}`;
  return (
    achievements.slice(0, -1).join(", ") +
    ", and " +
    achievements[achievements.length - 1]
  );
}

/**
 * Describe how much the eval shifted (from the mover's perspective).
 * Returns a plain-English description or null if not significant.
 */
function describeEvalShift(evalBefore, evalAfter) {
  if (!evalBefore || !evalAfter) return null;
  if (evalBefore.evalScore === null || evalAfter.evalScore === null)
    return null;

  const before =
    evalBefore.evalType === "mate"
      ? evalBefore.evalScore > 0
        ? 10000
        : -10000
      : evalBefore.evalScore || 0;
  const after =
    evalAfter.evalType === "mate"
      ? evalAfter.evalScore > 0
        ? 10000
        : -10000
      : evalAfter.evalScore || 0;

  const loss = before + after; // after is from opponent's perspective

  if (loss > 500)
    return "This move throws away the game — you're now in a losing position.";
  if (loss > 250) return "This move significantly worsens your position.";
  if (loss > 120) return "You're giving up a meaningful advantage here.";
  if (loss > 60) return "This move loses a bit of your edge.";
  return null;
}

function getForwardTip(game, moveNumber) {
  if (!game || game.isGameOver()) return "Great game!";

  const moveCount = game.history().length;

  if (moveCount < 12) {
    return pickRandom([
      "Keep developing your pieces and fighting for the center.",
      "Continue building your position and preparing to castle.",
      "Look for opportunities to develop your remaining pieces.",
    ]);
  }
  if (moveCount < 30) {
    return pickRandom([
      "Look for tactics like forks, pins, and skewers.",
      "Watch for threats from your opponent and look for counterplay.",
      "Try to find pieces that can work together to create threats.",
      "Look for weaknesses in your opponent's position to exploit.",
    ]);
  }
  return pickRandom([
    "Focus on activating your king and pushing passed pawns.",
    "Simplify when you're ahead in material.",
    "Look for ways to promote your pawns.",
    "Use your king actively in the endgame.",
  ]);
}

function getRecoveryTip(classification) {
  if (classification === "blunder") {
    return pickRandom([
      "Don't panic — focus on defending and look for counterplay.",
      "Stay calm and try to find ways to complicate the position.",
      "Every piece still matters — look for chances to fight back.",
    ]);
  }
  if (classification === "mistake") {
    return pickRandom([
      "Try to solidify your position and wait for your opponent to slip up.",
      "Focus on defending your weaknesses and look for counterplay.",
      "Don't rush — take your time and find a plan to recover.",
    ]);
  }
  return pickRandom([
    "Look for your next chance to improve the position.",
    "Keep playing carefully and watch for better moves.",
    "Stay focused — small improvements add up.",
  ]);
}

/**
 * Detect if the moved piece creates a fork (attacks 2+ opponent pieces).
 */
function detectFork(game, moveSquare) {
  if (!game) return null;
  try {
    const allMoves = game.moves({ verbose: true });
    const captures = allMoves.filter(
      (m) => m.from === moveSquare && m.captured
    );
    if (captures.length >= 2) {
      const pieces = [
        ...new Set(
          captures.map((c) => PIECE_NAMES[c.captured] || c.captured)
        ),
      ];
      return { pieces };
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Generate rich, specific, engine-grounded coaching feedback.
 *
 * This replaces the LLM coach call entirely — it's instant, accurate, and
 * grounded in the actual board position and engine evaluation data.
 * The message is meant to be set once and never overwritten.
 *
 * @param {Object} params
 * @param {Object} params.move - The player's move ({ from, to, san, piece, captured, color, promotion })
 * @param {string} params.classification - "best" | "great" | "good" | "inaccuracy" | "mistake" | "blunder"
 * @param {Object} params.evalBefore - Engine eval before the move ({ evalScore, evalType, bestMove })
 * @param {Object} params.evalAfter - Engine eval after the move ({ evalScore, evalType })
 * @param {string} params.bestMoveUci - Engine's best move in UCI format (e.g. "e2e4")
 * @param {Chess} params.game - chess.js instance AFTER the player's move
 * @param {Chess} params.gameBefore - chess.js instance BEFORE the player's move
 * @param {string} params.opening - Opening name (optional)
 * @param {number} params.moveNumber - Move number (1-based)
 * @returns {string} The coaching message
 */
export function generateEngineCoachFeedback({
  move,
  classification,
  evalBefore,
  evalAfter,
  bestMoveUci,
  game,
  gameBefore,
  opening,
  moveNumber,
}) {
  if (!move || !game) return "";

  // Checkmate is always positive
  if (move.san && move.san.includes("#")) {
    return "Checkmate! You finished the game beautifully! Well played!";
  }

  const parts = [];
  const isCritical = ["blunder", "mistake", "inaccuracy"].includes(
    classification
  );

  // Simulate the best move to describe what it would have done
  let bestMoveSan = null;
  let bestAchievements = [];
  if (bestMoveUci && gameBefore) {
    try {
      const testGame = new Chess();
      testGame.load(gameBefore.fen());
      const bestMove = testGame.move({
        from: bestMoveUci.slice(0, 2),
        to: bestMoveUci.slice(2, 4),
        promotion: bestMoveUci.length > 4 ? bestMoveUci[4] : "q",
      });
      if (bestMove) {
        bestMoveSan = bestMove.san;
        bestAchievements = describeMoveAchievements(bestMove, moveNumber);
      }
    } catch {
      // ignore
    }
  }

  // What the player's move accomplished
  const achievements = describeMoveAchievements(move, moveNumber);

  // Detect hanging pieces (for critical moves)
  const blunder = isCritical ? detectBlunder(game) : null;

  // Detect forks (for positive feedback)
  const fork = !isCritical ? detectFork(game, move.to) : null;

  // ---- Build feedback by classification ----

  if (classification === "best") {
    parts.push(pickRandom(BEST_OPENERS));
    if (achievements.length > 0) {
      parts.push(`${move.san} ${joinAchievements(achievements)}.`);
    }
    if (fork) {
      parts.push(
        `This also creates a fork — your piece attacks their ${fork.pieces.join(" and ")} at the same time!`
      );
    }
    parts.push(getForwardTip(game, moveNumber));

  } else if (classification === "great") {
    parts.push(pickRandom(GREAT_OPENERS));
    if (achievements.length > 0) {
      parts.push(`${move.san} ${joinAchievements(achievements)}.`);
    }
    if (fork) {
      parts.push(
        `This creates a nice fork — your piece attacks their ${fork.pieces.join(" and ")} simultaneously.`
      );
    }

  } else if (classification === "good") {
    parts.push(pickRandom(GOOD_OPENERS));
    if (bestMoveSan) {
      if (bestAchievements.length > 0) {
        parts.push(
          `The engine suggests ${bestMoveSan}, which ${joinAchievements(bestAchievements)}.`
        );
      } else {
        parts.push(`The engine suggests ${bestMoveSan} instead.`);
      }
    }

  } else if (isCritical) {
    parts.push(pickRandom(CRITICAL_OPENERS[classification]));

    // Specific detail about what went wrong
    if (blunder) {
      parts.push(blunder.detail);
    } else {
      const evalShift = describeEvalShift(evalBefore, evalAfter);
      if (evalShift) parts.push(evalShift);
    }

    // What the best move was and why
    if (bestMoveSan) {
      if (bestAchievements.length > 0) {
        parts.push(
          `Instead, ${bestMoveSan} would have ${joinAchievements(bestAchievements)}.`
        );
      } else {
        parts.push(`Instead, ${bestMoveSan} was the stronger move.`);
      }
    }

    parts.push(getRecoveryTip(classification));
  }

  // Opening context (only for non-critical moves)
  if (opening && moveNumber < 12 && !isCritical) {
    parts.push(
      `In the ${opening}, focus on controlling the center, developing your pieces, and keeping your king safe.`
    );
  }

  return parts.join(" ");
}

// ===========================================================================
// Instant coach feedback — deep board analysis with no engine eval required.
// Runs synchronously the moment the player moves. Analyzes material,
// development, center control, king safety, threats, and tactical patterns
// to produce specific, strategic feedback.
// ===========================================================================

const PHASE_THRESHOLDS = { OPENING: 10, MIDDLEGAME: 30 };

function getGamePhase(moveCount) {
  if (moveCount < PHASE_THRESHOLDS.OPENING) return "opening";
  if (moveCount < PHASE_THRESHOLDS.MIDDLEGAME) return "middlegame";
  return "endgame";
}

function describeMaterial(position, playerColor) {
  const diff = position.materialDiff;
  const playerDiff = playerColor === "w" ? diff : -diff;

  if (playerDiff >= 5)
    return "you're up significant material and should be winning";
  if (playerDiff >= 2)
    return "you're ahead in material";
  if (playerDiff > 0)
    return "you have a small material edge";
  if (playerDiff === 0)
    return "material is equal";
  if (playerDiff >= -2)
    return "you're slightly behind in material";
  if (playerDiff >= -5)
    return "you're down material and need to be careful";
  return "you're down significant material — defend stubbornly";
}

function describeDevelopment(position, playerColor) {
  const playerDeveloped =
    playerColor === "w" ? position.whiteDeveloped : position.blackDeveloped;
  const opponentDeveloped =
    playerColor === "w" ? position.blackDeveloped : position.whiteDeveloped;

  if (playerDeveloped < opponentDeveloped - 1)
    return "you're behind in development — your opponent has more pieces in play";
  if (playerDeveloped > opponentDeveloped + 1)
    return "you're ahead in development — your pieces are more active";
  return null;
}

function describeCenter(position, playerColor) {
  const playerCenter =
    playerColor === "w" ? position.centerWhite : position.centerBlack;
  const opponentCenter =
    playerColor === "w" ? position.centerBlack : position.centerWhite;

  if (playerCenter > opponentCenter + 1)
    return "you have strong central control";
  if (opponentCenter > playerCenter + 1)
    return "your opponent controls the center — consider challenging it";
  return null;
}

function detectKingSafety(game, playerColor) {
  if (!game) return null;

  const board = game.board();
  const kingRank = playerColor === "w" ? 0 : 7;
  let kingFile = -1;

  for (let c = 0; c < 8; c++) {
    const piece = board[kingRank][c];
    if (piece && piece.type === "k" && piece.color === playerColor) {
      kingFile = c;
      break;
    }
  }

  if (kingFile === -1) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === "k" && piece.color === playerColor) {
          return null;
        }
      }
    }
    return null;
  }

  const kingSquare = `${String.fromCharCode(97 + kingFile)}${playerColor === "w" ? 1 : 8}`;
  const hasCastled =
    (playerColor === "w" && kingRank === 0) ||
    (playerColor === "b" && kingRank === 7);

  let pawnShield = 0;
  for (let dc = -1; dc <= 1; dc++) {
    const c = kingFile + dc;
    if (c < 0 || c > 7) continue;
    const r = playerColor === "w" ? 1 : 6;
    const piece = board[r] && board[r][c];
    if (piece && piece.type === "p" && piece.color === playerColor) {
      pawnShield++;
    }
  }

  if (hasCastled && pawnShield === 0) {
    return "your king has no pawn shield — consider creating luft with a pawn move to prevent back-rank threats";
  }
  if (hasCastled && pawnShield <= 1) {
    return "your king's pawn shield is thin — watch for back-rank weaknesses";
  }
  return null;
}

function detectTacticalOpportunities(game, playerColor) {
  if (!game || game.isGameOver()) return [];
  const opportunities = [];

  try {
    const moves = game.moves({ verbose: true });
    const captures = moves.filter((m) => m.captured);

    for (const cap of captures) {
      const capturedValue = PIECE_VALUES[cap.captured] || 0;
      const capturingValue = PIECE_VALUES[cap.piece] || 0;

      const testGame = new Chess();
      testGame.load(game.fen());
      testGame.move({ from: cap.from, to: cap.to, promotion: "q" });
      const recaptures = testGame
        .moves({ verbose: true })
        .filter((m) => m.to === cap.to && m.captured);

      if (!recaptures.length && capturedValue > 0) {
        const pieceName = PIECE_NAMES[cap.captured] || cap.captured;
        if (capturedValue >= 3) {
          opportunities.push(
            `you can win a ${pieceName} for free on ${cap.to}`
          );
        } else {
          opportunities.push(`you can grab a free ${pieceName} on ${cap.to}`);
        }
      } else if (
        recaptures.length &&
        capturedValue > capturingValue &&
        capturedValue - capturingValue >= 2
      ) {
        const pieceName = PIECE_NAMES[cap.captured] || cap.captured;
        opportunities.push(
          `you can win material by trading — capture their ${pieceName} on ${cap.to}`
        );
      }
    }

    const checks = moves.filter((m) => m.san && m.san.includes("+"));
    if (checks.length >= 2) {
      opportunities.push("you have multiple checking moves available");
    }

    const forks = moves.filter((m) => {
      if (!m.captured) return false;
      const testGame = new Chess();
      testGame.load(game.fen());
      testGame.move({ from: m.from, to: m.to, promotion: "q" });
      const opponentMoves = testGame.moves({ verbose: true });
      const opponentCaptures = opponentMoves.filter((c) => c.captured);
      return opponentCaptures.length === 0;
    });
    if (forks.length >= 2) {
      opportunities.push(
        "you may have a fork available — a piece that attacks two things at once"
      );
    }
  } catch {
    // ignore
  }

  return opportunities;
}

function hasPlayerCastled(game, playerColor) {
  if (!game) return false;
  const board = game.board();
  const backRank = playerColor === "w" ? 0 : 7;
  for (let c = 0; c < 8; c++) {
    const piece = board[backRank][c];
    if (piece && piece.type === "k" && piece.color === playerColor) {
      const startCol = 4;
      if (c === 6 || c === 7) return true;
      if (c === 2 || c === 1) return true;
      if (c !== startCol) return true;
    }
  }
  return false;
}

function getUndevelopedPieces(game, playerColor) {
  if (!game) return [];
  const board = game.board();
  const backRank = playerColor === "w" ? 0 : 7;
  const undeveloped = [];
  for (let c = 0; c < 8; c++) {
    const piece = board[backRank][c];
    if (
      piece &&
      piece.color === playerColor &&
      (piece.type === "n" || piece.type === "b")
    ) {
      const square = `${String.fromCharCode(97 + c)}${playerColor === "w" ? 1 : 8}`;
      undeveloped.push(`${piece.type === "n" ? "knight" : "bishop"} on ${square}`);
    }
  }
  return undeveloped;
}

function getPhaseStrategy(phase, position, playerColor, game) {
  if (phase === "opening") {
    const tips = [];
    const playerDeveloped =
      playerColor === "w" ? position.whiteDeveloped : position.blackDeveloped;
    const castled = hasPlayerCastled(game, playerColor);
    const undeveloped = getUndevelopedPieces(game, playerColor);

    if (undeveloped.length > 0) {
      tips.push(`develop your remaining pieces (${undeveloped.slice(0, 2).join(", ")})`);
    } else if (playerDeveloped < 2) {
      tips.push("focus on developing your knights and bishops");
    }

    if (!castled) {
      tips.push("castle to secure your king");
    }

    const playerCenter =
      playerColor === "w" ? position.centerWhite : position.centerBlack;
    const opponentCenter =
      playerColor === "w" ? position.centerBlack : position.centerWhite;
    if (playerCenter <= opponentCenter) {
      tips.push("contest the center");
    }

    if (tips.length === 0) {
      tips.push("look for tactics and ways to create threats");
    }
    return tips.join(", ");
  }
  if (phase === "middlegame") {
    const tips = [];
    const castled = hasPlayerCastled(game, playerColor);
    if (!castled && position.moveCount < 20) {
      tips.push("castle to secure your king if you haven't already");
    }
    const playerDiff = playerColor === "w" ? position.materialDiff : -position.materialDiff;
    if (playerDiff >= 3) {
      tips.push("you're ahead in material — look to simplify and trade pieces");
    } else if (playerDiff <= -3) {
      tips.push("you're behind in material — keep pieces on and look for complications");
    } else {
      tips.push(pickRandom([
        "look for tactics like forks, pins, and skewers",
        "improve your worst-placed piece and coordinate an attack",
        "identify your opponent's weakest square and pile pressure on it",
        "look for ways to create threats against your opponent's position",
      ]));
    }
    return tips.join(", ");
  }
  const tips = [];
  const playerDiff = playerColor === "w" ? position.materialDiff : -position.materialDiff;
  if (playerDiff >= 3) {
    tips.push("simplify by trading pieces — fewer pieces makes your advantage decisive");
  } else if (playerDiff <= -3) {
    tips.push("keep pieces on the board and look for counterplay or swindles");
  } else {
    tips.push("activate your king and push any passed pawns");
  }
  tips.push(pickRandom([
    "use your king aggressively in the endgame",
    "look for pawn breaks and passed pawns to promote",
    "be patient — endgames are about technique, not rushing",
  ]));
  return tips.join(", ");
}

/**
 * Generate instant, deep coaching feedback using board analysis only.
 * No engine eval or LLM required — runs synchronously when the player moves.
 *
 * Produces specific feedback covering:
 * - What the move accomplished
 * - Whether a piece was hung (blunder detection)
 * - Position assessment (material, development, center, king safety)
 * - Tactical opportunities available
 * - Strategic plan for the phase of the game
 *
 * @param {Object} params
 * @param {Object} params.move - { from, to, san, piece, captured, color, promotion }
 * @param {Chess} params.game - chess.js instance AFTER the move
 * @param {Chess} params.gameBefore - chess.js instance BEFORE the move
 * @param {Object} params.beforeEval - engine eval of position before (optional: { evalScore, evalType, bestMove })
 * @param {number} params.moveNumber - 1-based move number
 * @returns {string} Rich coaching message
 */
export function generateInstantFeedback({
  move,
  game,
  gameBefore,
  beforeEval,
  moveNumber,
}) {
  if (!move || !game) return "";

  const parts = [];
  const playerColor = move.color;
  const position = analyzePosition(null, game);
  const phase = position ? getGamePhase(position.moveCount) : "middlegame";

  // ---- Checkmate ----
  if (move.san && move.san.includes("#")) {
    return "Checkmate! You finished the game beautifully — well played!";
  }

  // ---- Blunder detection (highest priority) ----
  const blunder = detectBlunder(game);
  // Only treat as a blunder if a piece worth 3+ is hanging or the trade
  // loss is 3+. A hanging pawn is common and not worth interrupting for.
  const isRealBlunder =
    blunder &&
    ((blunder.type === "hanging" && blunder.capturedValue >= 3) ||
      (blunder.type === "unfavorable_trade" &&
        blunder.capturedValue - (PIECE_VALUES[blunder.capturedBy] || 0) >= 3));

  if (isRealBlunder) {
    parts.push(`Careful! ${blunder.detail}`);
    if (beforeEval?.bestMove) {
      try {
        const bestGame = new Chess();
        bestGame.load(gameBefore.fen());
        const bestMove = bestGame.move({
          from: beforeEval.bestMove.slice(0, 2),
          to: beforeEval.bestMove.slice(2, 4),
          promotion: beforeEval.bestMove.length > 4 ? beforeEval.bestMove[4] : "q",
        });
        if (bestMove) {
          parts.push(`Instead, ${bestMove.san} would have kept your position safe.`);
        }
      } catch {
        // ignore
      }
    }

    // Position-specific advice instead of generic rotating tips
    if (position) {
      const materialDesc = describeMaterial(position, playerColor);
      parts.push(`Right now ${materialDesc}.`);
      const strategy = getPhaseStrategy(phase, position, playerColor, game);
      parts.push(`Going forward: ${strategy}.`);
    }
    return parts.join(" ");
  }

  // ---- What the move accomplished ----
  const achievements = describeMoveAchievements(move, moveNumber);
  const pieceName = PIECE_NAMES[move.piece] || move.piece || "piece";

  // ---- Engine match ----
  const playerPlayedBest = beforeEval?.bestMove
    ? isMoveBestSafe(move.from, move.to, beforeEval.bestMove)
    : false;

  if (playerPlayedBest) {
    parts.push(pickRandom([
      `Excellent! ${move.san} is the engine's top choice.`,
      `Brilliant move — ${move.san} is exactly what the engine recommends.`,
      `Spot on with ${move.san}! The engine agrees this is the best move.`,
    ]));
  } else {
    // ---- Identify problems with the player's move ----
    const moveProblems = analyzeMoveProblems(move, game, gameBefore, moveNumber, playerColor);

    if (moveProblems.length > 0) {
      parts.push(`${move.san} — ${moveProblems.join(" and ")}.`);
    } else if (achievements.length > 0) {
      parts.push(`${move.san} ${joinAchievements(achievements)}.`);
    } else {
      parts.push(`${move.san}.`);
    }

    // ---- Compare with the engine's best move and explain WHY it's better ----
    if (beforeEval?.bestMove && gameBefore) {
      try {
        const bestGame = new Chess();
        bestGame.load(gameBefore.fen());
        const bestMove = bestGame.move({
          from: beforeEval.bestMove.slice(0, 2),
          to: beforeEval.bestMove.slice(2, 4),
          promotion: beforeEval.bestMove.length > 4 ? beforeEval.bestMove[4] : "q",
        });
        if (bestMove) {
          const bestAchievements = describeMoveAchievements(bestMove, moveNumber);
          const bestProblems = analyzeMoveProblems(bestMove, bestGame, gameBefore, moveNumber, playerColor);

          // Explain the specific advantage of the engine's move
          const advantages = bestAchievements.filter(
            (a) => !achievements.includes(a)
          );

          if (advantages.length > 0) {
            parts.push(
              `The engine's choice, ${bestMove.san}, ${joinAchievements(advantages)} — which your move didn't accomplish.`
            );
          } else if (bestProblems.length === 0 && moveProblems.length > 0) {
            parts.push(
              `The engine's ${bestMove.san} avoids the ${moveProblems[0]} that your move creates.`
            );
          } else {
            // Explain what the best move does differently
            const playerGame = new Chess();
            playerGame.load(gameBefore.fen());
            playerGame.move({ from: move.from, to: move.to, promotion: move.promotion || "q" });

            const playerPos = analyzePosition(null, playerGame);
            const bestPos = analyzePosition(null, bestGame);

            if (playerPos && bestPos) {
              const diffs = [];
              const playerDev = playerColor === "w" ? playerPos.whiteDeveloped : playerPos.blackDeveloped;
              const bestDev = playerColor === "w" ? bestPos.whiteDeveloped : bestPos.blackDeveloped;
              if (bestDev > playerDev) {
                diffs.push("develops an additional piece");
              }

              const playerCenter = playerColor === "w" ? playerPos.centerWhite : playerPos.centerBlack;
              const bestCenter = playerColor === "w" ? bestPos.centerWhite : bestPos.centerBlack;
              if (bestCenter > playerCenter) {
                diffs.push("controls more of the center");
              }

              if (diffs.length > 0) {
                parts.push(
                  `The engine's ${bestMove.san} ${joinAchievements(diffs)} compared to your move.`
                );
              } else {
                parts.push(
                  `The engine preferred ${bestMove.san} — it leads to a slightly stronger position.`
                );
              }
            }
          }
        }
      } catch {
        // ignore
      }
    } else if (achievements.length === 0) {
      // No engine eval available — give heuristic advice
      parts.push("This move doesn't develop a piece or fight for the center.");
    }
  }

  // ---- Position assessment ----
  if (position) {
    const materialDesc = describeMaterial(position, playerColor);
    const devDesc = describeDevelopment(position, playerColor);
    const centerDesc = describeCenter(position, playerColor);
    const kingDesc = detectKingSafety(game, playerColor);

    // Pick the 1-2 most relevant position insights
    const insights = [devDesc, centerDesc, kingDesc].filter(Boolean);
    if (insights.length > 0) {
      parts.push(`Right now ${materialDesc}, and ${insights[0]}.`);
      if (insights.length > 1 && phase === "opening") {
        parts.push(`Also note: ${insights[1]}.`);
      }
    } else {
      parts.push(`Right now ${materialDesc}.`);
    }
  }

  // ---- Tactical opportunities ----
  const tacticalOps = detectTacticalOpportunities(game, playerColor);
  if (tacticalOps.length > 0) {
    parts.push(`Tactically: ${tacticalOps[0]}.`);
    if (tacticalOps.length > 1) {
      parts.push(`${tacticalOps[1].charAt(0).toUpperCase() + tacticalOps[1].slice(1)}.`);
    }
  }

  // ---- Strategic plan going forward ----
  if (position) {
    const strategy = getPhaseStrategy(phase, position, playerColor, game);
    parts.push(`Going forward: ${strategy}.`);
  }

  return parts.join(" ");
}

function isMoveBestSafe(playedFrom, playedTo, bestMoveUci) {
  if (!bestMoveUci || bestMoveUci.length < 4) return false;
  return (
    bestMoveUci.slice(0, 2) === playedFrom &&
    bestMoveUci.slice(2, 4) === playedTo
  );
}

/**
 * Identify specific problems with a move.
 * Returns an array of short problem descriptions.
 */
function analyzeMoveProblems(move, gameAfter, gameBefore, moveNumber, playerColor) {
  const problems = [];
  if (!move || !gameAfter || !gameBefore) return problems;

  const phase = getGamePhase(gameAfter.history().length);

  // 1. Moved the same piece twice in the opening (wasting tempo)
  if (phase === "opening" && moveNumber > 2) {
    const history = gameAfter.history({ verbose: true });
    const playerMoves = history.filter((m) => m.color === playerColor);
    if (playerMoves.length >= 2) {
      const lastTwo = playerMoves.slice(-2);
      if (lastTwo[0].from === move.from && lastTwo[1].from === move.from) {
        problems.push("moves the same piece twice in the opening, wasting development time");
      }
    }
  }

  // 2. Pawn move on the f/g/h file next to the king in the opening (weakening king)
  if (phase === "opening" && ["p", "P"].includes(move.piece)) {
    const file = move.from[0];
    const rank = parseInt(move.from[1], 10);
    const isKingSide = file === "g" || file === "h";
    const isQueenSide = file === "a" || file === "b" || file === "c";
    const hasCastled = hasPlayerCastled(gameAfter, playerColor);

    if (isKingSide && !hasCastled && (file === "g" || file === "h")) {
      // Check if this weakens the king's pawn shield
      const board = gameAfter.board();
      const kingRank = playerColor === "w" ? 0 : 7;
      let kingFile = -1;
      for (let c = 0; c < 8; c++) {
        const piece = board[kingRank][c];
        if (piece && piece.type === "k" && piece.color === playerColor) {
          kingFile = c;
          break;
        }
      }
      if (kingFile >= 4 && file.charCodeAt(0) - 97 > kingFile) {
        // Only flag if king is on the kingside
        // Don't flag if it's creating luft (h3/h6 is actually good)
        if (file === "g") {
          problems.push("weakens the king's pawn shield — be careful about opening lines toward your king");
        }
      }
    }
  }

  // 3. Moved a piece to a square where it's undefended and can be attacked
  if (["n", "b", "r", "q"].includes(move.piece.toLowerCase())) {
    const pieceValue = PIECE_VALUES[move.piece.toLowerCase()] || 0;
    if (pieceValue >= 3) {
      // Check if the piece on its new square is defended
      const board = gameAfter.board();
      const toFile = move.to.charCodeAt(0) - 97;
      const toRank = 8 - parseInt(move.to[1], 10);

      // Check if opponent can attack this square
      const opponentColor = playerColor === "w" ? "b" : "w";
      const opponentMoves = gameAfter.moves({ verbose: true });
      const attackers = opponentMoves.filter((m) => m.to === move.to);

      if (attackers.length > 0) {
        // Check if the piece is defended
        const tempGame = new Chess();
        tempGame.load(gameAfter.fen());
        // If it's the opponent's turn, they can attack
        if (tempGame.turn() === opponentColor) {
          // See if any attacker is worth less than the piece
          const cheapAttacker = attackers.find((a) => {
            const attackerValue = PIECE_VALUES[a.piece] || 0;
            return attackerValue < pieceValue;
          });
          if (cheapAttacker) {
            const attackerName = PIECE_NAMES[cheapAttacker.piece] || cheapAttacker.piece;
            const pieceName = PIECE_NAMES[move.piece] || move.piece;
            problems.push(`places the ${pieceName} on ${move.to} where it can be attacked by the opponent's ${attackerName}`);
          }
        }
      }
    }
  }

  // 4. Failed to recapture when a recapture was available and favorable
  const beforeHistory = gameBefore.history({ verbose: true });
  if (beforeHistory.length > 0) {
    const lastOppMove = beforeHistory[beforeHistory.length - 1];
    if (lastOppMove && lastOppMove.color !== playerColor && lastOppMove.captured) {
      // The opponent just captured — did the player recapture?
      // Check if recapture was possible
      const recaptureMoves = gameBefore.moves({ verbose: true }).filter(
        (m) => m.to === lastOppMove.to && m.captured
      );
      if (recaptureMoves.length > 0 && move.to !== lastOppMove.to) {
        const lostPiece = PIECE_NAMES[lastOppMove.captured] || lastOppMove.captured;
        const lostValue = PIECE_VALUES[lastOppMove.captured] || 0;
        if (lostValue >= 3) {
          problems.push(`fails to recapture the ${lostPiece} that was just taken on ${lastOppMove.to}`);
        }
      }
    }
  }

  // 5. Queen out too early in the opening
  if (phase === "opening" && move.piece === "q" && moveNumber < 8) {
    const playerMoves = gameAfter.history({ verbose: true }).filter((m) => m.color === playerColor);
    const developed = playerMoves.filter((m) => ["n", "b"].includes(m.piece) && m.color === playerColor);
    if (developed.length < 2) {
      problems.push("brings the queen out before developing minor pieces — the queen can be harassed and you'll lose tempo");
    }
  }

  // 6. Move doesn't develop, capture, check, or improve center control in the opening
  if (phase === "opening" && problems.length === 0) {
    const isDeveloping = ["n", "b"].includes(move.piece.toLowerCase()) ||
      (move.piece === "q" && CENTER_SQUARES.includes(move.to));
    const isCentralPawn = move.piece === "p" && (CENTER_SQUARES.includes(move.to) || EXTENDED_CENTER.includes(move.to));
    const isCastling = move.san && move.san.includes("O-O");
    const isCapture = move.captured;
    const isCheck = move.san && move.san.includes("+");

    if (!isDeveloping && !isCentralPawn && !isCastling && !isCapture && !isCheck) {
      const undeveloped = getUndevelopedPieces(gameAfter, playerColor);
      if (undeveloped.length > 0) {
        problems.push(`doesn't develop a piece or fight for the center — you still have undeveloped pieces (${undeveloped.slice(0, 2).join(", ")})`);
      }
    }
  }

  return problems;
}
