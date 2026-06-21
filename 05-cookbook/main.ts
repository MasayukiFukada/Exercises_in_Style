// ==========================================
// Style 05: Cookbook (クックブック)
// ==========================================
// 【制約】
// 1. 巨大な処理を、単一の明確な関心事を持つ「手続き (サブルーチン)」に適切に分割する。
// 2. 手続き間のデータのやり取りは、引数と戻り値を利用して明示的に行う。
// 3. 状態の共有（グローバル変数）を最小限に抑え、手続きが必要な状態は引数として引き回す。
// 4. 最も基本的かつ標準的な「手続き型プログラミング」スタイル。

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
// 手続き (関数) の定義
// ==========================================

// 1. 商品カタログの出力
function printCatalog(products: Product[]): void {
  console.log("=== 商品カタログ ===");
  for (const item of products) {
    console.log(`[${item.id}] ${item.name} / 価格: ${item.price}円 / 在庫: ${item.stock}個`);
  }
  console.log("===================\n");
}

// 2. カートへの商品追加
// 戻り値: エラーがある場合はエラーメッセージ文字列、正常終了時は null
function addToCart(
  products: Product[],
  currentCart: CartItem[],
  targetId: string,
  qty: number
): string | null {
  // 商品カタログから対象商品を検索
  const product = products.find(p => p.id === targetId);
  if (!product) {
    return `エラー: 商品 ${targetId} が見つかりません。`;
  }

  // カート内の現在の追加数を集計
  const cartItem = currentCart.find(item => item.id === targetId);
  const currentInCart = cartItem ? cartItem.qty : 0;

  // 在庫のチェック
  if (product.stock === 0) {
    return `エラー: ${product.name} は在庫切れです。`;
  }
  if (product.stock < currentInCart + qty) {
    return `エラー: ${product.name} の在庫が不足しています（要求: ${qty}個, カート内: ${currentInCart}個, 在庫: ${product.stock}個）。`;
  }

  // カート情報の更新
  if (cartItem) {
    cartItem.qty += qty;
  } else {
    currentCart.push({ id: targetId, name: product.name, price: product.price, qty: qty });
  }

  console.log(`[OK] カートに追加しました: ${product.name} x ${qty}`);
  return null;
}

// 3. チェックアウトとレシート出力
function checkout(products: Product[], currentCart: CartItem[]): void {
  if (currentCart.length === 0) {
    console.log("エラー: カートが空です。");
    return;
  }

  console.log("\n--- レシート (Receipt) ---");
  let subtotal = 0;

  // 各カート商品の小計出力と実在庫減算
  for (const item of currentCart) {
    const lineTotal = item.price * item.qty;
    console.log(`・${item.name} (${item.price}円) x ${item.qty} = ${lineTotal}円`);
    subtotal += lineTotal;

    // 在庫の減算処理
    const product = products.find(p => p.id === item.id);
    if (product) {
      product.stock -= item.qty;
    }
  }

  // 割引計算 (3000円以上で10%OFF)
  const discount = subtotal >= 3000 ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - discount;

  console.log(`割引前合計: ${subtotal}円`);
  console.log(`割引額: -${discount}円`);
  console.log(`支払合計: ${total}円`);
  console.log("-------------------------\n");

  // カートのクリア
  currentCart.length = 0;
}


// ==========================================
// メイン制御ルーチン (エントリーポイント)
// ==========================================
function runShoppingSimulation(): void {
  // 状態データ (関数内に閉じ込められた状態)
  const catalog: Product[] = [
    { id: 'PRD-01', name: 'ノートPC', price: 100000, stock: 2 },
    { id: 'PRD-02', name: 'マウス', price: 3000, stock: 5 },
    { id: 'PRD-03', name: 'キーボード', price: 5000, stock: 0 }
  ];
  const cart: CartItem[] = [];

  // 1. 商品一覧の表示
  printCatalog(catalog);

  // 2. 正常な追加: マウスを 1個追加
  let err = addToCart(catalog, cart, 'PRD-02', 1);
  if (err) console.log(err);

  // 3. 在庫切れの追加試行: キーボードを 1個追加
  err = addToCart(catalog, cart, 'PRD-03', 1);
  if (err) console.log(err);

  // 4. 在庫超えの追加試行: ノートPCを 3個追加
  err = addToCart(catalog, cart, 'PRD-01', 3);
  if (err) console.log(err);

  // 5. 正常な追加: ノートPCを 1個追加
  err = addToCart(catalog, cart, 'PRD-01', 1);
  if (err) console.log(err);

  // 6. カートの確認とチェックアウト
  checkout(catalog, cart);

  // 7. 事後の在庫確認
  printCatalog(catalog);
}

// 実行
runShoppingSimulation();
