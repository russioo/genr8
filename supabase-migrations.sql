-- Create generations table to track all completed generations
CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL UNIQUE,
  user_wallet TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt TEXT,
  type TEXT NOT NULL, -- 'image' or 'video'
  amount_usd NUMERIC(10, 4) NOT NULL,
  payment_method TEXT NOT NULL, -- 'gen' or 'usdc'
  payment_signature TEXT NOT NULL,
  result_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_model ON generations(model);
CREATE INDEX IF NOT EXISTS idx_generations_user_wallet ON generations(user_wallet);

-- Create a view for aggregated stats (optional, can compute on-the-fly)
CREATE OR REPLACE VIEW generation_stats AS
SELECT 
  COUNT(*) as total_generations,
  COALESCE(SUM(amount_usd), 0) as total_revenue_usd,
  COALESCE(SUM(CASE WHEN payment_method = 'gen' THEN amount_usd ELSE 0 END), 0) as total_genr8_tokens_used,
  model,
  COUNT(*) as generations_by_model,
  COALESCE(SUM(amount_usd), 0) as revenue_by_model
FROM generations
GROUP BY model;

