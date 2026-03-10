'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { Inventory } = require('../../src/index');

describe('Integration: Inventory + Events + LowStock', () => {
  let inv;
  let events;

  beforeEach(() => {
    inv = new Inventory({ lowStockThreshold: 20 });
    events = [];
    inv.on('item-added', (d) => events.push({ type: 'item-added', data: d }));
    inv.on('item-removed', (d) => events.push({ type: 'item-removed', data: d }));
    inv.on('item-updated', (d) => events.push({ type: 'item-updated', data: d }));
    inv.on('low-stock-alert', (d) => events.push({ type: 'low-stock-alert', data: d }));
  });

  it('should emit events in correct order during lifecycle', () => {
    inv.addItem({ name: 'A', sku: 'A-001', quantity: 50, price: 5, category: 'C', location: 'L' });
    inv.updateItem('A-001', { quantity: 10 }); // triggers low-stock
    inv.removeItem('A-001');

    assert.equal(events.length, 4);
    assert.equal(events[0].type, 'item-added');
    assert.equal(events[1].type, 'item-updated');
    assert.equal(events[2].type, 'low-stock-alert');
    assert.equal(events[3].type, 'item-removed');
  });

  it('should emit low-stock-alert during bulk update', () => {
    inv.addItem({ name: 'A', sku: 'A-001', quantity: 50, price: 5, category: 'C', location: 'L' });
    inv.addItem({ name: 'B', sku: 'B-001', quantity: 50, price: 5, category: 'C', location: 'L' });

    events = []; // reset
    inv.bulkUpdateQuantities([
      { sku: 'A-001', quantity: 5 },
      { sku: 'B-001', quantity: 3 },
    ]);

    const alerts = events.filter(e => e.type === 'low-stock-alert');
    assert.equal(alerts.length, 2);
  });

  it('should emit low-stock-alert during import', () => {
    const importData = {
      items: [
        { name: 'Low', sku: 'LOW-001', quantity: 2, price: 5, category: 'C', location: 'L' },
      ],
    };

    events = [];
    inv.importFromJSON(importData, { mode: 'merge' });

    const alerts = events.filter(e => e.type === 'low-stock-alert');
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0].data.sku, 'LOW-001');
  });

  it('should emit events for each item in bulkAdd', () => {
    events = [];
    inv.bulkAdd([
      { name: 'A', sku: 'A-001', quantity: 50, price: 5, category: 'C', location: 'L' },
      { name: 'B', sku: 'B-001', quantity: 50, price: 5, category: 'C', location: 'L' },
    ]);

    const adds = events.filter(e => e.type === 'item-added');
    assert.equal(adds.length, 2);
  });

  it('should use per-item threshold for low-stock-alert in bulk ops', () => {
    inv.addItem({ name: 'A', sku: 'A-001', quantity: 50, price: 5, category: 'C', location: 'L', lowStockThreshold: 60 });
    events = [];
    inv.updateItem('A-001', { quantity: 55 }); // 55 < 60 per-item threshold

    const alerts = events.filter(e => e.type === 'low-stock-alert');
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0].data.threshold, 60);
  });
});
