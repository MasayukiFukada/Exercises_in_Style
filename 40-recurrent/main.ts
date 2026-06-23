// ==========================================
// Style 40: Recurrent (リカレント - RNN)
// ==========================================
// 【制約】
// 1. カートの状態を直接的なグローバル変数やメンバ変数として管理しない。
// 2. カートへの操作履歴（時系列イベントシーケンス）を入力シーケンスとして表現する。
// 3. 各タイムステップにおいて、前回の隠れ状態（Hidden State）と現在の入力を受け取って、新しい隠れ状態を出力する「リカレントセル（RNNセル）」を定義する。
// 4. カートの最終状態やエラー判定は、操作シーケンス全体を RNN に通した後の最終隠れ状態（およびそこからの出力）からのみ決定する。

// 商品の定義
class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly price: number,
    public stock: number
  ) {}
}

class Catalog {
  constructor(public products: Product[]) {}

  findProduct(id: string): Product | undefined {
    return this.products.find(p => p.id === id);
  }

  print(): void {
    console.log("=== 商品カタログ ===");
    for (const p of this.products) {
      console.log(`[${p.id}] ${p.name} / 価格: ${p.price}円 / 在庫: ${p.stock}個`);
    }
    console.log("===================\n");
  }
}

// RNNにおける入力 (Input Vector)
// x_t = [is_add_action, product_index, request_qty]
type InputVector = [number, number, number];

// RNNにおける隠れ状態 (Hidden State Vector)
// h_t = [qty_prd0, qty_prd1, qty_prd2, error_flag, error_prd_idx, accum_subtotal]
type HiddenState = [number, number, number, number, number, number];

// カタログの商品データを固定の在庫・価格にマッピングするためのヘルパー
const STOCKS = [2, 5, 0]; // ノートPC, マウス, キーボードの現在の在庫状況 (テストの過程で動的に変わる)
const PRICES = [100000, 3000, 5000];

// リカレントセル (RNN Cell)
// 前回の隠れ状態 h_{t-1} と現在の入力 x_t から、新しい隠れ状態 h_t を計算する
function rnnCell(hPrev: HiddenState, x: InputVector, currentStocks: number[]): HiddenState {
  const isAdd = x[0];
  const prdIdx = x[1];
  const reqQty = x[2];

  if (isAdd !== 1) {
    return hPrev;
  }

  const currentQtyInCart = hPrev[prdIdx];
  const stockLimit = currentStocks[prdIdx];

  // 在庫十分性チェック (ニューロ演算を模したステップ関数判定)
  // z = stockLimit - currentQtyInCart - reqQty
  // z >= 0 なら 1 (追加OK), z < 0 なら 0 (不足)
  const z = stockLimit - currentQtyInCart - reqQty;
  const isAvailable = z >= 0 ? 1 : 0;

  const nextH: HiddenState = [...hPrev];

  if (isAvailable === 1) {
    // 正常に追加できる場合
    nextH[prdIdx] += reqQty;
    nextH[3] = 0;  // エラーフラグ: なし
    nextH[4] = -1; // エラー商品インデックス: なし
    nextH[5] += PRICES[prdIdx] * reqQty; // 累計金額の更新
  } else {
    // 在庫エラーの場合
    nextH[3] = 1;  // エラーフラグ: あり
    nextH[4] = prdIdx; // エラー商品インデックスを設定
    // 数量や小計は変更なし
  }

  return nextH;
}

// 活性化関数: ステップ関数
function stepFunction(z: number): number {
  return z >= 0 ? 1 : 0;
}

// RNNを実行する関数 (シーケンス全体を処理して最終状態を返す)
function runRnn(inputs: InputVector[], currentStocks: number[]): HiddenState {
  let h: HiddenState = [0, 0, 0, 0, -1, 0]; // 初期隠れ状態
  for (const x of inputs) {
    h = rnnCell(h, x, currentStocks);
  }
  return h;
}

// ==========================================
// ビジネスロジックの管理 (操作シーケンスの保持)
// ==========================================
class ShoppingSystem {
  // 操作履歴シーケンス (RNNへの入力時系列データ)
  private actionHistory: InputVector[] = [];

  constructor(public catalog: Catalog) {}

