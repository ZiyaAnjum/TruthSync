// TEMPORARY DEMO DATA. Replaced by the real API response in the API-connection step.
import type { Report, ClaimReport } from '../../../shared/schemas'
import { sampleReport } from '../../../shared/fixtures'

export function getMockReport(variant?: string): Report {
  if (variant === 'clean') {
    return {
      ...sampleReport,
      claims: sampleReport.claims.map((claim) => ({
        ...claim,
        conflict: {
          ...claim.conflict,
          verdict: 'current',
          conflict_found: false,
        },
      })),
      risks: [],
      correction: null,
    }
  }

  if (variant !== 'many') {
    return sampleReport
  }

  const report: Report = {
    ...sampleReport,
    claims: [...sampleReport.claims],
    risks: [...sampleReport.risks],
  }

  const extraClaims: ClaimReport[] = [
    {
      claim: {
        id: 'c2',
        text: 'The ExamplePhone Pro costs $799.',
        type: 'product',
        entity: 'ExamplePhone Pro',
        original_sentence: 'The ExamplePhone Pro costs $799.',
        checkable: true,
      },
      expiry: {
        claim_id: 'c2',
        volatility_class: 'fast',
        reason: 'Product prices can change frequently.',
        recheck_after_days: 7,
        expires_on: '2026-11-26',
      },
      evidence: [
        {
          claim_id: 'c2',
          url: 'https://example.com/products/examplephone-pro',
          title: 'ExamplePhone Pro pricing',
          snippet: 'The ExamplePhone Pro is listed for $799.',
          published_date: '2026-11-18',
          retrieved_at: '2026-11-19T10:00:00Z',
        },
      ],
      conflict: {
        claim_id: 'c2',
        stances: [
          {
            url: 'https://example.com/products/examplephone-pro',
            stance: 'supports',
            quote: 'listed for $799',
            reason: 'The product page confirms the listed price.',
            source_date: '2026-11-18',
          },
        ],
        conflict_found: false,
        newest_supporting_date: '2026-11-18',
        verdict: 'current',
      },
      score: { claim_id: 'c2', freshness_score: 92, confidence: 90 },
    },
    {
      claim: {
        id: 'c3',
        text: 'The ExamplePhone Pro runs software version 16.',
        type: 'product',
        entity: 'ExamplePhone Pro',
        original_sentence: 'The ExamplePhone Pro runs software version 16.',
        checkable: true,
      },
      expiry: {
        claim_id: 'c3',
        volatility_class: 'medium',
        reason: 'Software versions change as updates are released.',
        recheck_after_days: 30,
        expires_on: '2026-12-19',
      },
      evidence: [
        {
          claim_id: 'c3',
          url: 'https://example.com/support/examplephone-software',
          title: 'ExamplePhone software support',
          snippet: 'The latest listed release is version 16.',
          published_date: '2026-11-18',
          retrieved_at: '2026-11-19T10:00:00Z',
        },
        {
          claim_id: 'c3',
          url: 'https://example.com/updates/examplephone-version-17',
          title: 'ExamplePhone version 17 update',
          snippet: 'Version 17 is available for the ExamplePhone Pro.',
          published_date: '2026-11-19',
          retrieved_at: '2026-11-19T10:00:00Z',
        },
      ],
      conflict: {
        claim_id: 'c3',
        stances: [
          {
            url: 'https://example.com/support/examplephone-software',
            stance: 'supports',
            quote: 'latest listed release is version 16',
            reason: 'This support page lists version 16 as latest.',
            source_date: '2026-11-18',
          },
          {
            url: 'https://example.com/updates/examplephone-version-17',
            stance: 'contradicts',
            quote: 'Version 17 is available',
            reason: 'A newer update page lists version 17.',
            source_date: '2026-11-19',
          },
        ],
        conflict_found: true,
        newest_supporting_date: '2026-11-18',
        verdict: 'disputed',
      },
      score: { claim_id: 'c3', freshness_score: 50, confidence: 70 },
    },
    {
      claim: {
        id: 'c4',
        text: 'The ExamplePhone Pro launch offer ends on December 1, 2026.',
        type: 'product',
        entity: 'ExamplePhone Pro launch offer',
        original_sentence: 'The ExamplePhone Pro launch offer ends on December 1, 2026.',
        checkable: true,
      },
      expiry: {
        claim_id: 'c4',
        volatility_class: 'fast',
        reason: 'Offers can expire or change quickly.',
        recheck_after_days: 7,
        expires_on: '2026-11-26',
      },
      evidence: [],
      conflict: {
        claim_id: 'c4',
        stances: [],
        conflict_found: false,
        newest_supporting_date: null,
        verdict: 'unverifiable',
      },
      score: { claim_id: 'c4', freshness_score: 35, confidence: 25 },
    },
    {
      claim: {
        id: 'c5',
        text: 'The ExamplePhone Pro includes a $50 launch offer.',
        type: 'product',
        entity: 'ExamplePhone Pro launch offer',
        original_sentence: 'The ExamplePhone Pro includes a $50 launch offer.',
        checkable: false,
      },
      expiry: {
        claim_id: 'c5',
        volatility_class: 'fast',
        reason: 'Product offers can change frequently.',
        recheck_after_days: 7,
        expires_on: '2026-11-26',
      },
      evidence: [
        {
          claim_id: 'c5',
          url: 'https://example.com/offers/examplephone-pro',
          title: 'ExamplePhone Pro launch offer',
          snippet: 'A $50 launch offer is available with the ExamplePhone Pro.',
          published_date: '2026-11-18',
          retrieved_at: '2026-11-19T10:00:00Z',
        },
      ],
      conflict: {
        claim_id: 'c5',
        stances: [
          {
            url: 'https://example.com/offers/examplephone-pro',
            stance: 'supports',
            quote: '$50 launch offer is available',
            reason: 'The offer page lists a $50 launch offer.',
            source_date: '2026-11-18',
          },
        ],
        conflict_found: false,
        newest_supporting_date: '2026-11-18',
        verdict: 'current',
      },
      score: { claim_id: 'c5', freshness_score: 88, confidence: 80 },
    },
  ]

  report.claims.push(...extraClaims)
  report.risks.push({
    id: 'r2',
    severity: 'medium',
    description: 'The ExamplePhone Pro launch offer could not be verified.',
    affected_claim_ids: ['c4'],
  })

  return report
}
