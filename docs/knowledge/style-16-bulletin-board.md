---
type: programming-style
title: "16. Bulletin Board (掲示板 - イベントバス)"
description: "コンポーネント間の直接参照を完全に排し、中央の掲示板（EventBus）に対するイベント発行（Publish）と購読（Subscribe）のみによってすべてのやり取りを行う疎結合スタイル。"
resource: "../../16-bulletin-board/main.ts"
tags:
  - "exercises-in-style"
  - "programming-style"
  - "objects-and-interaction"
timestamp: "2026-06-23T22:38:00+09:00"
---

# 16. Bulletin Board (掲示板 - イベントバス)

## 制約 (Constraints)
*   **直接参照の禁止:**
    コンポーネント同士が、お互いのクラス名やインスタンスに対する直接の参照（依存関係）を保持することを一切禁止します。
*   **中央の掲示板 (EventBus) を介した通信:**
    すべてのコンポーネント間の対話（データの要求、処理依頼、完了報告など）は、中央の共有オブジェクトである「掲示板」へのイベント発行（Publish）とイベント購読（Subscribe）のみを通じて行われます。
*   **完全な自律性 (疎結合):**
    各コンポーネントは独立して生存し、他に誰がイベントを購読・発行しているかを一切知らずに動作します。

---

## コードの特徴・解説
今回の実装では、グローバルなイベント通信を仲介する `EventBus` クラスを定義し、各コンポーネントはそれ経由で対話します。

*   **中央掲示板 `EventBus` の定義:**
    ```typescript
    class EventBus {
      private static subscribers: Record<string, ((...args: any[]) => void)[]> = {};
      static subscribe(event: string, callback: (...args: any[]) => void): void;
      static publish(event: string, ...args: any[]): void;
    }
    ```
*   **相手を知らないコンポーネント:**
    `CatalogComponent` と `ShoppingCartComponent` は、お互いを全く知りません。
    例えば、ショッピングカートでチェックアウトが発生した際、カートは直接カタログを呼ぶのではなく、「在庫を減算してくれ」というイベントを発行し、処理完了時の「減算が完了した」というイベントを購読して待ちます。
    ```typescript
    // カート側で在庫減算をパブリッシュ
    EventBus.publish('request_stock_reduction', {
      items: reductionItems,
      replyEvent: 'stock_reduced_for_checkout'
    });
    ```

---

## 自分なりの消化・考察 (Personal Insights)

### 理解のポイント
このスタイルの本質は、**依存性の排除による極限の疎結合化（Loose Coupling）**です。
直接の参照（クラスのインポートや型依存）を持たないため、あるコンポーネントを全く別のモジュールに差し替えたり、取り除いたりしても、他のコードがビルドエラーになることはありません。コンポーネントを追加する場合は、単にイベントバスに繋ぐ（subscribeする）だけでシステム全体に組み込むことができます。

### 難しかった点 / 気づき
*   **データのやり取りと非同期的な調整:**
    戻り値を受け取る同期呼び出しが存在しないため、要求イベントを投げる際に「結果をどのイベント名で返してほしいか（`replyEvent`）」をデータと一緒にパブリッシュし、それに応じた一時的なハンドラを登録するという非同期メッセージングと同様の調整が必要になりました。
*   **追跡の困難さ:**
    コードを眺めるだけでは「このイベントを発行したときに、実際に誰が処理するのか」という全体のフローがパッと見えにくくなり（制御が四散する）、デバッグや処理の追跡（Trace）が難しくなる傾向があります。

### 実務への応用
*   **メッセージ駆動アーキテクチャ (EDA):**
    Apache Kafka, RabbitMQ, AWS EventBridge などを利用した分散イベント駆動型マイクロサービスの設計と根本的に同じです。
*   **ドメインイベント (Domain Events):**
    DDDにおいて、ドメインモデル内で発生した状態変更（例: `OrderPlaced` - 注文確定）を外部へ通知する際、関連するコンポーネントへ直接アクセスするのではなく、ドメインイベントを発行して、メール送信や在庫減算といった別の有界コンテキスト（Bounded Context）へ伝播させる手法に活用されます。

---

## 関連リンク・参考資料
*   本プロジェクトの実装コード: [main.ts](../../16-bulletin-board/main.ts)
*   公式リポジトリの該当実装: [tf-16.py (GitHub)](https://github.com/crista/exercises-in-programming-style/blob/master/16-bulletin-board/tf-16.py)
