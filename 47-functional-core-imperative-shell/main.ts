/**
 * 47. Functional Core, Imperative Shell (FCIS / 純粋コア・命令的シェル)
 *
 * 【制約】
 * 1. Functional Core (純粋コア):
 *    - すべてのビジネスロジック（在庫検証、カート追加、合計・割引計算、チェックアウト・レシート作成）は純粋関数で構成する。
 *    - 状態の破壊的変更（Mutation）を行わず、不変データ構造（Immutable Data）を受け取って新しいデータを返す。
 *    - 副作用（I/O、コンソール出力、例外のスローなど）を一切行わず、成功・失敗はResult型の値として表現する。
 * 2. Imperative Shell (命令的シェル):
 *    - アプリケーションの最も外側に位置し、副作用（コンソール出力や状態の保持）を排他的に管理する。
 *    - Functional Coreを呼び出してビジネスロジックを実行し、得られた結果や新しい状態を元にI/Oを行う。
 */

// ==========================================
// 1. Domain Types & Models (不変データモデル)
// ==========================================
export type Product = Readonly<{
  id: string;
  name: string;
  price: number;
  stock: number;
}>;

export type CartItem = Readonly<{
  product: Product;
  quantity: number;
}>;

export type ShoppingCart = Readonly<{
  items: readonly CartItem[];
}>;

export type Receipt = Readonly<{
  lines: readonly Readonly<{
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
  }>[];
  subtotal: number;
  discount: number;
  total: number;
}>;

export type Result<T, E = string> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; error: E }>;

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export type AppState = Readonly<{
  catalog: readonly Product[];
  cart: ShoppingCart;
}>;

// ==========================================
// 2. Functional Core (純粋関数群・副作用ゼロ)
// ==========================================
export const FunctionalCore = {
  /**
   * カタログから商品を取得する（純粋関数）
   */
  findProduct(catalog: readonly Product[], productId: string): Product | undefined {
    return catalog.find((p) => p.id === productId);
  },

  /**
   * カートに商品を追加した新しいカートを返す（純粋関数）
   */
  addToCart(
    cart: ShoppingCart,
    product: Product,
    quantity: number
  ): Result<ShoppingCart, string> {
    if (quantity <= 0) {
      return err("数量は1以上を指定してください。");
    }

    if (product.stock === 0) {
      return err(`${product.name} は在庫切れです。`);
    }

    const currentItem = cart.items.find((item) => item.product.id === product.id);
    const currentQty = currentItem ? currentItem.quantity : 0;
    const requestedTotal = currentQty + quantity;

    if (requestedTotal > product.stock) {
      return err(
        `${product.name} の在庫が不足しています（要求: ${requestedTotal}個, カート内: ${currentQty}個, 在庫: ${product.stock}個）。`
      );
    }

    const nextItems = currentItem
      ? cart.items.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: requestedTotal }
            : item
        )
      : [...cart.items, { product, quantity }];

    return ok({ items: nextItems });
  },

  /**
   * カートの合計金額を計算（純粋関数）
   */
  calculateSubtotal(cart: ShoppingCart): number {
    return cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  },

  /**
   * 割引額を計算（純粋関数: 3,000円以上で10%割引）
   */
  calculateDiscount(subtotal: number): number {
    return subtotal >= 3000 ? Math.floor(subtotal * 0.1) : 0;
  },

  /**
   * チェックアウト処理（純粋関数）
   * 新しいカタログ（在庫減算後）とレシート情報を返す
   */
  checkout(
    catalog: readonly Product[],
    cart: ShoppingCart
  ): Result<Readonly<{ nextCatalog: readonly Product[]; receipt: Receipt }>, string> {
    if (cart.items.length === 0) {
      return err("カートが空です。");
    }

    // 在庫整合性チェック
    for (const item of cart.items) {
      const prod = catalog.find((p) => p.id === item.product.id);
      if (!prod || prod.stock < item.quantity) {
        return err(
          `チェックアウト失敗: ${item.product.name} の在庫が不足しています。`
        );
      }
    }

    // 在庫減算（新しい不変配列の生成）
    const nextCatalog = catalog.map((prod) => {
      const cartItem = cart.items.find((item) => item.product.id === prod.id);
      return cartItem ? { ...prod, stock: prod.stock - cartItem.quantity } : prod;
    });

    const subtotal = FunctionalCore.calculateSubtotal(cart);
    const discount = FunctionalCore.calculateDiscount(subtotal);
    const total = subtotal - discount;

    const receipt: Receipt = {
      lines: cart.items.map((item) => ({
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity,
      })),
      subtotal,
      discount,
      total,
    };

    return ok({ nextCatalog, receipt });
  },
} as const;

