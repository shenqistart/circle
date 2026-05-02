import type { ExpertPreset } from "../domain/types";
import type { ReactNode } from "react";

type ExpertCatalogPanelProps = {
  builtInExperts: ExpertPreset[];
  localPresets: ExpertPreset[];
  onCopyBuiltIn: (expert: ExpertPreset) => void;
  onEditLocal: (expert: ExpertPreset) => void;
  onDeleteLocal: (expert: ExpertPreset) => void;
  onToggleLocal: (expert: ExpertPreset) => void;
  exportText: string;
  importText: string;
  importMessage: string;
  onExport: () => void;
  onImportTextChange: (value: string) => void;
  onImport: () => void;
};

function ExpertRow({
  expert,
  actions
}: {
  expert: ExpertPreset;
  actions: ReactNode;
}) {
  return (
    <article className="expert-row">
      <div>
        <h3>{expert.name}</h3>
        <p>{expert.shortDescription}</p>
        <div className="tag-line">
          {expert.domainTags.slice(0, 5).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        {expert.installCommand && <code>{expert.installCommand}</code>}
      </div>
      <div className="row-actions">{actions}</div>
    </article>
  );
}

export function ExpertCatalogPanel({
  builtInExperts,
  localPresets,
  onCopyBuiltIn,
  onEditLocal,
  onDeleteLocal,
  onToggleLocal,
  exportText,
  importText,
  importMessage,
  onExport,
  onImportTextChange,
  onImport
}: ExpertCatalogPanelProps) {
  return (
    <section className="catalog-layout" aria-label="专家目录">
      <div className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">内置目录</p>
            <h2>{builtInExperts.length} 个专家</h2>
          </div>
        </div>
        <div className="expert-list">
          {builtInExperts.map((expert) => (
            <ExpertRow
              expert={expert}
              key={expert.id}
              actions={
                <button type="button" onClick={() => onCopyBuiltIn(expert)}>
                  复制为本地
                </button>
              }
            />
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Local presets</p>
            <h2>本地目录</h2>
          </div>
          <button type="button" onClick={onExport}>
            导出 JSON
          </button>
        </div>
        <div className="expert-list">
          {localPresets.length === 0 && <p className="empty-state">还没有本地 preset。</p>}
          {localPresets.map((expert) => (
            <ExpertRow
              expert={expert}
              key={expert.id}
              actions={
                <>
                  <button type="button" onClick={() => onToggleLocal(expert)}>
                    {expert.enabled ? "禁用" : "启用"}
                  </button>
                  <button type="button" onClick={() => onEditLocal(expert)}>
                    编辑
                  </button>
                  <button type="button" onClick={() => onDeleteLocal(expert)}>
                    删除
                  </button>
                </>
              }
            />
          ))}
        </div>
        <label className="stacked-field">
          导出内容
          <textarea readOnly value={exportText} />
        </label>
        <label className="stacked-field">
          导入 JSON
          <textarea value={importText} onChange={(event) => onImportTextChange(event.target.value)} />
        </label>
        <button type="button" onClick={onImport}>
          导入本地 presets
        </button>
        {importMessage && <p className={importMessage.startsWith("导入成功") ? "success" : "warning"}>{importMessage}</p>}
      </div>
    </section>
  );
}
