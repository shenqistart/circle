import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ExpertPresetEditor } from "../components/ExpertPresetEditor";

describe("expert preset editor", () => {
  it("shows validation feedback instead of saving incomplete local presets", () => {
    const onSave = vi.fn();
    render(<ExpertPresetEditor existingPresets={[]} onSave={onSave} onCancelEdit={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "保存 preset" }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(/名称必填/)).toBeInTheDocument();
  });

  it("normalizes a complete local preset before saving", () => {
    const onSave = vi.fn();
    render(<ExpertPresetEditor existingPresets={[]} onSave={onSave} onCancelEdit={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("名称"), { target: { value: "市场策略专家" } });
    fireEvent.change(screen.getByLabelText("领域标签"), { target: { value: "市场,增长" } });
    fireEvent.change(screen.getByLabelText("简述"), { target: { value: "评估市场定位。" } });
    fireEvent.change(screen.getByLabelText("思考方式"), { target: { value: "先看用户和渠道。" } });
    fireEvent.change(screen.getByLabelText("回应风格"), { target: { value: "结构化输出行动建议。" } });
    fireEvent.click(screen.getByRole("button", { name: "保存 preset" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "市场策略专家",
        skillId: "市场策略专家",
        sourceType: "local",
        domainTags: ["市场", "增长"],
        evidenceStatus: "user-authored-local"
      })
    );
  });

  it("renders import draft notice and preserves hidden provenance on save", () => {
    const onSave = vi.fn();
    render(
      <ExpertPresetEditor
        existingPresets={[]}
        editingPreset={{
          id: "local-product-coach-skill",
          name: "Product Coach",
          shortLabel: "Product Coach",
          source: "local",
          evidenceRefs: ["SKILL.md", "README.md"],
          provenanceStatus: "local-derived",
          thinkingStyle: "Focuses on product validation.",
          mentalModels: [],
          decisionHeuristics: [],
          antiPatterns: [],
          honestyBoundary: "Drafted from local docs; not installed or executed.",
          responseStyle: "Structured and direct.",
          skillId: "product-coach-skill",
          domainTags: ["产品", "本地 skill"],
          shortDescription: "Product strategy coach.",
          sourceType: "local",
          evidenceStatus: "user-authored-local",
          evidenceNote: "auto-drafted-from-local-skill-archive",
          enabled: true
        }}
        draftNotice="本地自动草拟，保存前请检查。"
        basePresetMetadata={{
          evidenceRefs: ["SKILL.md", "README.md"],
          honestyBoundary: "Drafted from local docs; not installed or executed.",
          evidenceNote: "auto-drafted-from-local-skill-archive"
        }}
        onSave={onSave}
        onCancelEdit={vi.fn()}
      />
    );

    expect(screen.getByRole("status")).toHaveTextContent("本地自动草拟");
    fireEvent.click(screen.getByRole("button", { name: "保存 preset" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        evidenceRefs: ["SKILL.md", "README.md"],
        honestyBoundary: "Drafted from local docs; not installed or executed.",
        evidenceNote: "auto-drafted-from-local-skill-archive"
      })
    );
  });
});
