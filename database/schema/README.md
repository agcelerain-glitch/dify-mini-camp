# Database Schema

Supabase (PostgreSQL) のテーブル定義。

## テーブル一覧

| ファイル | 作成テーブル | 概要 |
|---|---|---|
| `01_users.sql` | `public.users` | ユーザー情報（Google OAuth ログイン時に自動作成） |
| `02_progress.sql` | `public.progress`, `public.user_state` | Phase/Level/Page の学習進捗 |

## 適用順序

```
01_users.sql → 02_progress.sql
```

## Supabase SQL Editor での適用方法

1. Supabase ダッシュボードを開く
2. 左サイドバー「SQL Editor」→「New query」
3. 各ファイルの内容をコピー＆ペーストして「Run」

## ⚠️ todo01.txt 2-2 で既に progress テーブルを作成済みの場合

既存テーブルの構造が異なるため、一度削除して再作成が必要。

```sql
-- SQL Editor で先に実行（既存データは消えます）
DROP TABLE IF EXISTS public.progress CASCADE;
```

その後 `02_progress.sql` を実行する。

## テーブル構造（概要）

### public.users
- Google OAuth ログイン時にトリガーで自動作成
- `auth.users` を参照する（Supabase 標準設計）

### public.progress
- `(user_id, phase_id, level_id)` の組み合わせが一意
- `cleared_pages[]` に完了したページIDを格納
- `level_cleared_at` / `phase_cleared_at` でクリア日時を管理

### public.user_state
- ユーザーが「今どのフェーズ・レベルにいるか」を記録
- ログイン時にフロントエンドがここを参照して学習を再開する
