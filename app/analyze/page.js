"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import MoveList from "../../components/MoveList";

const ChessBoard = dynamic(() => import("../../components/ChessBoard"), {
  ssr: false,
  loading: () => <div className="placeholder">Loading board…</div>,
});

const STARTING_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export default function AnalyzePage() {
  const [fen, setFen] = useState(STARTING_FEN);
  const [moves, setMoves] = useState([]);
  const [status, setStatus] = useState("White to move");

  function handleMove({ move, fen, isCheck, isCheckmate, isDraw, isGameOver, turn }) {
    setFen(fen);
    setMoves((prev) => [
      ...prev,
      { from: move.from, to: move.to, san: move.san, color: move.color },
    ]);
    if (isCheckmate) {
      setStatus(`Checkmate — ${turn === "w" ? "Black" : "White"} wins`);
    } else if (isDraw) {
      setStatus("Draw");
    } else if (isCheck) {
      setStatus(`${turn === "w" ? "White" : "Black"} to move — Check!`);
    } else {
      setStatus(`${turn === "w" ? "White" : "Black"} to move`);
    }
  }

  function reset() {
    setFen(STARTING_FEN);
    setMoves([]);
    setStatus("White to move");
  }

  function flip() {
    setOrientation((o) => (o === "white" ? "black" : "white"));
  }

  const [orientation, setOrientation] = useState("white");

  return (
    <div>
      <h1>Analyze a game</h1>
      <div className="board-layout">
        <ChessBoard
          fen={fen}
          orientation={orientation}
          onMove={handleMove}
        />
        <aside className="board-side">
          <p className="board-status" dangerouslySetInnerHTML={{
            __html: status.replace(
              /(White|Black) to move/,
              (m, c) =>
                `<span class="turn-${c === "White" ? "w" : "b"}">${m}</span>`
            ),
          }} />
          <div className="board-actions">
            <button className="btn secondary" onClick={flip}>
              Flip board
            </button>
            <button className="btn secondary" onClick={reset}>
              Reset
            </button>
          </div>
          <p className="move-side-title">Moves</p>
          <MoveList moves={moves} />
        </aside>
      </div>
    </div>
  );
}
