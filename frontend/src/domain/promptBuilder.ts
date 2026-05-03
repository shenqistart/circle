import type { ExpertPreset } from "./types";

export const buildRoundtablePrompt = (question: string, experts: ExpertPreset[]): string => {
  const expertLines = experts
    .map(
      (expert) =>
        `- ${expert.name}: tags=${expert.domainTags.join(", ")}; style=${expert.thinkingStyle}; response=${expert.responseStyle}`
    )
    .join("\n");
  return [
    "你是中立主持人，请组织一个真实圆桌。",
    `问题：${question}`,
    "专家：",
    expertLines,
    "要求：至少 2 轮；第二轮必须点名回应其他专家；最后输出主持人总结。"
  ].join("\n");
};
