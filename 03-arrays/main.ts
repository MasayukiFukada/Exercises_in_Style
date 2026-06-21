// ==========================================
// Style 03: Arrays (配列)
// ==========================================
// 【制約】
// 1. データをオブジェクトではなく、配列（列単位のフラットな配列：カラムナ指向）で保持する。
// 2. 命令的な要素ごとのループ処理（for, while）を極力避け、配列関数（map, filter, reduce, forEach）を主軸とする。
// 3. データ処理を配列の射影（マッピング）と縮約（リダクション）の連鎖として表現する。

// --- 商品カタログ (列指向/カラムナ・データ構造) ---
const productIds = ['PRD-01', 'PRD-02', 'PRD-03'];
const productNames = ['ノートPC', 'マウス', 'キーボード'];
const productPrices = [100000, 3000, 5000];
const productStocks = [2, 5, 0];

// --- ショッピングカート ---
const cartProductIds: string[] = [];
const cartQuantities: number[] = [];

// ==========================================
// 関数（データ変換プロセス）の定義
// ==========================================

// 1. 商品カタログの出力 (配列のイテレーション)
function print_catalog(): void {
  console.log("=== 商品カタログ ===");
  productIds.forEach((id, index) => {
    console.log(`[${id}] ${productNames[index]} / 価格: ${productPrices[index]}円 / 在庫: ${productStocks[index]}個`);
  });
  console.log("===================\n");
}

// 2. カートへの追加 (配列操作と検索)
// 戻り値: エラーメッセージ (正常時は null)
function add_to_cart(targetId: string, qty: number): string | null {
  const prodIndex = productIds.indexOf(targetId);

  // カタログ存在チェック
  if (prodIndex === -1) {
    return `エラー: 商品 ${targetId} が見つかりません。`;
  }

  // カート内の現在の追加数を取得 (indexOf で探す)
  const cartIndex = cartProductIds.indexOf(targetId);
  const currentInCart = cartIndex !== -1 ? cartQuantities[cartIndex] : 0;

  // 在庫チェック
  if (productStocks[prodIndex] === 0) {
    return `エラー: ${productNames[prodIndex]} は在庫切れです。`;
  }
  if (productStocks[prodIndex] < currentInCart + qty) {
    return `エラー: ${productNames[prodIndex]} の在庫が不足しています（要求: ${qty}個, カート内: ${currentInCart}個, 在庫: ${productStocks[prodIndex]}個）。`;
  }

  // カートの更新
  if (cartIndex !== -1) {
    cartQuantities[cartIndex] += qty;
  } else {
    cartProductIds.push(targetId);
    cartQuantities.push(qty);
  }

  console.log(`[OK] カートに追加しました: ${productNames[prodIndex]} x ${qty}`);
  return null;
}

// 3. チェックアウト (配列の map / reduce による集計と変換)
function checkout(): void {
  if (cartProductIds.length === 0) {
    console.log("エラー: カートが空です。");
    return;
  }

  console.log("\n--- レシート (Receipt) ---");

  // カート明細情報の射影 (map)
  const receiptLines = cartProductIds.map((id, index) => {
    const prodIndex = productIds.indexOf(id);
    const qty = cartQuantities[index];
    const price = productPrices[prodIndex];
    const name = productNames[prodIndex];
    const subtotal = price * qty;

    // 実在庫の減算 (配列の要素直接変更)
    productStocks[prodIndex] -= qty;

    return { name, price, qty, subtotal };
  });

  // レシート明細の出力
  receiptLines.forEach(line => {
    console.log(`・${line.name} (${line.price}円) x ${line.qty} = ${line.subtotal}円`);
  });

  // 合計金額の縮約 (reduce)
  const totalBeforeDiscount = receiptLines.reduce((acc, line) => acc + line.subtotal, 0);

  // 割引計算 (3000円以上で10%OFF)
  const discount = totalBeforeDiscount >= 3000 ? Math.round(totalBeforeDiscount * 0.1) : 0;
  const payTotal = totalBeforeDiscount - discount;

  console.log(`割引前合計: ${totalBeforeDiscount}円`);
  console.log(`割引額: -${discount}円`);
  console.log(`支払合計: ${payTotal}円`);
  console.log("-------------------------\n");

  // カートのクリア (配列をクリア)
  cartProductIds.length = 0;
  cartQuantities.length = 0;
}

// ==========================================
// テストストーリーの実行
// ==========================================

// 1. 商品一覧の表示
print_catalog();

// 2. 正常な追加: マウスを 1個追加
let err = add_to_cart('PRD-02', 1);
if (err) console.log(err);

// 3. 在庫切れの追加試行: キーボードを 1個追加
err = add_to_cart('PRD-03', 1);
if (err) console.log(err);

// 4. 在庫超えの追加試行: ノートPCを 3個追加
err = add_to_cart('PRD-01', 3);
if (err) console.log(err);

// 5. 正常な追加: ノートPCを 1個追加
err = add_to_cart('PRD-01', 1);
if (err) console.log(err);

// 6. カートの確認とチェックアウト
checkout();

// 7. 事後の在庫確認
print_catalog();
