---
type: programming-style
title: "20. Plugins (プラグイン - 動的ローディング)"
description: "プログラムは静的（コンパイル時）に機能の具象実装に依存せず、実行時に構成ファイルをパースし、指定された外部モジュール（プラグイン）を動的インポートして結合・実行するスタイル。"
resource: "../../20-plugins/main.ts"
tags:
  - "exercises-in-style"
  - "programming-style"
  - "reflection-and-metaprogramming"
timestamp: "2026-06-23T22:48:00+09:00"
---

# 20. Plugins (プラグイン - 動的ローディング)

## 制約 (Constraints)
*   **静的依存の排除 (Decoupling Concrete Implementation):**
    メインプログラムは、ビジネスルールや機能の一部（例: 割引計算ロジック）の具象的な実装に対して静的（ビルド時や記述時）に依存（`import` や `require`）しません。
*   **構成ファイルによる制御:**
    どのモジュールを使用するかは、外部の構成ファイル（JSONやINI等）で定義します。
*   **動的なインポート (Dynamic Loading):**
    プログラム起動時または実行中に、構成ファイルに書かれたパスに基づき、プラグインモジュールを動的インポート（`require()` や `import()`）してシステムに組み込みます。

---

## コードの特徴・解説
今回の実装では、`plugin-config.json` を実行時にパースし、割引計算プラグイン `discount-plugin.ts` を動的にロードしています。

*   **設定ファイル `plugin-config.json`:**
    プラグインのロード元ファイルパスを定義します。
    ```json
    {
      "discountPluginPath": "./discount-plugin"
    }
    ```
*   **動的インポート処理:**
    設定をパースし、`path` モジュールで解決した絶対パスに対して `require` を実行し、動的に関数を取り出します。
    ```typescript
    function loadDiscountPlugin(): DiscountPluginFn {
      const configContent = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configContent);
      const pluginModulePath = path.resolve(__dirname, config.discountPluginPath);
      
      // 動的require (ts-node環境により .ts の動的読み込みもサポート)
      const plugin = require(pluginModulePath);
      return plugin.calculateDiscount;
    }
    ```
*   **プラグインのインジェクション:**
    ロードした割引計算関数を `CheckoutService` のコンストラクタで受け取り、ビジネスロジックに適用します。

---

## 自分なりの消化・考察 (Personal Insights)

### 理解のポイント
このスタイルの本質は、**メインコードを一切変更・ビルドすることなく、挙動を拡張したり、実装を差し替えたりできる極限の拡張性（Extensibility）**にあります。
コアシステムは「インターフェース（契約）」だけを定義し、具象実装の読み込みはプラグインシステム（外部構成）に委ねられます。

### 難しかった点 / 気づき
*   **モジュールローダーの挙動と実行環境依存:**
    Node.js において CommonJS の `require` は同期的に動くため扱いやすいですが、ES Modules (`import()`) は非同期の `Promise` を返すため、全体の初期化フローを `async/await` 化する必要があります。今回は ts-node 環境による CommonJS 変換の恩恵を受けて `require` で同期ロードさせ、スッキリとした初期化を実現しました。

### 実務への応用
*   **アドオン / 拡張機能システム:**
    Visual Studio Code, Chrome Extension, WordPress などのアドオン機構は、このプラグインモデルの最たる例です。本体コードは安定させたまま、サードパーティ開発者が作成したプラグインを起動時にスキャン・ロードして機能を動的に拡張します。
*   **マルチテナント対応 SaaS:**
    顧客（テナント）ごとに割引ルールや消費税計算の法制度対応が異なるようなマルチテナントシステムにおいて、テナント固有のコードをプラグインとして分離し、テナント起動時に設定に基づいて動的にロードして機能させる設計に利用されます。

---

## 関連リンク・参考資料
*   本プロジェクトの実装コード: [main.ts](../../20-plugins/main.ts)
*   設定ファイル: [plugin-config.json](../../20-plugins/plugin-config.json)
*   プラグイン実装: [discount-plugin.ts](../../20-plugins/discount-plugin.ts)
*   公式リポジトリの該当実装: [tf-20.py (GitHub)](https://github.com/crista/exercises-in-programming-style/blob/master/20-plugins/tf-20.py)
