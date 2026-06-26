/**
 * Chess openings for the /openings page.
 * Each opening has a name, description, and a sequence of moves in SAN.
 * The moves are played on the board with highlights and coach advice.
 */

export const OPENINGS = [
  {
    slug: "italian-game",
    name: "Italian Game",
    description:
      "A classic opening for beginners. White develops the bishop to an active diagonal, controls the center, and prepares to castle quickly.",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bc4"],
    tips: [
      "The bishop on c4 eyes the f7 square — Black's weakest point",
      "Both sides fight for the center with e4/e5 pawns",
      "White is ready to castle kingside on the next move",
    ],
  },
  {
    slug: "ruy-lopez",
    name: "Ruy Lopez",
    description:
      "One of the oldest and most respected openings. White pins the knight on c6, putting pressure on Black's defense of the e5 pawn.",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"],
    tips: [
      "The bishop on b5 pins the knight, indirectly pressuring e5",
      "If Black's knight moves, White can potentially win the e5 pawn",
      "This opening leads to rich middlegame positions with slow maneuvering",
    ],
  },
  {
    slug: "sicilian-defense",
    name: "Sicilian Defense",
    description:
      "Black's most aggressive response to e4. Instead of mirroring, Black fights for the center asymmetrically, leading to sharp tactical battles.",
    moves: ["e4", "c5"],
    tips: [
      "Black controls d4 with the c5 pawn — the fight for d4 defines this opening",
      "The asymmetry means both sides can play for a win",
      "White usually follows up with developing moves and castling",
    ],
  },
  {
    slug: "french-defense",
    name: "French Defense",
    description:
      "A solid opening where Black builds a strong pawn chain. Black accepts a cramped position in exchange for solid structure and counterplay on the queenside.",
    moves: ["e4", "e6", "d4", "d5"],
    tips: [
      "Black challenges the center with d5, attacking the e4 pawn",
      "The e6 pawn supports d5, creating a solid pawn chain",
      "Black will aim for counterplay with ...c5 and ...Qb6",
    ],
  },
  {
    slug: "queens-gambit",
    name: "Queen's Gambit",
    description:
      "White offers a pawn to gain central control. Despite the name, it's not a true sacrifice — Black can't easily hold the pawn.",
    moves: ["d4", "d5", "c4"],
    tips: [
      "White offers the c4 pawn to divert Black's d5 pawn",
      "If Black captures, White controls the center with e4",
      "This is one of the most solid and respected openings in chess",
    ],
  },
  {
    slug: "kings-indian-defense",
    name: "King's Indian Defense",
    description:
      "A hypermodern opening where Black lets White build a big center, then attacks it with pawn breaks. Leads to sharp attacking play.",
    moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7"],
    tips: [
      "Black fianchettoes the bishop to g7, eyeing the long diagonal",
      "Black plans to attack White's center with ...e5 or ...c5",
      "The king will castle kingside behind the fianchettoed bishop",
    ],
  },
  {
    slug: "london-system",
    name: "London System",
    description:
      "A solid, easy-to-learn system where White develops the bishop to f4 and builds a strong pawn structure. Great for beginners.",
    moves: ["d4", "d5", "Bf4"],
    tips: [
      "The bishop on f4 avoids being blocked by the e-pawn",
      "White builds a solid pawn structure with c4 or e3",
      "This system works against many Black responses, making it easy to learn",
    ],
  },
  {
    slug: "scandinavian-defense",
    name: "Scandinavian Defense",
    description:
      "Black immediately challenges the e4 pawn with the queen. Simple and direct — Black trades the center pawn and develops the queen early.",
    moves: ["e4", "d5", "exd5", "Qxd5"],
    tips: [
      "Black wins back the pawn but brings the queen out early",
      "After ...Qxd5, White gains a tempo by attacking the queen with Nc3",
      "Black usually retreats the queen to d6 or a5",
    ],
  },
];

export function getOpening(slug) {
  return OPENINGS.find((o) => o.slug === slug) || null;
}
