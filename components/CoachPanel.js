"use client";

import { useState, useEffect, useMemo } from "react";

/**
 * Coach avatar SVG — a friendly chess coach character.
 */
function CoachAvatar({ talking, mood = "neutral" }) {
  const eyeY = talking ? 34 : 35;
  const mouthPath = talking
    ? "M 48 52 Q 50 58 52 52"
    : mood === "happy"
    ? "M 45 50 Q 50 56 55 50"
    : mood === "sad"
    ? "M 45 54 Q 50 48 55 54"
    : "M 45 51 Q 50 54 55 51";

  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 100 100"
      className={`coach-avatar ${talking ? "talking" : ""}`}
    >
      {/* Hat */}
      <ellipse cx="50" cy="22" rx="28" ry="8" fill="#4a90e2" />
      <rect x="30" y="8" width="40" height="18" rx="4" fill="#4a90e2" />
      <ellipse cx="50" cy="22" rx="20" ry="4" fill="#3a7bc8" />

      {/* Head */}
      <circle cx="50" cy="40" r="18" fill="#f4d4b1" stroke="#d4a874" strokeWidth="1" />

      {/* Glasses */}
      <circle cx="43" cy={eyeY} r="5" fill="none" stroke="#333" strokeWidth="1.5" />
      <circle cx="57" cy={eyeY} r="5" fill="none" stroke="#333" strokeWidth="1.5" />
      <line x1="48" y1={eyeY} x2="52" y2={eyeY} stroke="#333" strokeWidth="1.5" />

      {/* Eyes */}
      <circle cx="43" cy={eyeY} r="1.5" fill="#333" />
      <circle cx="57" cy={eyeY} r="1.5" fill="#333" />

      {/* Mouth */}
      <path d={mouthPath} fill="none" stroke="#8B4513" strokeWidth="1.5" strokeLinecap="round" />

      {/* Body/Coat */}
      <path d="M 30 58 Q 50 52 70 58 L 72 85 Q 50 90 28 85 Z" fill="#2a3a5c" />
      <path d="M 45 58 L 50 65 L 55 58" fill="none" stroke="#1a2a4c" strokeWidth="1" />

      {/* Bow tie */}
      <path d="M 44 60 L 40 57 L 40 63 Z M 56 60 L 60 57 L 60 63 Z" fill="#c44" />
      <circle cx="50" cy="60" r="2" fill="#a33" />
    </svg>
  );
}

/**
 * Coach panel — shows coach avatar with speech bubble, position insights, and move explanations.
 */
export default function CoachPanel({
  message,
  evalScore,
  evalType,
  turn,
  game,
  bestMoveUci,
  classification,
  isAnalyzing,
  isThinking,
}) {
  const [displayedMessage, setDisplayedMessage] = useState("");
  const [typing, setTyping] = useState(false);

  // Typewriter effect for coach messages
  useEffect(() => {
    if (!message) {
      setDisplayedMessage("");
      return;
    }

    setTyping(true);
    setDisplayedMessage("");
    let i = 0;
    const interval = setInterval(() => {
      if (i < message.length) {
        setDisplayedMessage(message.slice(0, i + 1));
        i++;
      } else {
        setTyping(false);
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [message]);

  const mood = useMemo(() => {
    if (!classification) return "neutral";
    if (["best", "great"].includes(classification)) return "happy";
    if (["mistake", "blunder"].includes(classification)) return "sad";
    return "neutral";
  }, [classification]);

  const insights = useMemo(() => {
    if (!game) return [];
    return getPositionInsights(game, bestMoveUci);
  }, [game, bestMoveUci]);

  const positionAssessment = useMemo(() => {
    if (!game) return "";
    return coachPosition(evalScore, evalType, turn, game);
  }, [evalScore, evalType, turn, game]);

  return (
    <div className="coach-panel">
      <div className="coach-header">
        <CoachAvatar talking={typing} mood={mood} />
        <div className="coach-bubble">
          {displayedMessage || (isAnalyzing ? "Let me analyze this position..." : "Make a move and I'll coach you through it!")}
          {typing && <span className="coach-cursor">|</span>}
          {isThinking && !typing && <span className="coach-thinking">Thinking...</span>}
        </div>
      </div>

      {positionAssessment && (
        <div className="coach-assessment">
          <span className="coach-assessment-label">Position:</span>
          <span className="coach-assessment-text">{positionAssessment}</span>
        </div>
      )}

      {insights.length > 0 && (
        <div className="coach-insights">
          <p className="move-side-title">Position insights</p>
          <div className="insight-list">
            {insights.map((insight, i) => (
              <div key={i} className={`insight-item insight-${insight.type}`}>
                <span className="insight-icon">{insight.icon}</span>
                <div>
                  <span className="insight-label">{insight.label}</span>
                  <span className="insight-detail">{insight.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Import these at the bottom to avoid circular deps in the component
import { getPositionInsights, coachPosition } from "../lib/chessCoach";
