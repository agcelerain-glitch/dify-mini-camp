# やることリスト（開発ロードマップ）

## ステップ 0：プロジェクト基盤（手動作業あり）

- [ ] **GitHubリポジトリを作成する**
  - https://github.com/new でリポジトリ作成（名前例: `dify-minicamp`）
  - `Public` or `Private` を選択
  - ローカルに git init してリモートを設定:
    ```bash
    cd H:\_business_system\dify_minicamp
    git init
    git remote add origin https://github.com/<yourname>/dify-minicamp.git
    git add .
    git commit -m "chore: initial project structure"
    git push -u origin main
    ```

- [ ] **Supabaseプロジェクトを作成する**（手動）
  - https://supabase.com/dashboard でプロジェクト作成
  - プロジェクトURL・anon key・service_role keyを控える

- [ ] **Vercelプロジェクトを作成する**（手動）
  - https://vercel.com でGitHubリポジトリをインポート
  - ルートディレクトリを `front` に設定

---

## ステップ 1：フロントエンド環境構築

- [ ] Next.jsプロジェクトをセットアップ
  ```bash
  cd front
  npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false
  ```
- [ ] shadcn/ui をインストール
  ```bash
  npx shadcn@latest init
  ```
- [ ] `.env.local` を作成（`.env.local.example` をコピーして値を設定）
- [ ] Supabase クライアントライブラリをインストール
  ```bash
  npm install @supabase/supabase-js @supabase/ssr
  ```

---

## ステップ 2：認証・DB連携

- [ ] Supabase Google OAuth を設定する（Supabaseダッシュボード > Authentication > Providers）
- [ ] `database/schema/` のSQLをSupabase SQL Editorで順番に実行
  1. `01_users.sql`
  2. `02_progress.sql`
- [ ] Next.jsにSupabase認証フローを実装
  - ログインページ
  - セッション管理（middleware.ts）

---

## ステップ 3：Dify API連携

- [ ] Dify側で「AIメンター」ワークフローを構築する（手動）
  - Phase 1 用の一問一答フロー
  - 正誤判定ロジック
- [ ] DifyアプリのAPIキーを Vercel 環境変数に設定（`DIFY_API_KEY`）
- [ ] `front/app/api/chat/route.ts` にDify中継APIルートを実装

---

## ステップ 4：チャットUIの実装

- [ ] チャット画面コンポーネントを実装（`components/chat/`）
- [ ] フェーズ進行UIを実装（`components/phase/`）
- [ ] Phase 1 の一問一答フローをE2Eで動作確認

---

## ステップ 5：テスト・デプロイ

- [ ] Vercel環境変数を本番用に設定
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `DIFY_API_KEY`
- [ ] `main` ブランチにpushしてVercel自動デプロイを確認
- [ ] テストユーザーでα版テスト

---

## Phase 2〜5（将来）

- [ ] Phase 2: 変数・プロンプトエンジニアリング画面
- [ ] Phase 3: 条件分岐シナリオ画面
- [ ] Phase 4: 画像アップロード対応
- [ ] Phase 5: トラブルシューティングモード
