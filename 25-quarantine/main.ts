// ==========================================
// Style 25: Quarantine (隔離 / 純粋関数 - IOモナド)
// ==========================================
// 【制約】
// 1. コア計算ロジック（純粋関数）と、副作用（I/Oや状態書き換え）を伴う処理（不純な処理）を厳密に隔離する。
// 2. 副作用を伴うすべての処理は、HaskellのIOモナドと同様の「IOコンテナ」に隔離する。
// 3. 値の変換や計算はイミュータブル（不変）なデータの流れとして記述し、IOコンテナのバインディング（結合）によって遅延評価され、最後に明示的に実行（`run()`）されるまで副作用は生じない。

// ==========================================
// IO モナド (コンテナ) の定義
// ==========================================
class IO<T> {
  private readonly effect: () => T;

  constructor(effect: () => T) {
    this.effect = effect;
  }

  // 純粋な値をIOに包む
  static of<U>(val: U): IO<U> {
    return new IO(() => val);
  }

  // 副作用を伴う関数を繋ぎ合わせる
  bind<U>(fn: (val: T) => IO<U>): IO<U> {
    return new IO(() => {
      const val = this.effect();
      return fn(val).run();
    });
  }

  // 実際に副作用を実行する
  run(): T {
    return this.effect();
  }
}

// ==========================================
// イミュータブルなデータモデルの定義
// ==========================================
interface Product {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly stock: number;
}

interface CartItem {
  readonly product: Product;
  readonly qty: number;
}

interface AppState {
  readonly catalog: readonly Product[];
  readonly cart: readonly CartItem[];
}

// ==========================================
// 純粋計算関数 (Pure Functions - I/Oなし、副作用なし)
// ==========================================

function getSubtotal(cart: readonly CartItem[]): number {
  return cart.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
}

function calculateDiscount(subtotal: number): number {
  return subtotal >= 3000 ? Math.round(subtotal * 0.1) : 0;
}

function generateReceiptText(cart: readonly CartItem[], subtotal: number, discount: number): string {
  let res = "\n--- レシート (Receipt) ---\n";
  for (const item of cart) {
    res += `・${item.product.name} (${item.product.price}円) x ${item.qty} = ${item.product.price * item.qty}円\n`;
  }
  res += `割引前合計: ${subtotal}円\n`;
  res += `割引額: -${discount}円\n`;
  res += `支払合計: ${subtotal - discount}円\n`;
  res += "-------------------------\n";
  return res;
}

// ==========================================
// 隔離された不純な処理 (Impure Actions - IOモナドを返す)
// ==========================================

// 1. カタログの印刷
function printCatalogIO(state: AppState): IO<AppState> {
  return new IO(() => {
    console.log("=== 商品カタログ ===");
    for (const p of state.catalog) {
      console.log(`[${p.id}] ${p.name} / 価格: ${p.price}円 / 在庫: ${p.stock}個`);
    }
    console.log("===================\n");
    return state;
  });
}

// 2. カートへの追加 (高階関数。状態を受け取り、更新された状態を包むIOモナドを返す)
function addToCartIO(targetId: string, qty: number): (state: AppState) => IO<AppState> {
  return (state: AppState): IO<AppState> => {
    return new IO(() => {
      const product = state.catalog.find(p => p.id === targetId);

      if (!product) {
        console.log(`エラー: 商品 ${targetId} が見つかりません。`);
        return state;
      }

      if (product.stock === 0) {
        console.log(`エラー: ${product.name} は在庫切れです。`);
        return state;
      }

      const existing = state.cart.find(item => item.product.id === targetId);
      const currentInCart = existing ? existing.qty : 0;

      if (product.stock < currentInCart + qty) {
        console.log(`エラー: ${product.name} の在庫が不足しています（要求: ${qty}個, カート内: ${currentInCart}個, 在庫: ${product.stock}個）。`);
        return state;
      }

      // イミュータブルな状態の生成
      const newCart = existing
        ? state.cart.map(item => item.product.id === targetId ? { ...item, qty: item.qty + qty } : item)
        : [...state.cart, { product, qty }];

      console.log(`[OK] カートに追加しました: ${product.name} x ${qty}`);

      return {
        catalog: state.catalog,
        cart: newCart
      };
    });
  };
}

// 3. チェックアウト (レシートのI/Oを行い、在庫を減らした新しい状態を返す)
function checkoutIO(state: AppState): IO<AppState> {
  return new IO(() => {
    if (state.cart.length === 0) {
      console.log("エラー: カートが空です。");
      return state;
    }

    // 純粋関数を呼び出して計算
    const subtotal = getSubtotal(state.cart);
    const discount = calculateDiscount(subtotal);
    const receiptText = generateReceiptText(state.cart, subtotal, discount);

    // I/Oの実行
    console.log(receiptText);

    // 在庫を減算した新しいカタログの生成 (イミュータブル)
    const newCatalog = state.catalog.map(p => {
      const cartItem = state.cart.find(item => item.product.id === p.id);
      return cartItem ? { ...p, stock: p.stock - cartItem.qty } : p;
    });

    return {
      catalog: newCatalog,
      cart: []
    };
  });
}

// ==========================================
// テストストーリーの実行 (モナドを組み立てて最後に run() する)
// ==========================================

const initialState: AppState = {
  catalog: [
    { id: 'PRD-01', name: 'ノートPC', price: 100000, stock: 2 },
    { id: 'PRD-02', name: 'マウス', price: 3000, stock: 5 },
    { id: 'PRD-03', name: 'キーボード', price: 5000, stock: 0 }
  ],
  cart: []
};

// 実行の組み立て (ここでは副作用は一切発生しない)
const cartSimulationFlow: IO<AppState> = IO.of(initialState)
  .bind(printCatalogIO)
  .bind(addToCartIO('PRD-02', 1)) // 正常追加
  .bind(addToCartIO('PRD-03', 1)) // 在庫切れエラー
  .bind(addToCartIO('PRD-01', 3)) // 在庫不足エラー
  .bind(addToCartIO('PRD-01', 1)) // 正常追加
  .bind(checkoutIO)
  .bind(printCatalogIO);

// ここで初めて実行され、画面出力と状態の更新が順番に行われる
cartSimulationFlow.run();
