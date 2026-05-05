import { useMemo, useState } from "react";
import { ExpertCatalogPanel } from "./components/ExpertCatalogPanel";
import { ExpertRecommendationPanel } from "./components/ExpertRecommendationPanel";
import { DiscussionView } from "./components/DiscussionView";
import { QuestionComposer } from "./components/QuestionComposer";
import { builtInExperts } from "./data/expertPresets";
import { canGenerateWithExperts, recommendExperts } from "./domain/expertRouter";
import type {
  DiscussionRound,
  ExpertPreset,
  ExpertTurn,
  GenerationStatus,
  ModeratorSummary,
  RoundtableResult,
  RoundtableStreamEvent,
  RoutingMatch
} from "./domain/types";
import {
  exportLocalPresets,
  importLocalPresets,
  loadLocalPresets,
  saveLocalPresets
} from "./services/expertCatalogStorage";
import { streamRoundtable } from "./services/roundtableApi";

const starterQuestion = "我想做一个 AI 教育产品，如何验证需求、控制风险并设计第一版？";
const emptySummary = (): ModeratorSummary => ({ consensus: [], disagreements: [], insights: [], actions: [] });

const ensureRound = (rounds: DiscussionRound[], roundId: number, title: string): DiscussionRound[] =>
  rounds.some((round) => round.id === roundId) ? rounds : [...rounds, { id: roundId, title, turns: [] }];

const upsertTurn = (rounds: DiscussionRound[], turn: ExpertTurn): DiscussionRound[] =>
  rounds.map((round) =>
    round.id === turn.roundId
      ? { ...round, turns: [...round.turns.filter((item) => item.expertId !== turn.expertId), turn] }
      : round
  );

const appendTurnDelta = (
  rounds: DiscussionRound[],
  event: Extract<RoundtableStreamEvent, { type: "expert_turn_delta" }>
): DiscussionRound[] =>
  rounds.map((round) =>
    round.id === event.roundId
      ? {
          ...round,
          turns: round.turns.map((turn) =>
            turn.expertId === event.expertId ? { ...turn, content: `${turn.content}${event.delta}` } : turn
          )
        }
      : round
  );

const appendSummaryDelta = (
  summary: ModeratorSummary,
  event: Extract<RoundtableStreamEvent, { type: "moderator_summary_delta" }>
): ModeratorSummary => {
  if (!event.section) {
    const currentDraft =
      summary.insights.find((item) => item.startsWith("主持人生成中：")) ?? "主持人生成中：";
    return {
      ...summary,
      insights: [
        ...summary.insights.filter((item) => !item.startsWith("主持人生成中：")),
        `${currentDraft}${event.delta}`
      ]
    };
  }
  const item = event.appendToLast ? event.delta : event.delta.trim();
  if (!item) return summary;
  if (event.appendToLast && summary[event.section].length > 0) {
    const items = [...summary[event.section]];
    items[items.length - 1] = `${items[items.length - 1]}${item}`;
    return { ...summary, [event.section]: items };
  }
  return { ...summary, [event.section]: [...summary[event.section], item] };
};

const applyStreamEvent = (
  current: RoundtableResult | null,
  event: RoundtableStreamEvent,
  question: string,
  experts: ExpertPreset[]
): RoundtableResult => {
  if (event.type === "final_result") return { ...event.result, moderatorSummaryStatus: "completed" };
  const base = current ?? {
    question,
    experts,
    rounds: [],
    moderatorSummary: emptySummary(),
    moderatorSummaryStatus: "idle"
  };
  if (event.type === "round_started") {
    return { ...base, rounds: ensureRound(base.rounds, event.roundId, event.title) };
  }
  if (event.type === "expert_turn_started") {
    const turn: ExpertTurn = {
      expertId: event.expertId,
      expertName: event.expertName,
      roundId: event.roundId,
      responseMode: event.responseMode,
      respondsToExpertId: event.respondsToExpertId,
      content: ""
    };
    return { ...base, rounds: upsertTurn(ensureRound(base.rounds, event.roundId, `Round ${event.roundId}`), turn) };
  }
  if (event.type === "expert_turn_delta") {
    return { ...base, rounds: appendTurnDelta(base.rounds, event) };
  }
  if (event.type === "expert_turn_completed") {
    return { ...base, rounds: upsertTurn(base.rounds, event.turn) };
  }
  if (event.type === "moderator_summary_started") {
    return { ...base, moderatorSummaryStatus: "streaming" };
  }
  if (event.type === "moderator_summary_delta") {
    return {
      ...base,
      moderatorSummary: appendSummaryDelta(base.moderatorSummary, event),
      moderatorSummaryStatus: "streaming"
    };
  }
  if (event.type === "moderator_summary_completed") {
    return { ...base, moderatorSummary: event.summary, moderatorSummaryStatus: "completed" };
  }
  return base;
};

