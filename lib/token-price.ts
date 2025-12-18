/**
 * Token Price Service
 * Fetches live prices for $GEN token from various sources
 */

import { PAYMENT_TOKEN_MINT_ADDRESS } from './solana-payment';

export interface TokenPrice {
  priceUSD: number;
  source: string;
  timestamp: number;
}

const priceOverrideRaw = process.env.NEXT_PUBLIC_GEN_PRICE_USD ?? process.env.GEN_PRICE_USD;
const PRICE_OVERRIDE = priceOverrideRaw ? parseFloat(priceOverrideRaw) : null;

const minPriceRaw = process.env.NEXT_PUBLIC_GEN_PRICE_MIN_USD ?? process.env.GEN_PRICE_MIN_USD;
const MIN_PRICE = minPriceRaw ? parseFloat(minPriceRaw) : null;

const fallbackPriceRaw = process.env.NEXT_PUBLIC_GEN_PRICE_FALLBACK_USD ?? process.env.GEN_PRICE_FALLBACK_USD;
const FALLBACK_PRICE = fallbackPriceRaw ? parseFloat(fallbackPriceRaw) : 0.00007;

// Cache to avoid too many API calls
let cachedPrice: TokenPrice | null = null;
const CACHE_DURATION = 30000; // 30 seconds

/**
 * Fetches $GEN token price from DexScreener API
 */
async function fetchPriceFromDexScreener(): Promise<number | null> {
  try {
    const mintAddress = PAYMENT_TOKEN_MINT_ADDRESS.toBase58();
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${mintAddress}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('DexScreener API error:', response.status);
      return null;
    }

    const data = await response.json();
    
    // DexScreener returnerer et array af pairs for token
    if (data.pairs && data.pairs.length > 0) {
      // Take the first (most liquid) pair
      const mainPair = data.pairs[0];
      console.log('🔍 DexScreener raw priceUsd:', mainPair.priceUsd, typeof mainPair.priceUsd);
      
      // Parse price - handle both string and number, as well as comma/period
      let priceString = String(mainPair.priceUsd);
      // Replace comma with period if there's a comma
      priceString = priceString.replace(',', '.');
      const price = parseFloat(priceString);
      
      console.log(`🔍 After parsing: ${price} (original: ${mainPair.priceUsd})`);
      
      if (price && price > 0 && !isNaN(price)) {
        console.log(`💰 $GENR8 price from DexScreener: $${price}`);
        console.log(`💰 Example: $0.04 USD = ${Math.ceil(0.04 / price)} $GENR8 tokens`);
        return price;
      }
    }

    console.warn('No valid price found on DexScreener');
    return null;
  } catch (error) {
    console.error('Error fetching price from DexScreener:', error);
    return null;
  }
}

/**
 * Fetches $GEN token price from Jupiter API (backup)
 */
