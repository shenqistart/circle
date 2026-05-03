import { describe, expect, it } from "vitest";
import { builtInExperts } from "../data/expertPresets";
import { buildRoundtablePrompt } from "../domain/promptBuilder";

describe("prompt builder", () => {
  it("injects the final selected experts and response contract", () => {
    const prompt = buildRoundtablePrompt("如何做产品取舍？", builtInExperts.slice(0, 2));
    expect(prompt).toContain("Paul Graham");
    expect(prompt).toContain("张一鸣");
    expect(prompt).toContain("第二轮必须点名回应其他专家");
  });
});
