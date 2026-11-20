// shared/llm.ts  (v3)
// Same callLLM() signature as before, so no other file changes.
// Calls go to the Bifrost gateway (OpenAI-compatible endpoint). Bifrost holds the real
// provider keys (Gemini, Groq); this app only holds a Bifrost virtual key. Server-side only.
import "dotenv/config"; // must load before process.env is read below
import OpenAI from "openai";
import { z } from "zod";

const client = new OpenAI({
  baseURL: process.env.LLM_BASE_URL ?? "http://localhost:8080/v1", // Bifrost gateway URL
  apiKey: process.env.BIFROST_VK ?? "bifrost-local",               // Bifrost virtual key (sk-bf-...)
});

const MODEL = process.env.LLM_MODEL ?? ""; // e.g. "gemini/gemini-3.5-flash-lite"

// Comma-separated backups, tried by Bifrost if the main model fails (e.g. 429)
// e.g. LLM_FALLBACKS=groq/<model-id>
const FALLBACKS = (process.env.LLM_FALLBACKS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export class LLMError extends Error {
  constructor(message: string, public attempts: number) {
    super(message);
    this.name = "LLMError";
  }
}

interface CallOptions<T extends z.ZodTypeAny> {
  system: string;
  prompt: string;
  schema: T;
  maxRetries?: number; // default 2
  timeoutMs?: number;  // default 120s (some models can be slow)
  maxTokens?: number;  // default 4000 (reasoning tokens count toward this)
}

const JSON_RULES =
  "Respond with ONLY valid JSON. No markdown, no code fences, no text before or after. " +
  "If a value is unknown use null, never invent facts.";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function extractJson(raw: string): unknown {
  const cleaned = raw.replace(/```json|```/gi, "").trim();
  const start = cleaned.search(/[\[{]/);
  if (start === -1) throw new Error("No JSON found in response");
  return JSON.parse(cleaned.slice(start));
}

export async function callLLM<T extends z.ZodTypeAny>(opts: CallOptions<T>): Promise<z.infer<T>> {
  const { system, prompt, schema, maxRetries = 2, timeoutMs = 120_000, maxTokens = 4000 } = opts;
  if (!MODEL) throw new LLMError("LLM_MODEL is not set in .env", 0);

  let userPrompt = prompt;
  let lastError = "unknown error";

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const params = {
        model: MODEL,
        max_tokens: maxTokens,
        temperature: 0,
        messages: [
          { role: "system", content: `${system}\n\n${JSON_RULES}` },
          { role: "user", content: userPrompt },
        ],
        // Bifrost-specific field: backup models if the main one fails
        ...(FALLBACKS.length ? { fallbacks: FALLBACKS } : {}),
      };

      const res = await client.chat.completions.create(
        params as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
        { timeout: timeoutMs },
      );

      const text = res.choices[0]?.message?.content ?? "";
      return schema.parse(extractJson(text));
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);

      if ((err as { status?: number }).status === 429) {
        // A daily quota can't recover in seconds, so stop instead of burning attempts
        if (/per day|PerDay/i.test(lastError)) {
          throw new LLMError(`Daily quota exhausted: ${lastError.slice(0, 200)}`, attempt);
        }
        // Per-minute limit: wait, then retry
        await sleep(3000 * attempt);
      }

      userPrompt = `${prompt}\n\nYour previous reply was invalid: ${lastError.slice(0, 500)}\nReturn corrected JSON only.`;
    }
  }
  throw new LLMError(`LLM call failed after ${maxRetries + 1} attempts: ${lastError}`, maxRetries + 1);
}