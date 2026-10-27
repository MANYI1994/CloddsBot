import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { paperBuy, paperSell } from '../../src/solana/paper-simulator';

describe('offline Pump.fun paper fills', () => {
  const initial = { cashUsd: 20, tokenQuantity: 0, entryCostUsd: 0 };
  it('simulates a $4 buy without a wallet or network', () => {
    const fill = paperBuy(initial, 4, 0.01);
    assert.equal(fill.account.cashUsd, 16);
    assert.ok(fill.quantity > 0 && fill.quantity < 400);
    assert.equal(initial.cashUsd, 20);
  });
  it('rejects orders larger than the virtual account', () => {
    assert.throws(() => paperBuy(initial, 21, 0.01), /Insufficient virtual cash/);
  });
  it('rejects invalid prices, quantities and nonfinite inputs', () => {
    assert.throws(() => paperBuy(initial, 1, 0));
    assert.throws(() => paperBuy(initial, NaN, 0.01));
    assert.throws(() => paperSell(initial, 1, 0.01));
  });
  it('charges entry and exit fees, slippage, and realizes net PnL', () => {
    const buy = paperBuy(initial, 4, 0.01);
    const sell = paperSell(buy.account, buy.quantity, 0.01);
    assert.equal(sell.account.tokenQuantity, 0);
    assert.equal(sell.account.entryCostUsd, 0);
    assert.ok(sell.realizedPnlUsd < 0);
    assert.ok(sell.account.cashUsd < 20);
  });
  it('preserves cost basis after a partial exit', () => {
    const buy = paperBuy(initial, 4, 0.01);
    const sell = paperSell(buy.account, buy.quantity / 2, 0.02);
    assert.ok(Math.abs(sell.account.entryCostUsd - 2) < 1e-9);
    assert.ok(sell.realizedPnlUsd > 0);
  });
});
