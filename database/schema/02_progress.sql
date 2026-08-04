-- 学習進捗テーブル（Phase / Level / Page の3階層構造）
-- mock-store.ts の UserProgress 型と対応する設計

-- ========================================
-- Phase/Level 単位の詳細進捗
-- ========================================
CREATE TABLE IF NOT EXISTS public.progress (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  phase_id        SMALLINT NOT NULL CHECK (phase_id BETWEEN 1 AND 5),
  level_id        SMALLINT NOT NULL CHECK (level_id >= 1),
  cleared_pages   SMALLINT[] NOT NULL DEFAULT '{}',   -- クリア済みページIDの配列
  current_page    SMALLINT NOT NULL DEFAULT 1,         -- 現在表示中のページ
  level_cleared_at TIMESTAMPTZ,                        -- このレベルをクリアした日時
  phase_cleared_at TIMESTAMPTZ,                        -- このフェーズをクリアした日時（最終Levelクリア時に記録）
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, phase_id, level_id)
);

-- ========================================
-- ユーザーの現在地（Phase/Level）
-- ========================================
CREATE TABLE IF NOT EXISTS public.user_state (
  user_id       UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  current_phase SMALLINT NOT NULL DEFAULT 1 CHECK (current_phase BETWEEN 1 AND 5),
  current_level SMALLINT NOT NULL DEFAULT 1,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- Row Level Security
-- ========================================
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON public.progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON public.progress FOR DELETE
  USING (auth.uid() = user_id);

ALTER TABLE public.user_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own state"
  ON public.user_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own state"
  ON public.user_state FOR ALL
  USING (auth.uid() = user_id);

-- ========================================
-- 注意: todo01.txt の 2-2 で作成済みの
-- シンプルな progress テーブルがある場合は
-- 以下のマイグレーションSQLを SQL Editor で先に実行すること:
--
-- DROP TABLE IF EXISTS public.progress CASCADE;
--
-- その後このファイルの CREATE TABLE を実行する
-- ========================================
