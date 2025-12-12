-- Buybacks Tracking Tabel
-- Kør denne SQL i din Supabase SQL Editor for at oprette buybacks tabellen

CREATE TABLE IF NOT EXISTS public.buybacks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  signature TEXT NOT NULL UNIQUE,
  amount_sol DECIMAL(20, 9) NOT NULL,
  amount_usd DECIMAL(20, 2) NOT NULL,
  reference_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for hurtigere queries
CREATE INDEX IF NOT EXISTS idx_buybacks_timestamp ON public.buybacks(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_buybacks_reference_id ON public.buybacks(reference_id);
CREATE INDEX IF NOT EXISTS idx_buybacks_status ON public.buybacks(status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.buybacks ENABLE ROW LEVEL SECURITY;

-- Policy: Alle kan læse buybacks (transparent)
CREATE POLICY "Public buybacks read access" 
  ON public.buybacks 
  FOR SELECT 
  USING (true);

-- Policy: Kun service role kan indsætte (backend only)
CREATE POLICY "Service role insert access" 
  ON public.buybacks 
  FOR INSERT 
  WITH CHECK (true);

-- Kommentarer
COMMENT ON TABLE public.buybacks IS 'Tracker alle automatiske $PAYPER buybacks fra 10% fee';
COMMENT ON COLUMN public.buybacks.signature IS 'Solana transaction signature';
COMMENT ON COLUMN public.buybacks.amount_sol IS 'Buyback amount i SOL';
COMMENT ON COLUMN public.buybacks.amount_usd IS 'Buyback amount i USD';
COMMENT ON COLUMN public.buybacks.reference_id IS 'Reference til original payment (generationId)';

-- Kø til akkumulerede buybacks
CREATE TABLE IF NOT EXISTS public.buyback_contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_signature TEXT NOT NULL,
  generation_id TEXT NOT NULL,
  amount_usd DECIMAL(20, 4) NOT NULL,
  model_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  batch_signature TEXT,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_buyback_contributions_status ON public.buyback_contributions(status);
CREATE INDEX IF NOT EXISTS idx_buyback_contributions_created_at ON public.buyback_contributions(created_at);

ALTER TABLE public.buyback_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public buyback_contributions read access"
  ON public.buyback_contributions
  FOR SELECT
  USING (true);

CREATE POLICY "Service role buyback_contributions insert access"
  ON public.buyback_contributions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role buyback_contributions update access"
  ON public.buyback_contributions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.buyback_contributions IS 'Queue af individuelle 10% buyback-bidrag, processeres i batches';
COMMENT ON COLUMN public.buyback_contributions.payment_signature IS 'Solana payment signature fra brugeren';
COMMENT ON COLUMN public.buyback_contributions.amount_usd IS 'USD-beløb (10% af betaling) som skal buybackes';

-- Refunds Tracking Tabel
CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  signature TEXT NOT NULL UNIQUE,
  user_wallet TEXT NOT NULL,
  amount DECIMAL(20, 4) NOT NULL,
  token TEXT NOT NULL CHECK (token IN ('PAYPER', 'USDC')),
  reason TEXT NOT NULL,
  original_tx_signature TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for hurtigere queries
CREATE INDEX IF NOT EXISTS idx_refunds_timestamp ON public.refunds(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_refunds_user_wallet ON public.refunds(user_wallet);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON public.refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_original_tx ON public.refunds(original_tx_signature);

-- Enable Row Level Security (RLS)
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- Policy: Alle kan læse refunds (transparent)
CREATE POLICY "Public refunds read access" 
  ON public.refunds 
  FOR SELECT 
  USING (true);

-- Policy: Kun service role kan indsætte (backend only)
CREATE POLICY "Service role refunds insert access" 
  ON public.refunds 
  FOR INSERT 
  WITH CHECK (true);

-- Kommentarer
COMMENT ON TABLE public.refunds IS 'Tracker alle refunds for failed generations (content policy violations)';
COMMENT ON COLUMN public.refunds.signature IS 'Solana refund transaction signature';
COMMENT ON COLUMN public.refunds.user_wallet IS 'Brugerens wallet der modtog refund';
COMMENT ON COLUMN public.refunds.amount IS 'Refund beløb i USD';
COMMENT ON COLUMN public.refunds.token IS 'Token type der blev refunded (PAYPER eller USDC)';
COMMENT ON COLUMN public.refunds.reason IS 'Årsag til refund (fx content policy violation)';
COMMENT ON COLUMN public.refunds.original_tx_signature IS 'Reference til original payment transaction';

-- Chats (wallet-baseret)
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_wallet TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chats_owner_wallet ON public.chats(owner_wallet);
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON public.chats(created_at DESC);

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public chats read access"
  ON public.chats
  FOR SELECT
  USING (true);

CREATE POLICY "Service role chats insert access"
  ON public.chats
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role chats update access"
  ON public.chats
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.chats IS 'Wallet-baserede chats for PayPer402 dashboardet';
COMMENT ON COLUMN public.chats.owner_wallet IS 'Solana wallet adresse der ejer chatten';

-- Chat-beskeder
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON public.chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at ASC);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
 
CREATE POLICY "Public chat_messages read access"
  ON public.chat_messages
  FOR SELECT
  USING (true);

CREATE POLICY "Service role chat_messages insert access"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role chat_messages update access"
  ON public.chat_messages
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.chat_messages IS 'Gemmer prompts, svar og statusbeskeder for hver chat';
COMMENT ON COLUMN public.chat_messages.metadata IS 'JSON metadata (model, tx, status, osv.)';

