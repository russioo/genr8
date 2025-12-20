// Grok Imagine API Integration (Image-to-Video)

const KIE_AI_API_URL = process.env.KIE_AI_API_URL || 'https://api.kie.ai/api/v1';
const KIE_AI_API_KEY = process.env.KIE_AI_API_KEY;

export interface GrokImagineCreateTaskRequest {
  model: string;
  callBackUrl?: string;
  input: {
    image_urls?: string[];
    task_id?: string;
    index?: number;
    prompt?: string;
    mode?: 'fun' | 'normal' | 'spicy';
  };
}

export interface GrokImagineCreateTaskResponse {
  code: number;
  message: string;
  data: {
    taskId: string;
  };
}

export interface GrokImagineQueryTaskResponse {
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

export interface GrokImagineTaskResult {
  resultUrls: string[];
}

/**
 * Create a new Grok Imagine image-to-video generation task
 */
export async function createGrokImagineTask(
  prompt: string,
  options?: {
    image_urls?: string[];
    task_id?: string;
    index?: number;
    mode?: 'fun' | 'normal' | 'spicy';
    callBackUrl?: string;
  }
): Promise<GrokImagineCreateTaskResponse> {
  if (!KIE_AI_API_KEY) {
    throw new Error('KIE_AI_API_KEY is not configured');
  }

  const requestBody: GrokImagineCreateTaskRequest = {
    model: 'grok-imagine/image-to-video',
    input: {
      prompt: prompt || undefined,
      mode: options?.mode || 'normal',
    },
  };

  // Add image input - either image_urls or task_id + index
  if (options?.image_urls && options.image_urls.length > 0) {
    requestBody.input.image_urls = options.image_urls;
  } else if (options?.task_id) {
    requestBody.input.task_id = options.task_id;
    requestBody.input.index = options.index ?? 0;
  }

  if (options?.callBackUrl) {
    requestBody.callBackUrl = options.callBackUrl;
  }

  console.log('🎬 Creating Grok Imagine task:', {
    model: requestBody.model,
    hasImageUrls: !!requestBody.input.image_urls,
    hasTaskId: !!requestBody.input.task_id,
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

  console.log('Grok Imagine Response:', {
    status: response.status,
    ok: response.ok,
    data: data,
  });

  if (!response.ok) {
    throw new Error(
      `Grok Imagine API error: ${response.status} - ${data.message || data.msg || JSON.stringify(data)}`
    );
  }

  if (data.code !== 200) {
    throw new Error(
      `Grok Imagine task creation failed: Code ${data.code} - ${data.message || data.msg || JSON.stringify(data)}`
    );
  }

  return data;
}

/**
 * Query the status of a Grok Imagine task
 */
export async function queryGrokImagineStatus(taskId: string): Promise<GrokImagineQueryTaskResponse> {
  if (!KIE_AI_API_KEY) {
    throw new Error('KIE_AI_API_KEY is not configured');
  }

  console.log('🔍 Querying Grok Imagine task:', taskId);

  const response = await fetch(`${KIE_AI_API_URL}/jobs/recordInfo?taskId=${taskId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${KIE_AI_API_KEY}`,
    },
    cache: 'no-store',
    next: { revalidate: 0 },
  });

  const data = await response.json();

  console.log('📥 RAW Grok Imagine Response:');
  console.log(JSON.stringify(data, null, 2));

  if (!response.ok || data.code !== 200) {
    throw new Error(
      `Grok Imagine API error: ${response.status} - ${data.msg || data.message || 'Unknown error'}`
    );
  }

  return data;
}

/**
 * Parse the result JSON from a completed Grok Imagine task
 */
export function parseGrokImagineTaskResult(resultJson: string): GrokImagineTaskResult {
  try {
    return JSON.parse(resultJson);
  } catch (error) {
    throw new Error('Failed to parse Grok Imagine task result JSON');
  }
}

