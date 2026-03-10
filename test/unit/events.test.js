'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { Inventory } = require('../../src/index');

describe('Inventory - Events', () => {
  let inv;

  beforeEach(() => {
    inv = new Inventory({ lowStockThreshold: 10 });
  });

  it('should emit item-added on addItem', () => {
    let emitted = null;
    inv.on('item-added', (data) => { emitted = data; });
    inv.addItem({ name: 'A', sku: 'A-001', quantity: 50, price: 5, category: 'C', location: 'L' });
    assert.ok(emitted);
    assert.equal(emitted.sku, 'A-001');
    assert.equal(emitted.name, 'A');
  });

  it('should emit item-removed on removeItem', () => {
    inv.addItem({ name: 'A', sku: 'A-001', quantity: 50, price: 5, category: 'C', location: 'L' });
    let emitted = null;
    inv.on('item-removed', (data) => { emitted = data; });
    inv.removeItem('A-001');
    assert.ok(emitted);
    assert.equal(emitted.sku, 'A-001');
  });

  it('should emit item-updated on updateItem', () => {
    inv.addItem({ name: 'A', sku: 'A-001', quantity: 50, price: 5, category: 'C', location: 'L' });
    let emitted = null;
    inv.on('item-updated', (data) => { emitted = data; });
    inv.updateItem('A-001', { quantity: 25 });
    assert.ok(emitted);
    assert.equal(emitted.oldItem.quantity, 50);
    assert.equal(emitted.newItem.quantity, 25);
  });

  it('should emit low-stock-alert when quantity drops below threshold', () => {
    inv.addItem({ name: 'A', sku: 'A-001', quantity: 50, price: 5, category: 'C', location: 'L' });
    let alert = null;
    inv.on('low-stock-alert', (data) => { alert = data; });
    inv.updateItem('A-001', { quantity: 5 });
    assert.ok(alert);
    assert.equal(alert.sku, 'A-001');
    assert.equal(alert.quantity, 5);
    assert.equal(alert.threshold, 10);
  });

  it('should emit low-stock-alert on addItem when quantity is below threshold', () => {
    let alert = null;
    inv.on('low-stock-alert', (data) => { alert = data; });
    inv.addItem({ name: 'A', sku: 'A-001', quantity: 3, price: 5, category: 'C', location: 'L' });
    assert.ok(alert);
    assert.equal(alert.quantity, 3);
  });

  it('should NOT emit low-stock-alert when quantity is above threshold', () => {
    let alert = null;
    inv.on('low-stock-alert', (data) => { alert = data; });
    inv.addItem({ name: 'A', sku: 'A-001', quantity: 50, price: 5, category: 'C', location: 'L' });
    assert.equal(alert, null);
  });

  it('should use per-item threshold for low-stock-alert', () => {
    inv.addItem({ name: 'A', sku: 'A-001', quantity: 50, price: 5, category: 'C', location: 'L', lowStockThreshold: 60 });
    let alert = null;
    inv.on('low-stock-alert', (data) => { alert = data; });
    // Quantity 50 is below per-item threshold 60 — already emitted on add
    // Let's check with update
    inv.updateItem('A-001', { quantity: 55 });
    assert.ok(alert);
    assert.equal(alert.threshold, 60);
  });

  it('should not emit item-updated when no fields changed', () => {
    inv.addItem({ name: 'A', sku: 'A-001', quantity: 50, price: 5, category: 'C', location: 'L' });
    let emitted = false;
    inv.on('item-updated', () => { emitted = true; });
    inv.updateItem('A-001', {});
    assert.equal(emitted, false);
  });
});
