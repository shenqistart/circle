import { useMemo, useState } from "react";
import { ExpertCatalogPanel } from "./components/ExpertCatalogPanel";
import { ExpertPresetEditor } from "./components/ExpertPresetEditor";
import { ExpertRecommendationPanel } from "./components/ExpertRecommendationPanel";
import { DiscussionView } from "./components/DiscussionView";
import { QuestionComposer } from "./components/QuestionComposer";
import { builtInExperts } from "./data/expertPresets";
import { canGenerateWithExperts, recommendExperts } from "./domain/expertRouter";
import type { ExpertPreset, RoundtableResult, RoutingMatch } from "./domain/types";
import {
  exportLocalPresets,
  importLocalPresets,
  loadLocalPresets,
  saveLocalPresets
} from "./services/expertCatalogStorage";
import { generateRoundtable as generateRoundtableResult } from "./services/roundtableApi";

const starterQuestion = "我想做一个 AI 教育产品，如何验证需求、控制风险并设计第一版？";

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
  const [isGenerating, setIsGenerating] = useState(false);

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
    setIsGenerating(true);
    setGenerationMessage("正在生成圆桌...");
    const generated = await generateRoundtableResult(question, selectedExperts);
    setResult(generated.result);
    setGenerationMessage(generated.message);
    setIsGenerating(false);
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
      <div className="workspace">
        <div className="left-column">
          <QuestionComposer question={question} onQuestionChange={setQuestion} onRecommend={runRecommendation} />
          <ExpertRecommendationPanel
            matches={matches}
            selectedExperts={selectedExperts}
            allExperts={allExperts}
            onToggleExpert={toggleExpert}
            onGenerate={generateRoundtable}
            isGenerating={isGenerating}
            generationMessage={generationMessage}
          />
          <DiscussionView result={result} />
        </div>
        <aside className="right-column">
          <ExpertPresetEditor
            existingPresets={localPresets}
            editingPreset={editingPreset}
            onSave={savePreset}
            onCancelEdit={() => setEditingPreset(null)}
          />
        </aside>
      </div>
      <ExpertCatalogPanel
        builtInExperts={builtInExperts}
        localPresets={localPresets}
        onCopyBuiltIn={copyBuiltIn}
        onEditLocal={setEditingPreset}
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
