---
type: programming-style
title: "32. Hadoop (ハドゥープ / ダブルMapReduce)"
description: "前段の MapReduce が生成した中間結果データをそのまま後段の MapReduce の入力として渡し、複数のステージを連結（マルチステージ化）して複雑な処理を実現する MapReduce パイプラインスタイル。"
resource: "../../32-hadoop/main.ts"
tags:
  - "exercises-in-style"
  - "programming-style"
  - "concurrency"
timestamp: "2026-06-23T23:08:00+09:00"
---

# 32. Hadoop (ハドゥープ / ダブルMapReduce)

## 制約 (Constraints)
*   **マルチステージ MapReduce:**
    単一の MapReduce だけで処理を終わらせず、複数の独立した MapReduce 処理（ステージ）を連結させます。
*   **中間データのパイプライン伝播:**
    ステージ $N$ の Reduce 処理の出力である中間データ構造（Hadoop における HDFS の一時ファイルに相当）が、ステージ $N+1$ の Map 処理の入力としてそのままパイプライン転送され、最終結果が組み立てられます。

---

## コードの特徴・解説
今回の実装では、チェックアウト処理を「ステージ1（集計と割引適用）」と「ステージ2（レシート整形と在庫引き落とし）」の2つの明確な MapReduce サイクルに分離し、パイプライン接続しています。

*   **ステージ1 (計算と割引の決定):**
    各アイテムを `sub`（小計）を含む構造に Map し、Reduce で小計・割引を計算して `Stage1Output` を出力します。
*   **ステージ2 (表示と在庫更新):**
    ステージ1の出力 `Stage1Output` を受け取り、明細テキストの Map と、在庫変更命令（Deduction）への Map を行い、最後の Reduce 処理でコンソール出力と在庫更新のコミットを実行します。
    ```typescript
    // ステージ1の出力をステージ2のMapに入力
    const stage2Map = {
      lines: stage1Reduce.items.map(item => `...`),
      deductions: cart.items.map(item => ({ ... })),
      // ...
    };
    ```

---

## 自分なりの消化・考察 (Personal Insights)

### 理解のポイント
このスタイルの本質は、**複雑な処理を小分けにしたシンプルな MapReduce ステージの「数珠繋ぎ」としてモデル化すること**です。
1つの MapReduce で無理やりすべて（計算、フォーマット、在庫更新）を終わらせようとすると、Reduce 関数が非常に複雑になってしまいます。ステージを分割し、前段の出力（一時データ）を後段の入力に繋ぐことで、個々のステージを極めてシンプルかつ疎結合に保つことができます。

### 難しかった点 / 気づき
*   **データ構造のインターフェース契約:**
    前段と後段が疎結合になる代わり、その境界を流れる中間データ（`Stage1Output`）の型構造を厳密に取り決める必要があります。この設計が崩れるとパイプライン全体が動作しなくなります。

### 実務への応用
*   **大規模データパイプライン (ETL 処理):**
    AWS EMR, Apache Spark, Google Cloud Dataflow などのビッグデータ処理において、DBやストレージから抽出した生データをクレンジング（ステージ1：MapReduce）し、集計（ステージ2：MapReduce）し、機械学習の特徴量に変換して書き戻す（ステージ3：MapReduce）といった一連のワークフロー設計のベースとなっています。
*   **CI/CD パイプラインやビルドタスク:**
    前段のビルド成果物（アーティファクト）を、次のテストステージやデプロイステージの入力として引き継ぐパイプライン構造もこれと同一のトポロジー（トポロジカルソートされたステージ実行）に基づいています。

---

## 関連リンク・参考資料
*   本プロジェクトの実装コード: [main.ts](../../32-hadoop/main.ts)
*   公式リポジトリの該当実装: [tf-32.py (GitHub)](https://github.com/crista/exercises-in-programming-style/blob/master/32-hadoop/tf-32.py)
