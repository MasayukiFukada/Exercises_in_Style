---
type: concept
title: "Programming Styles Index"
description: "「Exercises in Programming Style」で取り扱われている全46のプログラミングスタイルの一覧と、プロジェクト内の実装・解説へのインデックスです。"
resource: "https://github.com/crista/exercises-in-programming-style"
tags:
  - "exercises-in-style"
  - "programming-style"
  - "index"
timestamp: "2026-06-27T22:22:00+09:00"
---

## プログラミングスタイルの総合評価・メタ分析
全46個のプログラミングスタイルを多角的に分析し、実務やAI駆動開発に役立てるためのドキュメント群です。
*   **[プログラミングスタイル実装・設計リファレンスガイド](./style-implementation-guide.md)**: 各スタイルを実装・設計する際の本質的制約とコードの急所（ハマりどころ）をまとめたガイド。
*   **[プログラミングスタイル総合評価・ランキング](./style-ranking.md)**: 4つの軸（拡張性、テスタビリティ、AI親和性、可読性）での総合評価とベスト/ワーストスタイル。
*   **[プログラミングスタイルの相乗効果（相性の良い組み合わせレシピ）](./style-combinations.md)**: 複数のスタイルを組み合わせ、弱点を補い合う設計パターン（レシピ）。
*   **[プログラミングスタイルの光と影（逆説的考察）](./style-paradox.md)**: 一見不便なスタイルの極限での価値や、AI時代におけるプログラミングの文体の逆説的価値。


# プログラミングスタイル一覧 (Programming Styles Index)

書籍『プログラミングの文体練習（Exercises in Programming Style）』および参考リポジトリに登場する全46種類のプログラミングスタイル（独自追加の5スタイルを含む）の一覧です。

本プロジェクトにおいて、各スタイルを実装し自分なりに消化したドキュメントへのリンクを順次追加していきます。

---

## Part I: Historical (歴史的スタイル)
初期のコンピュータ環境の制約や古い言語パラダイムを模したスタイル。

*   **01. Good Old Times (古き良き時代)**
    *   **制約:** 1024ワード程度の極めて制限されたメモリ、変数名なし（インデックスで直接アクセス）。
    *   **実行コマンド:** `mise exec -- npx ts-node 01-good-old-times/main.ts`
    *   **解説:** [style-01-good-old-times.md](./style-01-good-old-times.md)
*   **02. Go Forth (前へ進め)**
    *   **制約:** スタック指向（Forthスタイル）。
    *   **実行コマンド:** `mise exec -- npx ts-node 02-go-forth/main.ts`
    *   **解説:** [style-02-go-forth.md](./style-02-go-forth.md)

## Part II: Basic Styles (基本スタイル)
手続き型・関数型の基礎となる構造化や構成方法。

*   **03. Arrays (配列)**
    *   **制約:** 配列操作を中心とし、データ全体を一括処理するアプローチ。
    *   **実行コマンド:** `mise exec -- npx ts-node 03-arrays/main.ts`
    *   **解説:** [style-03-arrays.md](./style-03-arrays.md)
*   **04. Monolith (モノリス)**
    *   **制約:** 名前付きの関数や抽象化を排し、1つの巨大なシーケンシャル処理として実装。
    *   **実行コマンド:** `mise exec -- npx ts-node 04-monolith/main.ts`
    *   **解説:** [style-04-monolith.md](./style-04-monolith.md)
*   **05. Cookbook (クックブック)**
    *   **制約:** 状態をできるだけ共有せず、小さな手続き（サブルーチン）に分割する一般的な手続き型。
    *   **実行コマンド:** `mise exec -- npx ts-node 05-cookbook/main.ts`
    *   **解説:** [style-05-cookbook.md](./style-05-cookbook.md)
*   **06. Pipeline (パイプライン)**
    *   **制約:** 各処理を純粋関数として繋ぎ、関数の出力を次の関数の入力として流す（中間状態の保持を避ける）。
    *   **実行コマンド:** `mise exec -- npx ts-node 06-pipeline/main.ts`
    *   **解説:** [style-06-pipeline.md](./style-06-pipeline.md)
