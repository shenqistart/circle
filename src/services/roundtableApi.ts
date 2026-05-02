import { createMockRoundtable } from "../domain/mockRoundtableGenerator";
import { validateRoundtableResult } from "../domain/roundtableContract";
import type { ExpertPreset, RoundtableResult } from "../domain/types";

type GenerateRoundtableResult = {
  result: RoundtableResult;
  source: "llm" | "mock-fallback";
  message: string;
};

const requestRoundtable = async (question: string, experts: ExpertPreset[]): Promise<RoundtableResult> => {
  const response = await fetch("/api/roundtable", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, experts })
  });

  if (!response.ok) {
    throw new Error(`LLM endpoint failed with ${response.status}`);
  }

  const payload = (await response.json()) as { result?: RoundtableResult };
  if (!payload.result) {
    throw new Error("LLM endpoint returned no result");
  }

  const errors = validateRoundtableResult(payload.result);
  if (errors.length > 0) {
    throw new Error(errors.join("; "));
  }

  return payload.result;
};

export const generateRoundtable = async (
  question: string,
  experts: ExpertPreset[]
): Promise<GenerateRoundtableResult> => {
  try {
    return {
      result: await requestRoundtable(question, experts),
      source: "llm",
      message: "已使用后端大模型生成圆桌。"
    };
  } catch {
    return {
      result: createMockRoundtable(question, experts),
      source: "mock-fallback",
      message: "后端大模型不可用，已使用本地 mock 生成。"
    };
  }
};
