// ==========================================
// Style 32: Hadoop (ハドゥープ - ダブルMapReduce)
// ==========================================
// 【制約】
// 1. 手続き的な繰り返し処理を禁止する。
// 2. 複数の独立した MapReduce ステージを定義し、それらをパイプラインとして直列に連結して最終結果を得る。
// 3. 前段の MapReduce ステージが出力したデータ構造（中間データ）が、そのまま後段の MapReduce ステージの入力となる。

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

  addItem(product: Product | undefined, qty: number): void {
    if (!product) return;
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

  clear(): void {
    this.items = [];
  }
}

// ==========================================
// ダブル MapReduce ステージによるチェックアウト
// ==========================================

// ステージ1の中間出力データの型 (HDFSの一時データに相当)
interface Stage1Output {
  readonly items: { name: string; price: number; qty: number; sub: number }[];
  readonly subtotal: number;
  readonly discount: number;
}

class CheckoutService {
  checkout(cart: ShoppingCart): void {
    if (cart.items.length === 0) {
      console.log("エラー: カートが空です。");
      return;
    }

    // ───────────────────────────────────────
    // 【ステージ1】: 集計と割引計算の MapReduce
    // ───────────────────────────────────────
    // Map 1: 各アイテムから金額情報などを抽出した中間オブジェクトをマップ
    const stage1Map = cart.items.map(item => ({
      name: item.product.name,
      price: item.product.price,
      qty: item.qty,
      sub: item.product.price * item.qty
    }));

    // Reduce 1: 中間オブジェクトの配列を畳み込み、小計・割引額を決定
    const stage1Reduce = stage1Map.reduce(
      (acc: Stage1Output, val): Stage1Output => {
        const nextSubtotal = acc.subtotal + val.sub;
        const nextDiscount = nextSubtotal >= 3000 ? Math.round(nextSubtotal * 0.1) : 0;
        return {
          items: [...acc.items, val],
          subtotal: nextSubtotal,
          discount: nextDiscount
        };
      },
      { items: [], subtotal: 0, discount: 0 }
    );

    // ───────────────────────────────────────
    // 【ステージ2】: レシート生成と在庫減算の MapReduce
    // (入力は ステージ1 の結果)
    // ───────────────────────────────────────
    // Map 2: ステージ1の結果を受け取り、レシート文字列と、在庫の差分減算指示のペアにマップ
    const stage2Map = {
      lines: stage1Reduce.items.map(item => {
        return `・${item.name} (${item.price}円) x ${item.qty} = ${item.sub}円`;
      }),
      deductions: cart.items.map(item => ({
        product: item.product,
        qty: item.qty
      })),
      summary: {
        subtotal: stage1Reduce.subtotal,
        discount: stage1Reduce.discount,
        total: stage1Reduce.subtotal - stage1Reduce.discount
      }
    };

    // Reduce 2: レシート明細を結合して出力し、在庫減算を実行して状態をコミット
    const printAndCommit = (): void => {
      console.log("\n--- レシート (Receipt) ---");
      // レシート行の結合 (Reduce)
      const receiptBody = stage2Map.lines.reduce((acc, line) => acc + line + "\n", "");
      console.log(receiptBody.trim());
      console.log(`割引前合計: ${stage2Map.summary.subtotal}円`);
      console.log(`割引額: -${stage2Map.summary.discount}円`);
      console.log(`支払合計: ${stage2Map.summary.total}円`);
      console.log("-------------------------\n");

      // 在庫の減算 (Reduce)
      stage2Map.deductions.reduce((_, item) => {
        item.product.stock -= item.qty;
        return null;
      }, null);
    };

    // ステージ2の実行
    printAndCommit();

    // カートクリア
    cart.clear();
  }
}

class Catalog {
  constructor(private products: Product[]) {}

  findProduct(id: string): Product | undefined {
    return this.products.find(p => p.id === id);
  }

  print(): void {
    const lines = this.products.map(p => `[${p.id}] ${p.name} / 価格: ${p.price}円 / 在庫: ${p.stock}個`);
    const output = lines.reduce((acc, line) => acc + line + "\n", "=== 商品カタログ ===\n");
    console.log(output + "===================\n");
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
// ここでも一時MapReduceで小計算出
const subtotal = cart.items
  .map(item => item.product.price * item.qty)
  .reduce((acc, val) => acc + val, 0);
console.log(`カート内合計金額（割引前）: ${subtotal}円`);

// 7. チェックアウト (ダブルMapReduce)
checkoutService.checkout(cart);

// 8. 事後の在庫確認
catalog.print();
