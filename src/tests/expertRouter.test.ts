import { describe, expect, it } from "vitest";
import { builtInExperts } from "../data/expertPresets";
import { canGenerateWithExperts, recommendExperts } from "../domain/expertRouter";

describe("expert router", () => {
  it("keeps the approved 13 built-in experts", () => {
    expect(builtInExperts).toHaveLength(13);
  });

  it("routes AI education and engineering questions to Karpathy in the Top 3", () => {
    const matches = recommendExperts("我想做 AI 教育产品，需要工程 demo 和开源课程", builtInExperts);
    expect(matches.map((match) => match.expert.id)).toContain("karpathy");
  });

  it("routes startup risk questions to Taleb and Paul Graham", () => {
    const matches = recommendExperts("创业公司如何面对市场风险和不确定性，验证 startup 需求？", builtInExperts);
    const ids = matches.map((match) => match.expert.id);
    expect(ids).toContain("taleb");
    expect(ids).toContain("paul-graham");
  });

  it("keeps llm-assisted routing disabled for the MVP", () => {
    expect(() => recommendExperts("test", builtInExperts, 3, "llm-assisted")).toThrow(/not enabled/);
  });

  it("allows generation only after at least two experts are selected", () => {
    expect(canGenerateWithExperts(builtInExperts.slice(0, 1))).toBe(false);
    expect(canGenerateWithExperts(builtInExperts.slice(0, 2))).toBe(true);
  });
});
