import { Claim, Evidence } from "../../../../shared/schemas";

export const claimOutdatedCeo: Claim = {
  id: "c-ceo",
  text: "Parag Agrawal is the CEO of Twitter",
  type: "person_role",
  entity: "Twitter CEO",
  original_sentence: "Twitter is led by CEO Parag Agrawal.",
  checkable: true,
};

export const claimPriceChange: Claim = {
  id: "c-price",
  text: "Tesla Model 3 base price starts at $35,000 in the US",
  type: "number",
  entity: "Tesla Model 3 price",
  original_sentence: "The Tesla Model 3 base edition starts at an original price of $35,000 in the United States.",
  checkable: true,
};

export const claimCorrect: Claim = {
  id: "c-correct",
  text: "The Apple iPhone 15 was released on September 22, 2023",
  type: "date",
  entity: "Apple iPhone 15 release",
  original_sentence: "The Apple iPhone 15 was officially released on September 22, 2023.",
  checkable: true,
};

export const claimNoEvidence: Claim = {
  id: "c-no-ev",
  text: "The prototype Widget 9000 costs 42 internal credits",
  type: "number",
  entity: "Widget 9000",
  original_sentence: "The prototype Widget 9000 costs 42 internal credits.",
  checkable: false,
};

export const fixtureClaims: Claim[] = [
  claimOutdatedCeo,
  claimPriceChange,
  claimCorrect,
  claimNoEvidence,
];

export const evidenceOutdatedCeo: Evidence[] = [
  {
    claim_id: "c-ceo",
    url: "https://www.reuters.com/technology/twitter-ceo-dorsey-steps-down-2021-11-29/",
    title: "Twitter CEO Jack Dorsey steps down, Parag Agrawal named CEO",
    snippet: "Twitter Inc said on Monday that Chief Executive Jack Dorsey will step down and CTO Parag Agrawal will become CEO.",
    published_date: "2021-11-29",
    retrieved_at: "2026-11-19T10:00:00Z",
  },
  {
    claim_id: "c-ceo",
    url: "https://www.cnbc.com/2022/10/27/elon-musk-now-in-charge-of-twitter-ceo-agrawal-departed.html",
    title: "Elon Musk completes Twitter purchase, CEO Parag Agrawal departs",
    snippet: "Elon Musk completed his $44 billion acquisition of Twitter, and Chief Executive Officer Parag Agrawal was terminated.",
    published_date: "2022-10-27",
    retrieved_at: "2026-11-19T10:00:00Z",
  },
  {
    claim_id: "c-ceo",
    url: "https://www.bbc.com/news/business-65814580",
    title: "Linda Yaccarino begins role as Twitter replacement CEO",
    snippet: "Linda Yaccarino has officially started as the new chief executive officer of Twitter under owner Elon Musk.",
    published_date: "2023-06-05",
    retrieved_at: "2026-11-19T10:00:00Z",
  },
];

export const evidencePriceChange: Evidence[] = [
  {
    claim_id: "c-price",
    url: "https://www.tesla.com/blog/35000-tesla-model-3-available-now",
    title: "$35,000 Tesla Model 3 Available Now",
    snippet: "Model 3 is now available for standard range purchase starting at $35,000 before incentives.",
    published_date: "2019-02-28",
    retrieved_at: "2026-11-19T10:00:00Z",
  },
  {
    claim_id: "c-price",
    url: "https://www.reuters.com/business/autos-transportation/tesla-launches-restyled-model-3-north-america-2024-01-10/",
    title: "Tesla launches refreshed Model 3 in North America with $38,990 base price",
    snippet: "Tesla has launched its upgraded Model 3 in North America starting at $38,990 for the rear-wheel drive base trim.",
    published_date: "2024-01-10",
    retrieved_at: "2026-11-19T10:00:00Z",
  },
];

export const evidenceCorrect: Evidence[] = [
  {
    claim_id: "c-correct",
    url: "https://www.apple.com/newsroom/2023/09/apple-debuts-iphone-15-and-iphone-15-plus/",
    title: "Apple debuts iPhone 15 and iPhone 15 Plus",
    snippet: "iPhone 15 and iPhone 15 Plus will be available beginning Friday, September 22, 2023 in more than 40 countries.",
    published_date: "2023-09-12",
    retrieved_at: "2026-11-19T10:00:00Z",
  },
  {
    claim_id: "c-correct",
    url: "https://www.theverge.com/2023/9/22/iphone-15-launch-in-stores",
    title: "Apple iPhone 15 hits store shelves worldwide",
    snippet: "The Apple iPhone 15 officially released on September 22, 2023 with lines forming at global Apple Stores.",
    published_date: "2023-09-22",
    retrieved_at: "2026-11-19T10:00:00Z",
  },
];

export const evidenceNoEvidence: Evidence[] = [];

export const mockEvidenceByClaimId: Record<string, Evidence[]> = {
  "c-ceo": evidenceOutdatedCeo,
  "c-price": evidencePriceChange,
  "c-correct": evidenceCorrect,
  "c-no-ev": evidenceNoEvidence,
};

