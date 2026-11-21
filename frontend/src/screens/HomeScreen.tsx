import { useState } from 'react'
import { PageLayout } from '../components/PageLayout'
import { EXAMPLE_AI_ANSWER } from '../lib/exampleAnswer'
import { MAX_ANSWER_CHARS, MAX_QUESTION_CHARS } from '../lib/limits'

type HomeScreenProps = {
  onVerify: (answerText: string, question: string) => void
}

export function HomeScreen({ onVerify }: HomeScreenProps) {
  const [answer, setAnswer] = useState('')
  const [question, setQuestion] = useState('')

  const answerLength = answer.length
  const excessCharacters = answerLength - MAX_ANSWER_CHARS
  const isOverLimit = excessCharacters > 0
  const isNearLimit = answerLength >= MAX_ANSWER_CHARS * 0.85 && !isOverLimit
  const isEmpty = answer.trim().length === 0
  const isDisabled = isEmpty || isOverLimit
  const answerMessage = isOverLimit
    ? `Answer is too long. Shorten it by ${excessCharacters} characters.`
    : isEmpty
      ? 'Enter an answer to enable verification.'
      : null
  const characterMessage =
    answerMessage ??
    (isNearLimit ? `You're close to the ${MAX_ANSWER_CHARS} character limit.` : null)

  function handleVerify() {
    if (isDisabled) {
      return
    }

    onVerify(answer.trim(), question.trim())
  }

  return (
    <PageLayout step={1}>
      <div className="home-screen mx-auto min-w-0 max-w-3xl">
        <section className="home-hero">
          <h1 id="home-heading" className="home-hero__title">
            Don&apos;t just trust the answer.{' '}
            <span className="home-hero__title-accent">Reconstruct the truth.</span>
          </h1>
          <p className="home-hero__tagline mt-3">
            Verify what AI says. Stay in sync with reality.
          </p>
          <ul className="hero-chips mt-5" aria-label="How TruthSync helps">
            {['Extract claims', 'Check sources', 'Get a corrected answer'].map((label) => (
              <li key={label} className="hero-chip">
                <svg
                  className="hero-chip__check"
                  viewBox="0 0 20 20"
                  width="16"
                  height="16"
                  aria-hidden="true"
                  fill="none"
                >
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="m6.5 10 2.2 2.2 4.8-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {label}
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="answer-form-heading"
          className="premium-card premium-card--elevated min-w-0 p-5 sm:p-7"
        >
          <div>
            <p className="text-sm font-semibold text-slate-700">
              This version verifies product facts (prices, specs, software versions, offers).
            </p>
            <h2 id="answer-form-heading" className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Check an AI-generated answer
            </h2>
          </div>

          <div className="mt-6">
            <label htmlFor="ai-answer" className="block text-sm font-semibold text-slate-900">
              Paste the AI answer you want to check
            </label>
            <textarea
              id="ai-answer"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              rows={9}
              aria-describedby={
                characterMessage
                  ? 'answer-counter answer-limit-message'
                  : 'answer-counter'
              }
              aria-invalid={isOverLimit}
              className="form-control mt-2 block min-h-52 w-full resize-y rounded-xl border border-slate-300 px-3 py-3 text-base leading-6 text-slate-950 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20"
              placeholder="Paste the AI-generated answer here..."
            />
            <div className="mt-2 flex min-w-0 flex-wrap items-center justify-between gap-2">
              <p
                id="answer-counter"
                aria-live="polite"
                className={`text-sm font-semibold ${
                  isOverLimit
                    ? 'text-red-800'
                    : isNearLimit
                      ? 'text-amber-900'
                      : 'text-slate-700'
                }`}
              >
                {answerLength} / {MAX_ANSWER_CHARS}
              </p>
              <button
                type="button"
                onClick={() => setAnswer(EXAMPLE_AI_ANSWER)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              >
                Use an example answer
              </button>
            </div>
            <div
              className="character-meter mt-2"
              aria-hidden="true"
            >
              <div
                className={`character-meter__fill ${
                  isOverLimit
                    ? 'character-meter__fill--over'
                    : isNearLimit
                      ? 'character-meter__fill--near'
                      : ''
                }`}
                style={{
                  transform: `scaleX(${Math.min(answerLength / MAX_ANSWER_CHARS, 1)})`,
                }}
              />
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Illustrative example only. Not current product information.
            </p>
            {characterMessage && (
              <p
                id="answer-limit-message"
                aria-live="polite"
                className={`mt-2 text-sm font-semibold ${
                  isOverLimit
                    ? 'text-red-800'
                    : isNearLimit
                      ? 'text-amber-900'
                      : 'text-slate-700'
                }`}
              >
                {characterMessage}
              </p>
            )}
          </div>

          <div className="mt-5">
            <label htmlFor="original-question" className="block text-sm font-semibold text-slate-900">
              Original question (optional)
            </label>
            <input
              id="original-question"
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={MAX_QUESTION_CHARS}
              className="form-control mt-2 block w-full rounded-xl border border-slate-300 px-3 py-3 text-base text-slate-950 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20"
              placeholder="What question prompted the answer?"
            />
          </div>

          <button
            type="button"
            onClick={handleVerify}
            disabled={isDisabled}
            className="button-primary mt-6 flex w-full items-center justify-center gap-2 px-4 py-3 text-base font-bold outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
          >
            Verify
            <svg
              viewBox="0 0 20 20"
              width="20"
              height="20"
              aria-hidden="true"
              fill="none"
            >
              <path
                d="M3.5 10h12m-5-5 5 5-5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </section>
      </div>
    </PageLayout>
  )
}
