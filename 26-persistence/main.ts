// ==========================================
// Style 26: Persistence (永続化 - ファイルデータベース)
// ==========================================
// 【制約】
// 1. プログラム全体のメモリ上（変数）にアプリケーションの状態（カタログやカート）を保持し続けることを禁止する。
// 2. すべての状態変更と取得は、外部ファイル（永続化データベース）への読み書き（クエリとトランザクション）をトリガーにして行う。
// 3. 各メソッドの実行が完了した時点で、メモリ上の作業変数や参照はすべて破棄される。

import * as fs from 'fs';
import * as path from 'path';

// 永続化先ファイルパスの決定
const DB_FILE = path.join(__dirname, 'database.json');

// データベースのスキーマ定義
interface DB_SCHEMA {
  catalog: { id: string; name: string; price: number; stock: number }[];
  cart: { id: string; name: string; price: number; qty: number }[];
}

// データベースの初期化
function initDatabase(): void {
  const initialData: DB_SCHEMA = {
    catalog: [
      { id: 'PRD-01', name: 'ノートPC', price: 100000, stock: 2 },
      { id: 'PRD-02', name: 'マウス', price: 3000, stock: 5 },
      { id: 'PRD-03', name: 'キーボード', price: 5000, stock: 0 }
    ],
    cart: []
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
}

// データ読み出し (クエリ)
function readDB(): DB_SCHEMA {
  if (!fs.existsSync(DB_FILE)) {
    initDatabase();
  }
  const content = fs.readFileSync(DB_FILE, 'utf8');
  return JSON.parse(content);
}

// データ書き込み (トランザクションコミット)
function writeDB(data: DB_SCHEMA): void {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ==========================================
// ビジネスロジック (状態はすべてDB_FILE経由で処理)
// ==========================================

class CatalogService {
  printCatalog(): void {
    const db = readDB();
    console.log("=== 商品カタログ ===");
    for (const p of db.catalog) {
      console.log(`[${p.id}] ${p.name} / 価格: ${p.price}円 / 在庫: ${p.stock}個`);
    }
    console.log("===================\n");
  }
}

class ShoppingCartService {
  addItem(productId: string, qty: number): void {
    const db = readDB();
    const product = db.catalog.find(p => p.id === productId);

    if (!product) {
      console.log(`エラー: 商品 ${productId} が見つかりません。`);
      return;
    }

    if (product.stock === 0) {
      console.log(`エラー: ${product.name} は在庫切れです。`);
      return;
    }

    const existing = db.cart.find(item => item.id === productId);
    const currentInCart = existing ? existing.qty : 0;

    if (product.stock < currentInCart + qty) {
      console.log(`エラー: ${product.name} の在庫が不足しています（要求: ${qty}個, カート内: ${currentInCart}個, 在庫: ${product.stock}個）。`);
      return;
    }

    if (existing) {
      existing.qty += qty;
    } else {
      db.cart.push({ id: productId, name: product.name, price: product.price, qty });
    }

    // DBへのコミット
    writeDB(db);
    console.log(`[OK] カートに追加しました: ${product.name} x ${qty}`);
  }

  getSubtotal(): number {
    const db = readDB();
    return db.cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  }
}

class CheckoutService {
  checkout(): void {
    const db = readDB();
    if (db.cart.length === 0) {
      console.log("エラー: カートが空です。");
      return;
    }

    console.log("\n--- レシート (Receipt) ---");
    for (const item of db.cart) {
      console.log(`・${item.name} (${item.price}円) x ${item.qty} = ${item.price * item.qty}円`);
    }

    const subtotal = db.cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const discount = subtotal >= 3000 ? Math.round(subtotal * 0.1) : 0;

    console.log(`割引前合計: ${subtotal}円`);
    console.log(`割引額: -${discount}円`);
    console.log(`支払合計: ${subtotal - discount}円`);
    console.log("-------------------------\n");

    // カタログの在庫の減算
    for (const item of db.cart) {
      const p = db.catalog.find(prod => prod.id === item.id);
      if (p) {
        p.stock -= item.qty;
      }
    }

    // カートをクリア
    db.cart = [];

    // DBへのコミット
    writeDB(db);
  }
}

// ==========================================
// テストストーリーの実行
// ==========================================

// 最初に永続データベースを初期化
initDatabase();

const catalog = new CatalogService();
const cart = new ShoppingCartService();
const checkoutService = new CheckoutService();

// 1. 商品一覧の表示
catalog.printCatalog();

// 2. 正常な追加
cart.addItem('PRD-02', 1);

// 3. 在庫切れの追加試行
cart.addItem('PRD-03', 1);

// 4. 在庫超えの追加試行
cart.addItem('PRD-01', 3);

// 5. 複数商品の追加 (ノートPCを1個追加)
cart.addItem('PRD-01', 1);

// 6. カート状態の確認
console.log(`カート内合計金額（割引前）: ${cart.getSubtotal()}円`);

// 7. チェックアウト (レシート出力、在庫更新、カートクリア)
checkoutService.checkout();

// 8. 事後の在庫確認
catalog.printCatalog();

// テスト終了後に一時データベースファイルを削除
if (fs.existsSync(DB_FILE)) {
  fs.unlinkSync(DB_FILE);
}
