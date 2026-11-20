# TruthSync Team Guide: From Clone to Coding

A short guide for working with an AI IDE (Antigravity or similar). Follow the steps in order.

---

## Step 1: Clone the repo and install

```bash
git clone <REPO_URL>
cd TruthSync
```

Install only your own part:

```bash
cd frontend && npm install     # Rida
cd backend && npm install      # Eifa and Ziya
```

Ask the team for the API keys, then create your `.env` file. **Never commit `.env` or paste keys into prompts.**

---

## Step 2: Create your own branch (never work on `main`)

| Person | Branch name |
| --- | --- |
| Rida | `rida-frontend` |
| Eifa | `eifa-backend` |
| Ziya | `ziya-ai` |

```bash
git checkout -b rida-frontend      # use your own branch name
git push -u origin rida-frontend
```

Check you are on your branch any time with `git branch`. The star shows where you are.

---

## Step 3: Open the project in Antigravity and send the Starting Prompt

Open the **TruthSync** folder in your IDE. In a new chat, paste this first. Change the three `<...>` parts.

```text
Read rules.md and PRD.md fully before doing anything.
Then tell me, in 5 lines: what TruthSync is, my role, and my tasks.

My name: <your name>
My role: <Frontend / Backend / AI integration>
My branch: <your branch name>

Rules you must follow strictly:
- Work only on my branch. Run `git branch` first. If I am on main or the wrong branch, stop and tell me.
- Only edit files in my own area (<frontend/ or backend/>). Ask me before touching anything else.
- Follow rules.md and PRD.md. Do not add features that are not in the PRD.
- Never print, hard-code or commit API keys or .env files.
- Make small changes and explain each one simply.
```

Wait for the IDE to answer. If its summary of your role is wrong, correct it before you continue.

---

## Step 4: Get a good prompt for each task (the two-AI method)

Do not write coding prompts yourself. Let Claude write them for you.

**4a. Message Claude (the normal chat) with this:**

```text
I am working on TruthSync (a hackathon project that verifies AI answers about products).
My role: <role>.
My task now: <one task, for example "build the Home screen with a text box and Verify button">.
Write a clear, step-by-step prompt I can paste into Antigravity.
Tell it to read rules.md and PRD.md, stay on my branch, and only edit my folder.
```

**4b. Copy Claude's answer and paste it into Antigravity.**

**4c. Check the result:** run the app, test it, and read what changed. If something is wrong, tell the IDE exactly what is wrong. Do not just say "fix it".

> Tip: give one task at a time. Small tasks give better results.

---

## Step 5: Save your work often

```bash
git add .
git commit -m "short message about what you did"
git push
```

Do this after every working task, not only at the end of the day.

---

## Step 6: Get your teammates' latest work

Before you start each work session:

```bash
git checkout main
git pull origin main
git checkout rida-frontend         # your branch
git merge main
```

---

## Step 7: Send your work for review

When a feature works, open a **Pull Request** on GitHub from your branch into `main`. Another teammate reviews it before it is merged.

| Your work | Reviewed by |
| --- | --- |
| Rida | Eifa |
| Eifa | Ziya |
| Ziya | Rida |

---

## Quick Rules

1. Always check your branch before you start.
2. Read `rules.md` and `PRD.md` first, every new chat.
3. One task per prompt.
4. Never share or commit API keys.
5. Commit and push often.
6. Stuck for more than 20 minutes? Ask the team.
