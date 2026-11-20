import { Router, Request, Response } from "express";
import "../preload";
import {
  AnalyzeRequest,
  Report,
  ApiError,
  AnalysisStatus,
} from "../../../shared/schemas";
import {
  runVerificationPipeline,
  PipelinePendingDependencyError,
} from "../services/pipelineService";
import {
  TavilyApiError,
  TavilyTimeoutError,
} from "../services/evidenceService";
import { LLMError } from "../../../shared/llm";
import {
  createVerification,
  getVerificationById,
} from "../db/verificationRepository";

const router = Router();

/**
 * Generates a unique verification ID.
 */
function generateVerificationId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `v-${timestamp}-${random}`;
}

/**
 * POST /api/verify
 * Submits an AI-generated answer for factual verification.
 */
router.post("/verify", async (req: Request, res: Response) => {
  // 1. Validate request body against shared AnalyzeRequest schema
  const validation = AnalyzeRequest.safeParse(req.body);
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

  const answerText = validation.data.answer_text;
  const verificationId = generateVerificationId();

  // 2. Initialize verification record in database
  await createVerification({
    id: verificationId,
    original_answer: answerText,
    status: "queued",
    created_at: new Date().toISOString(),
  });

  // 3. Execute the verification pipeline
  try {
    const report = await runVerificationPipeline(verificationId, answerText);
    const validatedReport = Report.parse(report);
    return res.status(200).json(validatedReport);
  } catch (err: unknown) {
    if (err instanceof PipelinePendingDependencyError) {
      const errorResponse = ApiError.parse({
        error: {
          code: "INTERNAL",
          message: err.message,
        },
      });
      return res.status(501).json(errorResponse);
    }

    if (err instanceof LLMError) {
      const errorResponse = ApiError.parse({
        error: {
          code: "LLM_FAILED",
          message: `AI analysis failed: ${err.message}`,
        },
      });
      return res.status(502).json(errorResponse);
    }

    if (err instanceof TavilyTimeoutError) {
      const errorResponse = ApiError.parse({
        error: {
          code: "TIMEOUT",
          message: "Evidence retrieval timed out.",
        },
      });
      return res.status(504).json(errorResponse);
    }

    if (err instanceof TavilyApiError) {
      const errorResponse = ApiError.parse({
        error: {
          code: "SEARCH_FAILED",
          message: "Live search retrieval failed.",
        },
      });
      return res.status(502).json(errorResponse);
    }

    console.error("[Verify Route] Unexpected error during verification:", err);
    const errorResponse = ApiError.parse({
      error: {
        code: "INTERNAL",
        message: (err as Error).message || "An unexpected error occurred during verification.",
      },
    });
    return res.status(500).json(errorResponse);
  }
});

/**
 * GET /api/verifications/:id
 * Retrieves the verification status and completed report if available.
 */
router.get("/verifications/:id", async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const record = await getVerificationById(id);
  if (!record) {
    const errorResponse = ApiError.parse({
      error: {
        code: "NOT_FOUND",
        message: `Verification with ID '${id}' was not found.`,
      },
    });
    return res.status(404).json(errorResponse);
  }

  // If report has been completed, return the full Report
  if (record.report) {
    return res.status(200).json(record.report);
  }

  // Otherwise return progress status matching AnalysisStatus schema
  const statusResponse = AnalysisStatus.parse({
    id: record.id,
    stage: record.status,
    percent: record.freshness_score ?? 0,
    error: record.error ?? null,
  });

  return res.status(200).json(statusResponse);
});

/**
 * GET /api/verifications/:id/claims/:claimId
 * Retrieves detailed Truth Passport data for a specific claim.
 */
router.get("/verifications/:id/claims/:claimId", async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const claimId = Array.isArray(req.params.claimId) ? req.params.claimId[0] : req.params.claimId;

  const record = await getVerificationById(id);
  if (!record || !record.report) {
    const errorResponse = ApiError.parse({
      error: {
        code: "NOT_FOUND",
        message: `Verification or report with ID '${id}' was not found.`,
      },
    });
    return res.status(404).json(errorResponse);
  }

  const claimReport = record.report.claims.find((c) => c.claim.id === claimId);
  if (!claimReport) {
    const errorResponse = ApiError.parse({
      error: {
        code: "NOT_FOUND",
        message: `Claim with ID '${claimId}' was not found in verification '${id}'.`,
      },
    });
    return res.status(404).json(errorResponse);
  }

  return res.status(200).json(claimReport);
});

export default router;
