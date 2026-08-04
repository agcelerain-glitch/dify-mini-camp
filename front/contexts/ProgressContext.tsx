'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  getProgress,
  clearPage,
  clearLevel,
  clearPhase,
  resetProgress,
  UserProgress,
} from '@/lib/mock-store';
import { PHASES } from '@/lib/phases-data';

type ProgressContextType = {
  progress: UserProgress;
  // ロック機能: LOCK_ENABLED=false の間は常にtrue
  // Supabase連携時に phases-data.ts の LOCK_ENABLED を true にして再活性化
  isPhaseUnlocked: (phaseId: number) => boolean;
  isLevelUnlocked: (phaseId: number, levelId: number) => boolean;
  isPhaseCleared: (phaseId: number) => boolean;
  isLevelCleared: (phaseId: number, levelId: number) => boolean;
  isPageCleared: (phaseId: number, levelId: number, pageId: number) => boolean;
  completePage: (phaseId: number, levelId: number, pageId: number) => void;
  completeLevel: (phaseId: number, levelId: number) => void;
  completePhase: (phaseId: number) => void;
  resetAll: () => void;
  refreshProgress: () => void;
};

const ProgressContext = createContext<ProgressContextType>(null!);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<UserProgress>(getProgress);

  const refreshProgress = useCallback(() => {
    setProgress(getProgress());
  }, []);

  // ロック判定（LOCK_ENABLED=false のとき常にtrue）
  function isPhaseUnlocked(phaseId: number): boolean {
    const { LOCK_ENABLED } = require('@/lib/phases-data');
    if (!LOCK_ENABLED) return true;
    if (phaseId === 1) return true;
    return progress.currentPhase >= phaseId;
  }

  function isLevelUnlocked(phaseId: number, levelId: number): boolean {
    const { LOCK_ENABLED } = require('@/lib/phases-data');
    if (!LOCK_ENABLED) return true;
    if (levelId === 1) return true;
    const phase = progress.phases[phaseId];
    return !!phase?.levels[levelId - 1]?.clearedAt;
  }

  function isPhaseCleared(phaseId: number): boolean {
    return !!progress.phases[phaseId]?.clearedAt;
  }

  function isLevelCleared(phaseId: number, levelId: number): boolean {
    return !!progress.phases[phaseId]?.levels[levelId]?.clearedAt;
  }

  function isPageCleared(phaseId: number, levelId: number, pageId: number): boolean {
    return progress.phases[phaseId]?.levels[levelId]?.clearedPages.includes(pageId) ?? false;
  }

  function completePage(phaseId: number, levelId: number, pageId: number) {
    const updated = clearPage(phaseId, levelId, pageId);
    setProgress({ ...updated });
  }

  function completeLevel(phaseId: number, levelId: number) {
    const phase = PHASES.find((p) => p.id === phaseId);
    const level = phase?.levels.find((l) => l.id === levelId);
    const totalPages = level?.pages.length ?? 0;
    const updated = clearLevel(phaseId, levelId, totalPages);

    // 全レベルクリアでフェーズクリア
    const allLevelsCleared = phase?.levels.every(
      (l) => !!updated.phases[phaseId]?.levels[l.id]?.clearedAt,
    );
    if (allLevelsCleared) {
      const afterPhase = clearPhase(phaseId);
      setProgress({ ...afterPhase });
    } else {
      setProgress({ ...updated });
    }
  }

  function completePhase(phaseId: number) {
    const updated = clearPhase(phaseId);
    setProgress({ ...updated });
  }

  function resetAll() {
    resetProgress();
    setProgress(getProgress());
  }

  return (
    <ProgressContext.Provider
      value={{
        progress,
        isPhaseUnlocked,
        isLevelUnlocked,
        isPhaseCleared,
        isLevelCleared,
        isPageCleared,
        completePage,
        completeLevel,
        completePhase,
        resetAll,
        refreshProgress,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  return useContext(ProgressContext);
}
