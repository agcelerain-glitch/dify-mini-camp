'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import {
  getProgress,
  clearLevelInPhase,
  clearPhase,
  resetProgress,
  UserProgress,
} from '@/lib/mock-store';
import { PHASES } from '@/lib/phases-data';

type ProgressContextType = {
  progress: UserProgress;
  isPhaseUnlocked: (phaseId: number) => boolean;
  isPhaseCleared: (phaseId: number) => boolean;
  isLevelCleared: (phaseId: number, levelId: number) => boolean;
  completeLevel: (phaseId: number, levelId: number) => void;
  completePhase: (phaseId: number) => void;
  resetAll: () => void;
  refreshProgress: () => void;
};

const ProgressContext = createContext<ProgressContextType>({
  progress: {
    currentPhase: 1,
    phases: {
      1: { currentLevel: 1, clearedLevels: [] },
      2: { currentLevel: 1, clearedLevels: [] },
      3: { currentLevel: 1, clearedLevels: [] },
      4: { currentLevel: 1, clearedLevels: [] },
      5: { currentLevel: 1, clearedLevels: [] },
    },
  },
  isPhaseUnlocked: () => false,
  isPhaseCleared: () => false,
  isLevelCleared: () => false,
  completeLevel: () => {},
  completePhase: () => {},
  resetAll: () => {},
  refreshProgress: () => {},
});

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<UserProgress>(getProgress);

  const refreshProgress = useCallback(() => {
    setProgress(getProgress());
  }, []);

  useEffect(() => {
    refreshProgress();
  }, [refreshProgress]);

  function isPhaseUnlocked(phaseId: number): boolean {
    if (phaseId === 1) return true;
    return progress.currentPhase >= phaseId;
  }

  function isPhaseCleared(phaseId: number): boolean {
    return !!progress.phases[phaseId]?.clearedAt;
  }

  function isLevelCleared(phaseId: number, levelId: number): boolean {
    return progress.phases[phaseId]?.clearedLevels.includes(levelId) ?? false;
  }

  function completeLevel(phaseId: number, levelId: number) {
    const updated = clearLevelInPhase(phaseId, levelId);
    setProgress({ ...updated });
  }

  function completePhase(phaseId: number) {
    const totalLevels = PHASES.find((p) => p.id === phaseId)?.levels.length ?? 0;
    const updated = clearPhase(phaseId, totalLevels);
    setProgress({ ...updated });
  }

  function resetAll() {
    resetProgress();
    refreshProgress();
  }

  return (
    <ProgressContext.Provider
      value={{
        progress,
        isPhaseUnlocked,
        isPhaseCleared,
        isLevelCleared,
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
