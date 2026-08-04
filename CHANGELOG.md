# Changelog

このファイルはプロジェクトの変更履歴を記録します。
形式は [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/) に準拠。

---

## [Unreleased]

### Added
- 全コードブロックにコピーボタン（`CopyableCodeBlock` コンポーネント）を追加 — クリックで内容をクリップボードへコピー、2秒後に「コピー」表示に戻る
- **Phase 2 Level 2「LLMのAPI接続 — Geminiで無料利用」を新規追加**（5ページ構成）
  - P1 インプット: LLMブロックとAPIキーの仕組み（Difyクレジット問題・Geminiの無料枠を解説）
  - P2 インプット: Google AI Studio（aistudio.google.com）でのGemini APIキー取得手順
  - P3 インプット: DifyのモデルプロバイダーにGemini APIキーを登録しLLMブロックで選択する手順
  - P4 アウトプット: 確認クイズ（選択式）
  - P5 アウトプット: 課題提出（チャット形式）
- **チャットボットマスター表示** — ホームページで全5フェーズ完了（進捗100%）時に専用カードを表示
  - ウェルカムカードの「学習中」表記 → 「🏆 チャットボットマスター として全フェーズ制覇！」に変化
  - 「現在学習中」カード → 「どのフェーズを復習する？」カードに切り替わりPhase 1〜5の復習ボタンを表示

### Changed
- Phase 1 Level 1 Page 3 のサンプルプロンプトを猫型AIロボット「ニャコボット」キャラクターに変更（語尾「ニャーです」追記・キャラクター設定・対応範囲を充実化）
- レベル最終ページの完了ボタンを押した後、「次のレベルへ →」または「次のフェーズへ →」ボタンが出現するフローに変更（最終フェーズ完了時は「全コース完了！」）
- **Phase 2 の旧 Level 2「高度なプロンプト設計」を Level 3 に昇格**（Gemini API Level を Level 2 として先に学ぶ構成に変更）
- Phase 2 の所要時間を「1.5時間」→「2時間」に更新（Level 追加に伴う調整）

### Fixed
- **ファビコンが Vercel の▲マークになる問題を修正** — `public/favicon.ico` を Next.js App Router の特殊ファイルとして `app/favicon.ico` にも配置し、シークレットモード含むすべての環境で正しいアイコンが表示されるよう対応

---

## [0.4.1] - 2026-08-04

### Fixed
- **DBスキーマの冪等化** — `01_users.sql` / `02_progress.sql` ともにポリシーを `DROP POLICY IF EXISTS → CREATE POLICY` パターンに変更し、何度実行してもエラーにならない設計に修正
- `01_users.sql` のトリガーを `CREATE OR REPLACE TRIGGER` から `DROP TRIGGER IF EXISTS → CREATE TRIGGER` に変更（より明示的な冪等化）
- `02_progress.sql` の `phase_id` / `current_phase` のCHECK制約から `BETWEEN 1 AND 5` を除去し、他プロジェクトでもそのまま再利用できる汎用設計に変更

### Changed
- `database/schema/README.md` を全面改訂 — 冪等性の仕組み・再利用方法・テーブル構造をまとめた完全版ドキュメントに更新

---

## [0.4.0] - 2026-08-04

### Added
- **Favicon 完全対応** — layout.tsx の metadata.icons に favicon.ico / PNG 各サイズ / apple-touch-icon を設定
- **PWA manifest.json 作成** — `front/public/manifest.json` を追加。名前・テーマカラー・アイコン・言語（ja）・display: standalone を設定
- **テーブルのMarkdownレンダリング修正** — `remark-gfm` を導入し、`|パイプ|` 記法を正しくHTMLテーブルにパース
- **テーブルデザイン刷新** — グラデーションヘッダー・ホバーエフェクト・カラム間セパレーターなど、デザイン性の高いテーブルスタイルに更新
- **Supabase DB スキーマ更新** — Phase/Level/Page 3階層対応に再設計（`progress` + `user_state` テーブル）
- **ユーザー自動作成トリガー追加** — Google OAuth ログイン時に `public.users` へ自動挿入するトリガーを `01_users.sql` に追加
- **todo02.txt 作成** — Supabase/Dify API 連携の次ステップを詳細に記述（STEP A〜H）

---

## [0.3.0] - 2026-08-04

### Changed
- **ページ遷移後スクロールトップを実装** — `useEffect`でページ/レベル切替時に`contentRef`とwindow両方をスクロールトップ。`id="page-top"`アンカーを追加。
- **アウトプット問題を大幅増量**（各レベル最低2問体制）
  - Phase 1 Level 1: 1問 → 2問（システムプロンプトの役割クイズ追加）
  - Phase 3 Level 1: 2問 → 3問（分類クラス設計の記述問題追加）
  - Phase 3 Level 2: 1問 → 3問（IF/ELSE vs 分類器クイズ・条件分岐選択問題追加）
  - Phase 4 Level 1: 1問 → 4問（RAGの仕組みクイズ・インデックスモードクイズ・RAGユースケース記述問題追加）
  - Phase 4 Level 2: 2問 → 4問（環境変数問題発見記述問題・NEXT_PUBLIC_クイズ追加）
  - Phase 5 Level 1: 2問 → 4問（並列処理設計記述問題・変数集約器クイズ追加）
  - Phase 5 Level 2: 2問 → 4問（インジェクション対策クイズ・システムプロンプト強化記述問題追加）
- **estimatedTimeを更新** — 問題数増加に合わせてPhase 3 Lv2・Phase 4・Phase 5の各レベルの所要時間を更新

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
