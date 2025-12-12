import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const { chatId } = params;

    if (!chatId) {
      return NextResponse.json({ error: 'Missing chatId parameter' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Supabase error (fetch messages):', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages: data ?? [] });
  } catch (error: any) {
    console.error('❌ GET /api/chats/[chatId]/messages failed:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const { chatId } = params;

    if (!chatId) {
      return NextResponse.json({ error: 'Missing chatId parameter' }, { status: 400 });
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { role, content, metadata } = body as {
      role?: 'user' | 'assistant' | 'system';
      content?: string;
      metadata?: Record<string, unknown>;
    };

    if (!role) {
      return NextResponse.json({ error: 'role is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .insert([
        {
          chat_id: chatId,
          role,
          content: content ?? null,
          metadata: metadata ?? null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error (create message):', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: data });
  } catch (error: any) {
    console.error('❌ POST /api/chats/[chatId]/messages failed:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}

