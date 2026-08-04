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
  const { isPhaseUnlocked, isPhaseCleared, progress } = useProgress();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  function getLevelProgress(phaseId: number): number {
    const phase = PHASES.find((p) => p.id === phaseId);
    if (!phase) return 0;
    const cleared = progress.phases[phaseId]?.clearedLevels.length ?? 0;
    return Math.round((cleared / phase.levels.length) * 100);
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">⛺ キャンプ</h1>
          <p className="mt-1 text-slate-400">フェーズを選んで学習を始めましょう。前のフェーズをクリアすると次が解放されます。</p>
        </div>

        <div className="space-y-4">
          {PHASES.map((phase, index) => {
            const unlocked = isPhaseUnlocked(phase.id);
            const cleared = isPhaseCleared(phase.id);
            const isCurrent = phase.id === progress.currentPhase;
            const levelPct = getLevelProgress(phase.id);
            const currentLevel = progress.phases[phase.id]?.currentLevel ?? 1;

            return (
              <div
                key={phase.id}
                className={`relative rounded-2xl border transition-all ${
                  unlocked
                    ? `${phase.borderColor} bg-slate-900`
                    : 'border-white/5 bg-slate-900/20 opacity-50'
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-2 left-6">
                    <Badge className="bg-indigo-600 text-white text-xs">現在地</Badge>
                  </div>
                )}

                <div className="p-5">
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-2xl">
                      {cleared ? '✅' : unlocked ? phase.icon : '🔒'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs text-slate-500">{phase.subtitle}</span>
                        <Badge className={`text-xs ${phase.badgeBg}`}>{phase.difficultyLabel}</Badge>
                        <span className="text-xs text-slate-500">⏱ {phase.duration}</span>
                      </div>
                      <h3 className={`text-lg font-bold ${unlocked ? 'text-white' : 'text-slate-500'}`}>
                        {phase.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">{phase.description}</p>

                      {unlocked && (
                        <div className="mt-3">
                          <div className="mb-1 flex justify-between text-xs text-slate-500">
                            <span>レベル {currentLevel} / {phase.levels.length}</span>
                            <span>{levelPct}%</span>
                          </div>
                          <Progress value={levelPct} className="h-1.5 bg-slate-700" />
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        {phase.levels.map((level) => {
                          const levelCleared = progress.phases[phase.id]?.clearedLevels.includes(level.id);
                          return (
                            <span
                              key={level.id}
                              className={`rounded-full px-2 py-0.5 text-xs border ${
                                levelCleared
                                  ? `${phase.borderColor} ${phase.textColor}`
                                  : 'border-white/10 text-slate-600'
                              }`}
                            >
                              {level.type === 'input' ? '📖' : '✏️'} Lv.{level.id}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
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
                        <div className="text-xs text-slate-600 text-right">
                          Phase {phase.id - 1} をクリアすると<br />解放されます
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {index < PHASES.length - 1 && (
                  <div className={`mx-auto my-0 h-6 w-0.5 ${unlocked && isPhaseUnlocked(PHASES[index + 1].id) ? 'bg-white/10' : 'bg-white/5'}`} />
                )}
              </div>
            );
          })}
        </div>
      </main>

      <ChatbotButton />
    </div>
  );
}
