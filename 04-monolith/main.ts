// ==========================================
// Style 04: Monolith (モノリス)
// ==========================================
// 【制約】
// 1. 名前付き関数の定義の禁止 (手続きの分割を行わない)。
// 2. プログラム全体が1つの巨大なシーケンシャルなコードブロックとして構成される。
// 3. 共通ロジックの再利用はインライン展開（コピー＆ペースト）やコントロールフローによって表現する。

// --- カタログデータの初期化 (グローバル状態) ---
const catalog = [
  { id: 'PRD-01', name: 'ノートPC', price: 100000, stock: 2 },
  { id: 'PRD-02', name: 'マウス', price: 3000, stock: 5 },
  { id: 'PRD-03', name: 'キーボード', price: 5000, stock: 0 }
];

// --- カートの初期化 ---
const cart: { id: string, name: string, price: number, qty: number }[] = [];

// ==========================================
// テストストーリーの実行 (シーケンシャル処理)
// ==========================================

// ------------------------------------------
// 1. 商品カタログの表示
// ------------------------------------------
console.log("=== 商品カタログ ===");
for (const item of catalog) {
  console.log(`[${item.id}] ${item.name} / 価格: ${item.price}円 / 在庫: ${item.stock}個`);
}
console.log("===================\n");


// ------------------------------------------
// 2. 正常な追加: マウスを 1個追加
// ------------------------------------------
{
  const targetId = 'PRD-02';
  const qty = 1;

  // カタログから検索 (インライン展開)
  let product = null;
  for (const item of catalog) {
    if (item.id === targetId) {
      product = item;
      break;
    }
  }

  if (product === null) {
    console.log(`エラー: 商品 ${targetId} が見つかりません。`);
  } else {
    // 現在のカート内数量の計算 (インライン展開)
    let currentInCart = 0;
    for (const cartItem of cart) {
      if (cartItem.id === targetId) {
        currentInCart = cartItem.qty;
        break;
      }
    }

    // 在庫チェック
    if (product.stock === 0) {
      console.log(`エラー: ${product.name} は在庫切れです。`);
    } else if (product.stock < currentInCart + qty) {
      console.log(`エラー: ${product.name} の在庫が不足しています（要求: ${qty}個, カート内: ${currentInCart}個, 在庫: ${product.stock}個）。`);
    } else {
      // カートの更新 (インライン展開)
      let exists = false;
      for (const cartItem of cart) {
        if (cartItem.id === targetId) {
          cartItem.qty += qty;
          exists = true;
          break;
        }
      }
      if (!exists) {
        cart.push({ id: targetId, name: product.name, price: product.price, qty: qty });
      }
      console.log(`[OK] カートに追加しました: ${product.name} x ${qty}`);
    }
  }
}


// ------------------------------------------
// 3. 在庫切れの追加試行: キーボードを 1個追加
// ------------------------------------------
{
  const targetId = 'PRD-03';
  const qty = 1;

  // カタログから検索 (インライン展開)
  let product = null;
  for (const item of catalog) {
    if (item.id === targetId) {
      product = item;
      break;
    }
  }

  if (product === null) {
    console.log(`エラー: 商品 ${targetId} が見つかりません。`);
  } else {
    // 現在のカート内数量の計算 (インライン展開)
    let currentInCart = 0;
    for (const cartItem of cart) {
      if (cartItem.id === targetId) {
        currentInCart = cartItem.qty;
        break;
      }
    }

    // 在庫チェック
    if (product.stock === 0) {
      console.log(`エラー: ${product.name} は在庫切れです。`);
    } else if (product.stock < currentInCart + qty) {
      console.log(`エラー: ${product.name} の在庫が不足しています（要求: ${qty}個, カート内: ${currentInCart}個, 在庫: ${product.stock}個）。`);
    } else {
      // カートの更新 (インライン展開)
      let exists = false;
      for (const cartItem of cart) {
        if (cartItem.id === targetId) {
          cartItem.qty += qty;
          exists = true;
          break;
        }
      }
      if (!exists) {
        cart.push({ id: targetId, name: product.name, price: product.price, qty: qty });
      }
      console.log(`[OK] カートに追加しました: ${product.name} x ${qty}`);
    }
  }
}


