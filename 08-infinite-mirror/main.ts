// ==========================================
// Style 08: Infinite Mirror (無限の鏡 - 再帰)
// ==========================================
// 【制約】
// 1. ループ構造 (for, while) を一切使用しない。
// 2. すべての反復処理（リストの走査、検索、集計）を「再帰 (Recursion)」で表現する。

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
// 再帰によるイテレーションと処理の定義
// ==========================================

// 1. カタログ表示の再帰
function printCatalogRecursive(products: Product[], index: number): void {
  // ベースケース: 配列の末尾に達したら終了
  if (index >= products.length) {
    return;
  }
  const item = products[index];
  console.log(`[${item.id}] ${item.name} / 価格: ${item.price}円 / 在庫: ${item.stock}個`);
  // 再帰呼び出し: インデックスを進める
  printCatalogRecursive(products, index + 1);
}

function printCatalog(products: Product[]): void {
  console.log("=== 商品カタログ ===");
  printCatalogRecursive(products, 0);
  console.log("===================\n");
}

// 2. 商品検索の再帰
function findProductRecursive(products: Product[], targetId: string, index: number): Product | null {
  if (index >= products.length) {
    return null; // 見つからなかった
  }
  if (products[index].id === targetId) {
    return products[index];
  }
  return findProductRecursive(products, targetId, index + 1);
}

// 3. カート内検索の再帰
function findCartItemRecursive(cart: CartItem[], targetId: string, index: number): CartItem | null {
  if (index >= cart.length) {
    return null;
  }
  if (cart[index].id === targetId) {
    return cart[index];
  }
  return findCartItemRecursive(cart, targetId, index + 1);
}

// 4. カートへの追加手続き (内部で再帰検索を使用)
function addToCart(products: Product[], cart: CartItem[], targetId: string, qty: number): string | null {
  const product = findProductRecursive(products, targetId, 0);
  if (!product) {
    return `エラー: 商品 ${targetId} が見つかりません。`;
  }

  const cartItem = findCartItemRecursive(cart, targetId, 0);
  const currentInCart = cartItem ? cartItem.qty : 0;

  if (product.stock === 0) {
    return `エラー: ${product.name} は在庫切れです。`;
  }
  if (product.stock < currentInCart + qty) {
    return `エラー: ${product.name} の在庫が不足しています（要求: ${qty}個, カート内: ${currentInCart}個, 在庫: ${product.stock}個）。`;
  }

  if (cartItem) {
    // 参照による更新
    (cartItem as any).qty += qty;
  } else {
    cart.push({ id: targetId, name: product.name, price: product.price, qty: qty });
  }

  console.log(`[OK] カートに追加しました: ${product.name} x ${qty}`);
  return null;
}

// 5. チェックアウト明細出力と在庫減算の再帰
function checkoutItemsRecursive(products: Product[], cart: CartItem[], index: number): number {
  if (index >= cart.length) {
    return 0; // ベースケース: 累計金額 0
  }
  const item = cart[index];
  const lineTotal = item.price * item.qty;
  console.log(`・${item.name} (${item.price}円) x ${item.qty} = ${lineTotal}円`);

  // 実在庫の減算 (カタログ再帰検索を行って減算)
  const product = findProductRecursive(products, item.id, 0);
  if (product) {
    (product as any).stock -= item.qty;
  }

  // 再帰呼び出し: 次のアイテムの金額を加算
  return lineTotal + checkoutItemsRecursive(products, cart, index + 1);
}

function checkout(products: Product[], cart: CartItem[]): void {
  if (cart.length === 0) {
    console.log("エラー: カートが空です。");
    return;
  }

  console.log("\n--- レシート (Receipt) ---");
  // 再帰により明細出力と小計合計を同時に行う
  const subtotal = checkoutItemsRecursive(products, cart, 0);

  // 割引計算 (3000円以上で10%OFF)
  const discount = subtotal >= 3000 ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - discount;

  console.log(`割引前合計: ${subtotal}円`);
  console.log(`割引額: -${discount}円`);
  console.log(`支払合計: ${total}円`);
  console.log("-------------------------\n");

  cart.length = 0; // カートクリア
}

// ==========================================
// テストストーリーの実行
// ==========================================
function runShoppingSimulation(): void {
  const catalog: Product[] = [
    { id: 'PRD-01', name: 'ノートPC', price: 100000, stock: 2 },
    { id: 'PRD-02', name: 'マウス', price: 3000, stock: 5 },
    { id: 'PRD-03', name: 'キーボード', price: 5000, stock: 0 }
  ];
  const cart: CartItem[] = [];

  printCatalog(catalog);

  let err = addToCart(catalog, cart, 'PRD-02', 1);
  if (err) console.log(err);

  err = addToCart(catalog, cart, 'PRD-03', 1);
  if (err) console.log(err);

  err = addToCart(catalog, cart, 'PRD-01', 3);
  if (err) console.log(err);

  err = addToCart(catalog, cart, 'PRD-01', 1);
  if (err) console.log(err);

  checkout(catalog, cart);

  printCatalog(catalog);
}

runShoppingSimulation();
