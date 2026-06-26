import Link from "next/link";

export default function HomePage() {
  return (
    <div className="home-page">
      {/* Animated background: surgeon vs patient playing chess */}
      <div className="home-bg-scene" aria-hidden="true">
        <svg
          viewBox="0 0 1200 600"
          preserveAspectRatio="xMidYMid slice"
          className="home-bg-svg"
        >
          {/* Operating room backdrop */}
          <rect width="1200" height="600" fill="none" />

          {/* Surgical overhead lights */}
          <circle cx="300" cy="0" r="120" fill="rgba(45,212,167,0.04)" />
          <circle cx="900" cy="0" r="120" fill="rgba(45,212,167,0.04)" />

          {/* Chess board in center */}
          <g transform="translate(420, 180)">
            {/* Board base */}
            <rect x="0" y="0" width="360" height="300" rx="6" fill="#1a2030" stroke="#1e2839" strokeWidth="3" />
            {/* Squares */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((row) =>
              [0, 1, 2, 3, 4, 5, 6, 7].map((col) => (
                <rect
                  key={`${row}-${col}`}
                  x={col * 45}
                  y={row * 37.5}
                  width="45"
                  height="37.5"
                  fill={(row + col) % 2 === 0 ? "#1a2030" : "#0a0e1a"}
                />
              ))
            )}

            {/* Chess pieces - animated knight moving */}
            <g className="bg-knight-move">
              {/* Knight */}
              <text x="160" y="230" fontSize="32" fill="#2dd4a7" className="bg-piece-knight">♞</text>
            </g>

            {/* Pawn */}
            <text x="70" y="140" fontSize="28" fill="#e6e9f2" className="bg-piece-pawn">♟</text>

            {/* King */}
            <text x="250" y="60" fontSize="34" fill="#e23838" className="bg-piece-king">♚</text>

            {/* Queen */}
            <text x="115" y="60" fontSize="32" fill="#2dd4a7" className="bg-piece-queen">♛</text>

            {/* Rook */}
            <text x="295" y="230" fontSize="30" fill="#e6e9f2" className="bg-piece-rook">♜</text>

            {/* Move trail */}
            <line x1="160" y1="200" x2="160" y2="160" stroke="rgba(45,212,167,0.3)" strokeWidth="2" strokeDasharray="4 4" className="bg-move-trail" />
          </g>

          {/* Surgeon on the left */}
          <g transform="translate(140, 130)" className="bg-surgeon">
            {/* Stethoscope */}
            <path d="M 45 120 Q 30 145 38 165 Q 45 180 55 175" fill="none" stroke="#6b7a8f" strokeWidth="3" strokeLinecap="round" />
            <circle cx="55" cy="178" r="5" fill="#6b7a8f" />

            {/* Body / scrubs */}
            <path d="M 30 100 Q 70 85 110 100 L 115 200 Q 70 215 25 200 Z" fill="#1a936f" className="bg-surgeon-body" />

            {/* Arms reaching toward board */}
            <path d="M 100 120 Q 160 115 220 140" fill="none" stroke="#1a936f" strokeWidth="14" strokeLinecap="round" />
            <path d="M 40 120 Q 20 140 15 165" fill="none" stroke="#1a936f" strokeWidth="14" strokeLinecap="round" />

            {/* Hands */}
            <circle cx="225" cy="142" r="8" fill="#f4d4b1" />

            {/* Head */}
            <circle cx="70" cy="65" r="32" fill="#f4d4b1" stroke="#d4a874" strokeWidth="1.5" />

            {/* Surgical cap */}
            <path d="M 40 50 Q 70 18 100 50 L 100 58 Q 70 40 40 58 Z" fill="#1a936f" />
            <path d="M 60 24 Q 70 16 80 24 L 80 36 Q 70 30 60 36 Z" fill="#15967b" />

            {/* Surgical mask */}
            <path d="M 44 72 Q 70 68 96 72 L 96 90 Q 70 96 44 90 Z" fill="#e8f4f0" stroke="#b8d4cc" strokeWidth="1" />
            <path d="M 44 72 L 35 68 L 35 80 L 44 78 Z" fill="#e8f4f0" stroke="#b8d4cc" strokeWidth="1" />
            <path d="M 96 72 L 105 68 L 105 80 L 96 78 Z" fill="#e8f4f0" stroke="#b8d4cc" strokeWidth="1" />
            <line x1="46" y1="80" x2="94" y2="80" stroke="#b8d4cc" strokeWidth="0.5" />

            {/* Eyes */}
            <circle cx="60" cy="62" r="3" fill="#333" />
            <circle cx="80" cy="62" r="3" fill="#333" />

            {/* Surgical cross badge on scrubs */}
            <rect x="88" y="140" width="14" height="14" rx="2" fill="#fff" opacity="0.9" />
            <path d="M93 142 L97 142 L97 146 L101 146 L101 150 L97 150 L97 154 L93 154 L93 150 L89 150 L89 146 L93 146 Z" fill="#e23838" />
          </g>

          {/* Patient on the right */}
          <g transform="translate(910, 140)" className="bg-patient">
            {/* Body / hospital gown */}
            <path d="M 30 100 Q 70 88 110 100 L 115 210 Q 70 220 25 210 Z" fill="#3a4a5c" className="bg-patient-body" />

            {/* Arms */}
            <path d="M 35 120 Q 10 135 5 150" fill="none" stroke="#3a4a5c" strokeWidth="14" strokeLinecap="round" />
            <path d="M 100 120 Q 70 110 40 100" fill="none" stroke="#3a4a5c" strokeWidth="14" strokeLinecap="round" className="bg-patient-arm" />

            {/* Hand holding a piece */}
            <g className="bg-patient-hand">
              <circle cx="35" cy="100" r="8" fill="#f4d4b1" />
              <text x="22" y="108" fontSize="24" fill="#7a849a">♙</text>
            </g>

            {/* Head */}
            <circle cx="70" cy="65" r="32" fill="#f4d4b1" stroke="#d4a874" strokeWidth="1.5" />

            {/* Hospital bandage on head */}
            <path d="M 42 48 Q 70 38 98 48 L 98 56 Q 70 44 42 56 Z" fill="#e8f4f0" stroke="#b8d4cc" strokeWidth="1" />
            <line x1="42" y1="52" x2="98" y2="52" stroke="#d4a874" strokeWidth="0.5" />

            {/* Eyes */}
            <circle cx="60" cy="64" r="3" fill="#333" className="bg-patient-eye" />
            <circle cx="80" cy="64" r="3" fill="#333" className="bg-patient-eye" />

            {/* Worried mouth */}
            <path d="M 62 88 Q 70 84 78 88" fill="none" stroke="#8B4513" strokeWidth="1.5" strokeLinecap="round" />

            {/* IV drip stand */}
            <line x1="115" y1="20" x2="115" y2="220" stroke="#6b7a8f" strokeWidth="2" />
            <rect x="110" y="30" width="10" height="20" rx="2" fill="#1a2030" stroke="#6b7a8f" strokeWidth="1" />
            <line x1="115" y1="50" x2="115" y2="120" stroke="#6b7a8f" strokeWidth="1" />
            <circle cx="115" cy="125" r="3" fill="#2dd4a7" className="bg-iv-drip" />
          </g>

          {/* Floating medical + chess symbols */}
          <g className="bg-float-symbols">
            <text x="200" y="80" fontSize="20" fill="rgba(26,147,111,0.15)">⚕</text>
            <text x="550" y="60" fontSize="18" fill="rgba(26,147,111,0.12)">♞</text>
            <text x="800" y="90" fontSize="22" fill="rgba(26,147,111,0.1)">♚</text>
            <text x="350" y="500" fontSize="20" fill="rgba(26,147,111,0.1)">♟</text>
            <text x="700" y="520" fontSize="18" fill="rgba(226,56,56,0.08)">♛</text>
            <text x="100" y="450" fontSize="20" fill="rgba(26,147,111,0.1)">⚕</text>
            <text x="1050" y="400" fontSize="22" fill="rgba(26,147,111,0.08)">♜</text>
            <text x="500" y="550" fontSize="18" fill="rgba(26,147,111,0.1)">⚕</text>
          </g>

          {/* Heartbeat line across the scene */}
          <path
            d="M 0 580 L 250 580 L 270 560 L 280 600 L 290 570 L 300 580 L 550 580 L 570 560 L 580 600 L 590 570 L 600 580 L 850 580 L 870 560 L 880 600 L 890 570 L 900 580 L 1200 580"
            fill="none"
            stroke="rgba(26,147,111,0.12)"
            strokeWidth="2"
            className="bg-ekg-line"
          />
        </svg>
      </div>

      <section className="hero hero-overlay">
        <h1>Chess-Surgeon</h1>
        <p>
          Paste a game or a board screenshot and let Stockfish analyze your
          moves, find where you went wrong, surface similar master games, and
          train with an adaptive coaching AI.
        </p>
        <Link className="cta" href="/analyze">
          Start analyzing
        </Link>
      </section>

      <section className="cards cards-overlay">
        <Link className="card" href="/analyze">
          <h2>Analyze a game</h2>
          <p>
            Paste a PGN, FEN, or move ID. Get best-move evaluation and
            move-by-move feedback from Stockfish.
          </p>
        </Link>
        <Link className="card" href="/openings">
          <h2>Learn openings</h2>
          <p>
            Step through classic chess openings move by move. See highlights,
            coach advice, and key ideas for each position.
          </p>
        </Link>
        <Link className="card" href="/learn">
          <h2>Learn tactics</h2>
          <p>
            Beginner-friendly guides to forks, pins, skewers, and more — with
            examples and tips to spot them in your games.
          </p>
        </Link>
        <Link className="card" href="/play">
          <h2>Play vs coaching AI</h2>
          <p>
            Play against an adaptive Stockfish bot. Pick an ELO, get hints on
            tactics and plans as you go.
          </p>
        </Link>
      </section>
    </div>
  );
}
