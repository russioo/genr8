import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json({ error: 'Missing wallet parameter' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('chats')
      .select('*')
      .eq('owner_wallet', wallet)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error (fetch chats):', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ chats: data ?? [] });
  } catch (error: any) {
    console.error('❌ GET /api/chats failed:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { wallet, title } = body as { wallet?: string; title?: string };

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('chats')
      .insert([
        {
          owner_wallet: wallet,
          title: title?.trim() || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error (create chat):', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ chat: data });
  } catch (error: any) {
    console.error('❌ POST /api/chats failed:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { id, title } = body as { id?: string; title?: string | null };

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('chats')
      .update({ title: title?.trim() || null })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error (update chat):', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ chat: data });
  } catch (error: any) {
    console.error('❌ PATCH /api/chats failed:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const wallet = searchParams.get('wallet');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    if (!wallet) {
      return NextResponse.json({ error: 'wallet is required' }, { status: 400 });
    }

    const { error: ownershipError, data: chatRecord } = await supabaseAdmin
      .from('chats')
      .select('id, owner_wallet')
      .eq('id', id)
      .single();

    if (ownershipError) {
      console.error('❌ Supabase error (lookup chat before delete):', ownershipError);
      return NextResponse.json({ error: ownershipError.message }, { status: 500 });
    }

    if (!chatRecord) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (chatRecord.owner_wallet !== wallet) {
      return NextResponse.json({ error: 'Not authorized to delete this chat' }, { status: 403 });
    }

    console.log('✅ About to delete messages for chat_id:', id);

    const { error: messagesError } = await supabaseAdmin
      .from('chat_messages')
      .delete()
      .eq('chat_id', id);

    if (messagesError) {
      console.error('❌ Supabase error (delete chat messages):', messagesError);
      console.error('❌ Messages error details:', JSON.stringify(messagesError));
    }

    console.log('✅ About to delete chat with id:', id);

    const { error: chatError, data: deletedChats } = await supabaseAdmin
      .from('chats')
      .delete()
      .eq('id', id)
      .select('id, owner_wallet');

    console.log('🔍 Delete result:', { error: chatError, deletedChats });

    if (chatError) {
      console.error('❌ Supabase error (delete chat):', chatError);
      console.error('❌ Chat error details:', JSON.stringify(chatError));
      return NextResponse.json({ error: chatError.message }, { status: 500 });
    }

    if (!deletedChats || deletedChats.length === 0) {
      console.warn('⚠️  Chat delete returned zero rows (treated as success)', { id, wallet });
      return NextResponse.json({ success: true, deletedChatId: id, alreadyDeleted: true });
    }

    const deleted = deletedChats[0];
    if (deleted.owner_wallet !== wallet) {
      console.warn('⚠️  Deleted chat owner mismatch', { id, wallet, owner: deleted.owner_wallet });
    }

    return NextResponse.json({ success: true, deletedChatId: id });
  } catch (error: any) {
    console.error('❌ DELETE /api/chats failed:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}

