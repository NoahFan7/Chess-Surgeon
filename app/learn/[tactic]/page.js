import { TACTICS, getTactic } from "../../../lib/tactics";
import dynamic from "next/dynamic";
import Link from "next/link";

const ChessBoard = dynamic(() => import("../../../components/ChessBoard"), {
  ssr: false,
  loading: () => <div className="placeholder">Loading board…</div>,
});

export function generateStaticParams() {
  return Object.keys(TACTICS).map((slug) => ({ tactic: slug }));
}

export function generateMetadata({ params }) {
  const tactic = getTactic(params.tactic);
  if (!tactic) return { title: "Tactic not found — Chess-Surgeon" };
  return {
    title: `${tactic.title} — Chess-Surgeon`,
    description: tactic.shortDesc,
  };
}

export default function TacticPage({ params }) {
  const tactic = getTactic(params.tactic);

  if (!tactic) {
    return (
      <div>
        <h1>Tactic not found</h1>
        <p>
          We don't have a page for that tactic yet.{" "}
          <Link href="/learn">Browse all tactics</Link>.
        </p>
      </div>
    );
  }

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
          <ChessBoard fen={tactic.fen} interactive={false} />
          <p className="learn-move-hint">
            <strong>Example:</strong> {tactic.moveSuggestion}
          </p>
        </div>

        <div className="learn-explanation">
          <h2>What is a {tactic.title.toLowerCase()}?</h2>
          <p>{tactic.explanation}</p>

          <h3>Tips</h3>
          <ul className="learn-tips">
            {tactic.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>

          <div className="learn-nav">
            <h3>Learn more tactics</h3>
            <div className="learn-tactic-links">
              {Object.entries(TACTICS)
                .filter(([slug]) => slug !== params.tactic)
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