  // 現在の各商品の在庫配列を取得
  private getCurrentStocks(): number[] {
    return this.catalog.products.map(p => p.stock);
  }

  // カートにアイテムを追加する試み
  addItem(productId: string, qty: number): void {
    const prdIdx = this.catalog.products.findIndex(p => p.id === productId);
    if (prdIdx === -1) return;

    // 仮の新しい入力（イベント）を作成
    const newInput: InputVector = [1, prdIdx, qty];
    const candidateHistory = [...this.actionHistory, newInput];

    // これまでの全履歴＋新しい入力をRNNに通して予測する
    const hFinal = runRnn(candidateHistory, this.getCurrentStocks());

    const errorFlag = hFinal[3];
    const errorPrdIdx = hFinal[4];

    if (errorFlag === 1) {
      // RNNが在庫不足を予測（判定）した場合
      const prod = this.catalog.products[errorPrdIdx];
      const stock = prod.stock;
      
      // カート内数量は、新入力を除く直前までのRNN結果から取得
      const hPrev = runRnn(this.actionHistory, this.getCurrentStocks());
      const currentInCart = hPrev[errorPrdIdx];

      if (stock === 0) {
        console.log(`エラー: ${prod.name} は在庫切れです。`);
      } else {
        console.log(`エラー: ${prod.name} の在庫が不足しています（要求: ${qty}個, カート内: ${currentInCart}個, 在庫: ${stock}個）。`);
      }
    } else {
      // 成功した場合のみ、履歴シーケンスに正式登録する
      this.actionHistory = candidateHistory;
      console.log(`[OK] カートに追加しました: ${this.catalog.products[prdIdx].name} x ${qty}`);
    }
  }

  // カート内合計金額（割引前）を取得する
  getSubtotal(): number {
    const hFinal = runRnn(this.actionHistory, this.getCurrentStocks());
    return hFinal[5]; // 累計小計
  }

  // チェックアウトを実行
  checkout(): void {
    const hFinal = runRnn(this.actionHistory, this.getCurrentStocks());
    const subtotal = hFinal[5];

    if (subtotal === 0) {
      console.log("エラー: カートが空です。");
      return;
    }

    console.log("\n--- レシート (Receipt) ---");
    for (let i = 0; i < this.catalog.products.length; i++) {
      const qty = hFinal[i];
      if (qty > 0) {
        const prod = this.catalog.products[i];
        console.log(`・${prod.name} (${prod.price}円) x ${qty} = ${prod.price * qty}円`);
      }
    }

    // 割引適用判定 (3000円以上で10%オフ)
    // 入力 = [小計], 重み = [1], バイアス = -3000
    const w = 1;
    const b = -3000;
    const z = subtotal * w + b;
    const discountApplied = stepFunction(z); // 1 = 適用, 0 = なし

    const discount = discountApplied * Math.round(subtotal * 0.1);

    console.log(`割引前合計: ${subtotal}円`);
    console.log(`割引額: -${discount}円`);
    console.log(`支払合計: ${subtotal - discount}円`);
    console.log("-------------------------\n");

    // 実在庫の引き落とし
    for (let i = 0; i < this.catalog.products.length; i++) {
      this.catalog.products[i].stock -= hFinal[i];
    }

    // カート（履歴）をクリア
    this.actionHistory = [];
  }
}

// ==========================================
// テストストーリーの実行
// ==========================================

const catalog = new Catalog([
  new Product('PRD-01', 'ノートPC', 100000, 2),
  new Product('PRD-02', 'マウス', 3000, 5),
  new Product('PRD-03', 'キーボード', 5000, 0)
]);

const system = new ShoppingSystem(catalog);

// 1. 商品一覧の表示
catalog.print();

// 2. 正常な追加
system.addItem('PRD-02', 1);

// 3. 在庫切れの追加試行
system.addItem('PRD-03', 1);

// 4. 在庫超えの追加試行
system.addItem('PRD-01', 3);

// 5. 複数商品の追加 (ノートPCを1個追加)
system.addItem('PRD-01', 1);

// 6. カート状態の確認
console.log(`カート内合計金額（割引前）: ${system.getSubtotal()}円`);

// 7. チェックアウト
system.checkout();

// 8. 事後の在庫確認
catalog.print();
