-- ================================================================
-- 06_notes.sql
-- ユーザーノート・メモテーブル
--
-- ■ 実行方法: Supabase SQL Editor に貼り付けて「Run」
-- ■ 冪等性: 何度実行してもエラーにならない設計
-- ■ 前提: 01_users.sql を先に実行済みであること
-- ================================================================

CREATE TABLE IF NOT EXISTS public.notes (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL DEFAULT '',
  phase_id   SMALLINT,   -- NULL = 全般
  content    TEXT        NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own notes" ON public.notes;

CREATE POLICY "Users can manage own notes"
  ON public.notes FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
