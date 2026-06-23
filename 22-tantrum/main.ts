// ==========================================
// Style 22: Tantrum (かんしゃく / 契約による設計)
// ==========================================
// 【制約】
// 1. 各処理の開始時（事前条件）、終了時（事後条件）、および状態の一貫性（不変条件）を厳密に定義する。
// 2. いずれかの条件が少しでも満たされない場合、即座に例外（アサーションエラー）を投げて「かんしゃく」を起こす。
// 3. 例外の発生によって、不整合な状態での処理の継続を即座に拒否する。

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`契約違反 (Assertion Failed): ${message}`);
  }
}

class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly price: number,
    public stock: number
  ) {
    // 不変条件: 価格と在庫数は常に0以上
    assert(price >= 0, "価格は0以上でなければなりません。");
    assert(stock >= 0, "在庫数は0以上でなければなりません。");
  }

  decreaseStock(qty: number): void {
    // 事前条件
    assert(qty > 0, "減算する数量は0より大きくなければなりません。");
    assert(this.stock >= qty, `在庫が不足しています（要求: ${qty}個, 在庫: ${this.stock}個）。`);

    const originalStock = this.stock;

    this.stock -= qty;

    // 事後条件
    assert(this.stock === originalStock - qty, "在庫の減算計算が正しく行われませんでした。");
    assert(this.stock >= 0, "事後の在庫数が負の値になっています。");
  }
}

class CartItem {
  constructor(
    public readonly product: Product,
    public qty: number
  ) {
    assert(qty > 0, "カートアイテムの数量は0より大きくなければなりません。");
  }
}

class ShoppingCart {
  public items: CartItem[] = [];

  addItem(product: Product | undefined, qty: number): void {
    // 事前条件: 商品が存在すること
    assert(product !== undefined, "商品は必須です。");
    // 事前条件: 数量は正の整数
    assert(qty > 0, "追加する数量は0より大きくなければなりません。");
    
    const existing = this.items.find(item => item.product.id === product!.id);
    const currentInCart = existing ? existing.qty : 0;
    
    // 事前条件: 在庫チェック (在庫切れ)
    assert(product!.stock > 0, `${product!.name} は在庫切れです。`);
    // 事前条件: 在庫チェック (在庫超え)
    assert(
      product!.stock >= currentInCart + qty,
      `${product!.name} の在庫が不足しています（要求: ${qty}個, カート内: ${currentInCart}個, 在庫: ${product!.stock}個）。`
    );

    const originalItemCount = this.items.length;
    const originalQtyInCart = currentInCart;

    if (existing) {
      existing.qty += qty;
    } else {
      this.items.push(new CartItem(product!, qty));
    }

    // 事後条件
    const updatedItem = this.items.find(item => item.product.id === product!.id);
    assert(updatedItem !== undefined, "追加されたアイテムがカート内に見つかりません。");
    assert(updatedItem!.qty === originalQtyInCart + qty, "カート内の数量が正しく増加していません。");
    if (!existing) {
      assert(this.items.length === originalItemCount + 1, "カートのアイテム件数が正しく増えていません。");
    }

    console.log(`[OK] カートに追加しました: ${product!.name} x ${qty}`);
  }

  getSubtotal(): number {
    const subtotal = this.items.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
    // 不変条件チェック
    assert(subtotal >= 0, "合計金額は0以上でなければなりません。");
    return subtotal;
  }

  clear(): void {
    this.items = [];
    assert(this.items.length === 0, "カートが正しくクリアされませんでした。");
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
    // 事前条件
    assert(cart.items.length > 0, "カートが空です。");

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
    
    // 事後条件
    assert(cart.items.length === 0, "チェックアウト完了後もカートがクリアされていません。");
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
try {
  cart.addItem(mouse, 1);
} catch (e: any) {
  console.log(`エラー: ${e.message}`);
}

// 3. 在庫切れの追加試行 (契約違反のため例外が飛び、それをキャッチして出力)
const keyboard = catalog.findProduct('PRD-03');
try {
  cart.addItem(keyboard, 1);
} catch (e: any) {
  // 契約違反の prefix を除外して共通仕様のエラーメッセージ形式に整形
  console.log(`エラー: ${e.message.replace('契約違反 (Assertion Failed): ', '')}`);
}

// 4. 在庫超えの追加試行 (契約違反例外のキャッチ)
const laptop = catalog.findProduct('PRD-01');
try {
  cart.addItem(laptop, 3);
} catch (e: any) {
  console.log(`エラー: ${e.message.replace('契約違反 (Assertion Failed): ', '')}`);
}

// 5. 複数商品の追加 (ノートPCを1個追加)
try {
  cart.addItem(laptop, 1);
} catch (e: any) {
  console.log(`エラー: ${e.message}`);
}

// 6. カート状態の確認
console.log(`カート内合計金額（割引前）: ${cart.getSubtotal()}円`);

// 7. チェックアウト
try {
  checkoutService.checkout(cart);
} catch (e: any) {
  console.log(`エラー: ${e.message}`);
}

// 8. 事後の在庫確認
catalog.print();
