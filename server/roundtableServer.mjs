import http from "node:http";
import { existsSync, readFileSync } from "node:fs";

const loadEnvFile = (path) => {
  if (!existsSync(path)) return;
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

loadEnvFile(".env");
loadEnvFile(".env.local");

const port = Number(process.env.PORT ?? 8787);
const baseUrl = (process.env.OPENAI_BASE_URL ?? "https://wooj.abrdns.com").replace(/\/+$/, "");
const model = process.env.OPENAI_MODEL ?? "gpt-5.5";
const reasoningEffort = process.env.OPENAI_REASONING_EFFORT ?? "high";
const responsesUrl = baseUrl.endsWith("/v1") ? `${baseUrl}/responses` : `${baseUrl}/v1/responses`;

const jsonResponse = (res, status, payload) => {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "http://127.0.0.1:5173",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  });
  res.end(JSON.stringify(payload));
};

const readJsonBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
};

const buildPrompt = ({ question, experts }) => {
  const expertLines = experts
    .map(
      (expert) =>
        `- ${expert.name} (${expert.id}): tags=${expert.domainTags.join(", ")}; thinking=${expert.thinkingStyle}; response=${expert.responseStyle}`
    )
    .join("\n");

  return [
    "请根据用户问题组织一个多专家圆桌讨论。",
    `问题：${question}`,
    "专家：",
    expertLines,
    "输出必须是 JSON，字段完全匹配：",
    "{ question, experts, rounds, moderatorSummary }",
    "要求：至少 2 轮；每个专家至少发言一次；第二轮必须用 respondsToExpertId 点名回应其他专家；主持人总结包含 consensus、disagreements、insights、actions 四组字符串数组。",
    "不要输出 markdown、解释或代码块。"
  ].join("\n");
};

const extractResponseText = (payload) => {
  if (typeof payload.output_text === "string") return payload.output_text;
  const output = Array.isArray(payload.output) ? payload.output : [];
  return output
    .flatMap((item) => (Array.isArray(item.content) ? item.content : []))
    .map((content) => content.text ?? content.output_text ?? "")
    .join("");
};

const parseRoundtableJson = (text) => {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return JSON.parse(fenced ? fenced[1] : trimmed);
};

const callResponsesApi = async (payload) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const response = await fetch(responsesUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content:
            "你是严格的圆桌主持人。只输出可解析 JSON，不得编造未给出的专家 id，不得执行或建议执行 installCommand。"
        },
        { role: "user", content: buildPrompt(payload) }
      ],
      reasoning: { effort: reasoningEffort },
      store: false
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Responses API failed: ${response.status} ${message}`);
  }

  return parseRoundtableJson(extractResponseText(await response.json()));
};

const isValidRequest = (value) =>
  value &&
  typeof value.question === "string" &&
  Array.isArray(value.experts) &&
  value.experts.length >= 2 &&
  value.experts.every(
    (expert) =>
      expert &&
      typeof expert.id === "string" &&
      typeof expert.name === "string" &&
      Array.isArray(expert.domainTags) &&
      typeof expert.thinkingStyle === "string" &&
      typeof expert.responseStyle === "string"
  );

const server = http.createServer(async (req, res) => {
  const path = new URL(req.url ?? "/", "http://127.0.0.1").pathname;

  if (req.method === "OPTIONS") {
    jsonResponse(res, 204, {});
    return;
  }

  if (req.method === "GET" && path === "/api/health") {
    jsonResponse(res, 200, {
      ok: true,
      hasApiKey: Boolean(process.env.OPENAI_API_KEY),
      baseUrl,
      model,
      reasoningEffort
    });
    return;
  }

  if (req.method !== "POST" || path !== "/api/roundtable") {
    jsonResponse(res, 404, { error: "not found" });
    return;
  }

  try {
    const requestBody = await readJsonBody(req);
    if (!isValidRequest(requestBody)) {
      jsonResponse(res, 400, { error: "question and at least 2 experts are required" });
      return;
    }
    jsonResponse(res, 200, { result: await callResponsesApi(requestBody) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "roundtable generation failed";
    const status = message.includes("OPENAI_API_KEY") ? 503 : 500;
    jsonResponse(res, status, { error: message });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Roundtable API listening on http://127.0.0.1:${port}`);
});
