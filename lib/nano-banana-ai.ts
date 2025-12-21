// Nano Banana Pro API Integration (Image Generation)


const KIE_AI_API_URL = process.env.KIE_AI_API_URL || 'https://api.kie.ai/api/v1';
const KIE_AI_API_KEY = process.env.KIE_AI_API_KEY;

export interface NanoBananaCreateTaskRequest {
  model: string;
  callBackUrl?: string;
  input: {
    prompt: string;
    image_input?: string[];
    aspect_ratio?: '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9' | 'auto';
    resolution?: '1K' | '2K' | '4K';
    output_format?: 'png' | 'jpg';
  };
}

export interface NanoBananaCreateTaskResponse {
  code: number;
  message: string;
  data: {
    taskId: string;
  };
}

export interface NanoBananaQueryTaskResponse {
  code: number;
  message: string;
  data: {
    taskId: string;
    model: string;
    state: 'waiting' | 'queuing' | 'generating' | 'success' | 'fail';
    createTime: number;
    completeTime?: number;
    updateTime?: number;
    costTime?: number;
    consumeCredits?: number;
    remainedCredits?: number;
    resultJson?: string;
    failCode?: string | null;
    failMsg?: string | null;
    param?: string;
  };
}

export interface NanoBananaTaskResult {
  resultUrls: string[];
}

/**
 * Create a new Nano Banana Pro image generation task
 */
export async function createNanoBananaTask(
  prompt: string,
  options?: {
    image_input?: string[];
    aspect_ratio?: '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9' | 'auto';
    resolution?: '1K' | '2K' | '4K';
    output_format?: 'png' | 'jpg';
    callBackUrl?: string;
  }
): Promise<NanoBananaCreateTaskResponse> {
  if (!KIE_AI_API_KEY) {
    throw new Error('KIE_AI_API_KEY is not configured');
  }

  const requestBody: NanoBananaCreateTaskRequest = {
    model: 'nano-banana-pro',
    input: {
      prompt: prompt,
      aspect_ratio: options?.aspect_ratio || '1:1',
      resolution: options?.resolution || '1K',
      output_format: options?.output_format || 'png',
    },
  };

  // Add image input if provided
  if (options?.image_input && options.image_input.length > 0) {
    requestBody.input.image_input = options.image_input;
  }

  if (options?.callBackUrl) {
    requestBody.callBackUrl = options.callBackUrl;
  }

  console.log('🖼️ Creating Nano Banana Pro task:', {
    model: requestBody.model,
    hasImageInput: !!requestBody.input.image_input,
    aspectRatio: requestBody.input.aspect_ratio,
    resolution: requestBody.input.resolution,
    prompt: prompt?.substring(0, 50) + '...',
  });

  const response = await fetch(`${KIE_AI_API_URL}/jobs/createTask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KIE_AI_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
    cache: 'no-store',
  });

  const data = await response.json();

  console.log('Nano Banana Pro Response:', {
    status: response.status,
    ok: response.ok,
    data: data,
  });

  if (!response.ok) {
    throw new Error(
      `Nano Banana Pro API error: ${response.status} - ${data.message || data.msg || JSON.stringify(data)}`
    );
  }

  if (data.code !== 200) {
    throw new Error(
      `Nano Banana Pro task creation failed: Code ${data.code} - ${data.message || data.msg || JSON.stringify(data)}`
    );
  }

  return data;
}

/**
 * Query the status of a Nano Banana Pro task
 */
export async function queryNanoBananaStatus(taskId: string): Promise<NanoBananaQueryTaskResponse> {
  if (!KIE_AI_API_KEY) {
    throw new Error('KIE_AI_API_KEY is not configured');
  }

  console.log('🔍 Querying Nano Banana Pro task:', taskId);

  const response = await fetch(`${KIE_AI_API_URL}/jobs/recordInfo?taskId=${taskId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${KIE_AI_API_KEY}`,
    },
    cache: 'no-store',
    next: { revalidate: 0 },
  });

  const data = await response.json();

  console.log('📥 RAW Nano Banana Pro Response:');
  console.log(JSON.stringify(data, null, 2));

  if (!response.ok || data.code !== 200) {
    throw new Error(
      `Nano Banana Pro API error: ${response.status} - ${data.msg || data.message || 'Unknown error'}`
    );
  }

  return data;
}

/**
 * Parse the result JSON from a completed Nano Banana Pro task
 */
export function parseNanoBananaTaskResult(resultJson: string): NanoBananaTaskResult {
  try {
    return JSON.parse(resultJson);
  } catch (error) {
    throw new Error('Failed to parse Nano Banana Pro task result JSON');
  }
}


