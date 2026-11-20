-- ==============================================================================
-- TruthSync Database Schema for Supabase (PostgreSQL)
-- Matches PRD Section 6 Data Model, shared/schemas.ts, and Backend Repository
-- Fully Idempotent & Non-Destructive: Safe to run multiple times in Supabase SQL Editor
-- ==============================================================================

-- 1. Create Verifications Table (Master verification records)
CREATE TABLE IF NOT EXISTS public.verifications (
    id TEXT PRIMARY KEY,
    user_id UUID NULL,
    session_id TEXT NULL,
    question TEXT NULL,
    original_answer TEXT NOT NULL,
    corrected_answer TEXT NULL,
    freshness_score INTEGER NULL CHECK (freshness_score >= 0 AND freshness_score <= 100),
    status TEXT NOT NULL DEFAULT 'queued',
    error TEXT NULL,
    report_data JSONB NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ensure optional/added columns exist if table was previously created
ALTER TABLE public.verifications ADD COLUMN IF NOT EXISTS user_id UUID NULL;
ALTER TABLE public.verifications ADD COLUMN IF NOT EXISTS session_id TEXT NULL;
ALTER TABLE public.verifications ADD COLUMN IF NOT EXISTS question TEXT NULL;
ALTER TABLE public.verifications ADD COLUMN IF NOT EXISTS corrected_answer TEXT NULL;
ALTER TABLE public.verifications ADD COLUMN IF NOT EXISTS freshness_score INTEGER NULL CHECK (freshness_score >= 0 AND freshness_score <= 100);
ALTER TABLE public.verifications ADD COLUMN IF NOT EXISTS error TEXT NULL;
ALTER TABLE public.verifications ADD COLUMN IF NOT EXISTS report_data JSONB NULL;
ALTER TABLE public.verifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- 2. Create Claims Table (Extracted claims and passport details)
CREATE TABLE IF NOT EXISTS public.claims (
    id TEXT NOT NULL,
    verification_id TEXT NOT NULL REFERENCES public.verifications(id) ON DELETE CASCADE,
    claim_text TEXT NOT NULL,
    text_span TEXT NULL,
    entity TEXT NULL,
    claim_type TEXT NULL,
    in_scope BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL,
    explanation TEXT NULL,
    confidence_score INTEGER NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    verified_value TEXT NULL,
    volatility TEXT NULL,
    recheck_after_days INTEGER NULL,
    expires_on TEXT NULL,
    reconstruction_text TEXT NULL,
    checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (verification_id, id)
);

-- 3. Create Sources (Evidence) Table (Retrieved web & fact sources)
CREATE TABLE IF NOT EXISTS public.sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id TEXT NOT NULL REFERENCES public.verifications(id) ON DELETE CASCADE,
    claim_id TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    domain TEXT NULL,
    source_date TEXT NULL,
    retrieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    snippet TEXT NOT NULL,
    stance TEXT NULL,
    reliability_label TEXT NULL
);

-- 4. Create Risk Flags Table (P0 / C-04 Hidden Risks & PRD Section 6)
CREATE TABLE IF NOT EXISTS public.risk_flags (
    id TEXT NOT NULL,
    verification_id TEXT NOT NULL REFERENCES public.verifications(id) ON DELETE CASCADE,
    claim_id TEXT NULL,
    type TEXT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
    reason TEXT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (verification_id, id)
);

-- Ensure non-destructive forward compatibility for existing risk_flags tables
ALTER TABLE public.risk_flags ADD COLUMN IF NOT EXISTS claim_id TEXT NULL;
ALTER TABLE public.risk_flags ADD COLUMN IF NOT EXISTS type TEXT NULL;
ALTER TABLE public.risk_flags ADD COLUMN IF NOT EXISTS reason TEXT NULL;
ALTER TABLE public.risk_flags ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE public.risk_flags ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- 5. Create Truth Timeline Events Table (P1 / FR-10)
CREATE TABLE IF NOT EXISTS public.timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id TEXT NOT NULL REFERENCES public.verifications(id) ON DELETE CASCADE,
    claim_id TEXT NOT NULL,
    event_date TEXT NOT NULL,
    value TEXT NOT NULL,
    source_id TEXT NULL,
    source_url TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Create Saved Facts Table (P1 / FR-13)
