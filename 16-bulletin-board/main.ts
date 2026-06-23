// ==========================================
// Style 16: Bulletin Board (掲示板 - イベントバス)
// ==========================================
// 【制約】
// 1. すべてのコンポーネントは、お互いに対する直接的な参照（インスタンスの保持）を一切持たない。
// 2. すべてのコンポーネント間の対話は、中央の「掲示板 (EventBus)」を通じたイベントの発行 (Publish) と購読 (Subscribe) のみで行う。
// 3. 各コンポーネントは独立して動作し、相手が誰であるか、あるいは存在するかどうかすら関知しない。

class EventBus {
  private static subscribers: Record<string, ((...args: any[]) => void)[]> = {};

  static subscribe(event: string, callback: (...args: any[]) => void): void {
    if (!this.subscribers[event]) {
      this.subscribers[event] = [];
    }
    this.subscribers[event].push(callback);
  }

  static publish(event: string, ...args: any[]): void {
    if (this.subscribers[event]) {
      // 呼び出し中の変更を避けるためスナップショットを取る
      const list = [...this.subscribers[event]];
      for (const cb of list) {
        cb(...args);
      }
    }
  }
}

// ==========================================
// 各コンポーネントの定義 (イベントの購読と発行のみ)
// ==========================================

interface ProductData {
  id: string;
  name: string;
  price: number;
  stock: number;
}

class CatalogComponent {
  private products: ProductData[];

  constructor(products: ProductData[]) {
    this.products = products;

    // イベントの購読登録
    EventBus.subscribe('request_catalog_print', (replyEvent: string) => this.print(replyEvent));
    EventBus.subscribe('request_stock_check', (data: { id: string, qty: number, onSuccess: string, onFailure: string }) => {
      const p = this.products.find(prod => prod.id === data.id);
      if (!p) {
        EventBus.publish(data.onFailure, `エラー: 商品 ${data.id} が見つかりません。`);
        return;
      }
      if (p.stock === 0) {
        EventBus.publish(data.onFailure, `エラー: ${p.name} は在庫切れです。`);
        return;
      }
      if (p.stock < data.qty) {
        EventBus.publish(data.onFailure, `エラー: ${p.name} の在庫が不足しています（要求: ${data.qty}個, カート内: 0個, 在庫: ${p.stock}個）。`);
        return;
      }
      // 在庫あり
      EventBus.publish(data.onSuccess, { id: p.id, name: p.name, price: p.price, qty: data.qty });
    });
    EventBus.subscribe('request_stock_reduction', (data: { items: { id: string, qty: number }[], replyEvent: string }) => {
      for (const item of data.items) {
        const p = this.products.find(prod => prod.id === item.id);
        if (p) {
          p.stock -= item.qty;
        }
      }
      EventBus.publish(data.replyEvent);
    });
  }

  private print(replyEvent: string): void {
    console.log("=== 商品カタログ ===");
    for (const p of this.products) {
      console.log(`[${p.id}] ${p.name} / 価格: ${p.price}円 / 在庫: ${p.stock}個`);
    }
    console.log("===================\n");
    EventBus.publish(replyEvent);
  }
}

class ShoppingCartComponent {
  private items: { id: string, name: string, price: number, qty: number }[] = [];

