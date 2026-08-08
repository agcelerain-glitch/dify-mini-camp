-- ================================================================
-- 03_feedback.sql
-- コース修了フィードバックテーブル
--
-- ■ 実行方法: Supabase SQL Editor に貼り付けて「Run」
-- ■ 冪等性: 何度実行してもエラーにならない設計
-- ■ 前提: 01_users.sql を先に実行済みであること
-- ================================================================

CREATE TABLE IF NOT EXISTS public.feedback (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  phase_id   SMALLINT,
  level_id   SMALLINT,
  page_id    SMALLINT,
  rating     SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can view own feedback"   ON public.feedback;

CREATE POLICY "Users can insert own feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback"
  ON public.feedback FOR SELECT
  USING (auth.uid() = user_id);