*   **07. Code Golf (コードゴルフ)**
    *   **制約:** 可能な限りコードを短く（文字数を少なく）書く。
    *   **実行コマンド:** `mise exec -- npx ts-node 07-code-golf/main.ts`
    *   **解説:** [style-07-code-golf.md](./style-07-code-golf.md)

## Part III: Function Composition (関数合成)
関数同士をどのように合成して複雑なフローを構築するか。

*   **08. Infinite Mirror (無限の鏡)**
    *   **制約:** ループ構造（for, whileなど）の禁止。すべての繰り返しを再帰で表現。
    *   **実行コマンド:** `mise exec -- npx ts-node 08-infinite-mirror/main.ts`
    *   **解説:** [style-08-infinite-mirror.md](./style-08-infinite-mirror.md)
*   **09. Kick Forward (キックフォワード)**
    *   **制約:** 処理の最後に次の処理を明示的に呼び出す（継続渡しスタイル / CPS）。
    *   **実行コマンド:** `mise exec -- npx ts-node 09-kick-forward/main.ts`
    *   **解説:** [style-09-kick-forward.md](./style-09-kick-forward.md)
*   **10. The One (ザ・ワン)**
    *   **制約:** 処理の流れや値のラップを行う、特定のモナド的な抽象化（Bind関数による鎖状の連結）。
    *   **実行コマンド:** `mise exec -- npx ts-node 10-the-one/main.ts`
    *   **解説:** [style-10-the-one.md](./style-10-the-one.md)

## Part IV: Objects and Object Interaction (オブジェクトと相互作用)
オブジェクト指向やメッセージングによるカプセル化と連携。

*   **11. Things (シングズ / モノ)**
    *   **制約:** データを保持する「オブジェクト」とその相互作用（一般的なオブジェクト指向）。
    *   **実行コマンド:** `mise exec -- npx ts-node 11-things/main.ts`
    *   **解説:** [style-11-things.md](./style-11-things.md)
*   **12. Letterbox (レターボックス)**
    *   **制約:** 直接のメソッド呼び出しを排し、メッセージ送信によってオブジェクト間通信を行う（Smalltalkスタイル）。
    *   **実行コマンド:** `mise exec -- npx ts-node 12-letterbox/main.ts`
    *   **解説:** [style-12-letterbox.md](./style-12-letterbox.md)
*   **13. Closed Maps (クローズドマップ)**
    *   **制約:** クラスを定義せず、マ�## Part VI: Adversity (逆境)
エラーハンドリング、防御、または静的解析などの制約。

*   **21. Constructivist (構造主義者 / 防御的)**
    *   **制約:** 入力や内部状態を各ステップで徹底的に検証し、異常値があれば安全にフォールバックする（防御的プログラミング）。
    *   **実行コマンド:** `mise exec -- npx ts-node 21-constructivist/main.ts`
    *   **解説:** [style-21-constructivist.md](./style-21-constructivist.md)
*   **22. Tantrum (かんしゃく / 契約による設計)**
    *   **制約:** 事前条件・事後条件を厳密に定義し、違反時は即座に例外（怒り）を投げる（Design by Contract）。
    *   **実行コマンド:** `mise exec -- npx ts-node 22-tantrum/main.ts`
    *   **解説:** [style-22-tantrum.md](./style-22-tantrum.md)
*   **23. Passive-Aggressive (受動攻撃的 / 例外ハンドリング)**
    *   **制約:** エラー発生時は例外をそのままスローし、最上位のレイヤーで一括してキャッチ＆ハンドリングする。
    *   **実行コマンド:** `mise exec -- npx ts-node 23-passive-aggressive/main.ts`
    *   **解説:** [style-23-passive-aggressive.md](./style-23-passive-aggressive.md)
*   **24. Intention-Revealing (意図開示 / 型注釈)**
    *   **制約:** 型注釈（Type Annotations）を多用し、データ型や引数の意図を明確にする。
    *   **実行コマンド:** `mise exec -- npx ts-node 24-intention-revealing/main.ts`
    *   **解説:** [style-24-intention-revealing.md](./style-24-intention-revealing.md)
