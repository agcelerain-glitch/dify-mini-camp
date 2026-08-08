# Changelog

このファイルはプロジェクトの変更履歴を記録します。
形式は [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/) に準拠。

---

## [Unreleased]

---

## [0.7.0] - 2026-08-08

### Added
- **Phase 4 Level 4「HTTPリクエストノードで外部APIと連携する」を新規追加**（6ページ構成）
  - P1 インプット: 概念・HTTPメソッド6種・変数挿入（`/`ピッカー）・パラメータセクション・出力変数4種（body/status_code/headers/files）
  - P2 アウトプット: JSONレスポンス活用クイズ（`body`は文字列型→コード実行ノードで`json.loads()`が必要な点を問う）
  - P3 インプット: 認証4種（No Auth/API Key/Bearer Token/Basic Auth）・ボディ6種・SSL証明書確認・cURLインポート・SSRFプロテクション解説
  - P4 アウトプット: 認証設定とAPIキー管理（multi-select・すべて選択・5択/正解3）
  - P5 アウトプット: SSRFプロテクション仕組みクイズ（multiple-choice・SSRF語義の誤認誘導を含む）
  - P6 アウトプット: 課題提出（chat）
- **Phase 5 Level 2（id=3）「イテレーションとループ — 繰り返し処理を使いこなす」を新規追加**（5ページ構成）
  - P1 インプット: イテレーション（for-each型）vs ループ（while型）の比較表・item/index変数・並列モード・エラー処理3種・ループ変数・終了条件を解説
  - P2 アウトプット: 使い分け判断クイズ（multiple-choice）
  - P3 インプット: バッチ処理・品質改善ループの実践パターン・並列モードの順序注意点・判断フロー
  - P4 アウトプット: イテレーション/ループの特徴確認（multi-select・すべて選択・5択/正解3）
  - P5 アウトプット: 課題提出（chat）
- **採点ルーブリック追加** — `other/_code_rubric_choice.txt` に 4-4・5-1・5-3・5-2 を追記

### Changed
- **Phase 4-2-4: 記述式 → multi-select（2/6択）に変更**
  - タイトル「記述問題：環境変数の問題点を発見せよ」→「問題発見クイズ：ソースコードへのAPIキー直書き（複数選択）」
  - `short-answer` → `multi-select`・6択（正解2：push漏洩リスク・git履歴残存リスク）
- **Phase 4-3-4: multi-select を4択→5択に拡張、表記を「すべて選んでください」に変更**
  - 引っかけ選択肢「入力変数の型は文字列と数値の2種類のみ」を追加（実際はリスト/オブジェクトも対応）
  - ヒントにデータ型の補足を追記
- **Phase 4 Level 4 P1/P3: UIキャプチャ（2026-08-08撮影）を反映**
  - 変数挿入方法を`{{変数名}}`直書きから`/`を入力してピッカー選択に修正
  - パラメータ（クエリパラメータ）セクションを追記
  - 出力変数の型表記をUI実表示（string/number/object/Array[File]）に統一
  - ボディタイプに`x-www-form-urlencoded`を追加、`raw-text`→`raw`に修正
  - SSL証明書を確認するトグルとcURLからインポート機能を追記
- **Phase 5 Level 1 タイトル変更**：「並列処理と高度なオーケストレーション」→「並列処理とおさらい」
- **旧 Phase 5 Level 2（id=2、セキュリティと本番設計）が表示上 Level 3 に後退**（IDは変更なし）
- **採番テーブル更新** — Phase 4 Level 4・Phase 5 Level 2(id=3) の次IDを追記

---

## [0.6.0] - 2026-08-08

### Added
- **Phase 3 Level 3「人間の入力ノードで承認フローを作る」を新規追加**（5ページ構成）
  - P1 インプット: 概念解説・Workflow/Chatflow 両対応・開始ノードとの違い・チャットボット非対応の注記
  - P2 インプット: フォーム設定・ボタン配信・タイムアウト・下流変数の使い方
  - P3 アウトプット: 選択式クイズ（WorkflowとChatflowの両方で使える点を正解に）
  - P4 アウトプット: マルチセレクト（動的埋め込み・タイムアウト設定が正解）
  - P5 アウトプット: 課題提出（チャット形式）
