'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { UserProgress } from '@/lib/mock-store';
import { PHASES, LOCK_ENABLED } from '@/lib/phases-data';
import {
  DEFAULT_PROGRESS,
  fetchUserProgress,
  upsertProgress,
  upsertUserState,
  deleteUserProgress,
} from '@/lib/supabase/progress';

type ProgressContextType = {
  progress: UserProgress;
  isProgressLoading: boolean;
  isPhaseUnlocked: (phaseId: number) => boolean;
  isLevelUnlocked: (phaseId: number, levelId: number) => boolean;
  isPhaseCleared: (phaseId: number) => boolean;
  isLevelCleared: (phaseId: number, levelId: number) => boolean;
  isPageCleared: (phaseId: number, levelId: number, pageId: number) => boolean;
  isPageUnlocked: (phaseId: number, levelId: number, pageId: number) => boolean;
  completePage: (phaseId: number, levelId: number, pageId: number) => void;
  completeLevel: (phaseId: number, levelId: number) => void;
  completePhase: (phaseId: number) => void;
  resetAll: () => void;
  refreshProgress: () => void;
};

const ProgressContext = createContext<ProgressContextType>(null!);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress>(structuredClone(DEFAULT_PROGRESS));
  const [isProgressLoading, setIsProgressLoading] = useState(true);

  const refreshProgress = useCallback(async () => {
    if (!user) {
      setProgress(structuredClone(DEFAULT_PROGRESS));
      setIsProgressLoading(false);
      return;
    }
    setIsProgressLoading(true);
    try {
      const loaded = await fetchUserProgress(user.id);
      setProgress(loaded);
    } catch (e) {
      console.error('進捗の読み込みに失敗しました', e);
    } finally {
      setIsProgressLoading(false);
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refreshProgress();
  }, [refreshProgress]);

  function isPhaseUnlocked(phaseId: number): boolean {
    if (!LOCK_ENABLED) return true;
    if (phaseId === 1) return true;
    return progress.currentPhase >= phaseId;
  }

  function isLevelUnlocked(phaseId: number, levelId: number): boolean {
    if (!LOCK_ENABLED) return true;
    if (levelId === 1) return true;

    const phaseLevels = progress.phases[phaseId]?.levels ?? {};
    // コンテンツが途中挿入された場合でも対応できるよう、
    // そのフェーズでクリアした最高レベルIDを基準にする
    const maxClearedLevelId = Object.entries(phaseLevels)
      .filter(([, lv]) => !!lv.clearedAt)
      .reduce((max, [id]) => Math.max(max, Number(id)), 0);

    return maxClearedLevelId >= levelId - 1;
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

  function isPageUnlocked(phaseId: number, levelId: number, pageId: number): boolean {
    if (!LOCK_ENABLED) return true;
    if (pageId === 1) return true;
    return isPageCleared(phaseId, levelId, pageId - 1);
  }

  function completePage(phaseId: number, levelId: number, pageId: number) {
    const next = structuredClone(progress);
    if (!next.phases[phaseId]) {
      next.phases[phaseId] = { currentLevel: levelId, levels: {} };
    }
    if (!next.phases[phaseId].levels[levelId]) {
      next.phases[phaseId].levels[levelId] = { currentPage: 1, clearedPages: [] };
    }
    const lv = next.phases[phaseId].levels[levelId];
    if (!lv.clearedPages.includes(pageId)) lv.clearedPages.push(pageId);
    lv.currentPage = Math.max(lv.currentPage, pageId + 1);
    setProgress(next);

    if (user) {
      upsertProgress(user.id, phaseId, levelId, {
        clearedPages: lv.clearedPages,
        currentPage: lv.currentPage,
      }).catch(console.error);
    }
  }

  function completeLevel(phaseId: number, levelId: number) {
    const phase = PHASES.find((p) => p.id === phaseId);
    const level = phase?.levels.find((l) => l.id === levelId);
    const totalPages = level?.pages.length ?? 0;
    const now = new Date().toISOString();

    const next = structuredClone(progress);
    if (!next.phases[phaseId]) {
      next.phases[phaseId] = { currentLevel: levelId, levels: {} };
    }
    if (!next.phases[phaseId].levels[levelId]) {
      next.phases[phaseId].levels[levelId] = { currentPage: 1, clearedPages: [] };
    }
    const lv = next.phases[phaseId].levels[levelId];
    for (let i = 1; i <= totalPages; i++) {
      if (!lv.clearedPages.includes(i)) lv.clearedPages.push(i);
    }
    lv.clearedAt = now;

    const allLevelsCleared = phase?.levels.every(
      (l) => !!next.phases[phaseId]?.levels[l.id]?.clearedAt,
    );
    let phaseClearedAt: string | undefined;
    if (allLevelsCleared) {
      next.phases[phaseId].clearedAt = now;
      phaseClearedAt = now;
      // currentPhase は常に前進のみ（復習でクリアしても後退しない）
      if (phaseId < 5 && next.currentPhase === phaseId) {
        next.currentPhase = phaseId + 1;
      }
    }
    setProgress(next);

    if (user) {
      upsertProgress(user.id, phaseId, levelId, {
        clearedPages: lv.clearedPages,
        currentPage: totalPages + 1,
        levelClearedAt: now,
        phaseClearedAt,
      }).catch(console.error);

      if (allLevelsCleared) {
        upsertUserState(user.id, next.currentPhase, 1).catch(console.error);
      }
    }
  }

  function completePhase(phaseId: number) {
    const now = new Date().toISOString();
    const next = structuredClone(progress);
    if (!next.phases[phaseId]) {
      next.phases[phaseId] = { currentLevel: 1, levels: {} };
    }
    next.phases[phaseId].clearedAt = now;
    if (phaseId < 5 && next.currentPhase === phaseId) {
      next.currentPhase = phaseId + 1;
    }
    setProgress(next);

    if (user) {
      const phase = PHASES.find((p) => p.id === phaseId);
      phase?.levels.forEach((l) => {
        const lv = next.phases[phaseId].levels[l.id];
        if (lv) {
          upsertProgress(user.id, phaseId, l.id, {
            clearedPages: lv.clearedPages,
            currentPage: lv.currentPage,
            levelClearedAt: lv.clearedAt,
            phaseClearedAt: now,
          }).catch(console.error);
        }
      });
      upsertUserState(user.id, next.currentPhase, 1).catch(console.error);
    }
  }

  function resetAll() {
    setProgress(structuredClone(DEFAULT_PROGRESS));
    if (user) {
      deleteUserProgress(user.id).catch(console.error);
    }
  }

  return (
    <ProgressContext.Provider
      value={{
        progress,
        isProgressLoading,
        isPhaseUnlocked,
        isLevelUnlocked,
        isPhaseCleared,
        isLevelCleared,
        isPageCleared,
        isPageUnlocked,
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
