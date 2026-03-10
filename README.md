# ax-test-inventory

A zero-dependency Node.js inventory management library. Track items, monitor stock levels, log transactions, search and filter, generate reports, and handle bulk operations -- all with a clean, event-driven API.

## Installation

```bash
npm install ax-test-inventory
```

## Quick Start

```js
const { Inventory } = require('ax-test-inventory');

const inventory = new Inventory({ lowStockThreshold: 10 });

// Listen for stock alerts
inventory.on('low-stock-alert', ({ sku, name, quantity, threshold }) => {
  console.log(`LOW STOCK: ${name} (${sku}) has ${quantity} units (threshold: ${threshold})`);
});

// Add items
inventory.addItem({
  name: 'Wireless Mouse',
  sku: 'MOU-001',
  quantity: 50,
  price: 29.99,
  category: 'Accessories',
  location: 'Warehouse A',
});

// Update stock
inventory.updateItem('MOU-001', { quantity: 8 }, 'Sold 42 units');
// Triggers: low-stock-alert

// Check reports
console.log('Valuation:', inventory.getStockValuation());
console.log('Low stock:', inventory.getLowStockItems());
```

## API Reference

### Constructor

```js
const inventory = new Inventory(config?)
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `config.lowStockThreshold` | `number` | `10` | Default threshold for low-stock alerts |

### Item Management

#### `addItem(itemData, reason?)`

Add a new item to inventory.

```js
const item = inventory.addItem({
  name: 'Widget',           // required: string
  sku: 'WDG-001',          // required: string (must be unique)
  quantity: 100,            // required: number (>= 0)
  price: 9.99,             // required: number (>= 0)
  category: 'Parts',       // required: string
  location: 'Shelf A1',    // required: string
  lowStockThreshold: 20,   // optional: per-item threshold
}, 'Initial stock');        // optional: reason for audit log
```

- Throws if SKU already exists
- Throws if required fields are missing or invalid
- Emits `item-added` event
- Emits `low-stock-alert` if quantity is below threshold

#### `removeItem(sku, reason?)`

Remove an item by SKU.

```js
const removed = inventory.removeItem('WDG-001', 'Discontinued');
```

#### `updateItem(sku, updates, reason?)`

Update one or more item properties.

```js
const updated = inventory.updateItem('WDG-001', {
  quantity: 50,
  price: 12.99,
  location: 'Shelf B2',
}, 'Price increase and relocation');
```

Updatable fields: `name`, `quantity`, `price`, `category`, `location`, `lowStockThreshold`

#### `getItem(sku)`

Get a single item by SKU. Returns a copy (safe to modify) or `null` if not found.

```js
const item = inventory.getItem('WDG-001');
```

#### `listItems()`

Get all items as an array of copies.

```js
const items = inventory.listItems();
console.log(`${items.length} items in inventory`);
```

#### `itemCount`

Get the number of unique items.

```js
console.log(inventory.itemCount); // 42
```

### Stock Tracking

#### `lowStockThreshold` (get/set)

Get or set the global default low-stock threshold.

```js
inventory.lowStockThreshold = 15;
console.log(inventory.lowStockThreshold); // 15
```

#### `setItemThreshold(sku, threshold)`

Set a per-item low-stock threshold (overrides global default).

```js
inventory.setItemThreshold('WDG-001', 25);
```

#### `getItemThreshold(sku)`

Get the effective threshold for an item (per-item if set, otherwise global).

```js
const threshold = inventory.getItemThreshold('WDG-001'); // 25
```

#### `getLowStockItems()`

Get all items below their respective thresholds.

```js
const lowStock = inventory.getLowStockItems();
lowStock.forEach(item => {
  console.log(`${item.name}: ${item.quantity} remaining`);
});
```

### Search & Filter

#### `searchByName(query)`

Case-insensitive substring search by item name.

```js
const results = inventory.searchByName('widget');
// Finds: "Blue Widget", "Widget Pro", "WIDGET-X"
```

#### `filterItems(filters)`

Filter items by one or more criteria (combined with AND logic).

```js
// Single filter
const parts = inventory.filterItems({ category: 'Parts' });

