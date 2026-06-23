---
type: programming-style
title: "19. Aspects (アスペクト - AOP)"
description: "コアビジネスロジックからロギング、入力値検証、表示などの横断的関心事（Cross-cutting Concerns）を分離し、実行時にデコレータやプロキシを介してアスペクトを動的に織り込む（Weave）スタイル。"
resource: "../../19-aspects/main.ts"
tags:
  - "exercises-in-style"
  - "programming-style"
  - "reflection-and-metaprogramming"
timestamp: "2026-06-23T22:45:00+09:00"
---

# 19. Aspects (アスペクト - AOP)

## 制約 (Constraints)
*   **横断的関心事の完全排除:**
    主要なビジネスエンティティ（クラスやそのメソッド）の中に、ロギング、エラー検証、入力チェック、レシートのフォーマット整形出力といった「横断的関心事（Cross-cutting Concerns）」を直接記述することを禁止します。
*   **アスペクトの動的な織り込み (Weaving):**
    分離された関心事は、アスペクト（Before / After / Around アドバイス）として定義し、コンパイル時または実行時にプロキシ（Proxy）などを介してコアロジックへ動的に織り込みます。
*   **コアロジックの自律性:**
    コアビジネスロジックは、自身がアスペクトによって監視・介入されていることを関知せず、本来の純粋な状態管理と操作のみを記述します。

---

## コードの特徴・解説
今回の実装では、ES6 の `Proxy` を使用してメソッド呼び出しをインターセプトし、アドバイスを動的に適用する AOP エンジン（`weave` 関数）を構築しています。

*   **動的織り込みエンジン `weave`:**
    オブジェクトのメソッド呼び出しをトラップし、登録された `before`, `after`, `around` 処理を自動的に実行します。
    ```typescript
    function weave<T extends object>(target: T, config: AspectConfig): T {
      return new Proxy(target, {
        get(targetObj, prop, receiver) {
          // メソッド呼び出しの前後に advice を挟むプロキシ処理...
        }
      });
    }
    ```
*   **純粋なドメインモデル:**
    `ShoppingCart`, `Catalog`, `CheckoutService` などのコアクラスは、コンソールへのログ出力や在庫数検証、レシート書式作成を一切行わない「極めて純粋なデータ処理」のみを記述しています。
    ```typescript
    class ShoppingCart {
      // 単に追加するだけで、在庫チェックも「[OK] カートに追加」というログも書かない
      addItem(product: Product, qty: number): void {
        const existing = this.items.find(item => item.product.id === product.id);
        if (existing) existing.qty += qty;
        else this.items.push(new CartItem(product, qty));
      }
    }
    ```
*   **アスペクトへの切り出し:**
    「在庫切れならエラーにする（Before）」「正常追加したらログを吐く（After）」「精算時にレシートを描画して在庫を実際に引き落とす（Around）」などの制御はすべてアスペクト側で定義され、実行時に結合されます。

---

## 自分なりの消化・考察 (Personal Insights)

### 理解のポイント
このスタイルの本質は、**単一責任の原則（SRP）をオブジェクト設計から「アスペクトレベル」にまで押し上げ、関心の分離（SoC）を極限まで達成すること**です。
通常の手続き型コードでは「本質的な計算」の周りにロギングやバリデーションコードが何重にも巻き付き、コードの可読性を下げてしまいます。AOPは、それらのノイズをコアロジックから一掃し、コードの保守性を劇的に向上させます。

### 難しかった点 / 気づき
*   **プロキシ内の自己参照（境界）:**
    アスペクト（特に `before` の検証処理）の中で `cart.items` などを参照しようとすると、そのプロパティアクセス自体が `Proxy` を通過し、無限ループや不具合の元になり得ます。実務では、プロキシを適用する前の「オリジナルの実体」への参照（この実装における `receiverCart`）を一時的にアスペクト側で保持し、そこでクエリや検証を行うといったプロキシ境界への配慮が必要です。

### 実務への応用
*   **トランザクション管理と認証:**
    Javaの Spring Framework (`@Transactional` や `@PreAuthorize`) や NestJS の Guards/Interceptors は、まさにこの AOP の実用例です。ビジネスロジックに「DBトランザクションの開始・コミット・ロールバック」を書くことなく、アノテーション/デコレータ1つで背後のアスペクトがトランザクション管理を織り込みます。
*   **アプリケーション・モニタリング (APM):**
    Datadog や New Relic などの監視ツールは、実行時にアプリケーションの各クラスのメソッドにプロファイリング用のアスペクトを動的に織り込むことで、ソースコードを1行も汚すことなくメソッドの実行時間を計測します。

---

## 関連リンク・参考資料
*   本プロジェクトの実装コード: [main.ts](../../19-aspects/main.ts)
*   公式リポジトリの該当実装: [tf-19.py (GitHub)](https://github.com/crista/exercises-in-programming-style/blob/master/19-aspects/tf-19.py)
