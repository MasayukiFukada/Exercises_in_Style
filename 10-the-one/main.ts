// ==========================================
// Style 10: The One (ザ・ワン - モナド)
// ==========================================
// 【制約】
// 1. 値（状態）を包み込む抽象的なコンテナ「The One」を定義する。
// 2. コンテナ内の値を外に出さず、値の変換ロジックを関数として受け取る `bind` メソッドを実装する。
// 3. すべての計算と状態遷移は、この `bind` をメソッドチェーンで繋ぐことによって表現する。

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

// ==========================================
// コンテナクラス 「The One」 の定義 (モナド)
// ==========================================
class TheOne<T> {
  private readonly value: T;

  constructor(value: T) {
    this.value = value;
  }

  // 包んでいる値を取り出し、fn に渡し、fn が返す新しい TheOne をそのまま返す
  bind<U>(fn: (val: T) => TheOne<U>): TheOne<U> {
    return fn(this.value);
  }

  // 副作用（ログ出力など）を行い、自分自身（TheOne）をそのまま返すヘルパー
  tap(fn: (val: T) => void): TheOne<T> {
    fn(this.value);
    return this;
  }
}

// ==========================================
// モナド用のアクション (AppState -> TheOne<AppState>) の定義
// ==========================================

// 1. カタログ表示
function printCatalog(state: AppState): TheOne<AppState> {
  console.log("=== 商品カタログ ===");
  state.catalog.forEach(item => {
    console.log(`[${item.id}] ${item.name} / 価格: ${item.price}円 / 在庫: ${item.stock}個`);
  });
  console.log("===================\n");
  
  return new TheOne(state);
}

// 2. カートへの追加 (高階関数)
function addToCart(targetId: string, qty: number): (state: AppState) => TheOne<AppState> {
  return (state: AppState): TheOne<AppState> => {
    const product = state.catalog.find(p => p.id === targetId);

    if (!product) {
      console.log(`エラー: 商品 ${targetId} が見つかりません。`);
      return new TheOne(state);
    }

    const cartItem = state.cart.find(item => item.id === targetId);
    const currentInCart = cartItem ? cartItem.qty : 0;

    if (product.stock === 0) {
      console.log(`エラー: ${product.name} は在庫切れです。`);
      return new TheOne(state);
    }
    if (product.stock < currentInCart + qty) {
      console.log(`エラー: ${product.name} の在庫が不足しています（要求: ${qty}個, カート内: ${currentInCart}個, 在庫: ${product.stock}個）。`);
      return new TheOne(state);
    }

    // カート情報の更新 (イミュータブル)
    const newCart = cartItem
      ? state.cart.map(item => item.id === targetId ? { ...item, qty: item.qty + qty } : item)
      : [...state.cart, { id: targetId, name: product.name, price: product.price, qty: qty }];

    console.log(`[OK] カートに追加しました: ${product.name} x ${qty}`);

    return new TheOne({
      catalog: state.catalog,
      cart: newCart
    });
  };
}

// 3. チェックアウト
function checkout(state: AppState): TheOne<AppState> {
  if (state.cart.length === 0) {
    console.log("エラー: カートが空です。");
    return new TheOne(state);
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

  return new TheOne({
    catalog: newCatalog,
    cart: []
  });
}


// ==========================================
// テストストーリーの実行 (モナド・バインディング)
// ==========================================

const initialState: AppState = {
  catalog: [
    { id: 'PRD-01', name: 'ノートPC', price: 100000, stock: 2 },
    { id: 'PRD-02', name: 'マウス', price: 3000, stock: 5 },
    { id: 'PRD-03', name: 'キーボード', price: 5000, stock: 0 }
  ],
  cart: []
};

// 状態を TheOne コンテナに包み、bind を使って流れるように処理を結合する
new TheOne(initialState)
  .bind(printCatalog)
  .bind(addToCart('PRD-02', 1))  // 正常追加
  .bind(addToCart('PRD-03', 1))  // 在庫切れエラー
  .bind(addToCart('PRD-01', 3))  // 在庫不足エラー
  .bind(addToCart('PRD-01', 1))  // 正常追加
  .bind(checkout)
  .bind(printCatalog)
  .tap(() => console.log("シミュレーションが完了しました。"));
