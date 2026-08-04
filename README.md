# Dify mini Camp

「Difyの学習をDifyを使って行う」AIメンター付き学習プラットフォーム。

## ディレクトリ構成

```
dify_minicamp/
├── front/          # Next.js フロントエンド + APIルート（サーバーサイド）
├── database/       # Supabase スキーマ定義・マイグレーション
│   ├── migrations/ # マイグレーションファイル
│   └── schema/     # テーブル定義SQL
├── other/          # ドキュメント・スクリプト・設定
│   ├── docs/       # 仕様書・設計資料
│   └── scripts/    # デプロイ・運用スクリプト
└── CLAUDE.md       # プロジェクト要件定義（Claude Code用）
```

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | Next.js, Tailwind CSS, shadcn/ui |
| バックエンド | Next.js API Routes / Server Actions |
| データベース / 認証 | Supabase (PostgreSQL, Google Auth) |
| AIエンジン | Dify API |
| ホスティング | Vercel |

## 開発フェーズ

| Phase | テーマ | 形式 |
|---|---|---|
| Phase 1（初級） | LLMの基本とGUI操作 | 一問一答 |
| Phase 2（初中級） | 変数とプロンプトエンジニアリング | 穴埋め・記述式 |
| Phase 3（中級） | 条件分岐とロジック | シナリオ提示式 |
| Phase 4（中上級） | ナレッジ機能と環境変数 | 画像アップロード |
| Phase 5（上級） | オーケストレートと堅牢性 | 実践壁打ち |

## セットアップ

```bash
# フロントエンド
cd front
npm install
npm run dev
```

環境変数は `front/.env.local` に設定（`.env.local.example` を参照）。

## デプロイ

Vercelへの自動デプロイは `main` ブランチへのpushで発動。
