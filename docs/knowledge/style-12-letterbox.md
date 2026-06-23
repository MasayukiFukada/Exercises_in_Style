---
type: programming-style
title: "12. Letterbox (レターボックス - メッセージング)"
description: "直接のメソッド呼び出しを排し、各オブジェクトが持つ唯一の公開インターフェースである `dispatch` へメッセージ（タプル）を送信することで相互作用を行うスタイル。"
resource: "../../12-letterbox/main.ts"
tags:
  - "exercises-in-style"
  - "programming-style"
  - "objects-and-interaction"
timestamp: "2026-06-23T22:25:00+09:00"
---

# 12. Letterbox (レターボックス - メッセージング)

## 制約 (Constraints)
*   **直接のメソッド呼び出しの禁止:**
    オブジェクトが持つ個別の具象メソッド（例: `addItem()`, `checkout()`）を外部から直接呼び出すことはできません。
*   **単一のエントリーポイント (Letterbox):**
    各オブジェクトは、メッセージを受信するための唯一の公開インターフェース（通常は `dispatch` メソッド）のみを持ちます。
*   **メッセージによる通信:**
    すべての対話は、「メッセージ名」と「引数」のタプル（またはオブジェクト）を `dispatch` に送信することで行われます。オブジェクトは受信したメッセージの内容を自己でパースし、適切な内部処理をトリガーします。

---

## コードの特徴・解説
今回の実装では、アクターモデルのメッセージ受信部に似た `dispatch` メソッドをすべてのクラスに実装しています。

*   **唯一の公開メソッド `dispatch`:**
    オブジェクトとやり取りするコードは、すべて以下のように `dispatch` 経由で行われます。
    ```typescript
    type Message = [string, ...any[]];

    class Product {
      // 外部からアクセスできるのはこのメソッドのみ
      dispatch(message: Message): any {
        const [action, ...args] = message;
        switch (action) {
          case 'get_name': return this.name;
          case 'get_price': return this.price;
          case 'decrease_stock': // 在庫減算ロジック...
          // ...
        }
      }
    }
    ```
*   **メッセージチェーンによる結合:**
    ショッピングカートの追加やチェックアウト処理の中でも、依存オブジェクトへのアクセスは `item.dispatch(['get_product']).dispatch(['get_id'])` のように、メッセージ送信のチェーニングによって記述されています。

---

## 自分なりの消化・考察 (Personal Insights)

### 理解のポイント
このスタイルの本質は、**オブジェクト間の結合度（Coupling）を極限まで下げること**です。
直接メソッドを呼び出す場合、呼び出し元は相手がそのシグネチャのメソッドを持っていることを知っている必要がありますが、メッセージングでは「この名前のメッセージを解釈できるはずだ」という緩い仮定（動的バインディング）に基づきます。これはアラン・ケイが提唱した「メッセージングを中心としたオブジェクト指向（Smalltalkスタイル）」そのものです。

### 難しかった点 / 気づき
*   **静的型付けとの葛藤:**
    TypeScript (または任意の静的型付け言語) においてこのスタイルを適用すると、メッセージ引数の型が `any` や `unknown` になりがちで、IDEによる補完やコンパイル時の型検証の恩恵が受けにくくなります。実務で適用する場合は、判別可能なユニオン型（Tagged Union）としてメッセージを定義することで、型安全性を担保しつつメッセージ駆動にすることができます。
*   **カプセル化の強化:**
    外部に対してインターフェースを完全に隠せるため、カプセル化自体は非常に強力になります。

### 実務への応用
*   **アクターモデル（Akka等）やマイクロサービス:**
    メッセージキューを介した非同期メッセージ送信や、別プロセスで動くサービス間でネットワーク越しにリクエストを投げ合うような分散システム設計の基本概念と全く同一です。
*   **Redux / State Management (Flux アーキテクチャ):**
    UIの状態管理において、状態オブジェクトにメソッドを定義して変更するのではなく、`dispatch({ type: 'ADD_ITEM', payload: product })` というメッセージ（Action）を投げて状態を遷移させる現代のフロントエンド設計にも強く根付いています。

---

## 関連リンク・参考資料
*   本プロジェクトの実装コード: [main.ts](../../12-letterbox/main.ts)
*   公式リポジトリの該当実装: [tf-12.py (GitHub)](https://github.com/crista/exercises-in-programming-style/blob/master/12-letterbox/tf-12.py)
