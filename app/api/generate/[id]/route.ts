import { NextRequest, NextResponse } from 'next/server';
import { queryTaskStatus, parseTaskResult } from '@/lib/kie-ai';
import { queryVeoTaskStatus } from '@/lib/veo-ai';
import { query4oImageStatus } from '@/lib/openai-image';
import { queryIdeogramStatus } from '@/lib/ideogram-ai';
import { queryQwenStatus } from '@/lib/qwen-ai';
import { downloadAndUploadMultipleToSupabase } from '@/lib/supabase-helpers';
import { getPaymentInfo, clearPaymentTracking } from '@/lib/payment-tracking';
import { sendRefund } from '@/lib/refund';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { getModelById } from '@/lib/models';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;
    const { searchParams } = new URL(request.url);
    const model = searchParams.get('model');
    
    // Get payment info from headers (sent by frontend during polling)
    const userWallet = request.headers.get('X-User-Wallet') || undefined;
    const paymentMethod = (request.headers.get('X-Payment-Method') || 'gen') as 'gen' | 'usdc';
    const amountPaidHeaderRaw = request.headers.get('X-Amount-Paid');
    const amountPaidHeader = amountPaidHeaderRaw ? Number(amountPaidHeaderRaw) : undefined;

    const modelInfo = model ? getModelById(model) : undefined;
    const modelPrice = modelInfo?.price ?? 0.1;

    console.log('🔍 Checking task:', taskId, 'Model:', model);
    console.log('💳 User wallet from headers:', userWallet);
    console.log('💳 Payment method from headers:', paymentMethod);
    console.log('💳 Amount paid from headers:', amountPaidHeader);

    let taskResponse;
    let isSora = false;
    let isVeo = false;
    let is4oImage = false;
    let isIdeogram = false;
    let isQwen = false;

    // Use model parameter to determine which API to call
    if (model === 'gpt-image-1') {
      console.log('🎯 Calling 4o Image API directly...');
      taskResponse = await query4oImageStatus(taskId);
      is4oImage = true;
      console.log('✅ 4o Image API responded');
    } else if (model === 'ideogram') {
      console.log('🎯 Calling Ideogram API directly...');
      taskResponse = await queryIdeogramStatus(taskId);
      isIdeogram = true;
      console.log('✅ Ideogram API responded');
    } else if (model === 'qwen') {
      console.log('🎯 Calling Qwen API directly...');
      taskResponse = await queryQwenStatus(taskId);
      isQwen = true;
      console.log('✅ Qwen API responded');
    } else if (model === 'veo-3.1') {
      console.log('🎯 Calling Veo API directly...');
      taskResponse = await queryVeoTaskStatus(taskId);
      isVeo = true;
      console.log('✅ Veo API responded');
    } else if (model === 'sora-2') {
      console.log('🎯 Calling Sora API directly...');
      taskResponse = await queryTaskStatus(taskId);
      isSora = true;
      console.log('✅ Sora API responded');
    } else {
      // Fallback: Try both APIs if model not specified (backward compatibility)
      console.log('⚠️ No model specified, trying both APIs...');
      try {
        taskResponse = await queryTaskStatus(taskId);
        isSora = true;
        console.log('✅ Sora API responded');
      } catch (soraError) {
        console.log('❌ Sora API failed, trying Veo API...');
        taskResponse = await queryVeoTaskStatus(taskId);
        isVeo = true;
        console.log('✅ Veo API responded');
      }
    }

    console.log('📦 Full API response:');
    console.log(JSON.stringify(taskResponse, null, 2));

    const { data } = taskResponse;

    // Handle 4o Image response (uses successFlag and status)
    if (is4oImage) {
      console.log('🎯 4o Image status:', data.status, 'successFlag:', data.successFlag);
      
      if (data.status === 'SUCCESS' && data.successFlag === 1 && data.response?.resultUrls) {
        console.log('🎉 4O IMAGE IS READY!');
        console.log('🖼️ Original URLs from Kie AI:', data.response.resultUrls);
        
        // Download images from Kie AI and upload to our Supabase
        console.log('📥 Downloading and uploading images to Supabase...');
        const supabaseUrls = await downloadAndUploadMultipleToSupabase(data.response.resultUrls, 'generated-images');
        console.log('✅ Images uploaded to Supabase:', supabaseUrls);
        
        // Return first image as primary, but include all URLs
        const imageUrl = supabaseUrls[0];
        
        // Clear payment tracking on success
        clearPaymentTracking(taskId);
        
        return NextResponse.json({
          success: true,
          taskId: data.taskId,
          result: imageUrl,
          resultUrls: supabaseUrls, // All generated images from our Supabase
          type: 'image',
          state: 'completed',
          model: 'gpt-image-1',
        });
      } else if (data.status === 'CREATE_TASK_FAILED' || data.status === 'GENERATE_FAILED') {
        // Failed - check if it's a content policy violation
        const errorMessage = data.errorMessage || '';
        const isContentPolicyViolation = 
          errorMessage.includes('content') || 
          errorMessage.includes('policy') || 
          errorMessage.includes('violation') ||
          errorMessage.includes('flagged') ||
          data.errorCode === '400';

        console.log('❌ 4o Image generation failed:', errorMessage);
        console.log('🔍 Is content policy violation:', isContentPolicyViolation);

        if (isContentPolicyViolation && userWallet) {
          const paymentInfo = getPaymentInfo(taskId);
          const paymentSignature = paymentInfo?.paymentSignature;
          const paymentMethodUsed = paymentInfo?.paymentMethod ?? paymentMethod;
          const trackedAmount = paymentInfo?.amount;
          const headerAmount = typeof amountPaidHeader === 'number' && !Number.isNaN(amountPaidHeader) ? amountPaidHeader : undefined;
          const resolvedAmount = (trackedAmount && trackedAmount > 0)
            ? trackedAmount
            : (headerAmount && headerAmount > 0)
              ? headerAmount
              : modelPrice;
          const resolvedMethod: 'gen' | 'usdc' = paymentMethodUsed === 'usdc' ? 'usdc' : 'gen';

          console.log('💸 Initiating refund for content policy violation...');
          console.log('👤 User wallet:', userWallet);
          console.log('💳 Payment method (resolved):', resolvedMethod);
          console.log('💵 Amount to refund:', resolvedAmount);
          
          try {
            const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('mainnet-beta');
            const connection = new Connection(rpcUrl, 'confirmed');

            const refundResult = await sendRefund({
              userWalletAddress: userWallet,
              amount: resolvedAmount,
              paymentMethod: resolvedMethod,
              reason: `Content policy violation: ${errorMessage}`,
              originalTxSignature: paymentSignature,
            }, connection);

            if (refundResult.success) {
              console.log('✅ Refund successful:', refundResult.signature);
              clearPaymentTracking(taskId);
              
              return NextResponse.json(
                {
                  success: false,
                  error: 'Generation failed - Content policy violation',
                  errorMessage: errorMessage,
                  errorCode: data.errorCode,
                  state: 'failed',
                  refunded: true,
                  refundSignature: refundResult.signature,
                  refundAmount: refundResult.amountRefunded,
                  refundToken: refundResult.token,
                },
                { status: 500 }
              );
            } else {
              console.error('❌ Refund failed:', refundResult.error);
            }
          } catch (refundError: any) {
            console.error('❌ Error processing refund:', refundError);
          }
        } else if (isContentPolicyViolation && !userWallet) {
          console.warn('⚠️ Content policy violation but no user wallet in headers - cannot refund');
        }

        // Standard failed response (no refund or refund failed)
        return NextResponse.json(
          {
            success: false,
            error: 'Content policy violation',
            errorMessage: errorMessage || 'Your content was flagged as violating content policies.',
            errorCode: data.errorCode,
            state: 'failed',
            refunded: false,
          },
          { status: 500 }
        );
      } else {
        // Still processing (status === 'GENERATING')
        console.log('⏳ Still generating 4o image..., progress:', data.progress);
        return NextResponse.json({
          success: false,
          taskId: data.taskId,
          state: 'processing',
          progress: data.progress,
          message: 'Image generation in progress',
        });
      }
    }

    // Handle Ideogram response (uses state: waiting/success/fail)
    if (isIdeogram) {
      console.log('🎯 Ideogram state:', data.state);
      
      if (data.state === 'success' && data.resultJson) {
        console.log('🎉 IDEOGRAM IMAGE IS READY!');
        
        const result = JSON.parse(data.resultJson);
        const imageUrls = result.resultUrls || [];
        console.log('🖼️ Original URLs from Ideogram:', imageUrls);
        
        // Download images from Ideogram and upload to our Supabase
        console.log('📥 Downloading and uploading images to Supabase...');
        const supabaseUrls = await downloadAndUploadMultipleToSupabase(imageUrls, 'generated-images');
        console.log('✅ Images uploaded to Supabase:', supabaseUrls);
        
        const imageUrl = supabaseUrls[0];
        
        return NextResponse.json({
          success: true,
          taskId: data.taskId,
          result: imageUrl,
          resultUrls: supabaseUrls, // All generated images from our Supabase
          type: 'image',
          state: 'completed',
          model: 'ideogram',
        });
      } else if (data.state === 'fail') {
        return NextResponse.json(
          {
            success: false,
            error: 'Generation failed',
            failMsg: data.failMsg,
            failCode: data.failCode,
            state: 'failed',
          },
          { status: 500 }
        );
      } else {
        // Still processing (state === 'waiting')
        console.log('⏳ Still generating Ideogram image, state:', data.state);
        return NextResponse.json({
          success: false,
          taskId: data.taskId,
          state: data.state || 'processing',
          message: `Generation in progress (${data.state || 'processing'})`,
        });
      }
    }

    // Handle Qwen response (uses state: waiting/success/fail)
    if (isQwen) {
      console.log('🎯 Qwen state:', data.state);
      
      if (data.state === 'success' && data.resultJson) {
        console.log('🎉 QWEN IMAGE IS READY!');
        
        const result = JSON.parse(data.resultJson);
        const imageUrls = result.resultUrls || [];
        console.log('🖼️ Original URLs from Qwen:', imageUrls);
        
        // Download images from Qwen and upload to our Supabase
        console.log('📥 Downloading and uploading images to Supabase...');
        const supabaseUrls = await downloadAndUploadMultipleToSupabase(imageUrls, 'generated-images');
        console.log('✅ Images uploaded to Supabase:', supabaseUrls);
        
        const imageUrl = supabaseUrls[0];
        
        return NextResponse.json({
          success: true,
          taskId: data.taskId,
          result: imageUrl,
          resultUrls: supabaseUrls, // All generated images from our Supabase
          type: 'image',
          state: 'completed',
          model: 'qwen',
        });
      } else if (data.state === 'fail') {
        return NextResponse.json(
          {
            success: false,
            error: 'Generation failed',
            failMsg: data.failMsg,
            failCode: data.failCode,
            state: 'failed',
          },
          { status: 500 }
        );
      } else {
        // Still processing (state === 'waiting')
        console.log('⏳ Still generating Qwen image, state:', data.state);
        return NextResponse.json({
          success: false,
          taskId: data.taskId,
          state: data.state || 'processing',
          message: `Generation in progress (${data.state || 'processing'})`,
        });
      }
    }

    // Handle Veo response (uses successFlag)
    if (isVeo) {
      console.log('🎯 Veo successFlag:', data.successFlag);
      
      if (data.successFlag === 1 && data.response && data.response.resultUrls) {
        console.log('🎉 VEO VIDEO IS READY!');
        
        const videoUrl = data.response.resultUrls[0];
        console.log('🎥 FINAL VIDEO URL:', videoUrl);
        
        return NextResponse.json({
          success: true,
          taskId: data.taskId,
          result: videoUrl,
          resultUrls: data.response.resultUrls,
          type: 'video',
          state: 'completed',
          model: 'veo-3.1',
        });
      } else if (data.successFlag === 2 || data.successFlag === 3) {
        // Failed
        return NextResponse.json(
          {
            success: false,
            error: 'Generation failed',
            errorMessage: data.errorMessage,
            errorCode: data.errorCode,
            state: 'failed',
          },
          { status: 500 }
        );
      } else {
        // Still processing (successFlag === 0)
        console.log('⏳ Still generating Veo video...');
        return NextResponse.json({
          success: false,
          taskId: data.taskId,
          state: 'processing',
          message: 'Video generation in progress',
        });
      }
    }
    
    // Handle Sora response (uses state)
    if (isSora) {
      console.log('🎯 Sora state:', data.state);
      
      if (data.state === 'success' && data.resultJson) {
        console.log('🎉 SORA VIDEO IS READY!');
        
        const result = parseTaskResult(data.resultJson);
        const videoUrl = result.resultUrls[0];
        
        console.log('🎥 FINAL VIDEO URL:', videoUrl);
        
        // Clear payment tracking on success
        clearPaymentTracking(taskId);
        
        return NextResponse.json({
          success: true,
          taskId: data.taskId,
          result: videoUrl,
          resultUrls: result.resultUrls,
          type: 'video',
          state: 'completed',
          model: 'sora-2',
          credits: {
            consumed: data.consumeCredits,
            remaining: data.remainedCredits,
          },
        });
      } else if (data.state === 'fail') {
        // Failed - check if it's a content policy violation
        const failMsg = data.failMsg || '';
        const isContentPolicyViolation = 
          failMsg.includes('content') || 
          failMsg.includes('policy') || 
          failMsg.includes('violation') ||
          failMsg.includes('flagged');

        console.log('❌ Sora generation failed:', failMsg);
        console.log('🔍 Is content policy violation:', isContentPolicyViolation);

        // Hvis det er content policy violation OG vi har user wallet, refunder brugeren
        if (isContentPolicyViolation && userWallet) {
          const paymentInfo = getPaymentInfo(taskId);
          const paymentSignature = paymentInfo?.paymentSignature;
          const paymentMethodUsed = paymentInfo?.paymentMethod ?? paymentMethod;
          const trackedAmount = paymentInfo?.amount;
          const headerAmount = typeof amountPaidHeader === 'number' && !Number.isNaN(amountPaidHeader) ? amountPaidHeader : undefined;
          const resolvedAmount = (trackedAmount && trackedAmount > 0)
            ? trackedAmount
            : (headerAmount && headerAmount > 0)
              ? headerAmount
              : modelPrice;
          const resolvedMethod: 'gen' | 'usdc' = paymentMethodUsed === 'usdc' ? 'usdc' : 'gen';

          console.log('💸 Initiating refund for content policy violation...');
          console.log('👤 User wallet:', userWallet);
          console.log('💳 Payment method (resolved):', resolvedMethod);
          console.log('💵 Amount to refund:', resolvedAmount);
          
          try {
            const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('mainnet-beta');
            const connection = new Connection(rpcUrl, 'confirmed');

            const refundResult = await sendRefund({
              userWalletAddress: userWallet,
              amount: resolvedAmount,
              paymentMethod: resolvedMethod,
              reason: `Content policy violation: ${failMsg}`,
              originalTxSignature: paymentSignature,
            }, connection);

            if (refundResult.success) {
              console.log('✅ Refund successful:', refundResult.signature);
              clearPaymentTracking(taskId);
              
              return NextResponse.json(
                {
                  success: false,
                  error: 'Generation failed - Content policy violation',
                  failMsg: failMsg,
                  failCode: data.failCode,
                  state: 'failed',
                  refunded: true,
                  refundSignature: refundResult.signature,
                  refundAmount: refundResult.amountRefunded,
                  refundToken: refundResult.token,
                },
                { status: 500 }
              );
            } else {
              console.error('❌ Refund failed:', refundResult.error);
            }
          } catch (refundError: any) {
            console.error('❌ Error processing refund:', refundError);
          }
        } else if (isContentPolicyViolation && !userWallet) {
          console.warn('⚠️ Content policy violation but no user wallet in headers - cannot refund');
        }

        // Standard failed response (no refund or refund failed)
        return NextResponse.json(
          {
            success: false,
            error: 'Generation failed',
            failMsg: data.failMsg,
            failCode: data.failCode,
            state: 'failed',
          },
          { status: 500 }
        );
      } else {
        // Still processing
        console.log('⏳ Still generating Sora video, state:', data.state);
        return NextResponse.json({
          success: false,
          taskId: data.taskId,
          state: data.state || 'processing',
          message: `Generation in progress (${data.state || 'processing'})`,
        });
      }
    }
  } catch (error: any) {
    console.error('❌ Failed to fetch result:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Could not fetch generation result', 
        message: error.message,
        state: 'failed'
      },
      { status: 500 }
    );
  }
}

