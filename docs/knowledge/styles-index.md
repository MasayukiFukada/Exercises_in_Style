---
type: concept
title: "Programming Styles Index"
description: "「Exercises in Programming Style」で取り扱われている全41のプログラミングスタイルの一覧と、プロジェクト内の実装・解説へのインデックスです。"
resource: "https://github.com/crista/exercises-in-programming-style"
tags:
  - "exercises-in-style"
  - "programming-style"
  - "index"
timestamp: "2026-06-21T22:39:00+09:00"
---

# プログラミングスタイル一覧 (Programming Styles Index)

書籍『プログラミングの文体練習（Exercises in Programming Style）』および参考リポジトリに登場する全41種類のプログラミングスタイルの一覧です。

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
    *   **解説:** [未作成]

## Part II: Basic Styles (基本スタイル)
手続き型・関数型の基礎となる構造化や構成方法。

*   **03. Arrays (配列)**
    *   **制約:** 配列操作を中心とし、データ全体を一括処理するアプローチ。
    *   **実行コマンド:** `mise exec -- npx ts-node 03-arrays/main.ts`
    *   **解説:** [未作成]
*   **04. Monolith (モノリス)**
    *   **制約:** 名前付きの関数や抽象化を排し、1つの巨大なシーケンシャル処理として実装。
    *   **実行コマンド:** `mise exec -- npx ts-node 04-monolith/main.ts`
    *   **解説:** [未作成]
*   **05. Cookbook (クックブック)**
    *   **制約:** 状態をできるだけ共有せず、小さな手続き（サブルーチン）に分割する一般的な手続き型。
    *   **実行コマンド:** `mise exec -- npx ts-node 05-cookbook/main.ts`
    *   **解説:** [未作成]
*   **06. Pipeline (パイプライン)**
    *   **制約:** 各処理を純粋関数として繋ぎ、関数の出力を次の関数の入力として流す（中間状態の保持を避ける）。
    *   **実行コマンド:** `mise exec -- npx ts-node 06-pipeline/main.ts`
    *   **解説:** [未作成]
*   **07. Code Golf (コードゴルフ)**
    *   **制約:** 可能な限りコードを短く（文字数を少なく）書く。
    *   **実行コマンド:** `mise exec -- npx ts-node 07-code-golf/main.ts`
    *   **解説:** [未作成]

## Part III: Function Composition (関数合成)
関数同士をどのように合成して複雑なフローを構築するか。

*   **08. Infinite Mirror (無限の鏡)**
    *   **制約:** ループ構造（for, whileなど）の禁止。すべての繰り返しを再帰で表現。
    *   **実行コマンド:** `mise exec -- npx ts-node 08-infinite-mirror/main.ts`
    *   **解説:** [未作成]
*   **09. Kick Forward (キックフォワード)**
    *   **制約:** 処理の最後に次の処理を明示的に呼び出す（継続渡しスタイル / CPS）。
    *   **実行コマンド:** `mise exec -- npx ts-node 09-kick-forward/main.ts`
    *   **解説:** [未作成]
*   **10. The One (ザ・ワン)**
    *   **制約:** 処理の流れや値のラップを行う、特定のモナド的な抽象化（Bind関数による鎖状の連結）。
    *   **実行コマンド:** `mise exec -- npx ts-node 10-the-one/main.ts`
    *   **解説:** [未作成]

## Part IV: Objects and Object Interaction (オブジェクトと相互作用)
オブジェクト指向やメッセージングによるカプセル化と連携。

*   **11. Things (シングズ / モノ)**
    *   **制約:** データを保持する「オブジェクト」とその相互作用（一般的なオブジェクト指向）。
    *   **実行コマンド:** `mise exec -- npx ts-node 11-things/main.ts`
    *   **解説:** [未作成]
*   **12. Letterbox (レターボックス)**
    *   **制約:** 直接のメソッド呼び出しを排し、メッセージ送信によってオブジェクト間通信を行う（Smalltalkスタイル）。
    *   **実行コマンド:** `mise exec -- npx ts-node 12-letterbox/main.ts`
    *   **解説:** [未作成]
*   **13. Closed Maps (クローズドマップ)**
    *   **制約:** クラスを定義せず、マップ（辞書）に値と関数を動的バインドしてオブジェクトを作成（プロトタイプベース）。
    *   **実行コマンド:** `mise exec -- npx ts-node 13-closed-maps/main.ts`
    *   **解説:** [未作成]
