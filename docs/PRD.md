# TruthSync — Product Requirements Document

Last updated: 18 November 2026

## 1. Product Overview

TruthSync is a responsive web app that checks whether an AI-generated answer about products is accurate, up to date and backed by dated evidence, then corrects only the parts that are wrong.

| Item | Detail |
| --- | --- |
| Product name | TruthSync |
| Vision | Don't just verify the answer. Reconstruct the reality behind it. |
| Core message | Verify what AI says. Stay in sync with reality. |
| Hackathon | Geek Room Global AI Hackathon, Problem Statement PS 06 |
| Judging date | 21 November 2026 |
| Build goal | Functional hackathon prototype that does a few features properly, not all 12 features half-built |
| Platform | Responsive web application for mobile and laptop |
| Domain (this version) | Product facts only: prices, specifications, software versions, offers, availability and support status. General facts are future scope. |
| Team | Rida (frontend), Eifa (backend), Ziya (AI integration) |
| Development assistance | Google Antigravity |

**How it works.** The user pastes an AI answer. TruthSync splits it into factual claims, researches each product claim on the live web, flags outdated, conflicting and risky information, and shows a report with a freshness score, sources, a fact timeline and a minimally corrected answer.

**Objectives**

1. Detect outdated and conflicting product claims in AI answers.
2. Make every verdict traceable to a source and a date.
3. Change only what is wrong and leave correct text untouched.
4. Deliver one complete, reliable demo by 21 November 2026.

## 2. Problem and Target Users

AI answers often state outdated prices, software versions, offers and specifications with full confidence, and ordinary fact-checking only asks whether a claim is correct, not whether it is still correct today.

**What TruthSync does differently:** it evaluates accuracy, freshness and reliability together, shows when each fact was last verified and how it changed, and explains why sources disagree.

| Users | Who | Need | Pain point |
| --- | --- | --- | --- |
| Primary | Students and researchers | Dated, traceable sources for AI claims | Unsure whether facts are current or properly sourced |
| Primary | Journalists and content creators | Quickly check AI-drafted product details before publishing | No time to verify every claim by hand |
| Primary | Everyday AI users (for example, someone buying a phone) | Know which parts of an answer are stale before acting | Cannot tell whether prices, offers or versions are current |
| Secondary | Developers | A verification layer they can add to their own AI apps | No ready way to check the freshness of AI output |

The developer integration is a future feature; the prototype serves the primary users through the website.

## 3. Goals, Success Metrics and Scope

The primary success measure is a working end-to-end demo: a user pastes an AI answer about a product and gets a meaningful, source-supported verification report.

**Success metrics.** Measured on an evaluation set of 10 AI answers about products, each with known stale facts, written by the team on 18 November.

| ID | Metric | Target |
| --- | --- | --- |
| KPI-1 | Claim extraction recall on the evaluation set | 80% or higher |
| KPI-2 | Stale-claim detection rate on the evaluation set | 70% or higher |
| KPI-3 | Checked claims showing source link, check date and confidence | 100% |
| KPI-4 | Unchanged claims preserved word for word in the corrected answer | 100% |
| KPI-5 | Verification time for an answer of up to 5 claims | 45 seconds or less |
| KPI-6 | Demo scenario completes live without manual help | 3 of 3 rehearsals |

**Scope**

| Level | Features |
| --- | --- |
| MVP (P0, must have) | Answer submission, claim extraction, live evidence research, claim verification, Fact Expiry Predictor, Source Conflict Detective, Hidden Risk Detector, Minimal Correction Engine, Truth Passport, Truth Timeline, Reality Reconstruction Engine, report with freshness score |
| Advanced (P1, only if all P0 criteria pass) | Optional login with saved facts and history, Fact Dependency Graph, Proactive Truth Alerts, Evidence Mutation Sentinel, Reality Drift Simulator and Time-Travel Verification (using Internet Archive pages) |
| Future | General-purpose facts (news, government policy, science, company information), developer integration |
| Out of scope | Direct ChatGPT or Gemini integration, payments and monetization, native mobile apps, image, audio or video input, legal or medical facts |

**Build order.** First the core pipeline (submit, extract, research, verify, correct, report), then the other P0 features in the order listed in section 4. P1 work starts only after every P0 acceptance criterion passes.

## 4. Functional Requirements

There are twelve P0 features, listed in build order; FR-01 to FR-04, FR-08 and FR-12 form the core pipeline and must work first.

