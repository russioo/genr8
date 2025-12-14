import { NextRequest, NextResponse } from 'next/server';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { verifyUSDCPayment } from '@/lib/solana-payment';

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

    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('mainnet-beta');
    const connection = new Connection(rpcUrl, 'confirmed');

    const isPaid = await verifyUSDCPayment(connection, signature, amount);

    if (isPaid) {
      console.log('✅ Payment verified!');
      
      return NextResponse.json({
        success: true,
        paid: true,
        generationId,
        signature,
        message: 'Payment verified on Solana',
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

