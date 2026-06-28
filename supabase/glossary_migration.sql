-- ===================================================
-- 用語集テーブル
-- ===================================================
CREATE TABLE IF NOT EXISTS glossary_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term TEXT NOT NULL,
  reading TEXT NOT NULL,
  definition TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('権利関係', '宅建業法', '法令上の制限', '税・その他')),
  example TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE glossary_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "glossary_select" ON glossary_terms
  FOR SELECT TO authenticated USING (true);

-- ===================================================
-- 問題報告テーブル
-- ===================================================
CREATE TABLE IF NOT EXISTS question_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('問題文が不明瞭', '正解・解説が誤り', '選択肢に問題あり', 'その他')),
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'fixed', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE question_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_insert" ON question_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reports_select_own" ON question_reports
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
