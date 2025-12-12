/**
 * Refund Service
 * Håndterer automatiske refunds når AI generation fejler pga. content policy violations
 */

import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import bs58 from 'bs58';

// Payment token (GEN) mint address
export const PAYMENT_TOKEN_MINT_ADDRESS = new PublicKey(
  '4BwTM7JvCXnMHPoxfPBoNjxYSbQpVQUMPtK5KNGppump'
);

// USDC mint address (Solana mainnet)
export const USDC_MINT_ADDRESS = new PublicKey(
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
);

const TOKEN_DECIMALS = 6;
const USDC_DECIMALS = 6;

export interface RefundRequest {
  userWalletAddress: string; // Brugerens wallet der skal refunderes
  amount: number; // Beløb i USD
  paymentMethod: 'gen' | 'usdc'; // Hvilken token der skal refunderes
  reason: string; // Årsag til refund (fx "Content policy violation")
  originalTxSignature?: string; // Reference til original payment
}

export interface RefundResult {
  success: boolean;
  signature?: string;
  error?: string;
  amountRefunded?: number;
  token?: 'GEN' | 'USDC';
}

/**
 * Sender refund til bruger i den payment metode de brugte
 */
export async function sendRefund(
  request: RefundRequest,
  connection: Connection
): Promise<RefundResult> {
  try {
    console.log('💸 Starting refund process...');
    console.log('👤 User wallet:', request.userWalletAddress);
    console.log('💰 Amount:', request.amount, 'USD');
    console.log('💳 Payment method:', request.paymentMethod);
    console.log('📝 Reason:', request.reason);

    // Get refund wallet keys from environment
    const refundPublicKey = process.env.REFUND_WALLET_PUBLIC_KEY;
    const refundPrivateKey = process.env.REFUND_WALLET_PRIVATE_KEY;

    if (!refundPublicKey || !refundPrivateKey) {
      console.error('❌ Refund wallet keys not configured');
      console.error('Set REFUND_WALLET_PUBLIC_KEY and REFUND_WALLET_PRIVATE_KEY in .env');
      return {
        success: false,
        error: 'Refund wallet not configured',
      };
    }

    // Decode private key and create keypair
    const privateKeyBytes = bs58.decode(refundPrivateKey);
    const refundWalletKeypair = Keypair.fromSecretKey(privateKeyBytes);
    const refundWalletPublicKey = new PublicKey(refundPublicKey);

    console.log('💼 Refund wallet:', refundWalletPublicKey.toBase58());

    // Verify keypair matches public key
    if (!refundWalletKeypair.publicKey.equals(refundWalletPublicKey)) {
      console.error('❌ Refund wallet keypair does not match public key!');
      return {
        success: false,
        error: 'Refund wallet configuration mismatch',
      };
    }

    const userPublicKey = new PublicKey(request.userWalletAddress);

    let result: RefundResult;

    if (request.paymentMethod === 'usdc') {
      result = await sendUSDCRefund(
        connection,
        refundWalletKeypair,
        userPublicKey,
        request.amount
      );
    } else {
      result = await sendGENRefund(
        connection,
        refundWalletKeypair,
        userPublicKey,
        request.amount
      );
    }

    if (result.success) {
      // Log refund til database
      await logRefund({
        signature: result.signature!,
        userWallet: request.userWalletAddress,
        amount: result.amountRefunded!,
        token: result.token!,
        reason: request.reason,
        originalTxSignature: request.originalTxSignature,
        timestamp: new Date().toISOString(),
      });
    }

    return result;
  } catch (error: any) {
    console.error('❌ Refund error:', error);
    return {
      success: false,
      error: error.message || 'Unknown refund error',
    };
  }
}

/**
 * Sender USDC refund til bruger
 */