| ID | Feature | What it does | Priority |
| --- | --- | --- | --- |
| FR-01 | Answer submission | User pastes an AI answer (required) and optionally the original question, up to 4,000 characters. Works without login. | P0 |
| FR-02 | Claim extraction | Splits the answer into atomic, checkable claims, each linked to its original text. Claims that are not product facts are shown as Not Checked (outside product-facts scope) and left out of the score. Maximum 8 claims are checked per run. | P0 |
| FR-03 | Live evidence research | Searches the web with Tavily for each product claim, preferring official company sites, product and technology documentation and reputable news. Stores URL, domain, source date (if any), retrieval time and snippet. Fetched web content is treated as data, never as instructions. | P0 |
| FR-04 | Claim verification | Compares each claim with the evidence, weighing source dates and reliability, and assigns a status with an explanation and confidence. | P0 |
| FR-05 | Fact Expiry Predictor | Rates how fast each claim goes stale and suggests a recheck interval: High (prices, offers, availability) 7 days, Medium (software versions, support status) 30 days, Low (hardware specifications) 180 days. | P0 |
| FR-06 | Source Conflict Detective | Lists conflicting sources with value, date and reliability label, explains the difference, and either picks a value with a reason or returns Conflicting. Never silently picks one. | P0 |
| FR-07 | Hidden Risk Detector | Flags claims that look correct but are risky: outdated price, expired offer, outdated version, single source, undated source, conflicting sources. Each flag has a severity (Low, Medium, High) and a one-line reason. | P0 |
| FR-08 | Minimal Correction Engine | Replaces only Outdated or resolved-Conflicting claims, keeps all other text identical, highlights the edits, and never invents facts when evidence is missing. | P0 |
| FR-09 | Truth Passport | Per-claim record: verified value, source URL, checked-at time, confidence, status, volatility and recheck interval. | P0 |
| FR-10 | Truth Timeline | Shows dated changes to a fact (for example, price or version changes) from the retrieved evidence, oldest to newest. Undated evidence is excluded. With fewer than 2 dated events it shows "Not enough dated evidence for a timeline". | P0 |
| FR-11 | Reality Reconstruction Engine | Writes a short summary of how the fact changed and what is true today, using only dated retrieved evidence, with every statement tied to a source. No invented history. | P0 |
| FR-12 | Report and freshness score | One-screen summary with score, claim table, risks, corrected answer and links to each claim's detail. | P0 |
| FR-13 | Optional login, saved facts and history | Registered users (Supabase Auth) save verified facts and see past verifications. Anonymous use stays fully working. | P1 |
| FR-14 | Advanced features | Fact Dependency Graph, Proactive Truth Alerts, Evidence Mutation Sentinel, Reality Drift Simulator and Time-Travel Verification. None are needed for the demo. | P1 |

### Verification report contents

- Overall freshness score from 0 to 100, shown as an estimate and not a guarantee of truth.
- Each factual claim with its status: **Supported**, **Outdated**, **Conflicting** or **Insufficient Evidence** (plus **Not Checked** for claims outside scope).
- A plain explanation for each status.
- Supporting and contradicting source links with publication dates when available (otherwise labelled "undated").
- Verification timestamp, confidence estimate, expiry rating and risk flags per claim.
- The corrected answer, with changed claims highlighted.

Insufficient Evidence must always look different from Outdated, so users can tell "we could not find proof" from "this is wrong".

**Scoring rules (calculated in code, not by the AI model)**

- Freshness score = 100 multiplied by the average of the claim points, rounded to a whole number. Points per checked claim: Supported 1.0, Conflicting 0.5, Insufficient Evidence 0.5, Outdated 0. Not Checked claims are excluded. The same inputs always give the same score.
- Confidence is the AI's estimate from 0 to 100, then reduced by code: minus 20 for a single source, minus 15 for an undated source, minus 25 for conflicting sources, never below 0.

## 5. User Flow and Screens

A first-time user goes from pasting an answer to reading a corrected report in one pass, without creating an account.

**Main flow**

1. User opens Home and pastes an AI-generated answer from ChatGPT, Gemini or another tool.
2. User taps Verify and the frontend sends the answer to the backend.
3. AI extracts the individual factual claims and marks which are product facts.
4. Tavily retrieves live web evidence for each product claim.
5. AI analyses the evidence, source dates, reliability, conflicts, expiry and risks.
6. The system builds the verification report.
7. Frontend shows claim statuses, sources, explanations, timeline, reconstruction and the corrected answer.
8. Registered users can save facts and see history (P1).

