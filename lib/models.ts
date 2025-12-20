import { ModelInfo } from '@/types';

export const imageModels: ModelInfo[] = [
  {
    id: 'gpt-image-1',
    name: '4o Image',
    provider: 'OpenAI',
    description: 'High quality images with excellent prompt understanding',
    price: parseFloat(process.env.PRICE_IMAGE_GPT || '0.042'),
    type: 'image',
  },
  {
    id: 'ideogram',
    name: 'Ideogram V3',
    provider: 'Ideogram',
    description: 'Creative images with diverse art styles and text rendering',
    price: parseFloat(process.env.PRICE_IMAGE_IDEOGRAM || '0.066'),
    type: 'image',
  },
  {
    id: 'qwen',
    name: 'Qwen',
    provider: 'Alibaba Cloud',
    description: 'High-quality images with flexible control and fast generation',
    price: parseFloat(process.env.PRICE_IMAGE_QWEN || '0.03'),
    type: 'image',
  },
  {
    id: 'nano-banan-pro',
    name: 'Nano Banan Pro',
    provider: 'Nano',
    description: 'Advanced image generation with high quality output and flexible aspect ratios',
    price: parseFloat(process.env.PRICE_IMAGE_NANO || '0.30'),
    type: 'image',
  },
];

export const videoModels: ModelInfo[] = [
  {
    id: 'sora-2',
    name: 'Sora 2',
    provider: 'OpenAI',
    description: 'Professional quality videos with realistic motion',
    price: parseFloat(process.env.PRICE_VIDEO_SORA_2 || '0.21'),
    type: 'video',
  },
  {
    id: 'veo-3.1',
    name: 'Veo 3.1',
    provider: 'Google',
    description: 'High-quality videos with text or image input support',
    price: 0.360, // Hardcoded to override incorrect env variable
    type: 'video',
  },
  {
    id: 'grok-imagine',
    name: 'Grok Pro Imagine Video',
    provider: 'xAI',
    description: 'Image-to-video generation with motion control',
    price: parseFloat(process.env.PRICE_VIDEO_GROK || '0.25'),
    type: 'video',
  },
  {
    id: 'sora-2-pro',
    name: 'Sora 2 Pro',
    provider: 'OpenAI',
    description: 'Premium video generation with enhanced quality',
    price: parseFloat(process.env.PRICE_VIDEO_SORA_2_PRO || '0.35'),
    type: 'video',
    comingSoon: true,
  },
];

// Log model prices on initialization
if (typeof window === 'undefined') {
  console.log('📊 Model Prices Initialized:');
  [...imageModels, ...videoModels].forEach(model => {
    console.log(`  - ${model.name}: $${model.price.toFixed(3)} USD`);
  });
}

export function getModelById(modelId: string): ModelInfo | undefined {
  return [...imageModels, ...videoModels].find(m => m.id === modelId);
}

