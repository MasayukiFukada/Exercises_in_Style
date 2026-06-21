// ==========================================
// Style 09: Kick Forward (キックフォワード - 継続渡し)
// ==========================================
// 【制約】
// 1. 各関数は呼び出し元に `return` で値を返してはならない。
// 2. 次に実行すべき処理（継続: Continuation）をコールバック関数として引数で受け取る。
// 3. 処理の終了時、受け取った継続関数を呼び出して制御を次にバトンタッチ（前方へキック）する。

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

// 継続関数の型定義 (AppState を受け取って何も返さない)
type Continuation = (state: AppState) => void;

// ==========================================
// 継続渡しスタイル (CPS) の手続きの定義
// ==========================================

// 1. カタログ表示ワード
// 状態を表示し、そのまま次の処理へ状態を渡す
function printCatalog(state: AppState, next: Continuation): void {
  console.log("=== 商品カタログ ===");
  state.catalog.forEach(item => {
    console.log(`[${item.id}] ${item.name} / 価格: ${item.price}円 / 在庫: ${item.stock}個`);
  });
  console.log("===================\n");
  
  // 次の関数に状態をキック
  next(state);
}

// 2. カート追加ワード
// 状態更新後に次の処理を呼び出す
function addToCart(
  targetId: string,
  qty: number,
  state: AppState,
  next: Continuation
): void {
  const product = state.catalog.find(p => p.id === targetId);

  if (!product) {
    console.log(`エラー: 商品 ${targetId} が見つかりません。`);
    next(state); // 状態を変更せずに次へ
    return;
  }

  const cartItem = state.cart.find(item => item.id === targetId);
  const currentInCart = cartItem ? cartItem.qty : 0;

  if (product.stock === 0) {
    console.log(`エラー: ${product.name} は在庫切れです。`);
    next(state);
    return;
  }
  if (product.stock < currentInCart + qty) {
    console.log(`エラー: ${product.name} の在庫が不足しています（要求: ${qty}個, カート内: ${currentInCart}個, 在庫: ${product.stock}個）。`);
    next(state);
    return;
  }

  // 新しいカート情報の生成 (イミュータブル)
  const newCart = cartItem
    ? state.cart.map(item => item.id === targetId ? { ...item, qty: item.qty + qty } : item)
    : [...state.cart, { id: targetId, name: product.name, price: product.price, qty: qty }];

  console.log(`[OK] カートに追加しました: ${product.name} x ${qty}`);

  // 新しい状態を作って次へキック
  next({
    catalog: state.catalog,
    cart: newCart
  });
}

// 3. チェックアウトワード
function checkout(state: AppState, next: Continuation): void {
  if (state.cart.length === 0) {
    console.log("エラー: カートが空です。");
    next(state);
    return;
  }

  console.log("\n--- レシート (Receipt) ---");
  state.cart.forEach(item => {
    console.log(`・${item.name} (${item.price}円) x ${item.qty} = ${item.price * item.qty}円`);
  });

  const subtotal = state.cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const discount = subtotal >= 3000 ? Math.round(subtotal * 0.1) : 0;

  console.log(`割引前合計: ${subtotal}円`);
  console.log(`割引額: -${discount}円`);
  console.log(`支払合計: ${subtotal - discount}円`);
  console.log("-------------------------\n");

  // 在庫減算
  const newCatalog = state.catalog.map(prod => {
    const cartItem = state.cart.find(item => item.id === prod.id);
    return cartItem ? { ...prod, stock: prod.stock - cartItem.qty } : prod;
  });

  // カートを空にして次へキック
  next({
    catalog: newCatalog,
    cart: []
  });
}


// ==========================================
// テストストーリーの実行 (継続によるチェーニング)
// ==========================================

const initialState: AppState = {
  catalog: [
    { id: 'PRD-01', name: 'ノートPC', price: 100000, stock: 2 },
    { id: 'PRD-02', name: 'マウス', price: 3000, stock: 5 },
    { id: 'PRD-03', name: 'キーボード', price: 5000, stock: 0 }
  ],
  cart: []
};

// 呼び出し元に戻らず、コールバックの鎖（CPS）でストーリーを進める
printCatalog(initialState, (state1) => {
  addToCart('PRD-02', 1, state1, (state2) => {
    addToCart('PRD-03', 1, state2, (state3) => {
      addToCart('PRD-01', 3, state3, (state4) => {
        addToCart('PRD-01', 1, state4, (state5) => {
          checkout(state5, (state6) => {
            printCatalog(state6, (finalState) => {
              // 最終終端の継続 (シミュレーション終了)
              console.log("シミュレーションが完了しました。");
            });
          });
        });
      });
    });
  });
});
