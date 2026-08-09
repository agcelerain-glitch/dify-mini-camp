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
  const { subject, content } = body;

  if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
    return NextResponse.json({ error: 'subject is required' }, { status: 400 });
  }
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  // Supabase に保存
  const { error: dbError } = await supabase.from('bug_reports').insert({
    user_id: user.id,
    subject: subject.trim(),
    content: content.trim(),
  });

  if (dbError) {
    console.error('Bug report DB error:', dbError);
    return NextResponse.json({ error: 'Failed to save bug report' }, { status: 500 });
  }

  // Discord Webhook 通知
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [
            {
              title: '🐛 バグ報告',
              color: 0xe74c3c,
              fields: [
                { name: '件名', value: subject.trim(), inline: false },
                { name: '内容', value: content.trim(), inline: false },
                { name: 'ユーザーID', value: user.id, inline: true },
                { name: 'メール', value: user.email ?? '(不明)', inline: true },
              ],
              timestamp: new Date().toISOString(),
              footer: { text: 'Dify mini Camp' },
            },
          ],
        }),
      });
    } catch (e) {
      // Discord 通知失敗でも DB 保存は成功扱いにする
      console.error('Discord webhook error:', e);
    }
  }

  return NextResponse.json({ ok: true });
}
