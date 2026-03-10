'use strict';

const { EventEmitter } = require('node:events');
const TransactionLog = require('./transaction-log');

/**
 * @typedef {Object} InventoryItem
 * @property {string} name - Item display name
 * @property {string} sku - Unique stock keeping unit identifier
 * @property {number} quantity - Current quantity in stock
 * @property {number} price - Unit price
 * @property {string} category - Item category
 * @property {string} location - Storage location
 * @property {number} [lowStockThreshold] - Per-item low stock threshold (overrides global)
 * @property {string} createdAt - ISO timestamp of when item was added
 * @property {string} updatedAt - ISO timestamp of last update
 */

/**
 * @typedef {Object} InventoryConfig
 * @property {number} [lowStockThreshold=10] - Default low stock threshold for all items
 */

/**
 * Inventory management class providing item CRUD operations, stock tracking,
 * transaction logging, search/filter, reporting, batch operations, and import/export.
 *
 * @extends EventEmitter
 * @example
 * const { Inventory } = require('ax-test-inventory');
 * const inv = new Inventory({ lowStockThreshold: 5 });
 * inv.addItem({ name: 'Widget', sku: 'WDG-001', quantity: 100, price: 9.99, category: 'Parts', location: 'A1' });
 */
class Inventory extends EventEmitter {
  /**
   * Create a new Inventory instance.
   *
   * @param {InventoryConfig} [config={}] - Configuration options
   * @param {number} [config.lowStockThreshold=10] - Default low stock threshold
   */
  constructor(config = {}) {
    super();
    /** @type {Map<string, InventoryItem>} */
    this._items = new Map();
    /** @type {number} */
    this._defaultLowStockThreshold = config.lowStockThreshold ?? 10;
    /** @type {TransactionLog} */
    this._log = new TransactionLog();
  }

  /**
   * Add a new item to inventory.
   *
   * @param {Object} itemData - Item properties
   * @param {string} itemData.name - Item display name
   * @param {string} itemData.sku - Unique SKU identifier
   * @param {number} itemData.quantity - Initial quantity (must be >= 0)
   * @param {number} itemData.price - Unit price (must be >= 0)
   * @param {string} itemData.category - Item category
   * @param {string} itemData.location - Storage location
   * @param {number} [itemData.lowStockThreshold] - Per-item low stock threshold
   * @param {string} [reason='Initial stock'] - Reason for adding item
   * @returns {InventoryItem} Copy of the added item
   * @throws {Error} If SKU already exists or required fields are missing
   *
   * @example
   * inv.addItem({
   *   name: 'Widget',
   *   sku: 'WDG-001',
   *   quantity: 100,
   *   price: 9.99,
   *   category: 'Parts',
   *   location: 'Warehouse A'
   * });
   */
  addItem(itemData, reason = 'Initial stock') {
    this._validateItemData(itemData);

    if (this._items.has(itemData.sku)) {
      throw new Error(`Item with SKU "${itemData.sku}" already exists`);
    }

    const now = new Date().toISOString();
    const item = {
      name: itemData.name,
      sku: itemData.sku,
      quantity: itemData.quantity,
      price: itemData.price,
      category: itemData.category,
      location: itemData.location,
      createdAt: now,
      updatedAt: now,
    };

    if (itemData.lowStockThreshold !== undefined) {
      item.lowStockThreshold = itemData.lowStockThreshold;
    }

    this._items.set(item.sku, item);

    this._log.append({
      sku: item.sku,
      action: 'add',
      details: { item: this._copyItem(item) },
      reason,
    });

    this.emit('item-added', this._copyItem(item));

    this._checkLowStock(item);

    return this._copyItem(item);
  }

