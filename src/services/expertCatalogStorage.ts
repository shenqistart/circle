import type { ExpertPreset, PresetExportFile } from "../domain/types";

export const LOCAL_PRESETS_STORAGE_KEY = "roundtable.localExpertPresets.v1";
export const PRESET_SCHEMA_VERSION = 1;

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type ImportResult = {
  imported: ExpertPreset[];
  allPresets: ExpertPreset[];
};

const maxText = 1200;
const maxTags = 12;
const allowedEvidence = new Set(["user-authored-local", "user-edited-local"]);

const memoryStorage = (): StorageLike => {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    }
  };
};

const runtimeStorage = (): StorageLike => {
  if (typeof window === "undefined" || !window.localStorage) {
    return memoryStorage();
  }
  return window.localStorage;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asString = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

export const slugifySkillId = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const assertLength = (field: string, value: string, errors: string[]) => {
  if (value.length > maxText) {
    errors.push(`${field} 过长`);
  }
};

export const validateLocalPresetInput = (
  candidate: unknown,
  existing: ExpertPreset[] = [],
  editingId?: string
): string[] => {
  const errors: string[] = [];
  if (!isRecord(candidate)) {
    return ["preset 必须是对象"];
  }

  const name = asString(candidate.name);
  const skillId = asString(candidate.skillId) || slugifySkillId(name);
  const domainTags = asStringArray(candidate.domainTags);
  const shortDescription = asString(candidate.shortDescription);
  const thinkingStyle = asString(candidate.thinkingStyle);
  const responseStyle = asString(candidate.responseStyle);
  const sourceType = asString(candidate.sourceType) || "local";
  const evidenceStatus = asString(candidate.evidenceStatus) || "user-authored-local";

  if (!name) errors.push("name 必填");
  if (!skillId) errors.push("skillId 必填");
  if (domainTags.length === 0) errors.push("domainTags 至少需要 1 个标签");
  if (domainTags.length > maxTags) errors.push(`domainTags 最多 ${maxTags} 个`);
  if (!shortDescription) errors.push("shortDescription 必填");
  if (!thinkingStyle) errors.push("thinkingStyle 必填");
  if (!responseStyle) errors.push("responseStyle 必填");
  if (sourceType !== "local") errors.push("只能导入或保存 local preset");
  if (!allowedEvidence.has(evidenceStatus)) errors.push("evidenceStatus 不合法");

  [name, skillId, shortDescription, thinkingStyle, responseStyle].forEach((value, index) => {
    const fields = ["name", "skillId", "shortDescription", "thinkingStyle", "responseStyle"];
    assertLength(fields[index], value, errors);
  });

  const duplicate = existing.find(
    (preset) => preset.id !== editingId && (preset.id === asString(candidate.id) || preset.skillId === skillId)
  );
  if (duplicate) {
    errors.push("id 或 skillId 与已有本地 preset 重复");
  }

  return errors;
};

export const normalizeLocalPreset = (candidate: unknown, now = new Date().toISOString()): ExpertPreset => {
  if (!isRecord(candidate)) {
    throw new Error("preset 必须是对象");
  }
  const name = asString(candidate.name);
  const skillId = asString(candidate.skillId) || slugifySkillId(name);
  const id = asString(candidate.id) || slugifySkillId(skillId || name);
  const createdAt = asString(candidate.createdAt) || now;

  return {
    id,
    name,
    shortLabel: asString(candidate.shortLabel) || name,
    source: "local",
    sourceUrl: asString(candidate.sourceUrl) || undefined,
    evidenceRefs: asStringArray(candidate.evidenceRefs),
    provenanceStatus: "local-derived",
    thinkingStyle: asString(candidate.thinkingStyle),
    mentalModels: asStringArray(candidate.mentalModels),
    decisionHeuristics: asStringArray(candidate.decisionHeuristics),
    antiPatterns: asStringArray(candidate.antiPatterns),
    honestyBoundary:
      asString(candidate.honestyBoundary) || "这是用户手动创建的本地 preset；未自动解析外部仓库或执行安装命令。",
    responseStyle: asString(candidate.responseStyle),
    skillId,
    domainTags: asStringArray(candidate.domainTags).slice(0, maxTags),
    shortDescription: asString(candidate.shortDescription),
    sourceType: "local",
    sourceRepo: asString(candidate.sourceRepo) || undefined,
    installCommand: asString(candidate.installCommand) || undefined,
    evidenceStatus:
      asString(candidate.evidenceStatus) === "user-edited-local" ? "user-edited-local" : "user-authored-local",
    evidenceNote: asString(candidate.evidenceNote) || "user-authored-local",
    enabled: typeof candidate.enabled === "boolean" ? candidate.enabled : true,
    createdAt,
    updatedAt: now
  };
};

export const loadLocalPresets = (storage: StorageLike = runtimeStorage()): ExpertPreset[] => {
  const raw = storage.getItem(LOCAL_PRESETS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as PresetExportFile;
    if (parsed.schemaVersion !== PRESET_SCHEMA_VERSION || !Array.isArray(parsed.presets)) {
      return [];
    }
    return parsed.presets.map((preset) => normalizeLocalPreset(preset));
  } catch {
    return [];
  }
};

export const saveLocalPresets = (
  presets: ExpertPreset[],
  storage: StorageLike = runtimeStorage()
): ExpertPreset[] => {
  const localPresets = presets.map((preset) => normalizeLocalPreset(preset));
  const payload: PresetExportFile = {
    schemaVersion: PRESET_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    presets: localPresets
  };
  storage.setItem(LOCAL_PRESETS_STORAGE_KEY, JSON.stringify(payload));
  return localPresets;
};

export const clearLocalPresets = (storage: StorageLike = runtimeStorage()): void => {
  storage.removeItem(LOCAL_PRESETS_STORAGE_KEY);
};

export const upsertLocalPreset = (
  candidate: unknown,
  storage: StorageLike = runtimeStorage()
): ExpertPreset[] => {
  const current = loadLocalPresets(storage);
  const editingId = isRecord(candidate) ? asString(candidate.id) : undefined;
  const errors = validateLocalPresetInput(candidate, current, editingId);
  if (errors.length > 0) {
    throw new Error(errors.join("; "));
  }
  const normalized = normalizeLocalPreset(candidate);
  const next = current.some((preset) => preset.id === normalized.id)
    ? current.map((preset) => (preset.id === normalized.id ? normalized : preset))
    : [...current, normalized];
  return saveLocalPresets(next, storage);
};

export const deleteLocalPreset = (
  presetId: string,
  storage: StorageLike = runtimeStorage()
): ExpertPreset[] => {
  const next = loadLocalPresets(storage).filter((preset) => preset.id !== presetId);
  return saveLocalPresets(next, storage);
};

export const exportLocalPresets = (presets: ExpertPreset[] = loadLocalPresets()): string =>
  JSON.stringify(
    {
      schemaVersion: PRESET_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      presets: presets.map((preset) => normalizeLocalPreset(preset))
    } satisfies PresetExportFile,
    null,
    2
  );

export const importLocalPresets = (
  jsonText: string,
  storage: StorageLike = runtimeStorage()
): ImportResult => {
  const parsed = JSON.parse(jsonText) as PresetExportFile;
  if (!isRecord(parsed) || parsed.schemaVersion !== PRESET_SCHEMA_VERSION) {
    throw new Error("不支持的 schemaVersion");
  }
  if (!Array.isArray(parsed.presets)) {
    throw new Error("presets 必须是数组");
  }

  const current = loadLocalPresets(storage);
  const seenIds = new Set<string>();
  const seenSkillIds = new Set<string>();
  const imported = parsed.presets.map((preset) => {
    const errors = validateLocalPresetInput(preset, current);
    if (errors.length > 0) {
      throw new Error(errors.join("; "));
    }
    const normalized = normalizeLocalPreset(preset);
    if (seenIds.has(normalized.id) || seenSkillIds.has(normalized.skillId)) {
      throw new Error("导入文件内存在重复 id 或 skillId");
    }
    seenIds.add(normalized.id);
    seenSkillIds.add(normalized.skillId);
    return normalized;
  });

  const allPresets = saveLocalPresets([...current, ...imported], storage);
  return { imported, allPresets };
};
