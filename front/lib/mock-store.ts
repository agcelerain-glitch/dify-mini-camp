'use client';

export type MockUser = {
  id: string;
  name: string;
  email: string;
  avatar: string;
};

export type PhaseProgress = {
  currentLevel: number;
  clearedLevels: number[];
  clearedAt?: string;
};

export type UserProgress = {
  currentPhase: number;
  phases: Record<number, PhaseProgress>;
};

const MOCK_USER_KEY = 'dify_camp_user';
const MOCK_PROGRESS_KEY = 'dify_camp_progress';

export function getMockUser(): MockUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(MOCK_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MockUser;
  } catch {
    return null;
  }
}

export function setMockUser(user: MockUser): void {
  localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
}

export function clearMockUser(): void {
  localStorage.removeItem(MOCK_USER_KEY);
}

const DEFAULT_PROGRESS: UserProgress = {
  currentPhase: 1,
  phases: {
    1: { currentLevel: 1, clearedLevels: [] },
    2: { currentLevel: 1, clearedLevels: [] },
    3: { currentLevel: 1, clearedLevels: [] },
    4: { currentLevel: 1, clearedLevels: [] },
    5: { currentLevel: 1, clearedLevels: [] },
  },
};

export function getProgress(): UserProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  const raw = localStorage.getItem(MOCK_PROGRESS_KEY);
  if (!raw) return structuredClone(DEFAULT_PROGRESS);
  try {
    return JSON.parse(raw) as UserProgress;
  } catch {
    return structuredClone(DEFAULT_PROGRESS);
  }
}

export function saveProgress(progress: UserProgress): void {
  localStorage.setItem(MOCK_PROGRESS_KEY, JSON.stringify(progress));
}

export function clearLevelInPhase(phaseId: number, levelId: number): UserProgress {
  const progress = getProgress();
  const phaseProgress = progress.phases[phaseId];
  if (!phaseProgress.clearedLevels.includes(levelId)) {
    phaseProgress.clearedLevels.push(levelId);
  }
  phaseProgress.currentLevel = Math.max(phaseProgress.currentLevel, levelId + 1);
  saveProgress(progress);
  return progress;
}

export function clearPhase(phaseId: number, totalLevels: number): UserProgress {
  const progress = getProgress();
  const phaseProgress = progress.phases[phaseId];
  for (let i = 1; i <= totalLevels; i++) {
    if (!phaseProgress.clearedLevels.includes(i)) {
      phaseProgress.clearedLevels.push(i);
    }
  }
  phaseProgress.clearedAt = new Date().toISOString();
  if (phaseId < 5 && progress.currentPhase === phaseId) {
    progress.currentPhase = phaseId + 1;
  }
  saveProgress(progress);
  return progress;
}

export function resetProgress(): void {
  localStorage.removeItem(MOCK_PROGRESS_KEY);
}
