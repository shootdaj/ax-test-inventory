# Architecture Research: Inventory Management Library

## Component Structure

```
Inventory (main class, extends EventEmitter)
├── ItemStore (Map-based item storage)
├── TransactionLog (append-only log)
├── SearchEngine (filter/search logic)
├── Reporter (aggregation/reporting)
└── BatchProcessor (bulk operations)
```

## Component Boundaries

### Inventory (src/inventory.js)
- Main entry point and facade
- Extends EventEmitter for stock change events
- Delegates to sub-components
- Owns the item store (Map<sku, item>)
- Validates all inputs before delegating

### TransactionLog (src/transaction-log.js)
- Append-only array of transaction records
- Each record: { id, sku, action, details, timestamp, reason }
- Query methods: by SKU, by action type, by date range
- Export/clear capabilities

### SearchEngine (src/search.js)
- Pure functions operating on item collections
- Composable filters (AND logic)
- Case-insensitive text search
- Range queries for numeric fields

### Reporter (src/reports.js)
- Pure functions that aggregate item data
- Stock valuation (sum of qty * price)
- Category breakdown
- Low-stock identification
- Most/least stocked ranking

### BatchProcessor (integrated into Inventory)
- Validates entire batch before applying
- Atomic: all succeed or all fail (rollback on error)
- Emits events for each item in batch

## Data Flow

```
Consumer API Call
  → Inventory.addItem(item)
    → Validate input
    → Store item in Map
    → Log transaction
    → Emit 'item-added' event
    → Check low-stock threshold
      → Emit 'low-stock-alert' if needed
    → Return item
```

## Build Order

1. **Phase 1: Core** — Inventory class, item CRUD, basic storage
2. **Phase 2: Tracking & Events** — Transaction log, EventEmitter, low-stock alerts
3. **Phase 3: Search, Reports, Batch** — Search/filter, reporting, batch ops, import/export
4. **Phase 4: Polish** — JSDoc, README, package prep, edge cases
