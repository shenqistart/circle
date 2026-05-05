import type { RoundtableResult } from "../domain/types";
import { formatRoundtableReportMarkdown, reportFileName } from "../domain/roundtableReport";
import { ModeratorSummaryView } from "./ModeratorSummary";

type DiscussionViewProps = {
  result: RoundtableResult | null;
};

export function DiscussionView({ result }: DiscussionViewProps) {
  if (!result) {
    return null;
  }

  const reportMarkdown = formatRoundtableReportMarkdown(result);

  const downloadMarkdown = () => {
    const url = URL.createObjectURL(new Blob([reportMarkdown], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = reportFileName(result);
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const printReport = () => {
    const reportWindow = window.open("", "_blank");
    if (!reportWindow) return;
    reportWindow.document.title = "AI 圆桌报告";
    const style = reportWindow.document.createElement("style");
    style.textContent =
      "body{margin:32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111;line-height:1.65}pre{white-space:pre-wrap;font:inherit} @media print{body{margin:18mm}}";
    const pre = reportWindow.document.createElement("pre");
    pre.textContent = reportMarkdown;
    reportWindow.document.head.append(style);
    reportWindow.document.body.append(pre);
    reportWindow.print();
  };

  return (
    <section className="panel discussion" aria-label="圆桌输出">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Roundtable</p>
          <h2>讨论记录</h2>
        </div>
        <div className="report-actions">
          <button type="button" onClick={downloadMarkdown}>
            导出 MD
          </button>
          <button type="button" onClick={printReport}>
            打印 / 另存 PDF
          </button>
        </div>
      </div>
      {result.rounds.length === 0 && <p className="empty-state">正在等待后端流式事件...</p>}
      {result.rounds.map((round) => (
        <div className="round" key={round.id}>
          <h3>{round.title}</h3>
          {round.turns.map((turn) => (
            <article className="turn" key={`${round.id}-${turn.expertId}`}>
              <div className="turn-speaker">
                <strong>{turn.expertName}</strong>
                {turn.respondsToExpertId && <span>回应 {turn.respondsToExpertId}</span>}
              </div>
              <p>{turn.content}</p>
            </article>
          ))}
        </div>
      ))}
      {(result.moderatorSummary.consensus.length > 0 ||
        result.moderatorSummary.disagreements.length > 0 ||
        result.moderatorSummary.insights.length > 0 ||
        result.moderatorSummary.actions.length > 0) && <ModeratorSummaryView summary={result.moderatorSummary} />}
    </section>
  );
}
