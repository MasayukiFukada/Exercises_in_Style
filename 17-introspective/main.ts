// ==========================================
// Style 17: Introspective (イントロスペクティブ - 内省)
// ==========================================
// 【制約】
// 1. 実行時にオブジェクトや関数の属性、メソッド、型を調べて動作を決める。
// 2. 静的なメソッド名による呼び出しを避け、実行時にプロパティの存在確認や型チェックを行って動的に呼び出す。
// 3. オブジェクトのダンプや表示の際、プロパティ一覧を動的に走査・取得して処理する。

// 実行時にオブジェクトのメソッドを動的に探索して実行するヘルパー
function runMethod(target: any, methodName: string, ...args: any[]): any {
  // 1. ターゲットがオブジェクトであるか確認
  if (typeof target !== 'object' || target === null) {
    throw new Error(`エラー: ターゲットがオブジェクトではありません。(${typeof target})`);
  }

  // 2. メソッドの存在確認
  if (!(methodName in target)) {
    // ターゲットのクラス名を取得 (内省)
    const className = Object.getPrototypeOf(target)?.constructor?.name || 'Unknown';
    throw new Error(`エラー: クラス ${className} にメソッド '${methodName}' は存在しません。`);
  }

  // 3. プロパティが関数（メソッド）か確認
  if (typeof target[methodName] !== 'function') {
    throw new Error(`エラー: プロパティ '${methodName}' はメソッドではありません。`);
  }

  // 4. 動的実行
  return target[methodName](...args);
}

// 実行時にオブジェクトのプロパティ（データ）を動的に抽出して値を取得するヘルパー
function inspectProperty(target: any, propName: string): any {
  if (typeof target !== 'object' || target === null) {
    return undefined;
  }
  if (propName in target) {
    return target[propName];
  }
  return undefined;
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

  hasStock(qty: number): boolean {
    return this.stock >= qty;
  }

  decreaseStock(qty: number): void {
    if (!this.hasStock(qty)) {
      throw new Error(`在庫不足エラー: ${this.name}`);
    }
    this.stock -= qty;
  }
}

class CartItem {
  constructor(
    public readonly product: Product,
    public qty: number
  ) {}

  addQty(qty: number): void {
    this.qty += qty;
  }

  getSubtotal(): number {
    return this.product.price * this.qty;
  }
}

class ShoppingCart {
  private items: CartItem[] = [];

  getItems(): readonly CartItem[] {
    return this.items;
  }

  addItem(product: Product, qty: number): void {
    // 内部的にも inspectProperty / runMethod を多用して内省スタイルを徹底
    const stock = inspectProperty(product, 'stock');
    const name = inspectProperty(product, 'name');
    const id = inspectProperty(product, 'id');

    if (stock === 0) {
      console.log(`エラー: ${name} は在庫切れです。`);
      return;
    }

    const existing = this.items.find(item => {
      const p = inspectProperty(item, 'product');
      return inspectProperty(p, 'id') === id;
    });

    const currentInCart = existing ? inspectProperty(existing, 'qty') : 0;

    const hasStock = runMethod(product, 'hasStock', currentInCart + qty);
    if (!hasStock) {
      console.log(`エラー: ${name} の在庫が不足しています（要求: ${qty}個, カート内: ${currentInCart}個, 在庫: ${stock}個）。`);
      return;
    }

    if (existing) {
      runMethod(existing, 'addQty', qty);
    } else {
      this.items.push(new CartItem(product, qty));
    }
    console.log(`[OK] カートに追加しました: ${name} x ${qty}`);
  }

  getSubtotal(): number {
    return this.items.reduce((acc, item) => {
      const subtotal = runMethod(item, 'getSubtotal');
      return acc + subtotal;
    }, 0);
  }

  clear(): void {
    this.items = [];
  }
}

class Catalog {
  private readonly products: Product[];

  constructor(products: Product[]) {
    this.products = products;
  }

  findProduct(id: string): Product | undefined {
    return this.products.find(p => inspectProperty(p, 'id') === id);
  }

  print(): void {
    console.log("=== 商品カタログ ===");
    for (const p of this.products) {
      // ゲッターを呼ばず、オブジェクトのプロパティを動的に走査して内省的に値を取得
      let id = "";
      let name = "";
      let price = 0;
      let stock = 0;

      for (const key of Object.getOwnPropertyNames(p)) {
        const val = (p as any)[key];
        if (key === 'id') id = val;
        else if (key === 'name') name = val;
        else if (key === 'price') price = val;
        else if (key === 'stock') stock = val;
      }
      console.log(`[${id}] ${name} / 価格: ${price}円 / 在庫: ${stock}個`);
    }
    console.log("===================\n");
  }
}

class CheckoutService {
  checkout(cart: ShoppingCart): void {
    const items = runMethod(cart, 'getItems') as CartItem[];
    if (items.length === 0) {
      console.log("エラー: カートが空です。");
      return;
    }

    console.log("\n--- レシート (Receipt) ---");
    for (const item of items) {
      const p = inspectProperty(item, 'product') as Product;
      const name = inspectProperty(p, 'name');
      const price = inspectProperty(p, 'price');
      const qty = inspectProperty(item, 'qty');
      const subtotal = runMethod(item, 'getSubtotal');
      console.log(`・${name} (${price}円) x ${qty} = ${subtotal}円`);
    }

    const subtotal = runMethod(cart, 'getSubtotal') as number;
    const discount = subtotal >= 3000 ? Math.round(subtotal * 0.1) : 0;

    console.log(`割引前合計: ${subtotal}円`);
    console.log(`割引額: -${discount}円`);
    console.log(`支払合計: ${subtotal - discount}円`);
    console.log("-------------------------\n");

    // 各商品の在庫を減算
    for (const item of items) {
      const p = inspectProperty(item, 'product') as Product;
      const qty = inspectProperty(item, 'qty');
      runMethod(p, 'decreaseStock', qty);
    }

    runMethod(cart, 'clear');
  }
}

// ==========================================
// テストストーリーの実行 (すべて runMethod 経由で実行)
// ==========================================

const catalog = new Catalog([
  new Product('PRD-01', 'ノートPC', 100000, 2),
  new Product('PRD-02', 'マウス', 3000, 5),
  new Product('PRD-03', 'キーボード', 5000, 0)
]);

const cart = new ShoppingCart();
const checkoutService = new CheckoutService();

// 1. 商品一覧の表示
runMethod(catalog, 'print');

// 2. 正常な追加
const mouse = runMethod(catalog, 'findProduct', 'PRD-02');
if (mouse) {
  runMethod(cart, 'addItem', mouse, 1);
}

// 3. 在庫切れの追加試行
const keyboard = runMethod(catalog, 'findProduct', 'PRD-03');
if (keyboard) {
  runMethod(cart, 'addItem', keyboard, 1);
}

// 4. 在庫超えの追加試行
const laptop = runMethod(catalog, 'findProduct', 'PRD-01');
if (laptop) {
  runMethod(cart, 'addItem', laptop, 3);
}

// 5. 複数商品の追加 (ノートPCを1個追加)
if (laptop) {
  runMethod(cart, 'addItem', laptop, 1);
}

// 6. カート状態の確認
const subtotal = runMethod(cart, 'getSubtotal');
console.log(`カート内合計金額（割引前）: ${subtotal}円`);

// 7. チェックアウト
runMethod(checkoutService, 'checkout', cart);

// 8. 事後の在庫確認
runMethod(catalog, 'print');
