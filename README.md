# Exercises in Programming Style (TypeScript / Shopping Cart)

このプロジェクトは、Cristina Videira Lopes 著の名著 **『プログラミングの文体練習 (Exercises in Programming Style)』** に登場する全46種類のプログラミングスタイル（独自追加の5スタイルを含む）を、現代的なプログラミング言語である **TypeScript (Node.js)** を用いて再実装し、それぞれの設計思想や制約を深く学ぶことを目的としたプロジェクトです。

本家リポジトリでは「単語の出現頻度カウント (Term Frequency)」を題材にしていますが、本プロジェクトではビジネスロジックや状態遷移の比較がしやすい **「ECショッピングカート」** を共通の題材として採用しています。

---

## 🚀 クイックスタート

### 動作環境
*   **Node.js**: 20.x 以上
*   **ランタイム管理**: [mise](https://mise.jdx.dev/) (設定ファイル: `.mise.toml`)

### セットアップ
```bash
# 依存関係のインストール
npm install
```

### 実行方法
各スタイルディレクトリ配下の `main.ts` を、`mise` 経由で実行します。

例: `06-pipeline` スタイルを実行する場合:
```bash
mise exec -- npx ts-node 06-pipeline/main.ts
```

---

## 🛒 共通仕様と実行シナリオ

各スタイルはすべて、以下の共通シナリオを満たすように実装されています。

1.  **商品カタログの表示**: 初期在庫の確認。
2.  **カート操作**: 商品の追加。在庫切れ（エラー）や在庫不足（エラー）のシミュレーション。
3.  **割引計算**: 3,000円以上の注文に対する10%割引の適用。
4.  **チェックアウト**: 在庫の減算と購入レシートの出力。
5.  **事後の在庫確認**: 在庫が正しく減算されているかの確認。

共通仕様の詳細は [docs/knowledge/project-setup.md](docs/knowledge/project-setup.md) を参照してください。

---

## 📚 プログラミングスタイル一覧とドキュメント

実装された全46種類のスタイルの一覧、実行コマンド、および各スタイルを自分なりに消化・考察したドキュメントへのリンクは、インデックスにまとめられています。

*   **[プログラミングスタイル一覧 (インデックス)](docs/knowledge/styles-index.md)**
    *   **Part I: Historical** (歴史的スタイル: `01. Good Old Times`, `02. Go Forth`)
    *   **Part II: Basic Styles** (基本スタイル: `03. Arrays`〜`07. Code Golf`)
    *   **Part III: Function Composition** (関数合成: `08`〜`10`)
    *   **Part IV: Objects and Object Interaction** (オブジェクトと相互作用: `11`〜`13`)
    *   **Part V: Object Reflection** (メタプログラミング: `14`〜`20`)
    *   **Part VI: Adversity** (エラー処理: `21`〜`25`)
    *   **Part VII: Data-Centric** (データ中心: `26`〜`28`)
    *   **Part VIII: Concurrency** (並行性: `29`〜`32`)
    *   **Part IX: Interactivity** (インタラクティブ性: `33`〜`34`)
    *   **Part X: Machine Learning / Neural Networks** (ニューラルネットワーク: `35`〜`41`)
    *   **Part XI: Extensions** (追加・拡張スタイル: `42. Point-free`〜`46. Reactive Streams`)

---

## 🏆 メタ分析・評価・実装リファレンス

全46個のスタイルを多角的に分析・評価し、実務での活用や設計・実装時に役立てるためのドキュメント群です。

*   **[プログラミングスタイル実装・設計リファレンスガイド](docs/knowledge/style-implementation-guide.md)**: 各スタイルを設計・実装する際の本質的制約とコードの急所（ハマりどころ）をコンパクトにまとめたガイド。
*   **[プログラミングスタイル総合評価・ランキング](docs/knowledge/style-ranking.md)**: 拡張性、テスタビリティ、AI親和性、可読性の4つの軸で評価し、実務やAI駆動開発に役立つベスト/ワーストを決定。
*   **[プログラミングスタイルの相乗効果（組み合わせレシピ）](docs/knowledge/style-combinations.md)**: `Event-Driven CQRS` や `Zero-Imperative` など、複数のスタイルを組み合わせ弱点を補い合う設計パターン。
*   **[クラスとオブジェクト指向のパラダイムシフト](docs/knowledge/class-paradigm-shift.md)**: 近代開発におけるクラスの必然性を問い直し、関数型、イベント駆動、AI駆動開発の台頭に伴うオブジェクト指向からのシフトについて考察したドキュメント。

---

## 📖 参考リポジトリ
*   本家リポジトリ: [crista/exercises-in-programming-style](https://github.com/crista/exercises-in-programming-style)