CREATE TABLE IF NOT EXISTS public.saved_facts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    verification_id TEXT NULL REFERENCES public.verifications(id) ON DELETE SET NULL,
    claim_id TEXT NOT NULL,
    claim_text TEXT NOT NULL,
    verified_value TEXT NULL,
    last_verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==============================================================================
-- Indexes for Fast Lookups
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_verifications_status ON public.verifications(status);
CREATE INDEX IF NOT EXISTS idx_verifications_created_at ON public.verifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_claims_verification_id ON public.claims(verification_id);
CREATE INDEX IF NOT EXISTS idx_sources_verification_id ON public.sources(verification_id);
CREATE INDEX IF NOT EXISTS idx_sources_claim_id ON public.sources(claim_id);
CREATE INDEX IF NOT EXISTS idx_risk_flags_verification_id ON public.risk_flags(verification_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_verification_id ON public.timeline_events(verification_id);
CREATE INDEX IF NOT EXISTS idx_saved_facts_user_id ON public.saved_facts(user_id);

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- TruthSync allows anonymous verifications per PRD Section 4, with optional P1 auth
-- Idempotent: Drops policy before recreating to prevent 42710 errors on re-runs
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_facts ENABLE ROW LEVEL SECURITY;

-- Verifications Policies
DROP POLICY IF EXISTS "Allow public read for verifications" ON public.verifications;
CREATE POLICY "Allow public read for verifications"
    ON public.verifications FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow public insert for verifications" ON public.verifications;
CREATE POLICY "Allow public insert for verifications"
    ON public.verifications FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update for verifications" ON public.verifications;
CREATE POLICY "Allow public update for verifications"
    ON public.verifications FOR UPDATE
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete for verifications" ON public.verifications;
CREATE POLICY "Allow public delete for verifications"
    ON public.verifications FOR DELETE
    USING (true);

-- Claims Policies
DROP POLICY IF EXISTS "Allow public read for claims" ON public.claims;
CREATE POLICY "Allow public read for claims"
    ON public.claims FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow public insert for claims" ON public.claims;
CREATE POLICY "Allow public insert for claims"
    ON public.claims FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete for claims" ON public.claims;
CREATE POLICY "Allow public delete for claims"
    ON public.claims FOR DELETE
    USING (true);

-- Sources Policies
DROP POLICY IF EXISTS "Allow public read for sources" ON public.sources;
CREATE POLICY "Allow public read for sources"
    ON public.sources FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow public insert for sources" ON public.sources;
CREATE POLICY "Allow public insert for sources"
    ON public.sources FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete for sources" ON public.sources;
CREATE POLICY "Allow public delete for sources"
    ON public.sources FOR DELETE
    USING (true);

-- Risk Flags Policies
DROP POLICY IF EXISTS "Allow public read for risk_flags" ON public.risk_flags;
CREATE POLICY "Allow public read for risk_flags"
    ON public.risk_flags FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow public insert for risk_flags" ON public.risk_flags;
CREATE POLICY "Allow public insert for risk_flags"
    ON public.risk_flags FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete for risk_flags" ON public.risk_flags;
CREATE POLICY "Allow public delete for risk_flags"
    ON public.risk_flags FOR DELETE
    USING (true);

-- Timeline Events Policies
DROP POLICY IF EXISTS "Allow public read for timeline_events" ON public.timeline_events;
CREATE POLICY "Allow public read for timeline_events"
    ON public.timeline_events FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow public insert for timeline_events" ON public.timeline_events;
CREATE POLICY "Allow public insert for timeline_events"
    ON public.timeline_events FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete for timeline_events" ON public.timeline_events;
CREATE POLICY "Allow public delete for timeline_events"
    ON public.timeline_events FOR DELETE
    USING (true);

-- Saved Facts Policies (P1 - user specific)
DROP POLICY IF EXISTS "Allow authenticated users to read their own saved facts" ON public.saved_facts;
CREATE POLICY "Allow authenticated users to read their own saved facts"
    ON public.saved_facts FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow authenticated users to insert their own saved facts" ON public.saved_facts;
CREATE POLICY "Allow authenticated users to insert their own saved facts"
    ON public.saved_facts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow authenticated users to delete their own saved facts" ON public.saved_facts;
CREATE POLICY "Allow authenticated users to delete their own saved facts"
    ON public.saved_facts FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