async function sendUSDCRefund(
  connection: Connection,
  refundWalletKeypair: Keypair,
  userPublicKey: PublicKey,
  usdAmount: number
): Promise<RefundResult> {
  try {
    console.log('💵 Sending USDC refund...');

    // Convert USD to USDC (1:1, but with 6 decimals)
    const usdcAmountRaw = Math.floor(usdAmount * Math.pow(10, USDC_DECIMALS));

    console.log('🔢 USDC amount:', usdAmount, 'USDC');
    console.log('🔢 Raw amount (u64):', usdcAmountRaw);

    // Get token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT_ADDRESS,
      refundWalletKeypair.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const toTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT_ADDRESS,
      userPublicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    console.log('📦 From (refund wallet) Token Account:', fromTokenAccount.toBase58());
    console.log('📦 To (user) Token Account:', toTokenAccount.toBase58());

    // Check refund wallet balance
    const fromAccountInfo = await connection.getAccountInfo(fromTokenAccount);
    if (!fromAccountInfo) {
      return {
        success: false,
        error: 'Refund wallet does not have a USDC account',
      };
    }

    const balanceInfo = await connection.getTokenAccountBalance(fromTokenAccount);
    const currentBalance = parseFloat(balanceInfo.value.amount) / Math.pow(10, USDC_DECIMALS);

    console.log('💰 Refund wallet USDC balance:', currentBalance.toFixed(2), 'USDC');

    if (currentBalance < usdAmount) {
      return {
        success: false,
        error: `Insufficient USDC in refund wallet! Has ${currentBalance.toFixed(2)} USDC, needs ${usdAmount.toFixed(2)} USDC`,
      };
    }

    // Check if user's token account exists
    const toAccountInfo = await connection.getAccountInfo(toTokenAccount);
    if (!toAccountInfo) {
      return {
        success: false,
        error: 'User does not have a USDC account to receive refund',
      };
    }

    // Create and send transaction
    const transaction = new Transaction();

    transaction.add(
      createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        refundWalletKeypair.publicKey,
        usdcAmountRaw,
        [],
        TOKEN_PROGRAM_ID
      )
    );

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = refundWalletKeypair.publicKey;

    // Sign transaction
    transaction.sign(refundWalletKeypair);

    console.log('📤 Sending USDC refund transaction...');

    // Send transaction
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    console.log('⏳ Awaiting confirmation...');

    // Wait for confirmation
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    }, 'confirmed');

    if (confirmation.value.err) {
      console.error('❌ Transaction failed:', confirmation.value.err);
      return {
        success: false,
        error: `Transaction failed: ${JSON.stringify(confirmation.value.err)}`,
      };
    }

    console.log('✅ USDC refund successful!');
    console.log('🔗 Transaction:', `https://solscan.io/tx/${signature}`);

    return {
      success: true,
      signature,
      amountRefunded: usdAmount,
      token: 'USDC',
    };
  } catch (error: any) {
    console.error('❌ USDC refund error:', error);
    return {
      success: false,
      error: error.message || 'USDC refund failed',
    };
  }
}

/**
 * Sender GEN token refund til bruger
 */
