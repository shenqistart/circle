import { afterEach, describe, expect, it, vi } from "vitest";
import { builtInExperts } from "../data/expertPresets";
import { createMockRoundtable } from "../domain/mockRoundtableGenerator";
import { generateRoundtable } from "../services/roundtableApi";

const experts = builtInExperts.slice(0, 2);

describe("roundtable api client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the backend LLM result when it satisfies the roundtable contract", async () => {
    const result = createMockRoundtable("如何做 AI 教育产品？", experts);
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result })
    });
    vi.stubGlobal("fetch", fetchSpy);

    const generated = await generateRoundtable("如何做 AI 教育产品？", experts);

    expect(generated.source).toBe("llm");
    expect(generated.result).toEqual(result);
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/roundtable",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("falls back to the local mock generator when the backend is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const generated = await generateRoundtable("如何做 AI 教育产品？", experts);

    expect(generated.source).toBe("mock-fallback");
    expect(generated.result.rounds).toHaveLength(2);
  });
});
