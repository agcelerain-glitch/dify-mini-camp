import { createClient } from './client';
import type { UserProgress, PhaseProgress, LevelProgress } from '@/lib/mock-store';

function makeDefaultLevel(): LevelProgress {
  return { currentPage: 1, clearedPages: [] };
}

function makeDefaultPhase(): PhaseProgress {
  return {
    currentLevel: 1,
    levels: {
      1: makeDefaultLevel(),
      2: makeDefaultLevel(),
      3: makeDefaultLevel(),
    },
  };
}

export const DEFAULT_PROGRESS: UserProgress = {
  currentPhase: 1,
  phases: {
    1: makeDefaultPhase(),
    2: makeDefaultPhase(),
    3: makeDefaultPhase(),
    4: makeDefaultPhase(),
    5: makeDefaultPhase(),
  },
};

export async function fetchUserProgress(userId: string): Promise<UserProgress> {
  const supabase = createClient();

  const [{ data: stateRow }, { data: progressRows }] = await Promise.all([
    supabase
      .from('user_state')
      .select('current_phase, current_level')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('progress')
      .select('phase_id, level_id, cleared_pages, current_page, level_cleared_at, phase_cleared_at')
      .eq('user_id', userId),
  ]);

  const result: UserProgress = structuredClone(DEFAULT_PROGRESS);
  result.currentPhase = stateRow?.current_phase ?? 1;

  if (progressRows) {
    for (const row of progressRows) {
      const phaseId = row.phase_id as number;
      const levelId = row.level_id as number;

      if (!result.phases[phaseId]) {
        result.phases[phaseId] = { currentLevel: 1, levels: {} };
      }

      result.phases[phaseId].levels[levelId] = {
        currentPage: row.current_page ?? 1,
        clearedPages: (row.cleared_pages as number[]) ?? [],
        clearedAt: row.level_cleared_at ?? undefined,
      };

      if (row.phase_cleared_at) {
        result.phases[phaseId].clearedAt = row.phase_cleared_at as string;
      }
    }
  }

  return result;
}

export async function upsertProgress(
  userId: string,
  phaseId: number,
  levelId: number,
  data: {
    clearedPages: number[];
    currentPage: number;
    levelClearedAt?: string;
    phaseClearedAt?: string;
  },
): Promise<void> {
  const supabase = createClient();
  await supabase.from('progress').upsert(
    {
      user_id: userId,
      phase_id: phaseId,
      level_id: levelId,
      cleared_pages: data.clearedPages,
      current_page: data.currentPage,
      level_cleared_at: data.levelClearedAt ?? null,
      phase_cleared_at: data.phaseClearedAt ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,phase_id,level_id' },
  );
}

export async function upsertUserState(
  userId: string,
  currentPhase: number,
  currentLevel: number,
): Promise<void> {
  const supabase = createClient();
  await supabase.from('user_state').upsert(
    {
      user_id: userId,
      current_phase: currentPhase,
      current_level: currentLevel,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
}

export async function deleteUserProgress(userId: string): Promise<void> {
  const supabase = createClient();
  await Promise.all([
    supabase.from('progress').delete().eq('user_id', userId),
    supabase.from('user_state').delete().eq('user_id', userId),
  ]);
}
