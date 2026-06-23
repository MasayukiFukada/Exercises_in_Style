// ==========================================
// Style 35: Shallow Dense (浅い密なネットワーク - パーセプトロン)
// ==========================================
// 【制約】
// 1. 条件分岐（if-else）によるビジネスルール（在庫判定や割引判定）を排する。
// 2. 代わりに、入力データに対する線形結合（重みベクトルと入力の積 ＋ バイアス）と活性化関数からなる「単層ニューラルネットワーク（フォワードパス）」によって意思決定を行う。
// 3. 重みとバイアスは事前に設定された固定値（学習済みモデル）を使用する。

// 線形代数（ベクトル演算）ヘルパー
function dotProduct(w: number[], x: number[]): number {
  return w.reduce((acc, val, i) => acc + val * x[i], 0);
}

// 活性化関数: ステップ関数 (Heaviside step function)
function stepFunction(z: number): number {
  return z >= 0 ? 1 : 0;
}

// ==========================================
// ニューラルネットワークによる意思決定モデル
// ==========================================

// 1. 在庫十分性判定ネットワーク (単層パーセプトロン)
// 入力 x = [在庫数, カート内数量, 追加要求数量]
// 重み W = [1, -1, -1]
// バイアス b = 0
// z = 1*在庫 - 1*カート内 - 1*追加要求 + 0 = 在庫 - (カート内 + 追加要求)
// z >= 0 なら 1 (追加OK), z < 0 なら 0 (追加NG)
function predictStockAvailability(stock: number, currentInCart: number, addQty: number): boolean {
  const x = [stock, currentInCart, addQty];
  const w = [1, -1, -1];
  const b = 0;

  const z = dotProduct(w, x) + b;
  const y = stepFunction(z);

  return y === 1;
}

// 2. 割引適用判定ネットワーク
// 入力 x = [小計]
// 重み W = [1]
// バイアス b = -3000 (3000円以上で z >= 0 になるよう調整)
// z = subtotal - 3000
// z >= 0 なら 1 (割引適用), z < 0 なら 0 (割引なし)
function predictDiscountApplicability(subtotal: number): number {
  const x = [subtotal];
  const w = [1];
  const b = -3000;

  const z = dotProduct(w, x) + b;
  const y = stepFunction(z); // 1 = 適用, 0 = 不適用

  return y;
}

// ==========================================
// 各エンティティの定義
// ==========================================

class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly price: number,
    public stock: number
  ) {}
}

class CartItem {
  constructor(
    public readonly product: Product,
    public qty: number
  ) {}
}

class ShoppingCart {
  public items: CartItem[] = [];

  addItem(product: Product | undefined, qty: number): void {
    if (!product) return;

    if (product.stock === 0) {
      console.log(`エラー: ${product.name} は在庫切れです。`);
      return;
    }

    const existing = this.items.find(item => item.product.id === product.id);
    const currentInCart = existing ? existing.qty : 0;

    // 単層パーセプトロンの予測によって追加可能か判定 (if-else条件による在庫チェックを排する)
    const isAvailable = predictStockAvailability(product.stock, currentInCart, qty);

    if (!isAvailable) {
      console.log(`エラー: ${product.name} の在庫が不足しています（要求: ${qty}個, カート内: ${currentInCart}個, 在庫: ${product.stock}個）。`);
      return;
    }

    if (existing) {
      existing.qty += qty;
    } else {
      this.items.push(new CartItem(product, qty));
    }
    console.log(`[OK] カートに追加しました: ${product.name} x ${qty}`);
  }

  getSubtotal(): number {
    return this.items.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
  }

  clear(): void {
    this.items = [];
  }
}

class Catalog {
  constructor(private products: Product[]) {}

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

class CheckoutService {
  checkout(cart: ShoppingCart): void {
    if (cart.items.length === 0) {
      console.log("エラー: カートが空です。");
      return;
    }

    console.log("\n--- レシート (Receipt) ---");
    for (const item of cart.items) {
      console.log(`・${item.product.name} (${item.product.price}円) x ${item.qty} = ${item.product.price * item.qty}円`);
    }

    const subtotal = cart.getSubtotal();
    
    // 単層パーセプトロンによる割引適用の予測 (1 = 10%オフ, 0 = 割引なし)
    const discountFactor = predictDiscountApplicability(subtotal);
    const discount = discountFactor * Math.round(subtotal * 0.1);

    console.log(`割引前合計: ${subtotal}円`);
    console.log(`割引額: -${discount}円`);
    console.log(`支払合計: ${subtotal - discount}円`);
    console.log("-------------------------\n");

    // 各商品の在庫を減算
    for (const item of cart.items) {
      item.product.stock -= item.qty;
    }

    cart.clear();
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

const cart = new ShoppingCart();
const checkoutService = new CheckoutService();

// 1. 商品一覧の表示
catalog.print();

// 2. 正常な追加
const mouse = catalog.findProduct('PRD-02');
if (mouse) cart.addItem(mouse, 1);

// 3. 在庫切れの追加試行
const keyboard = catalog.findProduct('PRD-03');
if (keyboard) cart.addItem(keyboard, 1);

// 4. 在庫超えの追加試行
const laptop = catalog.findProduct('PRD-01');
if (laptop) cart.addItem(laptop, 3);

// 5. 複数商品の追加 (ノートPCを1個追加)
if (laptop) cart.addItem(laptop, 1);

// 6. カート状態の確認
console.log(`カート内合計金額（割引前）: ${cart.getSubtotal()}円`);

// 7. チェックアウト
checkoutService.checkout(cart);

// 8. 事後の在庫確認
catalog.print();
