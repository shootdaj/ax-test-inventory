'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { Inventory } = require('../../src/index');

describe('Inventory - Constructor', () => {
  it('should create with default config', () => {
    const inv = new Inventory();
    assert.equal(inv.itemCount, 0);
    assert.equal(inv.lowStockThreshold, 10);
  });

  it('should accept custom lowStockThreshold', () => {
    const inv = new Inventory({ lowStockThreshold: 5 });
    assert.equal(inv.lowStockThreshold, 5);
  });

  it('should extend EventEmitter', () => {
    const inv = new Inventory();
    assert.equal(typeof inv.on, 'function');
    assert.equal(typeof inv.emit, 'function');
  });
});

describe('Inventory - addItem', () => {
  let inv;
  const validItem = {
    name: 'Widget',
    sku: 'WDG-001',
    quantity: 100,
    price: 9.99,
    category: 'Parts',
    location: 'Warehouse A',
  };

  beforeEach(() => {
    inv = new Inventory();
  });

  it('should add a valid item', () => {
    const result = inv.addItem(validItem);
    assert.equal(result.name, 'Widget');
    assert.equal(result.sku, 'WDG-001');
    assert.equal(result.quantity, 100);
    assert.equal(result.price, 9.99);
    assert.equal(result.category, 'Parts');
    assert.equal(result.location, 'Warehouse A');
    assert.ok(result.createdAt);
    assert.ok(result.updatedAt);
    assert.equal(inv.itemCount, 1);
  });

  it('should throw on duplicate SKU', () => {
    inv.addItem(validItem);
    assert.throws(() => inv.addItem(validItem), /already exists/);
  });

  it('should throw on missing required fields', () => {
    assert.throws(() => inv.addItem({ name: 'X' }), /Missing required field/);
    assert.throws(() => inv.addItem({}), /Missing required field/);
  });

  it('should throw on negative quantity', () => {
    assert.throws(() => inv.addItem({ ...validItem, quantity: -1 }), /non-negative/);
  });

  it('should throw on negative price', () => {
    assert.throws(() => inv.addItem({ ...validItem, price: -5 }), /non-negative/);
  });

  it('should throw on empty name', () => {
    assert.throws(() => inv.addItem({ ...validItem, name: '' }), /non-empty string/);
  });

  it('should throw on empty SKU', () => {
    assert.throws(() => inv.addItem({ ...validItem, sku: '' }), /non-empty string/);
  });

  it('should throw on null item data', () => {
    assert.throws(() => inv.addItem(null), /must be an object/);
  });

  it('should accept per-item lowStockThreshold', () => {
    const result = inv.addItem({ ...validItem, lowStockThreshold: 20 });
    assert.equal(result.lowStockThreshold, 20);
  });

  it('should accept custom reason', () => {
    inv.addItem(validItem, 'New product launch');
    const log = inv.transactionLog.getBySku('WDG-001');
    assert.equal(log[0].reason, 'New product launch');
  });
});

describe('Inventory - removeItem', () => {
  let inv;

  beforeEach(() => {
    inv = new Inventory();
    inv.addItem({ name: 'Widget', sku: 'WDG-001', quantity: 100, price: 9.99, category: 'Parts', location: 'A1' });
  });

  it('should remove an existing item', () => {
    const removed = inv.removeItem('WDG-001');
    assert.equal(removed.sku, 'WDG-001');
    assert.equal(inv.itemCount, 0);
    assert.equal(inv.getItem('WDG-001'), null);
  });

  it('should throw on non-existent SKU', () => {
    assert.throws(() => inv.removeItem('NONEXISTENT'), /not found/);
  });

  it('should accept custom reason', () => {
    inv.removeItem('WDG-001', 'Discontinued');
    const log = inv.transactionLog.getByAction('remove');
    assert.equal(log[0].reason, 'Discontinued');
  });
});

