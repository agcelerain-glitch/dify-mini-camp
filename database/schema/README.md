# Database Schema

Supabase (PostgreSQL) のテーブル定義。

## 実行順序

```
01_users.sql → 02_progress.sql
```

**Supabase SQL Editor** で上記の順に内容を貼り付けて「Run」するだけで完了します。

---

## ファイル一覧

| ファイル | 作成テーブル | 概要 |
|---|---|---|
| `01_users.sql` | `public.users` | ユーザー情報 + Google OAuth 自動登録トリガー |
| `02_progress.sql` | `public.progress`, `public.user_state` | Phase/Level/Page の学習進捗 |

---

## 冪等性（何度実行してもOK）

両ファイルとも **冪等設計** になっています。

| 要素 | 対策 |
|---|---|
| テーブル | `CREATE TABLE IF NOT EXISTS` でスキップ |
| ポリシー | `DROP POLICY IF EXISTS` → `CREATE POLICY` で上書き |
| 関数 | `CREATE OR REPLACE FUNCTION` で上書き |
| トリガー | `DROP TRIGGER IF EXISTS` → `CREATE TRIGGER` で上書き |

→ 既存プロジェクトに再実行しても、テーブルやデータは消えずエラーも出ません。

---

## 他の e-learning プロジェクトへの再利用

### 01_users.sql
変更不要。アプリ非依存の汎用設計です。

### 02_progress.sql
Phase/Level/Page の階層構造はそのまま使えます。
コース・章・モジュールなど呼び名が違っても、カラム名（`phase_id` / `level_id`）はそのまま利用できます。

カスタマイズが必要な箇所:

```sql
-- phase_id の上限をフェーズ数に合わせて変更（現在は上限なし）
phase_id SMALLINT NOT NULL CHECK (phase_id >= 1)

-- 5フェーズ固定にしたい場合:
phase_id SMALLINT NOT NULL CHECK (phase_id BETWEEN 1 AND 5)
```

---

## 旧スキーマからの移行

`todo01.txt` の 2-2 で作成したシンプルな `progress` テーブルが残っている場合、
構造が異なるため一度削除してから `02_progress.sql` を実行します。

```sql
-- SQL Editor で先に実行（既存データは消えます）
DROP TABLE IF EXISTS public.progress CASCADE;
```

その後 `02_progress.sql` を実行。

---

## テーブル構造

### `public.users`
| カラム | 型 | 説明 |
|---|---|---|
| `id` | UUID | Supabase Auth の `auth.users.id` と同一 |
| `display_name` | TEXT | Google の表示名 |
| `avatar_url` | TEXT | Google のプロフィール画像 URL |
| `email` | TEXT | メールアドレス |

### `public.progress`
| カラム | 型 | 説明 |
|---|---|---|
| `user_id` | UUID | users.id への外部キー |
| `phase_id` | SMALLINT | フェーズ番号（1〜） |
| `level_id` | SMALLINT | レベル番号（1〜） |
| `cleared_pages` | SMALLINT[] | クリア済みページ ID の配列 |
| `current_page` | SMALLINT | 現在のページ番号 |
| `level_cleared_at` | TIMESTAMPTZ | レベルクリア日時 |
| `phase_cleared_at` | TIMESTAMPTZ | フェーズクリア日時 |

### `public.user_state`
| カラム | 型 | 説明 |
|---|---|---|
| `user_id` | UUID | users.id（主キー兼外部キー） |
| `current_phase` | SMALLINT | 現在学習中のフェーズ番号 |
| `current_level` | SMALLINT | 現在学習中のレベル番号 |
