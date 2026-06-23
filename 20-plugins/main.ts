// ==========================================
// Style 20: Plugins (プラグイン - 動的ローディング)
// ==========================================
// 【制約】
// 1. プログラムはコンパイル（静的）時点で特定のビジネスロジックの実装（例: 割引ルール）に依存しない。
// 2. 実行時に外部の設定ファイルを読み込み、そこに記述されたモジュール（プラグイン）を動的ロード（`require` / `import`）して結合する。
// 3. プラグインの構成を変更するだけで、メインコードを変更せずにシステムの挙動を変更可能にする。

import * as fs from 'fs';
import * as path from 'path';

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

  getSubtotal(): number {
    return this.items.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
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
    console.log("=== 商品カタログ ===");
    for (const p of this.products) {
      console.log(`[${p.id}] ${p.name} / 価格: ${p.price}円 / 在庫: ${p.stock}個`);
    }
    console.log("===================\n");
  }
}

// 割引プラグインの関数型定義
type DiscountPluginFn = (subtotal: number) => number;

class CheckoutService {
  private calculateDiscount: DiscountPluginFn;

  constructor(discountFn: DiscountPluginFn) {
    // 外部から動的にロードされたプラグインを注入
    this.calculateDiscount = discountFn;
  }

  checkout(cart: ShoppingCart): void {
    const items = cart.getItems();
    if (items.length === 0) {
      console.log("エラー: カートが空です。");
      return;
    }

    console.log("\n--- レシート (Receipt) ---");
    for (const item of items) {
      console.log(`・${item.product.name} (${item.product.price}円) x ${item.qty} = ${item.product.price * item.qty}円`);
    }

    const subtotal = cart.getSubtotal();
    // プラグインで注入された割引ロジックを呼び出す
    const discount = this.calculateDiscount(subtotal);

    console.log(`割引前合計: ${subtotal}円`);
    console.log(`割引額: -${discount}円`);
    console.log(`支払合計: ${subtotal - discount}円`);
    console.log("-------------------------\n");

    // 各商品の在庫を減算
    for (const item of items) {
      item.product.stock -= item.qty;
    }

    cart.clear();
  }
}

// ==========================================
// プラグインの動的ロード処理
// ==========================================

function loadDiscountPlugin(): DiscountPluginFn {
  const configPath = path.join(__dirname, 'plugin-config.json');
  
  if (!fs.existsSync(configPath)) {
    throw new Error(`設定ファイルが見つかりません: ${configPath}`);
  }

  // 1. 設定ファイルを動的ロード
  const configContent = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(configContent);

  if (!config.discountPluginPath) {
    throw new Error("設定ファイル内に 'discountPluginPath' が定義されていません。");
  }

  // 2. プラグインモジュールを動的 require
  const pluginModulePath = path.resolve(__dirname, config.discountPluginPath);
  
  // require で動的ロード (ts-node環境なので、.ts ファイルをそのまま読み込める)
  const plugin = require(pluginModulePath);

  if (typeof plugin.calculateDiscount !== 'function') {
    throw new Error(`プラグインに 'calculateDiscount' 関数が実装されていません。パス: ${pluginModulePath}`);
  }

  return plugin.calculateDiscount as DiscountPluginFn;
}

// ==========================================
// テストストーリーの実行
// ==========================================

// プラグインのロード
const discountFn = loadDiscountPlugin();

const catalog = new Catalog([
  new Product('PRD-01', 'ノートPC', 100000, 2),
  new Product('PRD-02', 'マウス', 3000, 5),
  new Product('PRD-03', 'キーボード', 5000, 0)
]);

const cart = new ShoppingCart();
const checkoutService = new CheckoutService(discountFn);

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
