import { NextResponse } from "next/server";

const INFER_URL = process.env.INFER_TO_GO_URL || process.env.INFER_TO_GO_API_URL;
const INFER_KEY = process.env.INFER_TO_GO_API_KEY || process.env.INFER_TO_GO_KEY;
const MODEL = process.env.COACH_MODEL || "zai-org/glm-5.2";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const {
    fen,
    moveSan,
    movePiece,
    moveCaptured,
    classification,
    blunderDetail,
    evalBefore,
    evalAfter,
    bestMoveUci,
    opening,
    moveNumber,
    turn,
    pgnMoves,
    isCheck,
    isCheckmate,
  } = body;

  if (!fen) {
    return NextResponse.json({ error: "Missing fen" }, { status: 400 });
  }

  if (!INFER_URL || !INFER_KEY) {
    return NextResponse.json({
      message: generateFallbackMessage(
        classification,
        moveSan,
        bestMoveUci,
        opening,
        moveNumber
      ),
    });
  }

  const systemPrompt = `You are a friendly but honest chess coach for beginners. Keep your responses to 2-3 sentences in plain English. Never use numbers, evaluations, or technical notation like "+0.75" or "pawn advantage." Instead of numbers, describe who's doing better in plain words like "you're in a good spot" or "you're falling behind here." Explain WHY a move is good or bad in simple terms a beginner can understand.

CRITICAL RULES:
- If a move is a blunder or mistake, be direct about it. Say things like "uh oh!" or "careful!" and explain what went wrong and what they should do next to recover.
- NEVER give false praise for bad moves. If the player hung a piece or made a mistake, say so clearly and kindly.
- For good moves, be encouraging but don't over-praise.
- Do NOT show your reasoning, thinking process, or analysis steps. Just give the final coaching message directly.
- If it's an opening, briefly mention what the opening is trying to achieve.`;

  const userParts = [];

  if (opening) {
    userParts.push(`Opening: ${opening}`);
  }

  userParts.push(`Move ${moveNumber || "?"}: ${moveSan || "unknown"}`);
  userParts.push(`Side to move after this move: ${turn || "white"}`);

  if (classification) {
    const evalDesc = {
      best: "best move (engine agrees)",
      great: "great move (nearly best)",
      good: "decent but not optimal",
      inaccuracy: "slight inaccuracy — there was something better",
      mistake: "mistake — loses significant ground",
      blunder: "blunder — seriously weakens the position",
    };
    userParts.push(`Move quality: ${evalDesc[classification] || classification}`);
  }

  if (evalBefore && evalAfter) {
    const evalToWords = (e) => {
      if (e.evalType === "mate") {
        return e.evalScore > 0 ? "White can force checkmate" : "Black can force checkmate";
      }
      const pawns = e.evalScore / 100;
      if (pawns > 5) return "White is dominating";
      if (pawns > 2) return "White is clearly ahead";
      if (pawns > 0.5) return "White is slightly better";
      if (pawns > -0.5) return "the position is roughly equal";
      if (pawns > -2) return "Black is slightly better";
      if (pawns > -5) return "Black is clearly ahead";
      return "Black is dominating";
    };
    userParts.push(`Position before the move: ${evalToWords(evalBefore)}`);
    userParts.push(`Position after the move: ${evalToWords(evalAfter)}`);
  }

  if (bestMoveUci) {
    userParts.push(
      `Engine's best move was: ${bestMoveUci.slice(0, 2)} to ${bestMoveUci.slice(2, 4)}`
    );
  }

  if (moveCaptured) {
    userParts.push(`This move captured a ${moveCaptured}.`);
  }

  if (blunderDetail) {
    userParts.push(`BLUNDER DETECTED: ${blunderDetail}`);
    userParts.push(
      `The player made a mistake. Tell them what went wrong and what they should focus on next to recover.`
    );
  }

  if (isCheck) {
    userParts.push("The opponent is now in check.");
  }

  if (isCheckmate) {
    userParts.push("This move is checkmate — the game is over!");
  }

  if (pgnMoves && pgnMoves.length > 0) {
    const recent = pgnMoves.slice(-6).join(" ");
    userParts.push(`Recent moves: ${recent}`);
  }

  userParts.push(`Current FEN: ${fen}`);

  userParts.push(
    `\nCoach the player on this move in 2-3 simple sentences. Explain what happened and what they should think about next. Do NOT use numbers, evaluation scores, or technical chess terms. Speak like you're talking to a friend who just learned chess.`
  );

  const userPrompt = userParts.join("\n");

  try {
    const res = await fetch(`${INFER_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${INFER_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({
        message: generateFallbackMessage(
          classification,
          moveSan,
          bestMoveUci,
          opening,
          moveNumber
        ),
      });
    }

    const data = await res.json();
    const choice = data.choices?.[0]?.message;
    const message =
      choice?.content ||
      generateFallbackMessage(
        classification,
        moveSan,
        bestMoveUci,
        opening,
        moveNumber
      );

    return NextResponse.json({ message });
  } catch (e) {
    return NextResponse.json({
      message: generateFallbackMessage(
        classification,
        moveSan,
        bestMoveUci,
        opening,
        moveNumber
      ),
    });
  }
}

function generateFallbackMessage(
  classification,
  moveSan,
  bestMoveUci,
  opening,
  moveNumber
) {
  const messages = {
    best: `Excellent move with ${moveSan}! That's the engine's top choice.`,
    great: `Great move with ${moveSan}! Nearly the best option available.`,
    good: `Decent move with ${moveSan}, but there was something slightly better.`,
    inaccuracy: `That move (${moveSan}) is a slight inaccuracy. ${
      bestMoveUci
        ? `The best move was ${bestMoveUci.slice(0, 2)} to ${bestMoveUci.slice(2, 4)}.`
        : "Consider looking for a stronger alternative."
    }`,
    mistake: `That move (${moveSan}) is a mistake — it loses significant ground. ${
      bestMoveUci
        ? `Instead, consider ${bestMoveUci.slice(0, 2)} to ${bestMoveUci.slice(2, 4)}.`
        : ""
    }`,
    blunder: `That move (${moveSan}) is a blunder! ${
      bestMoveUci
        ? `The best move was ${bestMoveUci.slice(0, 2)} to ${bestMoveUci.slice(2, 4)}.`
        : "This seriously weakens your position."
    }`,
  };

  let msg = messages[classification] || `${moveSan} — an interesting choice.`;

  if (opening && moveNumber < 12) {
    msg += ` In the ${opening}, focus on controlling the center, developing your pieces, and keeping your king safe.`;
  }

  return msg;
}
