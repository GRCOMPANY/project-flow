-- FASE 1: Add automation_status to creatives table
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS automation_status text DEFAULT NULL;
-- Valores: 'pending', 'processing', 'completed', 'failed'

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_creatives_automation_status ON creatives(automation_status) WHERE automation_status IS NOT NULL;

-- FASE 7: Create automation intents table for n8n
CREATE TABLE IF NOT EXISTS creative_automation_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_id uuid REFERENCES creatives(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  intent_type text NOT NULL, -- 'generate_new', 'repeat', 'new_audience', 'send_sellers', 'landing'
  status text DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  metadata jsonb DEFAULT '{}',
  triggered_by uuid,
  triggered_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  result_notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on intents table
ALTER TABLE creative_automation_intents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for intents
CREATE POLICY "Admins can manage intents" ON creative_automation_intents
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view intents" ON creative_automation_intents
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_intents_status ON creative_automation_intents(status);
CREATE INDEX IF NOT EXISTS idx_intents_creative ON creative_automation_intents(creative_id);
CREATE INDEX IF NOT EXISTS idx_intents_product ON creative_automation_intents(product_id);