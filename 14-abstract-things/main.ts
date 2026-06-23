// ==========================================
// Style 14: Abstract Things (抽象的なモノ - ADT)
// ==========================================
// 【制約】
// 1. すべてのコンポーネントは、明示的に定義されたインターフェース（抽象データ型 / ADT）を介してのみ対話する。
// 2. 呼び出し元が具象クラス（`class`）の実装詳細やその型に直接依存することを禁止する。
// 3. インスタンスの生成はファクトリパターン（Factory Pattern）を用いて行い、具象クラスのコンストラクタ呼び出し（`new`）を隠蔽する。

// ==========================================
// インターフェース (抽象データ型) の定義
// ==========================================

interface IProduct {
  getId(): string;
  getName(): string;
  getPrice(): number;
  getStock(): number;
  hasStock(qty: number): boolean;
  decreaseStock(qty: number): void;
}

interface ICartItem {
  getProduct(): IProduct;
  getQty(): number;
  addQty(qty: number): void;
  getSubtotal(): number;
}

interface IShoppingCart {
  getItems(): readonly ICartItem[];
  addItem(product: IProduct, qty: number): void;
  getSubtotal(): number;
  clear(): void;
}

interface ICatalog {
  findProduct(id: string): IProduct | undefined;
  print(): void;
}

interface ICheckoutService {
  checkout(cart: IShoppingCart): void;
}

// ==========================================
// 具象クラス (Concrete Classes) の実装
// ==========================================

class Product implements IProduct {
  private readonly id: string;
  private readonly name: string;
  private readonly price: number;
  private stock: number;

  constructor(id: string, name: string, price: number, stock: number) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.stock = stock;
  }

  getId(): string { return this.id; }
  getName(): string { return this.name; }
  getPrice(): number { return this.price; }
  getStock(): number { return this.stock; }

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

class CartItem implements ICartItem {
  private readonly product: IProduct;
  private qty: number;

  constructor(product: IProduct, qty: number) {
    this.product = product;
    this.qty = qty;
  }

  getProduct(): IProduct { return this.product; }
  getQty(): number { return this.qty; }

  addQty(qty: number): void {
    this.qty += qty;
  }

  getSubtotal(): number {
    return this.product.getPrice() * this.qty;
  }
}

class ShoppingCart implements IShoppingCart {
  private items: ICartItem[] = [];

  getItems(): readonly ICartItem[] {
    return this.items;
  }

  addItem(product: IProduct, qty: number): void {
    if (product.getStock() === 0) {
      console.log(`エラー: ${product.getName()} は在庫切れです。`);
      return;
    }

    const existing = this.items.find(item => item.getProduct().getId() === product.getId());
    const currentInCart = existing ? existing.getQty() : 0;

    if (!product.hasStock(currentInCart + qty)) {
      console.log(`エラー: ${product.getName()} の在庫が不足しています（要求: ${qty}個, カート内: ${currentInCart}個, 在庫: ${product.getStock()}個）。`);
      return;
    }

    if (existing) {
      existing.addQty(qty);
    } else {
      this.items.push(new CartItem(product, qty));
    }
    console.log(`[OK] カートに追加しました: ${product.getName()} x ${qty}`);
  }

  getSubtotal(): number {
    return this.items.reduce((acc, item) => acc + item.getSubtotal(), 0);
  }

  clear(): void {
    this.items = [];
  }
}

class Catalog implements ICatalog {
  private readonly products: IProduct[];

  constructor(products: IProduct[]) {
    this.products = products;
  }

  findProduct(id: string): IProduct | undefined {
    return this.products.find(p => p.getId() === id);
  }

  print(): void {
    console.log("=== 商品カタログ ===");
    for (const p of this.products) {
      console.log(`[${p.getId()}] ${p.getName()} / 価格: ${p.getPrice()}円 / 在庫: ${p.getStock()}個`);
    }
    console.log("===================\n");
  }
}

class CheckoutService implements ICheckoutService {
  checkout(cart: IShoppingCart): void {
    const items = cart.getItems();
    if (items.length === 0) {
      console.log("エラー: カートが空です。");
      return;
    }

    console.log("\n--- レシート (Receipt) ---");
    for (const item of items) {
      const p = item.getProduct();
      console.log(`・${p.getName()} (${p.getPrice()}円) x ${item.getQty()} = ${item.getSubtotal()}円`);
    }

    const subtotal = cart.getSubtotal();
    const discount = subtotal >= 3000 ? Math.round(subtotal * 0.1) : 0;

    console.log(`割引前合計: ${subtotal}円`);
    console.log(`割引額: -${discount}円`);
    console.log(`支払合計: ${subtotal - discount}円`);
    console.log("-------------------------\n");

    // 各商品の在庫を減算
    for (const item of items) {
      item.getProduct().decreaseStock(item.getQty());
    }

    cart.clear();
  }
}

// ==========================================
// ファクトリ (Factory) の実装
// ==========================================

class StoreFactory {
  static createProduct(id: string, name: string, price: number, stock: number): IProduct {
    return new Product(id, name, price, stock);
  }

  static createCatalog(products: IProduct[]): ICatalog {
    return new Catalog(products);
  }

  static createShoppingCart(): IShoppingCart {
    return new ShoppingCart();
  }

  static createCheckoutService(): ICheckoutService {
    return new CheckoutService();
  }
}

// ==========================================
// テストストーリーの実行 (インターフェースのみに依存)
// ==========================================

const catalog: ICatalog = StoreFactory.createCatalog([
  StoreFactory.createProduct('PRD-01', 'ノートPC', 100000, 2),
  StoreFactory.createProduct('PRD-02', 'マウス', 3000, 5),
  StoreFactory.createProduct('PRD-03', 'キーボード', 5000, 0)
]);

const cart: IShoppingCart = StoreFactory.createShoppingCart();
const checkoutService: ICheckoutService = StoreFactory.createCheckoutService();

// 1. 商品一覧の表示
catalog.print();

// 2. 正常な追加
const mouse: IProduct | undefined = catalog.findProduct('PRD-02');
if (mouse) cart.addItem(mouse, 1);

// 3. 在庫切れの追加試行
const keyboard: IProduct | undefined = catalog.findProduct('PRD-03');
if (keyboard) cart.addItem(keyboard, 1);

// 4. 在庫超えの追加試行
const laptop: IProduct | undefined = catalog.findProduct('PRD-01');
if (laptop) cart.addItem(laptop, 3);

// 5. 複数商品の追加 (ノートPCを1個追加)
if (laptop) cart.addItem(laptop, 1);

// 6. カート状態の確認
console.log(`カート内合計金額（割引前）: ${cart.getSubtotal()}円`);

// 7. チェックアウト
checkoutService.checkout(cart);

// 8. 事後の在庫確認
catalog.print();