*   **14. Abstract Things (抽象的なモノ)**
    *   **制約:** 抽象データ型（ADT）として、実装とインターフェースを厳密に分離する。
    *   **実行コマンド:** `mise exec -- npx ts-node 14-abstract-things/main.ts`
    *   **解説:** [未作成]
*   **15. Hollywood (ハリウッド)**
    *   **制約:** 「こちらから電話するな、必要ならこちらからかける」（IoC / 制御の反転）。
    *   **実行コマンド:** `mise exec -- npx ts-node 15-hollywood/main.ts`
    *   **解説:** [未作成]
*   **16. Bulletin Board (掲示板)**
    *   **制約:** パブリッシュ・サブスクライブ（出版-購読）パターンによるイベント駆動。
    *   **実行コマンド:** `mise exec -- npx ts-node 16-bulletin-board/main.ts`
    *   **解説:** [未作成]

## Part V: Reflection and Metaprogramming (リフレクションとメタプログラミング)
プログラムが自分自身の構造やコード自体を操作する手法。

*   **17. Introspective (イントロスペクティブ)**
    *   **制約:** 実行時に自身のクラス名や属性情報（メタデータ）を検査して処理を行う。
    *   **実行コマンド:** `mise exec -- npx ts-node 17-introspective/main.ts`
    *   **解説:** [未作成]
*   **18. Reflective (リフレクティブ)**
    *   **制約:** 実行時にコードや関数定義を動的に追加・生成して実行する。
    *   **実行コマンド:** `mise exec -- npx ts-node 18-reflective/main.ts`
    *   **解説:** [未作成]
*   **19. Aspects (アスペクト)**
    *   **制約:** アスペクト指向（AOP）。横断的関心事（ロギングなど）をメインロジックに動的に織り込む。
    *   **実行コマンド:** `mise exec -- npx ts-node 19-aspects/main.ts`
    *   **解説:** [未作成]
*   **20. Plugins (プラグイン)**
    *   **制約:** 動的ローディング。外部の設定ファイル等に基づいて動的にモジュールを差し替える。
    *   **実行コマンド:** `mise exec -- npx ts-node 20-plugins/main.ts`
    *   **解説:** [未作成]

## Part VI: Adversity (逆境)
エラーハンドリング、防御、または静的解析などの制約。

*   **21. Constructivist (構造主義者 / 防御的)**
    *   **制約:** 入力や内部状態を各ステップで徹底的に検証し、異常値があれば安全にフォールバックする（防御的プログラミング）。
    *   **実行コマンド:** `mise exec -- npx ts-node 21-constructivist/main.ts`
    *   **解説:** [未作成]
*   **22. Tantrum (かんしゃく / 契約による設計)**
    *   **制約:** 事前条件・事後条件を厳密に定義し、違反時は即座に例外（怒り）を投げる（Design by Contract）。
    *   **実行コマンド:** `mise exec -- npx ts-node 22-tantrum/main.ts`
    *   **解説:** [未作成]
*   **23. Passive-Aggressive (受動攻撃的 / 例外ハンドリング)**
    *   **制約:** エラー発生時は例外をそのままスローし、最上位のレイヤーで一括してキャッチ＆ハンドリングする。
    *   **実行コマンド:** `mise exec -- npx ts-node 23-passive-aggressive/main.ts`
    *   **解説:** [未作成]
*   **24. Intention-Revealing (意図開示 / 型注釈)**
    *   **制約:** 型注釈（Type Annotations）を多用し、データ型や引数の意図を明確にする。
    *   **実行コマンド:** `mise exec -- npx ts-node 24-intention-revealing/main.ts`
    *   **解説:** [未作成]
*   **25. Quarantine (隔離 / 純粋関数)**
    *   **制約:** 計算ロジック（純粋関数）と、I/Oなどの副作用（純粋でない処理）を厳密に隔離する（HaskellのIOモナド的アプローチ）。
    *   **実行コマンド:** `mise exec -- npx ts-node 25-quarantine/main.ts`
    *   **解説:** [未作成]

## Part VII: Data-Centric (データ中心)
データの構造や流れそのものにプログラムのフローを委ねる手法。

*   **26. Persistence (永続化)**
    *   **制約:** 計算のすべての途中状態をデータベース（SQL等）に保存し、クエリを用いて処理を進める。
    *   **実行コマンド:** `mise exec -- npx ts-node 26-persistence/main.ts`
    *   **解説:** [未作成]
*   **27. Spreadsheet (スプレッドシート)**
    *   **制約:** 値の更新が、依存している他の値に自動で再計算・反映される（リアクティブプログラミング）。
    *   **実行コマンド:** `mise exec -- npx ts-node 27-spreadsheet/main.ts`
    *   **解説:** [未作成]
