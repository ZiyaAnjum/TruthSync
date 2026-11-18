# TruthSync

> **Verify what AI says. Stay in sync with reality.**

TruthSync is an AI-powered fact verification platform built for the **Geek Room Global AI Hackathon (PS 06)**.

It helps users find outdated, conflicting and unsupported information in AI-generated answers using live web research and AI-powered evidence analysis. This version focuses on **product facts** (prices, specifications, software versions, offers). General facts are planned for the future.

---

## The Problem

AI tools can generate answers that were once correct but are no longer accurate. For example:

- Outdated product prices
- Old software versions
- Expired offers
- Outdated company information
- Changes in policies and regulations

Traditional fact-checking asks whether information is correct. TruthSync asks whether it is **still correct today**.

## Our Solution

Users paste an AI-generated answer, and TruthSync checks each factual claim against current web evidence. It flags potentially outdated or conflicting information, explains its findings, and generates a corrected answer with supporting sources.

---

## Key Features

### Core Features

| Feature | What it does |
| --- | --- |
| AI Answer and Claim Extraction | Identifies individual factual claims in AI-generated answers |
| Live Evidence Research | Retrieves current information using Tavily |
| Fact Verification | Evaluates claims against the retrieved evidence |
| Source Conflict Detective | Identifies disagreements between sources |
| Fact Expiry Predictor | Estimates how quickly information may become outdated |
| Hidden Risk Detector | Flags potentially outdated prices, offers and details |
| Minimal Correction Engine | Corrects only the parts of an answer that need changes |
| Truth Passport | Structured verification record with source references and timestamps |
| Truth Timeline | Shows available historical changes in a fact |
| Reality Reconstruction Engine | Summarises how a fact changed, using only dated evidence |

### Future Scope

- Fact Dependency Graph
- Proactive Truth Alerts
- Evidence Mutation Sentinel
- Reality Drift Simulator
- Time-Travel Verification
- General-purpose fact verification beyond products

---

## How It Works

1. The user pastes an AI-generated answer.
2. TruthSync extracts the individual factual claims.
3. Tavily searches the web for relevant evidence.
4. AI analyses the retrieved evidence.
5. TruthSync marks each claim as **Supported**, **Outdated**, **Conflicting** or **Insufficient Evidence**.
6. A verification report is generated.
7. The user receives a corrected answer with supporting sources.

---

## Technology Stack

| Component | Technology |
| --- | --- |
| Frontend | React.js |
| Backend | Node.js + Express.js |
| AI model gateway | Bifrost |
| Web research | Tavily API |
| Database | Supabase |
| Authentication | Supabase Auth |
| Frontend hosting | Vercel |
| Backend hosting | Render |

---

## Project Structure

```text
TruthSync/
├── frontend/
├── backend/
├── PRD.md
├── CLAUDE.md
├── rules.md
├── README.md
├── .env
└── .gitignore
```

The actual folder structure may change during development.

---

## Getting Started

### Prerequisites

- Node.js and npm
- Git
- A code editor such as VS Code
- Bifrost access and an available AI model
- Tavily API key
- Supabase project credentials

### Installation

Clone the repository:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd TruthSync
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

Install backend dependencies:

```bash
cd ../backend
npm install
```

### Environment Variables

Create a `.env` file in each of the `frontend` and `backend` folders.

**Backend (`backend/.env`):**

```env
PORT=5000
BIFROST_API_KEY=
BIFROST_BASE_URL=
TAVILY_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

**Frontend (`frontend/.env`):**

```env
VITE_API_BASE_URL=
```

Use the actual values required by your Bifrost deployment and Supabase setup.

> **Important:** Never commit API keys, passwords or other secrets to GitHub. Make sure `.env` is listed in `.gitignore`.

### Running the Application

Start the backend (from the `backend` folder):

```bash
npm run dev
```

Start the frontend in a separate terminal (from the `frontend` folder):

```bash
npm run dev
```

Check each folder's `package.json` for the exact scripts available.

---

## Team

| Member | Role | Responsibility |
| --- | --- | --- |
| Rida | Frontend | UI/UX, React app, responsive design, Vercel deployment |
| Eifa | Backend | Express API, Supabase, Tavily integration, Render deployment |
| Ziya | AI integration | Bifrost, claim extraction, verification and correction |

---

## Project Documentation

- [Product Requirements Document](PRD.md)
- [Claude Project Instructions](CLAUDE.md)
- [Development Rules](rules.md)

---

## Hackathon Demonstration

The demo uses an AI-generated product recommendation as its example: a user pastes an answer about whether the **Samsung Galaxy S24 is worth buying in 2026**.

TruthSync then:

1. Extracts the individual claims.
2. Searches for current product information.
3. Identifies outdated or conflicting details.
4. Displays evidence and source references.
5. Generates a corrected answer.

Actual findings depend on live search results.

---

## Project Goal

To demonstrate a functional prototype that makes AI-generated information more transparent, current and evidence-based.

**TruthSync — Verify what AI says. Stay in sync with reality.**