export function App() {
  const [question, setQuestion] = useState(starterQuestion);
  const [localPresets, setLocalPresets] = useState<ExpertPreset[]>(() => loadLocalPresets());
  const [matches, setMatches] = useState<RoutingMatch[]>([]);
  const [selectedExperts, setSelectedExperts] = useState<ExpertPreset[]>([]);
  const [result, setResult] = useState<RoundtableResult | null>(null);
  const [editingPreset, setEditingPreset] = useState<ExpertPreset | null>(null);
  const [exportText, setExportText] = useState("");
  const [importText, setImportText] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [generationMessage, setGenerationMessage] = useState("");
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>("idle");
  const [generationError, setGenerationError] = useState("");

  const allExperts = useMemo(() => [...builtInExperts, ...localPresets], [localPresets]);

  const refreshLocalPresets = (next: ExpertPreset[]) => {
    const saved = saveLocalPresets(next);
    setLocalPresets(saved);
    setSelectedExperts((current) =>
      current
        .map((selected) => saved.find((preset) => preset.id === selected.id) ?? selected)
        .filter((selected) => selected.sourceType === "built-in" || saved.some((preset) => preset.id === selected.id))
    );
  };

  const runRecommendation = () => {
    const nextMatches = recommendExperts(question, allExperts, 3);
    setMatches(nextMatches);
    setSelectedExperts(nextMatches.map((match) => match.expert));
    setResult(null);
  };

  const toggleExpert = (expert: ExpertPreset) => {
    setSelectedExperts((current) =>
      current.some((selected) => selected.id === expert.id)
        ? current.filter((selected) => selected.id !== expert.id)
        : [...current, expert]
    );
  };

  const generateRoundtable = async () => {
    if (!canGenerateWithExperts(selectedExperts)) return;
    setGenerationStatus("streaming");
    setGenerationMessage("正在生成圆桌...");
    setGenerationError("");
    setResult({ question, experts: selectedExperts, rounds: [], moderatorSummary: emptySummary() });
    try {
      const finalResult = await streamRoundtable(question, selectedExperts, {
        onEvent: (event) => {
          setResult((current) => applyStreamEvent(current, event, question, selectedExperts));
        }
      });
      setResult({ ...finalResult, moderatorSummaryStatus: "completed" });
      setGenerationStatus("succeeded");
      setGenerationMessage("已完成真实流式圆桌。");
    } catch (error) {
      setGenerationStatus("failed");
      setGenerationError(error instanceof Error ? error.message : "圆桌生成失败");
      setGenerationMessage("");
    }
  };

  const savePreset = (preset: ExpertPreset) => {
    const next = localPresets.some((item) => item.id === preset.id)
      ? localPresets.map((item) => (item.id === preset.id ? preset : item))
      : [...localPresets, preset];
    refreshLocalPresets(next);
    setEditingPreset(null);
  };

  const copyBuiltIn = (expert: ExpertPreset) => {
    setEditingPreset({
      ...expert,
      id: `local-${expert.id}`,
      skillId: `local-${expert.skillId}`,
      source: "local",
      sourceType: "local",
      evidenceStatus: "user-authored-local",
      evidenceNote: "copied-from-built-in-metadata",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  const deleteLocal = (expert: ExpertPreset) => {
    refreshLocalPresets(localPresets.filter((preset) => preset.id !== expert.id));
    if (editingPreset?.id === expert.id) setEditingPreset(null);
  };

  const toggleLocal = (expert: ExpertPreset) => {
    refreshLocalPresets(
      localPresets.map((preset) => (preset.id === expert.id ? { ...preset, enabled: !preset.enabled } : preset))
    );
  };

  const exportCatalog = () => {
    setExportText(exportLocalPresets(localPresets));
  };

  const importCatalog = () => {
    try {
      const imported = importLocalPresets(importText);
      setLocalPresets(imported.allPresets);
      setImportMessage(`导入成功：${imported.imported.length} 个 preset`);
      setImportText("");
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : "导入失败");
    }
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Circle</p>
          <h1>AI 圆桌工作台</h1>
        </div>
        <div className="status-grid" aria-label="工作台状态">
          <div>
            <span>{allExperts.length}</span>
            <p>专家总数</p>
          </div>
          <div>
            <span>{localPresets.length}</span>
            <p>本地 preset</p>
          </div>
          <div>
            <span>{selectedExperts.length}</span>
            <p>已选阵容</p>
          </div>
        </div>
      </header>
      <div className="workspace">
        <QuestionComposer question={question} onQuestionChange={setQuestion} onRecommend={runRecommendation} />
        <ExpertRecommendationPanel
          matches={matches}
          selectedExperts={selectedExperts}
          allExperts={allExperts}
          onToggleExpert={toggleExpert}
          onGenerate={generateRoundtable}
          onRetry={generateRoundtable}
          isGenerating={generationStatus === "streaming"}
          generationMessage={generationMessage}
          generationError={generationError}
          canRetry={generationStatus === "failed"}
        />
        <DiscussionView result={result} />
      </div>
      <ExpertCatalogPanel
        builtInExperts={builtInExperts}
        localPresets={localPresets}
        existingPresets={localPresets}
        editingPreset={editingPreset}
        onCopyBuiltIn={copyBuiltIn}
        onEditLocal={setEditingPreset}
        onNewLocalPreset={() => setEditingPreset(null)}
        onSave={savePreset}
        onCancelEdit={() => setEditingPreset(null)}
        onDeleteLocal={deleteLocal}
        onToggleLocal={toggleLocal}
        exportText={exportText}
        importText={importText}
        importMessage={importMessage}
        onExport={exportCatalog}
        onImportTextChange={setImportText}
        onImport={importCatalog}
      />
    </main>
  );
}
