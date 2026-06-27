// ==========================================
// Style 46: Reactive Streams (リアクティブストリーム)
// ==========================================
// 【制約】
// 1. システムへの命令（カタログ表示、カート追加、チェックアウトなど）は、時間とともに流れる「イベントストリーム (Observable)」として表現される。
// 2. 状態の直接更新や変数での引き回しを排し、イベントストリームに対する宣言的な変換オペレータ（map, filter, scan）の適用のみでビジネスロジックを構成する。
// 3. システムの状態遷移は、action$ストリームからscanオペレータを用いて状態オブジェクト（AppState）に畳み込むことで自動的に伝播・再現される。
// 4. コンソール出力やデータの最終的な反映などの副作用は、最終的なストリームの購読（subscribe）によってのみ実行される。

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

// アクション（入力イベント）の定義
type Action =
  | { type: 'PRINT_CATALOG' }
  | { type: 'ADD_TO_CART'; productId: string; qty: number }
  | { type: 'CHECKOUT' };

// 実行結果（出力用メタデータ）の定義
type ActionResult =
  | { type: 'CATALOG_PRINTED' }
  | { type: 'ADD_SUCCESS'; productName: string; qty: number }
  | { type: 'ADD_FAILED'; reason: string }
  | { type: 'CHECKOUT_SUCCESS'; subtotal: number; discount: number; total: number; receiptLines: string[] }
  | { type: 'CHECKOUT_FAILED'; reason: string };

interface AppState {
  catalog: Product[];
  cart: CartItem[];
  lastResult: ActionResult | null;
}

// ==========================================
// 簡易 Observable & Subject の自前実装 (ライブラリ層)
// ==========================================
type Observer<T> = (val: T) => void;

class Observable<T> {
  constructor(private _subscribe: (observer: Observer<T>) => void) {}

  subscribe(observer: Observer<T>): void {
    this._subscribe(observer);
  }

  map<U>(fn: (val: T) => U): Observable<U> {
    return new Observable<U>((observer) => {
      this.subscribe((val) => observer(fn(val)));
    });
  }

  filter(pred: (val: T) => boolean): Observable<T> {
    return new Observable<T>((observer) => {
      this.subscribe((val) => {
        if (pred(val)) observer(val);
      });
    });
  }

  scan<U>(accumulator: (acc: U, val: T) => U, seed: U): Observable<U> {
    return new Observable<U>((observer) => {
      let acc = seed;
      // 最初のシード状態を流す
      observer(acc);
      this.subscribe((val) => {
        acc = accumulator(acc, val);
        observer(acc);
      });
    });
  }
}

class Subject<T> extends Observable<T> {
  private observers: Observer<T>[] = [];

  constructor() {
    super((observer) => {
      this.observers.push(observer);
    });
  }

  next(val: T): void {
    for (const obs of this.observers) {
      obs(val);
    }
  }
}

// ==========================================
// 初期データとストリーム構築 (ビジネスロジック層)
// ==========================================

const INITIAL_PRODUCTS: ReadonlyArray<Product> = [
  { id: 'PRD-01', name: 'ノートPC', price: 100000, stock: 2 },
  { id: 'PRD-02', name: 'マウス', price: 3000, stock: 5 },
  { id: 'PRD-03', name: 'キーボード', price: 5000, stock: 0 }
];

const initialState: AppState = {
  catalog: INITIAL_PRODUCTS.map(p => ({ ...p })),
  cart: [],
  lastResult: null
};

// 1. アクションストリーム (入力ゲート)
const action$ = new Subject<Action>();