*   **25. Quarantine (隔離 / 純粋関数)**
    *   **制約:** 計算ロジック（純粋関数）と、I/Oなどの副作用（純粋でない処理）を厳密に隔離する（HaskellのIOモナド的アプローチ）。
    *   **実行コマンド:** `mise exec -- npx ts-node 25-quarantine/main.ts`
    *   **解説:** [style-25-quarantine.md](./style-25-quarantine.md)

## Part VII: Data-Centric (データ中心)
データの構造や流れそのものにプログラムのフローを委ねる手法。

*   **26. Persistence (永続化)**
    *   **制約:** 計算のすべての途中状態をデータベース（SQL等）に保存し、クエリを用いて処理を進める。
    *   **実行コマンド:** `mise exec -- npx ts-node 26-persistence/main.ts`
    *   **解説:** [style-26-persistence.md](./style-26-persistence.md)
*   **27. Spreadsheet (スプレッドシート)**
    *   **制約:** 値の更新が、依存している他の値に自動で再計算・反映される（リアクティブプログラミング）。
    *   **実行コマンド:** `mise exec -- npx ts-node 27-spreadsheet/main.ts`
    *   **解説:** [style-27-spreadsheet.md](./style-27-spreadsheet.md)
*   **28. Lazy Rivers (ゆったり流れる川 / 遅延評価)**
    *   **制約:** ジェネレータや遅延評価を用い、必要なタイミングで必要な分だけデータをストリーム処理する。
    *   **実行コマンド:** `mise exec -- npx ts-node 28-lazy-rivers/main.ts`
    *   **解説:** [style-28-lazy-rivers.md](./style-28-lazy-rivers.md)

## Part VIII: Concurrency (並行性)
スレッドやプロセスによる並列・分散処理。

*   **29. Actors (アクター)**
    *   **制約:** アクターモデル。状態を共有せず、互いに非同期メッセージを送信し合うアクター群で処理を分割。
    *   **実行コマンド:** `mise exec -- npx ts-node 29-actors/main.ts`
    *   **解説:** [style-29-actors.md](./style-29-actors.md)
*   **30. Dataspaces (データスペース)**
    *   **制約:** 共有のタプルスペース（Lindaスタイル）に変数を出し入れし、並行ワーカー同士で調整を行う。
    *   **実行コマンド:** `mise exec -- npx ts-node 30-dataspaces/main.ts`
    *   **解説:** [style-30-dataspaces.md](./style-30-dataspaces.md)
*   **31. MapReduce (マップリデュース)**
    *   **制約:** データをマップ（分割・加工）とリデュース（集計）の2段階に分解して処理。
    *   **実行コマンド:** `mise exec -- npx ts-node 31-map-reduce/main.ts`
    *   **解説:** [style-31-map-reduce.md](./style-31-map-reduce.md)
*   **32. Hadoop (ハドゥープ / ダブルMapReduce)**
    *   **制約:** 複数のMapReduceステージをパイプライン状に連結して処理。
    *   **実行コマンド:** `mise exec -- npx ts-node 32-hadoop/main.ts`
    *   **解説:** [style-32-hadoop.md](./style-32-hadoop.md)

## Part IX: Interactivity (インタラクティブ性)
ユーザーや外部環境との対話的なやり取り。

*   **33. Trinity (三位一体 / MVC)**
    *   **制約:** Model-View-Controller (MVC) パターン。
    *   **実行コマンド:** `mise exec -- npx ts-node 33-trinity/main.ts`
    *   **解説:** [style-33-trinity.md](./style-33-trinity.md)
*   **34. RESTful (ステートレス)**
    *   **制約:** ステートレスなリクエスト／レスポンスサイクル（WebのRESTスタイル）。
    *   **実行コマンド:** `mise exec -- npx ts-node 34-restful/main.ts`
    *   **解説:** [style-34-restful.md](./style-34-restful.md)

## Part X: Machine Learning / Neural Networks (ニューラルネットワーク)
第2版で追加された、ディープラーニングなどの機械学習アプローチによるTerm Frequency。

