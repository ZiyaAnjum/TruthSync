// Temporary mapping, pending confirmation from Member C.

export type DisplayStatus =
  | 'Supported'
  | 'Outdated'
  | 'Conflicting'
  | 'Insufficient Evidence'
  | 'Not Checked'

export type SchemaVerdict =
  | 'current'
  | 'outdated'
  | 'disputed'
  | 'unverifiable'

export type VolatilityClass =
  | 'realtime'
  | 'fast'
  | 'medium'
  | 'slow'
  | 'static'

export type DisplayVolatility = 'High' | 'Medium' | 'Low'

export function verdictToStatus(
  verdict: SchemaVerdict,
  checkable = true,
): DisplayStatus {
  if (!checkable) {
    return 'Not Checked'
  }

  const mapping: Record<SchemaVerdict, DisplayStatus> = {
    current: 'Supported',
    outdated: 'Outdated',
    disputed: 'Conflicting',
    unverifiable: 'Insufficient Evidence',
  }

  return mapping[verdict]
}

export function volatilityToDisplay(
  volatility: VolatilityClass,
): DisplayVolatility {
  if (volatility === 'realtime' || volatility === 'fast') {
    return 'High'
  }

  if (volatility === 'medium') {
    return 'Medium'
  }

  return 'Low'
}
