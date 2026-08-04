-- ユーザーテーブル（Supabase Auth と連携）
CREATE TABLE IF NOT EXISTS public.users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username   TEXT,
  email      TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ユーザーは自分のデータのみ参照可能"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "ユーザーは自分のデータのみ更新可能"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);
