import Link from "next/link";
import { TACTICS } from "../../lib/tactics";

export const metadata = {
  title: "Learn Chess Tactics — Chess-Surgeon",
  description:
    "Beginner-friendly explanations of common chess tactics with examples.",
};

export default function LearnPage() {
  return (
    <div>
      <h1>Chess Tactics</h1>
      <p className="learn-intro">
        Learn the key tactical patterns that every chess player should know.
        Click any tactic to see a beginner-friendly explanation with an
        example position.
      </p>

      <div className="learn-grid">
        {Object.entries(TACTICS).map(([slug, tactic]) => (
          <Link
            key={slug}
            href={`/learn/${slug}`}
            className="learn-card"
          >
            <h2>{tactic.title}</h2>
            <p>{tactic.shortDesc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
