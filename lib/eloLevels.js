/**
 * ELO presets for the Stockfish bot.
 *
 * Stockfish exposes two relevant UCI options:
 *   - "Skill Level" (0-20): adds deliberate errors / blunders at low values
 *   - "UCI_LimitStrength" + "UCI_Elo": caps strength to an approximate ELO
 *     (not all builds support this; depth + skill is the reliable combo)
 *
 * We combine a depth cap with a skill level to approximate target ELOs.
 * Lower depth  = shallower search (misses tactics)
 * Lower skill  = more random / suboptimal move selection
 */

export const ELO_PRESETS = [
  {
    elo: 400,
    label: "Beginner",
    description: "Just learning the rules. Makes obvious mistakes.",
    depth: 2,
    skillLevel: 0,
    movetime: 200,
  },
  {
    elo: 800,
    label: "Novice",
    description: "Knows the basics. Occasionally hangs pieces.",
    depth: 3,
    skillLevel: 3,
    movetime: 300,
  },
  {
    elo: 1100,
    label: "Casual",
    description: "Plays solid openings, misses deeper tactics.",
    depth: 4,
    skillLevel: 6,
    movetime: 400,
  },
  {
    elo: 1400,
    label: "Club",
    description: "Sees short tactics, decent positional sense.",
    depth: 6,
    skillLevel: 10,
    movetime: 600,
  },
  {
    elo: 1700,
    label: "Tournament",
    description: "Strong club player. Rarely blunders.",
    depth: 8,
    skillLevel: 14,
    movetime: 800,
  },
  {
    elo: 2000,
    label: "Expert",
    description: "Expert-level play. Hard to beat.",
    depth: 12,
    skillLevel: 17,
    movetime: 1200,
  },
  {
    elo: 2400,
    label: "Master",
    description: "Near-optimal engine strength.",
    depth: 16,
    skillLevel: 20,
    movetime: 2000,
  },
];

export const DEFAULT_ELO = 1100;

export function getPresetByElo(elo) {
  return (
    ELO_PRESETS.find((p) => p.elo === elo) ||
    ELO_PRESETS.reduce((closest, p) =>
      Math.abs(p.elo - elo) < Math.abs(closest.elo - elo) ? p : closest
    )
  );
}
