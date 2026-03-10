'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { Inventory } = require('../../src/index');

describe('Scenario: Complete Inventory Management Workflow', () => {
  it('should handle a full warehouse workflow', () => {
    // 1. Initialize inventory
    const inv = new Inventory({ lowStockThreshold: 10 });
    const alerts = [];
    inv.on('low-stock-alert', (data) => alerts.push(data));

    // 2. Bulk add initial stock
    inv.bulkAdd([
      { name: 'Laptop', sku: 'LAP-001', quantity: 50, price: 999.99, category: 'Electronics', location: 'Shelf A1' },
      { name: 'Mouse', sku: 'MOU-001', quantity: 200, price: 29.99, category: 'Accessories', location: 'Shelf B2' },
      { name: 'Keyboard', sku: 'KEY-001', quantity: 150, price: 79.99, category: 'Accessories', location: 'Shelf B3' },
      { name: 'Monitor', sku: 'MON-001', quantity: 30, price: 449.99, category: 'Electronics', location: 'Shelf A2' },
      { name: 'USB Cable', sku: 'USB-001', quantity: 500, price: 9.99, category: 'Accessories', location: 'Shelf C1' },
    ], 'Initial warehouse setup');
    assert.equal(inv.itemCount, 5);

    // 3. Check stock valuation
    const valuation = inv.getStockValuation();
    assert.ok(valuation > 0);

    // 4. Sell some items (reduce quantities)
    inv.updateItem('LAP-001', { quantity: 45 }, 'Sold 5 laptops');
    inv.updateItem('MOU-001', { quantity: 180 }, 'Sold 20 mice');

    // 5. Search for items
    const accessories = inv.filterItems({ category: 'Accessories' });
    assert.equal(accessories.length, 3);

    const keyboards = inv.searchByName('keyboard');
    assert.equal(keyboards.length, 1);

    // 6. Price range filter
    const expensive = inv.filterItems({ minPrice: 100 });
    assert.equal(expensive.length, 2); // Laptop and Monitor

    // 7. Combined filter
    const cheapAccessories = inv.filterItems({ category: 'Accessories', maxPrice: 50 });
    assert.equal(cheapAccessories.length, 2); // Mouse (29.99) and USB Cable (9.99)

    // 8. Category breakdown
    const breakdown = inv.getCategoryBreakdown();
    assert.equal(Object.keys(breakdown).length, 2);
    assert.ok(breakdown['Electronics']);
    assert.ok(breakdown['Accessories']);

    // 9. Simulate heavy selling — trigger low-stock alert
    inv.updateItem('MON-001', { quantity: 5 }, 'Big sale event');
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0].sku, 'MON-001');

    // 10. Check low stock report
    const lowStock = inv.getLowStockItems();
    assert.equal(lowStock.length, 1);
    assert.equal(lowStock[0].sku, 'MON-001');

    // 11. Restock via bulk update
    inv.bulkUpdateQuantities([
      { sku: 'MON-001', quantity: 50 },
      { sku: 'LAP-001', quantity: 100 },
    ], 'Restocked from supplier');

    assert.equal(inv.getItem('MON-001').quantity, 50);
    assert.equal(inv.getItem('LAP-001').quantity, 100);

    // 12. Check most/least stocked
    const mostStocked = inv.getMostStocked(3);
    assert.equal(mostStocked.length, 3);
    assert.ok(mostStocked[0].quantity >= mostStocked[1].quantity);

    const leastStocked = inv.getLeastStocked(2);
    assert.equal(leastStocked.length, 2);
    assert.ok(leastStocked[0].quantity <= leastStocked[1].quantity);

    // 13. Remove discontinued item
    inv.removeItem('USB-001', 'Product discontinued');
    assert.equal(inv.itemCount, 4);
    assert.equal(inv.getItem('USB-001'), null);

    // 14. Verify transaction log
    const log = inv.transactionLog;
    assert.ok(log.length > 0);

    const addEntries = log.getByAction('add');
    assert.equal(addEntries.length, 5); // initial bulk add

    const updateEntries = log.getByAction('update');
    assert.ok(updateEntries.length >= 4); // various updates

    const removeEntries = log.getByAction('remove');
    assert.equal(removeEntries.length, 1);

    // 15. Export and reimport
    const exported = inv.exportToJSON();
    assert.equal(exported.items.length, 4);

    const inv2 = new Inventory();
    inv2.importFromJSON(exported, { mode: 'replace' });
    assert.equal(inv2.itemCount, 4);
    assert.equal(inv2.getItem('LAP-001').quantity, 100);
  });
});

