-- =============================================
-- CREATIVE INTELLIGENCE SYSTEM - Database Migration
-- =============================================

-- BLOQUE A: Contexto extendido
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS target_audience text;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS audience_notes text;

-- BLOQUE B: Mensaje / Hook
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS hook_type text;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS hook_text text;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS variation text DEFAULT 'A';
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS message_approach text;

-- BLOQUE C: Metricas de Performance - Organico
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS metric_likes integer DEFAULT 0;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS metric_comments integer DEFAULT 0;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS metric_messages integer DEFAULT 0;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS metric_known_people text;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS metric_sales integer DEFAULT 0;

-- BLOQUE C: Metricas de Performance - Meta Ads
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS metric_impressions integer DEFAULT 0;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS metric_clicks integer DEFAULT 0;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS metric_cost numeric DEFAULT 0;

-- Engagement percibido
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS engagement_level text;

-- BLOQUE E: Comparacion
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS vs_previous text;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS vs_previous_id uuid REFERENCES creatives(id);
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS what_changed text;

-- Metadata para automatizacion n8n
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS automation_intent text;

-- Indices para queries eficientes
CREATE INDEX IF NOT EXISTS idx_creatives_product_channel ON creatives(product_id, channel);
CREATE INDEX IF NOT EXISTS idx_creatives_hook_type ON creatives(hook_type);
CREATE INDEX IF NOT EXISTS idx_creatives_target_audience ON creatives(target_audience);
CREATE INDEX IF NOT EXISTS idx_creatives_result ON creatives(result);
CREATE INDEX IF NOT EXISTS idx_creatives_engagement ON creatives(engagement_level);