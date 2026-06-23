// ==========================================
// Style 30: Dataspaces (データスペース - タプルスペース)
// ==========================================
// 【制約】
// 1. 各スレッドやプロセスは、直接メッセージを別の相手へ送信することを禁止する。
// 2. すべてのデータおよび処理の依頼は、「タプル」と呼ばれるパターン化されたデータ構造として共有の「データスペース（TupleSpace）」に配置（`write`）される。
// 3. 各自律ワーカーは、自身が処理可能なパターンに合致するタプルをデータスペースから取得（`take` または `read`）して非同期に処理し、結果を再びデータスペースに返す。

class TupleSpace {
  private space: any[][] = [];
  private waiters: { pattern: any[]; resolve: (val: any[]) => void }[] = [];

  write(tuple: any[]): void {
    // 待機中の受信者がパターンに一致するか確認
    for (let i = 0; i < this.waiters.length; i++) {
      const { pattern, resolve } = this.waiters[i];
      if (this.match(pattern, tuple)) {
        this.waiters.splice(i, 1);
        resolve(tuple);
        return;
      }
    }
    this.space.push(tuple);
  }

  take(pattern: any[]): Promise<any[]> {
    return new Promise(resolve => {
      for (let i = 0; i < this.space.length; i++) {
        const tuple = this.space[i];
        if (this.match(pattern, tuple)) {
          this.space.splice(i, 1); // 取得したタプルをスペースから削除
          resolve(tuple);
          return;
        }
      }
      this.waiters.push({ pattern, resolve });
    });
  }

  private match(pattern: any[], tuple: any[]): boolean {
    if (pattern.length !== tuple.length) return false;
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] === '*') continue; // ワイルドカード
      if (pattern[i] !== tuple[i]) return false;
    }
    return true;
  }
}

// ==========================================
// 各並行ワーカー (自律的にスペースを監視・処理)
// ==========================================

interface ProductData {
  id: string;
  name: string;
  price: number;
  stock: number;
}

// 1. カタログ管理ワーカー
async function catalogWorker(space: TupleSpace, products: ProductData[]): Promise<void> {
  while (true) {
    // リクエスト待機
    const [, reqId, action, payload] = await space.take(['catalog', '*', '*', '*']);

    if (action === 'print') {
      const { replyToken } = payload;
      console.log("=== 商品カタログ ===");
      for (const p of products) {
        console.log(`[${p.id}] ${p.name} / 価格: ${p.price}円 / 在庫: ${p.stock}個`);
      }
      console.log("===================\n");
      space.write(['reply', replyToken, 'success', null]);
    } 
    else if (action === 'check_stock') {
      const { id, qty, replyToken } = payload;
      const p = products.find(prod => prod.id === id);
      if (!p) {
        space.write(['reply', replyToken, 'error', `エラー: 商品 ${id} が見つかりません。`]);
      } else if (p.stock === 0) {
        space.write(['reply', replyToken, 'error', `エラー: ${p.name} は在庫切れです。`]);
      } else if (p.stock < qty) {
        // 在庫はあるが不足
        space.write(['reply', replyToken, 'insufficient', p]);
      } else {
        space.write(['reply', replyToken, 'success', p]);
      }
    } 
    else if (action === 'reduce_stock') {
      const { items, replyToken } = payload;
      for (const item of items) {
        const p = products.find(prod => prod.id === item.product.id);
        if (p) {
          p.stock -= item.qty;
        }
      }
      space.write(['reply', replyToken, 'success', null]);
    }
  }
}

// 2. ショッピングカート管理ワーカー
async function cartWorker(space: TupleSpace): Promise<void> {
  let cartItems: { product: ProductData; qty: number }[] = [];

  while (true) {
    const [, reqId, action, payload] = await space.take(['cart', '*', '*', '*']);

    if (action === 'add') {
      const { product, qty, replyToken } = payload;
      const existing = cartItems.find(item => item.product.id === product.id);
      const currentInCart = existing ? existing.qty : 0;

      // 在庫十分性のチェック (カタログワーカーで仮チェックはしているが、カート内数量との競合チェック)
      if (product.stock < currentInCart + qty) {
        space.write(['reply', replyToken, 'error', `エラー: ${product.name} の在庫が不足しています（要求: ${qty}個, カート内: ${currentInCart}個, 在庫: ${product.stock}個）。`]);
      } else {
        if (existing) {
          existing.qty += qty;
        } else {
          cartItems.push({ product, qty });
        }
        console.log(`[OK] カートに追加しました: ${product.name} x ${qty}`);
        space.write(['reply', replyToken, 'success', null]);
      }
    } 
    else if (action === 'get_subtotal') {
      const { replyToken } = payload;
      const subtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
      space.write(['reply', replyToken, 'success', subtotal]);
    } 
    else if (action === 'checkout') {
      const { replyToken } = payload;
      if (cartItems.length === 0) {
        space.write(['reply', replyToken, 'error', "エラー: カートが空です。"]);
        continue;
      }

      console.log("\n--- レシート (Receipt) ---");
      for (const item of cartItems) {
        console.log(`・${item.product.name} (${item.product.price}円) x ${item.qty} = ${item.product.price * item.qty}円`);
      }

      const subtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
      const discount = subtotal >= 3000 ? Math.round(subtotal * 0.1) : 0;

      console.log(`割引前合計: ${subtotal}円`);
      console.log(`割引額: -${discount}円`);
      console.log(`支払合計: ${subtotal - discount}円`);
      console.log("-------------------------\n");

      // カタログワーカーへ在庫減算のタスクを投げる
      const reduceToken = `token-reduce-${Date.now()}`;
      space.write(['catalog', 'req-reduce', 'reduce_stock', {
        items: [...cartItems],
        replyToken: reduceToken
      }]);

      // 在庫減算の完了を待つ
      await space.take(['reply', reduceToken, 'success', '*']);

      // カートクリア
      cartItems = [];
      space.write(['reply', replyToken, 'success', null]);
    }
  }
}

