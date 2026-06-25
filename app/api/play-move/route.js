import { NextResponse } from "next/server";
import { Chess } from "chess.js";
import { getLLMModel } from "../../../lib/llmModels";

const AIAND_URL = process.env.AIAND_API_URL || "https://api.aiand.com/v1";
const AIAND_KEY = process.env.AIAND_API_KEY;

/**
 * Parse a SAN move from an LLM's text response.
 * LLMs are unpredictable — they might say "Nf3", "I'll play Nf3",
 * "My move is Nf3", "1. Nf3", etc. We try to extract just the move.
 */
function parseMove(text) {
  if (!text) return null;

  // Remove markdown formatting
  let cleaned = text.trim().replace(/[*_`#]/g, "");

  // Try to find a move pattern: letter followed by optional capture,
  // square, check, etc. Common SAN patterns:
  //   e4, Nf3, Bxc4, O-O, O-O-O, e8=Q, Qxe7+, R1xa8#
  const sanPattern = /\b(O-O-O|O-O|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?)\b/g;

  const matches = cleaned.match(sanPattern);
  if (!matches || matches.length === 0) return null;

  // Return the first plausible move (LLMs usually state the move first)
  return matches[0];
}

/**
 * Try to play a SAN move on a chess.js game. Returns the move object or null.
 */
function tryMove(game, san) {
  if (!san) return null;
  try {
    const move = game.move(san);
    if (move) return move;
  } catch {
    // ignore
  }
  return null;
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { fen, modelId, moveHistory, botColor } = body;

  if (!fen) {
    return NextResponse.json({ error: "Missing fen" }, { status: 400 });
  }

  const model = getLLMModel(modelId);
  if (!model) {
    return NextResponse.json({ error: "Unknown model" }, { status: 400 });
  }

  if (!AIAND_KEY) {
    return NextResponse.json({
      error: "AIAND_API_KEY is not configured. Set it in your environment variables.",
    });
  }

  // Build the game to validate moves
  const game = new Chess();
  try {
    game.load(fen);
  } catch {
    return NextResponse.json({ error: "Invalid FEN" }, { status: 400 });
  }

  const legalMoves = game.moves();
  const botSide = botColor === "w" ? "White" : "Black";

  // Build move history string for context
  const historyStr =
    moveHistory && moveHistory.length > 0
      ? moveHistory.map((m, i) => {
          const num = Math.floor(i / 2) + 1;
          return i % 2 === 0 ? `${num}. ${m}` : m;
        }).join(" ")
      : "This is the first move.";

  const systemPrompt = `You are a chess engine. You are playing ${botSide}. You must respond with ONLY a single chess move in standard algebraic notation (SAN). No explanations, no commentary, just the move. Examples: e4, Nf3, Bxc4, O-O, e8=Q, Qxe7+`;

  const userPrompt = `You are playing ${botSide} in a chess game. Make your move.

Position FEN: ${fen}

Move history: ${historyStr}

Legal moves available: ${legalMoves.join(", ")}

Respond with ONLY your move in SAN notation. Just the move, nothing else. For example: Nf3`;

  try {
    // Call the LLM up to 3 times to get a valid move
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(`${AIAND_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AIAND_KEY}`,
        },
        body: JSON.stringify({
          model: model.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 50,
          temperature: 0.3,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "unknown error");
        return NextResponse.json({
          error: `LLM API error (${res.status}): ${errText}`,
        });
      }

      const data = await res.json();
      const rawText = data.choices?.[0]?.message?.content || "";

      // Parse the move from the response
      const parsedSan = parseMove(rawText);

      if (parsedSan) {
        const move = tryMove(game, parsedSan);
        if (move) {
          return NextResponse.json({
            move: move.san,
            from: move.from,
            to: move.to,
            rawResponse: rawText.trim(),
            attempts: attempt + 1,
          });
        }
      }

      // If we couldn't parse a valid move, try again with a stricter prompt
      if (attempt < 2) {
        // Retry with even stricter instructions
      }
    }

    // All retries failed — return a random legal move as fallback
    const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    const move = game.move(randomMove);
    return NextResponse.json({
      move: move.san,
      from: move.from,
      to: move.to,
      fallback: true,
      rawResponse: "Model failed to produce a legal move",
    });
  } catch (e) {
    // Network error or timeout — return a random legal move
    const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    const move = game.move(randomMove);
    return NextResponse.json({
      move: move.san,
      from: move.from,
      to: move.to,
      fallback: true,
      error: e.message || "Request failed",
    });
  }
}
