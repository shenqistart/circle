import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DiscussionView } from "../components/DiscussionView";
import { builtInExperts } from "../data/expertPresets";
import { createMockRoundtable } from "../domain/mockRoundtableGenerator";
import { downloadRoundtablePdf } from "../services/roundtablePdfDownload";

vi.mock("../services/roundtablePdfDownload", () => ({
  downloadRoundtablePdf: vi.fn().mockResolvedValue(undefined)
}));

describe("discussion view", () => {
  it("hides report export actions until the moderator summary is ready", () => {
    const streamingResult = {
      ...createMockRoundtable("如何验证一个新产品？", builtInExperts.slice(0, 3)),
      moderatorSummary: { consensus: ["先验证真实需求。"], disagreements: [], insights: [], actions: [] },
      moderatorSummaryStatus: "streaming" as const
    };

    render(<DiscussionView result={streamingResult} />);

    expect(screen.getByText("Round 1 · 初始立场")).toBeInTheDocument();
    expect(screen.getByText("主持人总结")).toBeInTheDocument();
    expect(screen.getByText("生成中")).toBeInTheDocument();
    expect(screen.getByText("先验证真实需求。")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "导出 MD" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "下载 PDF" })).not.toBeInTheDocument();
  });

  it("downloads a PDF from a completed report", async () => {
    const result = {
      ...createMockRoundtable("如何验证一个新产品？", builtInExperts.slice(0, 3)),
      moderatorSummaryStatus: "completed" as const
    };

    render(<DiscussionView result={result} />);
    fireEvent.click(screen.getByRole("button", { name: "下载 PDF" }));

    await waitFor(() => expect(downloadRoundtablePdf).toHaveBeenCalledWith(result));
  });
});
