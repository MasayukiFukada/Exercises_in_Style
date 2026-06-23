// ==========================================
// Style 23: Passive-Aggressive (受動攻撃的 - 例外スロー)
// ==========================================
// 【制約】
// 1. 各メソッドや関数は、エラーが発生した際にその場でエラー処理をしたり回復しようとしたりしない。
// 2. 例外の発生時は即座にスロー（受動攻撃的に例外を上位へ丸投げ）する。
// 3. クラス定義や下位ロジックの中に `try-catch` ブロックを記述することを禁止する。
// 4. すべてのエラーハンドリングとエラーログ出力は、プログラムの最上位レイヤー（メインシナリオ実行部）で一括して行う。

class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly price: number,
    public stock: number
  ) {}

  decreaseStock(qty: number): void {
    if (this.stock < qty) {
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
}

class ShoppingCart {
  public items: CartItem[] = [];

  addItem(product: Product | undefined, qty: number): void {
    if (!product) {
      throw new Error("商品が見つかりません。");
    }
    if (product.stock === 0) {
      throw new Error(`${product.name} は在庫切れです。`);
    }

    const existing = this.items.find(item => item.product.id === product.id);
    const currentInCart = existing ? existing.qty : 0;

    if (product.stock < currentInCart + qty) {
      throw new Error(`${product.name} の在庫が不足しています（要求: ${qty}個, カート内: ${currentInCart}個, 在庫: ${product.stock}個）。`);
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
      throw new Error("カートが空です。");
    }

    console.log("\n--- レシート (Receipt) ---");
    for (const item of cart.items) {
      console.log(`・${item.product.name} (${item.product.price}円) x ${item.qty} = ${item.product.price * item.qty}円`);
    }

    const subtotal = cart.getSubtotal();
    const discount = subtotal >= 3000 ? Math.round(subtotal * 0.1) : 0;

    console.log(`割引前合計: ${subtotal}円`);
    console.log(`割引額: -${discount}円`);
    console.log(`支払合計: ${subtotal - discount}円`);
    console.log("-------------------------\n");

    // 各商品の在庫を減算
    for (const item of cart.items) {
      item.product.decreaseStock(item.qty);
    }

    cart.clear();
  }
}

// ==========================================
// 最上位レイヤー (エラーのキャッチとハンドリングを集中管理)
// ==========================================

const catalog = new Catalog([
  new Product('PRD-01', 'ノートPC', 100000, 2),
  new Product('PRD-02', 'マウス', 3000, 5),
  new Product('PRD-03', 'キーボード', 5000, 0)
]);

const cart = new ShoppingCart();
const checkoutService = new CheckoutService();

// シナリオ実行用のステップを定義
const steps: (() => void)[] = [
  // 1. 商品一覧の表示
  () => catalog.print(),
  
  // 2. 正常な追加
  () => {
    const mouse = catalog.findProduct('PRD-02');
    cart.addItem(mouse, 1);
  },

  // 3. 在庫切れの追加試行
  () => {
    const keyboard = catalog.findProduct('PRD-03');
    cart.addItem(keyboard, 1);
  },

  // 4. 在庫超えの追加試行
  () => {
    const laptop = catalog.findProduct('PRD-01');
    cart.addItem(laptop, 3);
  },

  // 5. 複数商品の追加
  () => {
    const laptop = catalog.findProduct('PRD-01');
    cart.addItem(laptop, 1);
  },

  // 6. カート状態の確認
  () => console.log(`カート内合計金額（割引前）: ${cart.getSubtotal()}円`),

  // 7. チェックアウト
  () => checkoutService.checkout(cart),

  // 8. 事後の在庫確認
  () => catalog.print()
];

// 最上位での一括ループと例外処理
for (const step of steps) {
  try {
    step();
  } catch (error: any) {
    // 例外を受動的に受け取り、ここで初めて出力を行う
    console.log(`エラー: ${error.message}`);
  }
}
