// ==========================================
// Style 44: Tail-Recursive (末尾再帰・トランポリン)
// ==========================================
// 【制約】
// 1. すべてのループ構文（for, whileなど）の使用を禁止する。
// 2. 配列のループ処理用メソッド（map, filter, reduce, forEach, findなど）の使用も禁止する。
// 3. すべての繰り返し処理は、末尾位置（Tail Position）での自己再帰または相互再帰のみで実装する。
// 4. JS/TSでの深い再帰によるスタックオーバーフローを避けるため、自作の「トランポリン (Trampoline)」エンジンを用いて処理を平坦化（bounce）して実行する。

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

// ==========================================
// トランポリン（Trampoline）の実装
// ※ライブラリ層。ランタイムスタックを消費せずに関数をループで回す仕組み。
// ==========================================
type Step<T> = T | (() => Step<T>);

function bounce<T>(step: Step<T>): T {
  let current = step;
  while (typeof current === 'function') {
    current = (current as () => Step<T>)();
  }
  return current as T;
}

// ==========================================
// 再帰的・ヘルパー関数 (末尾再帰)
// ==========================================

// 配列からIDで要素を検索する (findの代替)
function findByIdRec<T extends { id: string }>(
  arr: T[],
  id: string,
  index: number = 0
): Step<T | null> {
  if (index >= arr.length) return null;
  if (arr[index].id === id) return arr[index];
  return () => findByIdRec(arr, id, index + 1);
}

// カタログの各商品を1行ずつ表示する (forEachの代替)
function printCatalogLinesRec(
  products: Product[],
  index: number = 0
): Step<void> {
  if (index >= products.length) return;
  const p = products[index];
  console.log(`[${p.id}] ${p.name} / 価格: ${p.price}円 / 在庫: ${p.stock}個`);
  return () => printCatalogLinesRec(products, index + 1);
}

// カートにアイテムを上書き・または追加する
function updateCartItemsRec(
  cart: CartItem[],
  newItem: CartItem,
  index: number = 0,
  updated: boolean = false
): Step<CartItem[]> {
  // カートの終端に達した場合、未更新なら新規追加して完了
  if (index >= cart.length) {
    if (!updated) {
      return [...cart, newItem];
    }
    return cart;
  }

  // 既に同じIDが存在する場合は数量を加算
  if (cart[index].id === newItem.id) {
    const updatedItem = { ...cart[index], qty: cart[index].qty + newItem.qty };
    const newCart = [...cart];
    newCart[index] = updatedItem;
    return () => updateCartItemsRec(newCart, newItem, index + 1, true);
  }

  return () => updateCartItemsRec(cart, newItem, index + 1, updated);
}

// チェックアウト時の各カートアイテムの小計計算とレシート出力、および在庫減算 (reduceの代替)
function processCheckoutItemsRec(
  products: Product[],
  cart: CartItem[],
  index: number = 0,
  subtotal: number = 0
): Step<number> {
  if (index >= cart.length) return subtotal;

  const item = cart[index];
  const lineTotal = item.price * item.qty;
  console.log(`・${item.name} (${item.price}円) x ${item.qty} = ${lineTotal}円`);

  // 対応する商品の在庫を減算
  const product = bounce(findByIdRec(products, item.id));
  if (product) {
    product.stock -= item.qty;
  }

  return () => processCheckoutItemsRec(products, cart, index + 1, subtotal + lineTotal);
}

// ==========================================
// ビジネスロジック (エントリーポイントから呼ばれる手続き)
// ==========================================

function printCatalog(products: Product[]): void {
  console.log("=== 商品カタログ ===");
  bounce(printCatalogLinesRec(products));
  console.log("===================\n");
}

function addToCart(
  products: Product[],
  cart: CartItem[],
  targetId: string,
  qty: number
): CartItem[] {
  const product = bounce(findByIdRec(products, targetId));
  if (!product) {
    console.log(`エラー: 商品 ${targetId} が見つかりません。`);
    return cart;
  }

  const cartItem = bounce(findByIdRec(cart, targetId));
  const currentInCart = cartItem ? cartItem.qty : 0;

  if (product.stock === 0) {
    console.log(`エラー: ${product.name} は在庫切れです。`);
    return cart;
  }

  if (product.stock < currentInCart + qty) {
    console.log(`エラー: ${product.name} の在庫が不足しています（要求: ${qty}個, カート内: ${currentInCart}個, 在庫: ${product.stock}個）。`);
    return cart;
  }

  const newCart = bounce(updateCartItemsRec(cart, { id: targetId, name: product.name, price: product.price, qty }));
  console.log(`[OK] カートに追加しました: ${product.name} x ${qty}`);
  return newCart;
}

function checkout(products: Product[], cart: CartItem[]): CartItem[] {
  if (cart.length === 0) {
    console.log("エラー: カートが空です。");
    return cart;
  }

  console.log("\n--- レシート (Receipt) ---");
  const subtotal = bounce(processCheckoutItemsRec(products, cart));

  const discount = subtotal >= 3000 ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - discount;

  console.log(`割引前合計: ${subtotal}円`);
  console.log(`割引額: -${discount}円`);
  console.log(`支払合計: ${total}円`);
  console.log("-------------------------\n");

  return []; // カートをクリア
}

// ==========================================
// メイン制御ルーチン (エントリーポイント)
// ==========================================
function runShoppingSimulation(): void {
  const catalog: Product[] = [
    { id: 'PRD-01', name: 'ノートPC', price: 100000, stock: 2 },
    { id: 'PRD-02', name: 'マウス', price: 3000, stock: 5 },
    { id: 'PRD-03', name: 'キーボード', price: 5000, stock: 0 }
  ];
  let cart: CartItem[] = [];

  // 1. 商品一覧の表示
  printCatalog(catalog);

  // 2. 正常な追加: マウスを 1個追加
  cart = addToCart(catalog, cart, 'PRD-02', 1);

  // 3. 在庫切れの追加試行: キーボードを 1個追加
  cart = addToCart(catalog, cart, 'PRD-03', 1);

  // 4. 在庫超えの追加試行: ノートPCを 3個追加
  cart = addToCart(catalog, cart, 'PRD-01', 3);

  // 5. 正常な追加: ノートPCを 1個追加
  cart = addToCart(catalog, cart, 'PRD-01', 1);

  // 6. カートの確認とチェックアウト
  cart = checkout(catalog, cart);

  // 7. 事後の在庫確認
  printCatalog(catalog);
}

// 実行
runShoppingSimulation();
