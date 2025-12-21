/**
 * Stats Database System
 * Stores and retrieves platform statistics from Supabase
 */

import { supabaseAdmin } from './supabase';

export interface GenerationRecord {
  task_id: string;
  user_wallet: string;
  model: string;
  prompt?: string;
  type: 'image' | 'video';
  amount_usd: number;
  payment_method: 'gen' | 'usdc';
  payment_signature: string;
  result_url?: string;
}

/**
 * Save a completed generation to the database
 */
export async function saveGeneration(record: GenerationRecord): Promise<void> {
  try {
    if (!supabaseAdmin) {
      console.warn('⚠️ Supabase admin not configured, skipping database save');
      return;
    }

    const { error } = await supabaseAdmin
      .from('generations')
      .insert({
        task_id: record.task_id,
        user_wallet: record.user_wallet,
        model: record.model,
        prompt: record.prompt || null,
        type: record.type,
        amount_usd: record.amount_usd,
        payment_method: record.payment_method,
        payment_signature: record.payment_signature,
        result_url: record.result_url || null,
        completed_at: new Date().toISOString(),
      });

    if (error) {
      console.error('❌ Failed to save generation to database:', error);
      // Don't throw - allow generation to continue even if DB save fails
      return;
    }

    console.log('✅ Generation saved to database:', record.task_id);
  } catch (error) {
    console.error('❌ Error saving generation:', error);
    // Don't throw - allow generation to continue
  }
}

export interface PlatformStats {
  totalGenerations: number;
  totalRevenueUSD: number;
  totalGENR8TokensUsed: number;
  generationsByModel: Record<string, number>;
  revenueByModel: Record<string, number>;
  lastUpdated: Date;
}

/**
 * Get aggregated platform statistics from database
 */
export async function getStatsFromDB(): Promise<PlatformStats> {
  try {
    if (!supabaseAdmin) {
      console.warn('⚠️ Supabase admin not configured, returning empty stats');
      return {
        totalGenerations: 0,
        totalRevenueUSD: 0,
        totalGENR8TokensUsed: 0,
        generationsByModel: {},
        revenueByModel: {},
        lastUpdated: new Date(),
      };
    }

    // Get all generations with model and amount info
    const { data: allGenerations, error: fetchError } = await supabaseAdmin
      .from('generations')
      .select('model, amount_usd, payment_method')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Failed to fetch generations:', fetchError);
      throw fetchError;
    }

    // Calculate totals
    const totalGenerations = allGenerations?.length || 0;
    const totalRevenueUSD = allGenerations?.reduce((sum, gen) => {
      const amount = typeof gen.amount_usd === 'number' ? gen.amount_usd : parseFloat(gen.amount_usd?.toString() || '0') || 0;
      return sum + amount;
    }, 0) || 0;
    
    const totalGENR8TokensUsed = allGenerations?.reduce((sum, gen) => {
      if (gen.payment_method === 'gen') {
        const amount = typeof gen.amount_usd === 'number' ? gen.amount_usd : parseFloat(gen.amount_usd?.toString() || '0') || 0;
        return sum + amount;
      }
      return sum;
    }, 0) || 0;

    // Group by model
    const generationsByModel: Record<string, number> = {};
    const revenueByModel: Record<string, number> = {};

    allGenerations?.forEach((gen) => {
      const model = gen.model;
      const amount = typeof gen.amount_usd === 'number' ? gen.amount_usd : parseFloat(gen.amount_usd?.toString() || '0') || 0;
      
      generationsByModel[model] = (generationsByModel[model] || 0) + 1;
      revenueByModel[model] = (revenueByModel[model] || 0) + amount;
    });

    return {
      totalGenerations,
      totalRevenueUSD,
      totalGENR8TokensUsed,
      generationsByModel,
      revenueByModel,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error('❌ Error fetching stats from database:', error);
    // Return empty stats on error
    return {
      totalGenerations: 0,
      totalRevenueUSD: 0,
      totalGENR8TokensUsed: 0,
      generationsByModel: {},
      revenueByModel: {},
      lastUpdated: new Date(),
    };
  }
}
