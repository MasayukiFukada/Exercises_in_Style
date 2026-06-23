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
*   **Part IV: Objects and Object Interaction** (11. Things, 12. Letterbox, 13. Closed Maps)
*   **Part V: Object Reflection** (14. Abstract Things, 15. Hollywood, 16. Bulletin Board, 17. Introspective, 18. Reflective, 19. Aspects, 20. Plugins)
*   **Part VI: Adversity** (21. Constructivist, 22. Tantrum, 23. Passive-Aggressive, 24. Intention-Revealing, 25. Quarantine)
*   **Part VII: Data-Centric** (26. Persistence, 27. Spreadsheet, 28. Lazy Rivers)
*   **Part VIII: Concurrency** (29. Actors, 30. Dataspaces, 31. MapReduce, 32. Hadoop)
*   **Part IX: Interactivity** (33. Trinity, 34. RESTful)
*   **Part X: Machine Learning / Neural Networks** (35. Shallow Dense, 36. Training Shallow Dense, 37. Bowtie, 38. NeuroMonolith, 39. Sliding Window, 40. Recurrent, 41. Convolutions)
    *   *※すべてのスタイル（01〜41）について、実装 (`main.ts`)、OKFドキュメント化、インデックスへの登録が完了しており、一括実行での動作検証にも成功しています。*

### 3. 次回のアクション
*   『プログラミングの文体練習（Exercises in Programming Style）』の書籍に登場する全41種類のプログラミングスタイルの実装とドキュメント化はすべて完了しました。
*   次のステップとして、ユーザーに全体のふりかえり・総括を行うか、あるいは別のシナリオや追加の拡張（例: 新たなスタイルの設計など）を行うかを確認してください。
