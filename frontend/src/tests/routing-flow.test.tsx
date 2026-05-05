import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../App";
import { builtInExperts } from "../data/expertPresets";
import { createMockRoundtable } from "../domain/mockRoundtableGenerator";

const encoder = new TextEncoder();

const streamFromText = (text: string) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    }
  });

const eventStreamResponse = (text: string) =>
  new Response(streamFromText(text), {
    headers: { "Content-Type": "text/event-stream" }
  });

const sse = (event: unknown) => `event: roundtable\ndata: ${JSON.stringify(event)}\n\n`;

describe("routing flow", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("recommends experts, gates generation below two experts, and streams a roundtable", async () => {
    const finalResult = createMockRoundtable("AI 教育产品如何验证需求并控制风险？", builtInExperts.slice(0, 3));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        eventStreamResponse(
          [
            sse({ type: "run_started", runId: "1", question: finalResult.question, experts: [] }),
            sse({ type: "round_started", roundId: 1, title: "Round 1 · 初始立场" }),
            sse({ type: "expert_turn_completed", turn: finalResult.rounds[0].turns[0] }),
            sse({ type: "moderator_summary_started" }),
            sse({ type: "moderator_summary_delta", section: "consensus", delta: finalResult.moderatorSummary.consensus[0] }),
            sse({ type: "final_result", result: finalResult })
          ].join("")
        )
      )
    );

    render(<App />);

    expect(screen.queryByText("生成后会在这里出现多轮对话和主持人总结。")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("输入要讨论的问题"), {
      target: { value: "AI 教育产品如何验证需求并控制风险？" }
    });
    fireEvent.click(screen.getByRole("button", { name: "推荐 Top 3" }));

    const recommended = screen.getByLabelText("推荐专家");
    expect(within(recommended).getByText("Karpathy")).toBeInTheDocument();

    fireEvent.click(within(recommended).getAllByRole("button", { name: "移除" })[0]);
    fireEvent.click(within(recommended).getAllByRole("button", { name: "移除" })[0]);
    expect(screen.getByRole("button", { name: "生成圆桌" })).toBeDisabled();

    fireEvent.click(within(recommended).getAllByRole("button", { name: "加入" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "生成圆桌" }));

    await waitFor(() => expect(screen.getByText("Round 1 · 初始立场")).toBeInTheDocument());
    expect(screen.getByText(finalResult.moderatorSummary.consensus[0])).toBeInTheDocument();
    const moderatorSummary = screen.getByText("主持人总结");
    const discussionLog = screen.getByText("讨论记录");
    expect(moderatorSummary.compareDocumentPosition(discussionLog)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.getByRole("button", { name: "导出 MD" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下载 PDF" })).toBeInTheDocument();
    expect(screen.getByText("已完成真实流式圆桌。")).toBeInTheDocument();
  });

  it("shows backend errors and lets the user retry", async () => {
    const result = createMockRoundtable("AI 教育产品如何验证需求并控制风险？", builtInExperts.slice(0, 3));
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(eventStreamResponse(sse({ type: "error", message: "provider unavailable", retryable: true })))
      .mockResolvedValueOnce(eventStreamResponse(sse({ type: "final_result", result })));
    vi.stubGlobal("fetch", fetchSpy);

    render(<App />);

    fireEvent.change(screen.getByLabelText("输入要讨论的问题"), {
      target: { value: "AI 教育产品如何验证需求并控制风险？" }
    });
    fireEvent.click(screen.getByRole("button", { name: "推荐 Top 3" }));
    fireEvent.click(screen.getByRole("button", { name: "生成圆桌" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("provider unavailable"));
    fireEvent.click(screen.getByRole("button", { name: "重试" }));

    await waitFor(() => expect(screen.getByText("已完成真实流式圆桌。")).toBeInTheDocument());
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("lets a user add a local preset that participates in recommendation", () => {
    render(<App />);

    expect(screen.queryByLabelText("名称")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "本地目录" }));
    expect(screen.getByRole("button", { name: "新增 preset" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "新增 preset" }));

    fireEvent.change(screen.getByLabelText("名称"), { target: { value: "增长实验专家" } });
    fireEvent.change(screen.getByLabelText("Skill ID"), { target: { value: "growth-experiment-local" } });
    fireEvent.change(screen.getByLabelText("领域标签"), { target: { value: "增长,实验,转化" } });
    fireEvent.change(screen.getByLabelText("简述"), { target: { value: "设计增长实验和转化验证。" } });
    fireEvent.change(screen.getByLabelText("思考方式"), { target: { value: "先拆指标，再设计最小实验。" } });
    fireEvent.change(screen.getByLabelText("回应风格"), { target: { value: "用指标和实验建议回应。" } });
    fireEvent.click(screen.getByRole("button", { name: "保存 preset" }));

    fireEvent.change(screen.getByLabelText("输入要讨论的问题"), {
      target: { value: "增长实验如何提升转化？" }
    });
    fireEvent.click(screen.getByRole("button", { name: "推荐 Top 3" }));

    expect(screen.getByLabelText("推荐专家")).toHaveTextContent("增长实验专家");
  });

  it("keeps manual expert selection collapsed until the user asks for more experts", () => {
    render(<App />);

    const moreExperts = screen.getByText("更多专家");
    expect(moreExperts.closest("details")).not.toHaveAttribute("open");

    fireEvent.click(moreExperts);

    expect(moreExperts.closest("details")).toHaveAttribute("open");
    expect(screen.getByLabelText("手动选择专家")).toHaveTextContent("Karpathy");
  });

  it("switches the expert catalog between built-in and local tabs", () => {
    render(<App />);

    expect(screen.getByRole("tab", { name: "内置目录", selected: true })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: `${builtInExperts.length} 个专家` })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "导出 JSON" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "本地目录" }));

    expect(screen.getByRole("tab", { name: "本地目录", selected: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "新增 preset" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "导出 JSON" })).toBeInTheDocument();
    expect(screen.getByLabelText("导入 JSON")).toBeInTheDocument();
    expect(screen.getByText("还没有本地 preset。")).toBeInTheDocument();
  });
});
