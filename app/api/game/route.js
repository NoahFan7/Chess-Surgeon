import { NextResponse } from "next/server";

/**
 * API route to fetch game PGN from a URL.
 * Supports Lichess and Chess.com game URLs.
 *
 * GET /api/game?url=https://lichess.org/abc12345
 * GET /api/game?url=https://www.chess.com/game/live/12345
 */

function extractLichessId(url) {
  // https://lichess.org/MPQpq6Rj or https://lichess.org/game/MPQpq6Rj
  // Also handles /analysis/MPQpq6Rj or /MPQpq6Rj/black
  const match = url.match(/lichess\.org\/(?:game\/|analysis\/)?([a-zA-Z0-9]{8,12})(?:\/|$|\?)/);
  return match ? match[1] : null;
}

function extractChesscomInfo(url) {
  // https://www.chess.com/game/live/12345 or /game/analysis/12345 or /game/daily/12345
  const match = url.match(/chess\.com\/game\/(?:live|analysis|daily|tournament)\/(\d+)/);
  return match ? { gameId: match[1], url } : null;
}

async function fetchLichessGame(gameId) {
  // Lichess export API: returns PGN text
  const apiUrl = `https://lichess.org/game/export/${gameId}`;

  const res = await fetch(apiUrl, {
    headers: {
      Accept: "application/x-chess-pgn",
    },
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("Game not found on Lichess. Check the URL and game ID.");
    }
    throw new Error(`Lichess API returned ${res.status}`);
  }

  const pgn = await res.text();

  // Verify it's actually PGN (starts with [Event or 1.)
  const trimmed = pgn.trim();
  if (!trimmed.startsWith("[") && !trimmed.startsWith("1.")) {
    throw new Error("Lichess returned unexpected response (not PGN).");
  }

  return trimmed;
}

async function fetchChesscomGame(info) {
  const { url } = info;

  // Chess.com doesn't have a public "get game by ID" API.
  // Fetch the game page and extract the embedded PGN.
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "text/html",
    },
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`Chess.com returned ${res.status}`);
  }

  const html = await res.text();

  // Chess.com embeds PGN in various ways:

  // 1. Try JSON-embedded PGN (in script tags)
  const pgnJsonMatch = html.match(
    /"pgn"\s*:\s*"((?:[^"\\]|\\.)*)"/
  );
  if (pgnJsonMatch) {
    const pgn = JSON.parse(`"${pgnJsonMatch[1]}"`);
    if (pgn && pgn.length > 50) return pgn;
  }

  // 2. Try to find PGN in a data attribute
  const dataPgnMatch = html.match(/data-pgn="([^"]+)"/);
  if (dataPgnMatch) {
    const pgn = dataPgnMatch[1]
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
    if (pgn.length > 50) return pgn;
  }

  // 3. Try to find PGN directly in the page (starts with [Event)
  const pgnBlockMatch = html.match(
    /\[Event\s+"[^"]*"[\s\S]*?(?:1-0|0-1|1\/2-1\/2)\]/
  );
  if (pgnBlockMatch) {
    return pgnBlockMatch[0].trim();
  }

  // 4. Try chess.com's internal API for game data
  const gameId = info.gameId;
  const apiUrls = [
    `https://api.chess.com/pub/game/${gameId}`,
    `https://api.chess.com/pub/games/${gameId}`,
  ];

  for (const apiUrl of apiUrls) {
    try {
      const apiRes = await fetch(apiUrl, {
        headers: { Accept: "application/json" },
      });
      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data.pgn && data.pgn.length > 50) return data.pgn;
      }
    } catch {
      // continue to next method
    }
  }

  throw new Error(
    "Could not extract PGN from Chess.com. Try copying the PGN directly from Chess.com's analysis page (Share → Download PGN)."
  );
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "Missing 'url' parameter" },
      { status: 400 }
    );
  }

  // Validate URL
  try {
    new URL(url);
  } catch {
    return NextResponse.json(
      { error: "Invalid URL format." },
      { status: 400 }
    );
  }

  try {
    let pgn = null;
    const lichessId = extractLichessId(url);
    const chesscomInfo = extractChesscomInfo(url);

    if (lichessId) {
      pgn = await fetchLichessGame(lichessId);
    } else if (chesscomInfo) {
      pgn = await fetchChesscomGame(chesscomInfo);
    } else {
      return NextResponse.json(
        {
          error:
            "Unrecognized URL. Please paste a Lichess (lichess.org) or Chess.com game URL.",
        },
        { status: 400 }
      );
    }

    if (!pgn || pgn.length < 20) {
      return NextResponse.json(
        {
          error:
            "Could not retrieve game PGN. Try copying the PGN text directly instead.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ pgn });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch game" },
      { status: 500 }
    );
  }
}
