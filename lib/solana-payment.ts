import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { calculateTokenAmount, getTokenPriceUSD } from './token-price';

// Re-export for convenience
export { getTokenPriceUSD, calculateTokenAmount } from './token-price';

// Custom Token Mint Address - your token!
export const PAYMENT_TOKEN_MINT_ADDRESS = new PublicKey('4BwTM7JvCXnMHPoxfPBoNjxYSbQpVQUMPtK5KNGppump');

// Payment wallet address - All token payments go here
export const PAYMENT_WALLET_ADDRESS = new PublicKey('BXm4a7VzW3GWH2MkUqFTc5uM3XrQDvVbYA3KbXoUvgez');

// Token decimals (check your token's actual decimals)
export const TOKEN_DECIMALS = 6;

export interface SolanaPaymentRequest {
  amount: number; // USD amount
  generationId: string;
  description: string;
}

export interface SolanaPaymentResult {
  signature: string;
  success: boolean;
  error?: string;
}

/**
 * Creates and sends a $GEN token payment transaction on Solana
 * Automatically fetches the current token price and calculates correct amount
 */
export async function sendUSDCPayment(
  connection: Connection,
  payerPublicKey: PublicKey,
  signTransaction: (transaction: Transaction) => Promise<Transaction>,
  usdAmount: number
): Promise<SolanaPaymentResult> {
  try {
    console.log('🔄 Starting $GEN payment...');
    console.log('💵 USD amount:', usdAmount);
    
    // Get current token price and calculate amount
    const { tokenAmount: genAmount, tokenPrice, source } = await calculateTokenAmount(usdAmount);
    
    console.log('💰 Token price:', `$${tokenPrice}`, `(source: ${source})`);
    console.log('💰 $GEN amount:', Math.floor(genAmount), '$GEN');
    console.log('👛 From:', payerPublicKey.toBase58());
    console.log('🎯 To:', PAYMENT_WALLET_ADDRESS.toBase58());

    // Convert token amount to smallest unit (6 decimals)
    const tokenAmountRaw = Math.floor(genAmount * Math.pow(10, TOKEN_DECIMALS));
    
    console.log('🔢 Raw token amount (u64):', tokenAmountRaw);
    console.log('🔢 Calculation:', `${Math.floor(genAmount)} × 10^${TOKEN_DECIMALS} = ${tokenAmountRaw}`);
    
    // Find associated token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(
      PAYMENT_TOKEN_MINT_ADDRESS,
      payerPublicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const toTokenAccount = await getAssociatedTokenAddress(
      PAYMENT_TOKEN_MINT_ADDRESS,
      PAYMENT_WALLET_ADDRESS,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    console.log('📦 Fra Token Account:', fromTokenAccount.toBase58());
    console.log('📦 Til Token Account:', toTokenAccount.toBase58());

    // Check if user's token account exists
    const fromAccountInfo = await connection.getAccountInfo(fromTokenAccount);
    if (!fromAccountInfo) {
      console.log('⚠️  User $GEN account does not exist!');
      return {
        success: false,
        signature: '',
        error: 'You do not have $GENR8 token. Please add $GENR8 to your wallet first.',
      };
    }

    // Check token balance
    try {
      const balanceInfo = await connection.getTokenAccountBalance(fromTokenAccount);
      const currentBalance = parseFloat(balanceInfo.value.amount) / Math.pow(10, TOKEN_DECIMALS);
      
      console.log('💵 Current $GEN balance:', Math.floor(currentBalance));
      console.log('💳 Required amount:', Math.floor(genAmount), '$GEN');
      
      if (currentBalance < genAmount) {
        console.log('⚠️  Insufficient $GEN!');
        return {
          success: false,
          signature: '',
          error: `Insufficient $GENR8! You have ${Math.floor(currentBalance)} $GENR8 but need ${Math.floor(genAmount)} $GENR8.`,
        };
      }
    } catch (balanceError) {
      console.error('⚠️  Could not fetch balance:', balanceError);
      return {
        success: false,
        signature: '',
        error: 'Could not verify your $GENR8 balance. Please ensure you have $GENR8 in your wallet.',
      };
    }

    // Check if recipient's token account exists
    const toAccountInfo = await connection.getAccountInfo(toTokenAccount);

    // Create transaction
    const transaction = new Transaction();
    
    // If recipient's token account doesn't exist, create it first
    if (!toAccountInfo) {
      console.log('📝 Creating recipient $GEN account...');
      transaction.add(
        createAssociatedTokenAccountInstruction(
          payerPublicKey, // payer
          toTokenAccount, // associated token account
          PAYMENT_WALLET_ADDRESS, // owner
          PAYMENT_TOKEN_MINT_ADDRESS, // mint
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
    }
    
    // Add transfer instruction
    transaction.add(
      createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        payerPublicKey,
        tokenAmountRaw,
        [],
        TOKEN_PROGRAM_ID
      )
    );

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = payerPublicKey;

    console.log('🧪 Transaction created, number of instructions:', transaction.instructions.length);
    
    // Simulate transaction first to catch errors
    try {
      console.log('🔍 Simulating transaction...');
      const simulation = await connection.simulateTransaction(transaction);
      
      if (simulation.value.err) {
        console.error('❌ Transaction simulation failed:', simulation.value.err);
        console.error('Logs:', simulation.value.logs);
        return {
          signature: '',
          success: false,
          error: `Transaction validation failed: ${JSON.stringify(simulation.value.err)}`,
        };
      }
      console.log('✅ Transaction simulation OK');
    } catch (simError: any) {
      console.warn('⚠️  Could not simulate transaction:', simError.message);
      // Continue anyway - simulation is not critical
    }

    console.log('✍️ Signing transaction...');
    
    let signedTransaction;
    try {
      // Sign transaction med wallet
      signedTransaction = await signTransaction(transaction);
      console.log('✅ Transaction signed successfully');
    } catch (signError: any) {
      console.error('❌ Signing error:', signError);
      console.error('Error details:', signError.message, signError.name);
      return {
        signature: '',
        success: false,
        error: `Signing failed: ${signError.message || 'User cancelled or wallet error'}`,
      };
    }

    console.log('📤 Sending transaction...');
    
    // Send transaction
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      }
    );

    console.log('⏳ Waiting for confirmation...');
    console.log('🔗 Transaction signature:', signature);

    // Wait for confirmation
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    }, 'confirmed');

    if (confirmation.value.err) {
      console.error('❌ Transaction failed:', confirmation.value.err);
      return {
        signature,
        success: false,
        error: 'Transaction failed',
      };
    }

    console.log('✅ Payment successful!');
    
    return {
      signature,
      success: true,
    };
  } catch (error: any) {
    console.error('❌ Payment error:', error);
    return {
      signature: '',
      success: false,
      error: error.message || 'Payment failed',
    };
  }
}

