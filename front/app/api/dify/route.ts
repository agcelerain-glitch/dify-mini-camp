import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  // ログイン済みユーザーのみ許可
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { message, phase = 1, levelId = 1, interactionType = 'question' } = body;

  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  const apiUrl = process.env.DIFY_API_BASE_URL ?? 'https://api.dify.ai/v1';
  const apiKey = process.env.DIFY_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Dify API key not configured' }, { status: 500 });
  }

  const difyRes = await fetch(`${apiUrl}/workflows/run`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: {
        sys_query: message,
        current_phase: String(phase),
        current_level: String(levelId),
        interaction_type: interactionType,
      },
      response_mode: 'blocking',
      user: user.id,
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
  const outputs = difyData?.data?.outputs ?? {};
  // Difyワークフローの出力変数名に合わせてフォールバック
  const reply =
    outputs.text ?? outputs.answer ?? outputs.output ?? outputs.result ?? '';

  return NextResponse.json({ reply });
}
