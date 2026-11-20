import { z } from "zod";
import { Verdict } from "../../../shared/schemas";

export const TimeTravelResult = z.object({
  claim_id: z.string(),
  as_of_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "use YYYY-MM-DD"),
  verdict_then: Verdict,
  verdict_now: Verdict,
  was_true_then: z.boolean().nullable(),
  explanation: z.string(),
  evidence_used: z.array(z.string().url()),
});

export type TimeTravelResult = z.infer<typeof TimeTravelResult>;

