import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const MODELS = ['gpt-image-1', 'ideogram', 'qwen', 'nano-banan-pro'];
const MODEL_NAMES: Record<string, string> = {
  'gpt-image-1': 'gpt4o',
  'ideogram': 'ideogram',
  'qwen': 'qwen',
  'nano-banan-pro': 'nano',
};

// Helper to download image from URL
async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Helper to poll for generation result
async function pollForResult(taskId: string, model: string, maxAttempts = 60): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  for (let i = 0; i < maxAttempts; i++) {
    console.log(`Polling attempt ${i + 1}/${maxAttempts} for ${model}...`);
    
    const response = await fetch(`${baseUrl}/api/generate/${taskId}?model=${model}`);
    const data = await response.json();
    
    if (data.state === 'completed' && data.result) {
      console.log(`✅ ${model} completed!`);
      return data.result;
    }
    
    if (data.state === 'failed') {
      throw new Error(`Generation failed for ${model}: ${data.error || data.failMsg}`);
    }
    
    // Wait 2 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error(`Timeout waiting for ${model} generation`);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, filename } = body;

    if (!prompt || !filename) {
      return NextResponse.json(
        { error: 'prompt and filename are required' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const results: Record<string, string> = {};
    const errors: Record<string, string> = {};

    console.log(`\n🚀 Starting comparison generation for: "${prompt}"`);
    console.log(`📁 Filename prefix: ${filename}`);

    // Start all generations in parallel
    const taskPromises = MODELS.map(async (model) => {
      try {
        console.log(`Starting ${model}...`);
        
        // Model-specific options
        const options: Record<string, any> = {
          size: '1:1',
          imageSize: 'square_hd',
        };
        
        // Nano Banana Pro uses aspect_ratio instead
        if (model === 'nano-banan-pro') {
          options.aspect_ratio = '1:1';
          options.resolution = '1K';
        }
        
        const response = await fetch(`${baseUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            prompt,
            type: 'image',
            skipPayment: true,
            options,
          }),
        });

        const data = await response.json();
        
        if (!data.taskId) {
          throw new Error(data.error || 'No taskId returned');
        }

        console.log(`✅ ${model} task started: ${data.taskId}`);
        return { model, taskId: data.taskId };
      } catch (error: any) {
        console.error(`❌ Failed to start ${model}:`, error.message);
        errors[model] = error.message;
        return null;
      }
    });

    const tasks = (await Promise.all(taskPromises)).filter(Boolean) as { model: string; taskId: string }[];

    // Poll for all results
    const resultPromises = tasks.map(async ({ model, taskId }) => {
      try {
        const imageUrl = await pollForResult(taskId, model);
        return { model, imageUrl };
      } catch (error: any) {
        console.error(`❌ Failed to get result for ${model}:`, error.message);
        errors[model] = error.message;
        return null;
      }
    });

    const completedResults = (await Promise.all(resultPromises)).filter(Boolean) as { model: string; imageUrl: string }[];

    // Ensure compare directory exists
    const compareDir = path.join(process.cwd(), 'public', 'compare');
    if (!existsSync(compareDir)) {
      await mkdir(compareDir, { recursive: true });
    }

    // Download and save images
    for (const { model, imageUrl } of completedResults) {
      try {
        console.log(`📥 Downloading ${model} image...`);
        const imageBuffer = await downloadImage(imageUrl);
        
        const modelName = MODEL_NAMES[model];
        const filePath = path.join(compareDir, `${filename}-${modelName}.png`);
        
        await writeFile(filePath, imageBuffer);
        console.log(`💾 Saved: ${filename}-${modelName}.png`);
        
        results[model] = `/compare/${filename}-${modelName}.png`;
      } catch (error: any) {
        console.error(`❌ Failed to save ${model} image:`, error.message);
        errors[model] = error.message;
      }
    }

    console.log('\n✨ Generation complete!');
    console.log('Results:', results);
    if (Object.keys(errors).length > 0) {
      console.log('Errors:', errors);
    }

    return NextResponse.json({
      success: true,
      prompt,
      results,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    console.error('Compare generation failed:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

