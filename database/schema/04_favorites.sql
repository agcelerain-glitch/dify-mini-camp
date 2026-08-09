-- ================================================================
-- 04_favorites.sql
-- お気に入りページテーブル
--
-- ■ 実行方法: Supabase SQL Editor に貼り付けて「Run」
-- ■ 冪等性: 何度実行してもエラーにならない設計
-- ■ 前提: 01_users.sql を先に実行済みであること
-- ================================================================

CREATE TABLE IF NOT EXISTS public.favorites (
  id         UUID     DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID     NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  phase_id   SMALLINT NOT NULL,
  level_id   SMALLINT NOT NULL,
  page_id    SMALLINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, phase_id, level_id, page_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can view own favorites"   ON public.favorites;

CREATE POLICY "Users can manage own favorites"
  ON public.favorites FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
