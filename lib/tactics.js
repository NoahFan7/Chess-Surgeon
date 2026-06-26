/**
 * Chess tactics definitions for the /learn/[tactic] pages.
 *
 * Each tactic has:
 * - title, shortDesc, explanation, tips
 * - examples: array of step-through examples, each with:
 *   - fen: starting position
 *   - moves: SAN move sequence showing the tactic
 *   - arrows: array of { from, to } showing the key tactical move(s)
 *   - explanations: per-move coaching text (same length as moves)
 *   - result: summary of what was won/achieved
 */

export const TACTICS = {
  fork: {
    title: "Fork",
    shortDesc: "One piece attacks two or more pieces at the same time.",
    explanation:
      "A fork is when a single piece attacks two or more of your opponent's pieces at the same time. The classic example is a knight fork — the knight jumps to a square where it attacks both the king and the queen. Since the king must move out of check, the queen is captured for free on the next move. Knights are especially deadly at forking because they jump over other pieces and attack in unexpected directions.",
    tips: [
      "Knights are the best forkers — look for squares where your knight attacks two valuable pieces",
      "A 'family fork' attacks both the king and queen simultaneously",
      "Pawns can fork too — a pawn capture can attack two pieces at once",
      "Always check if your opponent can fork you before moving your pieces",
    ],
    examples: [
      {
        fen: "8/4k3/8/8/5q2/2N5/8/4K3 w - - 0 1",
        moves: ["Nd5+", "Kd6", "Nxf4"],
        arrows: [{ from: "c3", to: "d5" }],
        explanations: [
          "The knight jumps to d5, giving check to the king on e7 AND attacking the queen on f4 at the same time. This is a fork — two attacks with one move!",
          "The king must respond to the check and move away. It can't capture the knight or block it (you can't block a knight check). The king steps to d6.",
          "Now that the king is out of the way, the knight captures the queen on f4. White has won a queen for free — all from one well-placed knight move!",
        ],
        result: "White wins the queen for free. A knight on d5 forked the king and queen — the king had to move, and the queen was captured.",
      },
    ],
  },
  pin: {
    title: "Pin",
    shortDesc: "A piece can't move because a more valuable piece is behind it.",
    explanation:
      "A pin is when a piece is attacked and can't move because a more valuable piece is behind it. If the piece moves, the more valuable piece behind it would be captured. There are two types: an absolute pin (the piece is pinned to the king, so it legally can't move at all) and a relative pin (the piece could move, but it would lose a more valuable piece). Bishops, rooks, and queens can all create pins along their lines of attack.",
    tips: [
      "An absolute pin (to the king) means the pinned piece can't move at all",
      "Look for opportunities to pin a knight to the queen or king",
      "A pinned piece is a common target — pile more attackers on it",
      "Bishops are great at pinning along diagonals, rooks along files",
    ],
    examples: [
      {
        fen: "3qk3/8/5n2/8/8/8/8/2B1K3 w - - 0 1",
        moves: ["Bg5", "Qd7", "Bxf6"],
        arrows: [{ from: "c1", to: "g5" }],
        explanations: [
          "White plays Bg5, pinning the knight on f6 to the queen on d8. The knight can't move — if it does, the bishop captures the queen. This is a relative pin. Notice how the bishop, knight, and queen are all lined up on the same diagonal.",
          "Black saves the queen by moving it to d7. But this abandons the knight — it's still pinned and now has no protection.",
          "White captures the knight with Bxf6. Black can't recapture — the queen on d7 can't reach f6, and the king on e8 isn't close enough. White wins a knight thanks to the pin!",
        ],
        result: "White wins a knight by pinning it to the queen. The pinned piece couldn't escape and was captured.",
      },
    ],
  },
  skewer: {
    title: "Skewer",
    shortDesc: "A valuable piece is attacked and must move, exposing a piece behind it.",
    explanation:
      "A skewer is the opposite of a pin. A valuable piece (usually the king) is attacked and must move, and when it does, the piece behind it is captured. Skewers are most common with bishops, rooks, and queens attacking along lines. A classic skewer is checking the king and forcing it to move, then capturing the queen that was behind it.",
    tips: [
      "Skewers work best when the more valuable piece is in front",
      "Check skewers are the most powerful — the king must move",
      "Look for skewers along open files and diagonals",
      "Skewers and pins are mirror images — in a skewer the valuable piece moves first",
    ],
    examples: [
      {
        fen: "4q3/4k3/8/8/8/8/8/3K3R w - - 0 1",
        moves: ["Re1+", "Kd7", "Rxe8"],
        arrows: [{ from: "h1", to: "e1" }],
        explanations: [
          "The rook moves to e1, giving check to the king on e7. But look — the queen is on e8, directly behind the king on the same file! This is a skewer: the king is in front, the queen is behind.",
          "The king must move out of check. It can't block the check (no pieces to interpose) and can't capture the rook (too far away). The king steps to d7, off the e-file.",
          "Now that the king has moved, the rook captures the queen on e8. White has won a queen using a skewer — the king was forced to move and exposed the queen behind it!",
        ],
        result: "White wins the queen. The rook skewered the king and queen — the king had to move, and the queen was captured.",
      },
    ],
  },
  "discovered-attack": {
    title: "Discovered Attack",
    shortDesc: "Moving one piece reveals an attack from another piece behind it.",
    explanation:
      "A discovered attack happens when you move one piece, and by moving it, you reveal an attack from another piece that was behind it. The piece you moved can create its own threat (like a check or capture), making it a 'double attack' — your opponent has to deal with two threats at once. A discovered check is especially powerful because the checking piece (the one that was revealed) can attack freely while the king is in check.",
    tips: [
      "A discovered check is one of the most powerful tactics in chess",
      "The moving piece can create a second threat, making it devastating",
      "Look for pieces lined up behind your own pieces",
      "Discovered attacks often win material because the opponent can only respond to one threat",
    ],
    examples: [
      {
        fen: "4q1k1/3N4/2B5/8/8/8/8/6K1 w - - 0 1",
        moves: ["Nf6+", "Kf7", "Bxe8"],
        arrows: [{ from: "d7", to: "f6" }, { from: "c6", to: "e8" }],
        explanations: [
          "The knight on d7 jumps to f6, giving check to the king on g8. But here's the key: by moving the knight, the bishop on c6 is now revealed — it attacks along the c6-d7-e8 diagonal straight at the queen on e8! This is a discovered attack. The king must respond to the knight check, but the bishop is attacking the queen.",
          "The king moves to f7 to escape the knight's check. But now the queen on e8 is completely undefended — the bishop's attack is no longer blocked by the knight.",
          "The bishop captures the queen on e8. And the king can't even recapture — the knight on f6 defends e8! White has won the queen completely for free using a discovered attack. The knight move revealed the bishop's attack, and Black couldn't defend both threats at once.",
        ],
        result: "White wins the queen for free. Moving the knight revealed the bishop's attack on the queen, and the knight defends the capture square so the king can't recapture.",
      },
    ],
  },
  "back-rank": {
    title: "Back Rank Mate",
    shortDesc: "Checkmate along the back rank when the king is trapped by its own pawns.",
    explanation:
      "A back rank mate happens when a rook or queen checkmates the king on the back rank (the 8th rank for Black, 1st rank for White), and the king can't escape because its own pawns block its escape squares. This is one of the most common checkmating patterns, especially in the endgame. Always be aware of back rank weaknesses — a simple pawn move like h2-h3 can create an escape square and prevent this mate.",
    tips: [
      "Always check if your opponent's king is trapped by its own pawns",
      "Create an escape square (luft) with a pawn move like h2-h3 or g2-g3",
      "Back rank mates are common — always watch for them in the endgame",
      "A rook on the 7th rank can often deliver back rank mate",
    ],
    examples: [
      {
        fen: "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1",
        moves: ["Ra8#"],
        arrows: [{ from: "a1", to: "a8" }],
        explanations: [
          "The rook moves to a8, delivering checkmate! The black king on g8 is trapped — it can't move to f8 or h8 (the rook controls the entire 8th rank), and it can't move to f7, g7, or h7 because its own pawns are there. The king is suffocated by its own pawns. This is the classic back rank mate.",
        ],
        result: "Checkmate! The king was trapped on the back rank by its own pawns. A simple h7-h6 earlier would have created an escape square.",
      },
    ],
  },
  sacrifice: {
    title: "Sacrifice",
    shortDesc: "Giving up material to gain a tactical or positional advantage.",
    explanation:
      "A sacrifice is when you deliberately give up material (a piece or pawn) to achieve a bigger goal — usually a forced win, a checkmate, or a strong positional advantage. Sacrifices can be tactical (a forced combination that wins more material than you gave up) or positional (giving up material for long-term positional advantage). The key is that the sacrifice should lead to a concrete result, not just be giving away pieces for free.",
    tips: [
      "Only sacrifice if you can calculate a concrete result",
      "A good sacrifice forces the opponent into a worse position",
      "Common sacrifices: Bxh7+ (Greek gift), knight sacrifices on f7",
      "If you can't see the follow-through, don't sacrifice!",
    ],
    examples: [
      {
        fen: "6k1/5qpp/8/8/8/8/5PPP/3R2K1 w - - 0 1",
        moves: ["Rd8+", "Qf8", "Rxf8+", "Kxf8"],
        arrows: [{ from: "d1", to: "d8" }],
        explanations: [
          "White plays Rd8+, sacrificing the rook by putting it on d8 where it can be captured. But the real idea is to deflect the queen from its defensive post. The rook gives check along the 8th rank.",
          "Black must block the check. The queen on f7 steps to f8, interposing. Now the queen is on f8, directly in front of the rook — and the king is behind it.",
          "White captures the queen with Rxf8+! This is the payoff — the rook captures the queen and gives check to the king. The sacrifice of the rook has won the queen.",
          "The king recaptures the rook on f8. But White has traded a rook (5 points) for a queen (9 points) — a net gain of 4 points! The sacrifice was calculated and forced.",
        ],
        result: "White wins a queen for a rook. The rook sacrifice deflected the queen into a capture, winning material. Net gain: +4 points.",
      },
    ],
  },
  deflection: {
    title: "Deflection",
    shortDesc: "Forcing a defending piece to move away from its defensive duty.",
    explanation:
      "A deflection is when you force an opponent's piece to move away from an important defensive role. For example, if a rook is defending the back rank, you might attack the rook with a threat it can't ignore, forcing it to move and abandoning its defensive post. This often leads to checkmate or material gain once the defender is gone.",
    tips: [
      "Look for overloaded defenders — pieces defending two things at once",
      "Attack the defender, not the thing it's defending",
      "Deflections often lead to checkmate when the defender was guarding the king",
      "A threat that can't be ignored (check, capture) is the best deflection",
    ],
    examples: [
      {
        fen: "5rk1/5ppp/8/8/8/8/5PPP/3QR1K1 w - - 0 1",
        moves: ["Qd8", "Rxd8", "Re8#"],
        arrows: [{ from: "d1", to: "d8" }],
        explanations: [
          "The black rook on f8 is guarding the back rank — it prevents White from delivering checkmate on the 8th rank. White plays Qd8, attacking the rook and threatening Qxf8#. The rook is overloaded — it must either capture the queen or be lost.",
          "Black captures the queen with Rxd8. This is the deflection — the rook has been dragged away from its defensive post on f8. The rook is now on d8, and the back rank is undefended!",
          "White plays Re8#, checkmate! The rook moves from e1 to e8, checking the king. The king can't escape — pawns on f7, g7, h7 block all escape squares, and the rook controls the entire 8th rank. The deflection of the defending rook made this mate possible.",
        ],
        result: "Checkmate! White deflected the defending rook from f8 with a queen sacrifice, then delivered back rank mate.",
      },
      {
        fen: "5rk1/4bppp/8/8/8/8/5PPP/3QR1K1 w - - 0 1",
        moves: ["Qd8", "Bxd8", "Re8#"],
        arrows: [{ from: "d1", to: "d8" }],
        explanations: [
          "This time it's not a rook but a bishop on e7 that's defending the back rank. The bishop guards the f8 square, preventing White's rook from delivering mate there. White plays Qd8, attacking the bishop and offering the queen as a sacrifice.",
          "The bishop captures the queen with Bxd8. The deflection worked — the bishop has been dragged away from e7, and the critical f8 square is now undefended. The bishop couldn't refuse the capture because the queen was attacking it.",
          "White plays Re8#, checkmate! The rook slides to e8, and the king is trapped by its own pawns on f7, g7, h7. Without the bishop guarding f8, there was nothing Black could do. A different piece, the same devastating deflection idea.",
        ],
        result: "Checkmate! White deflected the defending bishop from e7 with a queen sacrifice, then delivered back rank mate.",
      },
    ],
  },
  decoy: {
    title: "Decoy",
    shortDesc: "Luring a piece to a square where it gets trapped or captured.",
    explanation:
      "A decoy is when you lure an opponent's piece to a specific square where it can be captured or trapped. Unlike a deflection (which forces a piece to leave), a decoy tempts or forces a piece to go TO a bad square. A classic example is luring the king to a square where it can be checkmated.",
    tips: [
      "Decoys work best when the target square looks safe but isn't",
      "Lure the king into a mating net with a checking sequence",
      "Decoys and deflections are related but opposite — one pulls in, one pushes out",
      "Look for squares where a piece would be trapped after moving there",
    ],
    examples: [
      {
        fen: "6k1/6pp/8/8/3Q4/8/8/5RK1 w - - 0 1",
        moves: ["Rf8+", "Kxf8", "Qd8#"],
        arrows: [{ from: "f1", to: "f8" }, { from: "d4", to: "d8" }],
        explanations: [
          "White plays Rf8+, sacrificing the rook with check! The king on g8 is in check and must respond. The only way to deal with the check is to capture the rook with Kxf8 — the king is lured to f8, a square it would never go to voluntarily. This is the decoy.",
          "The king captures the rook on f8. Now the king is exposed on f8 — away from its safe corner behind the pawns. The decoy worked perfectly: the king has been dragged to a square where it can be checkmated.",
          "White plays Qd8#, checkmate! The queen swings from d4 to d8, delivering mate along the 8th rank. The king on f8 can't escape — the queen controls the entire 8th rank, and the pawns on g7 and h7 block the king's escape squares. The decoy set up the mate.",
        ],
        result: "Checkmate! White decoyed the king to f8 with a rook sacrifice, then delivered queen mate on the 8th rank.",
      },
    ],
  },
  "double-check": {
    title: "Double Check",
    shortDesc: "Two pieces check the king at the same time — only the king can move.",
    explanation:
      "A double check is when two pieces attack the king simultaneously. This almost always happens through a discovered attack — one piece moves, giving check itself while revealing a check from another piece. A double check is devastating because the king MUST move — you can't block or capture both checking pieces at once. Double checks often lead to checkmate.",
    tips: [
      "Double check means the king MUST move — no other response is possible",
      "Double checks are created by discovered attacks",
      "They're extremely powerful and often lead to checkmate",
      "Look for positions where moving one piece reveals another check",
    ],
    examples: [
      {
        fen: "6k1/5Npp/8/8/2B5/8/8/4K3 w - - 0 1",
        moves: ["Nh6+", "Kf8"],
        arrows: [{ from: "f7", to: "h6" }, { from: "c4", to: "g8" }],
        explanations: [
          "The knight on f7 jumps to h6, giving check to the king on g8 (a knight on h6 attacks g8). But that's not all — by moving the knight off f7, the bishop on c4 is now revealed! The bishop attacks along the c4-d5-e6-f7-g8 diagonal, straight at the king. This is a double check — the king is attacked by BOTH the knight and the bishop at the same time!",
          "When facing a double check, the king MUST move. You can't block (there are two separate lines of attack), and you can't capture both checking pieces. The king steps to f8, the only safe square. Double checks are the most forcing moves in chess — the opponent has no choice but to move the king.",
        ],
        result: "The double check forced the king to move to f8. Double checks are devastating because the king has no option but to move — no blocking, no capturing.",
      },
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
