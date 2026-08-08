'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useProgress } from '@/contexts/ProgressContext';
import { PHASES } from '@/lib/phases-data';
import { Navbar } from '@/components/Navbar';
import { ChatbotButton } from '@/components/ChatbotButton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

export default function CampPage() {
  const { user, isLoading } = useAuth();
  const { isPhaseCleared, isLevelCleared, isPhaseUnlocked, isLevelUnlocked, isPageCleared, progress } = useProgress();
  const router = useRouter();

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

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">⛺ キャンプ</h1>
          <p className="mt-1 text-slate-400">
            フェーズとレベルを順番にクリアしながら進みましょう。
          </p>
        </div>

        <div className="space-y-6">
          {PHASES.map((phase) => {
            const cleared = isPhaseCleared(phase.id);
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
                      {!unlocked ? '🔒' : cleared ? '✅' : phase.icon}
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
                              const lCleared = isLevelCleared(phase.id, level.id);
                              const lUnlocked = isLevelUnlocked(phase.id, level.id);
                              const lCurrent = level.id === currentLevel && isCurrent;
                              const levelClearedPages =
                                progress.phases[phase.id]?.levels[level.id]?.clearedPages ?? [];
                              const clearedPageCount = level.pages.filter((p) =>
                                levelClearedPages.includes(p.id),
                              ).length;
                              const levelPct = Math.round((clearedPageCount / level.pages.length) * 100);

                              return lUnlocked ? (
                                <Link
                                  key={level.id}
                                  href={`/camp/${phase.id}?level=${level.id}`}
                                  className={`rounded-xl border p-3 transition-colors hover:bg-slate-800 ${
                                    lCleared
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
                                    {lCleared && <span className="ml-auto text-xs">✅</span>}
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
                              cleared
                                ? 'bg-slate-700 hover:bg-slate-600'
                                : 'bg-indigo-600 hover:bg-indigo-500'
                            }
                          >
                            {cleared ? '復習する' : isCurrent ? '続ける →' : '始める →'}
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
      </main>

      <ChatbotButton />
    </div>
  );
}
