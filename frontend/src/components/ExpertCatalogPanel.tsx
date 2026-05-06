import type { ExpertPreset } from "../domain/types";
import type { ReactNode } from "react";
import { useState } from "react";
import { ExpertPresetEditor } from "./ExpertPresetEditor";

type ExpertCatalogPanelProps = {
  builtInExperts: ExpertPreset[];
  localPresets: ExpertPreset[];
  existingPresets: ExpertPreset[];
  editingPreset?: ExpertPreset | null;
  onCopyBuiltIn: (expert: ExpertPreset) => void;
  onEditLocal: (expert: ExpertPreset) => void;
  onNewLocalPreset: () => void;
  onSave: (preset: ExpertPreset) => void;
  onCancelEdit: () => void;
  onDeleteLocal: (expert: ExpertPreset) => void;
  onToggleLocal: (expert: ExpertPreset) => void;
  draftNotice?: string;
  draftMetadata?: Partial<ExpertPreset> | null;
  exportText: string;
  importText: string;
  importMessage: string;
  isImportingArchive?: boolean;
  onExport: () => void;
  onImportSkillArchive: (file: File) => Promise<boolean>;
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
  existingPresets,
  editingPreset,
  onCopyBuiltIn,
  onEditLocal,
  onNewLocalPreset,
  onSave,
  onCancelEdit,
  onDeleteLocal,
  onToggleLocal,
  draftNotice,
  draftMetadata,
  exportText,
  importText,
  importMessage,
  isImportingArchive = false,
  onExport,
  onImportSkillArchive,
  onImportTextChange,
  onImport
}: ExpertCatalogPanelProps) {
  const [activeTab, setActiveTab] = useState<"built-in" | "local">("built-in");
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const openLocalEditor = (expert?: ExpertPreset) => {
    setActiveTab("local");
    setIsEditorOpen(true);
    if (expert) {
      onEditLocal(expert);
    } else {
      onNewLocalPreset();
    }
  };

  const copyBuiltIn = (expert: ExpertPreset) => {
    setActiveTab("local");
    setIsEditorOpen(true);
    onCopyBuiltIn(expert);
  };

  const savePreset = (preset: ExpertPreset) => {
    onSave(preset);
    setIsEditorOpen(false);
  };

  const cancelEdit = () => {
    onCancelEdit();
    setIsEditorOpen(false);
  };

  const importSkillArchive = async (file?: File) => {
    if (!file) return;
    setActiveTab("local");
    const shouldOpenEditor = await onImportSkillArchive(file);
    if (shouldOpenEditor) {
      setIsEditorOpen(true);
    }
  };

  return (
    <section className="panel catalog-layout" aria-label="专家目录">
      <div className="section-heading">
        <div>
          <p className="eyebrow">专家目录</p>
          <h2>目录管理</h2>
        </div>
        <div className="catalog-tabs" role="tablist" aria-label="专家目录类型">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "built-in"}
            aria-controls="built-in-catalog"
            id="built-in-catalog-tab"
            onClick={() => setActiveTab("built-in")}
          >
            内置目录
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "local"}
            aria-controls="local-catalog"
            id="local-catalog-tab"
            onClick={() => setActiveTab("local")}
          >
            本地目录
          </button>
        </div>
      </div>

      {activeTab === "built-in" && (
        <div id="built-in-catalog" role="tabpanel" aria-labelledby="built-in-catalog-tab">
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
                  <button type="button" onClick={() => copyBuiltIn(expert)}>
                    复制为本地
                  </button>
                }
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === "local" && (
        <div id="local-catalog" role="tabpanel" aria-labelledby="local-catalog-tab">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Local presets</p>
              <h2>本地目录</h2>
            </div>
            <div className="catalog-actions">
              <button type="button" onClick={() => openLocalEditor()}>
                新增 preset
              </button>
              <label className="file-action">
                <input
                  aria-label="上传 skill 压缩包"
                  type="file"
                  accept=".zip,application/zip"
                  disabled={isImportingArchive}
                  onChange={(event) => {
                    void importSkillArchive(event.target.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
                {isImportingArchive ? "解析中..." : "上传 skill .zip"}
              </label>
              <button type="button" onClick={onExport}>
                导出 JSON
              </button>
            </div>
          </div>
          {isEditorOpen && (
            <div className="catalog-editor">
              <ExpertPresetEditor
                existingPresets={existingPresets}
                editingPreset={editingPreset}
                draftNotice={draftNotice}
                basePresetMetadata={draftMetadata}
                onSave={savePreset}
                onCancelEdit={cancelEdit}
                embedded
              />
            </div>
          )}
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
                    <button type="button" onClick={() => openLocalEditor(expert)}>
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
          {importMessage && (
            <p className={importMessage.startsWith("导入成功") ? "success" : "warning"}>{importMessage}</p>
          )}
        </div>
      )}
    </section>
  );
}
