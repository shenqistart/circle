import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../App";

describe("routing flow", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("recommends experts, gates generation below two experts, and generates a roundtable", async () => {
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
    expect(screen.getByText("后端大模型不可用，已使用本地 mock 生成。")).toBeInTheDocument();
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