/**
 * Verificer en payment transaktion on-chain
 */
export async function verifyUSDCPayment(
  connection: Connection,
  signature: string,
  expectedAmount: number
): Promise<boolean> {
  try {
    console.log('🔍 Verifying payment:', signature);
    
    const transaction = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!transaction) {
      console.error('❌ Transaction not found');
      return false;
    }

    if (transaction.meta?.err) {
      console.error('❌ Transaction failed:', transaction.meta.err);
      return false;
    }

    // Verify amount (this is simplified - in production you should parse transaction logs)
    console.log('✅ Transaction verified');
    return true;
  } catch (error) {
    console.error('❌ Verification error:', error);
    return false;
  }
}

/**
 * Check $GEN token balance for a wallet
 */
export async function getUSDCBalance(
  connection: Connection,
  walletPublicKey: PublicKey
): Promise<number> {
  try {
    const tokenAccount = await getAssociatedTokenAddress(
      PAYMENT_TOKEN_MINT_ADDRESS,
      walletPublicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const balance = await connection.getTokenAccountBalance(tokenAccount);
    
    // Return balance in $GEN tokens (6 decimals)
    return parseFloat(balance.value.amount) / Math.pow(10, TOKEN_DECIMALS);
  } catch (error) {
    console.error('Error getting $GEN balance:', error);
    return 0;
  }
}

