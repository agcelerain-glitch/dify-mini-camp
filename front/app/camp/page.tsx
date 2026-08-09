'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProgress } from '@/contexts/ProgressContext';
import { PHASES, getPhase, getLevel } from '@/lib/phases-data';
import { Navbar } from '@/components/Navbar';
import { ChatbotButton } from '@/components/ChatbotButton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

type Tab = 'roadmap' | 'favorites';

export default function CampPage() {
  const { user, isLoading } = useAuth();
  const { isPhaseUnlocked, isLevelUnlocked, isPageCleared, progress, favorites } = useProgress();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('roadmap');

  useEffect(() => {
    if (!isLoading && !user) router.replace('/');
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  function getPhaseProgress(phaseId: number): number {
    const phase = PHASES.find((p) => p.id === phaseId);
    if (!phase) return 0;
    let total = 0;
    let cleared = 0;
    for (const level of phase.levels) {
      for (const page of level.pages) {
        total++;
        if (isPageCleared(phaseId, level.id, page.id)) cleared++;
      }
    }
    return total === 0 ? 0 : Math.round((cleared / total) * 100);
  }

  function levelHasFavorite(phaseId: number, levelId: number): boolean {
    return favorites.some((f) => f.phaseId === phaseId && f.levelId === levelId);
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">⛺ キャンプ</h1>
            <p className="mt-1 text-slate-400">フェーズとレベルを順番にクリアしながら進みましょう。</p>
          </div>
        </div>

        {/* タブ */}
        <div className="mb-6 flex gap-1 rounded-xl border border-white/10 bg-slate-900 p-1">
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              activeTab === 'roadmap'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ロードマップ
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`relative flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              activeTab === 'favorites'
                ? 'bg-yellow-500 text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ★ お気に入り
            {favorites.length > 0 && activeTab !== 'favorites' && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500 text-[10px] font-bold text-slate-900">
                {favorites.length}
              </span>
            )}
          </button>
        </div>

        {/* ロードマップタブ */}
        {activeTab === 'roadmap' && (
          <div className="space-y-6">
            {PHASES.map((phase) => {
              const unlocked = isPhaseUnlocked(phase.id);
              const isCurrent = phase.id === progress.currentPhase;
              const pct = getPhaseProgress(phase.id);
              const currentLevel = progress.phases[phase.id]?.currentLevel ?? 1;

              return (
                <div
                  key={phase.id}
                  className={`rounded-2xl border ${unlocked ? phase.borderColor : 'border-white/5'} bg-slate-900 ${isCurrent ? 'ring-1 ring-indigo-500/30' : ''} ${!unlocked ? 'opacity-60' : ''}`}
                >
                  {isCurrent && (
                    <div className="flex items-center gap-1 rounded-t-2xl border-b border-white/10 bg-indigo-600/10 px-5 py-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                      <span className="text-xs text-indigo-400">現在学習中</span>
                    </div>
                  )}
                  {!unlocked && (
                    <div className="flex items-center gap-1 rounded-t-2xl border-b border-white/5 bg-slate-800/50 px-5 py-2">
                      <span className="text-xs">🔒</span>
                      <span className="text-xs text-slate-500">前のフェーズをクリアすると解放されます</span>
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex flex-wrap items-start gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-2xl ${!unlocked ? 'grayscale' : ''}`}>
                        {!unlocked ? '🔒' : pct === 100 ? '✅' : phase.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-500">{phase.subtitle}</span>
                          <Badge className={`text-xs ${unlocked ? phase.badgeBg : 'bg-slate-700 text-slate-500'}`}>{phase.difficultyLabel}</Badge>
                          <span className="text-xs text-slate-500">⏱ {phase.duration}</span>
                        </div>
                        <h3 className={`text-lg font-bold ${unlocked ? 'text-white' : 'text-slate-500'}`}>{phase.title}</h3>
                        <p className="mt-0.5 text-sm text-slate-400">{phase.description}</p>

                        {unlocked && (
                          <>
                            <div className="mt-3">
                              <div className="mb-1 flex justify-between text-xs text-slate-500">
                                <span>Level進捗</span>
                                <span>{pct}%</span>
                              </div>
                              <Progress value={pct} className="h-1.5 bg-slate-700" />
                            </div>

                            {/* レベル一覧 */}
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              {phase.levels.map((level) => {
                                const lUnlocked = isLevelUnlocked(phase.id, level.id);
                                const lCurrent = level.id === currentLevel && isCurrent;
                                const levelClearedPages =
                                  progress.phases[phase.id]?.levels[level.id]?.clearedPages ?? [];
                                const clearedPageCount = level.pages.filter((p) =>
                                  levelClearedPages.includes(p.id),
                                ).length;
                                const levelPct = Math.round((clearedPageCount / level.pages.length) * 100);
                                const hasFav = levelHasFavorite(phase.id, level.id);

                                return lUnlocked ? (
                                  <Link
                                    key={level.id}
                                    href={`/camp/${phase.id}?level=${level.id}`}
                                    className={`rounded-xl border p-3 transition-colors hover:bg-slate-800 ${
                                      levelPct === 100
                                        ? 'border-emerald-500/30 bg-emerald-500/5'
                                        : lCurrent
                                        ? `${phase.borderColor} bg-slate-800/50`
                                        : 'border-white/5 bg-slate-800/30'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs font-bold ${lCurrent ? phase.textColor : 'text-slate-500'}`}>
                                        Level {level.id}
                                      </span>
                                      {levelPct === 100 && <span className="text-xs">✅</span>}
                                      {hasFav && (
                                        <Star size={12} className="ml-auto fill-yellow-400 text-yellow-400" />
                                      )}
                                    </div>
                                    <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">{level.title}</p>
                                    <div className="mt-2">
                                      <div className="mb-0.5 flex justify-between text-xs text-slate-600">
                                        <span>{level.pages.length}ページ</span>
                                        <span>{levelPct}%</span>
                                      </div>
                                      <Progress value={levelPct} className="h-0.5 bg-slate-700" />
                                    </div>
                                  </Link>
                                ) : (
                                  <div
                                    key={level.id}
                                    className="rounded-xl border border-white/5 bg-slate-800/20 p-3 opacity-50"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs">🔒</span>
                                      <span className="text-xs font-bold text-slate-600">Level {level.id}</span>
                                    </div>
                                    <p className="mt-0.5 text-xs text-slate-600 line-clamp-1">{level.title}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="shrink-0">
                        {unlocked ? (
                          <Link href={`/camp/${phase.id}`}>
                            <Button
                              className={
                                pct === 100
                                  ? 'bg-slate-700 hover:bg-slate-600'
                                  : 'bg-indigo-600 hover:bg-indigo-500'
                              }
                            >
                              {pct === 100 ? '復習する' : isCurrent ? '続ける →' : '始める →'}
                            </Button>
                          </Link>
                        ) : (
                          <Button disabled className="bg-slate-800 text-slate-600 cursor-not-allowed">
                            🔒 ロック中
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* お気に入りタブ */}
        {activeTab === 'favorites' && (
          <FavoritesTab favorites={favorites} />
        )}
      </main>

      <ChatbotButton />
    </div>
  );
}

function FavoritesTab({ favorites }: { favorites: { phaseId: number; levelId: number; pageId: number }[] }) {
  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-900 py-16 text-center">
        <Star size={40} className="mb-4 text-slate-600" />
        <p className="text-slate-400">お気に入りはまだありません</p>
        <p className="mt-1 text-xs text-slate-600">ページ右上の ★ をクリックして追加しましょう</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {favorites.map((fav) => {
        const phase = getPhase(fav.phaseId);
        const level = getLevel(fav.phaseId, fav.levelId);
        const page = level?.pages.find((p) => p.id === fav.pageId);
        if (!phase || !level || !page) return null;

        const levelIndex = phase.levels.findIndex((l) => l.id === fav.levelId);
        const pageIndex = level.pages.findIndex((p) => p.id === fav.pageId);

        return (
          <Link
            key={`${fav.phaseId}-${fav.levelId}-${fav.pageId}`}
            href={`/camp/${fav.phaseId}?level=${fav.levelId}&page=${fav.pageId}`}
            className="flex items-center gap-4 rounded-xl border border-white/10 bg-slate-900 p-4 transition-colors hover:bg-slate-800"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xl`}>
              {phase.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <Badge className={`text-xs ${phase.badgeBg}`}>{phase.subtitle}</Badge>
                <span>Level {levelIndex + 1}</span>
                <span>/</span>
                <span>ページ {pageIndex + 1}</span>
                <span className="ml-auto">
                  {page.type === 'input' ? '📖 インプット' : '✏️ アウトプット'}
                </span>
              </div>
              <p className="mt-1 truncate text-sm font-medium text-white">{page.title}</p>
              <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{level.title}</p>
            </div>
            <span className="shrink-0 text-xs text-slate-500">→</span>
          </Link>
        );
      })}
    </div>
  );
}