describe('Inventory - updateItem', () => {
  let inv;

  beforeEach(() => {
    inv = new Inventory();
    inv.addItem({ name: 'Widget', sku: 'WDG-001', quantity: 100, price: 9.99, category: 'Parts', location: 'A1' });
  });

  it('should update quantity', () => {
    const result = inv.updateItem('WDG-001', { quantity: 50 });
    assert.equal(result.quantity, 50);
  });

  it('should update multiple fields', () => {
    const result = inv.updateItem('WDG-001', { price: 12.99, location: 'B2' });
    assert.equal(result.price, 12.99);
    assert.equal(result.location, 'B2');
  });

  it('should update name', () => {
    const result = inv.updateItem('WDG-001', { name: 'Super Widget' });
    assert.equal(result.name, 'Super Widget');
  });

  it('should update category', () => {
    const result = inv.updateItem('WDG-001', { category: 'Premium Parts' });
    assert.equal(result.category, 'Premium Parts');
  });

  it('should throw on non-existent SKU', () => {
    assert.throws(() => inv.updateItem('NOPE', { quantity: 5 }), /not found/);
  });

  it('should throw on negative quantity', () => {
    assert.throws(() => inv.updateItem('WDG-001', { quantity: -1 }), /cannot be negative/);
  });

  it('should throw on negative price', () => {
    assert.throws(() => inv.updateItem('WDG-001', { price: -5 }), /cannot be negative/);
  });

  it('should return unchanged item if no valid updates', () => {
    const result = inv.updateItem('WDG-001', {});
    assert.equal(result.quantity, 100);
  });

  it('should update updatedAt timestamp', () => {
    const before = inv.getItem('WDG-001').updatedAt;
    // Small delay to ensure timestamp difference
    const result = inv.updateItem('WDG-001', { quantity: 50 });
    assert.ok(result.updatedAt >= before);
  });
});

describe('Inventory - getItem', () => {
  let inv;

  beforeEach(() => {
    inv = new Inventory();
    inv.addItem({ name: 'Widget', sku: 'WDG-001', quantity: 100, price: 9.99, category: 'Parts', location: 'A1' });
  });

  it('should return item by SKU', () => {
    const item = inv.getItem('WDG-001');
    assert.equal(item.name, 'Widget');
    assert.equal(item.sku, 'WDG-001');
  });

  it('should return null for non-existent SKU', () => {
    assert.equal(inv.getItem('NOPE'), null);
  });

  it('should return a copy, not a reference', () => {
    const item1 = inv.getItem('WDG-001');
    item1.quantity = 999;
    const item2 = inv.getItem('WDG-001');
    assert.equal(item2.quantity, 100);
  });
});

describe('Inventory - listItems', () => {
  let inv;

  beforeEach(() => {
    inv = new Inventory();
  });

  it('should return empty array when no items', () => {
    assert.deepEqual(inv.listItems(), []);
  });

  it('should return all items', () => {
    inv.addItem({ name: 'A', sku: 'A-001', quantity: 10, price: 1, category: 'C', location: 'L' });
    inv.addItem({ name: 'B', sku: 'B-001', quantity: 20, price: 2, category: 'C', location: 'L' });
    const items = inv.listItems();
    assert.equal(items.length, 2);
  });

  it('should return copies', () => {
    inv.addItem({ name: 'A', sku: 'A-001', quantity: 10, price: 1, category: 'C', location: 'L' });
    const items = inv.listItems();
    items[0].quantity = 999;
    assert.equal(inv.getItem('A-001').quantity, 10);
  });
});

describe('Inventory - lowStockThreshold', () => {
  it('should get and set global threshold', () => {
    const inv = new Inventory({ lowStockThreshold: 15 });
    assert.equal(inv.lowStockThreshold, 15);
    inv.lowStockThreshold = 20;
    assert.equal(inv.lowStockThreshold, 20);
  });

  it('should throw on negative threshold', () => {
    const inv = new Inventory();
    assert.throws(() => { inv.lowStockThreshold = -1; }, /non-negative/);
  });

  it('should throw on non-number threshold', () => {
    const inv = new Inventory();
    assert.throws(() => { inv.lowStockThreshold = 'abc'; }, /non-negative/);
  });

  it('should set per-item threshold', () => {
    const inv = new Inventory();
    inv.addItem({ name: 'A', sku: 'A-001', quantity: 10, price: 1, category: 'C', location: 'L' });
    inv.setItemThreshold('A-001', 25);
    assert.equal(inv.getItemThreshold('A-001'), 25);
  });

  it('should throw setItemThreshold on non-existent SKU', () => {
    const inv = new Inventory();
    assert.throws(() => inv.setItemThreshold('NOPE', 5), /not found/);
  });

  it('should throw getItemThreshold on non-existent SKU', () => {
    const inv = new Inventory();
    assert.throws(() => inv.getItemThreshold('NOPE'), /not found/);
  });

  it('should use global default when no per-item threshold set', () => {
    const inv = new Inventory({ lowStockThreshold: 15 });
    inv.addItem({ name: 'A', sku: 'A-001', quantity: 10, price: 1, category: 'C', location: 'L' });
    assert.equal(inv.getItemThreshold('A-001'), 15);
  });
});
