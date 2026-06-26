"use client";

import { useMemo } from "react";
import Link from "next/link";
import { TACTIC_KEYWORDS } from "../lib/tactics";

/**
 * Coach avatar SVG — a chess surgeon character.
 * Wears scrubs, a surgical cap, mask, and a stethoscope.
 */
function CoachAvatar({ talking, mood = "neutral" }) {
  const eyeY = 38;
  const mouthPath = talking
    ? "M 46 56 Q 50 62 54 56"
    : mood === "happy"
    ? "M 44 54 Q 50 60 56 54"
    : mood === "sad"
    ? "M 44 58 Q 50 52 56 58"
    : "M 46 56 Q 50 59 54 56";

  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 100 100"
      className={`coach-avatar ${talking ? "talking" : ""}`}
    >
      {/* Stethoscope (behind body) */}
      <path d="M 32 72 Q 26 80 30 88 Q 35 94 40 90" fill="none" stroke="#9aa3b8" strokeWidth="2" strokeLinecap="round" />
      <path d="M 68 72 Q 74 80 70 88 Q 65 94 60 90" fill="none" stroke="#9aa3b8" strokeWidth="2" strokeLinecap="round" />
      <circle cx="40" cy="92" r="3" fill="#9aa3b8" />
      <circle cx="60" cy="92" r="3" fill="#9aa3b8" />

      {/* Surgical cap */}
      <path d="M 28 28 Q 50 8 72 28 L 72 34 Q 50 24 28 34 Z" fill="#1a936f" />
      <path d="M 28 30 Q 50 14 72 30 L 72 36 Q 50 26 28 36 Z" fill="#15967b" />
      {/* Cap fold */}
      <path d="M 45 14 Q 50 10 55 14 L 55 22 Q 50 18 45 22 Z" fill="#1a936f" />

      {/* Head */}
      <circle cx="50" cy="42" r="18" fill="#f4d4b1" stroke="#d4a874" strokeWidth="1" />

      {/* Surgical mask */}
      <path d="M 33 48 Q 50 46 67 48 L 67 62 Q 50 66 33 62 Z" fill="#e8f4f0" stroke="#b8d4cc" strokeWidth="1" />
      <path d="M 33 48 L 28 46 L 28 54 L 33 52 Z" fill="#e8f4f0" stroke="#b8d4cc" strokeWidth="1" />
      <path d="M 67 48 L 72 46 L 72 54 L 67 52 Z" fill="#e8f4f0" stroke="#b8d4cc" strokeWidth="1" />
      {/* Mask pleats */}
      <line x1="35" y1="52" x2="65" y2="52" stroke="#b8d4cc" strokeWidth="0.5" />
      <line x1="35" y1="57" x2="65" y2="57" stroke="#b8d4cc" strokeWidth="0.5" />

      {/* Eyes (visible above mask) */}
      <circle cx="43" cy={eyeY} r="2" fill="#333" />
      <circle cx="57" cy={eyeY} r="2" fill="#333" />
      {/* Eyebrows */}
      <line x1="40" y1="34" x2="46" y2="33" stroke="#d4a874" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="54" y1="33" x2="60" y2="34" stroke="#d4a874" strokeWidth="1.5" strokeLinecap="round" />

      {/* Mouth (behind mask — only visible when talking) */}
      {talking && <path d={mouthPath} fill="none" stroke="#8B4513" strokeWidth="1.5" strokeLinecap="round" />}

      {/* Scrubs (body) */}
      <path d="M 30 64 Q 50 58 70 64 L 74 92 Q 50 98 26 92 Z" fill="#1a936f" />
      {/* V-neck collar */}
      <path d="M 42 64 L 50 74 L 58 64" fill="none" stroke="#15967b" strokeWidth="2" />
      {/* Stethoscope on chest */}
      <path d="M 40 70 Q 38 78 42 84 Q 46 88 50 86" fill="none" stroke="#9aa3b8" strokeWidth="1.5" />
      <circle cx="50" cy="86" r="2.5" fill="#9aa3b8" />

      {/* Surgical cross badge */}
      <rect x="64" y="72" width="8" height="8" rx="1" fill="#fff" opacity="0.9" />
      <path d="M 67 73 L 69 73 L 69 75 L 71 75 L 71 77 L 69 77 L 69 79 L 67 79 L 67 77 L 65 77 L 65 75 L 67 75 Z" fill="#e23838" />
    </svg>
  );
}

/**
 * Render a message string with tactics terms as clickable links.
 * Splits the text on tactic keywords and wraps matches in <Link>.
 */
function renderWithTacticLinks(text) {
  if (!text) return text;

  // Build a regex that matches any tactic keyword (case-insensitive)
  const keywords = TACTIC_KEYWORDS.map((k) => k.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${keywords.join("|")})`, "gi");

  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (!part) return null;
    const match = TACTIC_KEYWORDS.find(
      (k) => k.term.toLowerCase() === part.toLowerCase()
    );
    if (match) {
      return (
        <Link key={i} href={`/learn/${match.slug}`} className="tactic-link">
          {part}
        </Link>
      );
    }
    return <span key={i}>{part}</span>;
  });
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
        <CoachAvatar talking={false} mood={mood} />
        <div className="coach-bubble">
          {message
            ? renderWithTacticLinks(message)
            : (isThinking
              ? "Analyzing your move..."
              : "Make a move and I'll coach you through it!")}
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
