# Database Schema

Supabase (PostgreSQL) のテーブル定義。

## テーブル一覧

| ファイル | テーブル名 | 概要 |
|---|---|---|
| `01_users.sql` | `public.users` | ユーザー情報（Supabase Authと連携） |
| `02_progress.sql` | `public.progress` | 各フェーズのクリア状況 |

## 適用方法

Supabase ダッシュボードの **SQL Editor** でファイルを順番に実行する。

```
01_users.sql → 02_progress.sql
```

または Supabase CLI を使う場合:

```bash
supabase db push
```
