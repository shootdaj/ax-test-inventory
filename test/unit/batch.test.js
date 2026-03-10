'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { Inventory } = require('../../src/index');

describe('Inventory - Batch Operations', () => {
  let inv;

  beforeEach(() => {
    inv = new Inventory();
  });

  describe('bulkAdd', () => {
    it('should add multiple items at once', () => {
      const items = [
        { name: 'A', sku: 'A-001', quantity: 10, price: 5, category: 'C', location: 'L' },
        { name: 'B', sku: 'B-001', quantity: 20, price: 8, category: 'C', location: 'L' },
        { name: 'C', sku: 'C-001', quantity: 30, price: 12, category: 'C', location: 'L' },
      ];
      const result = inv.bulkAdd(items);
      assert.equal(result.length, 3);
      assert.equal(inv.itemCount, 3);
    });

    it('should be atomic — fail if any item is invalid', () => {
      const items = [
        { name: 'A', sku: 'A-001', quantity: 10, price: 5, category: 'C', location: 'L' },
        { name: 'B', sku: 'B-001', quantity: -1, price: 8, category: 'C', location: 'L' }, // invalid
      ];
      assert.throws(() => inv.bulkAdd(items), /non-negative/);
      assert.equal(inv.itemCount, 0); // none were added
    });

    it('should fail if any SKU already exists', () => {
      inv.addItem({ name: 'A', sku: 'A-001', quantity: 10, price: 5, category: 'C', location: 'L' });
      const items = [
        { name: 'B', sku: 'B-001', quantity: 20, price: 8, category: 'C', location: 'L' },
        { name: 'A2', sku: 'A-001', quantity: 30, price: 12, category: 'C', location: 'L' }, // duplicate
      ];
      assert.throws(() => inv.bulkAdd(items), /already exists/);
      assert.equal(inv.itemCount, 1); // only original
    });

    it('should fail if batch contains duplicate SKUs', () => {
      const items = [
        { name: 'A', sku: 'A-001', quantity: 10, price: 5, category: 'C', location: 'L' },
        { name: 'A2', sku: 'A-001', quantity: 20, price: 8, category: 'C', location: 'L' },
      ];
      assert.throws(() => inv.bulkAdd(items), /Duplicate SKU/);
      assert.equal(inv.itemCount, 0);
    });

    it('should accept custom reason', () => {
      inv.bulkAdd(
        [{ name: 'A', sku: 'A-001', quantity: 10, price: 5, category: 'C', location: 'L' }],
        'Shipment received'
      );
      const log = inv.transactionLog.getBySku('A-001');
      assert.equal(log[0].reason, 'Shipment received');
    });
  });

  describe('bulkUpdateQuantities', () => {
    beforeEach(() => {
      inv.addItem({ name: 'A', sku: 'A-001', quantity: 10, price: 5, category: 'C', location: 'L' });
      inv.addItem({ name: 'B', sku: 'B-001', quantity: 20, price: 8, category: 'C', location: 'L' });
    });

    it('should update quantities for multiple items', () => {
      const results = inv.bulkUpdateQuantities([
        { sku: 'A-001', quantity: 50 },
        { sku: 'B-001', quantity: 100 },
      ]);
      assert.equal(results.length, 2);
      assert.equal(inv.getItem('A-001').quantity, 50);
      assert.equal(inv.getItem('B-001').quantity, 100);
    });

    it('should be atomic — fail if any SKU not found', () => {
      assert.throws(() => inv.bulkUpdateQuantities([
        { sku: 'A-001', quantity: 50 },
        { sku: 'NOPE', quantity: 100 },
      ]), /not found/);
      // Original quantities unchanged
      assert.equal(inv.getItem('A-001').quantity, 10);
    });

    it('should fail on negative quantity', () => {
      assert.throws(() => inv.bulkUpdateQuantities([
        { sku: 'A-001', quantity: -5 },
      ]), /Invalid quantity/);
      assert.equal(inv.getItem('A-001').quantity, 10);
    });

    it('should fail if sku field is missing', () => {
      assert.throws(() => inv.bulkUpdateQuantities([
        { quantity: 50 },
      ]), /must have a sku/);
    });

    it('should accept custom reason', () => {
      inv.bulkUpdateQuantities(
        [{ sku: 'A-001', quantity: 50 }],
        'Recount'
      );
      const log = inv.transactionLog.getByAction('update');
      const lastUpdate = log[log.length - 1];
      assert.equal(lastUpdate.reason, 'Recount');
    });
  });
});
