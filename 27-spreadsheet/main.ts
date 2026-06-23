// ==========================================
// Style 27: Spreadsheet (スプレッドシート - リアクティブ)
// ==========================================
// 【制約】
// 1. 各値は「セル」として表現され、値そのものか、他のセルに依存する「数式（計算式）」を持つ。
// 2. セルの値が変更された場合、そのセルに依存している他のすべてのセルが自動的（リアクティブ）に再計算されて更新される。
// 3. 命令的な順次再計算メソッドの手動呼び出しを行わず、値の依存グラフによる自動伝播でシステムを構築する。

class Cell<T> {
  private val: T;
  private dependents: Cell<any>[] = [];
  private formula?: () => T;

  constructor(value: T | (() => T)) {
    if (typeof value === 'function') {
      this.formula = value as () => T;
      this.val = this.formula();
    } else {
      this.val = value;
    }
  }

  get(): T {
    return this.val;
  }

  set(newVal: T): void {
    this.val = newVal;
    this.triggerDependents();
  }

  // 依存元のセルを登録し、依存元が更新されたときに自分が再計算されるようにする
  addDependency(parentCell: Cell<any>): void {
    parentCell.dependents.push(this);
  }

  recalculate(): void {
    if (this.formula) {
      this.val = this.formula();
      this.triggerDependents();
    }
  }

  private triggerDependents(): void {
    for (const dep of this.dependents) {
      dep.recalculate();
    }
  }
}

// ==========================================
// スプレッドシートセルの定義と構築 (依存グラフ)
// ==========================================

// 1. カタログ (在庫数セル)
const laptopStock = new Cell<number>(2);
const mouseStock = new Cell<number>(5);
const keyboardStock = new Cell<number>(0);

// 2. ショッピングカート (追加された数量セル)
const laptopQty = new Cell<number>(0);
const mouseQty = new Cell<number>(0);
const keyboardQty = new Cell<number>(0);

// 3. 各アイテムの小計計算セル (数式セル)
const laptopSubtotal = new Cell<number>(() => laptopQty.get() * 100000);
laptopSubtotal.addDependency(laptopQty);

const mouseSubtotal = new Cell<number>(() => mouseQty.get() * 3000);
mouseSubtotal.addDependency(mouseQty);

const keyboardSubtotal = new Cell<number>(() => keyboardQty.get() * 5000);
keyboardSubtotal.addDependency(keyboardQty);

// 4. カート全体の合計金額セル (数式セル)
const cartSubtotal = new Cell<number>(() => laptopSubtotal.get() + mouseSubtotal.get() + keyboardSubtotal.get());
cartSubtotal.addDependency(laptopSubtotal);
cartSubtotal.addDependency(mouseSubtotal);
cartSubtotal.addDependency(keyboardSubtotal);

// 5. 割引金額セル (数式セル)
const discount = new Cell<number>(() => {
  const sub = cartSubtotal.get();
  return sub >= 3000 ? Math.round(sub * 0.1) : 0;
});
discount.addDependency(cartSubtotal);

// 6. 最終支払額セル (数式セル)
const paymentTotal = new Cell<number>(() => cartSubtotal.get() - discount.get());
paymentTotal.addDependency(cartSubtotal);
paymentTotal.addDependency(discount);

// ==========================================
// ヘルパーアクション (在庫確認と数量セルの更新)
// ==========================================

function printCatalog(): void {
  console.log("=== 商品カタログ ===");
  console.log(`[PRD-01] ノートPC / 価格: 100000円 / 在庫: ${laptopStock.get()}個`);
  console.log(`[PRD-02] マウス / 価格: 3000円 / 在庫: ${mouseStock.get()}個`);
  console.log(`[PRD-03] キーボード / 価格: 5000円 / 在庫: ${keyboardStock.get()}個`);
  console.log("===================\n");
}

function addToCart(productId: string, qty: number): void {
  if (productId === 'PRD-02') {
    const stock = mouseStock.get();
    const current = mouseQty.get();
    if (stock === 0) {
      console.log("エラー: マウス は在庫切れです。");
      return;
    }
    if (stock < current + qty) {
      console.log(`エラー: マウス の在庫が不足しています（要求: ${qty}個, カート内: ${current}個, 在庫: ${stock}個）。`);
      return;
    }
    mouseQty.set(current + qty);
    console.log(`[OK] カートに追加しました: マウス x ${qty}`);
  } else if (productId === 'PRD-03') {
    const stock = keyboardStock.get();
    const current = keyboardQty.get();
    if (stock === 0) {
      console.log("エラー: キーボード は在庫切れです。");
      return;
    }
    if (stock < current + qty) {
      console.log(`エラー: キーボード の在庫が不足しています（要求: ${qty}個, カート内: ${current}個, 在庫: ${stock}個）。`);
      return;
    }
    keyboardQty.set(current + qty);
    console.log(`[OK] カートに追加しました: キーボード x ${qty}`);
  } else if (productId === 'PRD-01') {
    const stock = laptopStock.get();
    const current = laptopQty.get();
    if (stock === 0) {
      console.log("エラー: ノートPC は在庫切れです。");
      return;
    }
    if (stock < current + qty) {
      console.log(`エラー: ノートPC の在庫が不足しています（要求: ${qty}個, カート内: ${current}個, 在庫: ${stock}個）。`);
      return;
    }
    laptopQty.set(current + qty);
    console.log(`[OK] カートに追加しました: ノートPC x ${qty}`);
  }
}

function checkout(): void {
  // カートが空かチェック
  if (laptopQty.get() === 0 && mouseQty.get() === 0 && keyboardQty.get() === 0) {
    console.log("エラー: カートが空です。");
    return;
  }

  console.log("\n--- レシート (Receipt) ---");
  if (laptopQty.get() > 0) {
    console.log(`・ノートPC (100000円) x ${laptopQty.get()} = ${laptopSubtotal.get()}円`);
  }
  if (mouseQty.get() > 0) {
    console.log(`・マウス (3000円) x ${mouseQty.get()} = ${mouseSubtotal.get()}円`);
  }
  if (keyboardQty.get() > 0) {
    console.log(`・キーボード (5000円) x ${keyboardQty.get()} = ${keyboardSubtotal.get()}円`);
  }

  console.log(`割引前合計: ${cartSubtotal.get()}円`);
  console.log(`割引額: -${discount.get()}円`);
  console.log(`支払合計: ${paymentTotal.get()}円`);
  console.log("-------------------------\n");

  // 在庫の減算 (セル値の更新によって在庫が減少)
  laptopStock.set(laptopStock.get() - laptopQty.get());
  mouseStock.set(mouseStock.get() - mouseQty.get());
  keyboardStock.set(keyboardStock.get() - keyboardQty.get());

  // カートクリア (数量セルを0にリセットすると、自動的に合計等も0に再計算される)
  laptopQty.set(0);
  mouseQty.set(0);
  keyboardQty.set(0);
}

// ==========================================
// テストストーリーの実行
// ==========================================

// 1. 商品一覧の表示
printCatalog();

// 2. 正常な追加
addToCart('PRD-02', 1);

// 3. 在庫切れの追加試行
addToCart('PRD-03', 1);

// 4. 在庫超えの追加試行
addToCart('PRD-01', 3);

// 5. 複数商品の追加 (ノートPCを1個追加)
addToCart('PRD-01', 1);

// 6. カート状態の確認 (明示的再計算を呼ばず、セルの値をそのまま出力)
console.log(`カート内合計金額（割引前）: ${cartSubtotal.get()}円`);

// 7. チェックアウト (レシート出力とリセット)
checkout();

// 8. 事後の在庫確認
printCatalog();
