# TASKS

Effort points are proposed estimates (1 small, 5 large). Member names are TBD. Status: `[ ]` open, `[x]` done. Do not start P1 until all P0 acceptance criteria pass. Task IDs are used in branch names and PRs.

## Member A: Frontend and UX (P0 = 18, P1 = 6)
- [ ] A-01 (3, P0) Design system, shared components, responsive shell
- [ ] A-02 (2, P0) Home screen: form, counter, validation, example button (FR-01)
- [ ] A-03 (2, P0) Progress screen: stages, cancel, error banner
- [ ] A-04 (5, P0) Report screen: score, claim table, risks, corrected answer, copy (FR-09)
- [ ] A-05 (4, P0) Claim Detail screen with Truth Passport view (FR-06)
- [ ] A-06 (2, P0) Accessibility, loading, empty and error states
- [ ] A-07 (3, P1) Truth Timeline UI (FR-10)
- [ ] A-08 (3, P1) Time-Travel date picker and result UI (FR-11)

## Member B: Backend and Data (P0 = 18, P1 = 6)
- [ ] B-01 (2, P0) Repo setup, environments, API scaffold, API keys
- [ ] B-02 (3, P0) Database schema and persistence for P0 entities
- [ ] B-03 (4, P0) REST endpoints and pipeline orchestration (stage order, parallel claims, timeouts, retries)
- [ ] B-04 (5, P0) Evidence retrieval: search API, page fetch, text extraction, source dates (FR-04)
- [ ] B-05 (2, P0) Freshness score and confidence calculation in code (FR-09, FR-06)
- [ ] B-06 (2, P0) Security (server-side keys, rate limiting, input validation) and deployment
- [ ] B-07 (4, P1) Wayback Machine archive retrieval (FR-11)
- [ ] B-08 (2, P1) History list endpoint

## Member C: AI and Verification Logic (P0 = 18, P1 = 6)
- [ ] C-01 (4, P0) Claim extraction: prompt, JSON schema, validation (FR-02)
- [ ] C-02 (3, P0) Fact Expiry Predictor: volatility classes and recheck table (FR-03)
- [ ] C-03 (4, P0) Source Conflict Detective (FR-05)
- [ ] C-04 (3, P0) Hidden Risk Detector (FR-07)
- [ ] C-05 (3, P0) Minimal Correction Engine (FR-08)
- [ ] C-06 (1, P0) Evaluation set (20 AI answers) and KPI-1 to KPI-4 testing
- [ ] C-07 (3, P1) Timeline event building (FR-10)
- [ ] C-08 (3, P1) Time-travel verification logic (FR-11)

## Shared (all three, Phase 0)
- [ ] S-01 Answer open questions Q1 to Q8 in PRD Section 16
- [ ] S-02 Agree and commit contracts to `docs/contracts/`: report/claim JSON schema (A and B), claim-to-verdict function (B and C), status/volatility/flag vocabulary (all)
- [ ] S-03 Confirm stack, LLM provider, search API; update CLAUDE.md commands
- [ ] S-04 Demo scenarios, 3 rehearsals, pitch
