/**
 * Chess openings for the /openings page.
 *
 * Each opening has:
 * - slug, name, description
 * - ideas: core strategic principles for this opening
 * - lines: named variations, each with:
 *   - name: the variation name
 *   - moves: array of SAN strings
 *   - explanations: per-move coaching advice (same length as moves)
 *   - strategy: what both sides are trying to achieve in this line
 */

export const OPENINGS = [
  {
    slug: "italian-game",
    name: "Italian Game",
    description:
      "A classic opening where White develops the bishop to an active diagonal, controls the center, and prepares to castle. One of the oldest and most beginner-friendly openings.",
    ideas: [
      "White targets the f7 square — Black's weakest point, defended only by the king",
      "Both sides fight for the center with e4 and e5 pawns",
      "Rapid development and king safety via castling are the priorities",
      "Watch for tactical opportunities along the c4-f7 diagonal",
    ],
    lines: [
      {
        name: "Main Line",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4"],
        explanations: [
          "White stakes a claim in the center. The e4 pawn controls d5 and f5, key central squares.",
          "Black mirrors with e5, fighting for an equal share of the center. This is the most classical response.",
          "White develops the knight to f3, attacking Black's e5 pawn. This is the most natural developing move — it controls central squares and creates an immediate threat.",
          "Black develops the knight to c6, defending the e5 pawn. This is the standard reply — the knight protects e5 and controls d4 and e7.",
          "White develops the bishop to c4, placing it on an active diagonal aimed directly at f7. This sets up threats against Black's weakest square.",
        ],
        strategy:
          "White has a clear plan: castle kingside, bring the queen's knight to d2-f3 or c3, and build pressure on f7. Black should respond with ...Bc5 (mirroring) or ...Be7 (solid), then castle. Both sides aim for rapid development and central control.",
      },
      {
        name: "Giuoco Piano",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5"],
        explanations: [
          "White stakes a claim in the center with e4, controlling d5 and f5.",
          "Black mirrors with e5, establishing an equal central presence.",
          "White develops the knight to f3, attacking e5 and controlling central squares.",
          "Black defends e5 with the knight on c6, while also controlling d4.",
          "White places the bishop on c4, targeting the f7 square along the a2-f7 diagonal.",
          "Black mirrors with Bc5, targeting f2 in return. This is the 'Quiet Game' — both sides have symmetric development plans and the position is roughly equal.",
        ],
        strategy:
          "Both sides have identical development plans: castle, develop the remaining minor pieces, and connect rooks. White often follows with c3 and d4 to challenge the center. Black should respond with ...Qe7 or ...d6 to support the e5 pawn. The position is balanced but tactically rich.",
      },
      {
        name: "Evans Gambit",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "b4"],
        explanations: [
          "White stakes a claim in the center with e4.",
          "Black mirrors with e5 for equal central control.",
          "White develops the knight to f3, attacking e5.",
          "Black defends e5 with Nc6, the standard developing move.",
          "White develops the bishop to c4, aiming at f7.",
          "White sacrifices a pawn with b4! The idea is to deflect Black's knight from c6, then play c3 and d4 to build a massive pawn center. This is a sharp, aggressive choice.",
        ],
        strategy:
          "If Black accepts the gambit (Nxb4), White follows with c3, a3, and d4, building a dominant pawn center and rapid development. Black must decide whether to hold the pawn (risky) or return it for development. White gets attacking chances but must prove compensation for the material.",
      },
    ],
  },
  {
    slug: "ruy-lopez",
    name: "Ruy Lopez",
    description:
      "One of the oldest and most respected openings in chess. White pins the knight on c6, creating indirect pressure on Black's e5 pawn. This opening leads to rich, strategic middlegames.",
    ideas: [
      "The bishop on b5 pins the c6 knight, indirectly pressuring e5",
      "White aims to build pressure slowly, often with c3 and d4",
      "Black must carefully defend the e5 pawn while developing",
      "The game often transitions into deep maneuvering battles",
    ],
    lines: [
      {
        name: "Main Line",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"],
        explanations: [
          "White takes central space with e4, controlling d5 and f5.",
          "Black responds with e5, establishing equal central control.",
          "White develops with Nf3, attacking Black's e5 pawn.",
          "Black defends e5 with Nc6, the most natural developing move.",
          "White plays the defining move: Bb5. The bishop pins the knight, creating an indirect threat against e5. If the knight moves, White may be able to win the e5 pawn. This is one of the deepest opening moves in chess.",
        ],
        strategy:
          "White's plan is to build pressure with c3, d4, and O-O, eventually challenging in the center. Black typically plays ...a6 to question the bishop, then develops with ...Nf6, ...Be7, and ...O-O. The position is strategically complex and rewards patient play.",
      },
      {
        name: "Morphy Defense",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6"],
        explanations: [
          "White takes the center with e4.",
          "Black mirrors with e5.",
          "White develops with Nf3, attacking e5.",
          "Black defends with Nc6.",
          "White pins the knight with Bb5, pressuring e5 indirectly.",
          "Black plays a6, forcing White to make a decision about the bishop. This is the most popular and flexible response — Black gains space on the queenside and questions White's intent.",
        ],
        strategy:
          "After a6, White usually retreats with Ba4 (keeping the pin) or exchanges with Bxc6 (damaging Black's pawn structure). Black follows with ...Nf6, ...Be7, and ...O-O. The main line leads to deep maneuvering positions where both sides slowly improve their pieces. The player with better strategic understanding often prevails.",
      },
      {
        name: "Exchange Variation",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Bxc6", "dxc6"],
        explanations: [
          "White opens with e4 for central control.",
          "Black mirrors with e5.",
          "White develops the knight, attacking e5.",
          "Black defends with Nc6.",
          "White pins the knight with Bb5.",
          "Black challenges the bishop with a6.",
          "White exchanges the bishop for the knight. This damages Black's pawn structure — Black will have doubled c-pawns. White gives up the bishop pair for a structural advantage.",
          "Black recaptures with the d-pawn, accepting the doubled pawns. Black gets the bishop pair as compensation and a half-open d-file, but the pawn structure is permanently weakened.",
        ],
        strategy:
          "White aims to exploit the doubled c-pawns by pressuring the d-file and eventually playing d4. The position is slightly better for White structurally, but Black has the bishop pair and active piece play. This is a solid, positional choice for White — less theoretical than the main line but strategically clear.",
      },
    ],
  },
  {
    slug: "sicilian-defense",
    name: "Sicilian Defense",
    description:
      "Black's most aggressive and popular response to e4. Instead of mirroring with e5, Black fights for the center asymmetrically with c5, leading to sharp, double-edged positions where both sides can play for a win.",
    ideas: [
      "Black controls d4 with the c5 pawn — the fight for d4 defines the opening",
      "The asymmetrical structure means both sides can play for a win",
      "Black often gets queenside counterplay while White attacks kingside",
      "This opening leads to the most theoretically complex positions in chess",
    ],
    lines: [
      {
        name: "Open Sicilian",
        moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4"],
        explanations: [
          "White takes the center with e4.",
          "Black plays c5 — the Sicilian! Instead of mirroring, Black fights for d4 from the flank. This asymmetry is what makes the Sicilian so sharp.",
          "White develops the knight and prepares d4 to challenge Black's control.",
          "Black plays d6, preparing to develop the bishop to g7 (fianchetto) or e7 while supporting the e5 break. This is the most flexible setup.",
          "White plays d4, opening the center. This is the defining moment of the Open Sicilian — the position becomes tactically sharp.",
          "Black captures on d4, trading the flank pawn for a central pawn. This is the whole point of playing c5 — Black equalizes in the center.",
          "White recaptures with the knight, placing it on a strong central square. White now has space and development, but Black has trumps of their own.",
        ],
        strategy:
          "White typically follows with Nc3, Be2, O-O, and builds a kingside attack. Black develops with ...Nf6, ...a6, ...e5 or ...e6, and launches queenside counterplay with ...Qb6, ...Rc8, and ...b5. Both sides have clear attacking plans on opposite wings. The player who attacks faster usually wins.",
      },
      {
        name: "Najdorf Variation",
        moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"],
        explanations: [
          "White takes the center with e4.",
          "Black plays the Sicilian with c5.",
          "White develops and prepares d4.",
          "Black plays d6, supporting the e5 break and bishop development.",
          "White opens the center with d4.",
          "Black trades the flank pawn for a central pawn.",
          "White recaptures with the knight on d4.",
          "Black develops the knight to f6, attacking the e4 pawn. This forces White to respond.",
          "White defends e4 with Nc3, developing while protecting the pawn.",
          "Black plays a6 — the defining Najdorf move! Black prepares ...b5 for queenside expansion, controls b5 (preventing White's pieces from using it), and keeps options flexible. This is the most theoretically analyzed move in chess.",
        ],
        strategy:
          "The Najdorf is the Rolls-Royce of Sicilian variations. Black's plan: ...e5 to gain central space (creating a small plus on d4), then ...Be7, ...O-O, ...b5, and ...Bb7 for queenside pressure. White usually plays Be2, O-O, Be3 or Bg5, and launches a kingside attack with f3, g4, h4. Both sides have violent attacking chances — the player who executes their plan first wins.",
      },
      {
        name: "Dragon Variation",
        moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "g6"],
        explanations: [
          "White takes the center with e4.",
          "Black plays the Sicilian with c5.",
          "White develops and prepares d4.",
          "Black supports with d6.",
          "White opens the center with d4.",
          "Black trades for a central pawn.",
          "White places the knight on d4.",
          "Black develops the knight to f6, attacking e4.",
          "White defends with Nc3.",
          "Black fianchettoes with g6 — the Dragon! The bishop will go to g7, controlling the long a1-h8 diagonal. This setup is extremely resilient — the Dragon bishop breathes fire down the long diagonal.",
        ],
        strategy:
          "Black's plan: ...Bg7, ...O-O, and then ...a6, ...b5, ...Bb7 for queenside counterplay. The Dragon bishop on g7 is the key piece — it defends the king and eyes White's queenside. White typically plays Be3, Qd2, O-O-O, and launches a pawn storm with h4, h5, and g4. This is one of the sharpest, most violent variations in chess — both sides race to attack the enemy king.",
      },
    ],
  },
  {
    slug: "french-defense",
    name: "French Defense",
    description:
      "A solid, strategic opening where Black builds a strong pawn chain. Black accepts a cramped position in exchange for solid structure and counterplay on the queenside. The light-squared bishop is often the key strategic question.",
    ideas: [
      "Black builds a pawn chain with e6 and d5, challenging the center",
      "Black's light-squared bishop (c8) is often trapped — freeing it is a key strategic theme",
      "Counterplay comes from ...c5 attacking the d4 pawn and ...Qb6 pressuring d4",
      "Black's position is solid but requires patience and strategic understanding",
    ],
    lines: [
      {
        name: "Advance Variation",
        moves: ["e4", "e6", "d4", "d5", "e5"],
        explanations: [
          "White takes the center with e4.",
          "Black plays e6, preparing ...d5 without committing too early. This flexible move supports the d5 advance and keeps options open.",
          "White establishes a big pawn on d4, taking central space.",
          "Black strikes back with d5, challenging White's e4 pawn. This is the defining move of the French — Black attacks the base of White's pawn chain.",
          "White advances with e5, creating a space advantage and locking the pawn structure. This is the Advance Variation — White gets a big pawn chain but gives Black a clear target on d4.",
        ],
        strategy:
          "Black's plan is clear: play ...c5 to attack the d4 pawn, develop with ...Nc6, ...Qb6 (pressuring d4), ...Nf6, ...Be7, and ...O-O. The light-squared bishop is Black's problem piece — it's trapped behind the e6 pawn. Black often plays ...f6 to break it free, or maneuvers it around. White should hold the center, develop with Nf3, Be2, and castle, then attack on the kingside.",
      },
      {
        name: "Exchange Variation",
        moves: ["e4", "e6", "d4", "d5", "exd5", "exd5"],
        explanations: [
          "White takes the center with e4.",
          "Black prepares ...d5 with e6.",
          "White establishes d4.",
          "Black challenges with d5.",
          "White exchanges on d5, simplifying the position. This avoids the complexity of the French and leads to a more positional game.",
          "Black recaptures with the e-pawn, freeing the light-squared bishop! This is one of the main advantages for Black in the Exchange — the problem bishop is immediately activated.",
        ],
        strategy:
          "The position is symmetrical and roughly equal. Black has freed the light-squared bishop (the main strategic problem in the French) and has a solid pawn structure. White has a slight space advantage. Both sides develop normally with Nf3, Bd3/Nc3, O-O. Black plays ...Nf6, ...Bd6, ...O-O. This is a quiet, positional line — good for players who want to avoid French theory.",
      },
      {
        name: "Winawer Variation",
        moves: ["e4", "e6", "d4", "d5", "Nc3", "Bb4"],
        explanations: [
          "White takes the center with e4.",
          "Black prepares ...d5 with e6.",
          "White establishes d4.",
          "Black challenges with d5.",
          "White develops the knight to c3, defending the e4 pawn.",
          "Black pins the knight with Bb4! This is the Winawer — the sharpest and most principled French variation. Black is willing to give up the bishop pair to damage White's pawn structure.",
        ],
        strategy:
          "The critical line continues with exd5, Qxd5, Bxc3+, bxc3 — White gets doubled c-pawns but a strong center with d4 and the bishop pair. Black plays ...Qd7, ...Nc6, ...Rd8, and aims for ...c5 and ...f6. White's plan is to advance in the center with c4 and d5, and use the two bishops. This is a deeply strategic, unbalanced position — one of the most studied in chess theory.",
      },
    ],
  },
  {
    slug: "queens-gambit",
    name: "Queen's Gambit",
    description:
      "White offers a pawn to gain central control. Despite the name 'gambit,' it's not a true sacrifice — Black can't easily hold the pawn. This is one of the most solid and respected openings in chess.",
    ideas: [
      "White offers the c4 pawn to divert Black's d5 pawn, then builds a center with e4",
      "If Black captures, White gains central control and rapid development",
      "The opening leads to positional, strategic battles",
      "Black has several solid ways to decline or accept the gambit",
    ],
    lines: [
      {
        name: "Queen's Gambit Declined",
        moves: ["d4", "d5", "c4", "e6"],
        explanations: [
          "White takes the center with d4.",
          "Black mirrors with d5, establishing an equal central presence.",
          "White offers the c4 pawn — the Queen's Gambit! The idea is to divert Black's d5 pawn and then play e4 for a massive center. If Black captures, White gets central dominance.",
          "Black declines with e6, supporting the d5 pawn. This is the Queen's Gambit Declined — solid and reliable. Black maintains a strong central foothold but slightly blocks the c8 bishop.",
        ],
        strategy:
          "White develops with Nc3, Nf3, Bg5, and O-O, pressuring Black's center. Black responds with ...Nf6, ...Be7, ...O-O, and ...c6, creating a solid defensive structure. White often plays cxd5 and exd5 to gain space. The c8 bishop is Black's problem piece — freeing it with ...dxc4 and ...Bb4 or ...Bd6 is a key strategic theme. The position is strategically complex and rewards deep positional understanding.",
      },
      {
        name: "Queen's Gambit Accepted",
        moves: ["d4", "d5", "c4", "dxc4"],
        explanations: [
          "White takes the center with d4.",
          "Black mirrors with d5.",
          "White offers the c4 pawn with the Queen's Gambit.",
          "Black accepts! Black grabs the pawn and gives up the center. This is a principled decision — Black gets material but allows White to build a strong center with e4.",
        ],
        strategy:
          "White plays Nf3 and e4, building a strong pawn center. Black develops with ...Nf6, ...e6, and ...c5 to challenge the center. The key question: can Black hold the extra pawn? Usually not — White regains it with tactical pressure (e.g., a4, Bxc4). The QGA leads to open, tactical positions where White has central space and Black has free piece development.",
      },
      {
        name: "Slav Defense",
        moves: ["d4", "d5", "c4", "c6"],
        explanations: [
          "White takes the center with d4.",
          "Black mirrors with d5.",
          "White offers the Queen's Gambit with c4.",
          "Black plays c6 instead of capturing or playing e6. This is the Slav Defense — Black supports the d5 pawn without blocking the c8 bishop. This is a key improvement over the Q Declined — the light-squared bishop can develop freely.",
        ],
        strategy:
          "Black's plan: develop with ...Nf6, ...Bf5 (the bishop escapes before e6 blocks it!), ...e6, and ...Be7. The Slav is extremely solid — Black has a strong pawn chain (c6-d5) and the c8 bishop is actively placed. White develops with Nc3, Nf3, and tries to break with cxd5 or e3. The Slav leads to deep positional battles where both sides have clear strategic plans.",
      },
    ],
  },
  {
    slug: "caro-kann",
    name: "Caro-Kann Defense",
    description:
      "A solid, resilient opening where Black builds a strong pawn structure. Unlike the French Defense, Black doesn't block the c8 bishop with e6 — instead using c6 to support d5. This gives Black a more durable structure and freer piece development.",
    ideas: [
      "Black prepares ...d5 with c6, keeping the c8 bishop's diagonal open",
      "The pawn structure is more solid than the French — no trapped bishop",
      "Black accepts slower development for a rock-solid position",
      "Black aims for counterplay with ...c5 or ...e5 breaks",
    ],
    lines: [
      {
        name: "Classical Variation",
        moves: ["e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4"],
        explanations: [
          "White takes the center with e4.",
          "Black plays c6, preparing ...d5. Unlike the French (e6 then d5), Black doesn't block the c8 bishop — this is the key Caro-Kann idea.",
          "White establishes a big pawn on d4, taking central space.",
          "Black strikes with d5, challenging the e4 pawn.",
          "White defends e4 with Nc3, developing while protecting the pawn.",
          "Black exchanges on e4, opening the position and freeing the c8 bishop.",
          "White recaptures with the knight on e4, developing to an active square. The position is roughly equal — White has space, Black has a solid structure and free development.",
        ],
        strategy:
          "Black develops with ...Nf6 (or ...Nd7), ...Bf5 (freely developing the problem bishop!), ...e6, and ...Be7. The Caro-Kann structure is extremely solid — Black's pawns on c6 and e6 protect the king and control key squares. White should develop with Nf3, Bd3, O-O, and try to exploit the space advantage with c3 and e5. The position is strategically clear and rewards patient play from both sides.",
      },
      {
        name: "Advance Variation",
        moves: ["e4", "c6", "d4", "d5", "e5"],
        explanations: [
          "White takes the center with e4.",
          "Black prepares ...d5 with c6, keeping the c8 bishop free.",
          "White establishes d4.",
          "Black challenges with d5.",
          "White advances to e5, gaining space and locking the pawn structure. This is the Advance Variation — White gets a big space advantage but gives Black a clear target on d4.",
        ],
        strategy:
          "Black's plan: develop with ...Bf5 (escaping before ...e6 blocks the bishop), ...e6, ...Ne7, ...Nd7, and strike at d4 with ...c5 and ...Qb6. White should hold the center, develop with Nf3, Be2, O-O, and attack on the kingside with g4 and h4. This is a positional battle — White has space, Black has a solid structure and a clear pawn break (...c5). Patience and strategic understanding are key.",
      },
      {
        name: "Exchange Variation",
        moves: ["e4", "c6", "d4", "d5", "exd5", "cxd5"],
        explanations: [
          "White takes the center with e4.",
          "Black prepares ...d5 with c6.",
          "White establishes d4.",
          "Black challenges with d5.",
          "White exchanges on d5, simplifying the position.",
          "Black recaptures with the c-pawn, maintaining a pawn on d5. The position is now a Carlsbad structure — Black has a solid center and the c8 bishop is free to develop.",
        ],
        strategy:
          "This leads to a Carlsbad pawn structure. White's plan: develop with Bd3, Nf3, O-O, and either attack with the minority attack (b4-b5) or build pressure with c3 and e4. Black develops with ...Nc6, ...Bf5, ...e6, and ...Bd6. The position is strategically rich but quieter than other Caro-Kann lines — good for players who enjoy positional maneuvering.",
      },
    ],
  },
  {
    slug: "london-system",
    name: "London System",
    description:
      "A solid, easy-to-learn system opening where White develops the bishop to f4 and builds a strong, compact pawn structure. Great for beginners — the setup works against almost any Black response, so you don't need to memorize lots of theory.",
    ideas: [
      "White develops the bishop to f4 before playing e3, avoiding the bishop being blocked",
      "The system works against almost any Black setup — one opening to learn",
      "White builds a solid pawn structure with d4, e3, and c3",
      "The plan is simple: develop all pieces, castle, and build pressure with Ne5 or f4-f5",
    ],
    lines: [
      {
        name: "Standard Setup",
        moves: ["d4", "d5", "Bf4"],
        explanations: [
          "White takes the center with d4.",
          "Black mirrors with d5, establishing equal central control.",
          "White develops the bishop to f4 — the defining move of the London System. By developing the bishop before playing e3, White avoids trapping it behind the e-pawn. The bishop is actively placed and controls important squares.",
        ],
        strategy:
          "White's plan is simple and consistent: play e3, Nf3, c3, Bd3, Nbd2, and O-O. This creates a rock-solid pyramid structure. Then White can build pressure with Ne5, h4-h5, or f4-f5. The London is forgiving — even if you forget theory, the setup works. Black should challenge with ...c5, ...Nc6, and ...Qb6, pressuring d4 and b2.",
      },
      {
        name: "London vs King's Indian Setup",
        moves: ["d4", "Nf6", "Bf4", "g6", "Nf3", "Bg7", "e3", "O-O"],
        explanations: [
          "White opens with d4.",
          "Black develops the knight to f6, a flexible move that doesn't commit to a pawn structure yet.",
          "White plays Bf4 — the London bishop. This works against any Black setup.",
          "Black fianchettoes with g6, planning ...Bg7 and ...O-O. This is a King's Indian-style setup against the London.",
          "White develops the knight to f3, controlling e5 and supporting d4.",
          "Black develops the bishop to g7, controlling the long diagonal.",
          "White plays e3, solidifying the pawn chain and preparing Bd3 and O-O.",
          "Black castles kingside, completing basic development.",
        ],
        strategy:
          "White continues with c3, Bd3, Nbd2, O-O, and then chooses a plan: Ne5 to jump into a strong outpost, or h4-h5 to attack Black's fianchettoed king. Black plays ...c5, ...Nc6, and ...e5 to challenge the center. The London is positionally sound — White has a solid structure and clear plans, while Black must find a way to break through.",
      },
    ],
  },
  {
    slug: "kings-indian-defense",
    name: "King's Indian Defense",
    description:
      "A hypermodern opening where Black lets White build a big pawn center, then attacks it with pawn breaks. Black castles kingside and launches a fierce attack. This opening is loved by aggressive, creative players like Kasparov and Fischer.",
    ideas: [
      "Black fianchettoes the bishop to g7, controlling the long diagonal",
      "Black lets White build a pawn center, then attacks it with ...e5 or ...c5",
      "The king is safe behind the fianchettoed bishop",
      "Black often launches a violent kingside pawn storm while White attacks on the queenside",
    ],
    lines: [
      {
        name: "Classical Main Line",
        moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3", "O-O"],
        explanations: [
          "White opens with d4, taking the center.",
          "Black develops the knight to f6, controlling e4 and d5. This flexible move doesn't commit to a pawn structure yet.",
          "White expands with c4, building a broad pawn center.",
          "Black fianchettoes with g6 — the defining move of the King's Indian. The bishop will go to g7, controlling the long a1-h8 diagonal.",
          "White develops the knight to c3, supporting the e4 and d4 pawns.",
          "Black develops the bishop to g7 — the Dragon bishop! This piece is the cornerstone of Black's strategy, eyeing the center and defending the king.",
          "White plays e4, completing the big pawn center. White now has pawns on d4 and e4 — a massive central presence.",
          "Black plays d6, supporting the e5 break and the bishop on g7. Black accepts a slightly cramped position.",
          "White develops with Nf3, controlling e5 and supporting d4.",
          "Black castles kingside, securing the king behind the fianchettoed bishop. This completes Black's opening setup.",
        ],
        strategy:
          "White's plan: expand on the queenside with b4-b5, c5, andNd2-c1-e3. Black's plan: attack on the kingside with ...f5-f4, ...g5-g4, and ...Nh5, ...Nf6-h5. The race is on — both sides attack on opposite wings. The player who breaks through first usually wins. This is one of the most exciting and strategically complex openings in chess.",
      },
      {
        name: "Sämisch Variation",
        moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "f3"],
        explanations: [
          "White opens with d4.",
          "Black develops with Nf6.",
          "White expands with c4.",
          "Black fianchettoes with g6.",
          "White develops with Nc3.",
          "Black places the bishop on g7 — the Dragon bishop.",
          "White plays e4, building the big center.",
          "Black plays d6, supporting the e5 break.",
          "White plays f3 — the Sämisch! White prepares to build an even bigger center with g4 and Be3. This is a sharp, aggressive choice — White creates a massive pawn structure but gives Black tactical chances.",
        ],
        strategy:
          "White's plan: play Be3, Qd2, O-O-O, and launch a violent kingside attack with g4-g5 and h4-h5. Black should respond with ...e5 to strike at the center, or ...Nc6 and ...a6 preparing ...b5. The Sämisch leads to extremely sharp, double-edged positions — both sides have attacking chances and the game often ends in a knockout.",
      },
    ],
  },
  {
    slug: "scandinavian-defense",
    name: "Scandinavian Defense",
    description:
      "Black immediately challenges the e4 pawn with d5. Simple, direct, and principled — Black trades the center pawn early and gets active piece play. A good practical choice that avoids heavy theory.",
    ideas: [
      "Black challenges the center immediately with ...d5",
      "After exd5, Black recaptures with the queen — accepting early queen development",
      "Black aims for quick development and a solid pawn structure",
      "The opening is easy to learn and avoids mainstream e4 theory",
    ],
    lines: [
      {
        name: "Main Line",
        moves: ["e4", "d5", "exd5", "Qxd5", "Nc3", "Qd6"],
        explanations: [
          "White takes the center with e4.",
          "Black immediately challenges with d5! This is the Scandinavian — direct and principled. Black dares White to take the pawn.",
          "White captures the pawn. Accepting the challenge is the most common response.",
          "Black recaptures with the queen. This is the main downside — the queen comes out early and can be harassed. But Black gets quick development and an open position.",
          "White develops with tempo by attacking the queen with Nc3. White gains a free developing move while the queen must move.",
          "Black retreats the queen to d6 — the most flexible square. From d6 the queen supports ...c6, ...e6, and ...Nf6, while staying out of harm's way. Black has a solid setup.",
        ],
        strategy:
          "Black develops with ...Nf6, ...c6 (or ...e6), ...Bg4 (or ...Bf5), and ...e6. The plan is simple: develop all pieces, castle, and play for ...c5 or ...e5 breaks. White develops with d4, Nf3, Bd3, O-O, and has a slight space advantage. The Scandinavian is solid and practical — Black gets a playable position with minimal theory.",
      },
      {
        name: "Modern Variation (3...Qa5)",
        moves: ["e4", "d5", "exd5", "Qa5"],
        explanations: [
          "White takes the center with e4.",
          "Black challenges immediately with d5.",
          "White accepts and captures the pawn.",
          "Black recaptures with Qa5 instead of Qxd5! The queen goes to a5, attacking nothing but staying active and out of the center. This is a modern, flexible approach — the queen is safe on a5 and eyes the queenside.",
        ],
        strategy:
          "Black develops with ...Nf6, ...c6, ...Bf5, ...e6, and ...Bb4. The queen on a5 supports queenside expansion and pressures White's center. White responds with d4, Nf3, c4, and Nc3, building a strong center. The position is roughly equal — Black has a solid structure and active piece placement. This variation avoids the queen being chased and is popular at club level.",
      },
    ],
  },
];

export function getOpening(slug) {
  return OPENINGS.find((o) => o.slug === slug) || null;
}
