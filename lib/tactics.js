/**
 * Chess tactics definitions for the /learn/[tactic] pages.
 * Each tactic has a beginner-friendly explanation and an example FEN.
 */

export const TACTICS = {
  fork: {
    title: "Fork",
    shortDesc: "One piece attacks two or more pieces at the same time.",
    explanation:
      "A fork is when a single piece attacks two or more of your opponent's pieces at the same time. The classic example is a knight fork — the knight jumps to a square where it attacks both the king and the queen. Since the king must move out of check, the queen is captured for free on the next move. Knights are especially deadly at forking because they jump over other pieces and attack in unexpected directions.",
    fen: "r1b1k2r/ppppnppp/2n2q2/8/2P5/2N1P3/PP3PPP/R1BQKBNR w KQkq - 0 1",
    moveSuggestion: "Nf3-d5 forks the queen on e6 and creates threats.",
    tips: [
      "Knights are the best forkers — look for squares where your knight attacks two valuable pieces",
      "A 'family fork' attacks both the king and queen simultaneously",
      "Pawns can fork too — a pawn capture can attack two pieces at once",
      "Always check if your opponent can fork you before moving your pieces",
    ],
  },
  pin: {
    title: "Pin",
    shortDesc: "A piece can't move because a more valuable piece is behind it.",
    explanation:
      "A pin is when a piece is attacked and can't move because a more valuable piece is behind it. If the piece moves, the more valuable piece behind it would be captured. There are two types: an absolute pin (the piece is pinned to the king, so it legally can't move at all) and a relative pin (the piece could move, but it would lose a more valuable piece). Bishops, rooks, and queens can all create pins along their lines of attack.",
    fen: "rnbqkbnr/ppp2ppp/8/3pp3/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 1",
    moveSuggestion: "Bg5 pins the knight on f6 to the queen on d8.",
    tips: [
      "An absolute pin (to the king) means the pinned piece can't move at all",
      "Look for opportunities to pin a knight to the queen or king",
      "A pinned piece is a common target — pile more attackers on it",
      "Bishops are great at pinning along diagonals, rooks along files",
    ],
  },
  skewer: {
    title: "Skewer",
    shortDesc: "A valuable piece is attacked and must move, exposing a piece behind it.",
    explanation:
      "A skewer is the opposite of a pin. A valuable piece (usually the king) is attacked and must move, and when it does, the piece behind it is captured. Skewers are most common with bishops, rooks, and queens attacking along lines. A classic skewer is checking the king and forcing it to move, then capturing the queen that was behind it.",
    fen: "4k3/8/8/8/8/8/8/4K2R w - - 0 1",
    moveSuggestion: "Rh8+ skewers the king and wins whatever is behind it.",
    tips: [
      "Skewers work best when the more valuable piece is in front",
      "Check skewers are the most powerful — the king must move",
      "Look for skewers along open files and diagonals",
      "Skewers and pins are mirror images — in a skewer the valuable piece moves first",
    ],
  },
  "discovered-attack": {
    title: "Discovered Attack",
    shortDesc: "Moving one piece reveals an attack from another piece behind it.",
    explanation:
      "A discovered attack happens when you move one piece, and by moving it, you reveal an attack from another piece that was behind it. The piece you moved can create its own threat (like a check or capture), making it a 'double attack' — your opponent has to deal with two threats at once. A discovered check is especially powerful because the checking piece (the one that was revealed) can attack freely while the king is in check.",
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2P5/5N2/PP1PPPPP/RNBQKB1R w KQkq - 0 1",
    moveSuggestion: "Bb5 discovers an attack while creating another threat.",
    tips: [
      "A discovered check is one of the most powerful tactics in chess",
      "The moving piece can create a second threat, making it devastating",
      "Look for pieces lined up behind your own pieces",
      "Discovered attacks often win material because the opponent can only respond to one threat",
    ],
  },
  "back-rank": {
    title: "Back Rank Mate",
    shortDesc: "Checkmate along the back rank when the king is trapped by its own pawns.",
    explanation:
      "A back rank mate happens when a rook or queen checkmates the king on the back rank (the 8th rank for Black, 1st rank for White), and the king can't escape because its own pawns block its escape squares. This is one of the most common checkmating patterns, especially in the endgame. Always be aware of back rank weaknesses — a simple pawn move like h2-h3 can create an escape square and prevent this mate.",
    fen: "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1",
    moveSuggestion: "Ra8 is checkmate — the king is trapped by its own pawns.",
    tips: [
      "Always check if your opponent's king is trapped by its own pawns",
      "Create an escape square (luft) with a pawn move like h2-h3 or g2-g3",
      "Back rank mates are common — always watch for them in the endgame",
      "A rook on the 7th rank can often deliver back rank mate",
    ],
  },
  sacrifice: {
    title: "Sacrifice",
    shortDesc: "Giving up material to gain a tactical or positional advantage.",
    explanation:
      "A sacrifice is when you deliberately give up material (a piece or pawn) to achieve a bigger goal — usually a forced win, a checkmate, or a strong positional advantage. Sacrifices can be tactical (a forced combination that wins more material than you gave up) or positional (giving up material for long-term positional advantage). The key is that the sacrifice should lead to a concrete result, not just be giving away pieces for free.",
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1",
    moveSuggestion: "Bxf7+ is a classic sacrifice to expose the king.",
    tips: [
      "Only sacrifice if you can calculate a concrete result",
      "A good sacrifice forces the opponent into a worse position",
      "Common sacrifices: Bxh7+ (Greek gift), knight sacrifices on f7",
      "If you can't see the follow-through, don't sacrifice!",
    ],
  },
  deflection: {
    title: "Deflection",
    shortDesc: "Forcing a defending piece to move away from its defensive duty.",
    explanation:
      "A deflection is when you force an opponent's piece to move away from an important defensive role. For example, if a rook is defending the back rank, you might attack the rook with a threat it can't ignore, forcing it to move and abandoning its defensive post. This often leads to checkmate or material gain once the defender is gone.",
    fen: "6k1/6pp/8/8/8/8/5q2/6K1 w - - 0 1",
    moveSuggestion: "Qf1+ deflects or forces a weakening move.",
    tips: [
      "Look for overloaded defenders — pieces defending two things at once",
      "Attack the defender, not the thing it's defending",
      "Deflections often lead to checkmate when the defender was guarding the king",
      "A threat that can't be ignored (check, capture) is the best deflection",
    ],
  },
  decoy: {
    title: "Decoy",
    shortDesc: "Luring a piece to a square where it gets trapped or captured.",
    explanation:
      "A decoy is when you lure an opponent's piece to a specific square where it can be captured or trapped. Unlike a deflection (which forces a piece to leave), a decoy tempts or forces a piece to go TO a bad square. A classic example is luring the king to a square where it can be checkmated.",
    fen: "6k1/6pp/8/8/8/8/8/4R1K1 w - - 0 1",
    moveSuggestion: "Re8 decoys or forces the king toward a mating net.",
    tips: [
      "Decoys work best when the target square looks safe but isn't",
      "Lure the king into a mating net with a checking sequence",
      "Decoys and deflections are related but opposite — one pulls in, one pushes out",
      "Look for squares where a piece would be trapped after moving there",
    ],
  },
  "double-check": {
    title: "Double Check",
    shortDesc: "Two pieces check the king at the same time — only the king can move.",
    explanation:
      "A double check is when two pieces attack the king simultaneously. This almost always happens through a discovered attack — one piece moves, giving check itself while revealing a check from another piece. A double check is devastating because the king MUST move — you can't block or capture both checking pieces at once. Double checks often lead to checkmate.",
    fen: "6k1/6pp/8/8/8/8/8/3R2K1 w - - 0 1",
    moveSuggestion: "Rd8+ with a discovered check creates a double check.",
    tips: [
      "Double check means the king MUST move — no other response is possible",
      "Double checks are created by discovered attacks",
      "They're extremely powerful and often lead to checkmate",
      "Look for positions where moving one piece reveals another check",
    ],
  },
};

export const TACTIC_SLUGS = Object.keys(TACTICS);

export function getTactic(slug) {
  return TACTICS[slug] || null;
}

/**
 * List of tactic keywords to linkify in coach messages.
 * Returns array of { term, slug } for matching.
 */
export const TACTIC_KEYWORDS = [
  { term: "fork", slug: "fork" },
  { term: "forking", slug: "fork" },
  { term: "pinned", slug: "pin" },
  { term: "pin", slug: "pin" },
  { term: "pinning", slug: "pin" },
  { term: "skewer", slug: "skewer" },
  { term: "skewering", slug: "skewer" },
  { term: "discovered attack", slug: "discovered-attack" },
  { term: "discovered check", slug: "discovered-attack" },
  { term: "back rank", slug: "back-rank" },
  { term: "back-rank", slug: "back-rank" },
  { term: "sacrifice", slug: "sacrifice" },
  { term: "sacrificing", slug: "sacrifice" },
  { term: "deflection", slug: "deflection" },
  { term: "deflect", slug: "deflection" },
  { term: "decoy", slug: "decoy" },
  { term: "double check", slug: "double-check" },
];
