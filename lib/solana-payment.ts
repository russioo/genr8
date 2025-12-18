import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { 
  getAssociatedTokenAddressSync,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { calculateTokenAmount, getTokenPriceUSD } from './token-price';

// Re-export for convenience
export { getTokenPriceUSD, calculateTokenAmount } from './token-price';

// Custom Token Mint Address - your token!
export const PAYMENT_TOKEN_MINT_ADDRESS = new PublicKey('FJvjng3A2BSYuHmQd1jQyDfz8Rvi7n9gcFYWHAFWpump');

// Payment wallet address - All token payments go here
export const PAYMENT_WALLET_ADDRESS = new PublicKey('8Q2PYkXiqPwCQLs59nbjbDhuXnG6VpmhnXR4U7Yt7bbM');

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
    console.log('💰 $GENR8 amount:', genAmount.toFixed(2), '$GENR8');
    console.log('👛 From:', payerPublicKey.toBase58());
    console.log('🎯 To:', PAYMENT_WALLET_ADDRESS.toBase58());
    
    // Find associated token accounts (Token-2022)
    const fromTokenAccount = getAssociatedTokenAddressSync(
      PAYMENT_TOKEN_MINT_ADDRESS,
      payerPublicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const toTokenAccount = getAssociatedTokenAddressSync(
      PAYMENT_TOKEN_MINT_ADDRESS,
      PAYMENT_WALLET_ADDRESS,
      false,
      TOKEN_2022_PROGRAM_ID,
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

    // Check token balance and get decimals
    let tokenDecimals = TOKEN_DECIMALS;
    try {
      const balanceInfo = await connection.getTokenAccountBalance(fromTokenAccount);
      tokenDecimals = balanceInfo.value.decimals;
      const currentBalance = parseFloat(balanceInfo.value.amount) / Math.pow(10, tokenDecimals);
      
      console.log('💵 Current $GENR8 balance:', currentBalance.toFixed(2));
      console.log('💳 Required amount:', genAmount.toFixed(2), '$GENR8');
      console.log('🔢 Token decimals:', tokenDecimals);
      
      if (currentBalance < genAmount) {
        console.log('⚠️  Insufficient $GENR8!');
        return {
          success: false,
          signature: '',
          error: `Insufficient $GENR8! You have ${currentBalance.toFixed(2)} $GENR8 but need ${genAmount.toFixed(2)} $GENR8 (price: $${(usdAmount / genAmount).toFixed(8)}/token).`,
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

    // Calculate raw token amount using actual decimals
    const tokenAmountRaw = Math.floor(genAmount * Math.pow(10, tokenDecimals));
    console.log('🔢 Raw token amount:', tokenAmountRaw);

    // Check if recipient's token account exists
    const toAccountInfo = await connection.getAccountInfo(toTokenAccount);

    // Create transaction
    const transaction = new Transaction();
    
    // If recipient's token account doesn't exist, create it first
    if (!toAccountInfo) {
      console.log('📝 Creating recipient $GENR8 account...');
      transaction.add(
        createAssociatedTokenAccountInstruction(
          payerPublicKey, // payer
          toTokenAccount, // associated token account
          PAYMENT_WALLET_ADDRESS, // owner
          PAYMENT_TOKEN_MINT_ADDRESS, // mint
          TOKEN_2022_PROGRAM_ID,
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
        TOKEN_2022_PROGRAM_ID
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
 * Check $GENR8 token balance for a wallet
 */
export async function getUSDCBalance(
  connection: Connection,
  walletPublicKey: PublicKey
): Promise<number> {
  try {
    const tokenAccount = getAssociatedTokenAddressSync(
      PAYMENT_TOKEN_MINT_ADDRESS,
      walletPublicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const balance = await connection.getTokenAccountBalance(tokenAccount);
    
    // Return balance in $GENR8 tokens
    return parseFloat(balance.value.amount) / Math.pow(10, balance.value.decimals);
  } catch (error) {
    console.error('Error getting $GENR8 balance:', error);
    return 0;
  }
}

