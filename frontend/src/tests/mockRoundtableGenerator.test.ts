import { describe, expect, it } from "vitest";
import { builtInExperts } from "../data/expertPresets";
import { createMockRoundtable } from "../domain/mockRoundtableGenerator";

describe("mock roundtable generator", () => {
  it("creates at least two rounds where every selected expert speaks", () => {
    const experts = builtInExperts.slice(0, 3);
    const result = createMockRoundtable("如何做第一版 AI 产品？", experts);
    expect(result.rounds).toHaveLength(2);
    expect(result.rounds.flatMap((round) => round.turns)).toHaveLength(6);
    expect(result.rounds[1].turns.every((turn) => turn.respondsToExpertId)).toBe(true);
    expect(result.moderatorSummary.actions.length).toBeGreaterThan(0);
  });

  it("blocks generation with only one expert", () => {
    expect(() => createMockRoundtable("问题", builtInExperts.slice(0, 1))).toThrow(/至少选择 2 个专家/);
  });
});
