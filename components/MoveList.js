"use client";

/**
 * Renders a two-column move list (White / Black) from an array of moves.
 * Each move is `{ from, to, san, color }` (color: "w" | "b").
 */
export default function MoveList({ moves = [], currentIndex = -1 }) {
  if (!moves.length) {
    return (
      <div className="move-list empty">
        <span className="muted">No moves yet.</span>
      </div>
    );
  }

  const rows = [];
  for (let i = 0; i < moves.length; i += 2) {
    const num = Math.floor(i / 2) + 1;
    const white = moves[i];
    const black = moves[i + 1];
    rows.push(
      <div className="move-row" key={num}>
        <span className="move-num">{num}.</span>
        <span className={`move-san ${i === currentIndex ? "active" : ""}`}>
          {white ? white.san : ""}
        </span>
        <span
          className={`move-san ${i + 1 === currentIndex ? "active" : ""}`}
        >
          {black ? black.san : ""}
        </span>
      </div>
    );
  }

  return <div className="move-list">{rows}</div>;
}