| Screen | Required content and interactions |
| --- | --- |
| Home | Text field for the answer (optional field for the question), character counter, note that this version verifies product facts, Verify button (disabled when empty or over the limit), example-answer button |
| Progress | Stage list (extracting claims, checking sources, comparing, preparing report) with a state per stage, cancel button that keeps the input, error banner |
| Report | Freshness score, claim table filterable by status, risk flags, corrected answer with highlighted edits, copy button |
| Claim Detail | Truth Passport, sources with dates, conflict explanation, Truth Timeline, Reality Reconstruction |
| History (P1) | Past verifications and saved facts; open or delete |

**Design rules**

- One primary action per screen.
- Every status badge uses the same icon, label and colour on every screen and never relies on colour alone: Supported green, Outdated red, Conflicting amber, Insufficient Evidence grey, Not Checked outlined.
- Style is a clean, high-contrast, report-style layout with claim status first; Rida chooses the exact palette and type within these rules.
- Single column under 640 px; two columns (score and corrected answer beside the claim table) from 1024 px; no horizontal scrolling at 360, 768 or 1280 px.

## 6. Technology, Architecture, Data and API

The stack is React, Node.js with Express, Bifrost, Tavily and Supabase, which matches the team's MERN skills and keeps setup short for a 3-day build.

| Component | Technology | Purpose |
| --- | --- | --- |
| Frontend | React.js (Vite and Tailwind CSS) | Responsive UI with loading, error and empty states |
| Backend | Node.js with Express.js | API and pipeline orchestration |
| AI gateway | Bifrost | Claim extraction, evidence analysis, expiry and risk assessment, correction, reconstruction |
| Live web research | Tavily API | Official sites, government pages, product and technology documentation, research publications and reputable news |
| Database | Supabase | Storage |
| Authentication | Supabase Auth | Optional accounts (P1) |
| Historical evidence | Internet Archive Wayback Machine | Archived pages, used only for P1 Time-Travel Verification |
| Deployment | Vercel (frontend), Render (backend) | Hosting |
| Development assistance | Google Antigravity | Coding help during the build |

**Rules for the AI layer**

- Require structured JSON output from the AI and validate it against a schema; retry once, then mark the claim Insufficient Evidence.
- Every verdict must cite retrieved evidence. No evidence means Insufficient Evidence, never a guess.
- Compare source dates and reliability; never treat all search results as equally trustworthy.
- Compute scores, confidence adjustments and recheck intervals in code, not in the AI model.
- Process claims in parallel to stay within the 45-second target.
- API keys live only in backend environment variables and are never committed to Git or exposed in frontend code.

**Pipeline (the backend coordinates every step)**

1. Receive and validate the pasted answer.
2. Extract claims and mark product facts through Bifrost.
3. Search each product claim with Tavily.
4. Analyse evidence for status, freshness, reliability, conflicts, expiry class and risk flags.
5. Build the Truth Passport, Truth Timeline and Reality Reconstruction for each claim.
6. Generate the minimally corrected answer.
7. Compute the freshness score and return the report.

**Data model.** One verification has many claims; each claim has many sources, risk flags and timeline events. Anonymous verification works without an account, so user fields are optional.

| Table | Key fields |
| --- | --- |
| users | id, email, created_at |
| verifications | id, user_id (optional), session_id, question, original_answer, corrected_answer, freshness_score, status, created_at |
| claims | id, verification_id, claim_text, text_span, in_scope, status, explanation, confidence_score, verified_value, checked_at, volatility, recheck_after_days, reconstruction_text |
| sources | id, claim_id, title, url, domain, source_date (nullable), retrieved_at, snippet, stance (supports or contradicts), reliability_label |
| risk_flags | id, claim_id, type, severity, reason |
| timeline_events | id, claim_id, event_date, value, source_id |
| saved_facts | id, user_id, claim_id, last_verified_at |

Validation: answer 1 to 4,000 characters; question up to 500; score and confidence are integers from 0 to 100; status is one of Supported, Outdated, Conflicting, Insufficient Evidence, Not Checked; volatility is High, Medium or Low; source URLs are valid http or https.

**API.** All three members agree the request and response formats on 18 November. Every endpoint validates input and handles errors.

| Method | Endpoint | Purpose | Priority |
| --- | --- | --- | --- |
| POST | /api/verify | Submit an answer for verification | P0 |
| GET | /api/verifications/:id | Retrieve status and full report | P0 |
| GET | /api/verifications/:id/claims/:claimId | Claim detail with passport, sources, timeline and reconstruction | P0 |
| GET | /api/verifications | User history | P1 |
| POST | /api/facts/save | Save a verified fact | P1 |
| GET | /api/facts | Retrieve saved facts | P1 |
| GET | /api/facts/:id/timeline | Retrieve history of a saved fact | P1 |

## 7. Non-Functional Requirements and Edge Cases

