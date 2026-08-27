import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

/**
 * Supabase の公式ヘルスエンドポイント /auth/v1/health を叩く。
 * - 認証不要で必ず 200 を返す（DB が停止中なら 503/307 になる）
 * - /rest/v1/ は anon key でも 401 を返すケースがあるため使わない
 * - 307 Temporary Redirect 対策: redirect:'follow' + リトライ
 */
async function pingSupabase(url: string): Promise<{ ok: boolean; status: number }> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(`${url}/auth/v1/health`, {
      method: 'GET',
      redirect: 'follow', // 307 Temporary Redirect を追従
      // Cache-Control を無効化してキャッシュヒットを防ぐ
      headers: { 'Cache-Control': 'no-cache' },
    });

    if (res.ok) {
      return { ok: true, status: res.status };
    }

    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    } else {
      return { ok: false, status: res.status };
    }
  }

  return { ok: false, status: 0 };
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  // CRON_SECRET 未設定はサーバー設定ミス
  if (!cronSecret) {
    console.error('[health] CRON_SECRET is not set');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  // Vercel Cron は "Authorization: Bearer {CRON_SECRET}" を自動付与する
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return NextResponse.json({ error: 'Missing SUPABASE env vars' }, { status: 500 });
  }

  const { ok, status } = await pingSupabase(supabaseUrl);

  if (!ok) {
    console.error(`[health] Supabase ping failed: HTTP ${status}`);
    return NextResponse.json(
      { status: 'unhealthy', supabaseStatus: status, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }

  console.log(`[health] Supabase ping OK (HTTP ${status})`);
  return NextResponse.json({
    status: 'ok',
    supabaseStatus: status,
    timestamp: new Date().toISOString(),
  });
}
