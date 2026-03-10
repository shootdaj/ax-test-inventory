'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const TransactionLog = require('../../src/transaction-log');

describe('TransactionLog - append', () => {
  let log;

  beforeEach(() => {
    log = new TransactionLog();
  });

  it('should append an entry and return it', () => {
    const entry = log.append({
      sku: 'WDG-001',
      action: 'add',
      details: { item: { name: 'Widget' } },
      reason: 'Initial stock',
    });
    assert.equal(entry.sku, 'WDG-001');
    assert.equal(entry.action, 'add');
    assert.equal(entry.reason, 'Initial stock');
    assert.ok(entry.id);
    assert.ok(entry.timestamp);
  });

  it('should assign sequential IDs', () => {
    const e1 = log.append({ sku: 'A', action: 'add', details: {}, reason: 'r' });
    const e2 = log.append({ sku: 'B', action: 'add', details: {}, reason: 'r' });
    assert.equal(e1.id, '1');
    assert.equal(e2.id, '2');
  });

  it('should track length', () => {
    assert.equal(log.length, 0);
    log.append({ sku: 'A', action: 'add', details: {}, reason: 'r' });
    assert.equal(log.length, 1);
    log.append({ sku: 'B', action: 'add', details: {}, reason: 'r' });
    assert.equal(log.length, 2);
  });
});

describe('TransactionLog - getAll', () => {
  it('should return empty array when no entries', () => {
    const log = new TransactionLog();
    assert.deepEqual(log.getAll(), []);
  });

  it('should return all entries as copies', () => {
    const log = new TransactionLog();
    log.append({ sku: 'A', action: 'add', details: {}, reason: 'r1' });
    log.append({ sku: 'B', action: 'remove', details: {}, reason: 'r2' });
    const all = log.getAll();
    assert.equal(all.length, 2);
    // Verify they are copies
    all[0].reason = 'modified';
    assert.equal(log.getAll()[0].reason, 'r1');
  });
});

describe('TransactionLog - getBySku', () => {
  let log;

  beforeEach(() => {
    log = new TransactionLog();
    log.append({ sku: 'A', action: 'add', details: {}, reason: 'r1' });
    log.append({ sku: 'B', action: 'add', details: {}, reason: 'r2' });
    log.append({ sku: 'A', action: 'update', details: {}, reason: 'r3' });
  });

  it('should filter by SKU', () => {
    const results = log.getBySku('A');
    assert.equal(results.length, 2);
    assert.equal(results[0].sku, 'A');
    assert.equal(results[1].sku, 'A');
  });

  it('should return empty array for unknown SKU', () => {
    assert.deepEqual(log.getBySku('NOPE'), []);
  });
});

describe('TransactionLog - getByAction', () => {
  let log;

  beforeEach(() => {
    log = new TransactionLog();
    log.append({ sku: 'A', action: 'add', details: {}, reason: 'r1' });
    log.append({ sku: 'B', action: 'add', details: {}, reason: 'r2' });
    log.append({ sku: 'A', action: 'update', details: {}, reason: 'r3' });
    log.append({ sku: 'B', action: 'remove', details: {}, reason: 'r4' });
  });

  it('should filter by action type', () => {
    const adds = log.getByAction('add');
    assert.equal(adds.length, 2);
    const updates = log.getByAction('update');
    assert.equal(updates.length, 1);
    const removes = log.getByAction('remove');
    assert.equal(removes.length, 1);
  });

  it('should return empty array for unknown action', () => {
    assert.deepEqual(log.getByAction('unknown'), []);
  });
});

describe('TransactionLog - getByDateRange', () => {
  it('should filter by date range', () => {
    const log = new TransactionLog();
    log.append({ sku: 'A', action: 'add', details: {}, reason: 'r1' });

    const now = new Date();
    const past = new Date(now.getTime() - 60000);
    const future = new Date(now.getTime() + 60000);

    const results = log.getByDateRange(past, future);
    assert.equal(results.length, 1);
  });

  it('should return empty for out-of-range dates', () => {
    const log = new TransactionLog();
    log.append({ sku: 'A', action: 'add', details: {}, reason: 'r1' });

    const far_past = new Date('2020-01-01');
    const also_past = new Date('2020-12-31');

    const results = log.getByDateRange(far_past, also_past);
    assert.equal(results.length, 0);
  });

  it('should accept ISO string dates', () => {
    const log = new TransactionLog();
    log.append({ sku: 'A', action: 'add', details: {}, reason: 'r1' });

    const results = log.getByDateRange('2020-01-01', '2030-12-31');
    assert.equal(results.length, 1);
  });
});

describe('TransactionLog - clear', () => {
  it('should clear all entries', () => {
    const log = new TransactionLog();
    log.append({ sku: 'A', action: 'add', details: {}, reason: 'r1' });
    log.append({ sku: 'B', action: 'add', details: {}, reason: 'r2' });
    assert.equal(log.length, 2);
    log.clear();
    assert.equal(log.length, 0);
    assert.deepEqual(log.getAll(), []);
  });

  it('should reset ID counter after clear', () => {
    const log = new TransactionLog();
    log.append({ sku: 'A', action: 'add', details: {}, reason: 'r1' });
    log.clear();
    const entry = log.append({ sku: 'B', action: 'add', details: {}, reason: 'r2' });
    assert.equal(entry.id, '1');
  });
});
