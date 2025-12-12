/**
 * Supabase Refunds Database Operations
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface RefundRecord {
  signature: string;
  user_wallet: string;
  amount: number;
  token: 'GEN' | 'USDC';
  reason: string;
  original_tx_signature?: string;
  timestamp: string;
  status: 'success' | 'failed';
  error?: string;
}

/**
 * Gemmer en refund til databasen
 */
export async function saveRefund(refund: RefundRecord): Promise<boolean> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase.from('refunds').insert({
      signature: refund.signature,
      user_wallet: refund.user_wallet,
      amount: refund.amount,
      token: refund.token,
      reason: refund.reason,
      original_tx_signature: refund.original_tx_signature,
      timestamp: refund.timestamp,
      status: refund.status,
      error: refund.error,
    });

    if (error) {
      console.error('❌ Supabase refund insert error:', error);
      return false;
    }

    console.log('✅ Refund saved to Supabase:', refund.signature);
    return true;
  } catch (error) {
    console.error('❌ Error saving refund:', error);
    return false;
  }
}

/**
 * Henter refund statistik
 */
export async function getRefundStats(): Promise<{
  totalRefunds: number;
  totalAmountUSD: number;
  last24h: number;
}> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Total refunds
    const { count: totalRefunds } = await supabase
      .from('refunds')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'success');

    // Total amount (convert all to USD)
    const { data: refundsData } = await supabase
      .from('refunds')
      .select('amount')
      .eq('status', 'success');

    const totalAmountUSD = refundsData?.reduce((sum, r) => sum + r.amount, 0) || 0;

    // Last 24h
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: last24h } = await supabase
      .from('refunds')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'success')
      .gte('timestamp', yesterday);

    return {
      totalRefunds: totalRefunds || 0,
      totalAmountUSD,
      last24h: last24h || 0,
    };
  } catch (error) {
    console.error('❌ Error fetching refund stats:', error);
    return {
      totalRefunds: 0,
      totalAmountUSD: 0,
      last24h: 0,
    };
  }
}