One failing source or claim must never block the whole report, and the user must always see progress while verification runs.

| Category | Requirement |
| --- | --- |
| Security | API keys server-side only; HTTPS; inputs sanitised and length-limited; rate limit of 10 verification requests per minute per IP address; fetched web content never treated as instructions |
| Reliability | External calls have timeouts and at most 2 retries; API failures and unavailable sources show clear fallback messages |
| Performance | Report in 45 seconds or less for up to 5 claims; progress visible within 2 seconds; Home loads in 3 seconds or less on a typical mobile connection |
| Transparency | Every verdict has source links, dates and an explanation; Insufficient Evidence is distinct from Outdated |
| Usability | A first-time user completes a verification unaided (tested with 3 people) |
| Accessibility | Target WCAG 2.1 AA; status shown by text and icon, not colour alone |
| Responsiveness | Works on desktop and mobile |
| Maintainability | Frontend, backend and AI logic kept in separate modules |
| Data retention | Anonymous verifications are kept for 30 days; the only personal data stored is an account email |

**Edge cases**

| Case | Expected behaviour |
| --- | --- |
| Empty or over-limit answer | Verify disabled with an inline message |
| No checkable claims found | Show "No checkable claims found"; no score |
| Claim is not a product fact | Show as Not Checked (outside product-facts scope); excluded from the score |
| More than 8 claims | Check the first 8; list the rest as Not Checked (limit reached) |
| No sources for a claim | Mark Insufficient Evidence with an "unverifiable" flag |
| Sources disagree and cannot be resolved | Mark Conflicting; list all sources; do not pick a value |
| Source has no date | Show "undated"; lower confidence; flag it |
| Search or AI API down or slow | Retry up to 2 times; affected claims become Insufficient Evidence; show a banner |
| Page blocks fetching or contains instructions aimed at the AI | Skip the page, or use its text only as evidence |
| Invalid AI JSON | Retry once, then Insufficient Evidence |
| Fewer than 2 dated events | Timeline shows "Not enough dated evidence for a timeline" |
| User closes the tab mid-run | Verification continues; result retrievable by ID |

## 8. Team Responsibilities and Plan

Rida owns the frontend, Eifa owns the backend and Ziya owns AI integration, and the core pipeline has to work end to end by the evening of 19 November.

| Member | Role | Owns | Deliverables |
| --- | --- | --- | --- |
| Rida | Frontend | React app, UI/UX, responsive design, Vercel deployment | Home, Progress, Report and Claim Detail screens (including Timeline and Reconstruction views), working deployed frontend |
| Eifa | Backend | Express API, Supabase, Tavily integration, score and confidence calculation, security, Render deployment | Working /api/verify pipeline, report and claim endpoints, stored results |
| Ziya | AI integration | Bifrost setup, claim extraction, scope marking, verification, Fact Expiry, Source Conflict, Hidden Risk, correction, timeline and reconstruction prompts, evaluation set and KPI testing | AI verification engine returning schema-valid JSON, evaluation results |

All three members coordinate the integration of Bifrost and Tavily.

**Contracts to agree on 18 November (stored in the repository)**

1. Report and claim JSON schema between Rida and Eifa. Rida builds on a mock file until the API is ready.
2. Claim-to-verdict function between Eifa and Ziya: input is a claim plus evidence list; output is status, verified value, expiry class, risk flags, timeline events, reconstruction text and passport fields. Ziya builds on sample evidence files until retrieval is ready.
3. Shared vocabulary for statuses, volatility classes and flag types, changed only when all three agree.

**Schedule**

1. **18 Nov:** agree the three contracts, set up the repository and deployment skeletons, confirm Tavily and Bifrost keys work, write the 10-answer evaluation set, build screens on mock data.
2. **19 Nov:** core pipeline working end to end (FR-01 to FR-04, FR-08, FR-12). Rida connects the frontend to the real API.
3. **20 Nov:** finish FR-05 to FR-07 and FR-09 to FR-11, fix failures found on the evaluation set, handle errors, deploy to Vercel and Render, cache the demo scenario and record a backup run. If Timeline or Reconstruction is not reliable by 18:00, show it only on the cached demo scenario and label it clearly.
4. **21 Nov:** final rehearsals and judging. P1 work happens only if every P0 criterion has already passed.

**Working rules:** Rida reviews Ziya's work, Eifa reviews Rida's, and Ziya reviews Eifa's; each member tests the other two members' features; all three attend every rehearsal; no secrets in the repository; code suggested by Google Antigravity is reviewed by a teammate before merging.

## 9. Acceptance Criteria, Demo, Risks and Decisions

