---
type: programming-style
title: "15. Hollywood (ハリウッド - 制御の反転)"
description: "「Don't call us, we'll call you」（こちらから電話するな、必要ならこちらからかける）に従い、下位コンポーネントが処理完了時に事前に登録されたコールバックやイベントハンドラーをトリガーすることで全体の制御フローを駆動させる制御の反転（IoC）スタイル。"
resource: "../../15-hollywood/main.ts"
tags:
  - "exercises-in-style"
  - "programming-style"
  - "objects-and-interaction"
timestamp: "2026-06-23T22:33:00+09:00"
---

# 15. Hollywood (ハリウッド - 制御の反転)

## 制約 (Constraints)
*   **「Don't call us, we'll call you」の原則:**
    上位コンポーネントやメインルーチンが下位オブジェクトの処理を呼び出して同期的に実行結果を待つ（返り値を受け取って次の処理へ進む）という制御フローを禁止します。
*   **コールバック / イベントハンドラーによる駆動:**
    すべてのオブジェクトは、処理が完了した段階で事前に登録されたコールバック（または通知イベント）を駆動することによってのみ次のフェーズに制御を引き渡します。
*   **制御の反転 (IoC):**
    アプリケーションの具体的な進行フローは、オブジェクト内の直列処理ではなく、フレームワーク（またはイベントマネージャ）へのコールバックの登録と発火の連鎖によって構築されます。

---

## コードの特徴・解説
今回の実装では、`HollywoodApp` というシンプルなイベントハンドラ管理オブジェクトを用意し、各エンティティ（`Catalog`, `ShoppingCart`, `CheckoutService`）は自分自身に依頼された仕事が終わったら `app.trigger` を通して後続に処理を通知する構成にしています。

*   **イベント登録と完了通知:**
    各クラスはコンストラクタで必要なリクエストイベント（例: `request_catalog_print`）を登録し、自身の処理が完了すると完了通知イベント（`onCompleteEvent`）をトリガーします。
    ```typescript
    class Catalog {
      constructor(products: Product[], private app: App) {
        this.app.register('request_catalog_print', (onCompleteEvent: string) => this.print(onCompleteEvent));
      }

      private print(onCompleteEvent: string): void {
        // カタログ印刷処理...
        // 完了したら引数で指定されたイベントを発行して、次に制御を渡す
        this.app.trigger(onCompleteEvent);
      }
    }
    ```
*   **シナリオのイベントチェーン接続:**
    テストストーリーの進行は、手続き的な順次実行ではなく、各アクションの完了イベントが次のアクションのリクエストをトリガーする「数珠繋ぎ」の構造として表現されています。
    ```typescript
    app.register('start_scenario', () => {
      app.trigger('request_catalog_print', 'initial_catalog_printed');
    });

    app.register('initial_catalog_printed', () => {
      app.trigger('request_product_check', 'PRD-02', 1, 'add_mouse_ok', 'add_mouse_fail');
    });

    app.register('add_mouse_ok', (product: Product, qty: number) => {
      app.trigger('add_item_to_cart', product, qty, 'mouse_added');
    });
    // ...
    ```

---

## 自分なりの消化・考察 (Personal Insights)

### 理解のポイント
このスタイルの本質は、**制御の主体を呼び出し元（Caller）から呼び出される側（Callee）、あるいはフレームワークに移譲する（Inversion of Control）こと**です。
メインプログラムが各オブジェクトのメソッドを順番に呼んで状態を更新していくのではなく、各オブジェクト自身は自分がいつ呼ばれるかを知らず、呼び出されたら処理をして「終わった」と通知するだけに徹します。これにより、オブジェクト同士の同期的な実行フローへの依存関係が消滅します。

### 難しかった点 / 気づき
*   **無限再帰（Stack Overflow）の回避:**
    完了通知イベントを同じ名前空間で安易にグルーピングすると、チェックアウト完了時のカタログ印刷完了が、最初のカタログ印刷完了と同一視されてマウスの追加から再びシナリオが再開するという「無限ループ」に陥ってしまいました。対策として、処理を依頼する際に「完了時にどのイベント名をトリガーするか（コールバック先）」を動的に引数で渡すように設計し、フローを正確に一方向に流す工夫が必要でした。

### 実務への応用
*   **イベントループと非同期I/O:**
    Node.js のプログラム自体がこの「ハリウッドの原則」に基づいています。ファイル読み込みやDBクエリの実行時にコールバック関数を渡し、I/Oが完了した時点でイベントループからコールバックが呼び出されます。
*   **GUI アプリケーション:**
    ボタンのクリックやウィンドウの作成時にイベントリスナーを登録する手法（GUIフレームワークのほとんど）はすべてこのパターンです。

---

## 関連リンク・参考資料
*   本プロジェクトの実装コード: [main.ts](../../15-hollywood/main.ts)
*   公式リポジトリの該当実装: [tf-15.py (GitHub)](https://github.com/crista/exercises-in-programming-style/blob/master/15-hollywood/tf-15.py)
