"use client";

import { CLASSIFICATION_META } from "../lib/chessAnalysis";

/**
 * Renders a two-column move list (White / Black) from an array of moves.
 * Each move is `{ from, to, san, color }` (color: "w" | "b").
 * classifications: { [index]: "best" | "great" | "good" | "inaccuracy" | "mistake" | "blunder" }
 * If onMoveClick is provided, moves are clickable.
 */
export default function MoveList({
  moves = [],
  currentIndex = -1,
  onMoveClick,
  classifications = {},
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
    const whiteClass = classifications[whiteIdx];
    const blackClass = classifications[blackIdx];

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
          {whiteClass && (
            <span
              className="move-badge"
              style={{ backgroundColor: CLASSIFICATION_META[whiteClass].color }}
              title={CLASSIFICATION_META[whiteClass].label}
            >
              {CLASSIFICATION_META[whiteClass].symbol ||
                CLASSIFICATION_META[whiteClass].label[0]}
            </span>
          )}
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
          {blackClass && (
            <span
              className="move-badge"
              style={{ backgroundColor: CLASSIFICATION_META[blackClass].color }}
              title={CLASSIFICATION_META[blackClass].label}
            >
              {CLASSIFICATION_META[blackClass].symbol ||
                CLASSIFICATION_META[blackClass].label[0]}
            </span>
          )}
        </span>
      </div>
    );
  }

  return <div className="move-list">{rows}</div>;
}
