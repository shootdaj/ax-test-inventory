'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { Inventory } = require('../../src/index');

describe('Inventory - Reports', () => {
  let inv;

  beforeEach(() => {
    inv = new Inventory({ lowStockThreshold: 10 });
    inv.addItem({ name: 'Widget A', sku: 'A-001', quantity: 100, price: 10, category: 'Parts', location: 'A1' });
    inv.addItem({ name: 'Widget B', sku: 'B-001', quantity: 50, price: 20, category: 'Parts', location: 'A2' });
    inv.addItem({ name: 'Gadget C', sku: 'C-001', quantity: 5, price: 100, category: 'Gadgets', location: 'B1' });
    inv.addItem({ name: 'Gadget D', sku: 'D-001', quantity: 200, price: 5, category: 'Gadgets', location: 'B2' });
  });

  describe('getStockValuation', () => {
    it('should return total valuation', () => {
      // 100*10 + 50*20 + 5*100 + 200*5 = 1000 + 1000 + 500 + 1000 = 3500
      assert.equal(inv.getStockValuation(), 3500);
    });

    it('should return 0 for empty inventory', () => {
      const empty = new Inventory();
      assert.equal(empty.getStockValuation(), 0);
    });
  });

  describe('getCategoryBreakdown', () => {
    it('should return breakdown by category', () => {
      const breakdown = inv.getCategoryBreakdown();
      assert.equal(Object.keys(breakdown).length, 2);

      assert.equal(breakdown['Parts'].itemCount, 2);
      assert.equal(breakdown['Parts'].totalQuantity, 150);
      assert.equal(breakdown['Parts'].totalValue, 2000); // 100*10 + 50*20

      assert.equal(breakdown['Gadgets'].itemCount, 2);
      assert.equal(breakdown['Gadgets'].totalQuantity, 205);
      assert.equal(breakdown['Gadgets'].totalValue, 1500); // 5*100 + 200*5
    });

    it('should return empty object for empty inventory', () => {
      const empty = new Inventory();
      assert.deepEqual(empty.getCategoryBreakdown(), {});
    });
  });

  describe('getLowStockItems', () => {
    it('should return items below threshold', () => {
      const lowStock = inv.getLowStockItems();
      assert.equal(lowStock.length, 1);
      assert.equal(lowStock[0].sku, 'C-001');
    });

    it('should return empty array when no items below threshold', () => {
      const inv2 = new Inventory({ lowStockThreshold: 1 });
      inv2.addItem({ name: 'A', sku: 'A-001', quantity: 10, price: 1, category: 'C', location: 'L' });
      assert.equal(inv2.getLowStockItems().length, 0);
    });

    it('should respect per-item thresholds', () => {
      inv.setItemThreshold('A-001', 200);
      const lowStock = inv.getLowStockItems();
      assert.equal(lowStock.length, 2); // C-001 (5 < 10) and A-001 (100 < 200)
    });
  });

  describe('getMostStocked', () => {
    it('should return top N by quantity', () => {
      const top = inv.getMostStocked(2);
      assert.equal(top.length, 2);
      assert.equal(top[0].sku, 'D-001'); // 200
      assert.equal(top[1].sku, 'A-001'); // 100
    });

    it('should default to 5', () => {
      const top = inv.getMostStocked();
      assert.equal(top.length, 4); // only 4 items exist
    });
  });

  describe('getLeastStocked', () => {
    it('should return bottom N by quantity', () => {
      const bottom = inv.getLeastStocked(2);
      assert.equal(bottom.length, 2);
      assert.equal(bottom[0].sku, 'C-001'); // 5
      assert.equal(bottom[1].sku, 'B-001'); // 50
    });

    it('should default to 5', () => {
      const bottom = inv.getLeastStocked();
      assert.equal(bottom.length, 4);
    });
  });
});
