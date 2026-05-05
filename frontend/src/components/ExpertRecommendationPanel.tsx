import type { ExpertPreset, RoutingMatch } from "../domain/types";

type ExpertRecommendationPanelProps = {
  matches: RoutingMatch[];
  selectedExperts: ExpertPreset[];
  allExperts: ExpertPreset[];
  onToggleExpert: (expert: ExpertPreset) => void;
  onGenerate: () => void | Promise<void>;
  onRetry: () => void | Promise<void>;
  isGenerating: boolean;
  generationMessage: string;
  generationError: string;
  canRetry: boolean;
};

const isSelected = (expert: ExpertPreset, selectedExperts: ExpertPreset[]) =>
  selectedExperts.some((selected) => selected.id === expert.id);

export function ExpertRecommendationPanel({
  matches,
  selectedExperts,
  allExperts,
  onToggleExpert,
  onGenerate,
  onRetry,
  isGenerating,
  generationMessage,
  generationError,
  canRetry
}: ExpertRecommendationPanelProps) {
  const hasEnoughExperts = selectedExperts.length >= 2;
  const canGenerate = hasEnoughExperts && !isGenerating;

  return (
    <section className="panel" aria-labelledby="recommendation-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">路由</p>
          <h2 id="recommendation-title">推荐与最终阵容</h2>
        </div>
        <button className="primary-action" type="button" disabled={!canGenerate} onClick={onGenerate}>
          {isGenerating ? "生成中..." : "生成圆桌"}
        </button>
      </div>

      {!hasEnoughExperts && <p className="warning">至少选择 2 位专家后才能生成。</p>}
      {generationMessage && <p className="success">{generationMessage}</p>}
      {generationError && (
        <div className="error-banner" role="alert">
          <p>{generationError}</p>
          <button type="button" disabled={!canRetry || isGenerating} onClick={onRetry}>
            重试
          </button>
        </div>
      )}

      <div className="recommendation-list" aria-label="推荐专家">
        {matches.map((match) => (
          <article className="recommendation-item" key={match.expert.id}>
            <div>
              <h3>{match.expert.name}</h3>
              <p>{match.reason}</p>
              <span>Score {match.score}</span>
            </div>
            <button type="button" onClick={() => onToggleExpert(match.expert)}>
              {isSelected(match.expert, selectedExperts) ? "移除" : "加入"}
            </button>
          </article>
        ))}
      </div>

      <div className="selected-strip" aria-label="已选择专家">
        {selectedExperts.map((expert) => (
          <button type="button" key={expert.id} onClick={() => onToggleExpert(expert)}>
            {expert.name} ×
          </button>
        ))}
      </div>

      <details className="manual-experts">
        <summary>更多专家</summary>
        <div className="manual-grid" aria-label="手动选择专家">
          {allExperts
            .filter((expert) => expert.enabled)
            .map((expert) => (
              <label key={expert.id}>
                <input
                  type="checkbox"
                  checked={isSelected(expert, selectedExperts)}
                  onChange={() => onToggleExpert(expert)}
                />
                <span>{expert.name}</span>
              </label>
            ))}
        </div>
      </details>
    </section>
  );
}
