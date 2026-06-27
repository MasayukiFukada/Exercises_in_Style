// ==========================================
// Style 45: Logic Programming (論理・制約プログラミング)
// ==========================================
// 【制約】
// 1. 手続き的な制御フロー（ビジネスロジック層での if-else や命令的な状態書き換え）を排する。
// 2. すべての情報は「データベース (Knowledge Base)」に「事実 (Facts)」として登録する。
// 3. 計算や判定を行う際は、データベースに対して「クエリ (Query)」を実行し、登録された「事実」と「規則 (Rules)」の照合によって答えを導き出す（パターンマッチングと論理的推論のシミュレーション）。
// 4. カート追加やチェックアウトといった状態の変化は、事実の登録 (Assert) と削除 (Retract) によって表現する。

// --- 事実 (Fact) の型定義 ---
type Fact =
  | { relation: 'product'; id: string; name: string; price: number; stock: number }
  | { relation: 'cart'; id: string; qty: number };

// ==========================================
// データベース (Knowledge Base) の実装
// ==========================================
class KnowledgeBase {
  private facts: Fact[] = [];

  // 事実をアサート（登録）する
  assert(fact: Fact): void {
    this.facts.push(fact);
  }

  // 特定の条件を満たす事実をリトラクト（削除）する
  retract(relation: 'cart' | 'product', id: string): void {
    this.facts = this.facts.filter(f => !(f.relation === relation && f.id === id));
  }

  // クエリ: 特定のリレーションに合致するすべての事実を取得する
  query(relation: 'product' | 'cart'): Fact[] {
    return this.facts.filter(f => f.relation === relation);
  }

  // クエリ: 特定のIDを持つ単一の事実を取得する
  queryById(relation: 'product' | 'cart', id: string): Fact | undefined {
    return this.facts.find(f => f.relation === relation && f.id === id);
  }

  // カート関連の事実をすべてリトラクト（削除）する
  clearCart(): void {
    this.facts = this.facts.filter(f => f.relation !== 'cart');
  }
}

// ==========================================
// 論理規則 (Rules) とクエリの定義
// ==========================================

// カタログ表示
function printCatalog(kb: KnowledgeBase): void {
  const products = kb.query('product') as Extract<Fact, { relation: 'product' }>[];
  console.log("=== 商品カタログ ===");
  for (const p of products) {
    console.log(`[${p.id}] ${p.name} / 価格: ${p.price}円 / 在庫: ${p.stock}個`);
  }
  console.log("===================\n");
}

// カート追加可能ルール (Can Add to Cart Rule)
// 戻り値: { result: true } または { result: false, reason: string }
interface AddRuleResult {
  result: boolean;
  reason?: string;
  product?: Extract<Fact, { relation: 'product' }>;
}

function evaluateAddToCartRule(kb: KnowledgeBase, productId: string, qty: number): AddRuleResult {
  const product = kb.queryById('product', productId) as Extract<Fact, { relation: 'product' }> | undefined;
  
  // 1. 商品存在チェック
  if (!product) {
    return { result: false, reason: `商品 ${productId} が見つかりません。` };
  }

  // 2. カート内の現在の数をクエリ
  const cartItem = kb.queryById('cart', productId) as Extract<Fact, { relation: 'cart' }> | undefined;
  const currentInCart = cartItem ? cartItem.qty : 0;

  // 3. 在庫チェック
  if (product.stock === 0) {
    return { result: false, reason: `${product.name} は在庫切れです。` };
  }

  if (product.stock < currentInCart + qty) {
    return { 
      result: false, 
      reason: `${product.name} の在庫が不足しています（要求: ${qty}個, カート内: ${currentInCart}個, 在庫: ${product.stock}個）。` 
    };
  }

  // すべての条件を満たせば成功
  return { result: true, product };
}

// カート追加処理 (事実のアサート / リトラクトによる状態遷移)
function addToCart(kb: KnowledgeBase, productId: string, qty: number): void {
  const ruleEvaluation = evaluateAddToCartRule(kb, productId, qty);

  if (ruleEvaluation.result && ruleEvaluation.product) {
    const cartItem = kb.queryById('cart', productId) as Extract<Fact, { relation: 'cart' }> | undefined;
    const currentInCart = cartItem ? cartItem.qty : 0;

    // 古いカート事実をリトラクトし、数量を加算した新しい事実をアサート
    kb.retract('cart', productId);
    kb.assert({ relation: 'cart', id: productId, qty: currentInCart + qty });
    console.log(`[OK] カートに追加しました: ${ruleEvaluation.product.name} x ${qty}`);
  } else {
    console.log(`エラー: ${ruleEvaluation.reason}`);
  }
}

// 割引適用ルール (Discount Rule)
// 3000円以上で10%OFF
function evaluateDiscountRule(subtotal: number): number {
  return subtotal >= 3000 ? Math.round(subtotal * 0.1) : 0;
}

// チェックアウト処理 (論理結果の出力と在庫の更新)
function checkout(kb: KnowledgeBase): void {
  const cartItems = kb.query('cart') as Extract<Fact, { relation: 'cart' }>[];

  if (cartItems.length === 0) {
    console.log("エラー: カートが空です。");
    return;
  }

  console.log("\n--- レシート (Receipt) ---");
  let subtotal = 0;

  for (const item of cartItems) {
    const product = kb.queryById('product', item.id)! as Extract<Fact, { relation: 'product' }>;
    const lineTotal = product.price * item.qty;
    console.log(`・${product.name} (${product.price}円) x ${item.qty} = ${lineTotal}円`);
    subtotal += lineTotal;

    // 在庫を減算（古いproduct事実をリトラクトし、減算した事実を再アサート）
    kb.retract('product', product.id);
    kb.assert({
      relation: 'product',
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock - item.qty
    });
  }

  const discount = evaluateDiscountRule(subtotal);
  const total = subtotal - discount;

  console.log(`割引前合計: ${subtotal}円`);
  console.log(`割引額: -${discount}円`);
  console.log(`支払合計: ${total}円`);
  console.log("-------------------------\n");

  // カートの事実をすべて消去
  kb.clearCart();
}

// ==========================================
// メイン制御ルーチン (エントリーポイント)
// ==========================================
function runShoppingSimulation(): void {
  const kb = new KnowledgeBase();

  // 初期事実のアサート
  kb.assert({ relation: 'product', id: 'PRD-01', name: 'ノートPC', price: 100000, stock: 2 });
  kb.assert({ relation: 'product', id: 'PRD-02', name: 'マウス', price: 3000, stock: 5 });
  kb.assert({ relation: 'product', id: 'PRD-03', name: 'キーボード', price: 5000, stock: 0 });

  // 1. 商品一覧の表示
  printCatalog(kb);

  // 2. 正常な追加: マウスを 1個追加
  addToCart(kb, 'PRD-02', 1);

  // 3. 在庫切れの追加試行: キーボードを 1個追加
  addToCart(kb, 'PRD-03', 1);

  // 4. 在庫超えの追加試行: ノートPCを 3個追加
  addToCart(kb, 'PRD-01', 3);

  // 5. 正常な追加: ノートPCを 1個追加
  addToCart(kb, 'PRD-01', 1);

  // 6. カートの確認とチェックアウト
  checkout(kb);

  // 7. 事後の在庫確認
  printCatalog(kb);
}

// 実行
runShoppingSimulation();
