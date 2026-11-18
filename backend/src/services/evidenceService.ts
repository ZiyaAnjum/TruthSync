import "../preload";
import { Evidence, Claim } from "../../../shared/schemas";
import { z } from "zod";

/**
 * Custom error thrown when the Tavily API key is missing or unconfigured.
 */
export class TavilyConfigError extends Error {
  constructor(message = "TAVILY_API_KEY is not configured in environment variables.") {
    super(message);
    this.name = "TavilyConfigError";
  }
}

/**
 * Custom error thrown when the Tavily API request times out.
 */
export class TavilyTimeoutError extends Error {
  constructor(message = "Tavily search request timed out.") {
    super(message);
    this.name = "TavilyTimeoutError";
  }
}

/**
 * Custom error thrown when the Tavily API returns a non-2xx HTTP status.
 */
export class TavilyApiError extends Error {
  public statusCode: number;

  constructor(statusCode: number, message: string) {
    super(`Tavily API error (${statusCode}): ${message}`);
    this.name = "TavilyApiError";
    this.statusCode = statusCode;
  }
}

/**
 * Raw search result item returned by Tavily REST API.
 */
export interface TavilyRawResult {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
  published_date?: string | null;
}

/**
 * Raw search response returned by Tavily REST API.
 */
export interface TavilySearchResponse {
  query?: string;
  results?: TavilyRawResult[];
}

/**
 * Options for configuring evidence retrieval searches.
 */
export interface EvidenceSearchOptions {
  searchDepth?: "basic" | "advanced";
  maxResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  timeoutMs?: number;
  apiKey?: string;
  fetchFn?: typeof fetch;
}

/**
 * Safely converts an arbitrary date representation into the YYYY-MM-DD format
 * required by the shared contract (isoDate). Returns null if the date is invalid or absent.
 * Never invents dates.
 */
export function formatToIsoDate(rawDate: unknown): string | null {
  if (!rawDate || typeof rawDate !== "string") {
    return null;
  }

  const trimmed = rawDate.trim();
  if (!trimmed) {
    return null;
  }

  // Exact YYYY-MM-DD format match
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // ISO timestamp starting with YYYY-MM-DD (e.g. 2026-03-10T14:00:00Z)
  const isoPrefixMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})T/);
  if (isoPrefixMatch) {
    return isoPrefixMatch[1];
  }

  // Parse general date string
  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) {
    return null;
  }

  const year = parsed.getUTCFullYear();
  // Sanity check year range
  if (year < 1990 || year > 2100) {
    return null;
  }

  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsed.getUTCDate()).padStart(2, "0");
  const formatted = `${year}-${month}-${day}`;

  if (/^\d{4}-\d{2}-\d{2}$/.test(formatted)) {
    return formatted;
  }

  return null;
}

const TAVILY_API_ENDPOINT = "https://api.tavily.com/search";

/**
 * Searches the live web using Tavily API for evidence related to a claim query,
 * mapping the results into the exact Evidence schema defined in shared/schemas.ts.
 */
export async function searchEvidence(
  claimId: string,
  query: string,
  options?: EvidenceSearchOptions
): Promise<Evidence[]> {
  const apiKey = options?.apiKey || process.env.TAVILY_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new TavilyConfigError(
      "TAVILY_API_KEY is missing. Please set TAVILY_API_KEY in your environment variables."
    );
  }

  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  const timeoutMs = options?.timeoutMs ?? 15000;
  const maxResults = options?.maxResults ?? 5;
  const searchDepth = options?.searchDepth ?? "basic";
  const fetchImpl = options?.fetchFn ?? fetch;

  const requestPayload: Record<string, unknown> = {
    api_key: apiKey,
    query: trimmedQuery,
    search_depth: searchDepth,
    max_results: maxResults,
    include_answer: false,
    include_raw_content: false,
  };

  if (options?.includeDomains && options.includeDomains.length > 0) {
    requestPayload.include_domains = options.includeDomains;
  }
  if (options?.excludeDomains && options.excludeDomains.length > 0) {
    requestPayload.exclude_domains = options.excludeDomains;
  }

  let response: Response;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    response = await fetchImpl(TAVILY_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new TavilyTimeoutError(
        `Tavily search timed out after ${timeoutMs}ms.`
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errorJson = await response.json();
      if (errorJson && typeof errorJson === "object") {
        errorDetail =
          (errorJson as Record<string, unknown>).message as string ||
          (errorJson as Record<string, unknown>).error as string ||
          errorDetail;
      }
    } catch {
      // Ignore JSON parse errors on error response body
    }
    throw new TavilyApiError(response.status, errorDetail);
  }

  const data: TavilySearchResponse = await response.json();
  const rawResults = data.results;

  if (!rawResults || !Array.isArray(rawResults) || rawResults.length === 0) {
    return [];
  }

  const retrievedAt = new Date().toISOString();
  const mappedEvidence: Evidence[] = [];

  for (const item of rawResults) {
    if (!item.url || typeof item.url !== "string") {
      continue;
    }

    const candidateEvidence: Record<string, unknown> = {
      claim_id: claimId,
      url: item.url.trim(),
      title: (item.title && typeof item.title === "string") ? item.title.trim() : "Untitled",
      snippet: (item.content && typeof item.content === "string") ? item.content.trim() : "",
      published_date: formatToIsoDate(item.published_date),
      retrieved_at: retrievedAt,
    };

    // Validate each candidate with the shared Zod Evidence schema
    const parseResult = Evidence.safeParse(candidateEvidence);
    if (parseResult.success) {
      mappedEvidence.push(parseResult.data);
    } else {
      console.warn(
        `[EvidenceService] Skipped invalid result from URL "${item.url}":`,
        parseResult.error.issues
      );
    }
  }

  // Validate the final array matches z.array(Evidence)
  return z.array(Evidence).parse(mappedEvidence);
}

/**
 * High-level helper that extracts the search query from a Claim object and
 * retrieves formatted Evidence matching shared/schemas.ts.
 */
export async function searchEvidenceForClaim(
  claim: Claim,
  options?: EvidenceSearchOptions
): Promise<Evidence[]> {
  const query = claim.entity && !claim.text.toLowerCase().includes(claim.entity.toLowerCase())
    ? `${claim.entity} ${claim.text}`
    : claim.text;

  return searchEvidence(claim.id, query, options);
}
