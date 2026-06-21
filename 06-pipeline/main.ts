// ==========================================
// Style 06: Pipeline (パイプライン)
// ==========================================
// 【制約】
// 1. 各処理は副作用を持たない「純粋関数 (Pure Functions)」として実装する。
// 2. イミュータブル (不変) な状態オブジェクトを使用し、状態の変更は常に新しいオブジェクトを生成して返す。
// 3. 状態変数の再代入や途中状態の一時保存を行わず、関数の合成（パイプライン）で全体の流れを構築する。

// --- データ型の定義 (すべてのプロパティを readonly に設定) ---
interface Product {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly stock: number;
}

interface CartItem {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly qty: number;
}

interface AppState {
  readonly catalog: readonly Product[];
  readonly cart: readonly CartItem[];
}

// --- 関数合成 (パイプライン) ヘルパー ---
function pipe<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (initialValue: T) => fns.reduce((acc, fn) => fn(acc), initialValue);
}

// ==========================================
// パイプライン用ワード (純粋関数) の定義
// ==========================================

// 1. カタログ表示 (状態をそのまま次のパイプへパスする)
function printCatalog(state: AppState): AppState {
  console.log("=== 商品カタログ ===");
  state.catalog.forEach(item => {
    console.log(`[${item.id}] ${item.name} / 価格: ${item.price}円 / 在庫: ${item.stock}個`);
  });
  console.log("===================\n");
  return state;
}

// 2. カートへの追加 (カリー化された高階関数)
// 引数を事前束縛し、AppState -> AppState の純粋関数を返す
function addToCart(targetId: string, qty: number): (state: AppState) => AppState {
  return (state: AppState): AppState => {
    const product = state.catalog.find(p => p.id === targetId);

    // 商品存在チェック
    if (!product) {
      console.log(`エラー: 商品 ${targetId} が見つかりません。`);
      return state;
    }

    // カート内の現在の追加数
    const cartItem = state.cart.find(item => item.id === targetId);
    const currentInCart = cartItem ? cartItem.qty : 0;

    // 在庫チェック
    if (product.stock === 0) {
      console.log(`エラー: ${product.name} は在庫切れです。`);
      return state;
    }
    if (product.stock < currentInCart + qty) {
      console.log(`エラー: ${product.name} の在庫が不足しています（要求: ${qty}個, カート内: ${currentInCart}個, 在庫: ${product.stock}個）。`);
      return state;
    }

    // 新しいカート配列の生成 (イミュータブルな配列操作)
    const newCart = cartItem
      ? state.cart.map(item => item.id === targetId ? { ...item, qty: item.qty + qty } : item)
      : [...state.cart, { id: targetId, name: product.name, price: product.price, qty: qty }];

    console.log(`[OK] カートに追加しました: ${product.name} x ${qty}`);

    // 新しい状態オブジェクトを返却 (シャローコピー)
    return {
      catalog: state.catalog,
      cart: newCart
    };
  };
}

// 3. チェックアウト (状態を入力とし、レシート出力と在庫更新済みの新しい状態を返す)
function checkout(state: AppState): AppState {
  if (state.cart.length === 0) {
    console.log("エラー: カートが空です。");
    return state;
  }

  console.log("\n--- レシート (Receipt) ---");

  // 各カート商品の小計出力
  state.cart.forEach(item => {
    const lineTotal = item.price * item.qty;
    console.log(`・${item.name} (${item.price}円) x ${item.qty} = ${lineTotal}円`);
  });

  // 合計金額の計算
  const subtotal = state.cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

  // 割引計算 (3000円以上で10%OFF)
  const discount = subtotal >= 3000 ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - discount;

  console.log(`割引前合計: ${subtotal}円`);
  console.log(`割引額: -${discount}円`);
  console.log(`支払合計: ${total}円`);
  console.log("-------------------------\n");

  // 在庫を減算した新しいカタログ配列の生成 (イミュータブルな更新)
  const newCatalog = state.catalog.map(prod => {
    const cartItem = state.cart.find(item => item.id === prod.id);
    return cartItem
      ? { ...prod, stock: prod.stock - cartItem.qty }
      : prod;
  });

  // カートを空にし、在庫更新した新しい状態を返却
  return {
    catalog: newCatalog,
    cart: []
  };
}


// ==========================================
// テストストーリーの実行 (関数パイプライン)
// ==========================================

// 初期状態 (不変データ)
const initialState: AppState = {
  catalog: [
    { id: 'PRD-01', name: 'ノートPC', price: 100000, stock: 2 },
    { id: 'PRD-02', name: 'マウス', price: 3000, stock: 5 },
    { id: 'PRD-03', name: 'キーボード', price: 5000, stock: 0 }
  ],
  cart: []
};

// ストーリー全体の処理を合成関数として定義
const runShoppingSimulation = pipe(
  printCatalog,
  addToCart('PRD-02', 1),  // 正常な追加: マウス
  addToCart('PRD-03', 1),  // 在庫切れ追加試行: キーボード
  addToCart('PRD-01', 3),  // 在庫不足追加試行: ノートPC
  addToCart('PRD-01', 1),  // 正常な追加: ノートPC
  checkout,
  printCatalog
);

// パイプライン実行
runShoppingSimulation(initialState);
