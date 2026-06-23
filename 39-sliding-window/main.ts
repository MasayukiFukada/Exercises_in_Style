// ==========================================
// Style 39: Sliding Window (スライディングウィンドウ)
// ==========================================
// 【制約】
// 1. データ（在庫、カート、価格など）をフラットなシーケンス（配列）として表現する。
// 2. 明示的なループや個別オブジェクトへの if-else によるビジネスルール判定を排する。
// 3. 代わりに、一定の窓幅（Window Size）と歩幅（Stride）でデータを切り出す「スライディングウィンドウ」のインデックスを生成する。
// 4. 切り出された各ウィンドウに対して、重みベクトルとの積（畳み込み・線形結合）と活性化関数を適用して一括して状態判定や計算を行う。

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

// カートの状態
class ShoppingCart {
  // 各商品のカート内数量をカタログの並び順と同じインデックスで管理
  public qtyInCart: number[] = [0, 0, 0]; 
}

// スライディングウィンドウを生成する関数
// 配列 x から、ウィンドウサイズ w, ストライド s で部分配列を切り出すためのインデックス行列を作成する
function getSlidingWindowIndices(arrayLength: number, windowSize: number, stride: number): number[][] {
  const indices: number[][] = [];
  for (let i = 0; i <= arrayLength - windowSize; i += stride) {
    const win: number[] = [];
    for (let j = 0; j < windowSize; j++) {
      win.push(i + j);
    }
    indices.push(win);
  }
  return indices;
}

// ウィンドウインデックスを適用して、フラットなデータ配列からウィンドウごとの行列を抽出する
function applyWindow(data: number[], indices: number[][]): number[][] {
  return indices.map(winIdx => winIdx.map(i => data[i]));
}

// 活性化関数: ステップ関数
function stepFunction(z: number): number {
  return z >= 0 ? 1 : 0;
}

// ==========================================
// ビジネスロジックの実行クラス
// ==========================================
class ShoppingSystem {
  constructor(
    public catalog: Catalog,
    public cart: ShoppingCart
  ) {}

  // 在庫チェックを一括して行う（スライディングウィンドウと重み演算を使用）
  // addQtyRequest: カタログの各商品に対する追加要求数量の配列 (例: [0, 1, 0] はマウスを1個追加)
  checkStockAvailability(addQtyRequest: number[]): { allowed: boolean; message?: string } {
    // データをフラットなシーケンスにパックする
    // フォーマット: [在庫_0, カート_0, 要求_0, 在庫_1, カート_1, 要求_1, 在庫_2, カート_2, 要求_2]
    const data: number[] = [];
    for (let i = 0; i < this.catalog.products.length; i++) {
      data.push(this.catalog.products[i].stock);
      data.push(this.cart.qtyInCart[i]);
      data.push(addQtyRequest[i]);
    }

    // スライディングウィンドウのインデックスを生成
    // 3つの要素（在庫, カート, 要求）を1単位とするため、ウィンドウサイズ=3, ストライド=3
    const winIndices = getSlidingWindowIndices(data.length, 3, 3);
    const windows = applyWindow(data, winIndices);

    // 重みとバイアスを設定
    // z = 1 * 在庫 - 1 * カート内 - 1 * 追加要求
    // z >= 0 なら在庫あり (ステップ関数出力: 1)、z < 0 なら不足 (ステップ関数出力: 0)
    const w = [1, -1, -1];
    const b = 0;

    const results = windows.map(win => {
      const z = win.reduce((sum, val, idx) => sum + val * w[idx], 0) + b;
      return stepFunction(z);
    });

    // 要求があった商品（addQtyRequest[i] > 0）について、予測結果が 0 (不足) であるかチェック
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
    const productIndex = this.catalog.products.findIndex(p => p.id === productId);
    if (productIndex === -1) return;

    // 今回の要求ベクトルを作成
    const request = [0, 0, 0];
    request[productIndex] = qty;

    // スライディングウィンドウベースの在庫判定
    const check = this.checkStockAvailability(request);

    if (!check.allowed) {
      console.log(check.message);
      return;
    }

    // カートを更新
    this.cart.qtyInCart[productIndex] += qty;
    console.log(`[OK] カートに追加しました: ${this.catalog.products[productIndex].name} x ${qty}`);
  }

  // カート内合計金額（割引前）を計算する
  getSubtotal(): number {
    // データをフラットなシーケンスにする: [価格_0, 数量_0, 価格_1, 数量_1, 価格_2, 数量_2]
    const data: number[] = [];
    for (let i = 0; i < this.catalog.products.length; i++) {
      data.push(this.catalog.products[i].price);
      data.push(this.cart.qtyInCart[i]);
    }

    // ウィンドウサイズ=2, ストライド=2 で各商品の価格と数量をペアにする
    const winIndices = getSlidingWindowIndices(data.length, 2, 2);
    const windows = applyWindow(data, winIndices);

    // 各ウィンドウ (価格 * 数量) を計算して合計する
    const subtotal = windows.reduce((sum, win) => sum + (win[0] * win[1]), 0);
    return subtotal;
  }

  // チェックアウトを実行
  checkout(): void {
    const subtotal = this.getSubtotal();
    
    // カートが空か判定（小計が0か）
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

    // 割引適用判定 (3000円以上で10%オフ)
    // 入力 = [小計], 重み = [1], バイアス = -3000
    const x = [subtotal];
    const w = [1];
    const b = -3000;
    const z = x[0] * w[0] + b;
    const discountApplied = stepFunction(z); // 1 = 適用, 0 = なし

    const discount = discountApplied * Math.round(subtotal * 0.1);

    console.log(`割引前合計: ${subtotal}円`);
    console.log(`割引額: -${discount}円`);
    console.log(`支払合計: ${subtotal - discount}円`);
    console.log("-------------------------\n");

    // 在庫の引き落とし
    for (let i = 0; i < this.catalog.products.length; i++) {
      this.catalog.products[i].stock -= this.cart.qtyInCart[i];
      this.cart.qtyInCart[i] = 0; // カートをクリア
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
const system = new ShoppingSystem(catalog, cart);

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
