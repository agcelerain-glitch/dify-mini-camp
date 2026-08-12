'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { detectBrowser, getLineExternalUrl, type BrowserEnv } from '@/lib/browser-detect';

export function LandingClient() {
  const { user, isLoading, signIn } = useAuth();
  const router = useRouter();
  const [browserEnv, setBrowserEnv] = useState<BrowserEnv | null>(null);

  useEffect(() => {
    setBrowserEnv(detectBrowser());
  }, []);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/home');
    }
  }, [user, isLoading, router]);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="w-full max-w-sm space-y-3">
      {browserEnv?.isLine && (
        <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-center">
          <p className="mb-1 text-sm font-semibold text-yellow-300">
            ⚠️ LINEブラウザではログインできません
          </p>
          <p className="mb-3 text-xs text-yellow-200/80">
            Googleログインを使用するため、外部ブラウザで開く必要があります。
          </p>
          <Button
            onClick={() => {
              window.location.href = getLineExternalUrl(currentUrl);
            }}
            className="w-full bg-yellow-500 text-sm font-semibold text-slate-900 hover:bg-yellow-400"
          >
            外部ブラウザで開く
          </Button>
        </div>
      )}

      {browserEnv && !browserEnv.isLine && browserEnv.isInAppBrowser && (
        <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-center">
          <p className="mb-1 text-sm font-semibold text-yellow-300">
            ⚠️ このブラウザではログインできない場合があります
          </p>
          <p className="text-xs text-yellow-200/80">
            Chrome・Edge・Safariなど標準ブラウザでアクセスしてください。
            <br />
            URL: <span className="font-mono text-yellow-300">{currentUrl}</span>
          </p>
        </div>
      )}

      {!browserEnv?.isLine && (
        <Button
          onClick={signIn}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-3 bg-white py-6 text-base font-semibold text-slate-900 hover:bg-slate-100"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isLoading ? '読み込み中...' : 'Googleでログイン'}
        </Button>
      )}

      {process.env.NODE_ENV === 'development' && browserEnv && (
        <p className="text-center text-xs text-slate-600">
          {[
            browserEnv.isLine && 'LINE',
            browserEnv.isInstagram && 'Instagram',
            browserEnv.isFacebook && 'Facebook',
            browserEnv.isEdge && 'Edge',
            browserEnv.isChrome && 'Chrome',
            browserEnv.isSafari && 'Safari',
            browserEnv.isFirefox && 'Firefox',
            browserEnv.isMobile && 'Mobile',
          ]
            .filter(Boolean)
            .join(', ') || 'Unknown browser'}
        </p>
      )}
    </div>
  );
}
