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
  const isEmpty = answer.trim().length === 0
  const isDisabled = isEmpty || isOverLimit

  function handleVerify() {
    if (isDisabled) {
      return
    }

    onVerify(answer.trim(), question.trim())
  }

  return (
    <PageLayout>
      <section
        aria-labelledby="home-heading"
        className="mx-auto min-w-0 max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
      >
        <div>
          <p className="text-sm font-semibold text-slate-700">
            This version verifies product facts (prices, specs, software versions, offers).
          </p>
          <h1 id="home-heading" className="mt-3 text-2xl font-bold text-slate-950 sm:text-3xl">
            Check an AI-generated answer
          </h1>
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
            aria-describedby="answer-counter answer-limit-message"
            aria-invalid={isOverLimit}
            className="mt-2 block min-h-52 w-full resize-y rounded-xl border border-slate-300 px-3 py-3 text-base leading-6 text-slate-950 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20"
            placeholder="Paste the AI-generated answer here..."
          />
          <div className="mt-2 flex min-w-0 flex-wrap items-center justify-between gap-2">
            <p
              id="answer-counter"
              aria-live="polite"
              className={isOverLimit ? 'text-sm font-semibold text-red-800' : 'text-sm text-slate-600'}
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
          {isOverLimit && (
            <p
              id="answer-limit-message"
              aria-live="polite"
              className="mt-2 text-sm font-semibold text-red-800"
            >
              Answer is too long. Shorten it by {excessCharacters} characters.
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
            className="mt-2 block w-full rounded-xl border border-slate-300 px-3 py-3 text-base text-slate-950 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20"
            placeholder="What question prompted the answer?"
          />
        </div>

        <button
          type="button"
          onClick={handleVerify}
          disabled={isDisabled}
          className="mt-6 w-full rounded-xl bg-blue-800 px-4 py-3 text-base font-bold text-white outline-none hover:bg-blue-900 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
        >
          Verify
        </button>
      </section>
    </PageLayout>
  )
}
