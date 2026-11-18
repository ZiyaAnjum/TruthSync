# TruthLens AI: Team Contract (Schemas + LLM Wrapper)

Owner: Member C. Schema version: 1.0.0

## Files (in the `shared/` folder)
| File | What it is | Who uses it |
|---|---|---|
| `schemas.ts` | Every JSON shape (Zod + types) | A, B, C |
| `llm.ts` | The only way to call the LLM | B (server), C |
| `fixtures.ts` | Sample `Report` for building UI/API early | A, B |

## Rules for everyone
1. Import types and validators from `shared/schemas.ts`. Never redefine or rename a field locally.
2. Need a new field or change? Message Member C first. Do not edit `schemas.ts` yourself.
3. Only `shared/llm.ts` may call the LLM. Never call an AI API directly, and never use API keys in frontend code.
4. Scores (`freshness_score`, `confidence`) and `expires_on` are computed in code, never by the LLM.
5. Dates are `YYYY-MM-DD`. Scores are 0-100.

## Who owns what
- **A (Frontend):** consumes `Report`, `AnalysisStatus`, `ApiError`. Build against `sampleReport`.
- **B (Backend):** returns `Report`/`AnalysisStatus`/`ApiError`, produces `Evidence`, computes `ClaimScore`. Validate every response with the schema before sending.
- **C (AI):** produces `Claim`, `ExpiryPrediction`, `ConflictResult`, `Risk`, `Correction` using `callLLM`.

## Paste this into CLAUDE.md / RULES.md AND at the top of every AI-agent prompt
```
SHARED CONTRACT (mandatory):
- Read shared/schemas.ts, shared/llm.ts and shared/fixtures.ts before writing any code.
- Use the types and Zod schemas from shared/schemas.ts exactly as defined. Do not rename, add or remove fields.
- All LLM calls must use callLLM() from shared/llm.ts with a Zod schema. Never call an AI API directly.
- Never put API keys in frontend code. Keys stay in server .env.
- Freshness score, confidence and expiry dates are calculated in code, not by the LLM.
- If a task needs a schema change, stop and tell me instead of editing schemas.ts.
- Change only what this task requires. Follow RULES.md.
```
