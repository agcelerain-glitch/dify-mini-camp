# アーキテクチャ設計

## 全体構成図

```
ユーザー(ブラウザ)
    │
    ▼
[Vercel] Next.js フロントエンド
    │  ├── /app             UIコンポーネント (React)
    │  ├── /app/api         APIルート（サーバーサイド専用）
    │  │       └── /chat    → Dify API へ中継
    │  └── Server Actions   → Supabase へアクセス
    │
    ├──────────────────────────────────▶ [Dify API]
    │                                    AIメンターワークフロー
    │
    └──────────────────────────────────▶ [Supabase]
                                         ├── Auth (Google OAuth)
                                         └── PostgreSQL (users, progress)
```

## セキュリティ設計

- **Dify APIキーはサーバーサイドのみ**: `DIFY_API_KEY` は `process.env` 経由でAPIルートのみ参照。フロントエンドの `NEXT_PUBLIC_` プレフィックスは使用禁止。
- **Supabase RLS**: 全テーブルにRow Level Securityを有効化。ユーザーは自分のデータのみアクセス可能。
- **環境変数管理**: Vercel環境変数に設定し、`.env.local` はgit管理外。

## フロントエンド構成（front/）

```
front/
├── app/
│   ├── layout.tsx          ルートレイアウト
│   ├── page.tsx            トップ・ログインページ
│   ├── (auth)/             認証不要ページグループ
│   └── (dashboard)/        認証必要ページグループ
│       └── phase/
│           └── [id]/       各フェーズのチャットUI
├── components/
│   ├── ui/                 shadcn/ui コンポーネント
│   ├── chat/               チャットUI関連
│   └── phase/              フェーズ進行UI関連
├── lib/
│   ├── supabase/           Supabaseクライアント設定
│   └── dify/               Dify API呼び出しユーティリティ
└── types/                  TypeScript型定義
```
