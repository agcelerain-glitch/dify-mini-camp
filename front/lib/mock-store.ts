'use client';

export type MockUser = {
  id: string;
  name: string;
  email: string;
  avatar: string;
};

export type PageProgress = {
  cleared: boolean;
};

export type LevelProgress = {
  currentPage: number;
  clearedPages: number[];
  clearedAt?: string;
};

export type PhaseProgress = {
  currentLevel: number;
  levels: Record<number, LevelProgress>;
  clearedAt?: string;
};

export type UserProgress = {
  currentPhase: number;
  phases: Record<number, PhaseProgress>;
};

const MOCK_USER_KEY = 'dify_camp_user';
const MOCK_PROGRESS_KEY = 'dify_camp_progress_v2';

// ---- User ----

export function getMockUser(): MockUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(MOCK_USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as MockUser; } catch { return null; }
}

export function setMockUser(user: MockUser): void {
  localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
}

export function clearMockUser(): void {
  localStorage.removeItem(MOCK_USER_KEY);
}

// ---- Progress ----

function makeDefaultPhaseProgress(): PhaseProgress {
  return {
    currentLevel: 1,
    levels: {
      1: { currentPage: 1, clearedPages: [] },
      2: { currentPage: 1, clearedPages: [] },
      3: { currentPage: 1, clearedPages: [] },
    },
  };
}

const DEFAULT_PROGRESS: UserProgress = {
  currentPhase: 1,
  phases: {
    1: makeDefaultPhaseProgress(),
    2: makeDefaultPhaseProgress(),
    3: makeDefaultPhaseProgress(),
    4: makeDefaultPhaseProgress(),
    5: makeDefaultPhaseProgress(),
  },
};

export function getProgress(): UserProgress {
  if (typeof window === 'undefined') return structuredClone(DEFAULT_PROGRESS);
  const raw = localStorage.getItem(MOCK_PROGRESS_KEY);
  if (!raw) return structuredClone(DEFAULT_PROGRESS);
  try {
    const parsed = JSON.parse(raw) as UserProgress;
    // 古いデータ構造の場合に初期値でマージ
    for (let p = 1; p <= 5; p++) {
      if (!parsed.phases[p]) parsed.phases[p] = makeDefaultPhaseProgress();
    }
    return parsed;
  } catch {
    return structuredClone(DEFAULT_PROGRESS);
  }
}

export function saveProgress(progress: UserProgress): void {
  localStorage.setItem(MOCK_PROGRESS_KEY, JSON.stringify(progress));
}

export function clearPage(
  phaseId: number,
  levelId: number,
  pageId: number,
): UserProgress {
  const progress = getProgress();
  const phase = progress.phases[phaseId];
  if (!phase.levels[levelId]) {
    phase.levels[levelId] = { currentPage: 1, clearedPages: [] };
  }
  const level = phase.levels[levelId];
  if (!level.clearedPages.includes(pageId)) {
    level.clearedPages.push(pageId);
  }
  level.currentPage = Math.max(level.currentPage, pageId + 1);
  saveProgress(progress);
  return progress;
}

export function clearLevel(
  phaseId: number,
  levelId: number,
  totalPages: number,
): UserProgress {
  const progress = getProgress();
  const phase = progress.phases[phaseId];
  if (!phase.levels[levelId]) {
    phase.levels[levelId] = { currentPage: 1, clearedPages: [] };
  }
  const level = phase.levels[levelId];
  for (let i = 1; i <= totalPages; i++) {
    if (!level.clearedPages.includes(i)) level.clearedPages.push(i);
  }
  level.clearedAt = new Date().toISOString();
  saveProgress(progress);
  return progress;
}

export function clearPhase(phaseId: number): UserProgress {
  const progress = getProgress();
  const phase = progress.phases[phaseId];
  phase.clearedAt = new Date().toISOString();
  if (phaseId < 5 && progress.currentPhase === phaseId) {
    progress.currentPhase = phaseId + 1;
  }
  saveProgress(progress);
  return progress;
}

export function resetProgress(): void {
  localStorage.removeItem(MOCK_PROGRESS_KEY);
}
