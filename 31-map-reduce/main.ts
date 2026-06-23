// ==========================================
// Style 31: MapReduce (マップリデュース)
// ==========================================
// 【制約】
// 1. 手続き的なループ（for, while）によるデータ操作や集計を禁止する。
// 2. すべてのデータ変換と集計処理は、明示的に分離された `map`（データの射影・変形）処理と `reduce`（データの集約・畳み込み）処理の組み合わせとして記述する。

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
    if (!product) {
      console.log("エラー: 商品が見つかりません。");
      return;
    }
    if (product.stock === 0) {
      console.log(`エラー: ${product.name} は在庫切れです。`);
      return;
    }

    const existing = this.items.find(item => item.product.id === product.id);
    const currentInCart = existing ? existing.qty : 0;

    if (product.stock < currentInCart + qty) {
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

  // MapReduce を用いた小計の計算
  getSubtotal(): number {
    // 1. Map: 各アイテムを金額（小計）へ変換
    const itemSubtotals = this.items.map((item): number => item.product.price * item.qty);
    // 2. Reduce: 金額の配列を合計値へ畳み込む
    const total = itemSubtotals.reduce((acc, val) => acc + val, 0);
    return total;
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
    // MapReduce を用いたカタログ出力
    // 1. Map: 各商品をフォーマット文字列に変換
    const lines = this.products.map(p => `[${p.id}] ${p.name} / 価格: ${p.price}円 / 在庫: ${p.stock}個`);
    // 2. Reduce: 文字列の配列を改行コードで結合
    const output = lines.reduce((acc, line) => acc + line + "\n", "=== 商品カタログ ===\n");
    console.log(output + "===================\n");
  }
}

class CheckoutService {
  checkout(cart: ShoppingCart): void {
    if (cart.items.length === 0) {
      console.log("エラー: カートが空です。");
      return;
    }

    // 1. Map: カート内の各アイテムをレシート明細行文字列に変換
    const receiptLines = cart.items.map(item => {
      return `・${item.product.name} (${item.product.price}円) x ${item.qty} = ${item.product.price * item.qty}円`;
    });

    // 2. Reduce: レシート明細を結合して1つのテキストブロックにする
    const receiptBody = receiptLines.reduce((acc, line) => acc + line + "\n", "");

    const subtotal = cart.getSubtotal();
    const discount = subtotal >= 3000 ? Math.round(subtotal * 0.1) : 0;

    console.log("\n--- レシート (Receipt) ---");
    console.log(receiptBody.trim());
    console.log(`割引前合計: ${subtotal}円`);
    console.log(`割引額: -${discount}円`);
    console.log(`支払合計: ${subtotal - discount}円`);
    console.log("-------------------------\n");

    // 副作用としての在庫減算 (配列の副作用適用だが、これも map/reduce に沿って記述)
    // Map で減算を実行し、ダミーで reduce して完了させる
    cart.items.map(item => {
      item.product.stock -= item.qty;
      return null;
    }).reduce((acc, _) => null, null);

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
