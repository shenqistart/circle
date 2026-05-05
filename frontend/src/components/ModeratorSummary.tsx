import type { ModeratorSummary } from "../domain/types";

type ModeratorSummaryViewProps = {
  summary: ModeratorSummary;
  isStreaming?: boolean;
};

const blocks: Array<[keyof ModeratorSummary, string]> = [
  ["consensus", "共识"],
  ["disagreements", "分歧"],
  ["insights", "洞察"],
  ["actions", "行动"]
];

export function ModeratorSummaryView({ summary, isStreaming = false }: ModeratorSummaryViewProps) {
  return (
    <div className="moderator-summary">
      <div className="summary-title-row">
        <h3>主持人总结</h3>
        {isStreaming && <span>生成中</span>}
      </div>
      <div className="summary-grid">
        {blocks.map(([key, label]) => (
          <section key={key}>
            <h4>{label}</h4>
            <ul>
              {summary[key].length > 0 ? (
                summary[key].map((item) => <li key={item}>{item}</li>)
              ) : (
                <li className="summary-pending">{isStreaming ? "正在整理..." : "暂无"}</li>
              )}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
