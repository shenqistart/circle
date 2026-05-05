import { describe, expect, it } from "vitest";
import { builtInExperts } from "../data/expertPresets";
import { createMockRoundtable } from "../domain/mockRoundtableGenerator";
import { buildRoundtablePdfDefinition, pdfReportFileName } from "../domain/roundtablePdf";

describe("roundtable PDF report", () => {
  it("builds a professional PDF definition from the roundtable result", () => {
    const result = createMockRoundtable("如何验证一个新产品？", builtInExperts.slice(0, 3));
    const definition = buildRoundtablePdfDefinition(result, new Date("2026-05-05T08:00:00Z"));
    const serialized = JSON.stringify(definition);

    expect(definition.pageSize).toBe("A4");
    expect(definition.defaultStyle?.font).toBe("NotoSansSC");
    expect(serialized).toContain("AI 圆桌报告");
    expect(serialized).toContain("如何验证一个新产品？");
    expect(serialized).toContain("主持人总结");
    expect(serialized).toContain("专家阵容");
    expect(serialized).toContain("讨论记录");
    expect(serialized).toContain(result.experts[0].name);
    expect(serialized).toContain(result.rounds[0].turns[0].content);
  });

  it("creates a safe PDF file name from the question", () => {
    const result = createMockRoundtable("如何验证 / 新产品？", builtInExperts.slice(0, 3));
    expect(pdfReportFileName(result)).toBe("如何验证-新产品.pdf");
  });
});
