import type { DisplayStatus } from '../lib/status'

type StatusBadgeProps = {
  status: DisplayStatus
}

const badgeStyles: Record<DisplayStatus, string> = {
  Supported: 'status-pill--supported',
  Outdated: 'status-pill--outdated',
  Conflicting: 'status-pill--conflicting',
  'Insufficient Evidence': 'status-pill--insufficient',
  'Not Checked': 'status-pill--not-checked',
}

function StatusIcon({ status }: StatusBadgeProps) {
  if (status === 'Supported') {
    return (
      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
        <path d="m6.5 10 2.2 2.2 4.8-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (status === 'Outdated') {
    return (
      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
        <path d="M10 5.5V10l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (status === 'Conflicting') {
    return (
      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="none">
        <path d="M10 2.5 18 17H2L10 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M10 7v4.5M10 14v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }

  if (status === 'Insufficient Evidence') {
    return (
      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
        <path d="M10 6.5v4M10 14v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="none">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2" />
    </svg>
  )
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`status-pill ${badgeStyles[status]}`}
    >
      <StatusIcon status={status} />
      <span>{status}</span>
    </span>
  )
}
