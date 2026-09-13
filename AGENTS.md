# プロジェクトガイドライン (Project Guidelines)

## 1. プロジェクト概要（Overview）
書籍『プログラミングの文体練習（Exercises in Programming Style）』に登場する様々なプログラミングスタイルをTypeScriptで実装・分析し、**自分なりにまとめ直すことで、パラダイムや制約についての理解を深め、消化しやすくすること**を目的としたプロジェクトです。
- 参照元: [exercises-in-programming-style (GitHub)](https://github.com/crista/exercises-in-programming-style)

---

## 2. 開発環境・技術スタック
* **言語**: TypeScript (Node.js 20系)
* **ランタイム管理**: `mise` (バージョン固定は `.mise.toml`)
* **動作検証コマンド**: `mise exec -- npx ts-node <各スタイルディレクトリ>/main.ts`
* **検証用共通シナリオ**: [docs/knowledge/project-setup.md](docs/knowledge/project-setup.md)（ECショッピングカートの共通実行ストーリー）

---

## 3. ドキュメントと知識の管理 (OKFの適用)
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
   - ドキュメント内のあらゆるファイルリンク（実装コードや他ドキュメントへの参照など）は、絶対パスではなく、必ずドキュメントからの**相対パス**で記述してください。

---

## 4. プロジェクトの進捗状況と引き継ぎ事項

### 実装完了済みスタイル一覧
* **Part I: Historical** (01. Good Old Times, 02. Go Forth)
* **Part II: Basic Styles** (03. Arrays, 04. Monolith, 05. Cookbook, 06. Pipeline, 07. Code Golf)
* **Part III: Function Composition** (08. Infinite Mirror, 09. Kick Forward, 10. The One)
* **Part IV: Objects and Object Interaction** (11. Things, 12. Letterbox, 13. Closed Maps)
* **Part V: Object Reflection** (14. Abstract Things, 15. Hollywood, 16. Bulletin Board, 17. Introspective, 18. Reflective, 19. Aspects, 20. Plugins)
* **Part VI: Adversity** (21. Constructivist, 22. Tantrum, 23. Passive-Aggressive, 24. Intention-Revealing, 25. Quarantine)
* **Part VII: Data-Centric** (26. Persistence, 27. Spreadsheet, 28. Lazy Rivers)
* **Part VIII: Concurrency** (29. Actors, 30. Dataspaces, 31. MapReduce, 32. Hadoop)
* **Part IX: Interactivity** (33. Trinity, 34. RESTful)
* **Part X: Machine Learning / Neural Networks** (35. Shallow Dense, 36. Training Shallow Dense, 37. Bowtie, 38. NeuroMonolith, 39. Sliding Window, 40. Recurrent, 41. Convolutions)
* **Extra / Additional**: (42. Point-Free, 43. Event Sourcing, 44. Tail Recursive, 45. Logic Programming, 46. Reactive Streams, 47. Functional Core Imperative Shell, 48. Agentic Tool Use)
  * *※全48スタイル（本家41 ＋ 独自追加7）の実装 (`main.ts`)、OKFドキュメント化、インデックス登録、動作検証が完了しています。*

### 今後のアクション
* 全48スタイル（本家41 ＋ 独自追加7）の実装とドキュメント化、および2026年秋版再評価ドキュメントの作成が完了しています。
* 今後はリファクタリング、テストの追加、パフォーマンス改善、さらなる新しいエージェント・分散パターンの検証などを進めることが可能です。

---

> [!NOTE]
> AIエージェントのペルソナ設定、プラグイン連携、クイックコマンド等の動作規約は [.agents/AGENTS.md](.agents/AGENTS.md) に定義されています。