- **Phase 4 Level 3「コード実行ノードでデータ処理を自動化する」を新規追加**（5ページ構成）
  - P1 インプット: 概念・Python/JavaScript 対応・ユースケース・AI自動生成機能
  - P2 インプット: 設定手順・消費税計算 Python 例・サンドボックス制限表
  - P3 アウトプット: 選択式クイズ（外部 HTTP リクエストが禁止されている点を正解に）
  - P4 アウトプット: マルチセレクト（辞書キー一致必須・AI生成機能ありが正解）
  - P5 アウトプット: 課題提出（チャット形式）
- **採点ルーブリック追加** — `other/_code_rubric_choice.txt` に 3-3・4-3 を追記
- **Phase 4 L1 P2: Dify Cloud 無料枠情報を追補** — Sandbox プランの上限（50ファイル・50MB）を Step 2 のヒントブロック直後に追記
- **チャット textarea にフローティングラベルデザインを導入**
  - 入力前はテキストエリア内に薄く表示、フォーカス時に上枠へスムーズアニメーション（200ms transition）
  - 全 chat 形式ページで `メンターに話しかける... (Enterで送信 / Shift+Enterで改行)` に統一
- **ヒント2プルダウンを新設**（課題提出ページのうち記入例があった9ページ）
  - `chatPlaceholder` として隠れていた記入例を `hint2` フィールドに移植
  - オレンジ色のプルダウン「ヒント2（困ったら）を見る ▼」で表示・非表示を切り替え、最初は非表示
- **採点ボタン上のテキストを改善** — 「採点されない場合は、もう一度内容を送ってから下のボタンを押してみてください。」を追加し、AI 判定に詰まったユーザーを誘導

### Changed
- **Phase 4 L2 P1: `.env.local` 記載例を汎用化**
  - Supabase 固有変数（`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`）を例から削除し Dify 関連変数のみに整理
  - `NEXT_PUBLIC_` 説明テーブルを「変数名の形式 / アクセス可能な場所 / 用途の例」の汎用形式に変更
  - クイズの変数名例も汎用形式に更新
- **`chatPlaceholder` フィールドを `hint2` にリネーム**（`OutputPage` 型定義・全データ）

### Fixed
- **ページクリア時の DB 保存を `await` 化** — `completePage` / `completeLevel` を async に変更し、Supabase upsert の完了を待ってから画面遷移。失敗時はエラーメッセージ（赤テキスト）を表示
- **キャンプページのボタン表示を `pct === 100` 判定に統一** — 進捗100%のフェーズは全フェーズで「復習する」ボタンに切り替わるよう修正（Phase 1 のみ適用されていたバグを解消）
- **レベルブロック・ホームページのチェックマークを `pct === 100` 判定に統一** — `isLevelCleared` / `isPhaseCleared`（`clearedAt` タイムスタンプ依存）から進捗率ベース判定に切り替え、DB 不整合があっても正しく表示
- **Phase 3 L3 P1: チャットボット非対応の注記を追加** — 「チャットボット（ワークフロー機能なし）では利用できない」旨を blockquote で明記
- **Phase 3 L3 P3: クイズ正解を修正** — 「Workflowアプリ専用」→「WorkflowとChatflowの両方で使える」に訂正
- **`phases-data.ts` バッククォートエスケープ漏れを修正** — 4-2-1 説明文中の `` `NEXT_PUBLIC_` `` が未エスケープでテンプレートリテラルを途中終端させビルドエラーになっていた問題を修正

---

## [0.5.0] - 2026-08-08