describe('Scenario: Multi-location Inventory Tracking', () => {
  it('should track items across locations and generate reports', () => {
    const inv = new Inventory({ lowStockThreshold: 5 });

    // Set up multi-location inventory
    inv.bulkAdd([
      { name: 'Widget', sku: 'WDG-NY', quantity: 100, price: 10, category: 'Widgets', location: 'New York' },
      { name: 'Widget', sku: 'WDG-LA', quantity: 80, price: 10, category: 'Widgets', location: 'Los Angeles' },
      { name: 'Gadget', sku: 'GDG-NY', quantity: 50, price: 25, category: 'Gadgets', location: 'New York' },
      { name: 'Gadget', sku: 'GDG-LA', quantity: 30, price: 25, category: 'Gadgets', location: 'Los Angeles' },
    ]);

    // Filter by location
    const nyItems = inv.filterItems({ location: 'New York' });
    assert.equal(nyItems.length, 2);

    const laItems = inv.filterItems({ location: 'Los Angeles' });
    assert.equal(laItems.length, 2);

    // Category breakdown
    const breakdown = inv.getCategoryBreakdown();
    assert.equal(breakdown['Widgets'].itemCount, 2);
    assert.equal(breakdown['Widgets'].totalQuantity, 180);
    assert.equal(breakdown['Gadgets'].itemCount, 2);
    assert.equal(breakdown['Gadgets'].totalQuantity, 80);

    // Total valuation
    const val = inv.getStockValuation();
    // 100*10 + 80*10 + 50*25 + 30*25 = 1000+800+1250+750 = 3800
    assert.equal(val, 3800);

    // Combined filter: Widgets in New York
    const nyWidgets = inv.filterItems({ category: 'Widgets', location: 'New York' });
    assert.equal(nyWidgets.length, 1);
    assert.equal(nyWidgets[0].sku, 'WDG-NY');
  });
});

describe('Scenario: Import/Export Backup and Restore', () => {
  it('should backup, modify, and restore inventory', () => {
    const inv = new Inventory({ lowStockThreshold: 10 });

    // Set up inventory
    inv.addItem({ name: 'A', sku: 'A-001', quantity: 100, price: 10, category: 'C', location: 'L' });
    inv.addItem({ name: 'B', sku: 'B-001', quantity: 200, price: 20, category: 'C', location: 'L' });

    // Take backup
    const backup = inv.exportToJSON();

    // Make destructive changes
    inv.removeItem('A-001');
    inv.updateItem('B-001', { quantity: 0 }, 'Stock depleted');

    assert.equal(inv.itemCount, 1);
    assert.equal(inv.getItem('B-001').quantity, 0);

    // Restore from backup
    inv.importFromJSON(backup, { mode: 'replace' });

    assert.equal(inv.itemCount, 2);
    assert.equal(inv.getItem('A-001').quantity, 100);
    assert.equal(inv.getItem('B-001').quantity, 200);
  });

  it('should merge imported data with existing inventory', () => {
    const inv = new Inventory();
    inv.addItem({ name: 'Existing', sku: 'EX-001', quantity: 50, price: 10, category: 'C', location: 'L' });

    const importData = {
      items: [
        { name: 'New Item', sku: 'NEW-001', quantity: 30, price: 15, category: 'C', location: 'L' },
        { name: 'Updated Existing', sku: 'EX-001', quantity: 100, price: 12, category: 'C', location: 'L' },
      ],
    };

    inv.importFromJSON(importData, { mode: 'merge' });

    assert.equal(inv.itemCount, 2);
    assert.equal(inv.getItem('EX-001').quantity, 100); // updated
    assert.equal(inv.getItem('EX-001').name, 'Updated Existing');
    assert.equal(inv.getItem('NEW-001').quantity, 30); // new
  });
});

describe('Scenario: Stock Alert Monitoring', () => {
  it('should track and respond to low-stock alerts', () => {
    const inv = new Inventory({ lowStockThreshold: 20 });
    const alerts = [];
    inv.on('low-stock-alert', (data) => alerts.push(data));

    // Add items with different thresholds
    inv.addItem({ name: 'Critical', sku: 'CR-001', quantity: 100, price: 50, category: 'C', location: 'L', lowStockThreshold: 50 });
    inv.addItem({ name: 'Normal', sku: 'NR-001', quantity: 100, price: 10, category: 'C', location: 'L' });

    // Sell items
    inv.updateItem('CR-001', { quantity: 40 }, 'Sales'); // 40 < 50 per-item threshold
    inv.updateItem('NR-001', { quantity: 15 }, 'Sales'); // 15 < 20 global threshold

    assert.equal(alerts.length, 2);

    // Check low-stock report
    const lowStock = inv.getLowStockItems();
    assert.equal(lowStock.length, 2);

    // Restock
    inv.updateItem('CR-001', { quantity: 100 }, 'Restocked');
    inv.updateItem('NR-001', { quantity: 100 }, 'Restocked');

    // Now nothing should be low
    assert.equal(inv.getLowStockItems().length, 0);
  });
});
