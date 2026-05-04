import type { RoundtableResult } from "../domain/types";
import { ModeratorSummaryView } from "./ModeratorSummary";

type DiscussionViewProps = {
  result: RoundtableResult | null;
};

export function DiscussionView({ result }: DiscussionViewProps) {
  if (!result) {
    return (
      <section className="panel discussion-placeholder" aria-label="圆桌输出">
        <p>生成后会在这里出现多轮对话和主持人总结。</p>
        <div className="placeholder-stack" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>
    );
  }

  return (
    <section className="panel discussion" aria-label="圆桌输出">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Roundtable</p>
          <h2>讨论记录</h2>
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