// ==========================================
// 3. Imperative Shell (命令的シェル・副作用担当)
// ==========================================
class ShoppingAppShell {
  private state: AppState;

  constructor(initialCatalog: readonly Product[]) {
    this.state = {
      catalog: initialCatalog,
      cart: { items: [] },
    };
  }

  // --- 副作用: コンソール出力関連 ---
  printCatalog(): void {
    console.log("=== 商品カタログ ===");
    for (const p of this.state.catalog) {
      console.log(`[${p.id}] ${p.name} / 価格: ${p.price}円 / 在庫: ${p.stock}個`);
    }
    console.log("===================\n");
  }

  printReceipt(receipt: Receipt): void {
    console.log("--- レシート (Receipt) ---");
    for (const line of receipt.lines) {
      console.log(`・${line.name} (${line.price}円) x ${line.quantity} = ${line.subtotal}円`);
    }
    console.log(`割引前合計: ${receipt.subtotal}円`);
    console.log(`割引額: -${receipt.discount}円`);
    console.log(`支払合計: ${receipt.total}円`);
    console.log("-------------------------\n");
  }

  // --- アクションの実行（Core を呼び出して状態更新とI/Oを行う） ---
  addToCart(productId: string, quantity: number): void {
    const product = FunctionalCore.findProduct(this.state.catalog, productId);
    if (!product) {
      console.log(`エラー: 商品 [${productId}] が見つかりません。`);
      return;
    }

    const result = FunctionalCore.addToCart(this.state.cart, product, quantity);
    if (result.ok) {
      this.state = { ...this.state, cart: result.value };
      console.log(`[OK] カートに追加しました: ${product.name} x ${quantity}`);
    } else {
      console.log(`エラー: ${result.error}`);
    }
  }

  checkout(): void {
    const result = FunctionalCore.checkout(this.state.catalog, this.state.cart);
    if (result.ok) {
      this.state = {
        catalog: result.value.nextCatalog,
        cart: { items: [] }, // カートをクリア
      };
      this.printReceipt(result.value.receipt);
    } else {
      console.log(`エラー: ${result.error}`);
    }
  }
}

// ==========================================
// 4. Main Workflow (共通シナリオの実行)
// ==========================================
function main() {
  const initialCatalog: readonly Product[] = [
    { id: "PRD-01", name: "ノートPC", price: 100000, stock: 2 },
    { id: "PRD-02", name: "マウス", price: 3000, stock: 5 },
    { id: "PRD-03", name: "キーボード", price: 5000, stock: 0 },
  ];

  const shell = new ShoppingAppShell(initialCatalog);

  // 1. 商品一覧の表示
  shell.printCatalog();

  // 2. 正常な追加: マウス 1個
  shell.addToCart("PRD-02", 1);

  // 3. 在庫切れの追加試行: キーボード 1個
  shell.addToCart("PRD-03", 1);

  // 4. 在庫超えの追加試行: ノートPC 3個
  shell.addToCart("PRD-01", 3);

  // 5. 複数商品の追加: ノートPC 1個
  shell.addToCart("PRD-01", 1);
  console.log();

  // 6 & 7. チェックアウトとレシート出力
  shell.checkout();

  // 8. 事後の在庫確認
  shell.printCatalog();
}

if (require.main === module) {
  main();
}
