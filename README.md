# 宅建ミニ学習アプリ

通勤・移動中に宅建士試験の問題を短時間で学習できるWebアプリです。

## 機能

- ユーザー登録・ログイン（Supabase Auth）
- ホーム画面（連続学習日数・進捗確認）
- 5問のミニ学習セッション（4択問題）
- 回答後の正解・不正解・解説表示
- 間違えた問題を復習リストに自動保存
- 復習モード（復習リストから出題）
- 学習履歴（回答数・正解率・連続学習日数・7日間グラフ）
- 通知時間設定
- スマホ最適化UI（レスポンシブ・PWA対応）

## 技術構成

| 技術 | 用途 |
|------|------|
| Next.js 14 (App Router) | フレームワーク |
| TypeScript | 型安全 |
| Supabase | DB・認証 |
| Tailwind CSS | スタイリング |
| Vercel | デプロイ |
| lucide-react | アイコン |

---

## ローカル開発セットアップ

### 1. リポジトリのクローン

```bash
git clone <repo-url>
cd takken-study
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. Supabaseプロジェクトの作成

1. [supabase.com](https://supabase.com) にアクセスしてアカウント作成
2. 「New project」でプロジェクトを作成
3. プロジェクトダッシュボードの **Settings → API** から以下を取得：
   - `Project URL`（`NEXT_PUBLIC_SUPABASE_URL`）
   - `anon public key`（`NEXT_PUBLIC_SUPABASE_ANON_KEY`）

### 4. 環境変数の設定

```bash
cp .env.local.example .env.local
```

`.env.local` を編集して値を設定：

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. データベースのセットアップ

Supabaseダッシュボードの **SQL Editor** を開いて、以下を順番に実行します：

#### ① スキーマ作成

`supabase/migrations/001_initial.sql` の内容をコピー＆ペーストして実行

#### ② サンプル問題のseed

`supabase/seed.sql` の内容をコピー＆ペーストして実行

> 💡 **ヒント**: ダッシュボード左側の「SQL Editor」→「New query」に貼り付けて「Run」ボタンを押します

### 6. Email認証の設定（開発用）

開発環境ではメール確認なしでログインできるよう設定することを推奨します：

1. Supabaseダッシュボード → **Authentication → Providers → Email**
2. **「Confirm email」をオフ**にする（開発時のみ）

### 7. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

---

## 画面一覧

| パス | 画面 |
|------|------|
| `/login` | ログイン |
| `/register` | 新規登録 |
| `/home` | ホーム（ダッシュボード） |
| `/study` | ミニ学習セッション |
| `/study?mode=review` | 復習モード |
| `/review` | 復習リスト |
| `/history` | 学習履歴 |
| `/settings` | 設定 |

---

## データベース構成

```
questions         - 問題マスタ（全ユーザー共有）
profiles          - ユーザー設定（通知時間等）
study_sessions    - 学習セッション記録
answer_histories  - 回答履歴
review_list       - 復習リスト（不正解問題）
```

---

## Vercelへのデプロイ

1. GitHubにプッシュ
2. [vercel.com](https://vercel.com) でリポジトリを連携
3. 環境変数（`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`）を設定
4. デプロイ実行

---

## 問題の追加方法

Supabase SQL Editorで以下のようにINSERT文を実行します：

```sql
INSERT INTO questions (question, choices, correct_answer, explanation, category, difficulty, year)
VALUES (
  '問題文をここに記入',
  '["選択肢ア", "選択肢イ", "選択肢ウ", "選択肢エ"]',
  2,       -- 正解のインデックス（0〜3）
  '解説文をここに記入',
  '宅建業法',  -- 権利関係 / 宅建業法 / 法令上の制限 / 税・その他
  2,       -- 難易度（1:易 / 2:普通 / 3:難）
  2023     -- 出題年度（任意）
);
```
