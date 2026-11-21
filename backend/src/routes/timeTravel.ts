import { Router, Request, Response } from "express";
import "../preload";
import { Claim, Evidence, TimeTravelResult, ApiError } from "../../../shared/schemas";
import { timeTravelVerify } from "../ai";
import { LLMError } from "../../../shared/llm";
import { z } from "zod";

const router = Router();

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "use YYYY-MM-DD");

// Request body validator: supports both snake_case and camelCase field names
const TimeTravelRequestSchema = z.object({
  claim: Claim,
  archived_evidence: z.array(Evidence).optional(),
  archivedEvidence: z.array(Evidence).optional(),
  current_evidence: z.array(Evidence).optional(),
  currentEvidence: z.array(Evidence).optional(),
  as_of_date: isoDate.optional(),
  asOfDate: isoDate.optional(),
}).refine(
  (data) =>
    (data.archived_evidence !== undefined || data.archivedEvidence !== undefined) &&
    (data.current_evidence !== undefined || data.currentEvidence !== undefined) &&
    (data.as_of_date !== undefined || data.asOfDate !== undefined),
  {
    message:
      "Missing required fields: archived_evidence (or archivedEvidence), current_evidence (or currentEvidence), and as_of_date (or asOfDate)",
  }
);

/**
 * POST /api/time-travel
 * Reconstructs veracity of a claim as of a historical date vs today.
 */
router.post("/", async (req: Request, res: Response) => {
  const validation = TimeTravelRequestSchema.safeParse(req.body);
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

  const { claim } = validation.data;
  const archived = validation.data.archived_evidence ?? validation.data.archivedEvidence ?? [];
  const current = validation.data.current_evidence ?? validation.data.currentEvidence ?? [];
  const asOf = (validation.data.as_of_date ?? validation.data.asOfDate)!;

  try {
    const result = await timeTravelVerify(claim, archived, current, asOf);
    const validatedResult = TimeTravelResult.parse(result);

    return res.status(200).json(validatedResult);
  } catch (err: unknown) {
    if (err instanceof LLMError) {
      const errorResponse = ApiError.parse({
        error: {
          code: "LLM_FAILED",
          message: `Time-travel analysis failed: ${err.message}`,
        },
      });
      return res.status(502).json(errorResponse);
    }

    const message = (err as Error).message || "";
    if (message.includes("asOfDate") || message.includes("future")) {
      const errorResponse = ApiError.parse({
        error: {
          code: "VALIDATION",
          message,
        },
      });
      return res.status(400).json(errorResponse);
    }

    console.error("[TimeTravel Route] Unexpected error:", err);
    const errorResponse = ApiError.parse({
      error: {
        code: "INTERNAL",
        message: message || "An unexpected error occurred during time-travel verification.",
      },
    });
    return res.status(500).json(errorResponse);
  }
});

export default router;

