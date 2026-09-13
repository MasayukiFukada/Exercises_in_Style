---
type: programming-style
title: "47. Functional Core, Imperative Shell (FCIS / 純粋コア・命令的シェル)"
description: "すべてのビジネスロジックを副作用ゼロ・不変の純粋関数群（Functional Core）に集約し、I/Oと状態変更を外側の薄いシェル（Imperative Shell）に厳密に隔離するスタイル。"
resource: "../../47-functional-core-imperative-shell/main.ts"
tags:
  - "exercises-in-style"
  - "programming-style"
  - "architecture"
  - "functional-programming"
  - "prompt-caching"
timestamp: "2026-09-13T21:30:00+09:00"
---

# 47. Functional Core, Imperative Shell (FCIS / 純粋コア・命令的シェル)

## 制約 (Constraints)
1. **Functional Core (純粋コア) の隔離**:
   - カート計算、在庫検証、割引適用、チェックアウト・レシート作成などのすべてのビジネスロジックは、引数のみに依存し、副作用を持たない「純粋関数（Pure Function）」で構成する。
   - 既存オブジェクトの破壊的変更（Mutation）を固く禁じ、常に新しい不変データ（Immutable Data）を生成して返却する。
   - 例外のスロー（throw）や `console.log`、I/O処理を行わず、成功と失敗は Result 型などの純粋な値として表現する。
2. **Imperative Shell (命令的シェル) の薄さ**:
   - システムの外側（Boundary）に位置し、状態の保持、標準入出力（コンソール表示）、外部ストレージ連携などの副作用を排他的に担当する。
   - シェル自体は複雑な条件分岐やドメイン判定を持たず、コアの純粋関数を呼び出して新しい状態を受け取り、画面やログに反映するだけの薄い「糊（Glue）」として振る舞う。

---

## コードの特徴・解説
- **副作用の完全追放 (`FunctionalCore`)**:
  `addToCart` や `checkout` は純粋関数として実装されており、外部状態（グローバル変数や現在時刻、コンソール）を参照・変更しません。結果は `{ ok: true, value } | { ok: false, error }` の形式で返されるため、モックを用意せずとも100%確定的な単体テストが可能です。
- **薄い外殻 (`ShoppingAppShell`)**:
  カートの状態（`AppState`）の保持と `console.log` によるレシート印刷・エラー表示はシェルが一元管理します。シェルは Core から返ってきた計算結果をコンソールに出力し、新しい不変状態に差し替えるだけです。

---

## 自分なりの消化・考察 (Personal Insights)

### 1. 理解のポイント: なぜ今、FCIS なのか？
Gary Bernhardt氏が提唱したクラシックな設計原則ですが、**最新のAI駆動開発・プロンプトキャッシング（Prompt Caching）の時代において、最も経済的かつ壊れにくい最強のアーキテクチャ**として再評価されています。
- **プロンプトキャッシュ（KVキャッシュ）の最大化**:
  純粋関数群（Core）は環境や時刻に依存しないため、AIプロンプトの先頭（静的コンテキスト）に配置してもキャッシュを一度も無効化させません。
- **AIによるテスト自動生成の信頼性**:
  副作用（I/O）が混ざったコードは、AIがテストコードを書く際にモック作成でハルシネーションを起こしがちですが、純粋関数であれば入力と出力のペアを検証するだけの頑健なテストを瞬時に生成できます。

### 2. 既存スタイルとの対比
- **`06. Pipeline` との違い**:
  Pipelineは一連のデータフローを上流から下流に直列に流すことに特化していましたが、FCISは「システム全体の構造」として、副作用を持つ境界（シェル）と副作用のない心臓部（コア）を二層に切り離すアーキテクチャ的な制約です。
- **`25. Quarantine` との違い**:
  Quarantineはモナド（IOモナド等）の型システムで副作用を隔離・遅延評価していましたが、FCISはモナドのような高階の数学的抽象を強制せず、純粋な関数と外側の手続き型コードという直感的な境界づけを行います。

### 3. 実務への応用
- **Webフロントエンド (React / Redux / Zustand)**:
  Reducer（純粋コア）と Component/Effect（命令的シェル）の分離そのものです。
- **バックエンド・クリーンアーキテクチャ**:
  ドメインエンティティ・ユースケース（純粋関数）と、コントローラ/リポジトリ/Presenter（シェル）の分離に対応します。

---

## 関連リンク・参考資料
- [実装コード (main.ts)](../../47-functional-core-imperative-shell/main.ts)
- [Project Setup & Specification (共通仕様)](project-setup.md)