*   **28. Lazy Rivers (ゆったり流れる川 / 遅延評価)**
    *   **制約:** ジェネレータや遅延評価を用い、必要なタイミングで必要な分だけデータをストリーム処理する。
    *   **実行コマンド:** `mise exec -- npx ts-node 28-lazy-rivers/main.ts`
    *   **解説:** [未作成]

## Part VIII: Concurrency (並行性)
スレッドやプロセスによる並列・分散処理。

*   **29. Actors (アクター)**
    *   **制約:** アクターモデル。状態を共有せず、互いに非同期メッセージを送信し合うアクター群で処理を分割。
    *   **実行コマンド:** `mise exec -- npx ts-node 29-actors/main.ts`
    *   **解説:** [未作成]
*   **30. Dataspaces (データスペース)**
    *   **制約:** 共有のタプルスペース（Lindaスタイル）に変数を出し入れし、並行ワーカー同士で調整を行う。
    *   **実行コマンド:** `mise exec -- npx ts-node 30-dataspaces/main.ts`
    *   **解説:** [未作成]
*   **31. MapReduce (マップリデュース)**
    *   **制約:** データをマップ（分割・加工）とリデュース（集計）の2段階に分解して処理。
    *   **実行コマンド:** `mise exec -- npx ts-node 31-map-reduce/main.ts`
    *   **解説:** [未作成]
*   **32. Hadoop (ハドゥープ / ダブルMapReduce)**
    *   **制約:** 複数のMapReduceステージをパイプライン状に連結して処理。
    *   **実行コマンド:** `mise exec -- npx ts-node 32-hadoop/main.ts`
    *   **解説:** [未作成]

## Part IX: Interactivity (インタラクティブ性)
ユーザーや外部環境との対話的なやり取り。

*   **33. Trinity (三位一体 / MVC)**
    *   **制約:** Model-View-Controller (MVC) パターン。
    *   **実行コマンド:** `mise exec -- npx ts-node 33-trinity/main.ts`
    *   **解説:** [未作成]
*   **34. RESTful (ステートレス)**
    *   **制約:** ステートレスなリクエスト／レスポンスサイクル（WebのRESTスタイル）。
    *   **実行コマンド:** `mise exec -- npx ts-node 34-restful/main.ts`
    *   **解説:** [未作成]

## Part X: Machine Learning / Neural Networks (ニューラルネットワーク)
第2版で追加された、ディープラーニングなどの機械学習アプローチによるTerm Frequency。

*   **35. Shallow Dense (浅い密なネットワーク)**
    *   **制約:** 単層パーセプトロンを用いたネットワークによる判定。
    *   **実行コマンド:** `mise exec -- npx ts-node 35-shallow-dense/main.ts`
    *   **解説:** [未作成]
*   **36. Training Shallow Dense (学習)**
    *   **制約:** 単層パーセプトロンの重みの動的学習（バックプロパゲーション等）。
    *   **実行コマンド:** `mise exec -- npx ts-node 36-training-shallow-dense/main.ts`
    *   **解説:** [未作成]
*   **37. Bowtie (ボウタイ)**
    *   **制約:** 多層ニューラルネットワーク（オートエンコーダ等の構成）。
    *   **実行コマンド:** `mise exec -- npx ts-node 37-bowtie/main.ts`
    *   **解説:** [未作成]
*   **38. NeuroMonolith (ニューロモノリス)**
    *   **制約:** シーケンスデータを扱うためのニューラルネットワーク。
    *   **実行コマンド:** `mise exec -- npx ts-node 38-neuromonolith/main.ts`
    *   **解説:** [未作成]
*   **39. Sliding Window (スライディングウィンドウ / CNN)**
    *   **制約:** 畳み込みニューラルネットワーク（CNN）アプローチ。
    *   **実行コマンド:** `mise exec -- npx ts-node 39-sliding-window/main.ts`
    *   **解説:** [未作成]
*   **40. Recurrent (リカレント / RNN)**
    *   **制約:** リカレントニューラルネットワーク（RNN）によるシークエンス制御。
    *   **実行コマンド:** `mise exec -- npx ts-node 40-recurrent/main.ts`
    *   **解説:** [未作成]
*   **41. Convolutions (畳み込み)**
    *   **制約:** フィルタを用いた畳み込み処理。
    *   **実行コマンド:** `mise exec -- npx ts-node 41-convolutions/main.ts`
    *   **解説:** [未作成]
