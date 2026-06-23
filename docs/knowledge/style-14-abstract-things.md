---
type: programming-style
title: "14. Abstract Things (抽象的なモノ - ADT)"
description: "具象クラスへの直接依存を禁止し、すべての対話を定義されたインターフェース（抽象データ型 / ADT）を介して行い、インスタンス生成をファクトリに委ねるスタイル。"
resource: "../../14-abstract-things/main.ts"
tags:
  - "exercises-in-style"
  - "programming-style"
  - "objects-and-interaction"
timestamp: "2026-06-23T22:29:00+09:00"
---

# 14. Abstract Things (抽象的なモノ - ADT)

## 制約 (Constraints)
*   **インターフェース定義 (ADT):**
    すべての操作やオブジェクト間の通信は、明示的に定義されたインターフェース（抽象データ型）を通してのみ行われます。
*   **具象クラスへの直接依存の禁止:**
    呼び出し元は具象クラス（`class`）の名前や実装詳細に直接アクセスできません。変数の型はすべてインターフェース型として宣言します。
*   **ファクトリによるインスタンス生成:**
    具象クラスのコンストラクタ（`new` 演算子）の直接呼び出しを禁止し、オブジェクトの構築はファクトリパターン（Factory Pattern）を用いて隠蔽します。

---

## コードの特徴・解説
今回の実装では、TypeScript の `interface` をフルに活用して抽象データ型を表現しています。

*   **インターフェースによる厳密な抽象化:**
    `IProduct`, `ICartItem`, `IShoppingCart`, `ICatalog`, `ICheckoutService` の各インターフェースが定義され、互いの依存関係はすべてインターフェース型になっています。
    ```typescript
    interface IShoppingCart {
      getItems(): readonly ICartItem[];
      addItem(product: IProduct, qty: number): void;
      // ...
    }
    ```
*   **コンストラクタの隠蔽:**
    `StoreFactory` クラスを定義し、具象クラスのインスタンスを生成してインターフェース型として返します。
    ```typescript
    const catalog: ICatalog = StoreFactory.createCatalog([
      StoreFactory.createProduct('PRD-01', 'ノートPC', 100000, 2),
      // ...
    ]);
    ```

---

## 自分なりの消化・考察 (Personal Insights)

### 理解のポイント
このスタイルの本質は、**「インターフェースに対してプログラミングし、実装に対してプログラミングしない」**というオブジェクト指向設計における最も基本的な原則（依存性逆転の原則 - DIP）の徹底です。
これにより、具象クラスの実装がどのように変更されようとも、インターフェースが変わらない限り呼び出し元に影響が及びません。

### 難しかった点 / 気づき
*   **ファクトリの必要性:**
    具象クラスへの依存を完全に排除するためには、オブジェクトを作成する部分も抽象化しなければなりません。そこでファクトリ（またはDIコンテナ）が必要になります。
*   **インターフェースの肥大化:**
    何でもかんでもインターフェースを定義するとファイルが冗長になりがちですが、これによって「システム全体のインターフェース設計（契約）」がコーディングの初期段階で明確になるというメリットがあります。

### 実務への応用
*   **ユニットテストとモック (Mock):**
    ビジネスロジックがインターフェースに依存しているため、データベースや外部APIと連携する部分のモック化が極めて容易になります。例えば、本物の `Product` の代わりに `IProduct` を実装したテスト用のダミーオブジェクトを注入してテストできます。
*   **大規模開発での並行開発:**
    インターフェースさえ最初に定義しておけば、実装クラスが未完成であっても他のメンバーがそのインターフェースを利用した処理を並行して書き進めることができます。

---

## 関連リンク・参考資料
*   本プロジェクトの実装コード: [main.ts](../../14-abstract-things/main.ts)
*   公式リポジトリの該当実装: [tf-14.py (GitHub)](https://github.com/crista/exercises-in-programming-style/blob/master/14-abstract-things/tf-14.py)