// ==========================================
// メインシナリオ実行
// ==========================================

async function runScenario(): Promise<void> {
  const space = new TupleSpace();

  // ワーカーの起動 (バックグラウンドでループ待機)
  catalogWorker(space, [
    { id: 'PRD-01', name: 'ノートPC', price: 100000, stock: 2 },
    { id: 'PRD-02', name: 'マウス', price: 3000, stock: 5 },
    { id: 'PRD-03', name: 'キーボード', price: 5000, stock: 0 }
  ]);
  cartWorker(space);

  // 1. 商品一覧の表示要求
  let token = 't1';
  space.write(['catalog', 'req-print', 'print', { replyToken: token }]);
  await space.take(['reply', token, 'success', '*']);

  // 2. 正常追加 (マウス 1個)
  token = 't2';
  space.write(['catalog', 'req-check-mouse', 'check_stock', { id: 'PRD-02', qty: 1, replyToken: token }]);
  let [, , status, result] = await space.take(['reply', token, '*', '*']);
  if (status === 'success') {
    const addToken = 't2-add';
    space.write(['cart', 'req-add-mouse', 'add', { product: result, qty: 1, replyToken: addToken }]);
    await space.take(['reply', addToken, 'success', '*']);
  }

  // 3. 在庫切れの追加試行 (キーボード 1個)
  token = 't3';
  space.write(['catalog', 'req-check-kbd', 'check_stock', { id: 'PRD-03', qty: 1, replyToken: token }]);
  [, , status, result] = await space.take(['reply', token, '*', '*']);
  if (status === 'error') {
    console.log(result); // 在庫切れエラー
  }

  // 4. 在庫超えの追加試行 (ノートPC 3個)
  token = 't4';
  space.write(['catalog', 'req-check-laptop-over', 'check_stock', { id: 'PRD-01', qty: 3, replyToken: token }]);
  [, , status, result] = await space.take(['reply', token, '*', '*']);
  if (status === 'insufficient') {
    // 在庫チェック時点で「在庫はあるが不足」のため、カート追加エラーログを模倣
    // 本来のカート追加の文脈でエラーにするため、ダミー追加を試行してカート側にエラーを出させる
    const addToken = 't4-add';
    space.write(['cart', 'req-add-laptop-over', 'add', { product: result, qty: 3, replyToken: addToken }]);
    const [, , addStatus, addErr] = await space.take(['reply', addToken, '*', '*']);
    if (addStatus === 'error') {
      console.log(addErr);
    }
  }

  // 5. 複数商品の追加 (ノートPC 1個)
  token = 't5';
  space.write(['catalog', 'req-check-laptop-ok', 'check_stock', { id: 'PRD-01', qty: 1, replyToken: token }]);
  [, , status, result] = await space.take(['reply', token, '*', '*']);
  if (status === 'success') {
    const addToken = 't5-add';
    space.write(['cart', 'req-add-laptop-ok', 'add', { product: result, qty: 1, replyToken: addToken }]);
    await space.take(['reply', addToken, 'success', '*']);
  }

  // 6. カート状態の確認
  token = 't6';
  space.write(['cart', 'req-subtotal', 'get_subtotal', { replyToken: token }]);
  [, , , result] = await space.take(['reply', token, 'success', '*']);
  console.log(`カート内合計金額（割引前）: ${result}円`);

  // 7. チェックアウト
  token = 't7';
  space.write(['cart', 'req-checkout', 'checkout', { replyToken: token }]);
  await space.take(['reply', token, 'success', '*']);

  // 8. 事後の在庫確認
  token = 't8';
  space.write(['catalog', 'req-print-final', 'print', { replyToken: token }]);
  await space.take(['reply', token, 'success', '*']);

  console.log("シミュレーションが完了しました。");
  process.exit(0); // 非同期ワーカーがループしているので終了する
}

// 実行
runScenario();
