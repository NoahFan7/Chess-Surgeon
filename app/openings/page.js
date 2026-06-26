"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
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
  const [selectedLineIdx, setSelectedLineIdx] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const opening = useMemo(
    () => OPENINGS.find((o) => o.slug === selectedSlug),
    [selectedSlug]
  );

  const line = opening?.lines?.[selectedLineIdx];

  const { fen, lastMove, isComplete } = useMemo(() => {
    if (!line) {
      return { fen: STARTING_FEN, lastMove: null, isComplete: false };
    }

    const game = new Chess();
    let lastMoveObj = null;

    for (let i = 0; i <= currentStep && i < line.moves.length; i++) {
      try {
        lastMoveObj = game.move(line.moves[i]);
      } catch {
        break;
      }
    }

    return {
      fen: game.fen(),
      lastMove: lastMoveObj
        ? { from: lastMoveObj.from, to: lastMoveObj.to }
        : null,
      isComplete: currentStep >= line.moves.length - 1,
    };
  }, [line, currentStep]);

  const handleSelectOpening = useCallback((slug) => {
    setSelectedSlug(slug);
    setSelectedLineIdx(0);
    setCurrentStep(0);
  }, []);

  const handleSelectLine = useCallback((idx) => {
    setSelectedLineIdx(idx);
    setCurrentStep(0);
  }, []);

  const handleNext = useCallback(() => {
    if (!line) return;
    setCurrentStep((s) => Math.min(s + 1, line.moves.length - 1));
  }, [line]);

  const handlePrev = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  const handleReset = useCallback(() => {
    setCurrentStep(0);
  }, []);

  const explanation = useMemo(() => {
    if (!line || currentStep < 0) return opening?.description || "";

    if (currentStep === 0) {
      return `${opening.name}: ${opening.description}`;
    }

    return line.explanations[currentStep] || "";
  }, [line, currentStep, opening]);

  if (!opening || !line) return null;

  const moveNumber = Math.ceil((currentStep + 1) / 2);
  const side = currentStep % 2 === 0 ? "White" : "Black";

  return (
    <div>
      <h1>Openings</h1>
      <p className="page-intro">
        Learn classic chess openings move by move. Step through each move, see
        it on the board, and read coaching advice on what each move
        accomplishes. Switch between variations to explore different lines.
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
          {/* Opening overview */}
          <div className="opening-info">
            <h2>{opening.name}</h2>
            <p className="opening-desc">{opening.description}</p>
          </div>

          {/* Core ideas */}
          <div className="opening-ideas">
            <p className="move-side-title">Core Ideas</p>
            <ul>
              {opening.ideas.map((idea, i) => (
                <li key={i}>{idea}</li>
              ))}
            </ul>
          </div>

          {/* Line selector tabs */}
          <div className="line-tabs">
            {opening.lines.map((l, i) => (
              <button
                key={i}
                className={`line-tab ${i === selectedLineIdx ? "active" : ""}`}
                onClick={() => handleSelectLine(i)}
              >
                {l.name}
              </button>
            ))}
          </div>

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
              {/* Coach advice */}
              <div className="coach-panel">
                <div className="coach-bubble">
                  {explanation || "Select a line to begin."}
                </div>
              </div>

              {/* Navigation */}
              <div className="opening-controls">
                <button
                  className="btn secondary"
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                >
                  &larr; Prev
                </button>
                <span className="opening-step">
                  {currentStep === 0
                    ? "Starting position"
                    : `Move ${moveNumber}: ${side} plays ${line.moves[currentStep]}`}
                  {" "}
                  ({currentStep} / {line.moves.length})
                </span>
                <button
                  className="btn secondary"
                  onClick={handleNext}
                  disabled={isComplete}
                >
                  Next &rarr;
                </button>
              </div>

              <button className="btn" onClick={handleReset}>
                Reset
              </button>

              {/* Move sequence */}
              <div className="opening-move-list">
                <p className="move-side-title">Move sequence</p>
                <div className="opening-moves">
                  {line.moves.map((m, i) => (
                    <button
                      key={i}
                      className={`opening-move ${
                        i === currentStep ? "active" : ""
                      }`}
                      onClick={() => setCurrentStep(i)}
                    >
                      {Math.ceil((i + 1) / 2)}.
                      {i % 2 === 0 ? "" : ".."} {m}
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </div>

          {/* Strategy for this line */}
          <div className="opening-strategy">
            <p className="move-side-title">Strategy: {line.name}</p>
            <p className="opening-strategy-text">{line.strategy}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
