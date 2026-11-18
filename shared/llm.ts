// shared/llm.ts
// The ONLY place in the project allowed to call the LLM. Server-side only (never import in frontend).
// Every AI task (C-01..C-08) must go through callLLM(). Owner: Member C.
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }); // key lives in server .env only
const MODEL = process.env.LLM_MODEL ?? "claude-sonnet-5-5";             // change model via env, not code

export class LLMError extends Error {
  constructor(message: string, public attempts: number) {
    super(message);
    this.name = "LLMError";
  }
}

interface CallOptions<T extends z.ZodTypeAny> {
  system: string;          // task instructions (load from /prompts/*.md)
  prompt: string;          // the input data for this call
  schema: T;               // Zod schema the output MUST match
  maxRetries?: number;     // default 2
  timeoutMs?: number;      // default 60s
  maxTokens?: number;      // default 2000
}

const JSON_RULES =
  "Respond with ONLY valid JSON. No markdown, no code fences, no text before or after. " +
  "If a value is unknown use null, never invent facts.";

function extractJson(raw: string): unknown {
  const cleaned = raw.replace(/```json|```/gi, "").trim();
  const start = cleaned.search(/[\[{]/);
  if (start === -1) throw new Error("No JSON found in response");
  return JSON.parse(cleaned.slice(start));
}

export async function callLLM<T extends z.ZodTypeAny>(opts: CallOptions<T>): Promise<z.infer<T>> {
  const { system, prompt, schema, maxRetries = 2, timeoutMs = 60_000, maxTokens = 2000 } = opts;
  let userPrompt = prompt;
  let lastError = "unknown error";

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const res = await client.messages.create(
        {
          model: MODEL,
          max_tokens: maxTokens,
          system: `${system}\n\n${JSON_RULES}`,
          messages: [{ role: "user", content: userPrompt }],
        },
        { timeout: timeoutMs },
      );
      const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
      return schema.parse(extractJson(text)); // throws if shape is wrong
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      // Tell the model what went wrong so the retry can fix it
      userPrompt = `${prompt}\n\nYour previous reply was invalid: ${lastError.slice(0, 500)}\nReturn corrected JSON only.`;
    }
  }
  throw new LLMError(`LLM output failed after ${maxRetries + 1} attempts: ${lastError}`, maxRetries + 1);
}

// Example usage (Member C, C-01):
//   const out = await callLLM({
//     system: loadPrompt("extract-claims"),
//     prompt: JSON.stringify({ answer_text }),
//     schema: ExtractClaimsOutput,
//   });