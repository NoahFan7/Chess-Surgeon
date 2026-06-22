/**
 * Chess coach logic — generates beginner-friendly explanations
 * for moves and positions based on engine analysis + position features.
 */

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

const PIECE_NAMES = {
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
    } else {
      // Material commentary
      if (posAnalysis.materialDiff >= 5) {
        messages.push("You're up significantly in material — keep it simple and trade pieces to simplify the win.");
      } else if (posAnalysis.materialDiff <= -5) {
        messages.push("You're behind in material — look for complications or counterattacks to fight back.");
      }

      // Development commentary (early game)
      if (posAnalysis.moveCount < 16) {
        if (posAnalysis.turn === "w" && posAnalysis.whiteDeveloped < 2) {
          messages.push("Tip: In the opening, focus on developing your knights and bishops before launching attacks.");
        } else if (posAnalysis.turn === "b" && posAnalysis.blackDeveloped < 2) {
          messages.push("Tip: In the opening, focus on developing your knights and bishops before launching attacks.");
        }
        if (posAnalysis.centerWhite < 2 && posAnalysis.turn === "w") {
          messages.push("Try to control the center of the board — it gives your pieces more mobility.");
        } else if (posAnalysis.centerBlack < 2 && posAnalysis.turn === "b") {
          messages.push("Try to control the center of the board — it gives your pieces more mobility.");
        }
      }
    }
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
    messages.push(`${turn === "w" ? "White" : "Black"} is completely winning. Look for ways to convert the advantage.`);
  } else if (evalPawns > 2) {
    messages.push(`${turn === "w" ? "White" : "Black"} has a clear advantage. Press the initiative!`);
  } else if (evalPawns > 0.5) {
    messages.push(`${turn === "w" ? "White" : "Black"} is slightly better — look for ways to increase the pressure.`);
  } else if (evalPawns > -0.5) {
    messages.push("The position is roughly equal. Both sides have chances to play for.");
  } else if (evalPawns > -2) {
    messages.push(`${turn === "w" ? "White" : "Black"} is slightly worse — defend carefully and look for counterplay.`);
  } else if (evalPawns > -5) {
    messages.push(`${turn === "w" ? "White" : "Black"} is at a clear disadvantage. Be solid and wait for mistakes.`);
  } else {
    messages.push(`${turn === "w" ? "White" : "Black"} is in serious trouble. Look for any resource to stay in the game.`);
  }

  const analysis = analyzePosition(null, game);
  if (analysis) {
    if (analysis.inCheck) {
      messages.push(`${analysis.turn === "w" ? "White" : "Black"} is in check — address the threat first!`);
    }
    if (analysis.materialDiff !== 0) {
      const who = analysis.materialDiff > 0 ? "White" : "Black";
      const diff = Math.abs(analysis.materialDiff);
      messages.push(`${who} is up ${diff} point${diff > 1 ? "s" : ""} in material.`);
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
