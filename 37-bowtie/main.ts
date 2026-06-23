// ==========================================
// Style 37: Bowtie (ボウタイ - オートエンコーダ)
// ==========================================
// 【制約】
// 1. ボウタイ（蝶ネクタイ）構造（入力層 -> 次元が圧縮された中間層 -> 元の次元へ復元する出力層）の多層ニューラルネットワークを定義する。
// 2. カート内のアイテム数量ベクトルを入力として受け取り、中間ボトルネック層（低次元）に圧縮（エンコード）し、再び高次元（出力層）へ復元（デコード）する。
// 3. 復元された特徴（ノイズ除去された購買パターン）を用いて、最終的なチェックアウト判定や割引額の決定を行う。

// 行列・ベクトル演算
function dot(w: number[], x: number[]): number {
  return w.reduce((acc, val, i) => acc + val * x[i], 0);
}

// 活性化関数 (ReLU)
function relu(z: number): number {
  return Math.max(0, z);
}

// ==========================================
// Bowtie (オートエンコーダ) ネットワーク
// 入力: 3次元 [ノートPC数量, マウス数量, キーボード数量]
// 中間（隠れ層）: 1次元 [購買規模（圧縮特徴量）] (ボトルネック)
// 出力: 3次元 [復元ノートPC数量, 復元マウス数量, 復元キーボード数量]
// ==========================================
class BowtieNetwork {
  // エンコーダ重み (各商品の価格比率に基づき、購買規模1次元に圧縮)
  // 入力を千円単位にスケーリングした重み: ノートPC=100, マウス=3, キーボード=5
  private W_enc: number[] = [100, 3, 5];
  private b_enc: number = 0;

  // デコーダ重み (1次元の購買規模から、各商品の数量比率へ復元)
  // 入力特徴が 103（ノートPC1個 100 + マウス1個 3）のとき、[1, 1, 0] 付近に復元されるよう定義された固定重み
  private W_dec: number[][] = [
    [0.01],  // ノートPCへの復元重み
    [0.33],  // マウスへの復元重み
    [0.0]    // キーボードへの復元重み
  ];
  private b_dec: number[] = [0, 0, 0];

  // フォワードパスの実行
  forward(x: number[]): { bottleneck: number; output: number[] } {
    // 1. エンコード (3次元 -> 1次元)
    const z_enc = dot(this.W_enc, x) + this.b_enc;
    const h = relu(z_enc); // ボトルネック層の出力 (小計千円単位に近い)

    // 2. デコード (1次元 -> 3次元)
    const y1 = relu(h * this.W_dec[0][0] + this.b_dec[0]);
    const y2 = relu(h * this.W_dec[1][0] + this.b_dec[1]);
    const y3 = relu(h * this.W_dec[2][0] + this.b_dec[2]);

    return {
      bottleneck: h,
      output: [y1, y2, y3]
    };
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

  // カート内商品の数量ベクトル [ノートPC, マウス, キーボード] を取得
  getQuantityVector(): number[] {
    const laptop = this.items.find(i => i.product.id === 'PRD-01');
    const mouse = this.items.find(i => i.product.id === 'PRD-02');
    const keyboard = this.items.find(i => i.product.id === 'PRD-03');

    return [
      laptop ? laptop.qty : 0,
      mouse ? mouse.qty : 0,
      keyboard ? keyboard.qty : 0
    ];
  }

  getSubtotal(): number {
    return this.items.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
  }

  clear(): void {
    this.items = [];
  }
}

class Catalog {
  constructor(private products: Product[]) {}

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

class CheckoutService {
  private network = new BowtieNetwork();

  checkout(cart: ShoppingCart): void {
    const items = cart.items;
    if (items.length === 0) {
      console.log("エラー: カートが空です。");
      return;
    }

    console.log("\n--- レシート (Receipt) ---");
    for (const item of items) {
      console.log(`・${item.product.name} (${item.product.price}円) x ${item.qty} = ${item.product.price * item.qty}円`);
    }

    // 1. カート数量ベクトルを抽出: 例 [1, 1, 0]
    const x = cart.getQuantityVector();

    // 2. Bowtieネットワーク (オートエンコーダ) を通過
    const { bottleneck, output } = this.network.forward(x);

    // ボトルネック層の特徴量（購入金額規模の千円単位）から割引を計算
    // bottleneck >= 3 (小計が3000円以上) なら10%割引を適用
    const subtotal = cart.getSubtotal();
    const discount = bottleneck >= 3 ? Math.round(subtotal * 0.1) : 0;

    console.log(`[Bowtie特徴抽出] ボトルネック圧縮値: ${bottleneck.toFixed(2)} (入力次元 3 -> ボトルネック次元 1)`);
    console.log(`[Bowtie復元ベクトル] 復元された数量: ノートPC=${output[0].toFixed(2)}, マウス=${output[1].toFixed(2)}, キーボード=${output[2].toFixed(2)}`);

    console.log(`割引前合計: ${subtotal}円`);
    console.log(`割引額: -${discount}円`);
    console.log(`支払合計: ${subtotal - discount}円`);
    console.log("-------------------------\n");

    for (const item of items) {
      item.product.stock -= item.qty;
    }

    cart.clear();
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
console.log(`カート内合計金額（割引前）: ${cart.getSubtotal()}円`);

// 7. チェックアウト (Bowtieによる圧縮・復元および割引計算)
checkoutService.checkout(cart);

// 8. 事後の在庫確認
catalog.print();
