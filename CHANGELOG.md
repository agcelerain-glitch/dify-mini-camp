# Changelog

このファイルはプロジェクトの変更履歴を記録します。
形式は [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/) に準拠。

---

## [Unreleased]

---

## [0.2.0] - 2026-08-04

### Changed
- **Phase/Level/Page 3階層構造に再設計** — 従来の Phase > Level 構造を Phase > Level > Page に変更
- **Phase 1 Level 1 を新規追加** — チャットボット作成（ノードなし）の5ページ構成
  - Page 1: Difyとは（約1000字の詳細解説）
  - Page 2: チャットボット作成手順（スタジオ→+作成→チャットボット）
  - Page 3: プロンプト入力とテスト（コピペ可能サンプルプロンプト付き）
  - Page 4: チャットボット機能説明（ボタン・利用用途・推奨用途）
  - Page 5: 課題提出（AIメンターとのチャット）
- **Phase 1 Level 2** — 従来のLevel 1〜4をLevelとして再構成（3ブロックワークフロー）
- **Phase 2〜5 全フェーズ実装** — 各フェーズ2レベル×3〜5ページの詳細コンテンツ
- **ロック機能を無効化** — `LOCK_ENABLED=false` ですべてのPhase/Levelに自由アクセス可能
  - Supabase連携時は `phases-data.ts` の `LOCK_ENABLED` を `true` にして再活性化
- **PhaseContent UI 刷新** — レベルサイドバー + ページタブ + ページコンテンツの3ペイン構成
- **進捗管理を Phase/Level/Page 対応に更新** — `mock-store.ts` と `ProgressContext.tsx` を再設計

### Security
- `.gitignore` に `other/` ディレクトリ全体を追加（APIキー・OAuthクレデンシャルの保護）
- `other/` 配下のファイルをgit追跡から除外

---

## [0.1.0] - 2026-08-04

### Added
- プロジェクト初期ディレクトリ構造を作成（`front/`, `database/`, `other/`）
- `README.md` を作成
- `CHANGELOG.md` を作成
- `database/schema/` にテーブル定義SQLを作成
- `.gitignore` を作成
- Next.js 16 + Tailwind CSS + shadcn/ui でフロントエンドを構築
- ランディング・ホーム・キャンプ・フェーズ学習の4ページ実装
- localStorage を使ったモック認証・進捗管理
- 全ページ共通フローティングAIメンターチャットボタン
