// ==========================================
// Style 33: Trinity (三位一体 - MVC)
// ==========================================
// 【制約】
// 1. システムを Model（状態とビジネスルール）、View（出力の表現）、Controller（ユーザーアクションの制御）に厳密に分離する。
// 2. Modelは View や Controller について一切知らない（依存しない）。状態が変化した際は、オブザーバーパターンを介して View に間接的に通知する。
// 3. View は Model のデータを表現する。Model の変更を購読し、通知を契機に再描画（コンソール出力）を行う。
// 4. Controller は操作要求を受け取り、Model を更新する。

type Listener = () => void;

class Observable {
  private listeners: Listener[] = [];

  subscribe(listener: Listener): void {
    this.listeners.push(listener);
  }

  protected notify(): void {
    for (const l of this.listeners) {
      l();
    }
  }
}

// ==========================================
// Models (状態と純粋なビジネスロジック)
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

class CatalogModel extends Observable {
  constructor(public products: Product[]) {
    super();
  }

  findProduct(id: string): Product | undefined {
    return this.products.find(p => p.id === id);
  }

  // 在庫の減算 (状態が変化するため View に通知)
  reduceStock(productId: string, qty: number): void {
    const p = this.findProduct(productId);
    if (p) {
      p.stock -= qty;
      this.notify();
    }
  }
}

class CartModel extends Observable {
  public items: CartItem[] = [];
  public errorMessage: string | null = null;
  public justCheckedOut = false;
  public lastReceipt: { items: { name: string; price: number; qty: number; sub: number }[]; subtotal: number; discount: number } | null = null;

  addItem(product: Product, qty: number): void {
    this.errorMessage = null;
    this.justCheckedOut = false;

    if (product.stock === 0) {
      this.errorMessage = `エラー: ${product.name} は在庫切れです。`;
      this.notify();
      return;
    }

    const existing = this.items.find(item => item.product.id === product.id);
    const currentInCart = existing ? existing.qty : 0;

    if (product.stock < currentInCart + qty) {
      this.errorMessage = `エラー: ${product.name} の在庫が不足しています（要求: ${qty}個, カート内: ${currentInCart}個, 在庫: ${product.stock}個）。`;
      this.notify();
      return;
    }

    if (existing) {
      existing.qty += qty;
    } else {
      this.items.push(new CartItem(product, qty));
    }
    
    console.log(`[OK] カートに追加しました: ${product.name} x ${qty}`);
    this.notify(); // 状態変更通知
  }

  getSubtotal(): number {
    return this.items.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
  }

  checkout(catalog: CatalogModel): void {
    this.errorMessage = null;
    if (this.items.length === 0) {
      this.errorMessage = "エラー: カートが空です。";
      this.notify();
      return;
    }

    const subtotal = this.getSubtotal();
    const discount = subtotal >= 3000 ? Math.round(subtotal * 0.1) : 0;

    // レシート情報を確定
    this.lastReceipt = {
      items: this.items.map(item => ({
        name: item.product.name,
        price: item.product.price,
        qty: item.qty,
        sub: item.product.price * item.qty
      })),
      subtotal,
      discount
    };

    // 在庫の減算 (CatalogModel を更新)
    for (const item of this.items) {
      catalog.reduceStock(item.product.id, item.qty);
    }

    this.items = []; // カートクリア
    this.justCheckedOut = true;
    this.notify(); // 状態変更通知
  }
}

// ==========================================
// Views (出力表示 - Modelの更新イベントを購読)
// ==========================================

class CatalogView {
  constructor(private model: CatalogModel) {
    // Modelの変更を購読
    this.model.subscribe(() => this.render());
  }

  render(): void {
    console.log("=== 商品カタログ ===");
    for (const p of this.model.products) {
      console.log(`[${p.id}] ${p.name} / 価格: ${p.price}円 / 在庫: ${p.stock}個`);
    }
    console.log("===================\n");
  }
}

class CartView {
  constructor(private model: CartModel) {
    this.model.subscribe(() => this.render());
  }

  render(): void {
    // エラーがセットされていたら表示
    if (this.model.errorMessage) {
      console.log(this.model.errorMessage);
      this.model.errorMessage = null; // 表示後にリセット
    }

    // チェックアウト完了時のレシート印刷
    if (this.model.justCheckedOut && this.model.lastReceipt) {
      console.log("\n--- レシート (Receipt) ---");
      for (const item of this.model.lastReceipt.items) {
        console.log(`・${item.name} (${item.price}円) x ${item.qty} = ${item.sub}円`);
      }
      const total = this.model.lastReceipt.subtotal - this.model.lastReceipt.discount;
      console.log(`割引前合計: ${this.model.lastReceipt.subtotal}円`);
      console.log(`割引額: -${this.model.lastReceipt.discount}円`);
      console.log(`支払合計: ${total}円`);
      console.log("-------------------------\n");
      this.model.justCheckedOut = false;
      this.model.lastReceipt = null;
    }
  }
}

// ==========================================
// Controller (リクエスト受付とModelの更新呼び出し)
// ==========================================

class AppController {
  constructor(
    private catalogModel: CatalogModel,
    private cartModel: CartModel
  ) {}

  addToCart(productId: string, qty: number): void {
    const product = this.catalogModel.findProduct(productId);
    if (!product) {
      console.log(`エラー: 商品 ${productId} が見つかりません。`);
      return;
    }
    // Modelの更新
    this.cartModel.addItem(product, qty);
  }

  checkout(): void {
    // Modelの更新
    this.cartModel.checkout(this.catalogModel);
  }
}

// ==========================================
// テストストーリーの実行
// ==========================================

const catalogModel = new CatalogModel([
  new Product('PRD-01', 'ノートPC', 100000, 2),
  new Product('PRD-02', 'マウス', 3000, 5),
  new Product('PRD-03', 'キーボード', 5000, 0)
]);
const cartModel = new CartModel();

// Viewの初期化 (Modelの監視を開始)
const catalogView = new CatalogView(catalogModel);
const cartView = new CartView(cartModel);

// Controllerの初期化
const controller = new AppController(catalogModel, cartModel);

// 1. 商品一覧の表示 (手動で初期描画)
catalogView.render();

// 2. 正常な追加
controller.addToCart('PRD-02', 1);

// 3. 在庫切れの追加試行 (Viewが自動でエラーを検知・描画する)
controller.addToCart('PRD-03', 1);

// 4. 在庫超えの追加試行
controller.addToCart('PRD-01', 3);

// 5. 複数商品の追加 (ノートPCを1個追加)
controller.addToCart('PRD-01', 1);

// 6. カート状態の確認
console.log(`カート内合計金額（割引前）: ${cartModel.getSubtotal()}円`);

// 7. チェックアウト (Viewが自動でレシート描画 ＆ カタログ在庫更新に伴うカタログの再描画を行う)
controller.checkout();
