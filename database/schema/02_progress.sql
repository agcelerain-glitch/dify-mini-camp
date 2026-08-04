-- 学習進捗テーブル
CREATE TABLE IF NOT EXISTS public.progress (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  phase        SMALLINT NOT NULL CHECK (phase BETWEEN 1 AND 5),
  cleared_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, phase)
);

-- Row Level Security
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ユーザーは自分の進捗のみ参照可能"
  ON public.progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分の進捗のみ更新可能"
  ON public.progress FOR ALL
  USING (auth.uid() = user_id);
