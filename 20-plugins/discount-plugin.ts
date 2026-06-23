// ==========================================
// Plugin: discount-plugin.ts
// ==========================================
// 実行時に動的に読み込まれる割引ロジックのプラグイン。

export function calculateDiscount(subtotal: number): number {
  return subtotal >= 3000 ? Math.round(subtotal * 0.1) : 0;
}
