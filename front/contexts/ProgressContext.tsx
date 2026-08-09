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
  getPhaseProgress: (phaseId: number) => number;
  getLevelProgress: (phaseId: number, levelId: number) => number;
  completePage: (phaseId: number, levelId: number, pageId: number) => Promise<void>;
  completeLevel: (phaseId: number, levelId: number) => Promise<void>;
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
    // クリア済みのレベルは常にアンロック（コンテンツ追加後も影響なし）
    if (isLevelCleared(phaseId, levelId)) return true;
    // currentPhase がこのフェーズを超えている = フェーズ全体を完了済み
    // level_cleared_at が DB に未保存でも全レベルを復習アクセス可能にする
    if (progress.currentPhase > phaseId) return true;

    const phase = PHASES.find((p) => p.id === phaseId);
    if (!phase) return false;
    // 配列インデックスで前レベルを特定（ID非連続・途中挿入でも正確）
    const levelIndex = phase.levels.findIndex((l) => l.id === levelId);
    if (levelIndex <= 0) return true;
    const prevLevel = phase.levels[levelIndex - 1];
    return isLevelCleared(phaseId, prevLevel.id);
  }

  function isLevelCleared(phaseId: number, levelId: number): boolean {
    const phase = PHASES.find((p) => p.id === phaseId);
    const level = phase?.levels.find((l) => l.id === levelId);
    if (!level) return false;
    const clearedPages = progress.phases[phaseId]?.levels[levelId]?.clearedPages ?? [];
    return level.pages.every((page) => clearedPages.includes(page.id));
  }

  function isPhaseCleared(phaseId: number): boolean {
    const phase = PHASES.find((p) => p.id === phaseId);
    if (!phase) return false;
    return phase.levels.every((level) => isLevelCleared(phaseId, level.id));
  }

  function isPageCleared(phaseId: number, levelId: number, pageId: number): boolean {
    return progress.phases[phaseId]?.levels[levelId]?.clearedPages.includes(pageId) ?? false;
  }

  function isPageUnlocked(phaseId: number, levelId: number, pageId: number): boolean {
    if (!LOCK_ENABLED) return true;
    // クリア済みのページは常にアンロック（コンテンツ追加後も影響なし）
    if (isPageCleared(phaseId, levelId, pageId)) return true;
    const phase = PHASES.find((p) => p.id === phaseId);
    const level = phase?.levels.find((l) => l.id === levelId);
    if (!level) return false;
    // 配列インデックスで前ページを特定（ID非連続・途中挿入でも正確）
    const pageIndex = level.pages.findIndex((p) => p.id === pageId);
    if (pageIndex <= 0) return true;
    const prevPage = level.pages[pageIndex - 1];
    return isPageCleared(phaseId, levelId, prevPage.id);
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

  function getLevelProgress(phaseId: number, levelId: number): number {
    const phase = PHASES.find((p) => p.id === phaseId);
    const level = phase?.levels.find((l) => l.id === levelId);
    if (!level) return 0;
    // ページIDが実際にDBのclearedPagesに含まれているかを照合（ID非連続でも正確）
    const storedCleared = progress.phases[phaseId]?.levels[levelId]?.clearedPages ?? [];
    const cleared = level.pages.filter((page) => storedCleared.includes(page.id)).length;
    return Math.round((cleared / level.pages.length) * 100);
  }

  async function completePage(phaseId: number, levelId: number, pageId: number): Promise<void> {
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
      await upsertProgress(user.id, phaseId, levelId, {
        clearedPages: lv.clearedPages,
        currentPage: lv.currentPage,
      });
    }
  }

  async function completeLevel(phaseId: number, levelId: number): Promise<void> {
    const phase = PHASES.find((p) => p.id === phaseId);
    const level = phase?.levels.find((l) => l.id === levelId);
    const now = new Date().toISOString();

    const next = structuredClone(progress);
    if (!next.phases[phaseId]) {
      next.phases[phaseId] = { currentLevel: levelId, levels: {} };
    }
    if (!next.phases[phaseId].levels[levelId]) {
      next.phases[phaseId].levels[levelId] = { currentPage: 1, clearedPages: [] };
    }
    const lv = next.phases[phaseId].levels[levelId];
    level?.pages.forEach((page) => {
      if (!lv.clearedPages.includes(page.id)) lv.clearedPages.push(page.id);
    });
    lv.clearedAt = now;

    // clearedAt ではなくページ実績で判定（レベル追加後も正確に動作する）
    const allLevelsCleared = phase?.levels.every((l) => {
      const lvCleared = next.phases[phaseId]?.levels[l.id]?.clearedPages ?? [];
      return l.pages.every((p) => lvCleared.includes(p.id));
    }) ?? false;
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
      await upsertProgress(user.id, phaseId, levelId, {
        clearedPages: lv.clearedPages,
        currentPage: (level?.pages.length ?? 0) + 1,
        levelClearedAt: now,
        phaseClearedAt,
      });

      if (allLevelsCleared) {
        await upsertUserState(user.id, next.currentPhase, 1);
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
        getPhaseProgress,
        getLevelProgress,
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