async function sendGENRefund(
  connection: Connection,
  refundWalletKeypair: Keypair,
  userPublicKey: PublicKey,
  usdAmount: number
): Promise<RefundResult> {
  try {
    console.log('💰 Sending GEN refund...');

    // Get current GEN token price
    const tokenPrice = await getTokenPriceUSD();
    console.log('💵 Current $GEN price:', `$${tokenPrice}`);

    // Calculate how many GEN tokens to send
    const tokenAmount = usdAmount / tokenPrice;
    const tokenAmountRaw = Math.floor(tokenAmount * Math.pow(10, TOKEN_DECIMALS));

    console.log('🔢 GEN amount:', tokenAmount.toFixed(2), '$GEN');
    console.log('🔢 Raw amount (u64):', tokenAmountRaw);

    // Get token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(
      PAYMENT_TOKEN_MINT_ADDRESS,
      refundWalletKeypair.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const toTokenAccount = await getAssociatedTokenAddress(
      PAYMENT_TOKEN_MINT_ADDRESS,
      userPublicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    console.log('📦 From (refund wallet) Token Account:', fromTokenAccount.toBase58());
    console.log('📦 To (user) Token Account:', toTokenAccount.toBase58());

    // Check refund wallet balance
    const fromAccountInfo = await connection.getAccountInfo(fromTokenAccount);
    if (!fromAccountInfo) {
      return {
        success: false,
        error: 'Refund wallet does not have a GEN account',
      };
    }

    const balanceInfo = await connection.getTokenAccountBalance(fromTokenAccount);
    const currentBalance = parseFloat(balanceInfo.value.amount) / Math.pow(10, TOKEN_DECIMALS);

    console.log('💰 Refund wallet GEN balance:', currentBalance.toFixed(2), '$GEN');

    if (currentBalance < tokenAmount) {
      return {
        success: false,
        error: `Insufficient GEN in refund wallet! Has ${currentBalance.toFixed(2)} $GEN, needs ${tokenAmount.toFixed(2)} $GEN`,
      };
    }

    // Check if user's token account exists
    const toAccountInfo = await connection.getAccountInfo(toTokenAccount);
    if (!toAccountInfo) {
      return {
        success: false,
        error: 'User does not have a GEN account to receive refund',
      };
    }

    // Create and send transaction
    const transaction = new Transaction();

    transaction.add(
      createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        refundWalletKeypair.publicKey,
        tokenAmountRaw,
        [],
        TOKEN_PROGRAM_ID
      )
    );

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = refundWalletKeypair.publicKey;

    // Sign transaction
    transaction.sign(refundWalletKeypair);

    console.log('📤 Sending GEN refund transaction...');

    // Send transaction
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    console.log('⏳ Awaiting confirmation...');

    // Wait for confirmation
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    }, 'confirmed');

    if (confirmation.value.err) {
      console.error('❌ Transaction failed:', confirmation.value.err);
      return {
        success: false,
        error: `Transaction failed: ${JSON.stringify(confirmation.value.err)}`,
      };
    }

    console.log('✅ GEN refund successful!');
    console.log('🔗 Transaction:', `https://solscan.io/tx/${signature}`);

    return {
      success: true,
      signature,
      amountRefunded: usdAmount,
      token: 'GEN',
    };
  } catch (error: any) {
    console.error('❌ GEN refund error:', error);
    return {
      success: false,
      error: error.message || 'GEN refund failed',
    };
  }
}

/**
 * Henter GEN token pris fra DexScreener
 */
async function getTokenPriceUSD(): Promise<number> {
  try {
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${PAYMENT_TOKEN_MINT_ADDRESS.toBase58()}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.pairs && data.pairs.length > 0) {
        const mainPair = data.pairs[0];
        const price = parseFloat(mainPair.priceUsd);
        if (price && price > 0) {
          return price;
        }
      }
    }

    console.warn('⚠️ Could not fetch token price from DexScreener, using fallback: $0.001');
    return 0.001; // Fallback price
  } catch (error) {
    console.warn('⚠️ Error fetching token price (using fallback $0.001)');
    return 0.001;
  }
}

/**
 * Gemmer refund til database for tracking
 */
async function logRefund(data: {
  signature: string;
  userWallet: string;
  amount: number;
  token: 'GEN' | 'USDC';
  reason: string;
  originalTxSignature?: string;
  timestamp: string;
}): Promise<void> {
  try {
    console.log('📝 Logging refund:', data);

    // Import dynamically to avoid circular dependencies
    const { saveRefund } = await import('./supabase-refunds');

    await saveRefund({
      signature: data.signature,
      user_wallet: data.userWallet,
      amount: data.amount,
      token: data.token,
      reason: data.reason,
      original_tx_signature: data.originalTxSignature,
      timestamp: data.timestamp,
      status: 'success',
    });

    console.log('✅ Refund logged successfully');
  } catch (error) {
    console.error('⚠️ Error logging refund:', error);
    // Don't fail refund if logging fails
  }
}

