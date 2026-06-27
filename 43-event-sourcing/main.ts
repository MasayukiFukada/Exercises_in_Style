// ==========================================
// Style 43: Event Sourcing (イベントソーシング)
// ==========================================
// 【制約】
// 1. システムの現在の状態（商品の在庫やカートの中身など）を直接更新する再代入や破壊的操作を禁止する。
// 2. 状態の変更はすべて「過去に起きた不変の事実」を表す「イベント」オブジェクトとして定義され、イベントログ（Append-Only）に記録される。
// 3. 現在のアプリケーション状態を取得したい場合は、初期状態に対してイベントログの全履歴を順に適用（Replay / 畳み込み）して動的に構築する。

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

// ドメインイベントの定義
type DomainEvent =
  | { type: 'CartItemAdded'; productId: string; qty: number }
  | { type: 'CartItemAddFailed'; productId: string; qty: number; reason: string }
  | { type: 'CheckoutCommitted'; subtotal: number; discount: number; total: number; items: CartItem[] }
  | { type: 'CheckoutFailed'; reason: string };

// 初期カタログデータ (不変テンプレート)
const INITIAL_PRODUCTS: ReadonlyArray<Product> = [
  { id: 'PRD-01', name: 'ノートPC', price: 100000, stock: 2 },
  { id: 'PRD-02', name: 'マウス', price: 3000, stock: 5 },
  { id: 'PRD-03', name: 'キーボード', price: 5000, stock: 0 }
];

// アプリケーションが動的に再現する状態の型
interface AppState {
  catalog: Product[];
  cart: CartItem[];
}

// ==========================================
// イベントログから現在の状態を再構築する（Projection）
// ==========================================
function replayEvents(eventStore: DomainEvent[]): AppState {
  // 初期状態のコピーを作成
  const catalog: Product[] = INITIAL_PRODUCTS.map(p => ({ ...p }));
  let cart: CartItem[] = [];

  for (const event of eventStore) {
    switch (event.type) {
      case 'CartItemAdded': {
        const prod = catalog.find(p => p.id === event.productId)!;
        const cartItem = cart.find(item => item.id === event.productId);
        if (cartItem) {
          cartItem.qty += event.qty;
        } else {
          cart.push({ id: event.productId, name: prod.name, price: prod.price, qty: event.qty });
        }
        break;
      }
      case 'CheckoutCommitted': {
        // カートの中身を基準に在庫を減算し、カートをクリア
        for (const item of event.items) {
          const prod = catalog.find(p => p.id === item.id);
          if (prod) {
            prod.stock -= item.qty;
          }
        }
        cart = [];
        break;
      }
      case 'CartItemAddFailed':
      case 'CheckoutFailed':
        // 失敗イベントは状態（Projection）に変化を与えない
        break;
    }
  }

  return { catalog, cart };
}

// ==========================================
// ビジネスロジック / コマンド処理
// ==========================================

// 1. カタログの表示 (現在の状態をプロジェクションして出力)
function printCatalog(eventStore: DomainEvent[]): void {
  const state = replayEvents(eventStore);
  console.log("=== 商品カタログ ===");
  for (const item of state.catalog) {
    console.log(`[${item.id}] ${item.name} / 価格: ${item.price}円 / 在庫: ${item.stock}個`);
  }
  console.log("===================\n");
}

// 2. カートへの追加コマンド
// 検証を行い、成功または失敗のイベントをログに記録し、コンソールに結果を出す
function executeAddToCart(
  eventStore: DomainEvent[],
  productId: string,
  qty: number
): void {
  const currentState = replayEvents(eventStore);
  const product = currentState.catalog.find(p => p.id === productId);

  if (!product) {
    const reason = `商品 ${productId} が見つかりません。`;
    eventStore.push({ type: 'CartItemAddFailed', productId, qty, reason });
    console.log(`エラー: ${reason}`);
    return;
  }

  const cartItem = currentState.cart.find(item => item.id === productId);
  const currentInCart = cartItem ? cartItem.qty : 0;

  if (product.stock === 0) {
    const reason = `${product.name} は在庫切れです。`;
    eventStore.push({ type: 'CartItemAddFailed', productId, qty, reason });
    console.log(`エラー: ${reason}`);
    return;
  }

  if (product.stock < currentInCart + qty) {
    const reason = `${product.name} の在庫が不足しています（要求: ${qty}個, カート内: ${currentInCart}個, 在庫: ${product.stock}個）。`;
    eventStore.push({ type: 'CartItemAddFailed', productId, qty, reason });
    console.log(`エラー: ${reason}`);
    return;
  }

  // 成功イベントの発行
  eventStore.push({ type: 'CartItemAdded', productId, qty });
  console.log(`[OK] カートに追加しました: ${product.name} x ${qty}`);
}

// 3. チェックアウトコマンド
function executeCheckout(eventStore: DomainEvent[]): void {
  const currentState = replayEvents(eventStore);
  const cart = currentState.cart;

  if (cart.length === 0) {
    const reason = "カートが空です。";
    eventStore.push({ type: 'CheckoutFailed', reason });
    console.log(`エラー: ${reason}`);
    return;
  }

  console.log("\n--- レシート (Receipt) ---");
  let subtotal = 0;
  for (const item of cart) {
    const lineTotal = item.price * item.qty;
    console.log(`・${item.name} (${item.price}円) x ${item.qty} = ${lineTotal}円`);
    subtotal += lineTotal;
  }

  const discount = subtotal >= 3000 ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - discount;

  console.log(`割引前合計: ${subtotal}円`);
  console.log(`割引額: -${discount}円`);
  console.log(`支払合計: ${total}円`);
  console.log("-------------------------\n");

  // チェックアウト成功イベントを記録（スナップショット的にカートアイテムも含める）
  eventStore.push({
    type: 'CheckoutCommitted',
    subtotal,
    discount,
    total,
    items: [...cart]
  });
}

// ==========================================
// メイン制御ルーチン (エントリーポイント)
// ==========================================
function runShoppingSimulation(): void {
  // アプリケーションのすべての真実は、このイベントストアのみに保存される
  const eventStore: DomainEvent[] = [];

  // 1. 商品一覧の表示
  printCatalog(eventStore);

  // 2. 正常な追加: マウスを 1個追加
  executeAddToCart(eventStore, 'PRD-02', 1);

  // 3. 在庫切れの追加試行: キーボードを 1個追加
  executeAddToCart(eventStore, 'PRD-03', 1);

  // 4. 在庫超えの追加試行: ノートPCを 3個追加
  executeAddToCart(eventStore, 'PRD-01', 3);

  // 5. 正常な追加: ノートPCを 1個追加
  executeAddToCart(eventStore, 'PRD-01', 1);

  // 6. カートの確認とチェックアウト
  executeCheckout(eventStore);

  // 7. 事後の在庫確認
  printCatalog(eventStore);
}

// 実行
runShoppingSimulation();
