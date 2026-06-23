// ==========================================
// Style 21: Constructivist (構造主義者 / 防御的)
// ==========================================
// 【制約】
// 1. エラーや想定外の事態に直面しても、例外をスローしたりプログラムを異常終了させたりしない。
// 2. 入力データや現在の状態を各ステップで注意深く検証する。
// 3. 異常値や制約違反が検出された場合、安全なデフォルト値や、処理可能な上限値にフォールバックして処理を継続する。

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
    // 防御的対策1: 商品が存在しない場合はダミー商品にフォールバック
    const safeProduct = product || new Product('DUMMY', '代替商品(未登録)', 0, 999);
    
    // 防御的対策2: 数量が0以下なら1に補正
    const safeQty = qty <= 0 ? 1 : qty;

    // 防御的対策3: 在庫数に応じた追加可能数の自動決定
    const existing = this.items.find(item => item.product.id === safeProduct.id);
    const currentInCart = existing ? existing.qty : 0;

    const availableStock = safeProduct.stock;
    if (availableStock <= 0) {
      console.log(`[警告] ${safeProduct.name} は在庫切れのため、カートに追加されませんでした。`);
      return;
    }

    let addAmount = safeQty;
    if (availableStock < currentInCart + safeQty) {
      addAmount = availableStock - currentInCart;
      console.log(`[警告] ${safeProduct.name} の在庫が不足しています。要求数量: ${safeQty}個に対し、引き当て可能な ${addAmount}個 のみ追加します。`);
    }

    if (addAmount <= 0) {
      return; // すでに最大数カートにある
    }

    if (existing) {
      existing.qty += addAmount;
    } else {
      this.items.push(new CartItem(safeProduct, addAmount));
    }
    console.log(`[OK] カートに追加しました: ${safeProduct.name} x ${addAmount}`);
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
    // 防御的対策: idが空や無効な場合はundefinedを安全に返す
    if (!id) return undefined;
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
    const items = cart.items;
    
    // 防御的対策: カートが空の場合はメッセージを出力して安全に終了
    if (items.length === 0) {
      console.log("[警告] カートが空のためチェックアウトをスキップします。");
      return;
    }

    console.log("\n--- レシート (Receipt) ---");
    for (const item of items) {
      console.log(`・${item.product.name} (${item.product.price}円) x ${item.qty} = ${item.product.price * item.qty}円`);
    }

    const subtotal = cart.getSubtotal();
    const discount = subtotal >= 3000 ? Math.round(subtotal * 0.1) : 0;

    console.log(`割引前合計: ${subtotal}円`);
    console.log(`割引額: -${discount}円`);
    console.log(`支払合計: ${subtotal - discount}円`);
    console.log("-------------------------\n");

    // 各商品の在庫を減算 (ここでも在庫数を超えないよう安全に減算)
    for (const item of items) {
      const actualDeduct = Math.min(item.product.stock, item.qty);
      item.product.stock -= actualDeduct;
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
cart.addItem(mouse, 1);

// 3. 在庫切れの追加試行 (エラーで止めず、警告を表示して継続)
const keyboard = catalog.findProduct('PRD-03');
cart.addItem(keyboard, 1);

// 4. 在庫超えの追加試行 (エラーで止めず、最大引き当て可能数である2個を安全に追加)
const laptop = catalog.findProduct('PRD-01');
cart.addItem(laptop, 3);

// 5. 複数商品の追加 (ノートPCをさらに1個追加しようとするが、すでにカートに2個あるため追加されない)
cart.addItem(laptop, 1);

// 6. カート状態の確認
console.log(`カート内合計金額（割引前）: ${cart.getSubtotal()}円`);

// 7. チェックアウト
checkoutService.checkout(cart);

// 8. 事後の在庫確認
catalog.print();
