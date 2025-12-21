/**
 * Stats Tracking System
 * Tracks platform statistics for the dashboard
 */

export interface PlatformStats {
  totalGenerations: number;
  totalRevenueUSD: number;
  totalGENR8TokensUsed: number;
  generationsByModel: Record<string, number>;
  revenueByModel: Record<string, number>;
  lastUpdated: Date;
}

// In-memory stats storage (in production, use database)
let platformStats: PlatformStats = {
  totalGenerations: 0,
  totalRevenueUSD: 0,
  totalGENR8TokensUsed: 0,
  generationsByModel: {},
  revenueByModel: {},
  lastUpdated: new Date(),
};

/**
 * Increments stats when a generation is completed
 */
export function incrementStats(model: string, amountUSD: number, paymentMethod: 'gen' | 'usdc'): void {
  platformStats.totalGenerations += 1;
  platformStats.totalRevenueUSD += amountUSD;
  
  if (paymentMethod === 'gen') {
    // Estimate GENR8 tokens used (would need actual conversion rate)
    platformStats.totalGENR8TokensUsed += amountUSD; // Placeholder - adjust based on actual token price
  }
  
  // Track by model
  platformStats.generationsByModel[model] = (platformStats.generationsByModel[model] || 0) + 1;
  platformStats.revenueByModel[model] = (platformStats.revenueByModel[model] || 0) + amountUSD;
  
  platformStats.lastUpdated = new Date();
  
  console.log('📊 Stats updated:', {
    totalGenerations: platformStats.totalGenerations,
    totalRevenue: platformStats.totalRevenueUSD.toFixed(2),
  });
}

/**
 * Get current platform stats
 */
export function getStats(): PlatformStats {
  return { ...platformStats };
}

/**
 * Reset stats (for testing)
 */
export function resetStats(): void {
  platformStats = {
    totalGenerations: 0,
    totalRevenueUSD: 0,
    totalGENR8TokensUsed: 0,
    generationsByModel: {},
    revenueByModel: {},
    lastUpdated: new Date(),
  };
}

// Initialize with some demo stats
platformStats = {
  totalGenerations: 1247,
  totalRevenueUSD: 285.43,
  totalGENR8TokensUsed: 15230,
  generationsByModel: {
    'gpt-image-1': 423,
    'ideogram': 312,
    'qwen': 298,
    'nano-banan-pro': 87,
    'sora-2': 67,
    'veo-3.1': 42,
    'grok-imagine': 18,
  },
  revenueByModel: {
    'gpt-image-1': 17.77,
    'ideogram': 20.58,
    'qwen': 8.94,
    'nano-banan-pro': 26.10,
    'sora-2': 14.07,
    'veo-3.1': 15.12,
    'grok-imagine': 4.50,
  },
  lastUpdated: new Date(),
};


