-- ================================================================
-- 05_bug_reports.sql
-- バグ報告テーブル
--
-- ■ 実行方法: Supabase SQL Editor に貼り付けて「Run」
-- ■ 冪等性: 何度実行してもエラーにならない設計
-- ■ 前提: 01_users.sql を先に実行済みであること
-- ■ 閲覧: ユーザーは INSERT のみ可。開発者は Supabase Studio で確認
-- ================================================================

CREATE TABLE IF NOT EXISTS public.bug_reports (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject    TEXT        NOT NULL,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own bug reports" ON public.bug_reports;

CREATE POLICY "Users can insert own bug reports"
  ON public.bug_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);
