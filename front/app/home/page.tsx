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

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const { progress, isPhaseUnlocked, isPhaseCleared, resetAll } = useProgress();
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

  const currentPhase = progress.currentPhase;
  const currentPhaseData = PHASES.find((p) => p.id === currentPhase);
  const clearedCount = PHASES.filter((p) => isPhaseCleared(p.id)).length;
  const totalProgress = Math.round((clearedCount / PHASES.length) * 100);

  function getCurrentLevel(): number {
    return progress.phases[currentPhase]?.currentLevel ?? 1;
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
        <div className="mb-8 rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-600/20 to-violet-600/10 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">おかえりなさい</p>
              <h1 className="mt-1 text-2xl font-bold text-white">{user.name} さん</h1>
              <p className="mt-2 text-slate-300">
                現在{' '}
                <span className={`font-semibold ${currentPhaseData?.textColor}`}>
                  Phase {currentPhase}
                </span>
                {' '}を学習中
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">総合進捗</p>
              <p className="text-3xl font-bold text-white">{totalProgress}%</p>
              <p className="text-xs text-slate-500">{clearedCount} / {PHASES.length} フェーズ完了</p>
            </div>
          </div>

          <div className="mt-4">
            <Progress value={totalProgress} className="h-2 bg-slate-700" />
          </div>
        </div>

        {currentPhaseData && (
          <div className={`mb-8 rounded-2xl border ${currentPhaseData.borderColor} bg-gradient-to-br ${currentPhaseData.bgGradient} p-6`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge className={`mb-2 ${currentPhaseData.badgeBg}`}>
                  {currentPhaseData.icon} 現在学習中
                </Badge>
                <h2 className="text-xl font-bold text-white">
                  Phase {currentPhase}: {currentPhaseData.title}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  レベル {getCurrentLevel()} / {currentPhaseData.levels.length} |{' '}
                  推奨時間: {currentPhaseData.duration}
                </p>
                <p className="mt-2 text-slate-300">{currentPhaseData.description}</p>
              </div>
              <Link href={`/camp/${currentPhase}`}>
                <Button className="bg-indigo-600 hover:bg-indigo-500 whitespace-nowrap">
                  学習を続ける →
                </Button>
              </Link>
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-slate-400">
                <span>フェーズ進捗</span>
                <span>{getLevelProgress(currentPhase)}%</span>
              </div>
              <Progress value={getLevelProgress(currentPhase)} className="h-1.5 bg-slate-700/50" />
            </div>
          </div>
        )}

        <div className="mb-6">
          <h3 className="mb-4 text-lg font-semibold text-white">ロードマップ</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PHASES.map((phase) => {
              const unlocked = isPhaseUnlocked(phase.id);
              const cleared = isPhaseCleared(phase.id);
              const isCurrent = phase.id === currentPhase;
              const levelPct = getLevelProgress(phase.id);

              return (
                <Link
                  key={phase.id}
                  href={unlocked ? `/camp/${phase.id}` : '#'}
                  className={`relative rounded-xl border p-4 transition-all ${
                    unlocked
                      ? `${phase.borderColor} bg-slate-900 hover:bg-slate-800 cursor-pointer`
                      : 'border-white/5 bg-slate-900/30 cursor-not-allowed opacity-40'
                  } ${isCurrent ? 'ring-1 ring-indigo-500/50' : ''}`}
                >
                  {cleared && (
                    <span className="absolute right-3 top-3 text-lg">✅</span>
                  )}
                  {!unlocked && (
                    <span className="absolute right-3 top-3 text-lg">🔒</span>
                  )}
                  <p className="mb-1 text-xs text-slate-500">{phase.subtitle}</p>
                  <p className="font-semibold text-white">
                    {phase.icon} {phase.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge className={`text-xs ${phase.badgeBg}`}>
                      {phase.difficultyLabel}
                    </Badge>
                    <span className="text-xs text-slate-500">{phase.duration}</span>
                  </div>
                  {unlocked && !cleared && (
                    <div className="mt-3">
                      <Progress value={levelPct} className="h-1 bg-slate-700" />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-slate-900/50 p-4">
          <h4 className="mb-3 text-sm font-semibold text-slate-400">学習の進め方</h4>
          <ol className="space-y-2 text-sm text-slate-500">
            <li>1. <span className="text-slate-300">インプット</span>ページでDifyの概念・操作を学ぶ</li>
            <li>2. <span className="text-slate-300">実際にDifyを操作</span>して課題をこなす</li>
            <li>3. <span className="text-slate-300">アウトプット</span>ページで理解度を確認（レベルアップ）</li>
            <li>4. 全レベルクリアで次のフェーズが解放される</li>
          </ol>
          <div className="mt-4 flex gap-2">
            <Link href="/camp">
              <Button variant="outline" size="sm" className="border-white/10 text-slate-300 hover:bg-white/5">
                キャンプへ移動
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetAll}
              className="text-xs text-slate-600 hover:text-slate-400"
            >
              進捗リセット（テスト用）
            </Button>
          </div>
        </div>
      </main>

      <ChatbotButton />
    </div>
  );
}
