---
type: programming-style
title: "17. Introspective (イントロスペクティブ - 内省)"
description: "実行時にオブジェクトや関数のプロパティ、メソッド、型情報（クラス名など）を動的に検査（内省）し、そのメタ情報に基づいて処理やメソッド実行を決定するスタイル。"
resource: "../../17-introspective/main.ts"
tags:
  - "exercises-in-style"
  - "programming-style"
  - "reflection-and-metaprogramming"
timestamp: "2026-06-23T22:39:00+09:00"
---

# 17. Introspective (イントロスペクティブ - 内省)

## 制約 (Constraints)
*   **実行時型・構造検査:**
    プログラムは実行時にオブジェクトが何のクラスであるか（型）、またどのようなプロパティやメソッドを持っているかを自己走査して検査し、動作を決定します。
*   **静的メンバアクセスの最小化:**
    呼び出し元はオブジェクトのメソッドやプロパティを直接ハードコードして呼ぶのではなく、属性やメソッドの存在確認を行い、文字列キーなどを介して動的にアクセス・実行します。
*   **動的なプロパティ走査:**
    オブジェクトの情報の出力やダンプ時、フィールド名をハードコードして取得するのではなく、実行時にプロパティ一覧（`Object.keys` 等）をループして抽出します。

---

## コードの特徴・解説
今回の実装では、TypeScript の実行時評価機能（`in` 演算子、`typeof`、`Object.getPrototypeOf`、`Object.getOwnPropertyNames`）を利用して内省スタイルをシミュレートしています。

*   **動的実行ヘルパー `runMethod`:**
    オブジェクトに対して静的にメソッドを呼び出す代わりに、実行時にメソッドの存在やそれが関数であるかを検査した上で呼び出します。
    ```typescript
    function runMethod(target: any, methodName: string, ...args: any[]): any {
      if (typeof target !== 'object' || target === null) throw new Error(...);
      if (!(methodName in target)) {
        const className = Object.getPrototypeOf(target)?.constructor?.name || 'Unknown';
        throw new Error(`クラス ${className} にメソッド '${methodName}' は存在しません。`);
      }
      return target[methodName](...args);
    }
    ```
*   **プロパティの動的走査:**
    `Catalog.print()` メソッドでは、商品のゲッターを呼ぶのではなく、オブジェクトのプロパティ一覧をループで回して動的に値を取得し表示しています。
    ```typescript
    for (const key of Object.getOwnPropertyNames(p)) {
      const val = (p as any)[key];
      // keyと値を利用してフォーマット
    }
    ```

---

## 自分なりの消化・考察 (Personal Insights)

### 理解のポイント
このスタイルの本質は、**プログラムが自分自身の構造（メタデータ）を「データ」として読み解き、それに従って動的に処理を組み立てること**です。
静的型付けの世界では「コンパイル時にすべてが決まっている」ことが好まれますが、動的なインスペクションを用いることで、未知のオブジェクトに対しても柔軟に適応できるプログラムが書けます。

### 難しかった点 / 気づき
*   **型安全性とのトレードオフ:**
    すべてのオブジェクト呼び出しを `runMethod(obj, 'name', args)` に置き換えると、コンパイラはメソッド名のスペルミスや引数の型違いを検知できなくなります。実務においては、過度な動的呼び出しは避け、フレームワークのコア部分（DIコンテナ、シリアライザなど）に限定して利用するのが一般的です。
*   **JavaScriptのプロパティの挙動:**
    TypeScriptの `readonly` プロパティやゲッターなどは、実行時には通常のオブジェクトプロパティやプロトタイプ上のディスクリプタとして扱われるため、内省を行う際はそれらがどのように格納されているか（OwnPropertyなのかプロトタイプ上のプロパティなのか）を正確に把握しておく必要があります。

### 実務への応用
*   **オブジェクトのリフレクション / シリアライザ:**
    オブジェクトをJSONやXMLなどのテキストフォーマットに自動変換するシリアライザは、オブジェクト内のキーと値のペアを動的に検査（内省）することで、どんなクラスであっても汎用的にシリアライズ処理を行います。
*   **依存性注入 (DI) コンテナ:**
    Angular, NestJS, Spring Boot などのDIコンテナは、実行時（または起動時）にクラスのコンストラクタ引数の型やデコレータ（メタデータ）を内省し、必要な依存関係を動的に解決してインスタンスを組み立てて注入します。

---

## 関連リンク・参考資料
*   本プロジェクトの実像コード: [main.ts](../../17-introspective/main.ts)
*   公式リポジトリの該当実装: [tf-17.py (GitHub)](https://github.com/crista/exercises-in-programming-style/blob/master/17-introspective/tf-17.py)
