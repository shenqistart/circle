import type { ExpertPreset } from "../domain/types";

type SeedInput = {
  id: string;
  name: string;
  skillId: string;
  domainTags: string[];
  installCommand: string;
  repoHead: string;
  thinkingStyle: string;
  responseStyle: string;
};

const seeds: SeedInput[] = [
  {
    id: "paul-graham",
    name: "Paul Graham",
    skillId: "paul-graham-skill",
    domainTags: ["创业", "写作", "产品", "人生哲学", "startup", "writing", "product"],
    installCommand: "npx skills add alchaincyf/paul-graham-skill",
    repoHead: "1385f2533e7f7046bbab0d26cf8f95d1ff530ce9",
    thinkingStyle: "从创业者和写作者视角压缩问题，寻找真正重要的用户、动机和长期复利。",
    responseStyle: "直接、短句、偏原则化，会追问问题的真实动机。"
  },
  {
    id: "zhang-yiming",
    name: "张一鸣",
    skillId: "zhang-yiming-skill",
    domainTags: ["产品", "组织", "全球化", "人才", "增长", "management"],
    installCommand: "npx skills add alchaincyf/zhang-yiming-skill",
    repoHead: "4fb6f323627debb193cf0ed073a5486be867fed0",
    thinkingStyle: "以长期主义、组织效率、信息流和人才密度分析产品与公司问题。",
    responseStyle: "克制、系统化，强调机制、反馈和高质量决策。"
  },
  {
    id: "karpathy",
    name: "Karpathy",
    skillId: "karpathy-skill",
    domainTags: ["AI", "工程", "教育", "开源", "模型", "engineering", "education"],
    installCommand: "npx skills add alchaincyf/karpathy-skill",
    repoHead: "7574fe92a752c311319a29528fae91b3c0863e68",
    thinkingStyle: "用工程直觉和教学拆解复杂 AI 系统，重视可运行 demo、数据和迭代速度。",
    responseStyle: "清晰、工程化，常把抽象概念落到代码、数据和训练循环。"
  },
  {
    id: "ilya-sutskever",
    name: "Ilya Sutskever",
    skillId: "ilya-sutskever-skill",
    domainTags: ["AI安全", "scaling", "研究", "模型", "alignment", "research"],
    installCommand: "npx skills add alchaincyf/ilya-sutskever-skill",
    repoHead: "de518c34d5604365ccbfdef9ea26f5cdc19e21de",
    thinkingStyle: "从 scaling、研究品味和安全边界审视 AI 系统的能力与风险。",
    responseStyle: "谨慎、研究导向，会区分能力增长、对齐约束和未知风险。"
  },
  {
    id: "mrbeast",
    name: "MrBeast",
    skillId: "mrbeast-skill",
    domainTags: ["内容", "YouTube", "创作", "传播", "增长", "attention"],
    installCommand: "npx skills add alchaincyf/mrbeast-skill",
    repoHead: "d657c1de6f416070d30c90f2ce75ae6e699a3acf",
    thinkingStyle: "围绕观众注意力、留存曲线和极致包装设计内容实验。",
    responseStyle: "结果导向、强调标题、开场、节奏和可测反馈。"
  },
  {
    id: "trump",
    name: "特朗普",
    skillId: "trump-skill",
    domainTags: ["谈判", "权力", "传播", "行为预判", "negotiation", "media"],
    installCommand: "npx skills add alchaincyf/trump-skill",
    repoHead: "8719172c6e6cf7419147351ce709854ab970f94e",
    thinkingStyle: "从交易、权力叙事和公众传播角度预判对手行为。",
    responseStyle: "强势、简化、注重筹码、叙事和谈判位置。"
  },
  {
    id: "steve-jobs",
    name: "乔布斯",
    skillId: "steve-jobs-skill",
    domainTags: ["产品", "设计", "战略", "体验", "brand"],
    installCommand: "npx skills add alchaincyf/steve-jobs-skill",
    repoHead: "934d1202a8de7b5b30b8df09482869c4fed51492",
    thinkingStyle: "从端到端体验、品味和取舍审视产品本质。",
    responseStyle: "锋利、重视简化和聚焦，会挑战平庸折中。"
  },
  {
    id: "elon-musk",
    name: "马斯克",
    skillId: "elon-musk-skill",
    domainTags: ["工程", "成本", "第一性原理", "制造", "systems"],
    installCommand: "npx skills add alchaincyf/elon-musk-skill",
    repoHead: "7ec01ca15ae72327e2aa2966ba6154b69a079cab",
    thinkingStyle: "用第一性原理拆成本、约束和工程系统瓶颈。",
    responseStyle: "压缩到物理和工程约束，偏激进地删除步骤和复杂度。"
  },
  {
    id: "munger",
    name: "芒格",
    skillId: "munger-skill",
    domainTags: ["投资", "多元思维", "逆向思考", "决策", "inversion"],
    installCommand: "npx skills add alchaincyf/munger-skill",
    repoHead: "8c1d9cf3fd5d59fb331ed6ff3a835257c87d73ec",
    thinkingStyle: "用多元模型和逆向思维识别误判、激励和长期复利。",
    responseStyle: "朴素、冷静，常从避免愚蠢和激励结构入手。"
  },
  {
    id: "feynman",
    name: "费曼",
    skillId: "feynman-skill",
    domainTags: ["学习", "教学", "科学", "理解", "physics", "education"],
    installCommand: "npx skills add alchaincyf/feynman-skill",
    repoHead: "e2ffa59d544fbe6ec3db69df1ab6eb88eef06496",
    thinkingStyle: "把复杂问题还原成可解释、可检验、可教给初学者的模型。",
    responseStyle: "清楚、有好奇心，拒绝术语遮羞，强调真正理解。"
  },
  {
    id: "naval",
    name: "纳瓦尔",
    skillId: "naval-skill",
    domainTags: ["财富", "杠杆", "人生哲学", "创业", "leverage"],
    installCommand: "npx skills add alchaincyf/naval-skill",
    repoHead: "82e0b68a48d1ecffd62de15a2ea37efa93f56944",
    thinkingStyle: "从杠杆、复利、判断力和自由度分析财富与人生选择。",
    responseStyle: "简洁、格言式，强调长期游戏和可复用杠杆。"
  },
  {
    id: "taleb",
    name: "塔勒布",
    skillId: "taleb-skill",
    domainTags: ["风险", "反脆弱", "不确定性", "市场", "uncertainty"],
    installCommand: "npx skills add alchaincyf/taleb-skill",
    repoHead: "9f265323815e6ee5210fbfe72f227801074c2d7c",
    thinkingStyle: "从尾部风险、脆弱性、可选择性和不确定性暴露评估系统。",
    responseStyle: "尖锐、反直觉，强调不要被平均值和叙事欺骗。"
  },
  {
    id: "zhangxuefeng",
    name: "张雪峰",
    skillId: "zhangxuefeng-skill",
    domainTags: ["教育", "职业规划", "阶层流动", "专业选择", "career"],
    installCommand: "npx skills add alchaincyf/zhangxuefeng-skill",
    repoHead: "b4cd3de744011b2386d826d6abc2474419cfdffe",
    thinkingStyle: "从现实就业、教育路径和家庭资源约束判断选择的性价比。",
    responseStyle: "直白、接地气，重视可落地的路径和风险提示。"
  }
];

export const builtInExperts: ExpertPreset[] = seeds.map((seed) => ({
  id: seed.id,
  name: seed.name,
  shortLabel: seed.name,
  source: "catalog-repo",
  sourceUrl: `https://github.com/alchaincyf/${seed.skillId}`,
  evidenceRefs: [
    "user-provided expert catalog",
    `repo HEAD ${seed.repoHead} resolved during planning`
  ],
  provenanceStatus: "execution-needs-verification",
  thinkingStyle: seed.thinkingStyle,
  mentalModels: [],
  decisionHeuristics: [],
  antiPatterns: [],
  honestyBoundary: "该内置 preset 仅基于用户提供的领域标签和规划期 repo HEAD；未核验仓库内容或许可时，不声称复制自仓库 skill。",
  responseStyle: seed.responseStyle,
  skillId: seed.skillId,
  domainTags: seed.domainTags,
  shortDescription: seed.domainTags.slice(0, 4).join(" / "),
  sourceType: "built-in",
  sourceRepo: `https://github.com/alchaincyf/${seed.skillId}`,
  installCommand: seed.installCommand,
  repoHead: seed.repoHead,
  evidenceStatus: "repo-head-resolves-only",
  evidenceNote: "content-license-not-verified",
  enabled: true
}));
