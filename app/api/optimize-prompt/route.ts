import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const IMAGE_STYLE_INSTRUCTIONS: Record<string, string> = {
  normal: `Enhance the prompt for high-quality AI image generation. Focus on:
- Adding specific visual details (colors, textures, materials)
- Describing lighting and atmosphere
- Improving composition and framing
- Adding quality indicators (4K, high resolution, sharp detail)
Do NOT change the subject or add new elements. Just describe the original subject more beautifully.`,

  realistic: `Enhance the prompt for photorealistic AI image generation. Focus on:
- Photorealistic rendering, hyperrealistic details
- Natural lighting, real-world physics
- Lifelike textures and materials
- Professional photography style (DSLR, 85mm lens, shallow depth of field)
- 8K resolution, ultra detailed, ray tracing
Do NOT change the subject. Make it look like a real photograph.`,

  ghibli: `Enhance the prompt for Studio Ghibli anime style image generation. Focus on:
- Soft, dreamlike watercolor aesthetics
- Warm, nostalgic color palette
- Whimsical and magical atmosphere
- Hand-painted background feel
- Hayao Miyazaki / Studio Ghibli art style
- Gentle lighting, pastoral scenes
Do NOT change the subject. Transform it into Ghibli's magical anime world.`,

  drawn: `Enhance the prompt for hand-drawn illustration style image generation. Focus on:
- Traditional illustration techniques
- Pencil sketch, ink drawing, or watercolor feel
- Artistic linework and crosshatching
- Illustration book quality
- Hand-crafted artistic style
Do NOT change the subject. Make it look like a beautiful hand-drawn illustration.`,

  anime: `Enhance the prompt for modern anime style image generation. Focus on:
- Clean anime art style, cel-shaded
- Vibrant colors, dynamic poses
- Expressive features, large detailed eyes
- High-quality anime production value
- Japanese animation aesthetic
Do NOT change the subject. Transform it into beautiful anime art.`,

  cinematic: `Enhance the prompt for cinematic film style image generation. Focus on:
- Movie still, cinematic composition
- Dramatic lighting, lens flares
- Film grain, anamorphic lens
- Hollywood blockbuster quality
- Epic scale and atmosphere
Do NOT change the subject. Make it look like a frame from a major film.`,

  '3d': `Enhance the prompt for 3D rendered style image generation. Focus on:
- 3D render, Octane render, Blender
- Volumetric lighting, subsurface scattering
- Detailed textures and materials
- Modern CGI quality
- Clean 3D aesthetic
Do NOT change the subject. Make it a high-quality 3D render.`,
};

const VIDEO_STYLE_INSTRUCTIONS: Record<string, string> = {
  normal: `Enhance the prompt for high-quality AI video generation. Focus on:
- Describing what happens in the video (actions, events, story progression)
- Motion and movement of subjects (how things move, not how they look)
- Camera movement and perspective (slow pan, tracking shot, dolly, crane, drone)
- Temporal flow and pacing (how events unfold over time)
- Scene transitions and changes
Do NOT focus on visual appearance details. Focus on WHAT happens and HOW things move. The style will handle the visual aesthetic.`,

  realistic: `Enhance the prompt for photorealistic AI video generation. Focus on:
- Real-world physics and natural motion (realistic movement, gravity, momentum)
- Documentary-style camera work (steady shots, natural camera movement)
- Realistic timing and pacing (natural speed, realistic transitions)
- Real-world actions and behaviors
Do NOT focus on colors or textures. Focus on realistic motion, physics, and what actually happens in the scene.`,

  ghibli: `Enhance the prompt for Studio Ghibli anime style video generation. Focus on:
- Gentle, flowing motion (soft movement, organic transitions)
- Magical or whimsical actions (floating, drifting, ethereal movement)
- Smooth camera movement (gentle pans, floating camera, pastoral tracking)
- Dreamlike pacing and rhythm
- Natural, organic motion patterns
Do NOT focus on visual style details. Focus on Ghibli's characteristic gentle, magical motion and camera work.`,

  drawn: `Enhance the prompt for hand-drawn animation style video generation. Focus on:
- Frame-by-frame animation feel (traditional animation motion)
- Hand-crafted movement patterns
- Artistic motion transitions
- Illustration-style action and movement
Do NOT focus on visual appearance. Focus on the motion style typical of hand-drawn animation.`,

  anime: `Enhance the prompt for modern anime style video generation. Focus on:
- Dynamic action and motion (energetic movement, fast-paced action)
- Expressive character movement and gestures
- Dramatic camera angles and movement (dynamic tracking, action shots)
- Snappy pacing and quick transitions
- Anime-style motion patterns and timing
Do NOT focus on visual style. Focus on dynamic motion, action, and energetic camera work typical of anime.`,

  cinematic: `Enhance the prompt for cinematic film style video generation. Focus on:
- Epic camera movements (sweeping shots, dramatic tracking, crane movements)
- Film-style pacing and timing (cinematic rhythm, dramatic pauses)
- Story-driven motion and action
- Professional cinematography techniques (dolly moves, push-ins, pull-outs)
- Dramatic scene progression and transitions
Do NOT focus on visual appearance. Focus on cinematic camera work, motion, and dramatic pacing.`,

  '3d': `Enhance the prompt for 3D rendered style video generation. Focus on:
- Smooth 3D camera movement (orbital shots, 3D navigation, volumetric motion)
- CGI-style motion and animation (precise movement, perfect physics)
- 3D animation timing and pacing
- Computer-generated action and movement patterns
Do NOT focus on visual rendering details. Focus on 3D camera movement and CGI-style motion.`,
};

