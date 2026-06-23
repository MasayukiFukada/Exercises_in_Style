// ==========================================
// Style 41: Convolutions (畳み込み)
// ==========================================
// 【制約】
// 1. 特徴抽出やビジネスロジック判定（在庫・割引）を、配列（テンソル）に対する汎用的な「畳み込み（Convolution）演算」として定義する。
// 2. 個別の `if-else` や手続き型ループによる在庫・価格チェックを排する。
// 3. 汎用的な `convolve` 関数を記述し、それに異なる入力データと「重みカーネル（フィルター）」を適用して、出力を得る。
// 4. 畳み込み結果に対して活性化関数を適用し、最終的な意思決定（在庫有無、割引適用など）を導く。

// 汎用的な1次元畳み込み関数
// input: 入力信号配列, kernel: 重みフィルター配列, stride: スライドする歩幅
function convolve(input: number[], kernel: number[], stride: number): number[] {
  const result: number[] = [];
  const kLen = kernel.length;
  // カーネルが完全に入力に収まる範囲でスライドさせる
  for (let i = 0; i <= input.length - kLen; i += stride) {
    let sum = 0;
    for (let j = 0; j < kLen; j++) {
      sum += input[i + j] * kernel[j];
    }
    result.push(sum);
  }
  return result;
}

// 活性化関数: ステップ関数 (Heaviside step function)
function stepFunction(z: number): number {
  return z >= 0 ? 1 : 0;
}

// 商品の定義
class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly price: number,
    public stock: number
  ) {}
}

class Catalog {
  constructor(public products: Product[]) {}

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

class ShoppingCart {
  // 各商品のカート内数量をカタログ順で管理
  public qtyInCart: number[] = [0, 0, 0]; 
}

// ==========================================
// 畳み込みを用いたショッピング管理システム
// ==========================================
class ConvolutionalShoppingSystem {
  constructor(
    public catalog: Catalog,
    public cart: ShoppingCart
  ) {}

  // 在庫十分性チェック (畳み込みを利用)
  checkStock(addQtyRequest: number[]): { allowed: boolean; message?: string } {
    // データをフラットなテンソルにパック
    // フォーマット: [在庫0, カート0, 要求0, 在庫1, カート1, 要求1, 在庫2, カート2, 要求2]
    const input: number[] = [];
    for (let i = 0; i < this.catalog.products.length; i++) {
      input.push(this.catalog.products[i].stock);
      input.push(this.cart.qtyInCart[i]);
      input.push(addQtyRequest[i]);
    }

    // 在庫判定カーネル: z = 1 * 在庫 - 1 * カート - 1 * 要求
    const kernel = [1, -1, -1];
    
    // ストライド 3 で畳み込みを行い、商品ごとの余裕在庫量を算出する
    const featureMap = convolve(input, kernel, 3);

    // 活性化関数（ステップ関数）を適用して、在庫十分フラグ (1: 十分, 0: 不足) を取得
    const results = featureMap.map(stepFunction);

    // 要求のあった商品の判定結果をチェック
    for (let i = 0; i < addQtyRequest.length; i++) {
      if (addQtyRequest[i] > 0) {
        const prod = this.catalog.products[i];
        if (prod.stock === 0) {
          return { allowed: false, message: `エラー: ${prod.name} は在庫切れです。` };
        }
        if (results[i] === 0) {
          return {
            allowed: false,
            message: `エラー: ${prod.name} の在庫が不足しています（要求: ${addQtyRequest[i]}個, カート内: ${this.cart.qtyInCart[i]}個, 在庫: ${prod.stock}個）。`
          };
        }
      }
    }

    return { allowed: true };
  }

  // カートにアイテムを追加する
  addItem(productId: string, qty: number): void {
    const prdIdx = this.catalog.products.findIndex(p => p.id === productId);
    if (prdIdx === -1) return;

    // 要求要求ベクトル
    const request = [0, 0, 0];
    request[prdIdx] = qty;

    // 畳み込みによるチェック
    const check = this.checkStock(request);

    if (!check.allowed) {
      console.log(check.message);
      return;
    }

    this.cart.qtyInCart[prdIdx] += qty;
    console.log(`[OK] カートに追加しました: ${this.catalog.products[prdIdx].name} x ${qty}`);
  }

  // カート小計の計算 (畳み込みを利用)
  getSubtotal(): number {
    // 入力 = カート内数量 [qty0, qty1, qty2]
    const input = [...this.cart.qtyInCart];

    // 重みカーネル = 各商品の価格 [price0, price1, price2]
    const kernel = this.catalog.products.map(p => p.price);

    // 数量と価格の積和（畳み込み）を一挙に計算する。
    // ストライドはカーネルの長さと同じにして全体を畳み込む。
    const result = convolve(input, kernel, kernel.length);

    return result[0] || 0;
  }

  // チェックアウトを実行
  checkout(): void {
    const subtotal = this.getSubtotal();

    if (subtotal === 0) {
      console.log("エラー: カートが空です。");
      return;
    }

    console.log("\n--- レシート (Receipt) ---");
    for (let i = 0; i < this.catalog.products.length; i++) {
      const qty = this.cart.qtyInCart[i];
      if (qty > 0) {
        const prod = this.catalog.products[i];
        console.log(`・${prod.name} (${prod.price}円) x ${qty} = ${prod.price * qty}円`);
      }
    }

    // 割引適用判定 (3000円以上で10%オフ) を畳み込みで計算
    // 入力 = [小計]
    // カーネル = [1], バイアス = -3000
    const input = [subtotal];
    const kernel = [1];
    const z = convolve(input, kernel, 1)[0] - 3000;
    const discountApplied = stepFunction(z); // 1 = 適用, 0 = なし

    const discount = discountApplied * Math.round(subtotal * 0.1);

    console.log(`割引前合計: ${subtotal}円`);
    console.log(`割引額: -${discount}円`);
    console.log(`支払合計: ${subtotal - discount}円`);
    console.log("-------------------------\n");

    // 実在庫の引き落とし
    for (let i = 0; i < this.catalog.products.length; i++) {
      this.catalog.products[i].stock -= this.cart.qtyInCart[i];
      this.cart.qtyInCart[i] = 0; // カートクリア
    }
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
const system = new ConvolutionalShoppingSystem(catalog, cart);

// 1. 商品一覧の表示
catalog.print();

// 2. 正常な追加
system.addItem('PRD-02', 1);

// 3. 在庫切れの追加試行
system.addItem('PRD-03', 1);

// 4. 在庫超えの追加試行
system.addItem('PRD-01', 3);

// 5. 複数商品の追加 (ノートPCを1個追加)
system.addItem('PRD-01', 1);

// 6. カート状態の確認
console.log(`カート内合計金額（割引前）: ${system.getSubtotal()}円`);

// 7. チェックアウト
system.checkout();

// 8. 事後の在庫確認
catalog.print();
