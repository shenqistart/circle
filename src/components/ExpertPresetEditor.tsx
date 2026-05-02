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
          名称
          <input value={draft.name} onChange={(event) => update("name", event.target.value)} />
        </label>
        <label>
          Skill ID
          <input value={draft.skillId} onChange={(event) => update("skillId", event.target.value)} />
        </label>
        <label>
          领域标签
          <input
            value={draft.domainTags}
            onChange={(event) => update("domainTags", event.target.value)}
            placeholder="市场, 增长, 定位"
          />
        </label>
        <label>
          简述
          <input
            value={draft.shortDescription}
            onChange={(event) => update("shortDescription", event.target.value)}
          />
        </label>
      </div>
      <label className="stacked-field">
        思考方式
        <textarea value={draft.thinkingStyle} onChange={(event) => update("thinkingStyle", event.target.value)} />
      </label>
      <label className="stacked-field">
        回应风格
        <textarea value={draft.responseStyle} onChange={(event) => update("responseStyle", event.target.value)} />
      </label>
      <div className="form-grid">
        <label>
          Source repo
          <input value={draft.sourceRepo} onChange={(event) => update("sourceRepo", event.target.value)} />
        </label>
        <label>
          Install command metadata
          <input value={draft.installCommand} onChange={(event) => update("installCommand", event.target.value)} />
        </label>
      </div>
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
