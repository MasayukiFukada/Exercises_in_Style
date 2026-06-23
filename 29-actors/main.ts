// ==========================================
// Style 29: Actors (アクター - 非同期メッセージング)
// ==========================================
// 【制約】
// 1. 各アクターは完全にカプセル化され、外部と状態を共有しない。
// 2. 直接のメソッド呼び出しによる対話を禁止し、すべての対話は非同期メッセージ送信（メールボックスへの投稿）のみで行う。
// 3. 各アクターは自身のメールボックスを順に処理する独立したメッセージループ（非同期キュー）を持つ。

abstract class Actor {
  private mailbox: any[] = [];
  private active = false;

  // メッセージをメールボックスに送信 (非同期)
  post(message: any): void {
    this.mailbox.push(message);
    if (!this.active) {
      this.active = true;
      // イベントループの次のチックで処理を開始
      setTimeout(() => this.processMailbox(), 0);
    }
  }

  private async processMailbox(): Promise<void> {
    while (this.mailbox.length > 0) {
      const msg = this.mailbox.shift();
      try {
        await this.handleMessage(msg);
      } catch (err: any) {
        console.error(`アクターエラー: ${err.message}`);
      }
    }
    this.active = false;
  }

  // 子クラスで具体的なメッセージ処理ロジックを実装
  protected abstract handleMessage(message: any): Promise<void> | void;
}

// ==========================================
// 各アクターの定義
// ==========================================

interface ProductData {
  id: string;
  name: string;
  price: number;
  stock: number;
}

class CatalogActor extends Actor {
  private products: ProductData[];

  constructor(products: ProductData[]) {
    super();
    this.products = products;
  }

  protected handleMessage(message: any): void {
    const [action, payload] = message;

    switch (action) {
      case 'print': {
        const { replyActor } = payload;
        console.log("=== 商品カタログ ===");
        for (const p of this.products) {
          console.log(`[${p.id}] ${p.name} / 価格: ${p.price}円 / 在庫: ${p.stock}個`);
        }
        console.log("===================\n");
        replyActor.post(['catalog_printed']);
        break;
      }
      case 'check_stock': {
        const { id, qty, replyActor } = payload;
        const p = this.products.find(prod => prod.id === id);
        if (!p) {
          replyActor.post(['add_failed', `エラー: 商品 ${id} が見つかりません。`]);
          return;
        }
        if (p.stock === 0) {
          replyActor.post(['add_failed', `エラー: ${p.name} は在庫切れです。`]);
          return;
        }
        replyActor.post(['stock_checked_result', { product: p, requestedQty: qty }]);
        break;
      }
      case 'reduce_stock': {
        const { items, replyActor } = payload;
        for (const item of items) {
          const p = this.products.find(prod => prod.id === item.product.id);
          if (p) {
            p.stock -= item.qty;
          }
        }
        replyActor.post(['stock_reduced']);
        break;
      }
    }
  }
}

class CartActor extends Actor {
  private items: { product: ProductData; qty: number }[] = [];

  protected handleMessage(message: any): void {
    const [action, payload] = message;

    switch (action) {
      case 'add_item': {
        const { product, qty, replyActor } = payload;
        const existing = this.items.find(item => item.product.id === product.id);
        const currentInCart = existing ? existing.qty : 0;

        // カート内と要求量の合計が在庫を超えるかチェック
        if (product.stock < currentInCart + qty) {
          replyActor.post(['add_failed', `エラー: ${product.name} の在庫が不足しています（要求: ${qty}個, カート内: ${currentInCart}個, 在庫: ${product.stock}個）。`]);
          return;
        }

        if (existing) {
          existing.qty += qty;
        } else {
          this.items.push({ product, qty });
        }
        console.log(`[OK] カートに追加しました: ${product.name} x ${qty}`);
        replyActor.post(['add_success']);
        break;
      }
      case 'get_subtotal': {
        const { replyActor } = payload;
        const subtotal = this.items.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
        replyActor.post(['subtotal_result', subtotal]);
        break;
      }
      case 'checkout': {
        const { replyActor, catalogActor } = payload;
        if (this.items.length === 0) {
          console.log("エラー: カートが空です。");
          replyActor.post(['checkout_completed']);
          return;
        }

        console.log("\n--- レシート (Receipt) ---");
        for (const item of this.items) {
          console.log(`・${item.product.name} (${item.product.price}円) x ${item.qty} = ${item.product.price * item.qty}円`);
        }

        const subtotal = this.items.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
        const discount = subtotal >= 3000 ? Math.round(subtotal * 0.1) : 0;

        console.log(`割引前合計: ${subtotal}円`);
        console.log(`割引額: -${discount}円`);
        console.log(`支払合計: ${subtotal - discount}円`);
        console.log("-------------------------\n");

        // カタログに在庫減算をメッセージで要求 (非同期)
        catalogActor.post(['reduce_stock', {
          items: [...this.items],
          replyActor: this
        }]);

        // 次のステップ用に発信元アクターへの返信用参照をキープ
        this.items = []; // カートクリア
        this.post(['finish_checkout', { replyActor }]);
        break;
      }
      case 'finish_checkout': {
        const { replyActor } = payload;
        // 在庫減算完了を待って報告
        replyActor.post(['checkout_completed']);
        break;
      }
    }
  }
}

