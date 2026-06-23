---
type: programming-style
title: "24. Intention-Revealing (意図開示 / 型注釈)"
description: "暗黙的な型推論を完全に排除し、変数、定数、引数、戻り値のすべてに明示的な型注釈（Type Annotations）を記述してプログラムの意図を明快に示すスタイル。"
resource: "../../24-intention-revealing/main.ts"
tags:
  - "exercises-in-style"
  - "programming-style"
  - "adversity"
timestamp: "2026-06-23T22:45:00+09:00"
---

# 24. Intention-Revealing (意図開示 / 型注釈)

## 制約 (Constraints)
*   **明示的な型注釈の強制:**
    プログラム内のすべての変数、定数、関数の引数、関数の戻り値、およびクラスのプロパティに対して、明示的な型注釈（Type Annotations）を記述しなければなりません。
*   **型推論の禁止:**
    コンパイラによる暗黙的な型推論（例: `const a = 1;` などの型省略）に依存することを禁止します。
*   **ドメイン型の開示:**
    単なる `string` や `number` といった汎用的なプリミティブ型をそのまま引き回すのではなく、ドメインに合わせたエイリアス（例: `ProductId`, `Money`）やインターフェースを明示的に宣言し、そのデータが何を表しているのかという「意図（Intention）」を型定義そのもので表します。

---

## コードの特徴・解説
今回の実装では、TypeScript の型アノテーションを限界まで記述し、ループカウンタやアロー関数の引数・戻り値にも漏れなく型を定義しています。

*   **ドメイン特化型エイリアスの定義:**
    ```typescript
    type ProductId = string;
    type Price = number;
    type Quantity = number;
    type Money = number;
    ```
*   **徹底された型注釈:**
    以下のように、アロー関数や配列の探索結果、ループ時のカウンタ変数に対しても厳格に型を指定しています。
    ```typescript
    const existing: CartItem | undefined = this.items.find((item: CartItem): boolean => {
      return item.product.id === product.id;
    });

    for (let i: number = 0; i < len; i += 1) {
      const item: CartItem = items[i];
      // ...
    }
    ```

---

## 自分なりの消化・考察 (Personal Insights)

### 理解のポイント
このスタイルの本質は、**コードそのものを「型契約」を通じてセルフドキュメンテーション（自己説明的）化すること**です。
型推論は記述を楽にしますが、コードを閲覧する開発者はコンパイラのように頭の中で型を推論しなければなりません。すべての型が明文化されていることで、ドメイン上のデータの境界（何が `Money` で何が `Quantity` なのか）や関数の挙動がコードを読んだ瞬間に明確に開示されます。

### 難しかった点 / 気づき
*   **冗長性と可読性のバランス:**
    何でもかんでも型をアノテーションするため、コードの記述量（ボイラープレート）が非常に多くなり、一見すると冗長に感じられます。しかし、これは「一度書けば何度も読まれるコード」において、読み手の負担を最小限に抑えるための有効なトレードオフとなります。

### 実務への応用
*   **DDDにおけるドメイン値オブジェクト:**
    ただの `number` や `string` の代わりに、型によるカプセル化（プリミティブオブセッションの回避）を徹底し、ドメインの誤用（例: `ProductId` を `OrderId` として引数に渡してしまうなど）をコンパイル時点で100%防ぐ型安全設計に繋がります。
*   **厳格なチームルール (Linterの強制):**
    TypeScriptプロジェクトにおいて ESLint の `@typescript-eslint/typedef` や `@typescript-eslint/explicit-function-return-type` ルールを強制することで、型アノテーション漏れを防ぎ、プロジェクト全体の品質と可読性を高く均一に保ちます。

---

## 関連リンク・参考資料
*   本プロジェクトの実装コード: [main.ts](../../24-intention-revealing/main.ts)
*   公式リポジトリの該当実装: [tf-24.py (GitHub)](https://github.com/crista/exercises-in-programming-style/blob/master/24-intention-revealing/tf-24.py)
