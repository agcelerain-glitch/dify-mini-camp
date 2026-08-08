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
  const { rating, comment, phaseId, levelId, pageId } = body;

  if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'rating must be 1–5' }, { status: 400 });
  }

  const { error } = await supabase.from('feedback').insert({
    user_id: user.id,
    phase_id: phaseId ?? null,
    level_id: levelId ?? null,
    page_id: pageId ?? null,
    rating,
    comment: comment ?? null,
  });

  if (error) {
    console.error('Feedback insert error:', error);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
