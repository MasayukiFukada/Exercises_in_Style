// ==========================================
// Style 19: Aspects (アスペクト - AOP)
// ==========================================
// 【制約】
// 1. コアとなるビジネスロジックから「横断的関心事」（ロギング、入力検証、エラーハンドリングなど）を完全に排する。
// 2. 横断的関心事は「アスペクト（アドバイス）」として別定義し、実行時にコアメソッドの前後（Before, After, Around）に動的に織り込む（Weave）。
// 3. コアロジック自身は、自分がいつ、どのようにログ出力や追加検証をされているかを関知しない。

// ==========================================
// AOP (Aspect-Oriented Programming) ユーティリティ
// ==========================================

type BeforeAdvice = (methodName: string, args: any[]) => boolean | void; // false を返すと元の処理を中断
type AfterAdvice = (methodName: string, args: any[], result: any) => void;
type AroundAdvice = (methodName: string, args: any[], proceed: () => any) => any;

interface AspectConfig {
  before?: BeforeAdvice;
  after?: AfterAdvice;
  around?: AroundAdvice;
}

// Proxyを使用してオブジェクトにアスペクトを動的に織り込む関数
function weave<T extends object>(target: T, config: AspectConfig): T {
  return new Proxy(target, {
    get(targetObj, prop, receiver) {
      const original = (targetObj as any)[prop];

      if (typeof original === 'function') {
        return function(this: any, ...args: any[]) {
          const proceed = () => original.apply(targetObj, args);

          // 1. Around Advice の実行
          if (config.around) {
            return config.around(prop as string, args, proceed);
          }

          // 2. Before Advice の実行
          if (config.before) {
            const shouldProceed = config.before(prop as string, args);
            if (shouldProceed === false) {
              return; // 元の処理をスキップ
            }
          }

          // 3. 本処理の実行
          const result = proceed();

          // 4. After Advice の実行
          if (config.after) {
            config.after(prop as string, args, result);
          }

          return result;
        };
      }
      return original;
    }
  });
}

// ==========================================
// コアビジネスロジック (コア関心事 - ロギングや検証を含まない)
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
  public items: CartItem[] = [];

  addItem(product: Product, qty: number): void {
    // コアロジック: 単純にカートに追加するだけ (在庫の検証やログ出力はアスペクトへ委譲)
    const existing = this.items.find(item => item.product.id === product.id);
    if (existing) {
      existing.qty += qty;
    } else {
      this.items.push(new CartItem(product, qty));
    }
  }

  getSubtotal(): number {
    return this.items.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
  }

  clear(): void {
    this.items = [];
  }
}

class Catalog {
  constructor(public readonly products: Product[]) {}

  findProduct(id: string): Product | undefined {
    return this.products.find(p => p.id === id);
  }

  print(): void {
    // コアロジック: 単に中身を順に出力するだけ (装飾ヘッダ・フッタはアスペクトへ委譲)
    for (const p of this.products) {
      console.log(`[${p.id}] ${p.name} / 価格: ${p.price}円 / 在庫: ${p.stock}個`);
    }
  }
}

class CheckoutService {
  checkout(cart: ShoppingCart): void {
    // コアロジック: 単にカートをクリアするだけ (レシート表示や在庫の減算はアスペクトへ委譲)
    cart.clear();
  }
}

// ==========================================
// アスペクトの定義 (横断的関心事)
// ==========================================

// 1. カタログ印刷時の装飾アスペクト
const catalogAspect: AspectConfig = {
  around: (methodName, args, proceed) => {
    if (methodName === 'print') {
      console.log("=== 商品カタログ ===");
      proceed();
      console.log("===================\n");
      return;
    }
    return proceed();
  }
};

// 2. カート操作のアスペクト (検証・ロギング)
const cartAspect: AspectConfig = {
  // Before: 在庫切れ・在庫不足のバリデーション (横断的なエラーハンドリング)
  before: (methodName, args) => {
    if (methodName === 'addItem') {
      const product = args[0] as Product;
      const qty = args[1] as number;
      const targetCart = args[2] as ShoppingCart; // 今回は Proxy が自動解決するが、ターゲット自身の items を参照する

      if (product.stock === 0) {
        console.log(`エラー: ${product.name} は在庫切れです。`);
        return false; // 本処理に進まない
      }

      // Proxy経由での items 取得を避けるため、Proxy内の items を探索
      // (argsはオリジナルなので product.stock が取得できる)
      const existing = (receiverCart as any).items.find((item: any) => item.product.id === product.id);
      const currentInCart = existing ? existing.qty : 0;

      if (product.stock < currentInCart + qty) {
        console.log(`エラー: ${product.name} の在庫が不足しています（要求: ${qty}個, カート内: ${currentInCart}個, 在庫: ${product.stock}個）。`);
        return false; // 本処理に進まない
      }
    }
    return true;
  },

  // After: 成功時のログ出力
  after: (methodName, args) => {
    if (methodName === 'addItem') {
      const product = args[0] as Product;
      const qty = args[1] as number;
      console.log(`[OK] カートに追加しました: ${product.name} x ${qty}`);
    }
  }
};

// 3. チェックアウト処理のアスペクト (レシート出力・在庫減算・バリデーション)
const checkoutAspect: AspectConfig = {
  around: (methodName, args, proceed) => {
    if (methodName === 'checkout') {
      const cartProxy = args[0] as ShoppingCart;
      // Proxyの裏にある実体にアクセスしてチェック
      const items = (receiverCart as any).items;

      if (items.length === 0) {
        console.log("エラー: カートが空です。");
        return;
      }

      console.log("\n--- レシート (Receipt) ---");
      for (const item of items) {
        console.log(`・${item.product.name} (${item.product.price}円) x ${item.qty} = ${item.product.price * item.qty}円`);
      }

      const subtotal = cartProxy.getSubtotal();
      const discount = subtotal >= 3000 ? Math.round(subtotal * 0.1) : 0;

      console.log(`割引前合計: ${subtotal}円`);
      console.log(`割引額: -${discount}円`);
      console.log(`支払合計: ${subtotal - discount}円`);
      console.log("-------------------------\n");

      // 在庫の減算
      for (const item of items) {
        item.product.stock -= item.qty;
      }

      // 本処理 (カートクリア) を実行
      return proceed();
    }
    return proceed();
  }
};

// ==========================================
// アスペクトの織り込み (Weaving)
// ==========================================

const rawCatalog = new Catalog([
  new Product('PRD-01', 'ノートPC', 100000, 2),
  new Product('PRD-02', 'マウス', 3000, 5),
  new Product('PRD-03', 'キーボード', 5000, 0)
]);

const rawCart = new ShoppingCart();
const rawCheckoutService = new CheckoutService();

// Weaving!
const catalog = weave(rawCatalog, catalogAspect);
const cart = weave(rawCart, cartAspect);
const checkoutService = weave(rawCheckoutService, checkoutAspect);

// 補助用に、カートアスペクトの before 処理で Proxy 内部の実体にアクセスできるよう
// グローバル変数にカートの実体を退避させる
let receiverCart = rawCart;

// ==========================================
// テストストーリーの実行
// ==========================================

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
