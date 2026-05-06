import { strFromU8, unzipSync } from "fflate";
import type { ExpertPreset } from "../domain/types";
import { slugifySkillId } from "./expertCatalogStorage";

const maxArchiveBytes = 2 * 1024 * 1024;
const maxEntries = 80;
const maxExtractedText = 80 * 1024;
const maxFieldLength = 1200;
const wantedArchiveEntries = new Set(["skill.md", "readme.md"]);

export type SkillArchiveDocs = {
  skillMarkdown: string;
  readmeMarkdown?: string;
  evidenceRefs: string[];
};

export type SkillArchivePresetDraft = {
  preset: ExpertPreset;
  notice: string;
  docs: SkillArchiveDocs;
};

type Entry = {
  path: string;
  name: string;
  bytes: Uint8Array;
};

export type PresetDraftGenerator = (docs: SkillArchiveDocs, sourceFileName: string) => ExpertPreset;

const normalizePath = (path: string): string => path.replace(/\\/g, "/").replace(/^\/+/, "");

const basename = (path: string): string => {
  const normalized = normalizePath(path);
  return normalized.split("/").filter(Boolean).pop() ?? normalized;
};

const isDirectoryEntry = (path: string): boolean => normalizePath(path).endsWith("/");

const assertZipFile = (file: File) => {
  if (!file.name.toLowerCase().endsWith(".zip")) {
    throw new Error("当前仅支持 .zip 压缩包");
  }
  if (file.size > maxArchiveBytes) {
    throw new Error("压缩包过大，最大支持 2 MB");
  }
};

const readFileBytes = async (file: File): Promise<Uint8Array> => {
  if (typeof file.arrayBuffer === "function") {
    return new Uint8Array(await file.arrayBuffer());
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("压缩包无法读取"));
    reader.onload = () => {
      if (!(reader.result instanceof ArrayBuffer)) {
        reject(new Error("压缩包无法读取"));
        return;
      }
      resolve(new Uint8Array(reader.result));
    };
    reader.readAsArrayBuffer(file);
  });
};

const decodeZipEntries = async (file: File): Promise<Entry[]> => {
  assertZipFile(file);
  const buffer = await readFileBytes(file);
  let entries: Record<string, Uint8Array>;
  let entryCount = 0;
  let extractedTextBytes = 0;
  let validationError: Error | undefined;
  try {
    entries = unzipSync(buffer, {
      filter(zipEntry) {
        entryCount += 1;
        if (entryCount > maxEntries) {
          validationError = new Error(`压缩包文件过多，最多支持 ${maxEntries} 个文件`);
          throw validationError;
        }

        const normalized = normalizePath(zipEntry.name);
        if (isDirectoryEntry(normalized)) return false;
        const name = basename(normalized).toLowerCase();
        if (!wantedArchiveEntries.has(name)) return false;

        extractedTextBytes += zipEntry.originalSize;
        if (extractedTextBytes > maxExtractedText) {
          validationError = new Error("可解析文本过长，最多支持 80 KB");
          throw validationError;
        }

        return true;
      }
    });
  } catch (error) {
    if (error === validationError && validationError) throw validationError;
    throw new Error("压缩包无法读取，请确认文件是有效的 .zip");
  }

  const textEntries = Object.entries(entries)
    .map(([path, bytes]) => ({ path: normalizePath(path), name: basename(path).toLowerCase(), bytes }));

  return textEntries;
};

const readTextEntry = (entry: Entry): string => {
  try {
    return strFromU8(entry.bytes);
  } catch {
    throw new Error(`${entry.path} 不是可读取的文本文件`);
  }
};

export const extractSkillArchiveDocs = async (file: File): Promise<SkillArchiveDocs> => {
  const entries = await decodeZipEntries(file);
  const skillEntry = entries.find((entry) => entry.name === "skill.md");
  if (!skillEntry) {
    const names = entries.map((entry) => entry.path).slice(0, 5).join(", ");
    throw new Error(names ? `压缩包中未找到 SKILL.md（已读取：${names}）` : "压缩包中未找到 SKILL.md");
  }

  const readmeEntry = entries.find((entry) => entry.name === "readme.md");
  const skillMarkdown = readTextEntry(skillEntry);
  const readmeMarkdown = readmeEntry ? readTextEntry(readmeEntry) : undefined;
  const combinedLength = skillMarkdown.length + (readmeMarkdown?.length ?? 0);
  if (combinedLength > maxExtractedText) {
    throw new Error("可解析文本过长，最多支持 80 KB");
  }

  return {
    skillMarkdown,
    readmeMarkdown,
    evidenceRefs: readmeEntry ? [skillEntry.path, readmeEntry.path] : [skillEntry.path]
  };
};

