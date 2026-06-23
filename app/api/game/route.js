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
  // Extracts game type (live/daily) and game ID from Chess.com URLs
  // Supports multiple URL formats:
  //   https://www.chess.com/game/live/12345          (current)
  //   https://www.chess.com/game/daily/12345
  //   https://www.chess.com/game/analysis/12345
  //   https://www.chess.com/game/tournament/12345
  //   https://www.chess.com/live/game/12345           (older)
  //   https://www.chess.com/daily/game/12345          (older)
  let match = url.match(/chess\.com\/game\/(live|analysis|daily|tournament)\/(\d+)/);
  if (match) return { gameType: match[1], gameId: match[2], url };

  match = url.match(/chess\.com\/(live|daily)\/game\/(\d+)/);
  if (match) return { gameType: match[1], gameId: match[2], url };

  // Analysis games are stored under "live" type in the callback API
  match = url.match(/chess\.com\/analysis\/game\/(\d+)/);
  if (match) return { gameType: "live", gameId: match[1], url };

  return null;
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
  const { gameType, gameId, url } = info;

  // Chess.com has no public "get game PGN by ID" endpoint.
  // Two-step process:
  //   1. Call the callback endpoint to get player username + game date
  //   2. Fetch the player's monthly archive from the PubAPI and find the game by URL

  // Step 1: Get game metadata (player usernames, date) from the callback endpoint
  const callbackUrl = `https://www.chess.com/callback/${gameType}/game/${gameId}`;
  const callbackRes = await fetch(callbackUrl, {
    headers: {
      "User-Agent": "Chess-Surgeon/1.0",
      Accept: "application/json",
    },
  });

  if (!callbackRes.ok) {
    throw new Error(`Chess.com callback returned ${callbackRes.status}`);
  }

  const callbackData = await callbackRes.json();
  const gameData = callbackData.game || callbackData;

  // Extract the white player's username and game date
  const headers = gameData.pgnHeaders || gameData.pgnHeader || {};
  const whiteUsername = headers.White;
  const dateStr = headers.Date; // "YYYY.MM.DD"

  if (!whiteUsername || !dateStr) {
    throw new Error(
      "Could not determine game players from Chess.com. Try pasting the PGN directly."
    );
  }

  // Parse the date
  const [year, month] = dateStr.split(".");
  if (!year || !month) {
    throw new Error("Could not determine game date from Chess.com.");
  }

  // Step 2: Fetch the player's monthly games archive from the PubAPI
  const pubApiUrl = `https://api.chess.com/pub/player/${whiteUsername.toLowerCase()}/games/${year}/${month}`;
  const archiveRes = await fetch(pubApiUrl, {
    headers: {
      "User-Agent": "Chess-Surgeon/1.0",
      Accept: "application/json",
    },
  });

  if (!archiveRes.ok) {
    throw new Error(
      `Chess.com archive API returned ${archiveRes.status}. Try pasting the PGN directly.`
    );
  }

  const archiveData = await archiveRes.json();
  const games = archiveData.games || [];

  // Find the game by matching the game ID in the URL
  const matchingGame = games.find((g) => {
    const gameUrlParts = (g.url || "").split("/");
    return gameUrlParts[gameUrlParts.length - 1] === String(gameId);
  });

  if (matchingGame && matchingGame.pgn && matchingGame.pgn.length > 20) {
    return matchingGame.pgn;
  }

  throw new Error(
    "Could not find the game in the player's archive. Try copying the PGN directly from Chess.com (Share → Download PGN)."
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