The MVP counts as done when a user can paste an AI answer about a product without logging in and receive a source-supported report with a corrected answer.

**Acceptance criteria (P0)**

| Feature | Given, When, Then |
| --- | --- |
| FR-01 | Given Home, when a non-empty answer within the limit is submitted, then a verification starts and Progress opens; an empty answer keeps Verify disabled. |
| FR-02 | Given a test answer with 4 known claims, when extraction runs, then all 4 appear separately with their text; a non-product claim appears as Not Checked. |
| FR-03 | Given a claim, when retrieval finishes, then each source has a URL, retrieval time and a date or "undated". |
| FR-04 | Given retrieved evidence, when verification runs, then each claim has a status, explanation and confidence. |
| FR-05 | Given a verified claim, when expiry is assigned, then it has a volatility class and a recheck interval of 7, 30 or 180 days. |
| FR-06 | Given two sources with different values, when comparison runs, then both are listed with value and date plus an explanation; if unresolved the status is Conflicting. |
| FR-07 | Given a claim with one undated source, when risk detection runs, then single-source and undated-source flags appear with severity and reason. |
| FR-08 | Given 1 outdated claim and 3 supported claims, when correction runs, then only the outdated claim changes and is highlighted; all other text is identical and nothing unsupported is added. |
| FR-09 | Given a verified claim, when Claim Detail opens, then value, source link, checked-at time, confidence and expiry are shown. |
| FR-10 | Given 2 or more dated pieces of evidence, when Claim Detail opens, then the timeline is in date order; with fewer than 2 it shows the not-enough-evidence message. |
| FR-11 | Given dated evidence, when reconstruction runs, then every statement cites a source and no event appears that the evidence does not support. |
| FR-12 | Given a completed verification, when Report opens, then it shows score, claim table, risks and corrected answer; the same inputs give the same score. |
| Reliability | Given one failed source fetch, when the pipeline runs, then the report still completes and only the affected claim is Insufficient Evidence. |

**Definition of done:** meets its criteria on the evaluation set, handles the edge cases without crashing, API matches the agreed schema, UI works at 360, 768 and 1280 px, no secrets in the repository, reviewed by a teammate, and included in a rehearsed demo.

**Demo plan.** The demo is live, with a cached copy of the scenario and a recorded video as backups. Scenario: "Is the Samsung Galaxy S24 worth buying in 2026?"

1. Paste an AI-generated phone recommendation.
2. Show the extracted claims.
3. Retrieve current product and software information.
4. Point out outdated and conflicting claims and the risk flags.
5. Show supporting sources, the Truth Timeline and the Reality Reconstruction.
6. Generate the corrected answer.
7. Show the final verification report.

Use live results wherever possible and clearly label any cached or mock data. Prices and scores from the original concept (such as the S24 price or a 72 out of 100 score) were examples only and must be replaced with real results.

**Risks**

| Risk | Mitigation |
| --- | --- |
| Twelve P0 features in 3 days | Build the core pipeline first; fall back to the cached demo scenario for Timeline and Reconstruction if they are not reliable by 18:00 on 20 Nov |
| Live demo fails (API down, slow page) | Cache the demo scenario; keep a recorded backup run |
| AI misreads claims or invents verdicts | Verdicts must cite retrieved evidence; schema validation; no source means Insufficient Evidence |
| Irrelevant, stale or spam search results | Improve queries, prefer official and reputable sources, show source dates and reliability labels |
| Conflicting sources | Display disagreements openly with dates |
| Free-tier API limits reached | Confirm quotas on 18 Nov, cache results, limit claims to 8 per run |
| Prompt injection from fetched pages | Treat web content as data only |
| Missing historical evidence | Say clearly when history is unavailable |
| Score looks arbitrary | Show the scoring rules and each claim's points |

**Final decisions (no open questions)**

| Topic | Decision |
| --- | --- |
| Product name | TruthSync (earlier notes also say TruthLens; TruthSync is the name used everywhere) |
| Primary users | Students, researchers, journalists and everyday AI users; developers are secondary |
| Domain | Product facts only now; general facts are future scope |
| Platform and input | Responsive web app; user pastes the AI answer |
| Login | Optional and P1; anonymous use works without it |
| Monetization | None in the prototype |
| Limits | 4,000 characters per answer, 8 claims per run, 10 requests per minute per IP |
| Freshness score and confidence | Rules in section 4, calculated in code |
| Expiry intervals | High 7 days, Medium 30 days, Low 180 days |
| Data retention | Anonymous verifications kept 30 days |
| Demo format | Live, with cached and recorded backups |
| Roles | Rida frontend, Eifa backend, Ziya AI integration |
