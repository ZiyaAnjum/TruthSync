// TEMPORARY DEMO DATA. Replaced by the real API response in the API-connection step.
import type { Report, ClaimReport } from '../../../shared/schemas'
import { sampleReport } from '../../../shared/fixtures'

export function getMockReport(variant?: string): Report {
  if (variant === 'eight') {
    const report: Report = structuredClone(sampleReport)
    report.id = 'demo-eight'
    report.answer_text =
      'The Galaxy S24 costs ₹74,999. It runs Android 14 and receives four years of Android updates. A special launch offer is currently available.'
    report.overall_freshness_score = 64
    report.claims = [
      {
        claim: {
          id: 'c1',
          text: 'The Galaxy S24 starts at ₹74,999.',
          type: 'product',
          entity: 'Galaxy S24',
          original_sentence: 'The Galaxy S24 costs ₹74,999.',
          checkable: true,
        },
        expiry: { claim_id: 'c1', volatility_class: 'fast', reason: 'Launch pricing can change quickly.', recheck_after_days: 7, expires_on: '2026-11-27' },
        evidence: [{ claim_id: 'c1', url: 'https://example.com/galaxy-s24-price', title: 'Galaxy S24 launch price', snippet: 'Samsung lists the Galaxy S24 at ₹74,999 for the launch configuration.', published_date: '2026-11-18', retrieved_at: '2026-11-20T10:00:00Z' }],
        conflict: { claim_id: 'c1', stances: [{ url: 'https://example.com/galaxy-s24-price', stance: 'supports', quote: 'listed at ₹74,999', reason: 'The product listing confirms the launch price.', source_date: '2026-11-18' }], conflict_found: false, newest_supporting_date: '2026-11-18', verdict: 'current' },
        score: { claim_id: 'c1', freshness_score: 88, confidence: 90 },
      },
      {
        claim: { id: 'c2', text: 'The Galaxy S24 launch price is ₹69,999.', type: 'product', entity: 'Galaxy S24', original_sentence: 'The Galaxy S24 launch price is ₹69,999.', checkable: true },
        expiry: { claim_id: 'c2', volatility_class: 'fast', reason: 'Retail prices and launch offers change often.', recheck_after_days: 7, expires_on: '2026-11-27' },
        evidence: [{ claim_id: 'c2', url: 'https://example.com/galaxy-s24-current-price', title: 'Current Galaxy S24 price', snippet: 'The current Galaxy S24 retail price is ₹74,999.', published_date: '2026-11-19', retrieved_at: '2026-11-20T10:00:00Z' }],
        conflict: { claim_id: 'c2', stances: [{ url: 'https://example.com/galaxy-s24-current-price', stance: 'contradicts', quote: 'current price is ₹74,999', reason: 'The newer price differs from the claimed ₹69,999 launch price.', source_date: '2026-11-19' }], conflict_found: true, newest_supporting_date: null, verdict: 'outdated' },
        score: { claim_id: 'c2', freshness_score: 18, confidence: 86 },
      },
      {
        claim: { id: 'c3', text: 'The Galaxy S24 has 256 GB of built-in storage and supports expandable storage through a microSD card slot for owners who need additional removable storage for large photo and video libraries.', type: 'product', entity: 'Galaxy S24 storage', original_sentence: 'The Galaxy S24 has 256 GB of storage and supports expandable storage.', checkable: true },
        expiry: { claim_id: 'c3', volatility_class: 'medium', reason: 'Hardware specifications should be rechecked after model revisions.', recheck_after_days: 30, expires_on: '2026-12-20' },
        evidence: [
          { claim_id: 'c3', url: 'https://example.com/galaxy-s24-specs', title: 'Official Galaxy S24 specifications', snippet: 'The standard Galaxy S24 is available in 256 GB capacity, while expandable storage and microSD card support are not included in the device specifications or product documentation. The long-form product specification page clarifies that this model requires cloud or connected-device storage for users who need to expand the available memory beyond the internal options selected at purchase, so the documented availability differs from a common older assumption based on earlier Galaxy phone generations.', published_date: '2026-11-17', retrieved_at: '2026-11-20T10:00:00Z' },
          { claim_id: 'c3', url: 'https://example.com/retail/galaxy-s24-256gb', title: 'Galaxy S24 256 GB retail listing', snippet: 'The retail listing confirms 256 GB internal storage and does not offer a microSD slot.', published_date: '2026-11-19', retrieved_at: '2026-11-20T10:00:00Z' },
        ],
        conflict: { claim_id: 'c3', stances: [{ url: 'https://example.com/galaxy-s24-specs', stance: 'contradicts', quote: 'does not include microSD support', reason: 'Official specifications do not support expandable storage.', source_date: '2026-11-17' }, { url: 'https://example.com/retail/galaxy-s24-256gb', stance: 'supports', quote: '256 GB and no microSD slot', reason: 'A retail listing agrees on the internal capacity and missing slot.', source_date: '2026-11-19' }], conflict_found: true, newest_supporting_date: '2026-11-19', verdict: 'disputed' },
        score: { claim_id: 'c3', freshness_score: 52, confidence: 73 },
      },
      {
        claim: { id: 'c4', text: 'The Galaxy S24 receives guaranteed operating-system updates until 2032.', type: 'product', entity: 'Galaxy S24 update policy', original_sentence: 'The Galaxy S24 receives four years of Android updates.', checkable: true },
        expiry: { claim_id: 'c4', volatility_class: 'slow', reason: 'Manufacturer software commitments may extend over several years.', recheck_after_days: 180, expires_on: '2027-05-19' },
        evidence: [],
        conflict: { claim_id: 'c4', stances: [], conflict_found: false, newest_supporting_date: null, verdict: 'unverifiable' },
        score: { claim_id: 'c4', freshness_score: 30, confidence: 20 },
      },
      {
        claim: { id: 'c5', text: 'The Galaxy S24 is one of the best phones to buy.', type: 'other', entity: 'Galaxy S24 recommendation', original_sentence: 'It is one of the best phones to buy.', checkable: false },
        expiry: { claim_id: 'c5', volatility_class: 'realtime', reason: 'Subjective recommendations depend on personal preferences.', recheck_after_days: null, expires_on: null },
        evidence: [],
        conflict: { claim_id: 'c5', stances: [], conflict_found: false, newest_supporting_date: null, verdict: 'unverifiable' },
        score: { claim_id: 'c5', freshness_score: 50, confidence: 50 },
      },
      {
        claim: { id: 'c6', text: 'The Galaxy S24 runs Android 14.', type: 'product', entity: 'Galaxy S24 software', original_sentence: 'It runs Android 14.', checkable: true },
        expiry: { claim_id: 'c6', volatility_class: 'medium', reason: 'Android versions change through software releases.', recheck_after_days: 30, expires_on: '2026-12-20' },
        evidence: [{ claim_id: 'c6', url: 'https://example.com/galaxy-s24-software', title: 'Galaxy S24 software information', snippet: 'Galaxy S24 launches with Android 14.', published_date: '2026-11-18', retrieved_at: '2026-11-20T10:00:00Z' }],
        conflict: { claim_id: 'c6', stances: [{ url: 'https://example.com/galaxy-s24-software', stance: 'supports', quote: 'launches with Android 14', reason: 'The software page confirms the launch version.', source_date: '2026-11-18' }], conflict_found: false, newest_supporting_date: '2026-11-18', verdict: 'current' },
        score: { claim_id: 'c6', freshness_score: 82, confidence: 88 },
      },
      {
        claim: { id: 'c7', text: 'Galaxy S24 owners who use the phone for gaming, high-resolution photography, offline navigation, and extended travel are likely to need to monitor available internal storage because the manufacturer does not provide a removable expansion card slot on this specific product configuration.', type: 'product', entity: 'Galaxy S24 storage use', original_sentence: 'Galaxy S24 owners who use the phone extensively may need to monitor storage.', checkable: true },
        expiry: { claim_id: 'c7', volatility_class: 'slow', reason: 'Hardware design is stable but later revisions may differ.', recheck_after_days: 180, expires_on: '2027-05-19' },
        evidence: [{ claim_id: 'c7', url: 'https://example.com/galaxy-s24-hardware', title: 'Galaxy S24 hardware details', snippet: 'Internal storage is fixed and no microSD expansion slot is provided.', published_date: '2026-11-16', retrieved_at: '2026-11-20T10:00:00Z' }],
        conflict: { claim_id: 'c7', stances: [{ url: 'https://example.com/galaxy-s24-hardware', stance: 'supports', quote: 'no microSD expansion slot', reason: 'The hardware details confirm the practical storage limitation.', source_date: '2026-11-16' }], conflict_found: false, newest_supporting_date: '2026-11-16', verdict: 'current' },
        score: { claim_id: 'c7', freshness_score: 78, confidence: 82 },
      },
      {
        claim: { id: 'c8', text: 'A special launch offer is currently available for every Galaxy S24 purchase.', type: 'product', entity: 'Galaxy S24 launch offer', original_sentence: 'A special launch offer is currently available.', checkable: true },
        expiry: { claim_id: 'c8', volatility_class: 'fast', reason: 'Promotions and eligibility rules expire quickly.', recheck_after_days: 7, expires_on: '2026-11-27' },
        evidence: [],
        conflict: { claim_id: 'c8', stances: [], conflict_found: false, newest_supporting_date: null, verdict: 'unverifiable' },
        score: { claim_id: 'c8', freshness_score: 35, confidence: 24 },
      },
    ]
    report.risks = [
      { id: 'r-eight-1', severity: 'high', description: 'The claimed ₹69,999 price is contradicted by a newer retail price.', affected_claim_ids: ['c2'] },
      { id: 'r-eight-2', severity: 'medium', description: 'Storage evidence conflicts with the expandable-storage claim.', affected_claim_ids: ['c3'] },
      { id: 'r-eight-3', severity: 'medium', description: 'The launch-offer claim and update commitment lack sufficient evidence.', affected_claim_ids: ['c4', 'c8'] },
    ]
    report.correction = {
      corrected_text: 'The Galaxy S24 starts at ₹74,999. It runs Android 14 and receives four years of Android updates.',
      changes: [{ claim_id: 'c2', original_span: '₹69,999', new_span: '₹74,999', source_url: 'https://example.com/galaxy-s24-current-price' }],
    }
    return report
  }

  if (variant === 'nocheck') {
    const report: Report = structuredClone(sampleReport)
    report.id = 'demo-nocheck'
    report.overall_freshness_score = 0
    report.claims = report.claims.map((claimReport) => ({
      ...claimReport,
      claim: { ...claimReport.claim, checkable: false },
      conflict: { ...claimReport.conflict, verdict: 'unverifiable', stances: [], conflict_found: false, newest_supporting_date: null },
      evidence: [],
    }))
    report.risks = []
    report.correction = null
    return report
  }

  if (variant === 'undated') {
    const report: Report = structuredClone(sampleReport)
    report.id = 'demo-undated'
    report.claims = report.claims.map((claimReport) => ({
      ...claimReport,
      evidence: claimReport.evidence.map((evidence) => ({ ...evidence, published_date: null })),
      conflict: {
        ...claimReport.conflict,
        newest_supporting_date: null,
        stances: claimReport.conflict.stances.map((stance) => ({ ...stance, source_date: null })),
      },
    }))
    return report
  }

  if (variant === 'nosources') {
    const report: Report = structuredClone(sampleReport)
    report.id = 'demo-nosources'
    report.claims = report.claims.map((claimReport) => ({
      ...claimReport,
      evidence: [],
      conflict: {
        ...claimReport.conflict,
        stances: [],
        conflict_found: false,
        newest_supporting_date: null,
        verdict: 'unverifiable',
      },
      score: { ...claimReport.score, freshness_score: 0, confidence: 20 },
    }))
    report.correction = null
    return report
  }

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
