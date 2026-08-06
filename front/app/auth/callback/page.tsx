import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const code = typeof params.code === 'string' ? params.code : null;
  const error = typeof params.error === 'string' ? params.error : null;

  if (error) {
    redirect(`/?error=${encodeURIComponent(error)}`);
  }

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  redirect('/home');
}
