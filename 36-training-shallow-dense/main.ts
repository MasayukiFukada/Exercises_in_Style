// ==========================================
// Style 36: Training Shallow Dense (学習)
// ==========================================
// 【制約】
// 1. パーセプトロン（単層ニューラルネットワーク）の重み（W）とバイアス（b）を固定値としてハードコーディングしない。
// 2. 実行時に「教師データ（学習用サンプル）」を流し込み、デルタ規則（パーセプトロン学習規則）を用いてパラメータを自動学習させる。
// 3. 学習によって収束したパラメータを用いて、本番のビジネスルール判定を実行する。

// 活性化関数: ステップ関数
function stepFunction(z: number): number {
  return z >= 0 ? 1 : 0;
}

// デルタ規則によるパーセプトロンの学習クラス
class PerceptonModel {
  public w: number = 0.1; // 初期重み
  public b: number = 0.0; // 初期バイアス
  private learningRate = 0.01;

  // 予測 (フォワードパス) - 入力をスケーリング（千円単位）して予測
  predict(subtotal: number): number {
    const x = subtotal / 1000;
    const z = this.w * x + this.b;
    return stepFunction(z);
  }

  // 1エポックの学習の実行 (W, b の更新)
  train(trainingData: { x: number; y: number }[]): void {
    for (const sample of trainingData) {
      const xNorm = sample.x / 1000;
      const pred = this.predict(sample.x);
      const error = sample.y - pred; // 誤差 (目標値 - 予測値)

      if (error !== 0) {
        // 重みとバイアスの更新 (デルタ規則)
        this.w += this.learningRate * error * xNorm;
        this.b += this.learningRate * error;
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
  constructor(private discountModel: PerceptonModel) {}

  checkout(cart: ShoppingCart): void {
    if (cart.items.length === 0) {
      console.log("エラー: カートが空です。");
      return;
    }

    console.log("\n--- レシート (Receipt) ---");
    for (const item of cart.items) {
      console.log(`·${item.product.name} (${item.product.price}円) x ${item.qty} = ${item.product.price * item.qty}円`);
    }

    const subtotal = cart.getSubtotal();
    
    // 学習によってパラメータが収束したモデルを用いて割引適用を予測
    const discountFactor = this.discountModel.predict(subtotal);
    const discount = discountFactor * Math.round(subtotal * 0.1);

    console.log(`割引前合計: ${subtotal}円`);
    console.log(`割引額: -${discount}円`);
    console.log(`支払合計: ${subtotal - discount}円`);
    console.log("-------------------------\n");

    for (const item of cart.items) {
      item.product.stock -= item.qty;
    }

    cart.clear();
  }
}

// ==========================================
// 教師データを用いたモデルの動的学習
// ==========================================

console.log("--- 割引判定モデルのトレーニング開始 ---");

// 教師データの定義 (小計金額 x に対し、3000円以上なら y=1、未満なら y=0)
const trainingSamples = [
  { x: 500, y: 0 },
  { x: 1000, y: 0 },
  { x: 2500, y: 0 },
  { x: 2900, y: 0 },
  { x: 3000, y: 1 },
  { x: 3100, y: 1 },
  { x: 5000, y: 1 },
  { x: 10000, y: 1 }
];

const discountModel = new PerceptonModel();

// 500エポック学習を実行して W, b を収束させる
for (let epoch = 1; epoch <= 500; epoch++) {
  discountModel.train(trainingSamples);
}

console.log(`トレーニング完了。学習パラメータ: w = ${discountModel.w.toFixed(4)}, b = ${discountModel.b.toFixed(4)}`);
console.log(`(判定境界の検証: 2500円 -> 予測 ${discountModel.predict(2500)}, 3500円 -> 予測 ${discountModel.predict(3500)})\n`);

// ==========================================
// テストストーリーの実行
// ==========================================

const catalog = new Catalog([
  new Product('PRD-01', 'ノートPC', 100000, 2),
  new Product('PRD-02', 'マウス', 3000, 5),
  new Product('PRD-03', 'キーボード', 5000, 0)
]);

const cart = new ShoppingCart();
const checkoutService = new CheckoutService(discountModel); // 学習済みモデルを注入

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

// 7. チェックアウト (レシート出力)
checkoutService.checkout(cart);

// 8. 事後の在庫確認
catalog.print();
