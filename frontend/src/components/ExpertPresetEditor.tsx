import { useEffect, useState } from "react";
import type { ExpertPreset } from "../domain/types";
import { normalizeLocalPreset, validateLocalPresetInput } from "../services/expertCatalogStorage";

type Draft = {
  id?: string;
  name: string;
  skillId: string;
  domainTags: string;
  shortDescription: string;
  thinkingStyle: string;
  responseStyle: string;
  sourceRepo: string;
  installCommand: string;
  enabled: boolean;
};

type ExpertPresetEditorProps = {
  existingPresets: ExpertPreset[];
  editingPreset?: ExpertPreset | null;
  onSave: (preset: ExpertPreset) => void;
  onCancelEdit: () => void;
};

const emptyDraft: Draft = {
  name: "",
  skillId: "",
  domainTags: "",
  shortDescription: "",
  thinkingStyle: "",
  responseStyle: "",
  sourceRepo: "",
  installCommand: "",
  enabled: true
};

const toDraft = (preset?: ExpertPreset | null): Draft =>
  preset
    ? {
        id: preset.id,
        name: preset.name,
        skillId: preset.skillId,
        domainTags: preset.domainTags.join(", "),
        shortDescription: preset.shortDescription,
        thinkingStyle: preset.thinkingStyle,
        responseStyle: preset.responseStyle,
        sourceRepo: preset.sourceRepo ?? "",
        installCommand: preset.installCommand ?? "",
        enabled: preset.enabled
      }
    : emptyDraft;

function FieldHint({ text }: { text: string }) {
  return (
    <span className="field-hint" title={text} aria-label={text}>
      ?
    </span>
  );
}

export function ExpertPresetEditor({
  existingPresets,
  editingPreset,
  onSave,
  onCancelEdit
}: ExpertPresetEditorProps) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(editingPreset));
  const [message, setMessage] = useState("");

  useEffect(() => {
    setDraft(toDraft(editingPreset));
    setMessage("");
  }, [editingPreset]);

  const update = (field: keyof Draft, value: string | boolean) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const candidate = {
    ...draft,
    domainTags: draft.domainTags
      .split(/[,，]/)
      .map((tag) => tag.trim())
      .filter(Boolean),
    sourceType: "local",
    evidenceStatus: editingPreset ? "user-edited-local" : "user-authored-local"
  };
  const errors = validateLocalPresetInput(candidate, existingPresets, draft.id);

  const save = () => {
    if (errors.length > 0) {
      setMessage(errors.join("；"));
      return;
    }
    onSave(normalizeLocalPreset(candidate));
    setDraft(emptyDraft);
    setMessage("已保存本地 preset");
  };

  return (
    <section className="panel" aria-labelledby="editor-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">本地专家</p>
          <h2 id="editor-title">{editingPreset ? "编辑 preset" : "新增 preset"}</h2>
        </div>
        {editingPreset && (
          <button type="button" onClick={onCancelEdit}>
            取消
          </button>
        )}
      </div>

      <div className="form-grid">
        <label>
          <span className="field-label">
            名称
            <FieldHint text="用户在阵容里看到的专家名字，例如“市场策略专家”。" />
          </span>
          <input
            aria-label="名称"
            value={draft.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="市场策略专家"
          />
        </label>
        <label>
          <span className="field-label">
            领域标签
            <FieldHint text="用逗号分隔。推荐算法会用这些标签匹配问题。" />
          </span>
          <input
            aria-label="领域标签"
            value={draft.domainTags}
            onChange={(event) => update("domainTags", event.target.value)}
            placeholder="市场, 增长, 定位"
          />
        </label>
        <label>
          <span className="field-label">
            一句话说明
            <FieldHint text="一句话告诉用户这个专家擅长什么。" />
          </span>
          <input
            aria-label="简述"
            value={draft.shortDescription}
            onChange={(event) => update("shortDescription", event.target.value)}
            placeholder="评估市场定位、渠道和增长风险。"
          />
        </label>
      </div>
      <label className="stacked-field">
        <span className="field-label">
          专家定位
          <FieldHint text="描述这个专家会优先关注什么、如何判断问题。" />
        </span>
        <textarea
          aria-label="思考方式"
          value={draft.thinkingStyle}
          onChange={(event) => update("thinkingStyle", event.target.value)}
          placeholder="先看目标用户、真实需求、获客渠道和验证成本。"
        />
      </label>
      <label className="stacked-field">
        <span className="field-label">
          输出风格
          <FieldHint text="描述希望它如何回答，例如直接、结构化、先结论后依据。" />
        </span>
        <textarea
          aria-label="回应风格"
          value={draft.responseStyle}
          onChange={(event) => update("responseStyle", event.target.value)}
          placeholder="先给结论，再列依据、风险和下一步行动。"
        />
      </label>

      <details className="advanced-fields">
        <summary>高级设置</summary>
        <div className="form-grid">
          <label>
            <span className="field-label">
              Skill ID
              <FieldHint text="可留空。保存时会根据名称自动生成，只有需要稳定导入导出时才手动填写。" />
            </span>
            <input
              aria-label="Skill ID"
              value={draft.skillId}
              onChange={(event) => update("skillId", event.target.value)}
              placeholder="留空自动生成"
            />
          </label>
          <label>
            <span className="field-label">
              Source repo
              <FieldHint text="可选。记录这个专家 preset 的来源仓库，不影响推荐。" />
            </span>
            <input
              aria-label="Source repo"
              value={draft.sourceRepo}
              onChange={(event) => update("sourceRepo", event.target.value)}
            />
          </label>
          <label>
            <span className="field-label">
              Install command
              <FieldHint text="可选。仅作为导入导出 metadata，不会自动执行。" />
            </span>
            <input
              aria-label="Install command metadata"
              value={draft.installCommand}
              onChange={(event) => update("installCommand", event.target.value)}
            />
          </label>
        </div>
      </details>
      <label className="check-row">
        <input
          type="checkbox"
          checked={draft.enabled}
          onChange={(event) => update("enabled", event.target.checked)}
        />
        启用并参与推荐
      </label>
      {message && <p className={errors.length > 0 ? "warning" : "success"}>{message}</p>}
      <button className="primary-action" type="button" onClick={save}>
        保存 preset
      </button>
    </section>
  );
}
