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
            sse({ type: "final_result", result: finalResult })
          ].join("")
        )
      )
    );

    render(<App />);

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
    expect(screen.getByText("主持人总结")).toBeInTheDocument();
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
});
