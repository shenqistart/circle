import type { ExpertPreset, RoutingMatch, RoutingStrategyId } from "./types";

const synonyms: Record<string, string[]> = {
  ai: ["ai", "人工智能", "模型", "大模型", "llm", "agent", "开源", "工程", "教育"],
  创业: ["创业", "startup", "商业模式", "增长", "市场", "用户", "产品"],
  产品: ["产品", "设计", "体验", "用户", "战略", "增长"],
  教育: ["教育", "学习", "教学", "职业", "专业", "学校", "课程"],
  风险: ["风险", "不确定", "市场", "反脆弱", "尾部", "危机"],
  内容: ["内容", "视频", "youtube", "传播", "注意力", "创作"],
  投资: ["投资", "估值", "决策", "逆向", "复利", "资本"],
  组织: ["组织", "人才", "管理", "全球化", "团队", "文化"]
};

const tokenize = (input: string): string[] => {
  const lower = input.toLowerCase();
  const ascii = lower.match(/[a-z0-9]+/g) ?? [];
  const chinese = lower.match(/[\u4e00-\u9fa5]{1,}/g) ?? [];
  const expanded = Object.entries(synonyms)
    .filter(([key, values]) => lower.includes(key) || values.some((value) => lower.includes(value)))
    .flatMap(([key, values]) => [key, ...values]);
  return Array.from(new Set([...ascii, ...chinese, ...expanded].filter(Boolean)));
};

const fieldContains = (field: string, token: string): boolean =>
  field.toLowerCase().includes(token.toLowerCase());

const scoreExpert = (questionTokens: string[], expert: ExpertPreset): RoutingMatch => {
  const matchedTags = expert.domainTags.filter((tag) =>
    questionTokens.some((token) => fieldContains(tag, token) || fieldContains(token, tag))
  );
  const searchable = [
    expert.shortDescription,
    expert.thinkingStyle,
    expert.responseStyle,
    expert.name,
    expert.skillId
  ].join(" ");
  const textMatches = questionTokens.filter((token) => fieldContains(searchable, token));
  const completeness =
    expert.thinkingStyle && expert.responseStyle && expert.domainTags.length > 0 ? 0.5 : 0;
  const score = matchedTags.length * 5 + textMatches.length * 2 + completeness;
  const reason =
    matchedTags.length > 0
      ? `规则推荐：匹配 ${matchedTags.slice(0, 3).join("、")}`
      : `规则推荐：根据描述和风格的弱匹配进入候选`;
  return {
    expert,
    score,
    matchedTags,
    reason,
    strategy: "deterministic"
  };
};

export const recommendExperts = (
  question: string,
  experts: ExpertPreset[],
  limit = 3,
  strategy: RoutingStrategyId = "deterministic"
): RoutingMatch[] => {
  if (strategy !== "deterministic") {
    throw new Error("llm-assisted routing is a future explicit strategy and is not enabled in the MVP");
  }
  const tokens = tokenize(question);
  return experts
    .filter((expert) => expert.enabled)
    .map((expert) => scoreExpert(tokens, expert))
    .sort((a, b) => b.score - a.score || a.expert.name.localeCompare(b.expert.name, "zh-CN"))
    .slice(0, limit);
};

export const canGenerateWithExperts = (experts: ExpertPreset[]): boolean => experts.length >= 2;
