// ==========================================
// Style 02: Go Forth (前へ進め - スタック指向)
// ==========================================
// 【制約】
// 1. グローバルな「データスタック」を介してすべての値を受け渡しする。
// 2. 関数（ワード）は引数を取らず、スタックから POP して処理し、結果を PUSH する。
// 3. 状態は「ヒープ（グローバル辞書）」に保持する。
// 4. 処理フローはスタック操作とワード呼び出しの連鎖（後置記法風）で構築する。

// --- データスタック ---
const stack: any[] = [];

// --- ヒープ (グローバルメモリ) ---
const heap: { [key: string]: any } = {};

// --- スタック基本操作ワード ---
function push(val: any): void {
  stack.push(val);
}

function pop(): any {
  if (stack.length === 0) {
    throw new Error("Stack underflow");
  }
  return stack.pop();
}

// ==========================================
// データの初期設定 (ヒープへの格納)
// ==========================================
heap['catalog'] = [
  { id: 'PRD-01', name: 'ノートPC', price: 100000, stock: 2 },
  { id: 'PRD-02', name: 'マウス', price: 3000, stock: 5 },
  { id: 'PRD-03', name: 'キーボード', price: 5000, stock: 0 }
];
heap['cart'] = []; // 空のカート
heap['error'] = ''; // エラーメッセージ領域

// ==========================================
// ワード (サブルーチン) の定義
// ==========================================

// 1. カタログ表示ワード (スタック不変)
function print_catalog_word(): void {
  console.log("=== 商品カタログ ===");
  const catalog = heap['catalog'];
  for (const item of catalog) {
    console.log(`[${item.id}] ${item.name} / 価格: ${item.price}円 / 在庫: ${item.stock}個`);
  }
  console.log("===================\n");
}

// 2. カート追加ワード (スタック: [ ..., ID, 数量 ] -> [ ..., 成功フラグ ])
function add_to_cart_word(): void {
  const qty = pop(); // 数量をポップ
  const id = pop();  // 商品IDをポップ
  const catalog = heap['catalog'];
  const cart = heap['cart'];

  // 商品の検索
  let product = null;
  for (const item of catalog) {
    if (item.id === id) {
      product = item;
      break;
    }
  }

  if (!product) {
    heap['error'] = `エラー: 商品 ${id} が見つかりません。`;
    push(false); // 失敗フラグをプッシュ
    return;
  }

  // すでにカートにある数量を数える（在庫超過チェック用）
  let currentInCart = 0;
  for (const cartItem of cart) {
    if (cartItem.id === id) {
      currentInCart = cartItem.qty;
      break;
    }
  }

  // 在庫チェック
  if (product.stock === 0) {
    heap['error'] = `エラー: ${product.name} は在庫切れです。`;
    push(false);
    return;
  }
  if (product.stock < currentInCart + qty) {
    heap['error'] = `エラー: ${product.name} の在庫が不足しています（要求: ${qty}個, カート内: ${currentInCart}個, 在庫: ${product.stock}個）。`;
    push(false);
    return;
  }

  // カートの更新
  let exists = false;
  for (const cartItem of cart) {
    if (cartItem.id === id) {
      cartItem.qty += qty;
      exists = true;
      break;
    }
  }
  if (!exists) {
    cart.push({ id: id, name: product.name, price: product.price, qty: qty });
  }

  heap['error'] = ''; // エラーなし
  push(true); // 成功フラグをプッシュ
}

// 3. チェックアウトワード (スタック不変)
function checkout_word(): void {
  const cart = heap['cart'];
  const catalog = heap['catalog'];

  if (cart.length === 0) {
    console.log("エラー: カートが空です。");
    return;
  }

  console.log("\n--- レシート (Receipt) ---");
  let subtotal = 0;

  for (const cartItem of cart) {
    const lineTotal = cartItem.price * cartItem.qty;
    console.log(`・${cartItem.name} (${cartItem.price}円) x ${cartItem.qty} = ${lineTotal}円`);
    subtotal += lineTotal;

    // 実在庫の減算
    for (const prod of catalog) {
      if (prod.id === cartItem.id) {
        prod.stock -= cartItem.qty;
        break;
      }
    }
  }

  // 割引計算 (3000円以上で10%OFF)
  let discount = 0;
  if (subtotal >= 3000) {
    discount = Math.round(subtotal * 0.1);
  }

  console.log(`割引前合計: ${subtotal}円`);
  console.log(`割引額: -${discount}円`);
  console.log(`支払合計: ${subtotal - discount}円`);
  console.log("-------------------------\n");

  heap['cart'] = []; // カートをクリア
}

// 4. エラー検証と出力用ヘルパーワード (スタック: [ ..., 成功フラグ ] -> [ ... ])
function verify_result_word(): void {
  const success = pop();
  if (!success) {
    console.log(heap['error']);
  }
}


// ==========================================
// テストストーリーの実行 (後置記法/スタックによる制御)
// ==========================================

// 1. 商品一覧の表示
print_catalog_word();

// 2. マウスを1個追加: ["PRD-02", 1] -> add_to_cart -> verify
push('PRD-02');
push(1);
add_to_cart_word();
verify_result_word();

// 3. キーボードを1個追加: ["PRD-03", 1] -> add_to_cart -> verify
push('PRD-03');
push(1);
add_to_cart_word();
verify_result_word();

// 4. ノートPCを3個追加: ["PRD-01", 3] -> add_to_cart -> verify
push('PRD-01');
push(3);
add_to_cart_word();
verify_result_word();

// 5. ノートPCを1個追加: ["PRD-01", 1] -> add_to_cart -> verify
push('PRD-01');
push(1);
add_to_cart_word();
verify_result_word();

// 6. チェックアウト
checkout_word();

// 7. 事後の在庫確認
print_catalog_word();
