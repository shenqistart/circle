import type { ModeratorSummary } from "../domain/types";

type ModeratorSummaryViewProps = {
  summary: ModeratorSummary;
};

const blocks: Array<[keyof ModeratorSummary, string]> = [
  ["consensus", "共识"],
  ["disagreements", "分歧"],
  ["insights", "洞察"],
  ["actions", "行动"]
];

export function ModeratorSummaryView({ summary }: ModeratorSummaryViewProps) {
  return (
    <div className="moderator-summary">
      <h3>主持人总结</h3>
      <div className="summary-grid">
        {blocks.map(([key, label]) => (
          <section key={key}>
            <h4>{label}</h4>
            <ul>
              {summary[key].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
