"use client";

/**
 * Displays Stockfish analysis results: eval bar, best move, principal variation, depth.
 * Now supports auto-analysis (no manual button needed) and cached evals.
 */
function formatEval(evalScore, evalType, turn) {
  if (evalScore === null || evalType === null) return "—";

  if (evalType === "mate") {
    const n = Math.abs(evalScore);
    return `M${n}`;
  }

  let pawns = evalScore / 100;
  if (turn === "b") pawns = -pawns;
  return pawns >= 0 ? `+${pawns.toFixed(2)}` : pawns.toFixed(2);
}

function evalBarPercent(evalScore, evalType, turn) {
  if (evalScore === null || evalType === null) return 50;

  if (evalType === "mate") {
    return evalScore > 0 ? 100 : 0;
  }

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
  showArrow,
  onToggleArrow,
  accuracy,
  showCoordinates,
  onToggleCoordinates,
}) {
  const evalText = formatEval(evalScore, evalType, turn);
  const barPercent = evalBarPercent(evalScore, evalType, turn);
  const depthPercent = maxDepth > 0 ? Math.min(100, (depth / maxDepth) * 100) : 0;

  return (
    <div className="analysis-panel">
      <div className="analysis-header">
        <span className="analysis-title">Stockfish</span>
        <div className="analysis-controls">
          <label className="arrow-toggle">
            <input
              type="checkbox"
              checked={showArrow}
              onChange={onToggleArrow}
            />
            <span>Show best move</span>
          </label>
          {onToggleCoordinates && (
            <label className="arrow-toggle">
              <input
                type="checkbox"
                checked={showCoordinates}
                onChange={onToggleCoordinates}
              />
              <span>Coordinates</span>
            </label>
          )}
        </div>
      </div>

      {!isReady && (
        <p className="engine-status">Loading engine…</p>
      )}

      {isReady && (
        <>
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
                {isAnalyzing ? "Analyzing" : "Depth"} {depth}
                {maxDepth ? `/${maxDepth}` : ""}
              </span>
            </div>
          )}

          {accuracy !== null && accuracy !== undefined && (
            <div className="accuracy-row">
              <span className="label">Accuracy:</span>
              <span className="accuracy-value">{accuracy.toFixed(1)}%</span>
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
        </>
      )}
    </div>
  );
}
