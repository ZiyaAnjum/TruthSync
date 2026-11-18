// shared/fixtures.ts
// Sample data matching schemas.ts. Member A: build the UI against this.
// Member B: return this shape from your endpoints before the real pipeline is ready.
import type { Report } from "./schemas";

export const sampleReport: Report = {
  id: "demo-1",
  schema_version: "1.0.0",
  created_at: "2026-11-18T10:00:00Z",
  answer_text: "The CEO of ExampleCorp is Jane Doe. The company has 5,000 employees.",
  overall_freshness_score: 55,
  claims: [
    {
      claim: {
        id: "c1",
        text: "Jane Doe is the CEO of ExampleCorp",
        type: "person_role",
        entity: "ExampleCorp CEO",
        original_sentence: "The CEO of ExampleCorp is Jane Doe.",
        checkable: true,
      },
      expiry: {
        claim_id: "c1",
        volatility_class: "medium",
        reason: "Executive roles change every few years.",
        recheck_after_days: 90,
        expires_on: "2027-02-16",
      },
      evidence: [
        {
          claim_id: "c1",
          url: "https://example.com/news/new-ceo",
          title: "ExampleCorp names new CEO",
          snippet: "ExampleCorp appointed John Smith as CEO in March 2026.",
          published_date: "2026-03-10",
          retrieved_at: "2026-11-18T10:00:00Z",
        },
      ],
      conflict: {
        claim_id: "c1",
        stances: [
          {
            url: "https://example.com/news/new-ceo",
            stance: "contradicts",
            quote: "appointed John Smith as CEO",
            reason: "Newer source names a different CEO.",
            source_date: "2026-03-10",
          },
        ],
        conflict_found: true,
        newest_supporting_date: null,
        verdict: "outdated",
      },
      score: { claim_id: "c1", freshness_score: 20, confidence: 85 },
    },
  ],
  risks: [
    {
      id: "r1",
      severity: "medium",
      description: "Leadership information is outdated, so other statements about company strategy may be too.",
      affected_claim_ids: ["c1"],
    },
  ],
  correction: {
    corrected_text: "The CEO of ExampleCorp is John Smith. The company has 5,000 employees.",
    changes: [
      {
        claim_id: "c1",
        original_span: "Jane Doe",
        new_span: "John Smith",
        source_url: "https://example.com/news/new-ceo",
      },
    ],
  },
};