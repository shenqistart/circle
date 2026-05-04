import { afterEach, describe, expect, it, vi } from "vitest";
import { builtInExperts } from "../data/expertPresets";
import { createMockRoundtable } from "../domain/mockRoundtableGenerator";
import type { RoundtableStreamEvent } from "../domain/types";
import { streamRoundtable } from "../services/roundtableApi";

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

const eventStreamResponse = (chunks: string[], init: ResponseInit = {}) =>
  new Response(streamFromChunks(chunks), {
    ...init,
    headers: {
      "Content-Type": "text/event-stream",
      ...(init.headers instanceof Headers ? Object.fromEntries(init.headers) : init.headers)
    }
  });

describe("roundtable api client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the streamed backend final result when it satisfies the roundtable contract", async () => {
    const result = createMockRoundtable("如何做 AI 教育产品？", experts);
    const events: RoundtableStreamEvent[] = [];
    const fetchSpy = vi.fn().mockResolvedValue(
      eventStreamResponse([
        sse({ type: "run_started", runId: "1", question: result.question, experts: [] }).slice(0, 24),
        sse({ type: "run_started", runId: "1", question: result.question, experts: [] }).slice(24),
        sse({ type: "final_result", result })
      ])
    );
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
      vi.fn().mockResolvedValue(eventStreamResponse([sse({ type: "error", message: "provider unavailable", retryable: true })]))
    );

    await expect(
      streamRoundtable("如何做 AI 教育产品？", experts, {
        onEvent: vi.fn()
      })
    ).rejects.toThrow("provider unavailable");
  });

  it("passes an abort signal to the streaming request", async () => {
    const result = createMockRoundtable("如何做 AI 教育产品？", experts);
    const controller = new AbortController();
    const fetchSpy = vi.fn().mockResolvedValue(eventStreamResponse([sse({ type: "final_result", result })]));
    vi.stubGlobal("fetch", fetchSpy);

    await streamRoundtable("如何做 AI 教育产品？", experts, {
      signal: controller.signal,
      onEvent: vi.fn()
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/roundtable/stream",
      expect.objectContaining({ signal: controller.signal })
    );
  });
});
