// ==========================================
// Style 15: Hollywood (ハリウッド - 制御の反転)
// ==========================================
// 【制約】
// 1. "Don't call us, we'll call you" (ハリウッドの原則)。
// 2. メインの実行フローが、同期的にオブジェクトのメソッドを呼び出して結果を待ち、順次処理を進めることを禁止する。
// 3. すべての処理はイベント駆動、またはコールバックの登録によって行われ、下位コンポーネントの処理完了がトリガーとなって次のフェーズの処理が呼び出される。

interface App {
  register(event: string, handler: (...args: any[]) => void): void;
  trigger(event: string, ...args: any[]): void;
}

class HollywoodApp implements App {
  private handlers: Record<string, ((...args: any[]) => void)[]> = {};

  register(event: string, handler: (...args: any[]) => void): void {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event].push(handler);
  }

  trigger(event: string, ...args: any[]): void {
    if (this.handlers[event]) {
      for (const h of this.handlers[event]) {
        h(...args);
      }
    }
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

class Catalog {
  private products: Product[];

  constructor(products: Product[], private app: App) {
    this.products = products;
    
    // イベント登録
    this.app.register('request_catalog_print', (onCompleteEvent: string) => this.print(onCompleteEvent));
    this.app.register('request_product_check', (id: string, qty: number, onSuccessEvent: string, onFailureEvent: string) => {
      const p = this.products.find(prod => prod.id === id);
      if (!p) {
        this.app.trigger(onFailureEvent, `エラー: 商品 ${id} が見つかりません。`);
        return;
      }
      if (p.stock === 0) {
        this.app.trigger(onFailureEvent, `エラー: ${p.name} は在庫切れです。`);
        return;
      }
      if (p.stock < qty) {
        this.app.trigger(onFailureEvent, `エラー: ${p.name} の在庫が不足しています（要求: ${qty}個, カート内: 0個, 在庫: ${p.stock}個）。`);
        return;
      }
      this.app.trigger(onSuccessEvent, p, qty);
    });
    this.app.register('request_stock_reduction', (items: { product: Product, qty: number }[], onCompleteEvent: string) => {
      for (const item of items) {
        item.product.stock -= item.qty;
      }
      this.app.trigger(onCompleteEvent);
    });
  }

  private print(onCompleteEvent: string): void {
    console.log("=== 商品カタログ ===");
    for (const p of this.products) {
      console.log(`[${p.id}] ${p.name} / 価格: ${p.price}円 / 在庫: ${p.stock}個`);
    }
    console.log("===================\n");
    this.app.trigger(onCompleteEvent);
  }
}

class ShoppingCart {
  private items: { product: Product, qty: number }[] = [];

  constructor(private app: App) {
    this.app.register('add_item_to_cart', (product: Product, qty: number, onCompleteEvent: string) => {
      const existing = this.items.find(item => item.product.id === product.id);
      if (existing) {
        existing.qty += qty;
      } else {
        this.items.push({ product, qty });
      }
      console.log(`[OK] カートに追加しました: ${product.name} x ${qty}`);
      this.app.trigger(onCompleteEvent);
    });

    this.app.register('request_cart_subtotal', (onResultEvent: string) => {
      const subtotal = this.items.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
      this.app.trigger(onResultEvent, subtotal);
    });

    this.app.register('request_checkout_items', (onResultEvent: string) => {
      this.app.trigger(onResultEvent, [...this.items]);
    });

    this.app.register('request_cart_clear', (onCompleteEvent: string) => {
      this.items = [];
      this.app.trigger(onCompleteEvent);
    });
  }
}

class CheckoutService {
  constructor(private app: App) {
    this.app.register('request_checkout', (onCompleteEvent: string) => {
      // 一時的な完了イベント名を記憶させておくために、イベントハンドラーをその都度登録するか、
      // あるいは、一連のチェックアウトフローの終端で onCompleteEvent をトリガーする。
      
      const onItemsReceived = (items: { product: Product, qty: number }[]) => {
        if (items.length === 0) {
          console.log("エラー: カートが空です。");
          this.app.trigger(onCompleteEvent);
          return;
        }

        console.log("\n--- レシート (Receipt) ---");
        for (const item of items) {
          console.log(`·${item.product.name} (${item.product.price}円) x ${item.qty} = ${item.product.price * item.qty}円`);
        }

        const subtotal = items.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
        const discount = subtotal >= 3000 ? Math.round(subtotal * 0.1) : 0;

        console.log(`割引前合計: ${subtotal}円`);
        console.log(`割引額: -${discount}円`);
        console.log(`支払合計: ${subtotal - discount}円`);
        console.log("-------------------------\n");

        // 在庫減算
        this.app.trigger('request_stock_reduction', items, 'stock_reduced_internal');
      };

      // 1回限りのハンドラーとして登録するために、以前のハンドラーがあれば上書きするか、
      // 固有のイベント名で紐付ける。ここでは簡易的な名前空間とする。
      this.app.register('checkout_items_received_internal', onItemsReceived);
      this.app.register('stock_reduced_internal', () => {
        this.app.trigger('request_cart_clear', 'cart_cleared_internal');
      });
      this.app.register('cart_cleared_internal', () => {
        this.app.trigger(onCompleteEvent);
      });

      // 処理開始
      this.app.trigger('request_checkout_items', 'checkout_items_received_internal');
    });
  }
}

// ==========================================
// テストストーリー制御フロー
// ==========================================

const app = new HollywoodApp();

const catalog = new Catalog([
  new Product('PRD-01', 'ノートPC', 100000, 2),
  new Product('PRD-02', 'マウス', 3000, 5),
  new Product('PRD-03', 'キーボード', 5000, 0)
], app);

const cart = new ShoppingCart(app);
const checkoutService = new CheckoutService(app);

// シナリオのイベントチェーン定義

app.register('start_scenario', () => {
  // 初期カタログの印刷要求。完了したら 'initial_catalog_printed' をトリガーさせる
  app.trigger('request_catalog_print', 'initial_catalog_printed');
});

app.register('initial_catalog_printed', () => {
  // マウス(PRD-02) 1個追加試行
  app.trigger('request_product_check', 'PRD-02', 1, 'add_mouse_ok', 'add_mouse_fail');
});

app.register('add_mouse_ok', (product: Product, qty: number) => {
  app.trigger('add_item_to_cart', product, qty, 'mouse_added');
});
app.register('add_mouse_fail', (err: string) => {
  console.log(err);
  app.trigger('try_add_keyboard');
});

app.register('mouse_added', () => {
  app.trigger('try_add_keyboard');
});

app.register('try_add_keyboard', () => {
  // キーボード(PRD-03) 1個追加試行
  app.trigger('request_product_check', 'PRD-03', 1, 'add_keyboard_ok', 'add_keyboard_fail');
});

app.register('add_keyboard_ok', (product: Product, qty: number) => {
  app.trigger('add_item_to_cart', product, qty, 'keyboard_added');
});
app.register('add_keyboard_fail', (err: string) => {
  console.log(err);
  app.trigger('try_add_laptop_over');
});

app.register('keyboard_added', () => {
  app.trigger('try_add_laptop_over');
});

app.register('try_add_laptop_over', () => {
  // ノートPC(PRD-01) 3個追加試行
  app.trigger('request_product_check', 'PRD-01', 3, 'add_laptop_over_ok', 'add_laptop_over_fail');
});

app.register('add_laptop_over_ok', (product: Product, qty: number) => {
  app.trigger('add_item_to_cart', product, qty, 'laptop_over_added');
});
app.register('add_laptop_over_fail', (err: string) => {
  console.log(err);
  app.trigger('try_add_laptop_ok');
});

app.register('laptop_over_added', () => {
  app.trigger('try_add_laptop_ok');
});

app.register('try_add_laptop_ok', () => {
  // ノートPC(PRD-01) 1個追加試行
  app.trigger('request_product_check', 'PRD-01', 1, 'add_laptop_ok_success', 'add_laptop_ok_fail');
});

app.register('add_laptop_ok_success', (product: Product, qty: number) => {
  app.trigger('add_item_to_cart', product, qty, 'laptop_ok_added');
});
app.register('add_laptop_ok_fail', (err: string) => {
  console.log(err);
  app.trigger('show_cart_subtotal');
});

app.register('laptop_ok_added', () => {
  app.trigger('show_cart_subtotal');
});

app.register('show_cart_subtotal', () => {
  app.trigger('request_cart_subtotal', 'subtotal_received');
});

app.register('subtotal_received', (subtotal: number) => {
  console.log(`カート内合計金額（割引前）: ${subtotal}円`);
  // チェックアウト要求。完了したら 'checkout_finished' をトリガーさせる
  app.trigger('request_checkout', 'checkout_finished');
});

app.register('checkout_finished', () => {
  // 事後のカタログ印刷要求。完了したら 'final_catalog_printed' をトリガーさせる
  app.trigger('request_catalog_print', 'final_catalog_printed');
});

app.register('final_catalog_printed', () => {
  console.log("シミュレーションが完了しました。");
});

// シナリオスタート！
app.trigger('start_scenario');
