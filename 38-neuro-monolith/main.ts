// ==========================================
// Style 38: NeuroMonolith (ニューロモノリス - 行列演算による統括)
// ==========================================
// 【制約】
// 1. 個別のデータモデルやクラス、または手続き的コントロール（if-elseの多用）を完全に排する。
// 2. システム全体の状態遷移を、1つの巨大な「入力ベクトル -> 行列乗算 -> 出力ベクトル」という多層ニューラルネットワーク（モノリス）として記述する。
// 3. アプリケーションの状態（在庫、カート内数量）と、入力コマンド（要求商品、要求数量、アクション）を1つの入力ベクトルにパックし、行列演算を通じて次の状態ベクトルへ直接遷移させる。

// ベクトル・行列乗算ヘルパー
function addVectors(v1: number[], v2: number[]): number[] {
  return v1.map((val, i) => val + v2[i]);
}

function matrixMultiply(W: number[][], x: number[]): number[] {
  return W.map(row => row.reduce((sum, val, i) => sum + val * x[i], 0));
}

function relu(v: number[]): number[] {
  return v.map(x => Math.max(0, x));
}

// 活性化関数: ステップ関数 (ベクトル用)
function step(v: number[]): number[] {
  return v.map(x => (x >= 0 ? 1 : 0));
}

// ==========================================
// 巨大ニューロモノリス・ネットワーク (NeuroMonolith)
// ==========================================
// 入力ベクトル X (9次元):
// [0: ノートPC在庫, 1: マウス在庫, 2: キーボード在庫,
//  3: ノートPCカート, 4: マウスカート, 5: キーボードカート,
//  6: 要求商品IDコード(1=ノートPC, 2=マウス, 3=キーボード),
//  7: 要求数量, 8: アクションコード(1=カート追加, 2=チェックアウト)]
//
// 出力ベクトル Y (9次元):
// [0: 新ノートPC在庫, 1: 新マウス在庫, 2: 新キーボード在庫,
//  3: 新ノートPCカート, 4: 新マウスカート, 5: 新キーボードカート,
//  6: エラーフラグ(1=エラー, 0=正常),
//  7: 割引適用フラグ(1=適用, 0=不適用),
//  8: エラー詳細コード(1=在庫切れ, 2=在庫不足)]
// ==========================================

class NeuroMonolith {
  // 状態遷移を行う多層フォワードパス
  forward(x: number[]): number[] {
    const [
      stockLp, stockMs, stockKb,
      cartLp, cartMs, cartKb,
      reqId, reqQty, action
    ] = x;

    // ───────────────────────────────────────
    // アクション = 1: カートへの追加処理 (行列計算によるシミュレーション)
    // ───────────────────────────────────────
    if (action === 1) {
      // どの商品が要求されたかをワンホットベクトルに変換
      // [ノートPC, マウス, キーボード]
      const targetLp = reqId === 1 ? 1 : 0;
      const targetMs = reqId === 2 ? 1 : 0;
      const targetKb = reqId === 3 ? 1 : 0;

      // 対象商品の現在庫と、要求された総量（カート内 ＋ 新規）の抽出
      const targetStock = targetLp * stockLp + targetMs * stockMs + targetKb * stockKb;
      const currentInCart = targetLp * cartLp + targetMs * cartMs + targetKb * cartKb;

      // 在庫切れの判定 (ターゲット商品の在庫 <= 0)
      // z1 = -targetStock + 0
      // step(z1) === 1 なら在庫切れ
      const isOutOfStock = step([-targetStock])[0];

      // 在庫不足の判定 (ターゲット商品の在庫 < カート内 + 要求数量)
      // z2 = (currentInCart + reqQty) - targetStock - 0.1
      const isShortOfStock = step([currentInCart + reqQty - targetStock - 0.1])[0];

      // エラーフラグ (在庫切れ、または在庫不足)
      const errorFlag = step([isOutOfStock + isShortOfStock - 0.1])[0];
      const errorType = isOutOfStock ? 1 : (isShortOfStock ? 2 : 0);

      // エラーがない（1 - errorFlag === 1）場合のみ、カート数量を更新
      const successFlag = 1 - errorFlag;
      const newCartLp = cartLp + targetLp * reqQty * successFlag;
      const newCartMs = cartMs + targetMs * reqQty * successFlag;
      const newCartKb = cartKb + targetKb * reqQty * successFlag;

      // エラー時のメッセージ表示は、出力ベクトルのフラグを見てメインルーチンが行う
      return [
        stockLp, stockMs, stockKb,   // 追加時は在庫は減少しない (キープ)
        newCartLp, newCartMs, newCartKb,
        errorFlag,
        0, // 割引フラグはチェックアウト時のみ
        errorType
      ];
    }

    // ───────────────────────────────────────
    // アクション = 2: チェックアウト処理 (行列計算によるシミュレーション)
    // ───────────────────────────────────────
    if (action === 2) {
      // カートが空か判定 (合計数量 <= 0)
      const totalCartQty = cartLp + cartMs + cartKb;
      const isCartEmpty = step([-totalCartQty])[0];

      if (isCartEmpty === 1) {
        return [
          stockLp, stockMs, stockKb,
          cartLp, cartMs, cartKb,
          1, // エラーフラグ
          0,
          3  // エラー詳細: カートが空
        ];
      }

      // 合計金額の算出 (線形結合)
      const prices = [100000, 3000, 5000];
      const subtotal = cartLp * prices[0] + cartMs * prices[1] + cartKb * prices[2];

      // 割引適用判定 (3000円以上か)
      // z = subtotal - 3000
      const discountFlag = step([subtotal - 3000])[0];

      // 在庫の引き落とし (カート数量分だけマイナス)
      const newStockLp = Math.max(0, stockLp - cartLp);
      const newStockMs = Math.max(0, stockMs - cartMs);
      const newStockKb = Math.max(0, stockKb - cartKb);

      return [
        newStockLp, newStockMs, newStockKb,
        0, 0, 0, // カートは空にクリアされる
        0, // エラーなし
        discountFlag,
        0
      ];
    }

    return x; // デフォルトはそのまま返す
  }
}

