import type { ModeratorSummary, RoundtableResult } from "./types";

const summarySections: Array<[keyof ModeratorSummary, string]> = [
  ["consensus", "共识"],
  ["disagreements", "分歧"],
  ["insights", "洞察"],
  ["actions", "行动"]
];

const linesForList = (items: string[]): string[] => (items.length > 0 ? items.map((item) => `- ${item}`) : ["- 暂无"]);

export const formatRoundtableReportMarkdown = (result: RoundtableResult): string => {
  const lines: string[] = [
    "# AI 圆桌报告",
    "",
    "## 问题",
    "",
    result.question,
    "",
    "## 参会专家",
    "",
    ...result.experts.map((expert) => `- ${expert.name}：${expert.shortDescription}`),
    ""
  ];

  for (const round of result.rounds) {
    lines.push(`## ${round.title}`, "");
    for (const turn of round.turns) {
      lines.push(`### ${turn.expertName}`, "", turn.content || "暂无内容", "");
    }
  }

  lines.push("## 主持人总结", "");
  for (const [key, label] of summarySections) {
    lines.push(`### ${label}`, "", ...linesForList(result.moderatorSummary[key]), "");
  }

  return `${lines.join("\n").trim()}\n`;
};

export const reportFileName = (result: RoundtableResult): string => {
  const safeQuestion = result.question
    .trim()
    .slice(0, 28)
    .replace(/[\\/:*?"<>|\s，。？！、；：]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${safeQuestion || "roundtable-report"}.md`;
};
