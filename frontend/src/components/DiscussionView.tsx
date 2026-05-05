import { useState } from "react";
import type { RoundtableResult } from "../domain/types";
import { formatRoundtableReportMarkdown, reportFileName } from "../domain/roundtableReport";
import { downloadRoundtablePdf } from "../services/roundtablePdfDownload";
import { ModeratorSummaryView } from "./ModeratorSummary";

type DiscussionViewProps = {
  result: RoundtableResult | null;
};

export function DiscussionView({ result }: DiscussionViewProps) {
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);
  const [pdfError, setPdfError] = useState("");

  if (!result) {
    return null;
  }

  const reportMarkdown = formatRoundtableReportMarkdown(result);
  const hasSummary =
    result.moderatorSummary.consensus.length > 0 ||
    result.moderatorSummary.disagreements.length > 0 ||
    result.moderatorSummary.insights.length > 0 ||
    result.moderatorSummary.actions.length > 0;
  const isSummaryStreaming = result.moderatorSummaryStatus === "streaming";
  const isSummaryComplete = result.moderatorSummaryStatus === "completed";
  const shouldShowSummary = hasSummary || isSummaryStreaming;

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

  const downloadPdf = async () => {
    setPdfError("");
    setIsPdfDownloading(true);
    try {
      await downloadRoundtablePdf(result);
    } catch {
      setPdfError("PDF 生成失败，请稍后重试。");
    } finally {
      setIsPdfDownloading(false);
    }
  };

  return (
    <section className="panel discussion" aria-label="圆桌输出">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Roundtable</p>
          <h2>{shouldShowSummary ? "圆桌报告" : "讨论记录"}</h2>
        </div>
        {isSummaryComplete && hasSummary && (
          <div className="report-actions">
            <button type="button" onClick={downloadMarkdown}>
              导出 MD
            </button>
            <button type="button" disabled={isPdfDownloading} onClick={downloadPdf}>
              {isPdfDownloading ? "生成 PDF..." : "下载 PDF"}
            </button>
          </div>
        )}
      </div>
      {pdfError && <p className="warning">{pdfError}</p>}
      {shouldShowSummary && <ModeratorSummaryView summary={result.moderatorSummary} isStreaming={isSummaryStreaming} />}
      {result.rounds.length === 0 && <p className="empty-state">正在等待后端流式事件...</p>}
      {result.rounds.length > 0 && (
        <div className={shouldShowSummary ? "roundtable-log" : undefined}>
          {shouldShowSummary && <h3>讨论记录</h3>}
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
        </div>
      )}
    </section>
  );
}
