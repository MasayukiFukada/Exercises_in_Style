// ==========================================
// Style 18: Reflective (リフレクティブ - 自己変更 / 動的評価)
// ==========================================
// 【制約】
// 1. プログラムの一部またはビジネスルールを、実行時に動的にコード（文字列）から解釈・生成して実行する。
// 2. 静的に定義されたロジックに縛られず、動的コンパイル（`new Function` や `eval`）を利用して振る舞いを決定する。

// 動的に関数をビルド（コンパイル）するヘルパー
function compileFunction(paramNames: string[], codeStr: string): Function {
  try {
    return new Function(...paramNames, codeStr);
  } catch (err: any) {
    throw new Error(`動的コードのコンパイルエラー: ${err.message}\nコードスニペット: ${codeStr}`);
  }
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
  private items: CartItem[] = [];

  getItems(): readonly CartItem[] {
    return this.items;
  }

  addItem(product: Product, qty: number): void {
    // 在庫超えチェックロジックを動的に生成 (引数名は stock, currentInCart, requestQty)
    const checkStockCode = `
      return stock >= (currentInCart + requestQty);
    `;
    const hasEnoughStock = compileFunction(['stock', 'currentInCart', 'requestQty'], checkStockCode);

    if (product.stock === 0) {
      console.log(`エラー: ${product.name} は在庫切れです。`);
      return;
    }

    const existing = this.items.find(item => item.product.id === product.id);
    const currentInCart = existing ? existing.qty : 0;

    // 動的コンパイルされた関数の実行
    if (!hasEnoughStock(product.stock, currentInCart, qty)) {
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
    // 小計計算ロジックを動的にコンパイル
    const calcSubtotalCode = `
      return items.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
    `;
    const calculator = compileFunction(['items'], calcSubtotalCode);
    return calculator(this.items);
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
    return this.products.find(p => p.id === id);
  }

  print(): void {
    // フォーマット出力を動的に生成
    const catalogPrintCode = `
      console.log("=== 商品カタログ ===");
      for (const p of products) {
        console.log("[" + p.id + "] " + p.name + " / 価格: " + p.price + "円 / 在庫: " + p.stock + "個");
      }
      console.log("===================\\n");
    `;
    const printer = compileFunction(['products'], catalogPrintCode);
    printer(this.products);
  }
}

class CheckoutService {
  checkout(cart: ShoppingCart): void {
    const items = cart.getItems();
    if (items.length === 0) {
      console.log("エラー: カートが空です。");
      return;
    }

    const subtotal = cart.getSubtotal();

    // 1. 割引率計算ルールを動的コードから生成
    const discountRuleCode = `
      return subtotal >= 3000 ? Math.round(subtotal * 0.1) : 0;
    `;
    const calcDiscount = compileFunction(['subtotal'], discountRuleCode);
    const discount = calcDiscount(subtotal);

    // 2. レシート出力を動的コードから生成
    const receiptTemplateCode = `
      let res = "\\n--- レシート (Receipt) ---\\n";
      for (const item of items) {
        res += "・" + item.product.name + " (" + item.product.price + "円) x " + item.qty + " = " + (item.product.price * item.qty) + "円\\n";
      }
      res += "割引前合計: " + subtotal + "円\\n";
      res += "割引額: -" + discount + "円\\n";
      res += "支払合計: " + (subtotal - discount) + "円\\n";
      res += "-------------------------\\n";
      console.log(res);
    `;
    const printReceipt = compileFunction(['items', 'subtotal', 'discount'], receiptTemplateCode);
    printReceipt(items, subtotal, discount);

    // 3. 在庫減算ロジックを動的生成して適用
    const stockReductionCode = `
      for (const item of items) {
        if (item.product.stock < item.qty) {
          throw new Error("在庫不足エラー: " + item.product.name);
        }
        item.product.stock -= item.qty;
      }
    `;
    const reduceStock = compileFunction(['items'], stockReductionCode);
    reduceStock(items);

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
