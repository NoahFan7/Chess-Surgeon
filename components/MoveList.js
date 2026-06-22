"use client";

/**
 * Renders a two-column move list (White / Black) from an array of moves.
 * Each move is `{ from, to, san, color }` (color: "w" | "b").
 * If onMoveClick is provided, moves are clickable.
 */
export default function MoveList({
  moves = [],
  currentIndex = -1,
  onMoveClick,
}) {
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
    const whiteIdx = i;
    const blackIdx = i + 1;

    rows.push(
      <div className="move-row" key={num}>
        <span className="move-num">{num}.</span>
        <span
          className={`move-san ${i === currentIndex ? "active" : ""} ${
            onMoveClick ? "clickable" : ""
          }`}
          onClick={onMoveClick ? () => onMoveClick(whiteIdx) : undefined}
        >
          {white ? white.san : ""}
        </span>
        <span
          className={`move-san ${i + 1 === currentIndex ? "active" : ""} ${
            onMoveClick ? "clickable" : ""
          }`}
          onClick={
            onMoveClick && black ? () => onMoveClick(blackIdx) : undefined
          }
        >
          {black ? black.san : ""}
        </span>
      </div>
    );
  }

  return <div className="move-list">{rows}</div>;
}
