# CLAUDE.md — TruthSync

> **STOP. Read `RULES.md` first, in full, before reading anything else or changing any file.**
> Then read the relevant parts of `docs/PRD.md` and your task in `docs/TASKS.md`.

## What this project is
TruthSync (hackathon prototype, team of 3) takes an AI-generated answer, splits it into factual claims, checks each against dated web evidence, and returns a report with a freshness score and a minimally corrected answer. Vision: "Don't just verify the answer. Reconstruct the reality behind it."
Full requirements: `docs/PRD.md` (single source of truth). If this file and the PRD disagree, the PRD wins; tell the human.

## Scope reminder
- **MVP (P0):** answer submission, claim extraction, Fact Expiry Predictor, evidence retrieval, Source Conflict Detective, Truth Passport, Hidden Risk Detector, Minimal Correction Engine, report with freshness score.
- **Stretch (P1):** Truth Timeline, Time-Travel Verification. Not before P0 acceptance passes.
- **Future (P2):** do not build.
- Domain: product facts (price, software version, offers, specs). Input is pasted text only. No login in MVP.

## Stack (Recommended in the PRD; confirm with the team before relying on it)
- Frontend: React + Vite + Tailwind CSS, in `frontend/`
- Backend: Python + FastAPI, in `backend/`
- Database: MongoDB
- LLM provider and search API: **TBD** (do not pick one yourself)

## Repository layout
```
RULES.md        mandatory rules for agents and humans
CLAUDE.md       this file
AGENTS.md       pointer for other AI tools
docs/PRD.md     product requirements (read-only for agents)
docs/TASKS.md   task list and owners
docs/contracts/ shared schemas and vocabulary (change only by agreement)
frontend/       Member A
backend/        Member B (backend/app/verification/ and backend/evaluation/ are Member C)
```

## Commands
Fill these in once the stack is scaffolded (Member B / A). Until then, do not invent commands.
- Frontend dev / test / build: TBD
- Backend dev / test: TBD

## Conventions
- Statuses (exact): `Current`, `Outdated`, `Conflicting`, `Unverified`. Volatility: `High`, `Medium`, `Low`.
- Risk flag types: outdated offer, outdated version, outdated price, unverifiable, single-source, undated source, conflicting sources.
- Scores (freshness, confidence) are computed in code, never by the LLM. LLM output must be validated against a JSON schema.
- Unchanged text in a corrected answer must stay identical to the original.
- Responsive UI, check at 360, 768, 1280 px. Status is shown by text and icon, not color alone.

## How to work
1. Get your member role and task ID. 2. Post your plan (files you will touch). 3. Make the smallest change. 4. Run checks from `RULES.md` section 6. 5. Report what changed and what you left alone.
