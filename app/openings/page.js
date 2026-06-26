"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Chess } from "chess.js";
import { OPENINGS } from "../../lib/openings";

const ChessBoard = dynamic(() => import("../../components/ChessBoard"), {
  ssr: false,
  loading: () => <div className="placeholder">Loading board…</div>,
});

const STARTING_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export default function OpeningsPage() {
  const [selectedSlug, setSelectedSlug] = useState(OPENINGS[0].slug);
  const [currentStep, setCurrentStep] = useState(0);

  const opening = useMemo(
    () => OPENINGS.find((o) => o.slug === selectedSlug),
    [selectedSlug]
  );

  const { fen, lastMove, moveSan, isComplete } = useMemo(() => {
    if (!opening) {
      return {
        fen: STARTING_FEN,
        lastMove: null,
        moveSan: null,
        isComplete: false,
      };
    }

    const game = new Chess();
    let lastMoveObj = null;

    for (let i = 0; i <= currentStep && i < opening.moves.length; i++) {
      try {
        lastMoveObj = game.move(opening.moves[i]);
      } catch {
        break;
      }
    }

    return {
      fen: game.fen(),
      lastMove: lastMoveObj
        ? { from: lastMoveObj.from, to: lastMoveObj.to }
        : null,
      moveSan: lastMoveObj ? lastMoveObj.san : null,
      isComplete: currentStep >= opening.moves.length - 1,
    };
  }, [opening, currentStep]);

  const handleSelectOpening = useCallback((slug) => {
    setSelectedSlug(slug);
    setCurrentStep(0);
  }, []);

  const handleNext = useCallback(() => {
    if (!opening) return;
    setCurrentStep((s) => Math.min(s + 1, opening.moves.length - 1));
  }, [opening]);

  const handlePrev = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  const handleReset = useCallback(() => {
    setCurrentStep(0);
  }, []);

  const coachMessage = useMemo(() => {
    if (!opening) return "";

    if (currentStep === 0) {
      return `${opening.name}: ${opening.description}`;
    }

    const moveNumber = Math.ceil((currentStep + 1) / 2);
    const side = currentStep % 2 === 0 ? "White" : "Black";
    const san = opening.moves[currentStep];

    let msg = `Move ${moveNumber}: ${side} plays ${san}. `;

    if (currentStep === 1 && opening.slug === "sicilian-defense") {
      msg +=
        "Black fights for the center asymmetrically — this leads to sharp, double-edged positions.";
    } else if (san === "O-O") {
      msg += "Castling secures the king and brings the rook into the game.";
    } else if (san && san.startsWith("N")) {
      msg += "Developing a knight — knights are great in the center and support central control.";
    } else if (san && san.startsWith("B")) {
      msg += "Developing a bishop — bishops control long diagonals and help fight for the center.";
    } else if (san && san.startsWith("e4")) {
      msg += "Fighting for the center — the e4 pawn controls d5 and f5.";
    } else if (san && san.startsWith("d4")) {
      msg += "Fighting for the center — the d4 pawn controls c5 and e5.";
    } else if (san && san.startsWith("c")) {
      msg += "Challenging the center or supporting a pawn structure.";
    } else {
      msg += "A key move in this opening's strategy.";
    }

    if (isComplete && opening.tips.length > 0) {
      msg += ` ${opening.tips[0]}`;
    }

    return msg;
  }, [opening, currentStep, isComplete]);

  return (
    <div>
      <h1>Openings</h1>
      <p className="page-intro">
        Learn classic chess openings move by move. Step through each move, see
        it on the board, and read coaching advice on what each move
        accomplishes.
      </p>

      <div className="openings-layout">
        <aside className="openings-sidebar">
          <p className="move-side-title">Openings</p>
          <div className="openings-list">
            {OPENINGS.map((o) => (
              <button
                key={o.slug}
                className={`opening-item ${
                  o.slug === selectedSlug ? "active" : ""
                }`}
                onClick={() => handleSelectOpening(o.slug)}
              >
                {o.name}
              </button>
            ))}
          </div>
        </aside>

        <div className="openings-main">
          <div className="board-layout">
            <div className="play-board-area">
              <ChessBoard
                fen={fen}
                orientation="white"
                interactive={false}
                lastMove={lastMove}
              />
            </div>
            <aside className="board-side">
              <div className="opening-info">
                <h2>{opening?.name}</h2>
                <p className="opening-desc">{opening?.description}</p>
              </div>

              <div className="coach-panel">
                <div className="coach-bubble">
                  {coachMessage || "Select an opening to begin."}
                </div>
              </div>

              <div className="opening-controls">
                <button
                  className="btn secondary"
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                >
                  ← Prev
                </button>
                <span className="opening-step">
                  Move {currentStep + 1} / {opening?.moves.length || 0}
                </span>
                <button
                  className="btn secondary"
                  onClick={handleNext}
                  disabled={isComplete}
                >
                  Next →
                </button>
              </div>

              <button className="btn" onClick={handleReset}>
                Reset
              </button>

              {isComplete && opening && (
                <div className="opening-tips">
                  <p className="move-side-title">Key points</p>
                  <ul>
                    {opening.tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="opening-move-list">
                <p className="move-side-title">Move sequence</p>
                <div className="opening-moves">
                  {opening?.moves.map((m, i) => (
                    <span
                      key={i}
                      className={`opening-move ${
                        i === currentStep ? "active" : ""
                      }`}
                    >
                      {Math.ceil((i + 1) / 2)}.
                      {i % 2 === 0 ? "" : ".."} {m}
                    </span>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
