-- ================================================================
-- 07_rate_limits.sql
-- APIレートリミット管理テーブル
--
-- ■ 実行方法: Supabase SQL Editor に貼り付けて「Run」
-- ■ 冪等性: 何度実行してもエラーにならない設計
-- ■ このファイルが行うこと
--   1. bug_reports に「自分の報告件数を読める」SELECTポリシーを追加
--   2. api_rate_limits テーブルを作成（/api/dify 用ウィンドウカウント）
-- ================================================================

-- ① bug_reports に SELECT ポリシーを追加（レートリミット確認用）
DROP POLICY IF EXISTS "Users can read own bug reports" ON public.bug_reports;
CREATE POLICY "Users can read own bug reports"
  ON public.bug_reports FOR SELECT
  USING (auth.uid() = user_id);

-- ② APIレートリミットテーブル（ウィンドウ開始時刻 + リクエスト数）
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint     TEXT        NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  req_count    INTEGER     NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, endpoint)
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own rate limits" ON public.api_rate_limits;
CREATE POLICY "Users can manage own rate limits"
  ON public.api_rate_limits FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
