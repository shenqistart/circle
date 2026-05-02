import type { ExpertPreset, RoundtableResult, ResponseMode } from "./types";
import { validateRoundtableResult } from "./roundtableContract";

const responseModes: ResponseMode[] = ["challenge", "build", "reframe"];

export const createMockRoundtable = (question: string, experts: ExpertPreset[]): RoundtableResult => {
  if (experts.length < 2) {
    throw new Error("至少选择 2 个专家后才能生成圆桌");
  }

  const openingTurns = experts.map((expert) => ({
    expertId: expert.id,
    expertName: expert.name,
    roundId: 1,
    responseMode: "opening" as const,
    content: `${expert.name} 从「${expert.domainTags.slice(0, 2).join(" / ")}」切入：${expert.thinkingStyle} 针对“${question}”，先定义最关键的约束和机会。`
  }));

  const responseTurns = experts.map((expert, index) => {
    const target = experts[(index + experts.length - 1) % experts.length];
    const mode = responseModes[index % responseModes.length];
    return {
      expertId: expert.id,
      expertName: expert.name,
      roundId: 2,
      responseMode: mode,
      respondsToExpertId: target.id,
      content: `${expert.name} 回应 ${target.name}：我会${mode === "challenge" ? "挑战" : mode === "build" ? "补充" : "重构"}这个观点。${expert.responseStyle} 这里的下一步应当围绕可验证行动，而不是停留在口号。`
    };
  });

  const result: RoundtableResult = {
    question,
    experts,
    rounds: [
      { id: 1, title: "Round 1 · 初始立场", turns: openingTurns },
      { id: 2, title: "Round 2 · 点名回应", turns: responseTurns }
    ],
    moderatorSummary: {
      consensus: ["先明确问题的真实目标，再选择最能提供互补视角的专家组合。"],
      disagreements: ["专家分歧主要集中在速度、风险、体验、成本和长期复利的权重。"],
      insights: ["Top 3 推荐只是起点，用户调整后的最终专家集合才进入圆桌。"],
      actions: ["保留至少 2 个专家", "检查推荐理由", "根据问题补充一个本地 preset"]
    }
  };

  const errors = validateRoundtableResult(result);
  if (errors.length > 0) {
    throw new Error(errors.join("; "));
  }
  return result;
};
