export type SourceKind =
  | "nuwa-skill"
  | "zhuzi-skill"
  | "multi-perspective-analysis"
  | "cangjie-skill"
  | "local"
  | "catalog-repo";

export type SourceType = "built-in" | "local";

export type EvidenceStatus =
  | "repo-head-resolves-only"
  | "user-authored-local"
  | "user-edited-local";

export type ProvenanceStatus =
  | "initially-reviewed"
  | "execution-needs-verification"
  | "local-derived";

export type ResponseMode =
  | "opening"
  | "challenge"
  | "build"
  | "concede"
  | "reframe"
  | "closing";

export type ExpertPreset = {
  id: string;
  name: string;
  shortLabel: string;
  source: SourceKind;
  sourceUrl?: string;
  evidenceRefs: string[];
  provenanceStatus: ProvenanceStatus;
  thinkingStyle: string;
  mentalModels: string[];
  decisionHeuristics: string[];
  antiPatterns: string[];
  honestyBoundary: string;
  responseStyle: string;
  skillId: string;
  domainTags: string[];
  shortDescription: string;
  sourceType: SourceType;
  sourceRepo?: string;
  installCommand?: string;
  repoHead?: string;
  evidenceStatus: EvidenceStatus;
  evidenceNote?: "content-license-not-verified" | string;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type RoutingStrategyId = "deterministic" | "llm-assisted";

export type RoutingMatch = {
  expert: ExpertPreset;
  score: number;
  matchedTags: string[];
  reason: string;
  strategy: "deterministic";
};

export type ExpertTurn = {
  expertId: string;
  expertName: string;
  roundId: number;
  responseMode: ResponseMode;
  respondsToExpertId?: string;
  content: string;
};

export type DiscussionRound = {
  id: number;
  title: string;
  turns: ExpertTurn[];
};

export type ModeratorSummary = {
  consensus: string[];
  disagreements: string[];
  insights: string[];
  actions: string[];
};

export type RoundtableResult = {
  question: string;
  experts: ExpertPreset[];
  rounds: DiscussionRound[];
  moderatorSummary: ModeratorSummary;
};

export type PresetExportFile = {
  schemaVersion: 1;
  exportedAt: string;
  presets: ExpertPreset[];
};
