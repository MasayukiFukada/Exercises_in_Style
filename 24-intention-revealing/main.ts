// ==========================================
// Style 24: Intention-Revealing (意図開示 / 型注釈)
// ==========================================
// 【制約】
// 1. 変数、定数、引数、クラスプロパティ、関数の戻り値のすべてに対し、明示的に型注釈（Type Annotations）を付与する。
// 2. 暗黙的な型推論に依存することを完全に排除する。
// 3. ドメイン固有の型定義（ブランド型やエイリアス、インターフェース）を積極的に活用し、コード自体の意図を自己開示させる。

// ドメインの意図を開示する型定義
type ProductId = string;
type Price = number;
type Quantity = number;
type StockQuantity = number;
type Money = number;

interface Product {
  readonly id: ProductId;
  readonly name: string;
  readonly price: Price;
  stock: StockQuantity;
}

interface CartItem {
  readonly product: Product;
  qty: Quantity;
}

class ProductImpl implements Product {
  public readonly id: ProductId;
  public readonly name: string;
  public readonly price: Price;
  public stock: StockQuantity;

  constructor(id: ProductId, name: string, price: Price, stock: StockQuantity) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.stock = stock;
  }
}

class CartItemImpl implements CartItem {
  public readonly product: Product;
  public qty: Quantity;

  constructor(product: Product, qty: Quantity) {
    this.product = product;
    this.qty = qty;
  }
}

class ShoppingCart {
  public items: CartItem[] = [];

  public addItem(product: Product | undefined, qty: Quantity): void {
    if (product === undefined) {
      console.log("エラー: 商品情報が不正です。");
      return;
    }
    if (product.stock === 0) {
      console.log(`エラー: ${product.name} は在庫切れです。`);
      return;
    }

    const existing: CartItem | undefined = this.items.find((item: CartItem): boolean => {
      return item.product.id === product.id;
    });

    const currentInCart: Quantity = existing !== undefined ? existing.qty : 0;

    if (product.stock < currentInCart + qty) {
      console.log(`エラー: ${product.name} の在庫が不足しています（要求: ${qty}個, カート内: ${currentInCart}個, 在庫: ${product.stock}個）。`);
      return;
    }

    if (existing !== undefined) {
      existing.qty += qty;
    } else {
      const newItem: CartItem = new CartItemImpl(product, qty);
      this.items.push(newItem);
    }
    console.log(`[OK] カートに追加しました: ${product.name} x ${qty}`);
  }

  public getSubtotal(): Money {
    const subtotal: Money = this.items.reduce((acc: Money, item: CartItem): Money => {
      const itemSubtotal: Money = item.product.price * item.qty;
      return acc + itemSubtotal;
    }, 0);
    return subtotal;
  }

  public clear(): void {
    this.items = [];
  }
}

class Catalog {
  private readonly products: Product[];

  constructor(products: Product[]) {
    this.products = products;
  }

  public findProduct(id: ProductId): Product | undefined {
    const found: Product | undefined = this.products.find((p: Product): boolean => {
      return p.id === id;
    });
    return found;
  }

  public print(): void {
    console.log("=== 商品カタログ ===");
    const len: number = this.products.length;
    for (let i: number = 0; i < len; i += 1) {
      const p: Product = this.products[i];
      console.log(`[${p.id}] ${p.name} / 価格: ${p.price}円 / 在庫: ${p.stock}個`);
    }
    console.log("===================\n");
  }
}

class CheckoutService {
  public checkout(cart: ShoppingCart): void {
    const items: readonly CartItem[] = cart.items;
    const len: number = items.length;
    if (len === 0) {
      console.log("エラー: カートが空です。");
      return;
    }

    console.log("\n--- レシート (Receipt) ---");
    for (let i: number = 0; i < len; i += 1) {
      const item: CartItem = items[i];
      const p: Product = item.product;
      const subtotal: Money = p.price * item.qty;
      console.log(`・${p.name} (${p.price}円) x ${item.qty} = ${subtotal}円`);
    }

    const subtotal: Money = cart.getSubtotal();
    const discount: Money = subtotal >= 3000 ? Math.round(subtotal * 0.1) : 0;
    const paymentTotal: Money = subtotal - discount;

    console.log(`割引前合計: ${subtotal}円`);
    console.log(`割引額: -${discount}円`);
    console.log(`支払合計: ${paymentTotal}円`);
    console.log("-------------------------\n");

    // 各商品の在庫を減算
    for (let i: number = 0; i < len; i += 1) {
      const item: CartItem = items[i];
      const p: Product = item.product;
      p.stock -= item.qty;
    }

    cart.clear();
  }
}

// ==========================================
// テストストーリーの実行
// ==========================================

const products: Product[] = [
  new ProductImpl('PRD-01', 'ノートPC', 100000, 2),
  new ProductImpl('PRD-02', 'マウス', 3000, 5),
  new ProductImpl('PRD-03', 'キーボード', 5000, 0)
];

const catalog: Catalog = new Catalog(products);
const cart: ShoppingCart = new ShoppingCart();
const checkoutService: CheckoutService = new CheckoutService();

// 1. 商品一覧の表示
catalog.print();

// 2. 正常な追加
const mouse: Product | undefined = catalog.findProduct('PRD-02');
cart.addItem(mouse, 1);

// 3. 在庫切れの追加試行
const keyboard: Product | undefined = catalog.findProduct('PRD-03');
cart.addItem(keyboard, 1);

// 4. 在庫超えの追加試行
const laptop: Product | undefined = catalog.findProduct('PRD-01');
cart.addItem(laptop, 3);

// 5. 複数商品の追加 (ノートPCを1個追加)
cart.addItem(laptop, 1);

// 6. カート状態の確認
const currentSubtotal: Money = cart.getSubtotal();
console.log(`カート内合計金額（割引前）: ${currentSubtotal}円`);

// 7. チェックアウト
checkoutService.checkout(cart);

// 8. 事後の在庫確認
catalog.print();