  constructor() {
    EventBus.subscribe('add_to_cart_confirmed', (item: { id: string, name: string, price: number, qty: number }) => {
      const existing = this.items.find(i => i.id === item.id);
      if (existing) {
        existing.qty += item.qty;
      } else {
        this.items.push({ ...item });
      }
      console.log(`[OK] カートに追加しました: ${item.name} x ${item.qty}`);
      EventBus.publish('cart_updated');
    });

    EventBus.subscribe('request_cart_subtotal', (replyEvent: string) => {
      const subtotal = this.items.reduce((acc, i) => acc + (i.price * i.qty), 0);
      EventBus.publish(replyEvent, subtotal);
    });

    EventBus.subscribe('request_checkout', (replyEvent: string) => {
      if (this.items.length === 0) {
        console.log("エラー: カートが空です。");
        EventBus.publish(replyEvent);
        return;
      }

      console.log("\n--- レシート (Receipt) ---");
      for (const item of this.items) {
        console.log(`・${item.name} (${item.price}円) x ${item.qty} = ${item.price * item.qty}円`);
      }

      const subtotal = this.items.reduce((acc, i) => acc + (i.price * i.qty), 0);
      const discount = subtotal >= 3000 ? Math.round(subtotal * 0.1) : 0;

      console.log(`割引前合計: ${subtotal}円`);
      console.log(`割引額: -${discount}円`);
      console.log(`支払合計: ${subtotal - discount}円`);
      console.log("-------------------------\n");

      // 在庫の減算をカタログコンポーネントへ要求
      const reductionItems = this.items.map(i => ({ id: i.id, qty: i.qty }));
      
      // カートクリアと完了報告のために一時イベント登録
      EventBus.subscribe('stock_reduced_for_checkout', () => {
        this.items = [];
        EventBus.publish(replyEvent);
      });

      EventBus.publish('request_stock_reduction', {
        items: reductionItems,
        replyEvent: 'stock_reduced_for_checkout'
      });
    });
  }
}

// ==========================================
// テストストーリー制御 (掲示板による進行シナリオ)
// ==========================================

// コンポーネントの初期化 (互いの参照は渡さない)
new CatalogComponent([
  { id: 'PRD-01', name: 'ノートPC', price: 100000, stock: 2 },
  { id: 'PRD-02', name: 'マウス', price: 3000, stock: 5 },
  { id: 'PRD-03', name: 'キーボード', price: 5000, stock: 0 }
]);

new ShoppingCartComponent();

// シナリオの購読登録
EventBus.subscribe('start_scenario', () => {
  EventBus.publish('request_catalog_print', 'initial_catalog_printed');
});

EventBus.subscribe('initial_catalog_printed', () => {
  // マウス(PRD-02) 1個追加試行
  EventBus.publish('request_stock_check', {
    id: 'PRD-02',
    qty: 1,
    onSuccess: 'add_to_cart_confirmed',
    onFailure: 'cart_add_failed'
  });
});

// 追加結果を受けて次のステップへ進む
const nextSteps = [
  // 1. キーボード追加試行
  () => {
    EventBus.publish('request_stock_check', {
      id: 'PRD-03',
      qty: 1,
      onSuccess: 'add_to_cart_confirmed',
      onFailure: 'cart_add_failed'
    });
  },
  // 2. ノートPC 3個追加試行 (在庫不足)
  () => {
    EventBus.publish('request_stock_check', {
      id: 'PRD-01',
      qty: 3,
      onSuccess: 'add_to_cart_confirmed',
      onFailure: 'cart_add_failed'
    });
  },
  // 3. ノートPC 1個追加試行 (正常)
  () => {
    EventBus.publish('request_stock_check', {
      id: 'PRD-01',
      qty: 1,
      onSuccess: 'add_to_cart_confirmed',
      onFailure: 'cart_add_failed'
    });
  }
];

let stepIndex = 0;
const proceed = () => {
  if (stepIndex < nextSteps.length) {
    const nextFn = nextSteps[stepIndex];
    stepIndex++;
    nextFn();
  } else {
    // すべての追加が終わったので合計金額の取得要求
    EventBus.publish('request_cart_subtotal', 'subtotal_received');
  }
};

EventBus.subscribe('cart_updated', proceed);
EventBus.subscribe('cart_add_failed', (err: string) => {
  console.log(err);
  proceed();
});

EventBus.subscribe('subtotal_received', (subtotal: number) => {
  console.log(`カート内合計金額（割引前）: ${subtotal}円`);
  // チェックアウト要求
  EventBus.publish('request_checkout', 'checkout_completed');
});

EventBus.subscribe('checkout_completed', () => {
  // 事後のカタログ印刷要求
  EventBus.publish('request_catalog_print', 'final_catalog_printed');
});

EventBus.subscribe('final_catalog_printed', () => {
  console.log("シミュレーションが完了しました。");
});

// シナリオ開始
EventBus.publish('start_scenario');
