// ==========================================
// Style 34: RESTful (ステートレス - Webスタイル)
// ==========================================
// 【制約】
// 1. クライアントとサーバーを完全に分離し、すべてのやり取りをリクエストとレスポンスの形で行う。
// 2. サーバーはクライアントのセッション状態（現在のカートの中身など）を一切メモリに保持しない（ステートレス）。
// 3. クライアントは、操作の度に「自身の状態全体（カートの内容）」をリクエストボディに載せてサーバーに送信する。
// 4. 操作対象のリソースは URI 風のパスで指定し、標準的な HTTP メソッド（GET, POST）をエミュレートする。

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

interface APIResponse {
  status: number;
  body: any;
}

class RESTfulServer {
  // サーバーの永続データベース (商品カタログ)
  private database: Product[] = [
    { id: 'PRD-01', name: 'ノートPC', price: 100000, stock: 2 },
    { id: 'PRD-02', name: 'マウス', price: 3000, stock: 5 },
    { id: 'PRD-03', name: 'キーボード', price: 5000, stock: 0 }
  ];

  // 単一のWebAPIエンドポイントゲートウェイ
  handleRequest(method: string, path: string, body: any): APIResponse {
    if (method === 'GET' && path === '/products') {
      return { status: 200, body: [...this.database] };
    }

    if (method === 'POST' && path === '/cart/items') {
      const { cart, productId, qty } = body as { cart: CartItem[]; productId: string; qty: number };
      const product = this.database.find(p => p.id === productId);

      if (!product) {
        return { status: 404, body: { error: `商品 ${productId} が見つかりません。`, cart } };
      }
      if (product.stock === 0) {
        return { status: 400, body: { error: `${product.name} は在庫切れです。`, cart } };
      }

      const existing = cart.find(item => item.id === productId);
      const currentInCart = existing ? existing.qty : 0;

      if (product.stock < currentInCart + qty) {
        return { status: 400, body: { error: `${product.name} の在庫が不足しています（要求: ${qty}個, カート内: ${currentInCart}個, 在庫: ${product.stock}個）。`, cart } };
      }

      // クライアントから送られてきたカートに変更を適用して、新しいカート状態を作る (サーバーは保存しない)
      const updatedCart = existing
        ? cart.map(item => item.id === productId ? { ...item, qty: item.qty + qty } : item)
        : [...cart, { id: productId, name: product.name, price: product.price, qty }];

      return { status: 200, body: { message: `[OK] カートに追加しました: ${product.name} x ${qty}`, cart: updatedCart } };
    }

    if (method === 'POST' && path === '/checkout') {
      const { cart } = body as { cart: CartItem[] };
      if (cart.length === 0) {
        return { status: 400, body: { error: "カートが空です。" } };
      }

      // レシートテキストの生成
      let receiptText = "\n--- レシート (Receipt) ---\n";
      for (const item of cart) {
        receiptText += `・${item.name} (${item.price}円) x ${item.qty} = ${item.price * item.qty}円\n`;
      }
      const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
      const discount = subtotal >= 3000 ? Math.round(subtotal * 0.1) : 0;

      receiptText += `割引前合計: ${subtotal}円\n`;
      receiptText += `割引額: -${discount}円\n`;
      receiptText += `支払合計: ${subtotal - discount}円\n`;
      receiptText += "-------------------------\n";

      // サーバーデータベースの更新 (在庫の引き落とし)
      for (const item of cart) {
        const p = this.database.find(prod => prod.id === item.id);
        if (p) {
          p.stock -= item.qty;
        }
      }

      return {
        status: 200,
        body: {
          receipt: receiptText,
          subtotal,
          emptyCart: [] // 新しい空のカート状態を返す
        }
      };
    }

    return { status: 404, body: { error: "Not Found" } };
  }
}

// ==========================================
// クライアント (状態を自身で管理して引き回す)
// ==========================================

const server = new RESTfulServer();

// クライアント側で維持するセッション状態 (カートデータ)
let clientCart: CartItem[] = [];

// ヘルパー: カタログ表示
function printCatalog(): void {
  const response = server.handleRequest('GET', '/products', null);
  const products = response.body as Product[];
  console.log("=== 商品カタログ ===");
  for (const p of products) {
    console.log(`[${p.id}] ${p.name} / 価格: ${p.price}円 / 在庫: ${p.stock}個`);
  }
  console.log("===================\n");
}

// ヘルパー: カート追加リクエスト
function requestAddToCart(productId: string, qty: number): void {
  // カートの状態 clientCart を毎回リクエストボディに載せて送信する
  const response = server.handleRequest('POST', '/cart/items', {
    cart: clientCart,
    productId,
    qty
  });

  if (response.status === 200) {
    console.log(response.body.message);
    clientCart = response.body.cart; // 新しい状態をクライアントが保存
  } else {
    console.log(`エラー: ${response.body.error}`);
    clientCart = response.body.cart; // エラー時も元の状態を維持
  }
}

// ヘルパー: チェックアウト要求
function requestCheckout(): void {
  const response = server.handleRequest('POST', '/checkout', { cart: clientCart });

  if (response.status === 200) {
    console.log(response.body.receipt);
    clientCart = response.body.emptyCart; // カートが空になった新しい状態を保存
  } else {
    console.log(`エラー: ${response.body.error}`);
  }
}

// ==========================================
// テストストーリーの実行
// ==========================================

// 1. 商品一覧の表示
printCatalog();

// 2. 正常な追加
requestAddToCart('PRD-02', 1);

// 3. 在庫切れの追加試行
requestAddToCart('PRD-03', 1);

// 4. 在庫超えの追加試行
requestAddToCart('PRD-01', 3);

// 5. 複数商品の追加 (ノートPCを1個追加)
requestAddToCart('PRD-01', 1);

// 6. カート状態の確認 (クライアントのローカルデータを集計して表示)
const subtotal = clientCart.reduce((acc, item) => acc + (item.price * item.qty), 0);
console.log(`カート内合計金額（割引前）: ${subtotal}円`);

// 7. チェックアウト
requestCheckout();

// 8. 事後の在庫確認
printCatalog();
