import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <section className="hero">
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

      <section className="cards">
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
