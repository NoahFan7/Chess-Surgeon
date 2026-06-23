"use client";

import { useState, useEffect, useCallback } from "react";

export default function SimilarGamesPanel({ fen }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);

  const fetchSimilar = useCallback(async (fenToSearch) => {
    setLoading(true);
    setError("");
    setResults([]);

    try {
      const res = await fetch(
        `https://chess-surgeon-api-fb2ce0ab.onbld.com/similar?fen=${encodeURIComponent(fenToSearch)}&k=5`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to find similar games");
        return;
      }

      setResults(data.results || []);
    } catch (e) {
      setError("Could not connect to similarity service");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fen) {
      const timer = setTimeout(() => fetchSimilar(fen), 500);
      return () => clearTimeout(timer);
    }
  }, [fen, fetchSimilar]);

  const resultText = (result) => {
    switch (result) {
      case "1-0": return "White won";
      case "0-1": return "Black won";
      case "1/2-1/2": return "Draw";
      default: return result;
    }
  };

  return (
    <div className="similar-games-panel">
      <button
        className="similar-games-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="similar-games-icon">🔍</span>
        Similar Master Games
        {results.length > 0 && (
          <span className="similar-games-count">{results.length}</span>
        )}
        <span className="similar-games-arrow">{expanded ? "▼" : "▶"}</span>
      </button>

      {expanded && (
        <div className="similar-games-content">
          {loading && <p className="similar-games-loading">Finding similar positions...</p>}

          {error && <p className="similar-games-error">{error}</p>}

          {!loading && !error && results.length === 0 && (
            <p className="similar-games-empty">No similar games found.</p>
          )}

          {!loading && !error && results.length > 0 && (
            <ul className="similar-games-list">
              {results.map((r, i) => (
                <li key={i} className="similar-game-item">
                  <div className="similar-game-header">
                    <span className="similar-game-players">
                      {r.game?.white || "?"} vs {r.game?.black || "?"}
                    </span>
                    <span className="similar-game-similarity">
                      {(r.similarity * 100 / (results[0]?.similarity || 1)).toFixed(0)}% match
                    </span>
                  </div>
                  <div className="similar-game-meta">
                    {r.game?.date && <span>{r.game.date} </span>}
                    {r.game?.opening && <span>· {r.game.opening}</span>}
                    <span> · Move {r.move_number} ({r.turn})</span>
                    <span> · {resultText(r.game?.result)}</span>
                  </div>
                  {r.game?.site && (
                    <div className="similar-game-fen">
                      <code>{r.fen.split(" ").slice(0, 2).join(" ")}...</code>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
