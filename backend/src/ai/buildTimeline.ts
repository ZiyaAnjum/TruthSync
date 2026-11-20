import "dotenv/config";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { callLLM } from "../../../shared/llm";
import { Claim, Evidence, TimelineEvent } from "../../../shared/schemas";

type TimelineEventType = z.infer<typeof TimelineEvent>;

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

interface RawTimelineEvent {
  date: string | null;
  event: string;
  source_url: string;
}

const TimelineLLMOutput = z.object({
  events: z.array(
    z.object({
      date: z.string().nullable(),
      event: z.string().min(1),
      source_url: z.string(),
    })
  ),
});

function loadBuildTimelinePrompt(): string {
  const candidatePaths = [
    path.resolve(__dirname, "../../prompts/build-timeline.md"),
    path.resolve(process.cwd(), "backend/prompts/build-timeline.md"),
    path.resolve(process.cwd(), "prompts/build-timeline.md"),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return fs.readFileSync(candidate, "utf-8");
    }
  }

  throw new Error(`Build timeline prompt not found. Checked: ${candidatePaths.join(", ")}`);
}

/**
 * Validates, normalizes, sorts, dedupes, and caps timeline events in code:
 * - Drops events with unknown URLs (not in evidence list).
 * - Validates date is YYYY-MM-DD and not in the future (relative to now).
 * - Falls back to evidence published_date when snippet gives no date.
 * - Dedupes events sharing same date and normalized description.
 * - Sorts chronologically (oldest first).
 * - Caps at 8 events.
 */
export function postProcessTimelineEvents(
  rawEvents: RawTimelineEvent[],
  evidenceList: Evidence[],
  claimId: string,
  now: Date = new Date()
): TimelineEventType[] {
  const evidenceMap = new Map<string, Evidence>();
  for (const ev of evidenceList) {
    evidenceMap.set(ev.url, ev);
  }

  const todayIso = now.toISOString().slice(0, 10);
  const validEvents: TimelineEventType[] = [];
  const seenDateEventKeys = new Set<string>();

  for (const raw of rawEvents) {
    // 1. URL must exist in evidence list
    const evidenceItem = evidenceMap.get(raw.source_url);
    if (!evidenceItem) {
      continue;
    }

    // 2. Resolve date (LLM date or fallback to evidence published_date)
    let eventDate = raw.date && ISO_DATE_REGEX.test(raw.date.trim()) ? raw.date.trim() : null;
    if (!eventDate && evidenceItem.published_date && ISO_DATE_REGEX.test(evidenceItem.published_date)) {
      eventDate = evidenceItem.published_date;
    }

    if (!eventDate) {
      continue; // No valid date available
    }

    // 3. Drop future dates
    if (eventDate > todayIso) {
      continue;
    }

    const trimmedEvent = raw.event.trim();
    if (!trimmedEvent) {
      continue;
    }

    // 4. Dedupe on same date and normalized event text
    const dedupeKey = `${eventDate}::${trimmedEvent.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    if (seenDateEventKeys.has(dedupeKey)) {
      continue;
    }
    seenDateEventKeys.add(dedupeKey);

    validEvents.push({
      claim_id: claimId,
      date: eventDate,
      event: trimmedEvent,
      source_url: raw.source_url,
    });
  }

  // 5. Sort oldest first
  validEvents.sort((a, b) => a.date.localeCompare(b.date));

  // 6. Cap at 8 events
  return validEvents.slice(0, 8);
}

/**
 * Builds chronological timeline events for a claim using evidence snippets.
 */
export async function buildTimeline(
  claim: Claim,
  evidence: Evidence[],
  now: Date = new Date()
): Promise<TimelineEventType[]> {
  if (evidence.length === 0) {
    return [];
  }

  const promptSystem = loadBuildTimelinePrompt();
  const inputPayload = {
    claim: {
      id: claim.id,
      text: claim.text,
      entity: claim.entity,
    },
    evidence: evidence.map((e) => ({
      url: e.url,
      title: e.title,
      snippet: e.snippet,
      published_date: e.published_date,
    })),
  };

  const output = await callLLM({
    system: promptSystem,
    prompt: JSON.stringify(inputPayload),
    schema: TimelineLLMOutput,
  });

  return postProcessTimelineEvents(output.events, evidence, claim.id, now);
}
