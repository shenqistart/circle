import { afterEach, describe, expect, it, vi } from "vitest";
import { builtInExperts } from "../data/expertPresets";
import { createMockRoundtable } from "../domain/mockRoundtableGenerator";
import type { RoundtableStreamEvent } from "../domain/types";
import { parseSseEvents, streamRoundtable } from "../services/roundtableApi";

const experts = builtInExperts.slice(0, 2);
const encoder = new TextEncoder();

const sse = (event: RoundtableStreamEvent) => `event: roundtable\ndata: ${JSON.stringify(event)}\n\n`;

const streamFromChunks = (chunks: string[]) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    }
  });

describe("roundtable api client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses SSE chunks while preserving incomplete frames", () => {
    const result = createMockRoundtable("如何做 AI 教育产品？", experts);
    const first = parseSseEvents(sse({ type: "run_started", runId: "1", question: result.question, experts: [] }).slice(0, 20));
    expect(first.events).toEqual([]);
    const second = parseSseEvents(
      sse({ type: "run_started", runId: "1", question: result.question, experts: [] }).slice(20) +
        sse({ type: "final_result", result }),
      first.carry
    );
    expect(second.events.map((event) => event.type)).toEqual(["run_started", "final_result"]);
  });

  it("uses the streamed backend final result when it satisfies the roundtable contract", async () => {
    const result = createMockRoundtable("如何做 AI 教育产品？", experts);
    const events: RoundtableStreamEvent[] = [];
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      body: streamFromChunks([
        sse({ type: "run_started", runId: "1", question: result.question, experts: [] }),
        sse({ type: "final_result", result })
      ])
    });
    vi.stubGlobal("fetch", fetchSpy);

    const generated = await streamRoundtable("如何做 AI 教育产品？", experts, {
      onEvent: (event) => events.push(event)
    });

    expect(generated).toEqual(result);
    expect(events.map((event) => event.type)).toEqual(["run_started", "final_result"]);
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/roundtable/stream",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("surfaces backend stream errors instead of falling back to mock data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        body: streamFromChunks([sse({ type: "error", message: "provider unavailable", retryable: true })])
      })
    );

    await expect(
      streamRoundtable("如何做 AI 教育产品？", experts, {
        onEvent: vi.fn()
      })
    ).rejects.toThrow("provider unavailable");
  });
});
