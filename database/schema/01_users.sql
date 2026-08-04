-- ================================================================
-- 01_users.sql
-- ユーザーテーブル（Supabase Auth + Google OAuth 連携）
--
-- ■ 実行方法: Supabase SQL Editor に貼り付けて「Run」
-- ■ 冪等性: 何度実行してもエラーにならない設計
-- ■ 再利用: このファイルはアプリ非依存。
--           他の e-learning プロジェクトでも変更不要。
-- ================================================================


-- ----------------------------------------------------------------
-- テーブル作成（既存の場合はスキップ）
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id           UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username     TEXT,
  display_name TEXT,       -- Google の表示名が入る
  avatar_url   TEXT,       -- Google のプロフィール画像 URL
  email        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);


-- ----------------------------------------------------------------
-- Row Level Security（有効化は冪等 = 何度実行してもOK）
-- ----------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;


-- ----------------------------------------------------------------
-- ポリシー（DROP → CREATE で冪等化）
-- ポリシーは CREATE OR REPLACE が使えないため、先に DROP する
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile"   ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);


-- ----------------------------------------------------------------
-- トリガー: Google OAuth ログイン時に users へ自動挿入
-- CREATE OR REPLACE FUNCTION は冪等
-- トリガー自体は DROP → CREATE で冪等化
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, display_name, avatar_url, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
