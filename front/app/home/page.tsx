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
  const { progress, isPhaseCleared, isPhaseUnlocked, isLevelCleared, resetAll } = useProgress();
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
    const totalLevels = phase.levels.length;
    const clearedLevels = phase.levels.filter((l) => isLevelCleared(phaseId, l.id)).length;
    return Math.round((clearedLevels / totalLevels) * 100);
  }

  const clearedPhases = PHASES.filter((p) => isPhaseCleared(p.id)).length;
  const totalProgress = Math.round((clearedPhases / PHASES.length) * 100);
  const isMaster = totalProgress === 100;
  const currentPhase = progress.currentPhase;
  const currentPhaseData = PHASES.find((p) => p.id === currentPhase);
  const currentLevel = progress.phases[currentPhase]?.currentLevel ?? 1;
  const currentLevelData = currentPhaseData?.levels.find((l) => l.id === currentLevel);

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* ウェルカムカード */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-600/20 to-violet-600/10 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">おかえりなさい</p>
              <h1 className="mt-1 text-2xl font-bold text-white">{user.name} さん</h1>
              {isMaster ? (
                <p className="mt-2 text-slate-300">
                  <span className="font-semibold text-yellow-400">🏆 チャットボットマスター</span> として全フェーズ制覇！
                </p>
              ) : currentPhaseData && (
                <p className="mt-2 text-slate-300">
                  現在{' '}
                  <span className={`font-semibold ${currentPhaseData.textColor}`}>
                    Phase {currentPhase} — Level {currentLevel}
                  </span>
                  {' '}を学習中
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">全体進捗</p>
              <p className="text-3xl font-bold text-white">{totalProgress}%</p>
              <p className="text-xs text-slate-500">{clearedPhases} / {PHASES.length} フェーズ完了</p>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={totalProgress} className="h-2 bg-slate-700" />
          </div>
        </div>

        {/* チャットボットマスター / 現在の学習 */}
        {isMaster ? (
          <div className="mb-8 rounded-2xl border border-yellow-500/40 bg-gradient-to-br from-yellow-500/20 to-amber-600/10 p-6">
            <Badge className="mb-3 bg-yellow-500/20 text-yellow-300">
              🏆 チャットボットマスター
            </Badge>
            <h2 className="text-xl font-bold text-white">全フェーズ修了、おめでとうございます！</h2>
            <p className="mt-2 text-slate-300">どのフェーズを復習する？</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {PHASES.map((phase) => (
                <Link key={phase.id} href={`/camp/${phase.id}`}>
                  <Button
                    variant="outline"
                    className={`w-full border ${phase.borderColor} ${phase.textColor} bg-slate-900 hover:bg-slate-800`}
                  >
                    {phase.icon} Phase {phase.id}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        ) : currentPhaseData && currentLevelData && (
          <div className={`mb-8 rounded-2xl border ${currentPhaseData.borderColor} bg-gradient-to-br ${currentPhaseData.bgGradient} p-6`}>
            <Badge className={`mb-3 ${currentPhaseData.badgeBg}`}>
              {currentPhaseData.icon} 現在学習中
            </Badge>
            <h2 className="text-xl font-bold text-white">
              Phase {currentPhase}: {currentPhaseData.title}
            </h2>
            <p className={`mt-0.5 text-sm ${currentPhaseData.textColor}`}>
              Level {currentLevel}: {currentLevelData.title}
            </p>
            <p className="mt-2 text-sm text-slate-400">{currentLevelData.description}</p>
            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="mb-1 flex justify-between text-xs text-slate-400">
                  <span>Level進捗</span>
                  <span>{getPhaseProgress(currentPhase)}%</span>
                </div>
                <Progress value={getPhaseProgress(currentPhase)} className="h-1.5 bg-slate-700/50" />
              </div>
              <Link href={`/camp/${currentPhase}`}>
                <Button className="bg-indigo-600 hover:bg-indigo-500 whitespace-nowrap">
                  続ける →
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* ロードマップ */}
        <div className="mb-6">
          <h3 className="mb-4 text-lg font-semibold text-white">学習ロードマップ</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PHASES.map((phase) => {
              const cleared = isPhaseCleared(phase.id);
              const unlocked = isPhaseUnlocked(phase.id);
              const isCurrent = phase.id === currentPhase;
              const pct = getPhaseProgress(phase.id);

              const cardContent = (
                <div className={`relative rounded-xl border p-4 transition-all ${
                  phase.borderColor
                } ${unlocked ? 'bg-slate-900 hover:bg-slate-800 cursor-pointer' : 'bg-slate-900/50 opacity-60 cursor-not-allowed'} ${
                  isCurrent && unlocked ? 'ring-1 ring-indigo-500/50' : ''
                }`}>
                  {cleared && <span className="absolute right-3 top-3 text-lg">✅</span>}
                  {!unlocked && <span className="absolute right-3 top-3 text-lg">🔒</span>}
                  <p className="mb-1 text-xs text-slate-500">{phase.subtitle}</p>
                  <p className="font-semibold text-white">
                    {phase.icon} {phase.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge className={`text-xs ${phase.badgeBg}`}>{phase.difficultyLabel}</Badge>
                    <span className="text-xs text-slate-500">{phase.duration}</span>
                  </div>
                  {!unlocked && (
                    <p className="mt-2 text-xs text-slate-600">前のフェーズをクリアしてください</p>
                  )}
                  <div className="mt-3">
                    <div className="mb-0.5 flex justify-between text-xs text-slate-600">
                      <span>{phase.levels.length} レベル</span>
                      <span>{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-1 bg-slate-700" />
                  </div>
                </div>
              );

              return unlocked ? (
                <Link key={phase.id} href={`/camp/${phase.id}`}>
                  {cardContent}
                </Link>
              ) : (
                <div key={phase.id}>{cardContent}</div>
              );
            })}
          </div>
        </div>

        {/* 学習の進め方 */}
        <div className="rounded-xl border border-white/5 bg-slate-900/50 p-5">
          <h4 className="mb-3 text-sm font-semibold text-slate-300">学習の進め方</h4>
          <ol className="space-y-2 text-sm text-slate-500">
            <li><span className="text-slate-300">1. インプット</span> — 各ページでDifyの概念・操作を学ぶ</li>
            <li><span className="text-slate-300">2. 実践</span> — 実際にDifyを操作して課題に取り組む</li>
            <li><span className="text-slate-300">3. アウトプット</span> — クイズ・チャットで理解を確認（ページクリア）</li>
            <li><span className="text-slate-300">4. レベルアップ</span> — 全ページクリアで次のレベルへ</li>
          </ol>
          <div className="mt-4 flex gap-2">
            <Link href="/camp">
              <Button variant="outline" size="sm" className="border-white/10 text-slate-300 hover:bg-white/5">
                キャンプへ
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetAll}
              className="text-xs text-slate-700 hover:text-slate-400"
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
