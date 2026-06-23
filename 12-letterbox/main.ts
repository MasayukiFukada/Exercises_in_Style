// ==========================================
// Style 12: Letterbox (レターボックス - メッセージング)
// ==========================================
// 【制約】
// 1. オブジェクトの具体的なメソッドを直接呼び出すことを禁止する。
// 2. オブジェクト間のやり取りは、すべてメッセージ送信（`dispatch` メソッドの呼び出し）のみで行う。
// 3. メッセージは「メッセージ名」と「引数のリスト」からなるタプル（配列）として表現する。

type Message = [string, ...any[]];

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

  // 唯一の公開インターフェース
  dispatch(message: Message): any {
    const [action, ...args] = message;
    switch (action) {
      case 'get_id':
        return this.id;
      case 'get_name':
        return this.name;
      case 'get_price':
        return this.price;
      case 'get_stock':
        return this.stock;
      case 'has_stock':
        return this.stock >= args[0];
      case 'decrease_stock':
        const qty = args[0];
        if (this.stock < qty) {
          throw new Error(`在庫不足エラー: ${this.name}`);
        }
        this.stock -= qty;
        return;
      default:
        throw new Error(`未知のメッセージ: ${action}`);
    }
  }
}

class CartItem {
  private readonly product: Product;
  private qty: number;

  constructor(product: Product, qty: number) {
    this.product = product;
    this.qty = qty;
  }

  dispatch(message: Message): any {
    const [action, ...args] = message;
    switch (action) {
      case 'get_product':
        return this.product;
      case 'get_qty':
        return this.qty;
      case 'add_qty':
        this.qty += args[0];
        return;
      case 'get_subtotal':
        const price = this.product.dispatch(['get_price']);
        return price * this.qty;
      default:
        throw new Error(`未知のメッセージ: ${action}`);
    }
  }
}

class ShoppingCart {
  private items: CartItem[] = [];

  dispatch(message: Message): any {
    const [action, ...args] = message;
    switch (action) {
      case 'get_items':
        return this.items;
      case 'add_item': {
        const product = args[0] as Product;
        const qty = args[1] as number;
        const name = product.dispatch(['get_name']);
        const stock = product.dispatch(['get_stock']);

        if (stock === 0) {
          console.log(`エラー: ${name} は在庫切れです。`);
          return;
        }

        const existing = this.items.find(
          item => item.dispatch(['get_product']).dispatch(['get_id']) === product.dispatch(['get_id'])
        );
        const currentInCart = existing ? existing.dispatch(['get_qty']) : 0;

        if (!product.dispatch(['has_stock', currentInCart + qty])) {
          console.log(`エラー: ${name} の在庫が不足しています（要求: ${qty}個, カート内: ${currentInCart}個, 在庫: ${stock}個）。`);
          return;
        }

        if (existing) {
          existing.dispatch(['add_qty', qty]);
        } else {
          this.items.push(new CartItem(product, qty));
        }
        console.log(`[OK] カートに追加しました: ${name} x ${qty}`);
        return;
      }
      case 'get_subtotal':
        return this.items.reduce((acc, item) => acc + (item.dispatch(['get_subtotal']) as number), 0);
      case 'clear':
        this.items = [];
        return;
      default:
        throw new Error(`未知のメッセージ: ${action}`);
    }
  }
}

class Catalog {
  private readonly products: Product[];

  constructor(products: Product[]) {
    this.products = products;
  }

  dispatch(message: Message): any {
    const [action, ...args] = message;
    switch (action) {
      case 'find':
        const targetId = args[0];
        return this.products.find(p => p.dispatch(['get_id']) === targetId);
      case 'print':
        console.log("=== 商品カタログ ===");
        for (const p of this.products) {
          const id = p.dispatch(['get_id']);
          const name = p.dispatch(['get_name']);
          const price = p.dispatch(['get_price']);
          const stock = p.dispatch(['get_stock']);
          console.log(`[${id}] ${name} / 価格: ${price}円 / 在庫: ${stock}個`);
        }
        console.log("===================\n");
        return;
      default:
        throw new Error(`未知のメッセージ: ${action}`);
    }
  }
}

class CheckoutService {
  dispatch(message: Message): any {
    const [action, ...args] = message;
    switch (action) {
      case 'checkout': {
        const cart = args[0] as ShoppingCart;
        const items = cart.dispatch(['get_items']) as CartItem[];
        if (items.length === 0) {
          console.log("エラー: カートが空です。");
          return;
        }

        console.log("\n--- レシート (Receipt) ---");
        for (const item of items) {
          const p = item.dispatch(['get_product']) as Product;
          const name = p.dispatch(['get_name']);
          const price = p.dispatch(['get_price']);
          const qty = item.dispatch(['get_qty']);
          const subtotal = item.dispatch(['get_subtotal']);
          console.log(`・${name} (${price}円) x ${qty} = ${subtotal}円`);
        }

        const subtotal = cart.dispatch(['get_subtotal']) as number;
        const discount = subtotal >= 3000 ? Math.round(subtotal * 0.1) : 0;

        console.log(`割引前合計: ${subtotal}円`);
        console.log(`割引額: -${discount}円`);
        console.log(`支払合計: ${subtotal - discount}円`);
        console.log("-------------------------\n");

        // 在庫減算
        for (const item of items) {
          const p = item.dispatch(['get_product']) as Product;
          const qty = item.dispatch(['get_qty']);
          p.dispatch(['decrease_stock', qty]);
        }

        cart.dispatch(['clear']);
        return;
      }
      default:
        throw new Error(`未知のメッセージ: ${action}`);
    }
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
catalog.dispatch(['print']);

// 2. 正常な追加
const mouse = catalog.dispatch(['find', 'PRD-02']);
if (mouse) cart.dispatch(['add_item', mouse, 1]);

// 3. 在庫切れの追加試行
const keyboard = catalog.dispatch(['find', 'PRD-03']);
if (keyboard) cart.dispatch(['add_item', keyboard, 1]);

// 4. 在庫超えの追加試行
const laptop = catalog.dispatch(['find', 'PRD-01']);
if (laptop) cart.dispatch(['add_item', laptop, 3]);

// 5. 複数商品の追加 (ノートPCを1個追加)
if (laptop) cart.dispatch(['add_item', laptop, 1]);

// 6. カート状態の確認
console.log(`カート内合計金額（割引前）: ${cart.dispatch(['get_subtotal'])}円`);

// 7. チェックアウト
checkoutService.dispatch(['checkout', cart]);

// 8. 事後の在庫確認
catalog.dispatch(['print']);
