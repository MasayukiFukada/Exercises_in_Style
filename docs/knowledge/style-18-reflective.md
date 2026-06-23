---
type: programming-style
title: "18. Reflective (リフレクティブ - 自己変更 / 動的評価)"
description: "ビジネスルールや検証ロジック、出力書式などのプログラムの振る舞いを実行時に文字列コードから動的に生成・コンパイル（`new Function`）して実行するスタイル。"
resource: "../../18-reflective/main.ts"
tags:
  - "exercises-in-style"
  - "programming-style"
  - "reflection-and-metaprogramming"
timestamp: "2026-06-23T22:42:00+09:00"
---

# 18. Reflective (リフレクティブ - 自己変更 / 動的評価)

## 制約 (Constraints)
*   **動的なコード生成と評価 (Dynamic Evaluation):**
    プログラムの一部（割引ルール、在庫検証、合計計算、文字列フォーマット出力など）を、実行時にコード表現（文字列）から動的にコンパイルして実行します。
*   **静的ロジックの排除:**
    主要な計算規則や出力のテンプレートはプログラムコードに静的（コンパイル時）にハードコーディングせず、文字列として定義したものを実行時に評価エンジン（例: `new Function` や `eval`）に渡して評価します。

---

## コードの特徴・解説
今回の実装では、JavaScript/TypeScript ランタイムが持つ動的コード生成機能である `new Function` を使用して、各ビジネスロジックを実行時にビルドする構成にしています。

*   **動的コンパイルヘルパー `compileFunction`:**
    パラメータ名とコード文字列を渡し、実行時に動的に関数オブジェクトをビルドします。
    ```typescript
    function compileFunction(paramNames: string[], codeStr: string): Function {
      try {
        return new Function(...paramNames, codeStr);
      } catch (err: any) {
        throw new Error("コンパイルエラー...");
      }
    }
    ```
*   **ビジネスルールのメタ定義:**
    在庫の十分性チェックや、割引金額の計算、およびレシートのフォーマット文字列生成といったドメインの核心ルールが、すべて文字列として定義され、実行時にコンパイルされています。
    ```typescript
    // カート追加時の在庫検証ロジックを動的生成
    const checkStockCode = `
      return stock >= (currentInCart + requestQty);
    `;
    const hasEnoughStock = compileFunction(['stock', 'currentInCart', 'requestQty'], checkStockCode);
    ```

---

## 自分なりの消化・考察 (Personal Insights)

### 理解のポイント
このスタイルの本質は、**プログラム自身の処理ルールが実行時に決定・定義される「自己書き換え性」**にあります。
通常のプログラムはビルド時点で挙動が固定されますが、リフレクティブな設計では実行時に環境や入力、ルールファイルの変更に応じて、システム自身が動的にコードを書き換えて動作します。

### 難しかった点 / 気づき
*   **変数のスコープと再宣言エラー:**
    `new Function('stock', 'currentInCart', ..., code)` のようにコンパイルする際、関数本体（`code`）の中で `const stock = arguments[0]` のように引数名と同じ変数宣言を行ってしまうと、識別子の重複によるランタイムエラーになります。引数としてリストしたパラメータ名は、コンパイル後の関数スコープ内でそのままローカル変数として利用できるため、余計な宣言を排除するようコード文字列をクリーンに保つ必要があります。
*   **デバッグの困難さ:**
    `new Function` 内でエラーが発生した場合、スタックトレースが `eval` や `anonymous` になり、通常のIDEのソースコード上の行数と一致しないため、デバッグの難易度が非常に上がります。エラーハンドリングと丁寧なコードダンプが必須になります。

### 実務への応用
*   **動的テンプレートエンジン (EJS, Lodash.template など):**
    HTMLテンプレートをパースし、実行時に `new Function` を使って高速な描画用JavaScript関数へ変換（コンパイル）する仕組みは、まさにこのリフレクティブな設計そのものです。
*   **数式評価エンジン / ルールエンジン:**
    管理画面などからユーザーが入力した任意の計算式（例: `A + B * 0.1`）を実行時に安全に構文解析し、JavaScriptコードに変換して実行する用途で広く使われています。

---

## 関連リンク・参考資料
*   本プロジェクトの実装コード: [main.ts](../../18-reflective/main.ts)
*   公式リポジトリの該当実装: [tf-18.py (GitHub)](https://github.com/crista/exercises-in-programming-style/blob/master/18-reflective/tf-18.py)
