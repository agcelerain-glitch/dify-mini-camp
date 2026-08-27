import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Supabase 無料プラン対策 Health Check
 *
 * Vercel Cron がこのエンドポイントを定期的に叩き、DB を活性化させることで
 * 7日間非アクティブによる自動停止（pause）を防ぐ。
 *
 * GET 307 対策:
 *   Supabase が起動中に返す 307 Temporary Redirect を
 *   fetch の redirect:'follow'（デフォルト）で追従し、
 *   さらに最大3回リトライすることでウォームアップ完了まで待機する。
 */

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

async function pingSupabase(url: string, key: string): Promise<{ ok: boolean; status: number }> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(`${url}/rest/v1/`, {
      method: 'GET',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      redirect: 'follow', // 307 Temporary Redirect を追従
    });

    // 200 or 404 (endpoint存在確認でも404は正常応答扱い)
    if (res.ok || res.status === 404) {
      return { ok: true, status: res.status };
    }

    // 503 / 307 などが繰り返される場合はリトライ
    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    } else {
      return { ok: false, status: res.status };
    }
  }

  return { ok: false, status: 0 };
}

export async function GET(request: NextRequest) {
  // Vercel Cron は Authorization: Bearer {CRON_SECRET} を自動付与する
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: 'Missing SUPABASE env vars' },
      { status: 500 },
    );
  }

  const { ok, status } = await pingSupabase(supabaseUrl, supabaseKey);

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
