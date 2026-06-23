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

  const systemPrompt = `You are a friendly, knowledgeable chess coach. You explain things clearly for a beginner-to-intermediate player. You are encouraging but honest. Keep your responses to 2-4 sentences. Be specific — explain WHY a move is good or bad, what the opponent is threatening, and what the player should look for next. If the position is in an opening, mention the strategic goals of that opening.`;

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
    const beforeStr =
      evalBefore.evalType === "mate"
        ? `mate in ${evalBefore.evalScore}`
        : `${(evalBefore.evalScore / 100).toFixed(2)} pawns`;
    const afterStr =
      evalAfter.evalType === "mate"
        ? `mate in ${evalAfter.evalScore}`
        : `${(evalAfter.evalScore / 100).toFixed(2)} pawns`;
    userParts.push(
      `Engine eval before move: ${beforeStr} (from White's perspective)`
    );
    userParts.push(
      `Engine eval after move: ${afterStr} (from White's perspective)`
    );
  }

  if (bestMoveUci) {
    userParts.push(
      `Engine's best move was: ${bestMoveUci.slice(0, 2)} to ${bestMoveUci.slice(2, 4)}`
    );
  }

  if (moveCaptured) {
    userParts.push(`This move captured a ${moveCaptured}.`);
  }

  if (isCheck) {
    userParts.push("The opponent is now in check.");
  }

  if (isCheckmate) {
    userParts.push("This move is checkmate — the game is over!");
  }

  if (pgnMoves && pgnMoves.length > 0) {
    const recent = pgnMoves.slice(-12).join(" ");
    userParts.push(`Recent moves: ${recent}`);
  }

  userParts.push(`Current FEN: ${fen}`);

  userParts.push(
    `\nCoach the player on this move. Be specific about what happened and what to look for.`
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
        max_tokens: 300,
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
    const message =
      data.choices?.[0]?.message?.content ||
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
