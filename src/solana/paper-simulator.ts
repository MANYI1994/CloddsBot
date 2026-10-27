/** Pure, offline paper execution. No RPC, wallet, or signing imports. */
export interface PaperAccount { cashUsd: number; tokenQuantity: number; entryCostUsd: number; }
export interface PaperFill { account: PaperAccount; quantity: number; feeUsd: number; executionPriceUsd: number; }
export function paperBuy(account: PaperAccount, spendUsd: number, priceUsd: number, slippageBps = 100, feeBps = 125): PaperFill {
  if (![account.cashUsd, account.tokenQuantity, account.entryCostUsd, spendUsd, priceUsd, slippageBps, feeBps].every(Number.isFinite)) throw new Error('Non-finite paper trade');
  if (spendUsd <= 0 || priceUsd <= 0 || slippageBps < 0 || feeBps < 0 || slippageBps >= 10000 || feeBps >= 10000) throw new Error('Invalid paper buy');
  if (spendUsd > account.cashUsd + 1e-9) throw new Error('Insufficient virtual cash');
  const feeUsd = spendUsd * feeBps / 10000;
  const executionPriceUsd = priceUsd * (1 + slippageBps / 10000);
  const quantity = (spendUsd - feeUsd) / executionPriceUsd;
  return { quantity, feeUsd, executionPriceUsd, account: { cashUsd: Math.max(0, account.cashUsd - spendUsd), tokenQuantity: account.tokenQuantity + quantity, entryCostUsd: account.entryCostUsd + spendUsd } };
}
export function paperSell(account: PaperAccount, quantity: number, priceUsd: number, slippageBps = 100, feeBps = 125): PaperFill & { realizedPnlUsd: number } {
  if (![account.cashUsd, account.tokenQuantity, account.entryCostUsd, quantity, priceUsd, slippageBps, feeBps].every(Number.isFinite)) throw new Error('Non-finite paper trade');
  if (quantity <= 0 || priceUsd <= 0 || quantity > account.tokenQuantity + 1e-9 || slippageBps < 0 || feeBps < 0 || slippageBps >= 10000 || feeBps >= 10000) throw new Error('Invalid paper sell');
  const executionPriceUsd = priceUsd * (1 - slippageBps / 10000);
  const gross = quantity * executionPriceUsd;
  const feeUsd = gross * feeBps / 10000;
  const fraction = Math.min(1, quantity / account.tokenQuantity);
  const costBasis = account.entryCostUsd * fraction;
  const remaining = Math.max(0, account.tokenQuantity - quantity);
  return { quantity, feeUsd, executionPriceUsd, realizedPnlUsd: gross - feeUsd - costBasis, account: { cashUsd: account.cashUsd + gross - feeUsd, tokenQuantity: remaining, entryCostUsd: remaining === 0 ? 0 : account.entryCostUsd - costBasis } };
}
