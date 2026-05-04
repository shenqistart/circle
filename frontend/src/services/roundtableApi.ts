import { EventStreamContentType, fetchEventSource } from "@microsoft/fetch-event-source";
import { validateRoundtableResult } from "../domain/roundtableContract";
import type { ExpertPreset, RoundtableResult, RoundtableStreamEvent } from "../domain/types";

type StreamRoundtableOptions = {
  onEvent: (event: RoundtableStreamEvent) => void;
  signal?: AbortSignal;
};

const validateFinalResult = (result: RoundtableResult) => {
  const errors = validateRoundtableResult(result);
  if (errors.length > 0) {
    throw new Error(errors.join("; "));
  }
};

export const streamRoundtable = async (
  question: string,
  experts: ExpertPreset[],
  options: StreamRoundtableOptions
): Promise<RoundtableResult> => {
  let finalResult: RoundtableResult | null = null;

  await fetchEventSource("/api/roundtable/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, experts }),
    signal: options.signal,
    openWhenHidden: true,
    async onopen(response) {
      if (!response.ok) {
        throw new Error(`后端圆桌接口失败：${response.status}`);
      }
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes(EventStreamContentType)) {
        throw new Error("后端圆桌接口没有返回流式响应");
      }
    },
    onmessage(message) {
      const event = JSON.parse(message.data) as RoundtableStreamEvent;
      options.onEvent(event);
      if (event.type === "error") {
        throw new Error(event.message);
      }
      if (event.type === "final_result") {
        validateFinalResult(event.result);
        finalResult = event.result;
      }
    },
    onerror(error) {
      throw error;
    }
  });

  if (!finalResult) {
    throw new Error("后端圆桌流结束前没有返回最终结果");
  }
  return finalResult;
};
