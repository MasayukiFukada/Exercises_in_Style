// ==========================================
// Style 13: Closed Maps (クローズドマップ - マップオブジェクト)
// ==========================================
// 【制約】
// 1. `class` や `constructor` キーワードによるクラス定義を一切使用しない。
// 2. オブジェクトは、データと関数（メソッド）を格納したプレーンなマップ（辞書 / オブジェクトリテラル）として表す。
// 3. マップに格納された関数は、第一引数として明示的に自身（`self`）を受け取って処理を行う（`this` は使用しない）。

type ProductMap = {
  id: string;
  name: string;
  price: number;
  stock: number;
  has_stock: (self: ProductMap, qty: number) => boolean;
  decrease_stock: (self: ProductMap, qty: number) => void;
};

type CartItemMap = {
  product: ProductMap;
  qty: number;
  add_qty: (self: CartItemMap, qty: number) => void;
  get_subtotal: (self: CartItemMap) => number;
};

type ShoppingCartMap = {
  items: CartItemMap[];
  add_item: (self: ShoppingCartMap, product: ProductMap, qty: number) => void;
  get_subtotal: (self: ShoppingCartMap) => number;
  clear: (self: ShoppingCartMap) => void;
};

type CatalogMap = {
  products: ProductMap[];
  find: (self: CatalogMap, id: string) => ProductMap | undefined;
  print: (self: CatalogMap) => void;
};

type CheckoutServiceMap = {
  checkout: (self: CheckoutServiceMap, cart: ShoppingCartMap) => void;
};

// ==========================================
// ファクトリ関数によるマップオブジェクトの作成
// ==========================================

function createProduct(id: string, name: string, price: number, stock: number): ProductMap {
  return {
    id,
    name,
    price,
    stock,
    has_stock: (self, qty) => self.stock >= qty,
    decrease_stock: (self, qty) => {
      if (!self.has_stock(self, qty)) {
        throw new Error(`在庫不足エラー: ${self.name}`);
      }
      self.stock -= qty;
    }
  };
}

function createCartItem(product: ProductMap, qty: number): CartItemMap {
  return {
    product,
    qty,
    add_qty: (self, q) => { self.qty += q; },
    get_subtotal: (self) => self.product.price * self.qty
  };
}

function createShoppingCart(): ShoppingCartMap {
  return {
    items: [],
    add_item: (self, product, qty) => {
      if (product.stock === 0) {
        console.log(`エラー: ${product.name} は在庫切れです。`);
        return;
      }

      const existing = self.items.find(item => item.product.id === product.id);
      const currentInCart = existing ? existing.qty : 0;

      if (!product.has_stock(product, currentInCart + qty)) {
        console.log(`エラー: ${product.name} の在庫が不足しています（要求: ${qty}個, カート内: ${currentInCart}個, 在庫: ${product.stock}個）。`);
        return;
      }

      if (existing) {
        existing.add_qty(existing, qty);
      } else {
        self.items.push(createCartItem(product, qty));
      }
      console.log(`[OK] カートに追加しました: ${product.name} x ${qty}`);
    },
    get_subtotal: (self) => {
      return self.items.reduce((acc, item) => acc + item.get_subtotal(item), 0);
    },
    clear: (self) => {
      self.items = [];
    }
  };
}

function createCatalog(products: ProductMap[]): CatalogMap {
  return {
    products,
    find: (self, id) => self.products.find(p => p.id === id),
    print: (self) => {
      console.log("=== 商品カタログ ===");
      for (const p of self.products) {
        console.log(`[${p.id}] ${p.name} / 価格: ${p.price}円 / 在庫: ${p.stock}個`);
      }
      console.log("===================\n");
    }
  };
}

function createCheckoutService(): CheckoutServiceMap {
  return {
    checkout: (self, cart) => {
      if (cart.items.length === 0) {
        console.log("エラー: カートが空です。");
        return;
      }

      console.log("\n--- レシート (Receipt) ---");
      for (const item of cart.items) {
        const p = item.product;
        console.log(`・${p.name} (${p.price}円) x ${item.qty} = ${item.get_subtotal(item)}円`);
      }

      const subtotal = cart.get_subtotal(cart);
      const discount = subtotal >= 3000 ? Math.round(subtotal * 0.1) : 0;

      console.log(`割引前合計: ${subtotal}円`);
      console.log(`割引額: -${discount}円`);
      console.log(`支払合計: ${subtotal - discount}円`);
      console.log("-------------------------\n");

      // 在庫減算
      for (const item of cart.items) {
        item.product.decrease_stock(item.product, item.qty);
      }

      cart.clear(cart);
    }
  };
}

// ==========================================
// テストストーリーの実行
// ==========================================

const catalog = createCatalog([
  createProduct('PRD-01', 'ノートPC', 100000, 2),
  createProduct('PRD-02', 'マウス', 3000, 5),
  createProduct('PRD-03', 'キーボード', 5000, 0)
]);

const cart = createShoppingCart();
const checkoutService = createCheckoutService();

// 1. 商品一覧の表示
catalog.print(catalog);

// 2. 正常な追加
const mouse = catalog.find(catalog, 'PRD-02');
if (mouse) cart.add_item(cart, mouse, 1);

// 3. 在庫切れの追加試行
const keyboard = catalog.find(catalog, 'PRD-03');
if (keyboard) cart.add_item(cart, keyboard, 1);

// 4. 在庫超えの追加試行
const laptop = catalog.find(catalog, 'PRD-01');
if (laptop) cart.add_item(cart, laptop, 3);

// 5. 複数商品の追加 (ノートPCを1個追加)
if (laptop) cart.add_item(cart, laptop, 1);

// 6. カート状態の確認
console.log(`カート内合計金額（割引前）: ${cart.get_subtotal(cart)}円`);

// 7. チェックアウト
checkoutService.checkout(checkoutService, cart);

// 8. 事後の在庫確認
catalog.print(catalog);
