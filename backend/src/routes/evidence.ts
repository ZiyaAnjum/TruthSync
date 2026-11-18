import { Router, Request, Response } from "express";
import "../preload";
import { Evidence, Claim, ApiError } from "../../../shared/schemas";
import {
  searchEvidence,
  searchEvidenceForClaim,
  TavilyConfigError,
  TavilyTimeoutError,
  TavilyApiError,
} from "../services/evidenceService";
import { z } from "zod";

const router = Router();

// Request body validator: accepts either a full Claim object or claim_id + query
const EvidenceRequestSchema = z.union([
  z.object({
    claim: Claim,
  }),
  z.object({
    claim_id: z.string().min(1, "claim_id is required"),
    query: z.string().min(1, "query is required"),
  }),
]);

/**
 * POST /api/evidence
 * Retrieves evidence from Tavily search for a given claim or query.
 */
router.post("/", async (req: Request, res: Response) => {
  // Validate request input
  const validation = EvidenceRequestSchema.safeParse(req.body);
  if (!validation.success) {
    const errorResponse = ApiError.parse({
      error: {
        code: "VALIDATION",
        message: validation.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      },
    });
    return res.status(400).json(errorResponse);
  }

  try {
    let evidenceList: Evidence[];

    if ("claim" in validation.data) {
      evidenceList = await searchEvidenceForClaim(validation.data.claim);
    } else {
      evidenceList = await searchEvidence(
        validation.data.claim_id,
        validation.data.query
      );
    }

    // Validate output with the shared schema before sending
    const validatedEvidence = z.array(Evidence).parse(evidenceList);

    return res.status(200).json({
      evidence: validatedEvidence,
    });
  } catch (err: unknown) {
    if (err instanceof TavilyConfigError) {
      const errorResponse = ApiError.parse({
        error: {
          code: "INTERNAL",
          message: "Search provider is not configured on the server.",
        },
      });
      return res.status(500).json(errorResponse);
    }

    if (err instanceof TavilyTimeoutError) {
      const errorResponse = ApiError.parse({
        error: {
          code: "TIMEOUT",
          message: "Evidence search request timed out.",
        },
      });
      return res.status(504).json(errorResponse);
    }

    if (err instanceof TavilyApiError) {
      const errorResponse = ApiError.parse({
        error: {
          code: "SEARCH_FAILED",
          message: "Search provider request failed.",
        },
      });
      return res.status(502).json(errorResponse);
    }

    const fallbackResponse = ApiError.parse({
      error: {
        code: "INTERNAL",
        message: "An unexpected error occurred during evidence retrieval.",
      },
    });
    return res.status(500).json(fallbackResponse);
  }
});

export default router;
