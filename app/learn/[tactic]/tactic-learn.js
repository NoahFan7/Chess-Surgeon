"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Chess } from "chess.js";

const ChessBoard = dynamic(() => import("../../../components/ChessBoard"), {
  ssr: false,
  loading: () => <div className="placeholder">Loading board…</div>,
});

const ARROW_COLOR = "rgba(226, 56, 56, 0.8)";

export default function TacticLearn({ tactic, tacticKey }) {
  const [exampleIdx, setExampleIdx] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const example = tactic.examples[exampleIdx];

  const { fen, lastMove, arrows } = useMemo(() => {
    if (!example) {
      return { fen: null, lastMove: null, arrows: [] };
    }

    const game = new Chess();
    game.load(example.fen);
    let lastMoveObj = null;

    for (let i = 0; i < currentStep && i < example.moves.length; i++) {
      try {
        lastMoveObj = game.move(example.moves[i]);
      } catch {
        break;
      }
    }

    const boardArrows = example.arrows.map((a) => [a.from, a.to, ARROW_COLOR]);

    return {
      fen: game.fen(),
      lastMove: lastMoveObj
        ? { from: lastMoveObj.from, to: lastMoveObj.to }
        : null,
      arrows: boardArrows,
    };
  }, [example, currentStep]);

  const handleNext = useCallback(() => {
    if (!example) return;
    setCurrentStep((s) => Math.min(s + 1, example.moves.length));
  }, [example]);

  const handlePrev = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  const handleReset = useCallback(() => {
    setCurrentStep(0);
  }, []);

  const handleSelectExample = useCallback((idx) => {
    setExampleIdx(idx);
    setCurrentStep(0);
  }, []);

  if (!example) return null;

  const isStart = currentStep === 0;
  const isEnd = currentStep >= example.moves.length;
  const explanation = isStart
    ? null
    : example.explanations[currentStep - 1];

  return (
    <div className="learn-page">
      <div className="learn-header">
        <Link href="/learn" className="learn-back">
          ← All tactics
        </Link>
        <h1>{tactic.title}</h1>
        <p className="learn-shortdesc">{tactic.shortDesc}</p>
      </div>

      <div className="learn-content">
        <div className="learn-board">
          <ChessBoard
            fen={fen}
            interactive={false}
            lastMove={lastMove}
            arrows={arrows}
          />

          {/* Step controls */}
          <div className="tactic-stepper">
            <button
              className="btn secondary"
              onClick={handlePrev}
              disabled={isStart}
            >
              ← Start
            </button>
            <span className="tactic-step-label">
              {isStart
                ? "Starting position"
                : isEnd
                ? "Complete!"
                : `Step ${currentStep} of ${example.moves.length}`}
            </span>
            <button
              className="btn secondary"
              onClick={handleNext}
              disabled={isEnd}
            >
              Next →
            </button>
          </div>

          {isEnd && (
            <div className="tactic-result">
              <p>{example.result}</p>
              <button className="btn" onClick={handleReset}>
                ↻ Replay
              </button>
            </div>
          )}
        </div>

        <div className="learn-explanation">
          <h2>What is a {tactic.title.toLowerCase()}?</h2>
          <p>{tactic.explanation}</p>

          {/* Current move explanation */}
          {explanation && (
            <div className="tactic-explanation-box">
              <p>{explanation}</p>
            </div>
          )}

          {/* Example selector */}
          {tactic.examples.length > 1 && (
            <div className="tactic-examples">
              <h3>Examples</h3>
              <div className="line-tabs">
                {tactic.examples.map((ex, i) => (
                  <button
                    key={i}
                    className={`line-tab ${i === exampleIdx ? "active" : ""}`}
                    onClick={() => handleSelectExample(i)}
                  >
                    {ex.result
                      ? `Example ${i + 1}`
                      : `Example ${i + 1}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          <h3>Tips</h3>
          <ul className="learn-tips">
            {tactic.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>

          <div className="learn-nav">
            <h3>Learn more tactics</h3>
            <div className="learn-tactic-links">
              {Object.entries(TACTICS_ALL)
                .filter(([slug]) => slug !== tacticKey)
                .map(([slug, t]) => (
                  <Link
                    key={slug}
                    href={`/learn/${slug}`}
                    className="learn-tactic-link"
                  >
                    {t.title}
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { TACTICS as TACTICS_ALL } from "../../../lib/tactics";