async function fetchPriceFromJupiter(): Promise<number | null> {
  try {
    const mintAddress = PAYMENT_TOKEN_MINT_ADDRESS.toBase58();
    const response = await fetch(
      `https://price.jup.ag/v4/price?ids=${mintAddress}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Jupiter API error:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.data && data.data[mintAddress]) {
      console.log('🔍 Jupiter raw price:', data.data[mintAddress].price, typeof data.data[mintAddress].price);
      
      let priceString = String(data.data[mintAddress].price);
      priceString = priceString.replace(',', '.');
      const price = parseFloat(priceString);
      
      if (price && price > 0 && !isNaN(price)) {
        console.log(`💰 $GENR8 price from Jupiter: $${price}`);
        return price;
      }
    }

    console.warn('No valid price found on Jupiter');
    return null;
  } catch (error) {
    console.error('Error fetching price from Jupiter:', error);
    return null;
  }
}

function applySafetyGuards(price: number, originSource: string): { priceUSD: number; source: string } {
  let adjustedPrice = price;
  let source = originSource;

  if (!Number.isFinite(adjustedPrice) || adjustedPrice <= 0) {
    adjustedPrice = FALLBACK_PRICE > 0 ? FALLBACK_PRICE : 0.0001;
    source = 'Fallback';
  }

  if (MIN_PRICE && Number.isFinite(MIN_PRICE) && MIN_PRICE > 0 && adjustedPrice < MIN_PRICE) {
    console.warn(`⚠️  Token price ${adjustedPrice} under configured minimum ${MIN_PRICE}. Clamping to minimum.`);
    adjustedPrice = MIN_PRICE;
    source = `${source}+MinClamp`;
  }

  // Safety check: if price is EXTREMELY low (under $0.00000001), something is probably wrong
  if (adjustedPrice < 0.00000001) {
    console.error(`⚠️ ⚠️  WARNING: Token price is EXTREMELY low: $${adjustedPrice}`);
    console.error(`⚠️ ⚠️  This would require ${(0.030 / adjustedPrice).toFixed(0)} tokens for a $0.030 payment!`);
    console.error(`⚠️ ⚠️  Using safe fallback instead: $${FALLBACK_PRICE > 0 ? FALLBACK_PRICE : 0.0001}`);
    adjustedPrice = FALLBACK_PRICE > 0 ? FALLBACK_PRICE : 0.0001;
    source = `${source}+SafeFallback`;
  }

  return {
    priceUSD: adjustedPrice,
    source,
  };
}

/**
 * Fetches the current $GEN token price in USD
 * Tries multiple sources and uses cache
 */
export async function getTokenPriceUSD(): Promise<TokenPrice> {
  if (PRICE_OVERRIDE && Number.isFinite(PRICE_OVERRIDE) && PRICE_OVERRIDE > 0) {
    const overrideResult = applySafetyGuards(PRICE_OVERRIDE, 'ManualOverride');
    cachedPrice = {
      priceUSD: overrideResult.priceUSD,
      source: overrideResult.source,
      timestamp: Date.now(),
    };
    return cachedPrice;
  }

  // Check cache first
  if (cachedPrice && Date.now() - cachedPrice.timestamp < CACHE_DURATION) {
    console.log('📦 Using cached $GEN price:', cachedPrice.priceUSD);
    return cachedPrice;
  }

  console.log('🔍 Fetching new $GEN price...');

  // Try DexScreener first (more reliable for new tokens)
  let price = await fetchPriceFromDexScreener();
  let source = 'DexScreener';

  // If DexScreener fails, try Jupiter
  if (!price) {
    console.log('⚠️  DexScreener failed, trying Jupiter...');
    price = await fetchPriceFromJupiter();
    source = 'Jupiter';
  }

  // Fallback to standard value if both sources fail
  if (!price || price <= 0) {
    console.warn('⚠️  Could not fetch live price, using fallback');
    price = FALLBACK_PRICE > 0 ? FALLBACK_PRICE : 0.0001;
    source = 'Fallback';
  }
  
  const guarded = applySafetyGuards(price, source);

  // Cache resultatet
  cachedPrice = {
    priceUSD: guarded.priceUSD,
    source: guarded.source,
    timestamp: Date.now(),
  };

  return cachedPrice;
}

/**
 * Calculates how many $GEN tokens are needed for a given USD amount
 * 
 * Example: Model costs $0.03, token price is $0.0001
 * - User pays: $0.03 / $0.0001 = 300 GEN
 */
export async function calculateTokenAmount(usdAmount: number): Promise<{
  tokenAmount: number;
  tokenPrice: number;
  source: string;
}> {
  const priceInfo = await getTokenPriceUSD();
  
  console.log(`🔍 Token price: $${priceInfo.priceUSD} (${priceInfo.source})`);
  console.log(`🔍 USD amount: $${usdAmount}`);
  
  // Calculate how many tokens are equivalent to the USD amount
  const totalTokenAmountExact = usdAmount / priceInfo.priceUSD;
  const totalTokenAmount = Math.floor(totalTokenAmountExact);
  
  console.log(`💰 User pays: ${totalTokenAmount} $GEN`);

  return {
    tokenAmount: totalTokenAmount,
    tokenPrice: priceInfo.priceUSD,
    source: priceInfo.source,
  };
}

/**
 * Formatterer token pris til læsbar string
 */
export function formatTokenPrice(price: number): string {
  if (price < 0.000001) {
    return `$${(price * 1000000).toFixed(2)}M`; // Millionths
  } else if (price < 0.001) {
    return `$${(price * 1000).toFixed(4)}K`; // Thousandths
  } else if (price < 1) {
    return `$${price.toFixed(6)}`;
  } else {
    return `$${price.toFixed(4)}`;
  }
}