const BASE_SYSTEM_PROMPT_IMAGE = `You are an expert AI prompt engineer. Your job is to take a simple prompt and enhance it for better AI image generation.

CRITICAL RULES:
1. Keep the EXACT same subject - if they say "a cat", the output is still about a cat
2. Do NOT add new objects, characters, or change the scene unless describing the environment
3. Add rich visual details that describe HOW the subject looks
4. Make the prompt more vivid and detailed, not longer for the sake of length
5. Output ONLY the enhanced prompt - no explanations, no quotes, no prefixes
6. Keep it under 150 words

Example:
Input: "a cat"
Output: "A fluffy orange tabby cat with bright green eyes, soft fur catching warm sunlight, sitting gracefully on a velvet cushion, peaceful expression, detailed whiskers, 4K resolution, sharp focus"

The output should paint a picture of the SAME subject, just described more beautifully.`;

const BASE_SYSTEM_PROMPT_VIDEO = `You are an expert AI prompt engineer. Your job is to take a simple prompt and enhance it for better AI video generation.

CRITICAL RULES:
1. Keep the EXACT same subject and core action - if they say "a cat walking", the output is still about a cat walking
2. Focus on WHAT happens in the video (actions, events, story) and HOW things move
3. Describe motion, camera movement, pacing, and temporal flow
4. Do NOT focus on visual appearance details (colors, textures, lighting style) - the style handles that
5. Output ONLY the enhanced prompt - no explanations, no quotes, no prefixes
6. Keep it under 150 words

Example:
Input: "a cat walking"
Output: "A cat walking gracefully across a garden path, slow tracking shot following its movement, gentle tail swaying with each step, camera slowly panning to reveal the surroundings, smooth steady motion, natural pacing"

The output should describe the SAME action with better video cinematography and motion details, NOT visual appearance.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, type = 'image', style = 'normal' } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (prompt.length > 2000) {
      return NextResponse.json(
        { error: 'Prompt too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    const styleInstructions = type === 'video' 
      ? VIDEO_STYLE_INSTRUCTIONS[style] || VIDEO_STYLE_INSTRUCTIONS.normal
      : IMAGE_STYLE_INSTRUCTIONS[style] || IMAGE_STYLE_INSTRUCTIONS.normal;
    
    const basePrompt = type === 'video' ? BASE_SYSTEM_PROMPT_VIDEO : BASE_SYSTEM_PROMPT_IMAGE;
    const systemPrompt = `${basePrompt}\n\n${styleInstructions}`;

    let optimizedPrompt: string;

    if (process.env.OPENAI_API_KEY) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: 300,
          temperature: 0.7,
        });

        optimizedPrompt = completion.choices[0]?.message?.content?.trim() || prompt;
        
        // Clean up any quotes or prefixes the model might add
        optimizedPrompt = optimizedPrompt.replace(/^["']|["']$/g, '');
        optimizedPrompt = optimizedPrompt.replace(/^(Enhanced prompt:|Output:|Result:)/i, '').trim();
        
      } catch (openaiError) {
        console.error('OpenAI error:', openaiError);
        optimizedPrompt = localEnhance(prompt, style, type);
      }
    } else {
      optimizedPrompt = localEnhance(prompt, style, type);
    }

    return NextResponse.json({
      success: true,
      optimizedPrompt,
      originalPrompt: prompt,
      type,
      style,
    });
  } catch (error: any) {
    console.error('Prompt optimization error:', error);
    return NextResponse.json(
      { error: 'Failed to optimize prompt' },
      { status: 500 }
    );
  }
}

// Fallback local enhancement
function localEnhance(prompt: string, style: string, type: string): string {
  const cleanPrompt = prompt.trim();
  
  const imageStyles: Record<string, string> = {
    normal: '4K resolution, highly detailed, sharp focus, beautiful lighting, professional quality',
    realistic: 'photorealistic, hyperrealistic, 8K resolution, DSLR photography, natural lighting, ultra detailed',
    ghibli: 'Studio Ghibli style, Hayao Miyazaki aesthetic, soft watercolor, dreamy atmosphere, warm colors, magical',
    drawn: 'hand-drawn illustration, artistic linework, traditional art style, detailed sketch, illustration book quality',
    anime: 'anime art style, vibrant colors, cel-shaded, high-quality anime, Japanese animation aesthetic',
    cinematic: 'cinematic, movie still, dramatic lighting, film grain, Hollywood blockbuster quality, epic atmosphere',
    '3d': '3D render, Octane render, volumetric lighting, CGI quality, detailed textures, Blender render',
  };

  const videoStyles: Record<string, string> = {
    normal: 'smooth camera movement, cinematic pacing, steady tracking shot, professional videography',
    realistic: 'natural camera movement, realistic motion, documentary-style cinematography, real-world physics',
    ghibli: 'gentle camera pan, flowing motion, soft movement, magical pacing, Studio Ghibli animation style',
    drawn: 'hand-drawn animation motion, traditional animation pacing, frame-by-frame animation feel',
    anime: 'dynamic camera movement, energetic motion, fast-paced action, anime-style cinematography',
    cinematic: 'epic tracking shot, dramatic camera movement, cinematic pacing, film-style cinematography',
    '3d': 'smooth 3D camera movement, orbital shot, CGI motion, 3D animation pacing',
  };

  const addition = type === 'video' 
    ? (videoStyles[style] || videoStyles.normal)
    : (imageStyles[style] || imageStyles.normal);
  
  return `${cleanPrompt}, ${addition}`;
}
