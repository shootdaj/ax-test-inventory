'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { Inventory } = require('../../src/index');

describe('Inventory - Import/Export', () => {
  let inv;

  beforeEach(() => {
    inv = new Inventory({ lowStockThreshold: 10 });
    inv.addItem({ name: 'Widget A', sku: 'A-001', quantity: 100, price: 10, category: 'Parts', location: 'A1' });
    inv.addItem({ name: 'Widget B', sku: 'B-001', quantity: 50, price: 20, category: 'Parts', location: 'A2' });
  });

  describe('exportToJSON', () => {
    it('should export inventory data', () => {
      const data = inv.exportToJSON();
      assert.ok(data.exportedAt);
      assert.equal(data.config.lowStockThreshold, 10);
      assert.equal(data.items.length, 2);
      assert.ok(Array.isArray(data.transactionLog));
    });

    it('should include all item fields', () => {
      const data = inv.exportToJSON();
      const item = data.items.find(i => i.sku === 'A-001');
      assert.equal(item.name, 'Widget A');
      assert.equal(item.quantity, 100);
      assert.equal(item.price, 10);
      assert.equal(item.category, 'Parts');
      assert.equal(item.location, 'A1');
    });
  });

  describe('importFromJSON - replace mode', () => {
    it('should replace existing inventory', () => {
      const exportedData = inv.exportToJSON();

      const inv2 = new Inventory();
      inv2.addItem({ name: 'Old', sku: 'OLD-001', quantity: 1, price: 1, category: 'X', location: 'X' });

      const count = inv2.importFromJSON(exportedData, { mode: 'replace' });
      assert.equal(count, 2);
      assert.equal(inv2.itemCount, 2);
      assert.equal(inv2.getItem('OLD-001'), null);
      assert.equal(inv2.getItem('A-001').name, 'Widget A');
    });

    it('should restore config', () => {
      const exportedData = inv.exportToJSON();
      const inv2 = new Inventory({ lowStockThreshold: 99 });
      inv2.importFromJSON(exportedData, { mode: 'replace' });
      assert.equal(inv2.lowStockThreshold, 10);
    });
  });

  describe('importFromJSON - merge mode', () => {
    it('should add new items to existing inventory', () => {
      const newData = {
        items: [
          { name: 'New Item', sku: 'NEW-001', quantity: 75, price: 15, category: 'New', location: 'C1' },
        ],
      };
      const count = inv.importFromJSON(newData, { mode: 'merge' });
      assert.equal(count, 1);
      assert.equal(inv.itemCount, 3);
      assert.equal(inv.getItem('NEW-001').name, 'New Item');
    });

    it('should update existing items in merge mode', () => {
      const mergeData = {
        items: [
          { name: 'Updated Widget A', sku: 'A-001', quantity: 200, price: 15, category: 'Parts', location: 'A1' },
        ],
      };
      inv.importFromJSON(mergeData, { mode: 'merge' });
      assert.equal(inv.getItem('A-001').name, 'Updated Widget A');
      assert.equal(inv.getItem('A-001').quantity, 200);
      assert.equal(inv.getItem('A-001').price, 15);
    });

    it('should default to merge mode', () => {
      const newData = {
        items: [
          { name: 'New', sku: 'NEW-001', quantity: 5, price: 1, category: 'C', location: 'L' },
        ],
      };
      inv.importFromJSON(newData);
      assert.equal(inv.itemCount, 3);
    });
  });

  describe('importFromJSON - validation', () => {
    it('should throw on invalid data', () => {
      assert.throws(() => inv.importFromJSON(null), /Invalid import data/);
      assert.throws(() => inv.importFromJSON({}), /Invalid import data/);
      assert.throws(() => inv.importFromJSON({ items: 'not-array' }), /Invalid import data/);
    });
  });

  describe('roundtrip', () => {
    it('should export and import without data loss', () => {
      const exported = inv.exportToJSON();
      const inv2 = new Inventory();
      inv2.importFromJSON(exported, { mode: 'replace' });

      assert.equal(inv2.itemCount, inv.itemCount);
      assert.equal(inv2.getItem('A-001').name, 'Widget A');
      assert.equal(inv2.getItem('B-001').name, 'Widget B');
      assert.equal(inv2.lowStockThreshold, 10);
    });
  });
});
