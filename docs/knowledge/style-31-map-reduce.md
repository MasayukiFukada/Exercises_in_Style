---
type: programming-style
title: "31. MapReduce (マップリデュース)"
description: "命令的なループ制御（for, while）を禁止し、すべてのデータ変換（map）と集約・集計（reduce）の2段階の関数適用のみでデータ処理を記述するスタイル。"
resource: "../../31-map-reduce/main.ts"
tags:
  - "exercises-in-style"
  - "programming-style"
  - "concurrency"
timestamp: "2026-06-23T23:05:00+09:00"
---

# 31. MapReduce (マップリデュース)

## 制約 (Constraints)
*   **命令的ループ（for, while）の禁止:**
    データを走査して合計金額を求めたり、表示用テキストを整形して繋いだりする際の手続き的な繰り返し構文を完全に禁止します。
*   **データの射影と畳み込みのみ:**
    処理の流れは、データを個別に変換する `map`（入力配列と同数の要素を持つ配列を返す）と、それらを1つの値（数値や結合された文字列など）に畳み込む `reduce` の2つの独立した関数のみで記述します。

---

## コードの特徴・解説
今回の実装では、JavaScript/TypeScript の `Array.prototype.map` と `Array.prototype.reduce` を駆使し、ループを使わずにすべての集計と出力を記述しています。

*   **MapReduce による小計の合計金額計算:**
    ```typescript
    getSubtotal(): number {
      // 1. Map: 各アイテムを金額（小計）へ変換
      const itemSubtotals = this.items.map((item) => item.product.price * item.qty);
      // 2. Reduce: 配列を合計値へ畳み込む
      return itemSubtotals.reduce((acc, val) => acc + val, 0);
    }
    ```
*   **文字列結合によるカタログ出力:**
    商品を文字列配列に `map` し、それを1つの巨大な改行区切りテキストに `reduce` して一気に出力します。
    ```typescript
    const lines = this.products.map(p => `[${p.id}] ${p.name} / ...`);
    const output = lines.reduce((acc, line) => acc + line + "\n", "=== 商品カタログ ===\n");
    console.log(output + "===================\n");
    ```

---

## 自分なりの消化・考察 (Personal Insights)

### 理解のポイント
このスタイルの本質は、**データ処理を「個別の変形（並列処理可能）」と「集計（マージ）」に完全に分解することで、超並列化に対応しやすくする点**にあります。
手続き型ループでは「ループ全体の共有変数（インデックスや累計値）」が状態として残りますが、MapReduceでは個々のデータに対する `map` 処理は完全に独立しており、任意の順序・並列スレッドで実行できます。

### 難しかった点 / 気づき
*   **副作用の表現:**
    「在庫を減算する」という状態変化（副作用）を MapReduce に当てはめる場合、本来の MapReduce は純粋関数であることが前提であるため不自然になりがちです。今回は「在庫を減算する副作用を行う `map`」を実行し、ダミー値で `reduce` して畳み込むアプローチをとっています。関数型プログラミングにおいて、副作用（状態書き換え）をどのようにうまく隔離して畳み込むべきかという設計課題を考えさせられます。

### 実務への応用
*   **ビッグデータ処理 (Google MapReduce, Apache Hadoop):**
    ペタバイト級のログファイルを数千台のサーバーに分散し、各サーバーでログをパース（Map）し、最終的にエラー回数をカウント（Reduce）して集約する分散システムの基盤となっています。
*   **データベースの集計クエリ (MongoDB MapReduce):**
    NoSQL データベースにおいて、ドキュメントの高度な集計やパイプライン処理を行う際の標準的なアプローチです。

---

## 関連リンク・参考資料
*   本プロジェクトの実装コード: [main.ts](../../31-map-reduce/main.ts)
*   公式リポジトリの該当実装: [tf-31.py (GitHub)](https://github.com/crista/exercises-in-programming-style/blob/master/31-map-reduce/tf-31.py)