// 2. アクションの蓄積と状態遷移 (scanオペレータによる状態の自動更新)
const state$ = action$.scan<AppState>((state, action) => {
  switch (action.type) {
    case 'PRINT_CATALOG': {
      return {
        ...state,
        lastResult: { type: 'CATALOG_PRINTED' }
      };
    }
    case 'ADD_TO_CART': {
      const { productId, qty } = action;
      const product = state.catalog.find(p => p.id === productId);

      if (!product) {
        return {
          ...state,
          lastResult: { type: 'ADD_FAILED', reason: `商品 ${productId} が見つかりません。` }
        };
      }

      const cartItem = state.cart.find(c => c.id === productId);
      const currentInCart = cartItem ? cartItem.qty : 0;

      if (product.stock === 0) {
        return {
          ...state,
          lastResult: { type: 'ADD_FAILED', reason: `${product.name} は在庫切れです。` }
        };
      }

      if (product.stock < currentInCart + qty) {
        return {
          ...state,
          lastResult: { type: 'ADD_FAILED', reason: `${product.name} の在庫が不足しています（要求: ${qty}個, カート内: ${currentInCart}個, 在庫: ${product.stock}個）。` }
        };
      }

      const newCart = cartItem
        ? state.cart.map(c => c.id === productId ? { ...c, qty: c.qty + qty } : c)
        : [...state.cart, { id: productId, name: product.name, price: product.price, qty }];

      return {
        ...state,
        cart: newCart,
        lastResult: { type: 'ADD_SUCCESS', productName: product.name, qty }
      };
    }
    case 'CHECKOUT': {
      if (state.cart.length === 0) {
        return {
          ...state,
          lastResult: { type: 'CHECKOUT_FAILED', reason: 'カートが空です。' }
        };
      }

      let subtotal = 0;
      const receiptLines: string[] = [];
      for (const item of state.cart) {
        const lineTotal = item.price * item.qty;
        receiptLines.push(`・${item.name} (${item.price}円) x ${item.qty} = ${lineTotal}円`);
        subtotal += lineTotal;
      }

      const discount = subtotal >= 3000 ? Math.round(subtotal * 0.1) : 0;
      const total = subtotal - discount;

      // 在庫の減算
      const newCatalog = state.catalog.map(p => {
        const item = state.cart.find(c => c.id === p.id);
        return item ? { ...p, stock: p.stock - item.qty } : p;
      });

      return {
        catalog: newCatalog,
        cart: [],
        lastResult: { type: 'CHECKOUT_SUCCESS', subtotal, discount, total, receiptLines }
      };
    }
  }
}, initialState);

// ==========================================
// 副作用の実行 (プレゼンテーション/出力層)
// ==========================================

// 状態ストリームを購読し、最新のアクション実行結果に基づいてコンソール出力を行う
state$.subscribe((state) => {
  const result = state.lastResult;
  if (!result) return;

  switch (result.type) {
    case 'CATALOG_PRINTED': {
      console.log("=== 商品カタログ ===");
      for (const p of state.catalog) {
        console.log(`[${p.id}] ${p.name} / 価格: ${p.price}円 / 在庫: ${p.stock}個`);
      }
      console.log("===================\n");
      break;
    }
    case 'ADD_SUCCESS': {
      console.log(`[OK] カートに追加しました: ${result.productName} x ${result.qty}`);
      break;
    }
    case 'ADD_FAILED': {
      console.log(`エラー: ${result.reason}`);
      break;
    }
    case 'CHECKOUT_SUCCESS': {
      console.log("\n--- レシート (Receipt) ---");
      for (const line of result.receiptLines) {
        console.log(line);
      }
      console.log(`割引前合計: ${result.subtotal}円`);
      console.log(`割引額: -${result.discount}円`);
      console.log(`支払合計: ${result.total}円`);
      console.log("-------------------------\n");
      break;
    }
    case 'CHECKOUT_FAILED': {
      console.log(`エラー: ${result.reason}`);
      break;
    }
  }
});

// ==========================================
// メイン制御ルーチン (エントリーポイント)
// ==========================================
function runShoppingSimulation(): void {
  // アクションをストリームに流し込む
  // 1. 商品一覧の表示
  action$.next({ type: 'PRINT_CATALOG' });

  // 2. 正常な追加: マウスを 1個追加
  action$.next({ type: 'ADD_TO_CART', productId: 'PRD-02', qty: 1 });

  // 3. 在庫切れの追加試行: キーボードを 1個追加
  action$.next({ type: 'ADD_TO_CART', productId: 'PRD-03', qty: 1 });

  // 4. 在庫超えの追加試行: ノートPCを 3個追加
  action$.next({ type: 'ADD_TO_CART', productId: 'PRD-01', qty: 3 });

  // 5. 正常な追加: ノートPCを 1個追加
  action$.next({ type: 'ADD_TO_CART', productId: 'PRD-01', qty: 1 });

  // 6. カートの確認とチェックアウト
  action$.next({ type: 'CHECKOUT' });

  // 7. 事後の在庫確認
  action$.next({ type: 'PRINT_CATALOG' });
}

// 実行
runShoppingSimulation();