### Added
- **Phase 3 Level 1: 変数集約器ページ新規追加**（id:7、表示P3）— Variable Aggregator の役割・パイプライン図・接続手順を解説
- **Phase 3 Level 1 P5: マルチセレクト形式に変更** — 6択から正しいものを2つ選ぶ形式（クラス分類クイズ）。選択・未選択・誤選択を色分けフィードバック
- **Phase 4 Level 1 P2: ナレッジ作成手順を刷新** — 「ホーム→スタジオ→ナレッジ」のサイドバー案内、右上「＋作成」→「すぐに使えるナレッジベースを作成」→ `.txt` アップロード→プロジェクト名設定の手順に更新
- **Phase 4 Level 1: ナレッジ設定タブ詳細ページ新規追加**（id:7、表示P3）— 内部4タブ（ドキュメント・パイプライン・検索テスト・設定）の説明、設定タブ全項目の表形式解説（チャンク構造・インデックス方法・埋め込みモデルエラー対処・トップK・スコア閾値）
- **Phase 4 Level 1 P5: マルチセレクト形式に変更** — RAGとナレッジ設定の正誤判断（6択・正解2つ）
- **採点ルーブリック追加** — `other/_code_rubric_choice.txt` に Phase 3（3-1・3-2）・Phase 4（4-1・4-2）を追記
- **CLAUDE.md: コンテンツ追加ルール**セクション追加 — ID採番ルール・堅牢化ロジック変更禁止事項・コミット前チェックリスト
- **phases-data.ts: 全フェーズの ID 採番管理テーブル**をファイル冒頭コメントに追加 — 使用済みID一覧と次回採番IDを明示

### Changed
- **Phase 3 Level 2**: IF/ELSE サンプルとブロック名例をクレーム対応Bot テーマに統一（旧: Dify mini Camp 固有例）
- **Phase 3 Level 2**: キャンバス操作のキーボードショートカット表に `H`（ハンド）・`V`（ポインター）・マウスホイール長押し・`Ctrl+O`（ノード整理）を追加

### Fixed
- **全体進捗計算をページ単位に変更** — `ProgressContext` / `home/page.tsx` / `camp/page.tsx` のすべてでフェーズクリア数ベース→全ページID照合方式に統一
- **home/page.tsx 分数表記修正** — 「X / 5 フェーズ完了」→「XX / YY ページ完了」
- **`isPageUnlocked`**: クリア済みページは `clearedAt` に関係なく常にアンロック（コンテンツ途中挿入後の誤ロック防止）
- **`isLevelUnlocked`**: クリア済みレベルは常にアンロック、さらに `currentPhase > phaseId` の場合は全レベルを解放（`level_cleared_at` DB不整合によるロックバグ修正）
- **`getLevelProgress` / `getPhaseProgress`**: `clearedPages.length` ベース→ページID照合方式に変更（ID非連続・途中挿入でも正確）
- **PhaseContent.tsx ページ番号表示**: `page.id` → 配列インデックス+1 に統一（サイドバー・タブバー・パンくず・ページヘッダー4箇所）
- **Phase 3 L1→L2 遷移**: `goToLevel(currentLevelId + 1)` → `nextLevel.id`（配列インデックスベース）に修正し、ID非連続でも正しく遷移
- **`completeLevel` ページループ**: 連番ID仮定 → `level.pages.forEach(page => ...)` に修正
- **Phase 3 Level 1 ページID整合性**: 変数集約器ページに新規ID(7) を割り当て、既存ページのID(3・4・5) を保持してDB `clearedPages` との整合性を維持

### Added
- 全コードブロックにコピーボタン（`CopyableCodeBlock` コンポーネント）を追加 — クリックで内容をクリップボードへコピー、2秒後に「コピー」表示に戻る
- **選択肢のランダムシャッフル** — 全フェーズ・全レベルの選択式クイズで、ページ切替・レベル切替・リロードのたびに選択肢の並び順をランダム化。`useMemo([currentPageIndex, currentLevelId])` で制御し、正解が常に1番目に固定されるマンネリを解消
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
