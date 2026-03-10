'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { Inventory } = require('../../src/index');

describe('Integration: Inventory + TransactionLog', () => {
  let inv;

  beforeEach(() => {
    inv = new Inventory({ lowStockThreshold: 10 });
  });

  it('should log all add operations', () => {
    inv.addItem({ name: 'A', sku: 'A-001', quantity: 10, price: 5, category: 'C', location: 'L' });
    inv.addItem({ name: 'B', sku: 'B-001', quantity: 20, price: 8, category: 'C', location: 'L' });

    const log = inv.transactionLog;
    assert.equal(log.length, 2);

    const adds = log.getByAction('add');
    assert.equal(adds.length, 2);
  });

  it('should log remove operations with item snapshot', () => {
    inv.addItem({ name: 'A', sku: 'A-001', quantity: 10, price: 5, category: 'C', location: 'L' });
    inv.removeItem('A-001', 'Discontinued');

    const removes = inv.transactionLog.getByAction('remove');
    assert.equal(removes.length, 1);
    assert.equal(removes[0].reason, 'Discontinued');
    assert.equal(removes[0].details.item.sku, 'A-001');
  });

  it('should log update operations with changed fields', () => {
    inv.addItem({ name: 'A', sku: 'A-001', quantity: 10, price: 5, category: 'C', location: 'L' });
    inv.updateItem('A-001', { quantity: 50, price: 7 }, 'Restock and price adjustment');

    const updates = inv.transactionLog.getByAction('update');
    assert.equal(updates.length, 1);
    assert.equal(updates[0].reason, 'Restock and price adjustment');
    assert.deepEqual(updates[0].details.changedFields.quantity, { from: 10, to: 50 });
    assert.deepEqual(updates[0].details.changedFields.price, { from: 5, to: 7 });
  });

  it('should track complete lifecycle of an item', () => {
    inv.addItem({ name: 'A', sku: 'A-001', quantity: 100, price: 5, category: 'C', location: 'L' });
    inv.updateItem('A-001', { quantity: 50 }, 'Sold');
    inv.updateItem('A-001', { price: 7 }, 'Price increase');
    inv.removeItem('A-001', 'End of life');

    const log = inv.transactionLog.getBySku('A-001');
    assert.equal(log.length, 4);
    assert.equal(log[0].action, 'add');
    assert.equal(log[1].action, 'update');
    assert.equal(log[2].action, 'update');
    assert.equal(log[3].action, 'remove');
  });

  it('should log bulk operations individually', () => {
    inv.bulkAdd([
      { name: 'A', sku: 'A-001', quantity: 10, price: 5, category: 'C', location: 'L' },
      { name: 'B', sku: 'B-001', quantity: 20, price: 8, category: 'C', location: 'L' },
    ], 'Initial shipment');

    const adds = inv.transactionLog.getByAction('add');
    assert.equal(adds.length, 2);
    assert.equal(adds[0].reason, 'Initial shipment');
    assert.equal(adds[1].reason, 'Initial shipment');
  });

  it('should support date range queries on transaction log', () => {
    const before = new Date();
    inv.addItem({ name: 'A', sku: 'A-001', quantity: 10, price: 5, category: 'C', location: 'L' });
    const after = new Date(Date.now() + 1000);

    const results = inv.transactionLog.getByDateRange(before, after);
    assert.equal(results.length, 1);
  });

  it('should clear transaction log independently of inventory', () => {
    inv.addItem({ name: 'A', sku: 'A-001', quantity: 10, price: 5, category: 'C', location: 'L' });
    assert.equal(inv.transactionLog.length, 1);

    inv.transactionLog.clear();
    assert.equal(inv.transactionLog.length, 0);
    assert.equal(inv.itemCount, 1); // items still exist
  });
});
