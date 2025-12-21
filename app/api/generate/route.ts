import { NextRequest, NextResponse } from 'next/server';
import { getModelById } from '@/lib/models';
import { createSoraTask } from '@/lib/kie-ai';
import { createVeoTask } from '@/lib/veo-ai';
import { create4oImageTask } from '@/lib/openai-image';
import { createIdeogramTask } from '@/lib/ideogram-ai';
import { createQwenTask } from '@/lib/qwen-ai';
import { createGrokImagineTask } from '@/lib/grok-ai';
import { createNanoBananaTask } from '@/lib/nano-banana-ai';
import { generations } from '@/lib/storage';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { verifyUSDCPayment } from '@/lib/solana-payment';
import { trackPayment } from '@/lib/payment-tracking';

// DEV wallet that gets free access
const DEV_WALLET = '8Q2PYkXiqPwCQLs59nbjbDhuXnG6VpmhnXR4U7Yt7bbM';

// Store for pending payments (i produktion, brug database)
const pendingPayments = new Map<string, {
  model: string;
  prompt: string;
  type: string;
  options: any;
  amount: number;
  createdAt: Date;
}>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, prompt, type, options, paymentSignature, userWallet, paymentMethod, amountPaidUSD, skipPayment } = body;

    if (!model || !prompt || !type) {
      return NextResponse.json(
        { error: 'Model, prompt, and type are required' },
        { status: 400 }
      );
    }

    const modelInfo = getModelById(model);
    if (!modelInfo) {
      return NextResponse.json(
        { error: 'Invalid model' },
        { status: 400 }
      );
    }

    // Check if model is coming soon
    if (modelInfo.comingSoon) {
      return NextResponse.json(
        { 
          error: 'Coming Soon',
          message: `${modelInfo.name} is coming soon. Please check back later.`,
          comingSoon: true,
        },
        { status: 503 }
      );
    }

    // ====== DEV WALLET - Free access ======
    const isDevWallet = userWallet && userWallet === DEV_WALLET;
    
    // ====== DEMO MODE - Skip payment ======
    if (skipPayment || isDevWallet) {
      if (isDevWallet) {
        console.log('🎁 DEV WALLET: Free access granted for', modelInfo.name);
      } else {
        console.log('🎁 DEMO MODE: Skipping payment for', modelInfo.name);
      }
      // Continue to generation without payment verification
    }
    // ====== HTTP 402 PAYMENT REQUIRED ======
    // Tjek om der er betalt (via payment signature)
    else if (!paymentSignature) {
      // Generer generation ID til denne pending payment
      const generationId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Gem pending generation details
      pendingPayments.set(generationId, {
        model,
        prompt,
        type,
        options,
        amount: modelInfo.price,
        createdAt: new Date(),
      });

      console.log('🚫 HTTP 402: Payment Required');
      console.log('Generation ID:', generationId);
      console.log('Amount:', modelInfo.price, 'USDC');

      // Returner HTTP 402 Payment Required
      return new NextResponse(
        JSON.stringify({
          error: 'Payment Required',
          message: 'This resource requires payment',
          generationId,
          paymentRequired: true,
          amount: modelInfo.price,
          currency: 'USDC',
          network: 'Solana',
          model: modelInfo.name,
        }),
        { 
          status: 402,
          headers: {
            'Content-Type': 'application/json',
            'WWW-Authenticate': `Bearer realm="GENR8", amount="${modelInfo.price}", currency="USDC", network="Solana"`,
          },
        }
      );
    }

    // Payment verification (skip in demo mode or dev wallet)
    let actualAmountPaid = modelInfo.price;
    let effectivePaymentMethod: 'gen' | 'usdc' = 'gen';
    
    if (!skipPayment && !isDevWallet && paymentSignature) {
    console.log('💳 Verifying payment...');
    console.log('Payment Signature:', paymentSignature);
    
      const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('mainnet-beta');
    const connection = new Connection(rpcUrl, 'confirmed');
      actualAmountPaid = typeof amountPaidUSD === 'number' && !Number.isNaN(amountPaidUSD) ? amountPaidUSD : modelInfo.price;
      effectivePaymentMethod = paymentMethod === 'usdc' ? 'usdc' : 'gen';

    const isPaid = await verifyUSDCPayment(connection, paymentSignature, actualAmountPaid);

    if (!isPaid) {
      console.log('❌ Payment not verified');
        return NextResponse.json({ error: 'Payment verification failed', message: 'Could not verify payment on Solana blockchain' }, { status: 402 });
    }
    console.log('✅ Payment verified! Starting generation...');
    } else if (skipPayment || isDevWallet) {
      if (isDevWallet) {
        console.log('🎁 Dev wallet - skipping payment verification');
      } else {
        console.log('🎁 Demo mode - skipping payment verification');
      }
    }
    
    // ====== GENERATION LOGIC ======

    // For GPT Image 1 (4o Image), create Kie.ai task immediately
    if (model === 'gpt-image-1') {
      try {
        console.log('Creating 4o Image task with prompt:', prompt);
        console.log('Options:', options);
        
        const imageResponse = await create4oImageTask({
          prompt,
          size: options?.size || '1:1',
          nVariants: options?.nVariants || 1,
          filesUrl: options?.filesUrl, // Pass reference images if provided
        });

        const taskId = imageResponse.data.taskId;
        
        console.log('4o Image task created:', taskId);

        // Track payment info (or free generation for dev wallet)
        console.log('🔍 Tracking payment - userWallet:', userWallet);
        console.log('🔍 Tracking payment - paymentSignature:', paymentSignature);
        console.log('🔍 Tracking payment - paymentMethod:', paymentMethod);
        if (userWallet) {
          // Track as free generation for dev wallet, or paid generation for others
          trackPayment({
            taskId,
            userWallet,
            amount: isDevWallet ? 0 : actualAmountPaid,
            paymentMethod: isDevWallet ? 'gen' : effectivePaymentMethod,
            paymentSignature: isDevWallet ? 'dev-wallet-free' : (paymentSignature || ''),
            model: 'gpt-image-1',
            timestamp: new Date(),
            prompt,
            type: 'image',
          });
          console.log(isDevWallet ? '✅ Free generation tracked for dev wallet' : '✅ Payment tracked for taskId:', taskId);
        } else {
          console.warn('⚠️ Payment NOT tracked - missing userWallet or paymentSignature');
        }

        return NextResponse.json({
          success: true,
          taskId: taskId,
          message: 'Image generation started',
          status: 'processing',
          model: 'gpt-image-1',
        });
      } catch (error: any) {
        console.error('Failed to create 4o Image task:', error);
        return NextResponse.json(
          { 
            error: 'Failed to initiate image generation',
            message: error.message,
          },
          { status: 500 }
        );
      }
    }

    // For Ideogram v3, create task immediately
    if (model === 'ideogram') {
      try {
        console.log('Creating Ideogram task with prompt:', prompt);
        console.log('Options:', options);
        
        const ideogramResponse = await createIdeogramTask({
          prompt,
          renderingSpeed: options?.renderingSpeed || 'BALANCED',
          style: options?.style || 'AUTO',
          expandPrompt: options?.expandPrompt !== undefined ? options.expandPrompt : true,
          imageSize: options?.imageSize || 'square_hd',
          numImages: options?.numImages || '1',
          seed: options?.seed,
          negativePrompt: options?.negativePrompt,
        });

        const taskId = ideogramResponse.taskId;
        
        console.log('Ideogram task created:', taskId);

        // Track payment info
        if (userWallet) {
          trackPayment({
            taskId,
            userWallet,
            amount: isDevWallet ? 0 : actualAmountPaid,
            paymentMethod: isDevWallet ? 'gen' : effectivePaymentMethod,
            paymentSignature: isDevWallet ? 'dev-wallet-free' : (paymentSignature || ''),
            model: 'ideogram',
            timestamp: new Date(),
            prompt,
            type: 'image',
          });
        }

        return NextResponse.json({
          success: true,
          taskId: taskId,
          message: 'Image generation started',
          status: 'processing',
          model: 'ideogram',
        });
      } catch (error: any) {
        console.error('Failed to create Ideogram task:', error);
        return NextResponse.json(
          { 
            error: 'Failed to initiate image generation',
            message: error.message,
          },
          { status: 500 }
        );
      }
    }

    // For Qwen, create task immediately
    if (model === 'qwen') {
      try {
        console.log('Creating Qwen task with prompt:', prompt);
        console.log('Options:', options);
        
        const qwenResponse = await createQwenTask({
          prompt,
          imageSize: options?.imageSize || 'square_hd',
          numInferenceSteps: options?.numInferenceSteps || 30,
          seed: options?.seed,
          guidanceScale: options?.guidanceScale || 2.5,
          enableSafetyChecker: options?.enableSafetyChecker !== undefined ? options.enableSafetyChecker : true,
          outputFormat: options?.outputFormat || 'png',
          negativePrompt: options?.negativePrompt,
          acceleration: options?.acceleration || 'none',
        });

        const taskId = qwenResponse.taskId;
        
        console.log('Qwen task created:', taskId);

        // Track payment info
        if (userWallet) {
          trackPayment({
            taskId,
            userWallet,
            amount: isDevWallet ? 0 : actualAmountPaid,
            paymentMethod: isDevWallet ? 'gen' : effectivePaymentMethod,
            paymentSignature: isDevWallet ? 'dev-wallet-free' : (paymentSignature || ''),
            model: 'qwen',
            timestamp: new Date(),
            prompt,
            type: 'image',
          });
        }

        return NextResponse.json({
          success: true,
          taskId: taskId,
          message: 'Image generation started',
          status: 'processing',
          model: 'qwen',
        });
      } catch (error: any) {
        console.error('Failed to create Qwen task:', error);
        return NextResponse.json(
          { 
            error: 'Failed to initiate image generation',
            message: error.message,
          },
          { status: 500 }
        );
      }
    }

    // For Sora 2, create Kie.ai task immediately
    if (model === 'sora-2') {
      try {
        console.log('Creating Sora 2 task with options:', options);
        
        const kieResponse = await createSoraTask(prompt, {
          aspect_ratio: options?.aspect_ratio || 'landscape',
          n_frames: options?.n_frames || '10',
          remove_watermark: options?.remove_watermark ?? true,
        });

        const kieTaskId = kieResponse.data.taskId;
        
        console.log('Sora 2 task created:', kieTaskId);

        // Track payment info
        if (userWallet) {
          trackPayment({
            taskId: kieTaskId,
            userWallet,
            amount: isDevWallet ? 0 : actualAmountPaid,
            paymentMethod: isDevWallet ? 'gen' : effectivePaymentMethod,
            paymentSignature: isDevWallet ? 'dev-wallet-free' : (paymentSignature || ''),
            model: 'sora-2',
            timestamp: new Date(),
            prompt,
            type: 'video',
          });
        }

        // Return taskId directly - NO Map storage needed!
        return NextResponse.json({
          success: true,
          taskId: kieTaskId,
          message: 'Video generation started',
          status: 'processing',
          model: 'sora-2',
        });
      } catch (error: any) {
        console.error('Failed to create Kie.ai task:', error);
        return NextResponse.json(
          { 
            error: 'Failed to initiate video generation',
            message: error.message,
          },
          { status: 500 }
        );
      }
    }

    // For Veo 3.1, create Veo task immediately
    if (model === 'veo-3.1') {
      try {
        console.log('Creating Veo 3.1 task with options:', options);
        
        const veoResponse = await createVeoTask(prompt, {
          aspectRatio: options?.aspectRatio || '16:9',
          imageUrls: options?.imageUrls,  // Pass imageUrls if provided
        });

        const veoTaskId = veoResponse.data.taskId;
        
        console.log('Veo 3.1 task created:', veoTaskId);

        // Track payment info
        if (userWallet) {
          trackPayment({
            taskId: veoTaskId,
            userWallet,
            amount: isDevWallet ? 0 : actualAmountPaid,
            paymentMethod: isDevWallet ? 'gen' : effectivePaymentMethod,
            paymentSignature: isDevWallet ? 'dev-wallet-free' : (paymentSignature || ''),
            model: 'veo-3.1',
            timestamp: new Date(),
            prompt,
            type: 'video',
          });
        }

        // Return taskId directly - NO Map storage needed!
        return NextResponse.json({
          success: true,
          taskId: veoTaskId,
          message: 'Video generation started',
          status: 'processing',
          model: 'veo-3.1',
        });
      } catch (error: any) {
        console.error('Failed to create Veo task:', error);
        return NextResponse.json(
          { 
            error: 'Failed to initiate video generation',
            message: error.message,
          },
          { status: 500 }
        );
      }
    }

    // For Grok Imagine, create task immediately
    if (model === 'grok-imagine') {
      try {
        console.log('Creating Grok Imagine task with options:', options);
        
        const grokResponse = await createGrokImagineTask(prompt, {
          image_urls: options?.image_urls,
          task_id: options?.task_id,
          index: options?.index,
          mode: options?.mode || 'normal',
        });

        const grokTaskId = grokResponse.data.taskId;
        
        console.log('Grok Imagine task created:', grokTaskId);

        // Track payment info
        if (userWallet) {
          trackPayment({
            taskId: grokTaskId,
            userWallet,
            amount: isDevWallet ? 0 : actualAmountPaid,
            paymentMethod: isDevWallet ? 'gen' : effectivePaymentMethod,
            paymentSignature: isDevWallet ? 'dev-wallet-free' : (paymentSignature || ''),
            model: 'grok-imagine',
            timestamp: new Date(),
            prompt,
            type: 'video',
          });
        }

        return NextResponse.json({
          success: true,
          taskId: grokTaskId,
          message: 'Video generation started',
          status: 'processing',
          model: 'grok-imagine',
        });
      } catch (error: any) {
        console.error('Failed to create Grok Imagine task:', error);
        return NextResponse.json(
          { 
            error: 'Failed to initiate video generation',
            message: error.message,
          },
          { status: 500 }
        );
      }
    }

    // For Nano Banana Pro, create task immediately
    if (model === 'nano-banan-pro') {
      try {
        console.log('Creating Nano Banana Pro task with options:', options);
        
        const nanoResponse = await createNanoBananaTask(prompt, {
          image_input: options?.image_input && options.image_input.length > 0 ? options.image_input : undefined,
          aspect_ratio: options?.aspect_ratio || '1:1',
          resolution: options?.resolution || '1K',
          output_format: options?.output_format || 'png',
        });

        const nanoTaskId = nanoResponse.data.taskId;
        
        console.log('Nano Banana Pro task created:', nanoTaskId);

        // Track payment info
        if (userWallet) {
          trackPayment({
            taskId: nanoTaskId,
            userWallet,
            amount: isDevWallet ? 0 : actualAmountPaid,
            paymentMethod: isDevWallet ? 'gen' : effectivePaymentMethod,
            paymentSignature: isDevWallet ? 'dev-wallet-free' : (paymentSignature || ''),
            model: 'nano-banan-pro',
            timestamp: new Date(),
            prompt,
            type: 'image',
          });
        }

        return NextResponse.json({
          success: true,
          taskId: nanoTaskId,
          message: 'Image generation started',
          status: 'processing',
          model: 'nano-banan-pro',
        });
      } catch (error: any) {
        console.error('Failed to create Nano Banana Pro task:', error);
        return NextResponse.json(
          { 
            error: 'Failed to initiate image generation',
            message: error.message,
          },
          { status: 500 }
        );
      }
    }

    // For other models, return mock response
    // Generate unique ID for this generation
    const generationId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    generations.set(generationId, {
      model,
      prompt,
      type,
      status: 'processing',
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      generationId,
      message: 'Generation started',
      status: 'processing',
    });
  } catch (error) {
    console.error('Generation failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

