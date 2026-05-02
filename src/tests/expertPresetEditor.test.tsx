import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ExpertPresetEditor } from "../components/ExpertPresetEditor";

describe("expert preset editor", () => {
  it("shows validation feedback instead of saving incomplete local presets", () => {
    const onSave = vi.fn();
    render(<ExpertPresetEditor existingPresets={[]} onSave={onSave} onCancelEdit={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "保存 preset" }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(/name 必填/)).toBeInTheDocument();
  });

  it("normalizes a complete local preset before saving", () => {
    const onSave = vi.fn();
    render(<ExpertPresetEditor existingPresets={[]} onSave={onSave} onCancelEdit={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("名称"), { target: { value: "市场策略专家" } });
    fireEvent.change(screen.getByLabelText("Skill ID"), { target: { value: "market-strategy-local" } });
    fireEvent.change(screen.getByLabelText("领域标签"), { target: { value: "市场,增长" } });
    fireEvent.change(screen.getByLabelText("简述"), { target: { value: "评估市场定位。" } });
    fireEvent.change(screen.getByLabelText("思考方式"), { target: { value: "先看用户和渠道。" } });
    fireEvent.change(screen.getByLabelText("回应风格"), { target: { value: "结构化输出行动建议。" } });
    fireEvent.click(screen.getByRole("button", { name: "保存 preset" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "市场策略专家",
        sourceType: "local",
        domainTags: ["市场", "增长"],
        evidenceStatus: "user-authored-local"
      })
    );
  });
});