// Multiple filters
const cheapPartsInWarehouseA = inventory.filterItems({
  category: 'Parts',
  location: 'Warehouse A',
  maxPrice: 20,
});

// Price range
const midRange = inventory.filterItems({
  minPrice: 10,
  maxPrice: 50,
});

// Name + category
const widgets = inventory.filterItems({
  name: 'Widget',
  category: 'Parts',
});
```

Available filters: `name`, `category`, `location`, `minPrice`, `maxPrice`

### Reports

#### `getStockValuation()`

Get total inventory value (sum of quantity * price for all items).

```js
const total = inventory.getStockValuation();
console.log(`Total inventory value: $${total.toFixed(2)}`);
```

#### `getCategoryBreakdown()`

Get item count, total quantity, and total value per category.

```js
const breakdown = inventory.getCategoryBreakdown();
// {
//   'Parts': { itemCount: 5, totalQuantity: 200, totalValue: 1500 },
//   'Gadgets': { itemCount: 3, totalQuantity: 80, totalValue: 2400 }
// }
```

#### `getMostStocked(n?)`

Get the top N items by quantity (default: 5).

```js
const top3 = inventory.getMostStocked(3);
```

#### `getLeastStocked(n?)`

Get the bottom N items by quantity (default: 5).

```js
const bottom3 = inventory.getLeastStocked(3);
```

### Batch Operations

All batch operations are atomic -- if any item fails validation, none are applied.

#### `bulkAdd(items, reason?)`

Add multiple items at once.

```js
inventory.bulkAdd([
  { name: 'Item A', sku: 'A-001', quantity: 10, price: 5.99, category: 'Parts', location: 'A1' },
  { name: 'Item B', sku: 'B-001', quantity: 20, price: 3.99, category: 'Parts', location: 'A2' },
], 'Shipment received');
```

#### `bulkUpdateQuantities(updates, reason?)`

Update quantities for multiple items at once.

```js
inventory.bulkUpdateQuantities([
  { sku: 'A-001', quantity: 50 },
  { sku: 'B-001', quantity: 30 },
], 'Stock recount');
```

### Transaction Log

Every add, remove, and update operation is automatically logged with a timestamp and reason.

#### `transactionLog`

Access the transaction log instance.

```js
const log = inventory.transactionLog;

// Get all entries
const all = log.getAll();

// Filter by SKU
const itemHistory = log.getBySku('WDG-001');

// Filter by action type
const adds = log.getByAction('add');
const removes = log.getByAction('remove');
const updates = log.getByAction('update');

// Filter by date range
const today = log.getByDateRange('2026-03-10', '2026-03-11');

// Check log size
console.log(`${log.length} transactions recorded`);

// Clear log
log.clear();
```

### Import / Export

#### `exportToJSON()`

Export the full inventory (items, config, and transaction log) to a JSON-serializable object.

```js
const data = inventory.exportToJSON();
const fs = require('fs');
fs.writeFileSync('backup.json', JSON.stringify(data, null, 2));
```

#### `importFromJSON(data, options?, reason?)`

Import inventory from a previously exported JSON object.

```js
const data = JSON.parse(fs.readFileSync('backup.json', 'utf8'));

// Replace mode: clears existing inventory first
inventory.importFromJSON(data, { mode: 'replace' });

// Merge mode (default): adds new items, updates existing ones
inventory.importFromJSON(data, { mode: 'merge' });
```

### Events

Inventory extends Node.js EventEmitter.

| Event | Payload | When |
|-------|---------|------|
| `item-added` | `{ name, sku, quantity, price, ... }` | Item added via `addItem` or `bulkAdd` |
| `item-removed` | `{ name, sku, quantity, price, ... }` | Item removed via `removeItem` |
| `item-updated` | `{ oldItem, newItem }` | Item updated via `updateItem` or `bulkUpdateQuantities` |
| `low-stock-alert` | `{ sku, name, quantity, threshold }` | Quantity drops below threshold |

```js
inventory.on('item-added', (item) => console.log(`Added: ${item.name}`));
inventory.on('low-stock-alert', (alert) => {
  notifyTeam(`${alert.name} is running low: ${alert.quantity} remaining`);
});
```

## Requirements

- Node.js >= 18.0.0

## License

MIT
