"use client";

/**
 * Displays Stockfish analysis results: eval bar, best move, principal variation, depth.
 */
function formatEval(evalScore, evalType, turn) {
  if (evalScore === null || evalType === null) return "—";

  if (evalType === "mate") {
    const n = Math.abs(evalScore);
    return `M${n}`;
  }

  // Convert centipawns to pawns, adjust for side to move
  let pawns = evalScore / 100;
  if (turn === "b") pawns = -pawns;
  return pawns >= 0 ? `+${pawns.toFixed(2)}` : pawns.toFixed(2);
}

function evalBarPercent(evalScore, evalType, turn) {
  if (evalScore === null || evalType === null) return 50;

  if (evalType === "mate") {
    return evalScore > 0 ? 100 : 0;
  }

  // Map centipawns to 0-100 scale (clamp at +-800cp)
  let cp = evalScore;
  if (turn === "b") cp = -cp;
  const clamped = Math.max(-800, Math.min(800, cp));
  return 50 + (clamped / 800) * 50;
}

export default function AnalysisPanel({
  isReady,
  isAnalyzing,
  evalScore,
  evalType,
  bestMove,
  pv,
  depth,
  maxDepth,
  turn,
  onAnalyze,
}) {
  const evalText = formatEval(evalScore, evalType, turn);
  const barPercent = evalBarPercent(evalScore, evalType, turn);
  const depthPercent = maxDepth > 0 ? Math.min(100, (depth / maxDepth) * 100) : 0;

  return (
    <div className="analysis-panel">
      <div className="analysis-header">
        <span className="analysis-title">Stockfish</span>
        {!isReady && <span className="engine-status">Loading engine…</span>}
        {isReady && !isAnalyzing && (
          <button className="btn" onClick={onAnalyze} disabled={!isReady}>
            Analyze
          </button>
        )}
        {isAnalyzing && (
          <button className="btn secondary" disabled>
            Analyzing…
          </button>
        )}
      </div>

      <div className="eval-bar-container">
        <div
          className="eval-bar-white"
          style={{ width: `${100 - barPercent}%` }}
        />
        <div
          className="eval-bar-black"
          style={{ width: `${barPercent}%` }}
        />
        <span className="eval-text">{evalText}</span>
      </div>

      {(isAnalyzing || depth > 0) && (
        <div className="depth-bar-container">
          <div
            className="depth-bar-fill"
            style={{ width: `${depthPercent}%` }}
          />
          <span className="depth-text">
            Depth {depth}
            {maxDepth ? `/${maxDepth}` : ""}
          </span>
        </div>
      )}

      {bestMove && (
        <div className="best-move-row">
          <span className="label">Best move:</span>
          <span className="value">{bestMove}</span>
        </div>
      )}

      {pv && pv.length > 0 && (
        <div className="pv-row">
          <span className="label">PV:</span>
          <span className="pv-moves">{pv.slice(0, 10).join(" ")}</span>
        </div>
      )}
    </div>
  );
}
