'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { detectBrowser, getLineExternalUrl, type BrowserEnv } from '@/lib/browser-detect';

const PHASE_BADGES = [
  { label: 'Phase 1', sub: 'LLM基本', color: 'text-emerald-400' },
  { label: 'Phase 2', sub: '変数設計', color: 'text-blue-400' },
  { label: 'Phase 3', sub: '条件分岐', color: 'text-violet-400' },
  { label: 'Phase 4', sub: 'RAG構築', color: 'text-orange-400' },
  { label: 'Phase 5', sub: '本番設計', color: 'text-rose-400' },
];

export default function LandingPage() {
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

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-violet-600/15 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-[300px] w-[300px] rounded-full bg-blue-600/15 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-4 py-16">
        <div className="mb-6 flex items-center gap-3">
          <span className="text-5xl">⛺</span>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Dify mini Camp
            </h1>
            <p className="mt-1 text-base text-indigo-400">
              AIワークフローを、AIと一緒に学ぶ
            </p>
          </div>
        </div>

        <p className="mb-12 max-w-xl text-center text-lg text-slate-400">
          Difyの学習をDifyを使って行う——AIメンター付きの5段階実践プログラム。
          <br className="hidden sm:block" />
          初心者でも1時間でAIアプリが動く感動を体験できます。
        </p>

        <div className="mb-12 flex flex-wrap justify-center gap-3">
          {PHASE_BADGES.map((phase) => (
            <div
              key={phase.label}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center"
            >
              <p className={`text-sm font-semibold ${phase.color}`}>{phase.label}</p>
              <p className="text-xs text-slate-500">{phase.sub}</p>
            </div>
          ))}
        </div>

        <div className="w-full max-w-sm space-y-3">
          {/* LINEアプリ内ブラウザ警告 */}
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

          {/* その他のアプリ内ブラウザ（Instagram等） */}
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

          {/* 通常のログインボタン（アプリ内ブラウザ以外、またはLINE以外） */}
          {(!browserEnv?.isLine) && (
            <Button
              onClick={signIn}
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
              Googleでログイン
            </Button>
          )}

          {/* ブラウザ情報（開発・デバッグ用表示は本番では非表示） */}
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

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: '🎯',
              title: '5フェーズ構成',
              desc: '初級〜上級まで段階的に学べるカリキュラム',
            },
            {
              icon: '🤖',
              title: 'AIメンター付き',
              desc: '質問・課題採点をAIがリアルタイムにサポート',
            },
            {
              icon: '⚡',
              title: 'ハンズオン重視',
              desc: '実際にDifyを操作しながら学ぶ実践型プログラム',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center"
            >
              <p className="mb-2 text-3xl">{item.icon}</p>
              <p className="mb-1 font-semibold text-white">{item.title}</p>
              <p className="text-sm text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
