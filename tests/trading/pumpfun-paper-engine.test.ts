import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PaperTradingEngine } from '../../src/solana/paper-engine';

describe('wallet-free Pump.fun virtual trading engine', () => {
  it('starts with exactly $20 virtual cash', () => {
    const engine = new PaperTradingEngine();
    assert.deepEqual(engine.snapshot(), { cashUsd: 20, tokenQuantity: 0, entryCostUsd: 0, openPositions: 0, realizedDailyPnlUsd: 0 });
  });
  it('enforces one position, then permits another after closing', () => {
    const engine = new PaperTradingEngine();
    const first = engine.buy(4, 0.01);
    assert.throws(() => engine.buy(1, 0.01), /risk policy/);
    engine.sell(first.quantity, 0.01);
    assert.equal(engine.snapshot().openPositions, 0);
    engine.buy(1, 0.01);
    assert.equal(engine.snapshot().openPositions, 1);
  });
  it('does not change state on invalid orders', () => {
    const engine = new PaperTradingEngine();
    const before = engine.snapshot();
    assert.throws(() => engine.buy(20, 0.01));
    assert.deepEqual(engine.snapshot(), before);
  });
  it('blocks new buys after the realized daily loss limit', () => {
    const engine = new PaperTradingEngine();
    const first = engine.buy(4, 0.01);
    engine.sell(first.quantity, 0.001);
    assert.ok(engine.snapshot().realizedDailyPnlUsd <= -2);
    assert.throws(() => engine.buy(1, 0.01), /risk policy/);
  });
  it('returns an immutable snapshot copy', () => {
    const engine = new PaperTradingEngine();
    const snapshot = engine.snapshot();
    assert.ok(Object.isFrozen(snapshot));
    assert.equal(engine.snapshot().cashUsd, 20);
  });
});
