'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

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
  const [name, setName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/home');
    }
  }, [user, isLoading, router]);

  function handleGuestLogin() {
    if (showNameInput) {
      signIn(name.trim() || 'テストユーザー');
      router.push('/home');
    } else {
      setShowNameInput(true);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

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
          {showNameInput && (
            <div className="space-y-2">
              <label className="text-sm text-slate-400">表示名（任意）</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGuestLogin()}
                placeholder="例: Taro Yamada"
                maxLength={30}
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                autoFocus
              />
            </div>
          )}

          <Button
            onClick={handleGuestLogin}
            className="w-full bg-indigo-600 py-3 text-base font-semibold hover:bg-indigo-500"
          >
            {showNameInput ? '学習を始める →' : 'テストモードで体験する'}
          </Button>

          <button className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/5 py-3 text-sm text-slate-500">
            Googleでログイン（Supabase連携後に有効化）
          </button>
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
