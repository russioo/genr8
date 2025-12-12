import { NextRequest, NextResponse } from 'next/server';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { verifyUSDCPayment, getTokenPriceUSD } from '@/lib/solana-payment';
import { queueBuybackContribution } from '@/lib/buyback-queue';
import { BUYBACK_FEE_PERCENTAGE } from '@/lib/token-price';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { signature, generationId, amount } = body;

    if (!signature || !generationId) {
      return NextResponse.json(
        { error: 'Signature and generation ID are required' },
        { status: 400 }
      );
    }

    console.log('🔍 Verifying Solana payment...');
    console.log('Signature:', signature);
    console.log('Generation ID:', generationId);
    console.log('Expected amount:', amount, 'USDC');

    // RPC endpoint for payment verification
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 
                   clusterApiUrl('mainnet-beta');
    const connection = new Connection(rpcUrl, 'confirmed');

    // Verify payment on-chain
    const isPaid = await verifyUSDCPayment(connection, signature, amount);

    if (isPaid) {
      console.log('✅ Payment verified!');
      
      // Queue buyback contribution (10% of payment) for batch processing
      try {
        const feePercentage = BUYBACK_FEE_PERCENTAGE / 100;
        const feeUSD = amount * feePercentage;

        await queueBuybackContribution({
          paymentSignature: signature,
          generationId,
          amountUSD: feeUSD,
        });

        console.log(`🧺 Buyback contribution queued: $${feeUSD.toFixed(4)} USD (${signature})`);
      } catch (buybackQueueError) {
        console.error('❌ Could not queue buyback contribution:', buybackQueueError);
        // Continue anyway – buyback can be retried later
      }
      
      return NextResponse.json({
        success: true,
        paid: true,
        generationId,
        signature,
        message: 'Payment verified on Solana - generation started',
      });
    } else {
      console.log('❌ Payment could not be verified');
      return NextResponse.json({
        success: false,
        paid: false,
        message: 'Payment not found or not completed on Solana',
      }, { status: 402 });
    }
  } catch (error: any) {
    console.error('❌ Payment verification failed:', error);
    return NextResponse.json(
      { 
        error: 'Could not verify payment',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

