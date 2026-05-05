import { describe, expect, it } from "vitest";
import { builtInExperts } from "../data/expertPresets";
import { createMockRoundtable } from "../domain/mockRoundtableGenerator";
import { formatRoundtableReportMarkdown, reportFileName } from "../domain/roundtableReport";

describe("roundtable report", () => {
  it("formats the question, experts, rounds, turns, and moderator summary as markdown", () => {
    const result = createMockRoundtable("如何验证一个新产品？", builtInExperts.slice(0, 3));
    const markdown = formatRoundtableReportMarkdown(result);

    expect(markdown).toContain("# AI 圆桌报告");
    expect(markdown).toContain("## 问题");
    expect(markdown).toContain("如何验证一个新产品？");
    expect(markdown).toContain("## 参会专家");
    expect(markdown).toContain(`- ${result.experts[0].name}：${result.experts[0].shortDescription}`);
    expect(markdown).toContain("## Round 1 · 初始立场");
    expect(markdown).toContain(`### ${result.rounds[0].turns[0].expertName}`);
    expect(markdown).toContain(result.rounds[0].turns[0].content);
    expect(markdown).toContain("## 主持人总结");
    expect(markdown).toContain("### 行动");
    expect(markdown).toContain("- 保留至少 2 个专家");
  });

  it("creates a safe markdown file name from the question", () => {
    const result = createMockRoundtable("如何验证 / 新产品？", builtInExperts.slice(0, 3));
    expect(reportFileName(result)).toBe("如何验证-新产品.md");
  });
});
