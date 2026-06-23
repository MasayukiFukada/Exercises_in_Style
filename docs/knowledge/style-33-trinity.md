---
type: programming-style
title: "33. Trinity (三位一体 / MVC)"
description: "アプリケーションを Model（データとビジネスロジック）、View（表示）、Controller（ユーザーアクションの処理）に厳密に分離し、Model の状態変更をオブザーバーパターンを介して View に伝播・表示更新させるスタイル。"
resource: "../../33-trinity/main.ts"
tags:
  - "exercises-in-style"
  - "programming-style"
  - "interactivity"
timestamp: "2026-06-23T23:10:00+09:00"
---

# 33. Trinity (三位一体 / MVC)

## 制約 (Constraints)
*   **コアロジックの分離 (Model):**
    Modelはデータとビジネスルールを保持します。View や Controller の仕様に直接依存してはならず、それらの詳細を一切知りません。
*   **出力表現の分離 (View):**
    Viewは画面出力（コンソール表示）を担当します。Model を監視（Subscribe）し、Model のデータ状態に変更があった際は、その通知を受けて自動的に画面を「再描画（レンダリング）」します。
*   **アクション制御の分離 (Controller):**
    Controllerはユーザーのアクション（テストシナリオの指示）を受け取り、Model を更新します。

---

## コードの特徴・解説
今回の実装では、オブザーバーパターンを再現する `Observable` クラスを定義し、Model の更新を View に自動通知する古典的な MVC アーキテクチャを適用しています。

*   **Model から View への自動伝播:**
    `CatalogModel`（商品データ）で在庫が減算されると、リスナーを通じて `CatalogView` の `render()` が自動的にトリガーされ、最新の在庫状況がコンソールに再印刷されます。
    ```typescript
    class CatalogModel extends Observable {
      reduceStock(productId: string, qty: number): void {
        const p = this.findProduct(productId);
        if (p) {
          p.stock -= qty;
          this.notify(); // Viewへ通知して自動再描画
        }
      }
    }
    ```
*   **Controller を介したクリーンな指示:**
    テストストーリーは、Model を直接操作するのではなく、すべて `AppController` の仲介メソッド（`addToCart`, `checkout`）を通じて Model へ要求を送ります。

---

## 自分なりの消化・考察 (Personal Insights)

### 理解のポイント
このスタイルの本質は、**UI（画面表現）とビジネスロジックの関心の完全な分離**にあります。
View が Model に直接結合し、Model が View に直接結合していると、表示形式（例: Web、コンソール、デスクトップアプリ）を変更する際にビジネスロジックまで書き換える羽目になります。オブザーバーパターンを挟むことで、Model は自身の変更を「ただ叫ぶ（通知する）」だけになり、それに興味がある任意の View がそれぞれ勝手に再描画できるようになります。

### 難しかった点 / 気づき
*   **再描画のタイミングと粒度:**
    Model が更新されるたびに View 全体が再描画されるため、コンソール出力だと表示が非常に多くなり、見にくくなることがあります。実務の GUI アプリ（特にブラウザ）では、変更された DOM の差分だけを検知して部分更新（Virtual DOM など）を行うか、状態の確定時にまとめて通知（バッチ更新）するなどのアプローチをとる必要があります。

### 実務への応用
*   **ウェブフロントエンド (MVC から MVVM/リアクティブへ):**
    Ruby on Rails や ASP.NET MVC などのバックエンド、および Backbone.js や Angular などのフロントエンド設計の最も基本的なアーキテクチャモデルです。
*   **iOS / Android アプリ開発:**
    古典的な MVC や、それを洗練させた MVP, MVVM などの設計パターンの原点です。View（UIコンポーネント）と Model（ビジネスエンティティ）を Controller / ViewModel が仲介して結びつけます。

---

## 関連リンク・参考資料
*   本プロジェクトの実装コード: [main.ts](../../33-trinity/main.ts)
*   公式リポジトリの該当実装: [tf-33.py (GitHub)](https://github.com/crista/exercises-in-programming-style/blob/master/33-trinity/tf-33.py)
