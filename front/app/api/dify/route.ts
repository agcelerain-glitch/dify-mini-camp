import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    message,
    phase = 1,
    levelId = 1,
    pageId,
    interactionType = 'question',
    conversationId,
  } = body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: 'message too long (max 2000 chars)' }, { status: 400 });
  }

  // レートリミット: 1分間に30回まで
  const windowMs = 60_000;
  const maxReqs = 30;
  const nowIso = new Date().toISOString();
  const windowStart = new Date(Date.now() - windowMs).toISOString();
  const { data: rl } = await supabase
    .from('api_rate_limits')
    .select('window_start, req_count')
    .eq('user_id', user.id)
    .eq('endpoint', 'dify')
    .maybeSingle();
  if (rl && rl.window_start > windowStart) {
    if (rl.req_count >= maxReqs) {
      return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
    }
    await supabase
      .from('api_rate_limits')
      .update({ req_count: rl.req_count + 1 })
      .eq('user_id', user.id)
      .eq('endpoint', 'dify');
  } else {
    await supabase
      .from('api_rate_limits')
      .upsert({ user_id: user.id, endpoint: 'dify', window_start: nowIso, req_count: 1 });
  }

  const apiUrl = process.env.DIFY_API_BASE_URL ?? 'https://api.dify.ai/v1';
  const apiKey = process.env.DIFY_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Dify API key not configured' }, { status: 500 });
  }

  const difyRes = await fetch(`${apiUrl}/chat-messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: message,
      inputs: {
        sys_query: message,
        current_phase: String(phase),
        current_level: String(levelId),
        current_page: pageId != null ? String(pageId) : '',
        interaction_type: interactionType,
      },
      response_mode: 'blocking',
      user: user.id,
      conversation_id: conversationId ?? '',
    }),
  });

  if (!difyRes.ok) {
    const errText = await difyRes.text();
    console.error('Dify API error:', difyRes.status, errText);
    return NextResponse.json(
      { error: `Dify API returned ${difyRes.status}` },
      { status: difyRes.status },
    );
  }

  const difyData = await difyRes.json();
  console.log('Dify response keys:', Object.keys(difyData));
  console.log('Dify answer:', difyData?.answer);
  // チャットフローのレスポンスは answer フィールドに入る
  const reply = difyData?.answer ?? '';
  const newConversationId = difyData?.conversation_id ?? '';

  return NextResponse.json({ reply, conversationId: newConversationId });
}
