# TruthSync Evaluation Suite (Task C-06)

The evaluation suite validates the AI verification pipeline on a standardized benchmark of 20 realistic AI-generated answers against dated frozen web evidence.

> **Note on Ground Truth**: Every answer in `answers.json` contains `"label_status": "NEEDS_HUMAN_REVIEW"`. Ground truth labels are documented for benchmarking and await human review before final judge rehearsal.

---

## KPI Definitions (PRD Section 3 & 14)

1. **KPI-1: Claim Extraction Recall**
   - **Target**: >= 80%
   - **Definition**: The percentage of checkable factual claims present in the AI answers that are successfully extracted as atomic claims.
   - **Formula**: `(Extracted Ground-Truth Claims / Total Expected Claims) * 100%`

2. **KPI-2: Stale-Claim Detection Rate**
   - **Target**: >= 70%
   - **Definition**: The percentage of truly outdated facts identified and classified as `"outdated"` by the conflict detective engine.
   - **Formula**: `(Detected Outdated Claims / Total Ground-Truth Outdated Claims) * 100%`

3. **KPI-3: Complete Evidence Traceability**
   - **Target**: 100%
   - **Definition**: The percentage of checked claims that are explicitly supported by at least one traceable source URL, publication date (or explicit "undated" label), and verifiable snippet.
   - **Formula**: `(Traceable Claims / Total Checked Claims) * 100%`

4. **KPI-4: Preservation of Unchanged Claims**
   - **Target**: 100%
   - **Definition**: In answers where minimal correction was applied, 100% of non-outdated / correct facts must remain byte-for-byte identical to the original input text.
   - **Formula**: `(Preserved Unchanged Sentences / Total Unchanged Sentences in Corrected Answers) * 100%`

---

## How to Run

### 1. Mock Mode (Fast, Offline, Deterministic)
Runs offline against the frozen evidence in `evidence.json` with zero network overhead:
```bash
cd backend
npx tsx eval/runEval.ts
```

### 2. Live API Mode
Runs full pipeline extraction, conflict analysis, and minimal correction using Anthropic:
```bash
cd backend
npx tsx eval/runEval.ts --real
```

Output results and metric breakdowns are automatically written to `backend/eval/results.json`.

---

## How to Add New Answers

1. Open `backend/eval/answers.json`.
2. Add a new entry with the following structure:
```json
{
  "id": "ans-21",
  "label_status": "NEEDS_HUMAN_REVIEW",
  "answer_text": "Your 2 to 5 sentence AI answer text.",
  "expected_claims": [
    {
      "id": "ans-21-c1",
      "text": "Specific atomic claim statement",
      "expected_verdict": "current" | "outdated" | "disputed" | "unverifiable",
      "entity": "Primary entity",
      "original_sentence": "Exact verbatim sentence from answer_text."
    }
  ],
  "notes": "Context and explanation of ground truth."
}
```
3. Open `backend/eval/evidence.json` and add corresponding evidence items keyed by `ans-21-c1`.

