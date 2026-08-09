import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('notes')
    .select('id, title, phase_id, content, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, phaseId, content } = await request.json();

  const { data, error } = await supabase
    .from('notes')
    .insert({ user_id: user.id, title: title ?? '', phase_id: phaseId ?? null, content: content ?? '' })
    .select('id, title, phase_id, content, updated_at')
    .single();

  if (error) return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  return NextResponse.json(data);
}
