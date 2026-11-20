import { Router, Request, Response } from "express";
import "../preload";
import { Claim, Evidence, TimelineEvent, ApiError } from "../../../shared/schemas";
import { buildTimeline } from "../ai";
import { LLMError } from "../../../shared/llm";
import { z } from "zod";

const router = Router();

// Request body validator for timeline builder
const TimelineRequestSchema = z.object({
  claim: Claim,
  evidence: z.array(Evidence),
});

/**
 * POST /api/timeline
 * Builds chronological timeline events for a given claim and evidence.
 */
router.post("/", async (req: Request, res: Response) => {
  const validation = TimelineRequestSchema.safeParse(req.body);
  if (!validation.success) {
    const errorResponse = ApiError.parse({
      error: {
        code: "VALIDATION",
        message: validation.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      },
    });
    return res.status(400).json(errorResponse);
  }

  try {
    const events = await buildTimeline(validation.data.claim, validation.data.evidence);
    const validatedEvents = z.array(TimelineEvent).parse(events);

    return res.status(200).json({
      events: validatedEvents,
    });
  } catch (err: unknown) {
    if (err instanceof LLMError) {
      const errorResponse = ApiError.parse({
        error: {
          code: "LLM_FAILED",
          message: `Timeline building failed: ${err.message}`,
        },
      });
      return res.status(502).json(errorResponse);
    }

    console.error("[Timeline Route] Unexpected error:", err);
    const errorResponse = ApiError.parse({
      error: {
        code: "INTERNAL",
        message: (err as Error).message || "An unexpected error occurred during timeline building.",
      },
    });
    return res.status(500).json(errorResponse);
  }
});

export default router;

