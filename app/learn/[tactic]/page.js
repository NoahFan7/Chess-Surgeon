import { TACTICS, getTactic } from "../../../lib/tactics";
import TacticLearn from "./tactic-learn";

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
          <a href="/learn">Browse all tactics</a>.
        </p>
      </div>
    );
  }

  return <TacticLearn tactic={tactic} tacticKey={params.tactic} />;
}