  /**
   * Remove an item from inventory by SKU.
   *
   * @param {string} sku - SKU of item to remove
   * @param {string} [reason='Removed from inventory'] - Reason for removal
   * @returns {InventoryItem} Copy of the removed item
   * @throws {Error} If item with given SKU does not exist
   *
   * @example
   * const removed = inv.removeItem('WDG-001', 'Discontinued');
   */
  removeItem(sku, reason = 'Removed from inventory') {
    const item = this._items.get(sku);
    if (!item) {
      throw new Error(`Item with SKU "${sku}" not found`);
    }

    const copy = this._copyItem(item);
    this._items.delete(sku);

    this._log.append({
      sku,
      action: 'remove',
      details: { item: copy },
      reason,
    });

    this.emit('item-removed', copy);

    return copy;
  }

  /**
   * Update properties of an existing item.
   *
   * @param {string} sku - SKU of item to update
   * @param {Object} updates - Properties to update
   * @param {string} [updates.name] - New name
   * @param {number} [updates.quantity] - New quantity (must be >= 0)
   * @param {number} [updates.price] - New price (must be >= 0)
   * @param {string} [updates.category] - New category
   * @param {string} [updates.location] - New location
   * @param {number} [updates.lowStockThreshold] - New per-item threshold
   * @param {string} [reason='Updated'] - Reason for update
   * @returns {InventoryItem} Copy of the updated item
   * @throws {Error} If item not found, or quantity/price is negative
   *
   * @example
   * inv.updateItem('WDG-001', { quantity: 50, price: 12.99 }, 'Price increase and stock adjustment');
   */
  updateItem(sku, updates, reason = 'Updated') {
    const item = this._items.get(sku);
    if (!item) {
      throw new Error(`Item with SKU "${sku}" not found`);
    }

    const oldItem = this._copyItem(item);

    // Validate updates
    if (updates.quantity !== undefined && updates.quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }
    if (updates.price !== undefined && updates.price < 0) {
      throw new Error('Price cannot be negative');
    }

    const allowedFields = ['name', 'quantity', 'price', 'category', 'location', 'lowStockThreshold'];
    const changedFields = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        changedFields[field] = { from: item[field], to: updates[field] };
        item[field] = updates[field];
      }
    }

    if (Object.keys(changedFields).length === 0) {
      return this._copyItem(item);
    }

    item.updatedAt = new Date().toISOString();

    this._log.append({
      sku,
      action: 'update',
      details: { changedFields },
      reason,
    });

    this.emit('item-updated', { oldItem, newItem: this._copyItem(item) });

    if (changedFields.quantity || changedFields.lowStockThreshold) {
      this._checkLowStock(item);
    }

    return this._copyItem(item);
  }

  /**
   * Get a single item by SKU. Returns a copy, not a reference.
   *
   * @param {string} sku - SKU to look up
   * @returns {InventoryItem|null} Copy of the item, or null if not found
   *
   * @example
   * const item = inv.getItem('WDG-001');
   * if (item) console.log(item.name);
   */
  getItem(sku) {
    const item = this._items.get(sku);
    return item ? this._copyItem(item) : null;
  }

  /**
   * List all items in inventory. Returns copies, not references.
   *
   * @returns {InventoryItem[]} Array of all inventory items (copies)
   *
   * @example
   * const items = inv.listItems();
   * console.log(`Total items: ${items.length}`);
   */
  listItems() {
    return Array.from(this._items.values()).map(item => this._copyItem(item));
  }

  /**
   * Get the number of unique items in inventory.
   *
   * @returns {number} Count of items
   */
  get itemCount() {
    return this._items.size;
  }

  /**
   * Get or set the default low-stock threshold.
   *
   * @returns {number} Current default low stock threshold
   */
  get lowStockThreshold() {
    return this._defaultLowStockThreshold;
  }

  /**
   * Set the default low-stock threshold.
   *
   * @param {number} value - New threshold value (must be >= 0)
   * @throws {Error} If value is negative
   */
  set lowStockThreshold(value) {
    if (typeof value !== 'number' || value < 0) {
      throw new Error('Low stock threshold must be a non-negative number');
    }
    this._defaultLowStockThreshold = value;
  }

  /**
   * Set a per-item low-stock threshold.
   *
   * @param {string} sku - SKU of item
   * @param {number} threshold - Threshold value (must be >= 0)
   * @throws {Error} If item not found or threshold is negative
   */
  setItemThreshold(sku, threshold) {
    const item = this._items.get(sku);
    if (!item) {
      throw new Error(`Item with SKU "${sku}" not found`);
    }
    if (typeof threshold !== 'number' || threshold < 0) {
      throw new Error('Threshold must be a non-negative number');
    }
    item.lowStockThreshold = threshold;
    item.updatedAt = new Date().toISOString();
    this._checkLowStock(item);
  }

  /**
   * Get the effective low-stock threshold for an item (per-item or global default).
   *
   * @param {string} sku - SKU of item
   * @returns {number} Effective threshold for this item
   * @throws {Error} If item not found
   */
  getItemThreshold(sku) {
    const item = this._items.get(sku);
    if (!item) {
      throw new Error(`Item with SKU "${sku}" not found`);
    }
    return item.lowStockThreshold ?? this._defaultLowStockThreshold;
  }

  /**
   * Get items that are below their low-stock threshold.
   *
   * @returns {InventoryItem[]} Array of low-stock items (copies)
   */
  getLowStockItems() {
    const result = [];
    for (const item of this._items.values()) {
      const threshold = item.lowStockThreshold ?? this._defaultLowStockThreshold;
      if (item.quantity < threshold) {
        result.push(this._copyItem(item));
      }
    }
    return result;
  }

  /**
   * Get the transaction log instance.
   *
   * @returns {TransactionLog} The transaction log
   */
  get transactionLog() {
    return this._log;
  }

  /**
   * Search items by name (case-insensitive substring match).
   *
   * @param {string} query - Search query
   * @returns {InventoryItem[]} Matching items (copies)
   */
  searchByName(query) {
    const lower = query.toLowerCase();
    const results = [];
    for (const item of this._items.values()) {
      if (item.name.toLowerCase().includes(lower)) {
        results.push(this._copyItem(item));
      }
    }
    return results;
  }

  /**
   * Filter items by one or more criteria. All criteria are combined with AND logic.
   *
   * @param {Object} filters - Filter criteria
   * @param {string} [filters.category] - Filter by category (exact match, case-insensitive)
   * @param {string} [filters.location] - Filter by location (exact match, case-insensitive)
   * @param {number} [filters.minPrice] - Minimum price (inclusive)
   * @param {number} [filters.maxPrice] - Maximum price (inclusive)
   * @param {string} [filters.name] - Filter by name (substring, case-insensitive)
   * @returns {InventoryItem[]} Matching items (copies)
   *
   * @example
   * const filtered = inv.filterItems({ category: 'Parts', minPrice: 5, maxPrice: 20 });
   */
  filterItems(filters = {}) {
    let results = Array.from(this._items.values());

    if (filters.name) {
      const lower = filters.name.toLowerCase();
      results = results.filter(item => item.name.toLowerCase().includes(lower));
    }
    if (filters.category) {
      const lower = filters.category.toLowerCase();
      results = results.filter(item => item.category.toLowerCase() === lower);
    }
    if (filters.location) {
      const lower = filters.location.toLowerCase();
      results = results.filter(item => item.location.toLowerCase() === lower);
    }
    if (filters.minPrice !== undefined) {
      results = results.filter(item => item.price >= filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      results = results.filter(item => item.price <= filters.maxPrice);
    }

    return results.map(item => this._copyItem(item));
  }

  /**
   * Get total stock valuation (sum of quantity * price for all items).
   *
   * @returns {number} Total valuation
   */
  getStockValuation() {
    let total = 0;
    for (const item of this._items.values()) {
      total += item.quantity * item.price;
    }
    return total;
  }

  /**
   * Get breakdown of inventory by category.
   *
   * @returns {Object<string, {itemCount: number, totalQuantity: number, totalValue: number}>}
   */
  getCategoryBreakdown() {
    const breakdown = {};
    for (const item of this._items.values()) {
      if (!breakdown[item.category]) {
        breakdown[item.category] = { itemCount: 0, totalQuantity: 0, totalValue: 0 };
      }
      breakdown[item.category].itemCount += 1;
      breakdown[item.category].totalQuantity += item.quantity;
      breakdown[item.category].totalValue += item.quantity * item.price;
    }
    return breakdown;
  }

  /**
   * Get the top N most-stocked items by quantity.
   *
   * @param {number} [n=5] - Number of items to return
   * @returns {InventoryItem[]} Top N items sorted by quantity descending
   */
  getMostStocked(n = 5) {
    return Array.from(this._items.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, n)
      .map(item => this._copyItem(item));
  }

  /**
   * Get the bottom N least-stocked items by quantity.
   *
   * @param {number} [n=5] - Number of items to return
   * @returns {InventoryItem[]} Bottom N items sorted by quantity ascending
   */
  getLeastStocked(n = 5) {
    return Array.from(this._items.values())
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, n)
      .map(item => this._copyItem(item));
  }

  /**
   * Bulk add multiple items at once. Atomic — all succeed or all fail.
   *
   * @param {Object[]} items - Array of item data objects (same shape as addItem)
   * @param {string} [reason='Bulk add'] - Reason for bulk add
   * @returns {InventoryItem[]} Array of added items (copies)
   * @throws {Error} If any item fails validation (no items are added)
   *
   * @example
   * inv.bulkAdd([
   *   { name: 'Widget A', sku: 'A-001', quantity: 10, price: 5.99, category: 'Parts', location: 'A1' },
   *   { name: 'Widget B', sku: 'B-001', quantity: 20, price: 3.99, category: 'Parts', location: 'A2' },
   * ]);
   */
  bulkAdd(items, reason = 'Bulk add') {
    // Validate all items first (atomic check)
    for (const itemData of items) {
      this._validateItemData(itemData);
      if (this._items.has(itemData.sku)) {
        throw new Error(`Item with SKU "${itemData.sku}" already exists (bulk add aborted)`);
      }
    }

    // Check for duplicate SKUs within the batch
    const skus = new Set();
    for (const itemData of items) {
      if (skus.has(itemData.sku)) {
        throw new Error(`Duplicate SKU "${itemData.sku}" in batch (bulk add aborted)`);
      }
      skus.add(itemData.sku);
    }

    // All valid — apply
    const added = [];
    for (const itemData of items) {
      added.push(this.addItem(itemData, reason));
    }
    return added;
  }

  /**
   * Bulk update quantities for multiple items. Atomic — all succeed or all fail.
   *
   * @param {Array<{sku: string, quantity: number}>} updates - Array of SKU/quantity pairs
   * @param {string} [reason='Bulk quantity update'] - Reason for update
   * @returns {InventoryItem[]} Array of updated items (copies)
   * @throws {Error} If any SKU not found or quantity invalid (no updates are applied)
   *
   * @example
   * inv.bulkUpdateQuantities([
   *   { sku: 'A-001', quantity: 50 },
   *   { sku: 'B-001', quantity: 30 },
   * ], 'Shipment received');
   */
  bulkUpdateQuantities(updates, reason = 'Bulk quantity update') {
    // Validate all updates first
    for (const update of updates) {
      if (!update.sku) {
        throw new Error('Each update must have a sku field (bulk update aborted)');
      }
      if (typeof update.quantity !== 'number' || update.quantity < 0) {
        throw new Error(`Invalid quantity for SKU "${update.sku}" (bulk update aborted)`);
      }
      if (!this._items.has(update.sku)) {
        throw new Error(`Item with SKU "${update.sku}" not found (bulk update aborted)`);
      }
    }

    // All valid — apply
    const results = [];
    for (const update of updates) {
      results.push(this.updateItem(update.sku, { quantity: update.quantity }, reason));
    }
    return results;
  }

  /**
   * Export the full inventory to a JSON-serializable object.
   *
   * @returns {Object} Exportable inventory data
   *
   * @example
   * const data = inv.exportToJSON();
   * fs.writeFileSync('inventory.json', JSON.stringify(data, null, 2));
   */
  exportToJSON() {
    return {
      exportedAt: new Date().toISOString(),
      config: {
        lowStockThreshold: this._defaultLowStockThreshold,
      },
      items: this.listItems(),
      transactionLog: this._log.getAll(),
    };
  }

  /**
   * Import inventory from a JSON object.
   *
   * @param {Object} data - Previously exported inventory data
   * @param {Object} [options={}] - Import options
   * @param {'merge'|'replace'} [options.mode='merge'] - Import mode: 'merge' adds to existing, 'replace' clears first
   * @param {string} [reason='Imported'] - Reason for import
   * @returns {number} Number of items imported
   * @throws {Error} If data format is invalid
   *
   * @example
   * const data = JSON.parse(fs.readFileSync('inventory.json', 'utf8'));
   * inv.importFromJSON(data, { mode: 'replace' });
   */
  importFromJSON(data, options = {}, reason = 'Imported') {
    if (!data || !Array.isArray(data.items)) {
      throw new Error('Invalid import data: must have an "items" array');
    }

    const mode = options.mode || 'merge';

    if (mode === 'replace') {
      this._items.clear();
      this._log.clear();
    }

    if (data.config && data.config.lowStockThreshold !== undefined) {
      this._defaultLowStockThreshold = data.config.lowStockThreshold;
    }

    let imported = 0;
    for (const itemData of data.items) {
      if (mode === 'merge' && this._items.has(itemData.sku)) {
        // In merge mode, update existing items
        const updates = {};
        if (itemData.name !== undefined) updates.name = itemData.name;
        if (itemData.quantity !== undefined) updates.quantity = itemData.quantity;
        if (itemData.price !== undefined) updates.price = itemData.price;
        if (itemData.category !== undefined) updates.category = itemData.category;
        if (itemData.location !== undefined) updates.location = itemData.location;
        if (itemData.lowStockThreshold !== undefined) updates.lowStockThreshold = itemData.lowStockThreshold;
        this.updateItem(itemData.sku, updates, reason);
      } else {
        this.addItem({
          name: itemData.name,
          sku: itemData.sku,
          quantity: itemData.quantity,
          price: itemData.price,
          category: itemData.category,
          location: itemData.location,
          lowStockThreshold: itemData.lowStockThreshold,
        }, reason);
      }
      imported++;
    }

    return imported;
  }

  // ---- Private methods ----

  /**
   * Validate item data for required fields and types.
   * @private
   */
  _validateItemData(itemData) {
    if (!itemData || typeof itemData !== 'object') {
      throw new Error('Item data must be an object');
    }

    const required = ['name', 'sku', 'quantity', 'price', 'category', 'location'];
    for (const field of required) {
      if (itemData[field] === undefined || itemData[field] === null) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (typeof itemData.name !== 'string' || itemData.name.trim() === '') {
      throw new Error('Name must be a non-empty string');
    }
    if (typeof itemData.sku !== 'string' || itemData.sku.trim() === '') {
      throw new Error('SKU must be a non-empty string');
    }
    if (typeof itemData.quantity !== 'number' || itemData.quantity < 0) {
      throw new Error('Quantity must be a non-negative number');
    }
    if (typeof itemData.price !== 'number' || itemData.price < 0) {
      throw new Error('Price must be a non-negative number');
    }
    if (typeof itemData.category !== 'string') {
      throw new Error('Category must be a string');
    }
    if (typeof itemData.location !== 'string') {
      throw new Error('Location must be a string');
    }

    if (itemData.lowStockThreshold !== undefined) {
      if (typeof itemData.lowStockThreshold !== 'number' || itemData.lowStockThreshold < 0) {
        throw new Error('Low stock threshold must be a non-negative number');
      }
    }
  }

  /**
   * Create a deep copy of an item to prevent external mutation.
   * @private
   */
  _copyItem(item) {
    return { ...item };
  }

  /**
   * Check if item is below low-stock threshold and emit alert if so.
   * @private
   */
  _checkLowStock(item) {
    const threshold = item.lowStockThreshold ?? this._defaultLowStockThreshold;
    if (item.quantity < threshold) {
      this.emit('low-stock-alert', {
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        threshold,
      });
    }
  }
}

module.exports = Inventory;
