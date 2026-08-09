import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, phaseId, content } = await request.json();

  const { data, error } = await supabase
    .from('notes')
    .update({ title: title ?? '', phase_id: phaseId ?? null, content: content ?? '', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, title, phase_id, content, updated_at')
    .single();

  if (error) return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
