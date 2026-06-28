-- ===================================================
-- 宅建ミニ学習アプリ：初期スキーマ
-- ===================================================

-- questions: 問題マスタ（全ユーザー共有）
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  choices JSONB NOT NULL,
  correct_answer INTEGER NOT NULL CHECK (correct_answer BETWEEN 0 AND 3),
  explanation TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('権利関係', '宅建業法', '法令上の制限', '税・その他')),
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- profiles: ユーザーごとの設定
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  notification_time TEXT DEFAULT '07:30',
  notification_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- study_sessions: 学習セッション
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  question_count INTEGER NOT NULL DEFAULT 5
);

-- answer_histories: 回答履歴
CREATE TABLE IF NOT EXISTS answer_histories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  session_id UUID REFERENCES study_sessions(id) ON DELETE SET NULL,
  is_correct BOOLEAN NOT NULL,
  selected_answer INTEGER NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- review_list: 復習リスト（不正解問題）
CREATE TABLE IF NOT EXISTS review_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- ===================================================
-- Row Level Security (RLS)
-- ===================================================

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_list ENABLE ROW LEVEL SECURITY;

-- questions: 認証ユーザーは誰でも読める
CREATE POLICY "questions_select" ON questions
  FOR SELECT TO authenticated USING (true);

-- profiles
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- study_sessions
CREATE POLICY "sessions_select" ON study_sessions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "sessions_insert" ON study_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sessions_update" ON study_sessions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- answer_histories
CREATE POLICY "answers_select" ON answer_histories
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "answers_insert" ON answer_histories
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- review_list
CREATE POLICY "review_select" ON review_list
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "review_insert" ON review_list
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "review_delete" ON review_list
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===================================================
-- Trigger: 新規ユーザー登録時に profiles を自動作成
-- ===================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