// シナリオの進行自体を管理するメインアクター
class ScenarioActor extends Actor {
  private step = 0;
  private catalogActor: CatalogActor;
  private cartActor: CartActor;

  constructor(catalog: CatalogActor, cart: CartActor) {
    super();
    this.catalogActor = catalog;
    this.cartActor = cart;
  }

  // シナリオのイベントハンドラー群
  protected handleMessage(message: any): void {
    const [action, payload] = message;

    switch (action) {
      case 'start':
        // 1. カタログ印刷
        this.catalogActor.post(['print', { replyActor: this }]);
        break;

      case 'catalog_printed':
        if (this.step === 0) {
          this.step = 1;
          // 2. 正常追加 (マウス 1個)
          this.catalogActor.post(['check_stock', { id: 'PRD-02', qty: 1, replyActor: this }]);
        } else {
          // 最後（事後の在庫確認）の印刷が終わったら完了
          console.log("シミュレーションが完了しました。");
        }
        break;

      case 'stock_checked_result': {
        const { product, requestedQty } = payload;
        // 在庫チェックがOKならカートアクターへ追加メッセージを送る
        this.cartActor.post(['add_item', { product, qty: requestedQty, replyActor: this }]);
        break;
      }

      case 'add_success':
        this.proceedScenario();
        break;

      case 'add_failed':
        console.log(payload); // エラーメッセージを表示
        this.proceedScenario();
        break;

      case 'subtotal_result':
        console.log(`カート内合計金額（割引前）: ${payload}円`);
        // 7. チェックアウトの実行
        this.cartActor.post(['checkout', { replyActor: this, catalogActor: this.catalogActor }]);
        break;

      case 'checkout_completed':
        // 8. 事後の在庫確認カタログ表示
        this.catalogActor.post(['print', { replyActor: this }]);
        break;
    }
  }

  private proceedScenario(): void {
    this.step++;
    if (this.step === 2) {
      // 3. 在庫切れの追加試行 (キーボード 1個)
      this.catalogActor.post(['check_stock', { id: 'PRD-03', qty: 1, replyActor: this }]);
    } else if (this.step === 3) {
      // 4. 在庫超えの追加試行 (ノートPC 3個)
      this.catalogActor.post(['check_stock', { id: 'PRD-01', qty: 3, replyActor: this }]);
    } else if (this.step === 4) {
      // 5. 複数商品の追加 (ノートPC 1個)
      this.catalogActor.post(['check_stock', { id: 'PRD-01', qty: 1, replyActor: this }]);
    } else if (this.step === 5) {
      // 6. カートの合計取得
      this.cartActor.post(['get_subtotal', { replyActor: this }]);
    }
  }
}

// ==========================================
// テストストーリーの実行
// ==========================================

const catalogActor = new CatalogActor([
  { id: 'PRD-01', name: 'ノートPC', price: 100000, stock: 2 },
  { id: 'PRD-02', name: 'マウス', price: 3000, stock: 5 },
  { id: 'PRD-03', name: 'キーボード', price: 5000, stock: 0 }
]);

const cartActor = new CartActor();
const scenarioActor = new ScenarioActor(catalogActor, cartActor);

// シナリオ開始メッセージの送信
scenarioActor.post(['start']);
