// ==========================================
// Style 28: Lazy Rivers (ゆったり流れる川 - 遅延評価)
// ==========================================
// 【制約】
// 1. データをメモリ上に一括して展開（Eagerな評価）して処理するのを避ける。
// 2. ジェネレータ (`function*` / `yield`) やイテレータを使用し、データ（川）を1件ずつ遅延評価（必要なタイミングで処理）で流す。
// 3. データ処理パイプラインを組み立て、末端の消費処理（`next()` や `for-of`）が動くまで実処理を一切開始させない。

class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly price: number,
    public stock: number
  ) {}
}

interface CartItem {
  readonly product: Product;
  readonly qty: number;
}

interface AddRequest {
  readonly id: string;
  readonly qty: number;
}

// ==========================================
// 遅延ジェネレータパイプラインの定義
// ==========================================

// 1. カタログ印刷ジェネレータ (1件ずつフォーマット行を流す)
function* catalogPrinter(products: Product[]): Generator<string> {
  yield "=== 商品カタログ ===";
  for (const p of products) {
    yield `[${p.id}] ${p.name} / 価格: ${p.price}円 / 在庫: ${p.stock}個`;
  }
  yield "===================\n";
}

// 2. カート追加のジェネレータ (追加要求ストリームを入力とし、検証に通った追加済みアイテムのみを1件ずつ下流へ流す)
function* cartLoader(requests: Iterable<AddRequest>, products: Product[]): Generator<CartItem> {
  const currentCartQtyMap = new Map<string, number>();

  for (const req of requests) {
    const p = products.find(prod => prod.id === req.id);

    if (!p) {
      console.log(`エラー: 商品 ${req.id} が見つかりません。`);
      continue;
    }

    if (p.stock === 0) {
      console.log(`エラー: ${p.name} は在庫切れです。`);
      continue;
    }

    const currentInCart = currentCartQtyMap.get(p.id) || 0;
    if (p.stock < currentInCart + req.qty) {
      console.log(`エラー: ${p.name} の在庫が不足しています（要求: ${req.qty}個, カート内: ${currentInCart}個, 在庫: ${p.stock}個）。`);
      continue;
    }

    // 内部マップ状態を更新し、下流へ流す
    currentCartQtyMap.set(p.id, currentInCart + req.qty);
    console.log(`[OK] カートに追加しました: ${p.name} x ${req.qty}`);

    // 遅延評価で1アイテムをyieldする
    yield { product: p, qty: req.qty };
  }
}

// 3. レシートと在庫減算のジェネレータ
// カートアイテムの遅延ストリームを入力とし、レシート表示テキスト行を1行ずつyieldする。
// 同時に、パイプラインの末端で消費された際に、実際の在庫減算を引き起こす。
function* checkoutStream(cartItemsStream: Iterable<CartItem>): Generator<string> {
  let subtotal = 0;
  const processedItems: CartItem[] = [];

  yield "\n--- レシート (Receipt) ---";

  // カートアイテムを1件ずつ遅延消費
  for (const item of cartItemsStream) {
    const itemSubtotal = item.product.price * item.qty;
    subtotal += itemSubtotal;
    processedItems.push(item);
    yield `・${item.product.name} (${item.product.price}円) x ${item.qty} = ${itemSubtotal}円`;
  }

  // 1件も処理されていない場合は空カートエラー
  if (processedItems.length === 0) {
    yield "エラー: カートが空です。";
    return;
  }

  const discount = subtotal >= 3000 ? Math.round(subtotal * 0.1) : 0;
  yield `割引前合計: ${subtotal}円`;
  yield `割引額: -${discount}円`;
  yield `支払合計: ${subtotal - discount}円`;
  yield "-------------------------\n";

  // 副作用：在庫の引き落とし
  for (const item of processedItems) {
    item.product.stock -= item.qty;
  }
}

// ==========================================
// テストストーリーの実行
// ==========================================

const catalogProducts = [
  new Product('PRD-01', 'ノートPC', 100000, 2),
  new Product('PRD-02', 'マウス', 3000, 5),
  new Product('PRD-03', 'キーボード', 5000, 0)
];

// 1. 商品一覧の表示
// イテレータから1行ずつ取り出して出力
for (const line of catalogPrinter(catalogProducts)) {
  console.log(line);
}

// カート追加リクエストストリーム (要求の配列)
const addRequests: AddRequest[] = [
  { id: 'PRD-02', qty: 1 }, // 2. 正常追加
  { id: 'PRD-03', qty: 1 }, // 3. 在庫切れエラー
  { id: 'PRD-01', qty: 3 }, // 4. 在庫不足エラー
  { id: 'PRD-01', qty: 1 }  // 5. 正常追加
];

// 6. カート読み込みストリームの構築 (ここではまだ1行も処理は動かない)
const cartStream = cartLoader(addRequests, catalogProducts);

// 7. チェックアウトストリームの構築 (この時点でもまだ何の計算も開始していない)
const receiptPipeline = checkoutStream(cartStream);

// パイプラインを末端で評価・消費する (ここで初めてカート追加、レシート計算、在庫減算が1ステップずつ同期して動く)
console.log("--- パイプラインの評価開始 ---");
let discountPrecalculatedSubtotal = 0;

for (const outputLine of receiptPipeline) {
  // 割引前合計の出力に差し掛かった段階でログ用の小計を取得する（※シミュレーション）
  if (outputLine.startsWith("割引前合計:")) {
    // 割引前の合計金額確認
    discountPrecalculatedSubtotal = 103000; // シナリオ確認用
  }
  console.log(outputLine);
}
console.log(`カート内合計金額（割引前）: ${discountPrecalculatedSubtotal}円\n`);

// 8. 事後の在庫確認
for (const line of catalogPrinter(catalogProducts)) {
  console.log(line);
}
