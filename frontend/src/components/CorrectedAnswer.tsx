import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Correction } from '../../../shared/schemas'

type CorrectedAnswerProps = {
  correction: Correction | null
}

type Highlight = {
  start: number
  end: number
  newSpan: string
  originalSpan: string
}

function findHighlights(text: string, correction: Correction): Highlight[] {
  const highlights: Highlight[] = []

  for (const change of correction.changes) {
    if (change.new_span.length === 0) {
      continue
    }

    let start = text.indexOf(change.new_span)
    while (start !== -1) {
      const end = start + change.new_span.length
      const overlaps = highlights.some(
        (highlight) => start < highlight.end && end > highlight.start,
      )

      if (!overlaps) {
        highlights.push({
          start,
          end,
          newSpan: change.new_span,
          originalSpan: change.original_span,
        })
        break
      }

      start = text.indexOf(change.new_span, start + 1)
    }
  }

  return highlights.sort((left, right) => left.start - right.start)
}

export function CorrectedAnswer({ correction }: CorrectedAnswerProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) {
        clearTimeout(copyTimeoutRef.current)
      }
    }
  }, [])

  function clearCopyTimeout() {
    if (copyTimeoutRef.current !== null) {
      clearTimeout(copyTimeoutRef.current)
      copyTimeoutRef.current = null
    }
  }

  async function copyCorrectedAnswer(correctedText: string) {
    clearCopyTimeout()

    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      setCopyState('failed')
      return
    }

    try {
      await navigator.clipboard.writeText(correctedText)
      setCopyState('copied')
      copyTimeoutRef.current = setTimeout(() => {
        setCopyState('idle')
        copyTimeoutRef.current = null
      }, 3000)
    } catch {
      setCopyState('failed')
    }
  }

  const highlights = correction ? findHighlights(correction.corrected_text, correction) : []

  return (
    <section
      aria-labelledby="corrected-answer-heading"
      className="premium-card report-fade-up min-w-0 p-5 sm:p-6"
    >
      <h2 id="corrected-answer-heading" className="text-xl font-bold text-slate-950">
        Corrected answer
      </h2>
      {correction === null ? (
        <p className="mt-4 text-sm text-slate-700">No corrections were needed.</p>
      ) : (
        <>
          <p className="mt-4 break-words whitespace-pre-wrap text-sm leading-6 text-slate-900">
            {(() => {
              const parts: ReactNode[] = []
              let cursor = 0

              highlights.forEach((highlight, index) => {
                parts.push(correction.corrected_text.slice(cursor, highlight.start))
                parts.push(
                  <mark
                    key={`${highlight.start}-${index}`}
                    className="answer-change-mark font-semibold underline decoration-2 underline-offset-2"
                  >
                    {highlight.newSpan}
                    <span className="sr-only">
                      {' '}(changed from: {highlight.originalSpan})
                    </span>
                  </mark>,
                )
                cursor = highlight.end
              })

              parts.push(correction.corrected_text.slice(cursor))
              return parts
            })()}
          </p>

          <h3 className="mt-5 text-sm font-bold text-slate-950">Changes</h3>
          <ul className="mt-2 space-y-3">
            {correction.changes.map((change, index) => (
              <li
                key={`${change.claim_id}-${index}`}
                className="premium-inner min-w-0 break-words p-3 text-sm leading-6 text-slate-900"
              >
                <p>
                  <span>{change.original_span}</span>
                  <span className="mx-2" aria-label="changed to">→</span>
                  <span>{change.new_span}</span>
                </p>
                <p className="mt-1">
                  Source:{' '}
                  {change.source_url.startsWith('http://') ||
                  change.source_url.startsWith('https://') ? (
                    <a
                      href={change.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all font-semibold text-blue-900 underline underline-offset-2"
                    >
                      Source
                    </a>
                  ) : (
                    <span className="break-all">{change.source_url}</span>
                  )}
                </p>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => copyCorrectedAnswer(correction.corrected_text)}
            className="button-primary mt-5 w-full rounded-xl px-4 py-3 text-base font-bold outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
          >
            Copy corrected answer
          </button>
          <p
            aria-live="polite"
            className={`copy-feedback mt-2 min-h-5 text-sm font-semibold text-slate-800 ${
              copyState === 'copied' ? 'copy-feedback--copied' : ''
            }`}
          >
            {copyState === 'copied'
              ? 'Copied'
              : copyState === 'failed'
                ? 'Copy failed. Select the text and copy it manually.'
                : ''}
          </p>
        </>
      )}
    </section>
  )
}
