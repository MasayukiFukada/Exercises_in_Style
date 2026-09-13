---
type: programming-style
title: "48. Agentic Tool Use (ReAct / ツール呼び出しスタイル)"
description: "各機能をJSONスキーマと説明文付きのToolとして公開し、エージェントがThought -> Action -> Observationのループで自律実行する、2026年時点のAIエージェント指向スタイル。"
resource: "../../48-agentic-tool-use/main.ts"
tags:
  - "exercises-in-style"
  - "programming-style"
  - "ai-agent"
  - "react-loop"
  - "tool-use"
timestamp: "2026-09-13T21:30:00+09:00"
---

# 48. Agentic Tool Use (ReAct / ツール呼び出しスタイル)

> [!NOTE]
> **【歴史的スナップショットとしての位置づけ】**  
> 本スタイルは、**「2026年秋時点におけるAI自律エージェント指向プログラミングの原点」**を記録したスナップショットです。今後、AIエージェントのプロトコルやフレームワークがさらに進化・変化していくことを見越した上で、「2026年当時のAI駆動開発では、LLMのFunction Calling（Tool Use）やReActループをどのようなコードスタイルとして捉えていたのか」を後から振り返ることができるよう、歴史的文脈とともに定義しています。

---

## 制約 (Constraints)
1. **宣言的ツールレジストリ (Tool Registry)**:
   - アプリケーションが提供する個々の機能（カタログ参照、カート追加、チェックアウトなど）は、手続き的なAPI呼び出しではなく、**名前（name）、自然言語の説明文（description）、引数のJSONスキーマ（parameters）** を備えた「Tool」として宣言・登録される。
2. **制御フローの非ハードコード化 (Goal-Oriented)**:
   - システムを統括するコントローラは、「Aの次にBを実行する」という固定の手続きシーケンス（ハードコードされたフロー）を記述しない。
   - 代わりに、ユーザーからの「自然言語のゴール（目的）」を受け取った自律エージェントが、どのツールをどの順序・引数で呼び出すかを動的に判断する。
3. **ReAct 推論ループ (Thought $\rightarrow$ Action $\rightarrow$ Observation)**:
   - エージェントはゴール達成まで以下のループを自律的に繰り返す：
     - **Thought (思考)**: 現在のコンテキストと目標を言語化・推論する。
     - **Action (行動)**: 実行すべきツールを選択し、引数をJSON形式でディスパッチする。
     - **Observation (観察)**: ツールの実行結果（成功データやエラーメッセージ）を環境から受け取り、次の推論に反映する。

---

## コードの特徴・解説
- **ツールの自己言及性 (`ToolDefinition`)**:
  各ツールは人間だけでなく、LLM（言語モデル）が理解・推論できるよう、セマンティックな説明文（`description`）と厳格なパラメータスキーマ（`ToolParameterSchema`）を保持しています。
- **ReAct ループの実装 (`AutonomousShoppingAgent`)**:
  エージェントはミッション計画を受け取り、ステップごとに `Thought` を内部コンテキストに記録しながら `Action`（ツール呼び出し）を行い、環境からの `Observation`（戻り値）を観察して逐次状態を把握します。
- **プラグイン・拡張性**:
  新しい機能を追加する際は、既存のコントローラコードを変更することなく、ツールレジストリに新しい `Tool` を `register` するだけで、エージェントが自動的にそのツールを認識して利用可能になります。

---

## 自分なりの消化・考察 (Personal Insights)

### 1. 理解のポイント: プログラミングパラダイムの変遷
- かつてのオブジェクト指向や関数型プログラミングは、「人間が決定した制御フロー」をいかに美しく抽象化するか（クラス、ポリモーフィズム、パイプライン、モナド）を探求してきました。
- それに対して本スタイルは、**「制御フローの決定権そのものをエージェント（推論ループ）に委譲する」**というパラダイムシフトを意味します。プログラマの責務は「手順を書くこと」から「堅牢なツール（インターフェースとスキーマ）を定義すること」へと移行しています。

### 2. 他のスタイルとの比較
- **`15. Hollywood (制御の反転)` や `20. Plugins` との違い**:
  Hollywoodスタイルは「フレームワークがコードを呼ぶ（Don't call us, we'll call you）」でしたが、本スタイルでは「推論エンジン（エージェント）がゴール達成のために動的にツールを選択して呼ぶ」という、さらに一段高次の制御の反転です。
- **`47. Functional Core, Imperative Shell (FCIS)` との関係**:
  FCISとAgentic Tool Useは極めて高い相乗効果を持ちます。FCISの「Functional Core」として作られた副作用ゼロの関数群は、そのまま安全な「Tool」としてエージェントに提供するのに最も適した形態です。

### 3. 将来的な変化への見通し
- 2026年時点では、JSON SchemaベースのTool CallingやReActプロンプティングが主流ですが、将来的にはMCP (Model Context Protocol) などの分散エージェント間プロトコルや、推論モデルの内部思考（Native Reasoning）と完全に統合されたランタイムへと進化していくことが予想されます。
- だからこそ、この「Tool Registry」と「ReAct Loop」の素朴なTypeScript実装は、エージェント時代の黎明期を象徴する重要なマイルストーンとなります。

---

## 関連リンク・参考資料
- [実装コード (main.ts)](../../48-agentic-tool-use/main.ts)
- [Project Setup & Specification (共通仕様)](project-setup.md)
- [47. Functional Core, Imperative Shell (FCIS)](style-47-functional-core-imperative-shell.md)