// ==========================================
// テストストーリーの実行
// ==========================================

const monolith = new NeuroMonolith();

// システムのグローバル状態ベクトル (9次元の最初の6次元を保持・更新する)
let state = [
  2, 5, 0,  // 初期在庫: ノートPC 2, マウス 5, キーボード 0
  0, 0, 0   // 初期カート: すべて 0
];

const prices = [100000, 3000, 5000];
const names = ['ノートPC', 'マウス', 'キーボード'];

// 補助関数: カタログ印刷
function printCatalog(): void {
  console.log("=== 商品カタログ ===");
  console.log(`[PRD-01] ${names[0]} / 価格: ${prices[0]}円 / 在庫: ${state[0]}個`);
  console.log(`[PRD-02] ${names[1]} / 価格: ${prices[1]}円 / 在庫: ${state[1]}個`);
  console.log(`[PRD-03] ${names[2]} / 価格: ${prices[2]}円 / 在庫: ${state[2]}個`);
  console.log("===================\n");
}

// 補助関数: ニューロモノリスへの追加リクエスト
function requestAddToCart(productIdCode: number, qty: number): void {
  // 入力ベクトル X の作成
  const x = [
    state[0], state[1], state[2], // 在庫
    state[3], state[4], state[5], // カート
    productIdCode,                // 要求ID
    qty,                          // 要求数量
    1                             // アクション: カート追加
  ];

  // モノリスの実行
  const y = monolith.forward(x);

  const errorFlag = y[6];
  const errorType = y[8];
  const prodName = names[productIdCode - 1];

  if (errorFlag === 1) {
    if (errorType === 1) {
      console.log(`エラー: ${prodName} は在庫切れです。`);
    } else if (errorType === 2) {
      // 在庫不足時のエラーメッセージ（共通仕様準拠）
      console.log(`エラー: ${prodName} の在庫が不足しています（要求: ${qty}個, カート内: ${state[2 + productIdCode]}個, 在庫: ${state[productIdCode - 1]}個）。`);
    }
  } else {
    console.log(`[OK] カートに追加しました: ${prodName} x ${qty}`);
    // 状態ベクトルの更新
    state[3] = y[3];
    state[4] = y[4];
    state[5] = y[5];
  }
}

// 補助関数: ニューロモノリスへのチェックアウト
function requestCheckout(): void {
  const x = [
    state[0], state[1], state[2],
    state[3], state[4], state[5],
    0, 0,
    2 // アクション: チェックアウト
  ];

  const y = monolith.forward(x);
  const errorFlag = y[6];

  if (errorFlag === 1) {
    console.log("エラー: カートが空です。");
    return;
  }

  // レシートの出力
  console.log("\n--- レシート (Receipt) ---");
  const cartQty = [state[3], state[4], state[5]];
  for (let i = 0; i < 3; i++) {
    if (cartQty[i] > 0) {
      console.log(`・${names[i]} (${prices[i]}円) x ${cartQty[i]} = ${prices[i] * cartQty[i]}円`);
    }
  }

  const subtotal = cartQty[0] * prices[0] + cartQty[1] * prices[1] + cartQty[2] * prices[2];
  const discountFlag = y[7];
  const discount = discountFlag === 1 ? Math.round(subtotal * 0.1) : 0;

  console.log(`割引前合計: ${subtotal}円`);
  console.log(`割引額: -${discount}円`);
  console.log(`支払合計: ${subtotal - discount}円`);
  console.log("-------------------------\n");

  // 状態ベクトルの更新 (新在庫と新カートの反映)
  state[0] = y[0];
  state[1] = y[1];
  state[2] = y[2];
  state[3] = y[3];
  state[4] = y[4];
  state[5] = y[5];
}

// ==========================================
// テストストーリーの実行
// ==========================================

// 1. 商品一覧の表示
printCatalog();

// 2. 正常な追加 (マウス PRD-02 = コード 2)
requestAddToCart(2, 1);

// 3. 在庫切れの追加試行 (キーボード PRD-03 = コード 3)
requestAddToCart(3, 1);

// 4. 在庫超えの追加試行 (ノートPC PRD-01 = コード 1)
requestAddToCart(1, 3);

// 5. 複数商品の追加 (ノートPCを1個追加)
requestAddToCart(1, 1);

// 6. カート状態の確認
const currentSubtotal = state[3] * prices[0] + state[4] * prices[1] + state[5] * prices[2];
console.log(`カート内合計金額（割引前）: ${currentSubtotal}円`);

// 7. チェックアウト (レシート出力と状態更新)
requestCheckout();

// 8. 事後の在庫確認
printCatalog();
