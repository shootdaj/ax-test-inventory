# Features Research: Inventory Management Library

## Table Stakes (Must Have)

### Core Inventory Management
- **Add items** with name, SKU, quantity, price, category, location
- **Remove items** by SKU
- **Update items** (quantity, price, location, category)
- **Get item** by SKU
- **List all items**
- Complexity: Low

### Stock Tracking
- **Current stock level** per item
- **Low-stock threshold** configurable per item or globally
- **Low-stock alerts** when quantity drops below threshold
- Complexity: Low

### Search & Filter
- **Search by name** (substring/case-insensitive)
- **Filter by SKU** (exact match)
- **Filter by category**
- **Filter by location**
- **Filter by price range** (min/max)
- **Combine filters** (AND logic)
- Complexity: Medium

### Transaction Log
- **Log every mutation** (add, remove, update)
- **Timestamp** each entry
- **Reason** field for audit trail
- **Query log** by item, date range, action type
- Complexity: Medium

## Differentiators (Competitive Advantage)

### Batch Operations
- **Bulk add** multiple items at once
- **Bulk update quantities** (e.g., after receiving shipment)
- **Atomic batches** — all succeed or all fail
- Complexity: Medium

### Reporting
- **Stock valuation** — total value (sum of quantity * price)
- **Category breakdown** — items and value per category
- **Low-stock report** — all items below threshold
- **Most/least stocked** — ranked by quantity
- Complexity: Medium

### Import/Export
- **Export to JSON** — full inventory snapshot
- **Import from JSON** — restore/merge inventory
- Complexity: Low

### Event System
- **EventEmitter** integration
- Events: `item-added`, `item-removed`, `item-updated`, `low-stock-alert`
- Complexity: Low

## Anti-Features (Do NOT Build)
- Database persistence — consumers handle storage
- REST API — library only
- UI/frontend — library only
- Authentication/authorization — not applicable
- Currency formatting — locale-specific, let consumers handle
