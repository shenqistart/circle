import { validateRoundtableResult } from "../domain/roundtableContract";
import type { ExpertPreset, RoundtableResult, RoundtableStreamEvent } from "../domain/types";

type StreamRoundtableOptions = {
  onEvent: (event: RoundtableStreamEvent) => void;
};

const parseSseFrame = (frame: string): RoundtableStreamEvent | null => {
  const data = frame
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");
  if (!data) return null;
  return JSON.parse(data) as RoundtableStreamEvent;
};

export const parseSseEvents = (chunk: string, carry = ""): { events: RoundtableStreamEvent[]; carry: string } => {
  const text = carry + chunk;
  const parts = text.split(/\r?\n\r?\n/);
  const nextCarry = parts.pop() ?? "";
  return {
    events: parts.map(parseSseFrame).filter((event): event is RoundtableStreamEvent => Boolean(event)),
    carry: nextCarry
  };
};

export const streamRoundtable = async (
  question: string,
  experts: ExpertPreset[],
  options: StreamRoundtableOptions
): Promise<RoundtableResult> => {
  const response = await fetch("/api/roundtable/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, experts })
  });

  if (!response.ok) {
    throw new Error(`后端圆桌接口失败：${response.status}`);
  }
  if (!response.body) {
    throw new Error("后端圆桌接口没有返回流式响应");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let carry = "";
  let finalResult: RoundtableResult | null = null;

  while (true) {
    const { value, done } = await reader.read();
    const chunk = done ? decoder.decode() : decoder.decode(value, { stream: true });
    const { events, carry: nextCarry } = parseSseEvents(chunk, carry);
    carry = nextCarry;
    for (const event of events) {
      options.onEvent(event);
      if (event.type === "error") {
        throw new Error(event.message);
      }
      if (event.type === "final_result") {
        const errors = validateRoundtableResult(event.result);
        if (errors.length > 0) {
          throw new Error(errors.join("; "));
        }
        finalResult = event.result;
      }
    }
    if (done) break;
  }

  const trailing = parseSseFrame(carry);
  if (trailing) {
    options.onEvent(trailing);
    if (trailing.type === "error") throw new Error(trailing.message);
    if (trailing.type === "final_result") {
      const errors = validateRoundtableResult(trailing.result);
      if (errors.length > 0) {
        throw new Error(errors.join("; "));
      }
      finalResult = trailing.result;
    }
  }

  if (!finalResult) {
    throw new Error("后端圆桌流结束前没有返回最终结果");
  }
  return finalResult;
};