*   **35. Shallow Dense (浅い密なネットワーク)**
    *   **制約:** 単層パーセプトロンを用いたネットワークによる判定。
    *   **実行コマンド:** `mise exec -- npx ts-node 35-shallow-dense/main.ts`
    *   **解説:** [style-35-shallow-dense.md](./style-35-shallow-dense.md)
*   **36. Training Shallow Dense (学習)**
    *   **制約:** 単層パーセプトロンの重みの動的学習（バックプロパゲーション等）。
    *   **実行コマンド:** `mise exec -- npx ts-node 36-training-shallow-dense/main.ts`
    *   **解説:** [style-36-training-shallow-dense.md](./style-36-training-shallow-dense.md)
*   **37. Bowtie (ボウタイ)**
    *   **制約:** 多層ニューラルネットワーク（オートエンコーダ等の構成）。
    *   **実行コマンド:** `mise exec -- npx ts-node 37-bowtie/main.ts`
    *   **解説:** [style-37-bowtie.md](./style-37-bowtie.md)
*   **38. NeuroMonolith (ニューロモノリス)**
    *   **制約:** シーケンスデータを扱うためのニューラルネットワーク。
    *   **実行コマンド:** `mise exec -- npx ts-node 38-neuro-monolith/main.ts`
    *   **解説:** [style-38-neuro-monolith.md](./style-38-neuro-monolith.md)
*   **39. Sliding Window (スライディングウィンドウ / CNN)**
    *   **制約:** 畳み込みニューラルネットワーク（CNN）アプローチ。
    *   **実行コマンド:** `mise exec -- npx ts-node 39-sliding-window/main.ts`
    *   **解説:** [style-39-sliding-window.md](./style-39-sliding-window.md)
*   **40. Recurrent (リカレント / RNN)**
    *   **制約:** リカレントニューラルネットワーク（RNN）によるシークエンス制御。
    *   **実行コマンド:** `mise exec -- npx ts-node 40-recurrent/main.ts`
    *   **解説:** [style-40-recurrent.md](./style-40-recurrent.md)
*   **41. Convolutions (畳み込み)**
    *   **制約:** フィルタを用いた畳み込み処理。
    *   **実行コマンド:** `mise exec -- npx ts-node 41-convolutions/main.ts`
    *   **解説:** [style-41-convolutions.md](./style-41-convolutions.md)

## Part XI: Extensions (追加・拡張スタイル)
本プロジェクトで独自に追加した、書籍の演習問題や現代的な設計パラダイムに基づくスタイル。

*   **42. Point-free (ポイントフリー)**
    *   **制約:** 変数宣言や引数の命名を一切禁止し、カリー化された関数と関数合成（pipe）のみで構築する。
    *   **実行コマンド:** `mise exec -- npx ts-node 42-point-free/main.ts`
    *   **解説:** [style-42-point-free.md](./style-42-point-free.md)
*   **43. Event Sourcing (イベントソーシング)**
    *   **制約:** 状態の直接更新を禁止し、履歴イベントの蓄積とリプレイによる状態再現のみで処理する。
    *   **実行コマンド:** `mise exec -- npx ts-node 43-event-sourcing/main.ts`
    *   **解説:** [style-43-event-sourcing.md](./style-43-event-sourcing.md)
*   **44. Tail-Recursive (末尾再帰・トランポリン)**
    *   **制約:** ループ構文や配列反復メソッドを排し、トランポリンエンジンを用いたスタックセーフな末尾再帰で反復を処理する。
    *   **実行コマンド:** `mise exec -- npx ts-node 44-tail-recursive/main.ts`
    *   **解説:** [style-44-tail-recursive.md](./style-44-tail-recursive.md)
*   **45. Logic Programming (論理・制約プログラミング)**
    *   **制約:** 手続き的制御を排除し、事実（Facts）と規則（Rules）を登録した知識ベースへのクエリ実行で問題を解決する。
    *   **実行コマンド:** `mise exec -- npx ts-node 45-logic-programming/main.ts`
    *   **解説:** [style-45-logic-programming.md](./style-45-logic-programming.md)
