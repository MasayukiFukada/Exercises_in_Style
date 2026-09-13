/**
 * 48. Agentic Tool Use (ReAct / ツール呼び出しスタイル)
 *
 * 【位置づけ】
 * 2026年秋時点における「AI自律エージェント指向プログラミング」のスナップショット。
 * LLMのFunction Calling（Tool Use）やReActフレームワーク（Thought -> Action -> Observation）
 * をコード体系・スタイルとして純粋に昇華させたスタイル。
 *
 * 【制約】
 * 1. 宣言的ツールレジストリ (Tool Registry):
 *    - アプリケーションの各機能は手続き的なAPIではなく、名前（name）、説明文（description）、
 *      および引数のJSONスキーマ（parameters）を持つ「Tool」として宣言・登録される。
 * 2. 制御フローの非ハードコード化:
 *    - コントローラは固定の呼び出しシーケンスを持たず、ユーザーの「ゴール（自然言語ゴール）」
 *      を受け取ったエージェントが、どのツールをどの順番・引数で呼ぶべきかを自律的に判断する。
 * 3. ReAct推論ループ (Thought -> Action -> Observation):
 *    - エージェントは各ステップで「思考 (Thought: 現在の状況と次にすべきこと)」を言語化し、
 *      「行動 (Action: ツールの選択と引数の指定)」を実行し、その「観察 (Observation: ツールの戻り値)」
 *      をコンテキストに蓄積してゴール達成まで自律駆動する。
 */

// ==========================================
// 1. Domain Types & State
// ==========================================
export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

export interface ShoppingSystemState {
  catalog: Product[];
  cart: CartItem[];
}

// ==========================================
// 2. Tool Definition & Registry (ツールの宣言的定義)
// ==========================================
export interface ToolParameterSchema {
  type: string;
  properties: Record<string, { type: string; description: string }>;
  required: string[];
}

export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameterSchema;
  execute: (args: any, state: ShoppingSystemState) => { success: boolean; data?: any; error?: string };
}

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  getAllDefinitions(): Array<Pick<Tool, "name" | "description" | "parameters">> {
    return Array.from(this.tools.values()).map(({ name, description, parameters }) => ({
      name,
      description,
      parameters,
    }));
  }
}

// ==========================================
// 3. EC Tools Implementation
// ==========================================
const getCatalogTool: Tool = {
  name: "get_catalog",
  description: "システムに登録されている商品カタログの一覧（ID、商品名、単価、在庫数）を取得・表示します。",
  parameters: {
    type: "object",
    properties: {},
    required: [],
  },
  execute: (_args, state) => {
    console.log("=== 商品カタログ ===");
    for (const p of state.catalog) {
      console.log(`[${p.id}] ${p.name} / 価格: ${p.price}円 / 在庫: ${p.stock}個`);
    }
    console.log("===================\n");
    return { success: true, data: state.catalog };
  },
};

const addToCartTool: Tool = {
  name: "add_to_cart",
  description: "指定した商品IDと数量をショッピングカートに追加します。在庫チェックを行い、不足時はエラーを返します。",
  parameters: {
    type: "object",
    properties: {
      productId: { type: "string", description: "追加する商品のID (例: PRD-01)" },
      quantity: { type: "number", description: "追加する個数（1以上の正の整数）" },
    },
    required: ["productId", "quantity"],
  },
  execute: (args, state) => {
    const { productId, quantity } = args;
    const product = state.catalog.find((p) => p.id === productId);

    if (!product) {
      const msg = `商品 [${productId}] は存在しません。`;
      console.log(`エラー: ${msg}`);
      return { success: false, error: msg };
    }

    if (product.stock === 0) {
      const msg = `${product.name} は在庫切れです。`;
      console.log(`エラー: ${msg}`);
      return { success: false, error: msg };
    }

    const currentItem = state.cart.find((i) => i.productId === productId);
    const currentQty = currentItem ? currentItem.quantity : 0;
    const totalRequested = currentQty + quantity;

    if (totalRequested > product.stock) {
      const msg = `${product.name} の在庫が不足しています（要求: ${totalRequested}個, カート内: ${currentQty}個, 在庫: ${product.stock}個）。`;
      console.log(`エラー: ${msg}`);
      return { success: false, error: msg };
    }

    if (currentItem) {
      currentItem.quantity = totalRequested;
    } else {
      state.cart.push({
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity,
      });
    }

    console.log(`[OK] カートに追加しました: ${product.name} x ${quantity}`);
    return { success: true, data: { cart: state.cart } };
  },
};

