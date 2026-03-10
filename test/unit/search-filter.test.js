'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { Inventory } = require('../../src/index');

describe('Inventory - searchByName', () => {
  let inv;

  beforeEach(() => {
    inv = new Inventory();
    inv.addItem({ name: 'Blue Widget', sku: 'BW-001', quantity: 10, price: 5, category: 'Parts', location: 'A1' });
    inv.addItem({ name: 'Red Widget', sku: 'RW-001', quantity: 20, price: 8, category: 'Parts', location: 'A2' });
    inv.addItem({ name: 'Green Gadget', sku: 'GG-001', quantity: 30, price: 12, category: 'Gadgets', location: 'B1' });
  });

  it('should find items by substring', () => {
    const results = inv.searchByName('Widget');
    assert.equal(results.length, 2);
  });

  it('should be case-insensitive', () => {
    const results = inv.searchByName('widget');
    assert.equal(results.length, 2);
  });

  it('should return empty array for no matches', () => {
    const results = inv.searchByName('Nonexistent');
    assert.equal(results.length, 0);
  });

  it('should match partial names', () => {
    const results = inv.searchByName('Gad');
    assert.equal(results.length, 1);
    assert.equal(results[0].sku, 'GG-001');
  });
});

describe('Inventory - filterItems', () => {
  let inv;

  beforeEach(() => {
    inv = new Inventory();
    inv.addItem({ name: 'Blue Widget', sku: 'BW-001', quantity: 10, price: 5, category: 'Parts', location: 'Warehouse A' });
    inv.addItem({ name: 'Red Widget', sku: 'RW-001', quantity: 20, price: 8, category: 'Parts', location: 'Warehouse B' });
    inv.addItem({ name: 'Green Gadget', sku: 'GG-001', quantity: 30, price: 12, category: 'Gadgets', location: 'Warehouse A' });
    inv.addItem({ name: 'Yellow Doohickey', sku: 'YD-001', quantity: 5, price: 25, category: 'Premium', location: 'Warehouse B' });
  });

  it('should filter by category', () => {
    const results = inv.filterItems({ category: 'Parts' });
    assert.equal(results.length, 2);
  });

  it('should filter by category case-insensitively', () => {
    const results = inv.filterItems({ category: 'parts' });
    assert.equal(results.length, 2);
  });

  it('should filter by location', () => {
    const results = inv.filterItems({ location: 'Warehouse A' });
    assert.equal(results.length, 2);
  });

  it('should filter by location case-insensitively', () => {
    const results = inv.filterItems({ location: 'warehouse a' });
    assert.equal(results.length, 2);
  });

  it('should filter by min price', () => {
    const results = inv.filterItems({ minPrice: 10 });
    assert.equal(results.length, 2);
  });

  it('should filter by max price', () => {
    const results = inv.filterItems({ maxPrice: 10 });
    assert.equal(results.length, 2);
  });

  it('should filter by price range', () => {
    const results = inv.filterItems({ minPrice: 6, maxPrice: 15 });
    assert.equal(results.length, 2);
  });

  it('should filter by name', () => {
    const results = inv.filterItems({ name: 'Widget' });
    assert.equal(results.length, 2);
  });

  it('should combine multiple filters (AND logic)', () => {
    const results = inv.filterItems({ category: 'Parts', location: 'Warehouse A' });
    assert.equal(results.length, 1);
    assert.equal(results[0].sku, 'BW-001');
  });

  it('should return all items with empty filters', () => {
    const results = inv.filterItems({});
    assert.equal(results.length, 4);
  });

  it('should return empty array when no matches', () => {
    const results = inv.filterItems({ category: 'Nonexistent' });
    assert.equal(results.length, 0);
  });
});
