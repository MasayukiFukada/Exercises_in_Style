# プロジェクトルール

## プロジェクトの目的
本プロジェクトの最優先事項は、書籍『プログラミングの文体練習（Exercises in Programming Style）』に登場する様々なプログラミングスタイルを実装・分析し、**自分なりにまとめ直すことで、パラダイムや制約についての理解を深め、消化しやすくすること**です。
参照元：[exercises-in-programming-style (GitHub)](https://github.com/crista/exercises-in-programming-style)

---

## ドキュメントと知識の管理 (OKFの適用)
各プログラミングスタイルの分析や考察は、Google が提唱する **OKF (Open Knowledge Format)** に準拠した形式でドキュメント化し、AIエージェントと開発者の双方が理解しやすい形に整理します。

1. **ドキュメントの配置先:**
   - 各スタイルの解説・まとめドキュメントは、プロジェクトルート直下の [docs/knowledge/](docs/knowledge/) ディレクトリ配下に作成・格納してください。
   - ファイル名は `style-XX-style-name.md` のようにナンバリングとスタイル名を含めてください。

2. **テンプレートの利用:**
   - 新しいスタイルをドキュメント化する際は、必ず [.agents/templates/okf_programming_style.md](.agents/templates/okf_programming_style.md) のテンプレートを使用してください。

3. **OKF Frontmatter の必須項目:**
   - `type`: `programming-style` としてください。
   - `title`: スタイルの正式名称（例: "01. Good Old Times"）
   - `description`: そのスタイルの制約や特徴の端的な説明。
   - `resource`: 自身で実装したソースコードへの**相対パス**によるリンク（例: `../../01-good-old-times/main.ts` など）。
   - `tags`: 検索用のタグ（例: `exercises-in-style`, `constraint-programming` など）。

4. **リンクの相対パス原則:**
   - ドキュメント内のあらゆるファイルリンク（実装コードや他ドキュメントへの参照など）は、絶対パス（`file:///...`）ではなく、必ずドキュメントからの**相対パス**で記述してください。

---

## プロジェクトの進捗状況と引き継ぎ事項 (次回アクション用)

### 1. 開発環境
*   **言語:** TypeScript (Node.js 20系)
*   **ランタイム管理:** `mise` (バージョン固定は `.mise.toml`)
*   **動作検証コマンド:** `mise exec -- npx ts-node <各スタイルディレクトリ>/main.ts`
*   **検証用シナリオ仕様:** `docs/knowledge/project-setup.md` に記載（ECショッピングカートの共通実行ストーリー）。

### 2. 現在の進捗 (実装完了済み)
*   **Part I: Historical** (01. Good Old Times, 02. Go Forth)
*   **Part II: Basic Styles** (03. Arrays, 04. Monolith, 05. Cookbook, 06. Pipeline, 07. Code Golf)
*   **Part III: Function Composition** (08. Infinite Mirror, 09. Kick Forward, 10. The One)
    *   *※すべての完了スタイルについて、実装 (`main.ts`)、OKFドキュメント化、インデックスへの登録が完了しています。*

### 3. 次回のアクション
*   **Part IV: Objects and Object Interaction** の最初のスタイル **`11-things`** の設計と実装から再開してください。