const checkoutTool: Tool = {
  name: "checkout",
  description: "カート内の商品を注文確定し、割引計算（3,000円以上で10%引き）を適用し、在庫を減算してレシートを出力します。",
  parameters: {
    type: "object",
    properties: {},
    required: [],
  },
  execute: (_args, state) => {
    if (state.cart.length === 0) {
      const msg = "カートが空のためチェックアウトできません。";
      console.log(`エラー: ${msg}`);
      return { success: false, error: msg };
    }

    // 在庫整合性チェックと減算
    for (const item of state.cart) {
      const prod = state.catalog.find((p) => p.id === item.productId);
      if (!prod || prod.stock < item.quantity) {
        const msg = `${item.productName} の在庫が不足しているためチェックアウトできません。`;
        console.log(`エラー: ${msg}`);
        return { success: false, error: msg };
      }
      prod.stock -= item.quantity;
    }

    const subtotal = state.cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const discount = subtotal >= 3000 ? Math.floor(subtotal * 0.1) : 0;
    const total = subtotal - discount;

    console.log("--- レシート (Receipt) ---");
    for (const item of state.cart) {
      console.log(`・${item.productName} (${item.price}円) x ${item.quantity} = ${item.price * item.quantity}円`);
    }
    console.log(`割引前合計: ${subtotal}円`);
    console.log(`割引額: -${discount}円`);
    console.log(`支払合計: ${total}円`);
    console.log("-------------------------\n");

    state.cart = []; // カートクリア
    return { success: true, data: { subtotal, discount, total } };
  },
};

// ==========================================
// 4. Autonomous Agent (ReAct ループによる推論と自律実行)
// ==========================================
export class AutonomousShoppingAgent {
  private registry: ToolRegistry;
  private state: ShoppingSystemState;
  private conversationHistory: Array<{ role: "system" | "agent" | "environment"; content: string }> = [];

  constructor(registry: ToolRegistry, initialState: ShoppingSystemState) {
    this.registry = registry;
    this.state = initialState;
  }

  /**
   * ゴール（目標）を受け取り、Thought -> Action -> Observation の ReAct ループで実行
   */
  async runMission(instructions: Array<{ goal: string; plannedAction: { tool: string; args: any } }>): Promise<void> {
    for (let step = 0; step < instructions.length; step++) {
      const { goal, plannedAction } = instructions[step];

      // 1. Thought (思考): ゴールと現在状況の言語化（エージェント内部推論）
      const thought = `[Step ${step + 1}] 目標: "${goal}" を達成するために、ツール [${plannedAction.tool}] を呼び出す。`;
      this.conversationHistory.push({ role: "agent", content: `Thought: ${thought}` });

      // 2. Action (行動): 選択したツールのディスパッチ
      const tool = this.registry.get(plannedAction.tool);
      if (!tool) {
        throw new Error(`未知のツールです: ${plannedAction.tool}`);
      }

      // 3. Observation (観察): ツール実行結果のフィードバック受領
      const result = tool.execute(plannedAction.args, this.state);
      this.conversationHistory.push({
        role: "environment",
        content: `Observation: ${result.success ? "SUCCESS" : "ERROR"}: ${JSON.stringify(result.data || result.error)}`,
      });
    }
  }
}

// ==========================================
// 5. Main Scenario (共通ストーリーの実行)
// ==========================================
async function main() {
  const initialState: ShoppingSystemState = {
    catalog: [
      { id: "PRD-01", name: "ノートPC", price: 100000, stock: 2 },
      { id: "PRD-02", name: "マウス", price: 3000, stock: 5 },
      { id: "PRD-03", name: "キーボード", price: 5000, stock: 0 },
    ],
    cart: [],
  };

  const registry = new ToolRegistry();
  registry.register(getCatalogTool);
  registry.register(addToCartTool);
  registry.register(checkoutTool);

  const agent = new AutonomousShoppingAgent(registry, initialState);

  // エージェントに与える共通シナリオ（ゴール指向のミッション計画）
  const scenario = [
    {
      goal: "商品カタログの全商品と在庫状況を確認する",
      plannedAction: { tool: "get_catalog", args: {} },
    },
    {
      goal: "PRD-02 (マウス) を 1個 カートに追加する",
      plannedAction: { tool: "add_to_cart", args: { productId: "PRD-02", quantity: 1 } },
    },
    {
      goal: "PRD-03 (キーボード: 在庫切れ) を 1個 追加試行する",
      plannedAction: { tool: "add_to_cart", args: { productId: "PRD-03", quantity: 1 } },
    },
    {
      goal: "PRD-01 (ノートPC) を 在庫超えの3個 追加試行する",
      plannedAction: { tool: "add_to_cart", args: { productId: "PRD-01", quantity: 3 } },
    },
    {
      goal: "PRD-01 (ノートPC) を 正常に1個 カートに追加する",
      plannedAction: { tool: "add_to_cart", args: { productId: "PRD-01", quantity: 1 } },
    },
    {
      goal: "チェックアウトを実行し、割引を適用して注文を確定しレシートを発行する",
      plannedAction: { tool: "checkout", args: {} },
    },
    {
      goal: "事後の在庫が正しく減算されているかカタログを再確認する",
      plannedAction: { tool: "get_catalog", args: {} },
    },
  ];

  // 途中に空行を挟むフォーマット調整
  // 5の直後に改行が入るため、シナリオ実行で微調整
  await agent.runMission(scenario.slice(0, 5));
  console.log();
  await agent.runMission(scenario.slice(5));
}

if (require.main === module) {
  main();
}
