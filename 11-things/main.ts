// ==========================================
// Style 11: Things (シングズ / モノ - オブジェクト指向)
// ==========================================
// 【制約】
// 1. 現実世界の「モノ」をクラスおよびオブジェクト（インスタンス）として表す。
// 2. 状態（データ）とそれを操作するメソッド（手続き）を一対一でカプセル化する。
// 3. データへの直接アクセスを避け、ゲッターやメソッドを通して操作・問い合わせを行う。

class Product {
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

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getPrice(): number {
    return this.price;
  }

  getStock(): number {
    return this.stock;
  }

  hasStock(qty: number): boolean {
    return this.stock >= qty;
  }

  decreaseStock(qty: number): void {
    if (!this.hasStock(qty)) {
      throw new Error(`在庫不足エラー: ${this.name} (要求: ${qty}, 在庫: ${this.stock})`);
    }
    this.stock -= qty;
  }
}

class CartItem {
  private readonly product: Product;
  private qty: number;

  constructor(product: Product, qty: number) {
    this.product = product;
    this.qty = qty;
  }

  getProduct(): Product {
    return this.product;
  }

  getQty(): number {
    return this.qty;
  }

  addQty(qty: number): void {
    this.qty += qty;
  }

  getSubtotal(): number {
    return this.product.getPrice() * this.qty;
  }
}

class ShoppingCart {
  private items: CartItem[] = [];

  getItems(): readonly CartItem[] {
    return this.items;
  }

  addItem(product: Product, qty: number): void {
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

class Catalog {
  private readonly products: Product[];

  constructor(products: Product[]) {
    this.products = products;
  }

  findProduct(id: string): Product | undefined {
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

class CheckoutService {
  checkout(cart: ShoppingCart): void {
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
