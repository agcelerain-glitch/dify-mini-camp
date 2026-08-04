-- ================================================================
-- 02_progress.sql
-- 学習進捗テーブル（Phase / Level / Page の 3 階層構造）
--
-- ■ 実行方法: Supabase SQL Editor に貼り付けて「Run」
-- ■ 冪等性: 何度実行してもエラーにならない設計
-- ■ 前提: 01_users.sql を先に実行しておくこと
--
-- ■ 他の e-learning で再利用する場合のカスタマイズ箇所:
--   Phase  → コース・章・ユニットなど（CHECK 制約の上限を変更）
--   Level  → モジュール・節・レッスンなど（そのまま使用可）
--   Page   → ページ・スライド・タスクなど（そのまま使用可）
--   カラム名の変更は不要（汎用的な命名のため）
--
-- ■ 旧スキーマからの移行（todo01.txt 2-2 で作成した場合）:
--   古い progress テーブルが残っている場合は、先に以下を実行:
--     DROP TABLE IF EXISTS public.progress CASCADE;
--   その後このファイルを実行する。
-- ================================================================


-- ----------------------------------------------------------------
-- progress テーブル: Phase / Level 単位の詳細進捗
-- ----------------------------------------------------------------
-- ■ カスタマイズ: phase_id の CHECK 上限をフェーズ数に合わせて変更
--   例) 3 フェーズ構成なら → CHECK (phase_id BETWEEN 1 AND 3)
--       上限なしにしたい場合 → CHECK (phase_id >= 1)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.progress (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  phase_id         SMALLINT    NOT NULL CHECK (phase_id >= 1),
  level_id         SMALLINT    NOT NULL CHECK (level_id >= 1),
  cleared_pages    SMALLINT[]  NOT NULL DEFAULT '{}',  -- クリア済みページ ID の配列
  current_page     SMALLINT    NOT NULL DEFAULT 1,      -- 現在表示中のページ番号
  level_cleared_at TIMESTAMPTZ,                         -- このレベルをクリアした日時
  phase_cleared_at TIMESTAMPTZ,                         -- このフェーズをクリアした日時
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, phase_id, level_id)
);


-- ----------------------------------------------------------------
-- user_state テーブル: ユーザーの現在地（どの Phase / Level か）
-- ログイン時に再開位置を復元するために使用
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_state (
  user_id       UUID     PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  current_phase SMALLINT NOT NULL DEFAULT 1 CHECK (current_phase >= 1),
  current_level SMALLINT NOT NULL DEFAULT 1 CHECK (current_level >= 1),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);


-- ----------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------
ALTER TABLE public.progress   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_state ENABLE ROW LEVEL SECURITY;


-- ----------------------------------------------------------------
-- ポリシー: progress（DROP → CREATE で冪等化）
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own progress"   ON public.progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON public.progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.progress;
DROP POLICY IF EXISTS "Users can delete own progress" ON public.progress;

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


-- ----------------------------------------------------------------
-- ポリシー: user_state（DROP → CREATE で冪等化）
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own state"   ON public.user_state;
DROP POLICY IF EXISTS "Users can upsert own state" ON public.user_state;

CREATE POLICY "Users can view own state"
  ON public.user_state FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT / UPDATE / DELETE をまとめて許可
CREATE POLICY "Users can upsert own state"
  ON public.user_state FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
