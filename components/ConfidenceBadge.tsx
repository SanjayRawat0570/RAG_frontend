import Icon from "@/components/Icon";

export type Confidence = "high" | "medium" | "low";

const TONE: Record<Confidence, string> = {
  high:   "badge-success",
  medium: "badge-warning",
  low:    "badge-danger",
};

/** Model-reported confidence from the structured answer; "Not answerable" when the context lacks the answer. */
export default function ConfidenceBadge({ confidence, answerable }: { confidence?: Confidence | null; answerable?: boolean | null }) {
  if (answerable === false) {
    return <span className="badge badge-danger" title="The knowledge base does not contain this answer"><Icon name="shield" size={11} />Not answerable</span>;
  }
  if (!confidence) return null;
  return (
    <span className={`badge ${TONE[confidence]}`} title="Model-reported confidence in the answer">
      <span className="dot" />{confidence[0].toUpperCase() + confidence.slice(1)} confidence
    </span>
  );
}
