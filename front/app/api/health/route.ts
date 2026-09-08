import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

// Supabase API ゲートウェイ（Kong）はすべてのパスに apikey を要求するため付与する
// /auth/v1/health は認証サービス正常性の確認
async function pingSupabaseAuth(url: string, key: string): Promise<{ ok: boolean; status: number }> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${url}/auth/v1/health`, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          apikey: key,
          'Cache-Control': 'no-cache',
        },
      });

      if (res.ok) return { ok: true, status: res.status };

      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      } else {
        return { ok: false, status: res.status };
      }
    } catch {
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }
  }
  return { ok: false, status: 0 };
}

// PostgREST ルートエンドポイントをクエリしてDBアクティビティを記録する
// /rest/v1/ は apikey のみで常にアクセス可能（RLS非依存）
async function pingSupabaseDB(url: string, key: string): Promise<{ ok: boolean; status: number }> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${url}/rest/v1/`, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Cache-Control': 'no-cache',
        },
      });

      if (res.ok) return { ok: true, status: res.status };

      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      } else {
        return { ok: false, status: res.status };
      }
    } catch {
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }
  }
  return { ok: false, status: 0 };
}

// SERVICE_ROLE_KEY が設定されている場合は実テーブルへのクエリも実施する
async function pingSupabaseTable(url: string, serviceKey: string): Promise<{ ok: boolean; status: number }> {
  try {
    const res = await fetch(`${url}/rest/v1/users?select=id&limit=1`, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Cache-Control': 'no-cache',
        Prefer: 'count=none',
      },
    });
    return { ok: res.ok || res.status === 406, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  // CRON_SECRET が未設定の場合は警告のみ（Supabase ping は続行）
  if (!cronSecret) {
    console.warn('[health] CRON_SECRET is not set — skipping auth check and proceeding with ping');
  } else {
    // Vercel Cron は "Authorization: Bearer {CRON_SECRET}" を自動付与する
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[health] Missing SUPABASE env vars');
    return NextResponse.json({ error: 'Missing SUPABASE env vars' }, { status: 500 });
  }

  const timestamp = new Date().toISOString();

  // 複数エンドポイントを並列にping → いずれかが成功すればアクティビティ記録
  const [authResult, dbResult] = await Promise.all([
    pingSupabaseAuth(supabaseUrl, supabaseKey),
    pingSupabaseDB(supabaseUrl, supabaseKey),
  ]);

  // SERVICE_ROLE_KEY があれば実テーブルクエリも実施
  let tableResult: { ok: boolean; status: number } | null = null;
  if (serviceKey) {
    tableResult = await pingSupabaseTable(supabaseUrl, serviceKey);
    console.log(`[health] Table ping: HTTP ${tableResult.status}`);
  }

  console.log(`[health] Auth ping: HTTP ${authResult.status}, DB ping: HTTP ${dbResult.status}`);

  const anyOk = authResult.ok || dbResult.ok || tableResult?.ok;

  if (!anyOk) {
    console.error(`[health] All Supabase pings failed — auth:${authResult.status} db:${dbResult.status}`);
    return NextResponse.json(
      {
        status: 'unhealthy',
        auth: authResult.status,
        db: dbResult.status,
        table: tableResult?.status ?? null,
        timestamp,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    status: 'ok',
    auth: authResult.status,
    db: dbResult.status,
    table: tableResult?.status ?? null,
    timestamp,
  });
}