const firstMatch = (text: string, patterns: RegExp[]): string => {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = match?.[1]?.trim();
    if (value) return value.replace(/^["']|["']$/g, "").trim();
  }
  return "";
};

const stripMarkdown = (text: string): string =>
  text
    .replace(/<[^>]+>/g, " ")
    .replace(/[`*_>#-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const truncate = (text: string, fallback: string, max = 160): string => {
  const clean = stripMarkdown(text);
  if (!clean) return fallback;
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
};

const sectionText = (text: string, names: string[]): string => {
  const escaped = names.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const pattern = new RegExp(`(?:^|\\n)#{1,3}\\s*(?:${escaped})\\s*\\n([\\s\\S]*?)(?=\\n#{1,3}\\s|$)`, "i");
  return text.match(pattern)?.[1]?.trim() ?? "";
};

const xmlBlock = (text: string, names: string[]): string => {
  for (const name of names) {
    const match = text.match(new RegExp(`<${name}>\\s*([\\s\\S]*?)\\s*</${name}>`, "i"));
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return "";
};

const inferName = (skillMarkdown: string, readmeMarkdown: string | undefined, sourceFileName: string): string => {
  const fromMetadata = firstMatch(skillMarkdown, [/^name:\s*["']?(.+?)["']?\s*$/im, /^#\s+(.+)$/m]);
  const fromReadme = readmeMarkdown ? firstMatch(readmeMarkdown, [/^#\s+(.+)$/m]) : "";
  const fromFile = sourceFileName.replace(/\.zip$/i, "").replace(/[-_]+/g, " ");
  return truncate(fromMetadata || fromReadme || fromFile, "本地 Skill 专家", 48);
};

const inferTags = (name: string, text: string): string[] => {
  const source = `${name} ${text}`.toLowerCase();
  const candidates: Array<[string, string[]]> = [
    ["AI", ["ai", "llm", "agent", "model", "openai", "人工智能", "模型"]],
    ["产品", ["product", "产品", "体验", "用户"]],
    ["工程", ["engineering", "code", "developer", "工程", "代码", "架构"]],
    ["设计", ["design", "ui", "ux", "视觉", "设计"]],
    ["研究", ["research", "paper", "analysis", "研究", "分析"]],
    ["写作", ["writing", "content", "copy", "写作", "内容"]],
    ["增长", ["growth", "marketing", "增长", "营销"]],
    ["决策", ["strategy", "decision", "战略", "决策"]]
  ];
  const tags = candidates.filter(([, words]) => words.some((word) => source.includes(word))).map(([tag]) => tag);
  if (!tags.includes("本地 skill")) tags.push("本地 skill");
  return tags.slice(0, 6);
};

export const createLocalPresetDraft: PresetDraftGenerator = (docs, sourceFileName) => {
  const combined = [docs.skillMarkdown, docs.readmeMarkdown].filter(Boolean).join("\n\n");
  const name = inferName(docs.skillMarkdown, docs.readmeMarkdown, sourceFileName);
  const skillId = slugifySkillId(`${name}-skill`) || "local-skill";
  const purpose = xmlBlock(docs.skillMarkdown, ["Purpose"]) || sectionText(combined, ["Purpose", "用途", "简介", "Overview"]);
  const useWhen = xmlBlock(docs.skillMarkdown, ["Use_When", "Use When"]) || sectionText(combined, ["Use When", "Use_When", "适用场景"]);
  const response = sectionText(combined, ["Response Style", "Output Style", "输出风格", "Style"]) || xmlBlock(docs.skillMarkdown, ["Response_Style"]);
  const description =
    firstMatch(docs.skillMarkdown, [/^description:\s*["']?(.+?)["']?\s*$/im]) || purpose || useWhen || combined;
  const thinkingSource = [purpose, useWhen].filter(Boolean).join(" ");
  const responseSource = response || "先说明判断，再给出结构化建议和下一步行动。";

  return {
    id: slugifySkillId(`local-${skillId}`) || "local-skill",
    name,
    shortLabel: name,
    source: "local",
    evidenceRefs: docs.evidenceRefs,
    provenanceStatus: "local-derived",
    thinkingStyle: truncate(thinkingSource, "根据本地 SKILL.md 的用途和适用场景分析问题。", maxFieldLength),
    mentalModels: [],
    decisionHeuristics: [],
    antiPatterns: [],
    honestyBoundary: "这是根据本地压缩包中的 SKILL.md/README.md 自动草拟的 preset；未安装、未执行，也未联网验证来源。",
    responseStyle: truncate(responseSource, "先给结论，再列依据、风险和下一步行动。", maxFieldLength),
    skillId,
    domainTags: inferTags(name, combined),
    shortDescription: truncate(description, "根据本地 skill 文档草拟的专家 preset。", 120),
    sourceType: "local",
    sourceRepo: "",
    installCommand: "",
    evidenceStatus: "user-authored-local",
    evidenceNote: "auto-drafted-from-local-skill-archive",
    enabled: true
  };
};

export const createSkillArchivePresetDraft = async (
  file: File,
  generator: PresetDraftGenerator = createLocalPresetDraft
): Promise<SkillArchivePresetDraft> => {
  const docs = await extractSkillArchiveDocs(file);
  return {
    docs,
    preset: generator(docs, file.name),
    notice: "本地自动草拟，保存前请检查。只读取 SKILL.md 和 README.md，未安装、未执行、未联网验证。"
  };
};