// ------------------------------------------
// 4. 在庫超えの追加試行: ノートPCを 3個追加
// ------------------------------------------
{
  const targetId = 'PRD-01';
  const qty = 3;

  // カタログから検索 (インライン展開)
  let product = null;
  for (const item of catalog) {
    if (item.id === targetId) {
      product = item;
      break;
    }
  }

  if (product === null) {
    console.log(`エラー: 商品 ${targetId} が見つかりません。`);
  } else {
    // 現在のカート内数量の計算 (インライン展開)
    let currentInCart = 0;
    for (const cartItem of cart) {
      if (cartItem.id === targetId) {
        currentInCart = cartItem.qty;
        break;
      }
    }

    // 在庫チェック
    if (product.stock === 0) {
      console.log(`エラー: ${product.name} は在庫切れです。`);
    } else if (product.stock < currentInCart + qty) {
      console.log(`エラー: ${product.name} の在庫が不足しています（要求: ${qty}個, カート内: ${currentInCart}個, 在庫: ${product.stock}個）。`);
    } else {
      // カートの更新 (インライン展開)
      let exists = false;
      for (const cartItem of cart) {
        if (cartItem.id === targetId) {
          cartItem.qty += qty;
          exists = true;
          break;
        }
      }
      if (!exists) {
        cart.push({ id: targetId, name: product.name, price: product.price, qty: qty });
      }
      console.log(`[OK] カートに追加しました: ${product.name} x ${qty}`);
    }
  }
}


// ------------------------------------------
// 5. 正常な追加: ノートPCを 1個追加
// ------------------------------------------
{
  const targetId = 'PRD-01';
  const qty = 1;

  // カタログから検索 (インライン展開)
  let product = null;
  for (const item of catalog) {
    if (item.id === targetId) {
      product = item;
      break;
    }
  }

  if (product === null) {
    console.log(`エラー: 商品 ${targetId} が見つかりません。`);
  } else {
    // 現在のカート内数量の計算 (インライン展開)
    let currentInCart = 0;
    for (const cartItem of cart) {
      if (cartItem.id === targetId) {
        currentInCart = cartItem.qty;
        break;
      }
    }

    // 在庫チェック
    if (product.stock === 0) {
      console.log(`エラー: ${product.name} は在庫切れです。`);
    } else if (product.stock < currentInCart + qty) {
      console.log(`エラー: ${product.name} の在庫が不足しています（要求: ${qty}個, カート内: ${currentInCart}個, 在庫: ${product.stock}個）。`);
    } else {
      // カートの更新 (インライン展開)
      let exists = false;
      for (const cartItem of cart) {
        if (cartItem.id === targetId) {
          cartItem.qty += qty;
          exists = true;
          break;
        }
      }
      if (!exists) {
        cart.push({ id: targetId, name: product.name, price: product.price, qty: qty });
      }
      console.log(`[OK] カートに追加しました: ${product.name} x ${qty}`);
    }
  }
}


// ------------------------------------------
// 6. チェックアウトとレシート出力 (インライン)
// ------------------------------------------
{
  if (cart.length === 0) {
    console.log("エラー: カートが空です。");
  } else {
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

    // カートのクリア
    cart.length = 0;
  }
}


// ------------------------------------------
// 7. 事後の在庫確認
// ------------------------------------------
console.log("=== 商品カタログ ===");
for (const item of catalog) {
  console.log(`[${item.id}] ${item.name} / 価格: ${item.price}円 / 在庫: ${item.stock}個`);
}
console.log("===================\n");
