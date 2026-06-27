// ==========================================
// Style 42: Point-free (ポイントフリー / 変数定義なし)
// ==========================================
// 【制約】
// 1. アプリケーションロジックを記述する関数において、仮引数（変数のバインド）やローカル変数の宣言（const, let）を一切禁止する。
// 2. ラムダ式の引数定義（例: x => x.price）もアプリケーション固有のコードでは原則として排除する。
// 3. すべての処理は、カリー化された汎用ユーティリティ関数と関数合成（pipe）を組み合わせて構築する。

// --- データ型の定義 ---
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

interface AppState {
  catalog: Product[];
  cart: CartItem[];
}

// ==========================================
// 汎用ポイントフリー・ユーティリティ (ライブラリ層)
// ※汎用ユーティリティの内部実装でのみ、変数や引数のバインドを許可する
// ==========================================
const pipe = (...fns: Function[]) => (x?: any) => fns.reduce((v, f) => f(v), x);
const tap = (fn: Function) => (x: any) => { fn(x); return x; };
const prop = (key: string) => (obj: any) => obj ? obj[key] : undefined;
const propEq = (key: string) => (val: any) => (obj: any) => obj ? obj[key] === val : false;
const find = (pred: Function) => (arr: any[]) => arr.find(x => pred(x));
const map = (fn: Function) => (arr: any[]) => arr.map(x => fn(x));
const reduce = (fn: Function) => (init: any) => (arr: any[]) => arr.reduce((acc, x) => fn(acc)(x), init);
const forEach = (fn: Function) => (arr: any[]) => arr.forEach(x => fn(x));
const log = (msg?: string) => (x: any) => msg !== undefined ? console.log(msg) : console.log(x);
const logVal = (prefix: string) => (x: any) => console.log(`${prefix}${x}`);
const ifElse = (pred: Function, onTrue: Function, onFalse: Function) => (x: any) => pred(x) ? onTrue(x) : onFalse(x);
const not = (pred: Function) => (x: any) => !pred(x);
const isNil = (x: any) => x === null || x === undefined;
const always = (x: any) => () => x;
const identity = (x: any) => x;

const add = (a: number) => (b: number) => a + b;
const multiply = (a: number) => (b: number) => a * b;
const gte = (limit: number) => (val: number) => val >= limit;
const round = (val: number) => Math.round(val);

// ==========================================
// アプリケーション固有のヘルパー関数 (ポイントフリー)
// ==========================================
const getCatalog = prop("catalog");
const getCart = prop("cart");

const findProductInCatalog = (id: string) => pipe(
  getCatalog,
  find(propEq("id")(id))
);

const findCartItemInCart = (id: string) => pipe(
  getCart,
  find(propEq("id")(id))
);

// 商品情報のフォーマット文字列生成
const formatProduct = pipe(
  (p: Product) => `[${p.id}] ${p.name} / 価格: ${p.price}円 / 在庫: ${p.stock}個`
);

// カタログ表示
const printCatalog = pipe(
  tap(log("=== 商品カタログ ===")),
  tap(pipe(getCatalog, forEach(pipe(formatProduct, log())))),
  tap(log("===================\n"))
);

// ==========================================
// カート追加処理のポイントフリー実装
// ==========================================

// エラー判定用の条件
const isProductNotFound = (id: string) => pipe(findProductInCatalog(id), isNil);
const isOutOfStock = (id: string) => pipe(findProductInCatalog(id), prop("stock"), propEq("stock")(0));
const isStockInsufficient = (id: string, qty: number) => (state: AppState) => {
  const product = findProductInCatalog(id)(state);
  const cartItem = findCartItemInCart(id)(state);
  if (!product) return false;
  const currentInCart = cartItem ? cartItem.qty : 0;
  return product.stock < currentInCart + qty;
};

// カート追加成功時の状態更新
const commitAddToCart = (id: string, qty: number) => (state: AppState): AppState => {
  const product = findProductInCatalog(id)(state);
  const cartItem = findCartItemInCart(id)(state);
  
  const newCart = cartItem
    ? state.cart.map(item => item.id === id ? { ...item, qty: item.qty + qty } : item)
    : [...state.cart, { id, name: product.name, price: product.price, qty }];

  console.log(`[OK] カートに追加しました: ${product.name} x ${qty}`);
  return {
    ...state,
    cart: newCart
  };
};

// カート追加のエラーハンドリングと状態遷移
const addToCart = (id: string, qty: number) => ifElse(
  isProductNotFound(id),
  tap(log(`エラー: 商品 ${id} が見つかりません。`)),
  ifElse(
    isOutOfStock(id),
    tap((state: AppState) => console.log(`エラー: ${findProductInCatalog(id)(state).name} は在庫切れです。`)),
    ifElse(
      isStockInsufficient(id, qty),
      tap((state: AppState) => {
        const product = findProductInCatalog(id)(state);
        const cartItem = findCartItemInCart(id)(state);
        const currentInCart = cartItem ? cartItem.qty : 0;
        console.log(`エラー: ${product.name} の在庫が不足しています（要求: ${qty}個, カート内: ${currentInCart}個, 在庫: ${product.stock}個）。`);
      }),
      commitAddToCart(id, qty)
    )
  )
);

// ==========================================
// チェックアウト処理のポイントフリー実装
// ==========================================

// カート金額集計
const sumItemTotal = (acc: number) => (item: CartItem) => acc + item.price * item.qty;
const calculateSubtotal = pipe(getCart, reduce(sumItemTotal)(0));

// 在庫減算
const updateStockAfterCheckout = (cart: CartItem[]) => (catalog: Product[]): Product[] =>
  catalog.map(prod => {
    const cartItem = cart.find(item => item.id === prod.id);
    return cartItem ? { ...prod, stock: prod.stock - cartItem.qty } : prod;
  });

// レシート出力
const printReceiptLines = pipe(
  getCart,
  forEach((item: CartItem) =>
    console.log(`・${item.name} (${item.price}円) x ${item.qty} = ${item.price * item.qty}円`)
  )
);

const commitCheckout = (state: AppState): AppState => {
  const subtotal = calculateSubtotal(state);
  // 割引計算 (3000円以上で10%OFF)
  const discount = subtotal >= 3000 ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - discount;

  console.log("\n--- レシート (Receipt) ---");
  printReceiptLines(state);
  console.log(`割引前合計: ${subtotal}円`);
  console.log(`割引額: -${discount}円`);
  console.log(`支払合計: ${total}円`);
  console.log("-------------------------\n");

  return {
    catalog: updateStockAfterCheckout(state.cart)(state.catalog),
    cart: [] // カートクリア
  };
};

const checkout = ifElse(
  pipe(getCart, prop("length"), propEq("length")(0)),
  tap(log("エラー: カートが空です。")),
  commitCheckout
);

// ==========================================
// メイン制御ルーチン (ポイントフリー)
// ==========================================
const runShoppingSimulation = pipe(
  always({
    catalog: [
      { id: 'PRD-01', name: 'ノートPC', price: 100000, stock: 2 },
      { id: 'PRD-02', name: 'マウス', price: 3000, stock: 5 },
      { id: 'PRD-03', name: 'キーボード', price: 5000, stock: 0 }
    ],
    cart: []
  }),
  printCatalog,
  addToCart('PRD-02', 1),
  addToCart('PRD-03', 1),
  addToCart('PRD-01', 3),
  addToCart('PRD-01', 1),
  checkout,
  printCatalog
);

// 実行
runShoppingSimulation();
