import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const fen = searchParams.get("fen");
  const k = searchParams.get("k") || "10";

  if (!fen) {
    return NextResponse.json(
      { error: "Missing 'fen' parameter" },
      { status: 400 }
    );
  }

  const similarityUrl = `http://127.0.0.1:8000/similar?fen=${encodeURIComponent(fen)}&k=${k}`;

  try {
    const res = await fetch(similarityUrl, { signal: AbortSignal.timeout(30000) });
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Similarity service error" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    if (e.name === "TimeoutError") {
      return NextResponse.json(
        { error: "Similarity service timed out. It may be loading the model." },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: "Could not connect to similarity service. Is it running on port 8000?" },
      { status: 502 }
    );
  }
}
