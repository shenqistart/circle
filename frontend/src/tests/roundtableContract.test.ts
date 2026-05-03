import { describe, expect, it } from "vitest";
import { builtInExperts } from "../data/expertPresets";
import { createMockRoundtable } from "../domain/mockRoundtableGenerator";
import { validateRoundtableResult } from "../domain/roundtableContract";

describe("roundtable contract", () => {
  it("accepts a two-round discussion with named responses and moderator summary", () => {
    const result = createMockRoundtable("如何验证一个新产品？", builtInExperts.slice(0, 3));
    expect(validateRoundtableResult(result)).toEqual([]);
  });

  it("rejects discussions with fewer than two experts", () => {
    const result = createMockRoundtable("如何验证一个新产品？", builtInExperts.slice(0, 2));
    expect(validateRoundtableResult({ ...result, experts: result.experts.slice(0, 1) })).toContain("至少需要 2 个专家");
  });
});
