# Requirements: ax-test-inventory

**Defined:** 2026-03-10
**Core Value:** Reliable inventory tracking with full transaction history — every mutation logged with timestamp and reason.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Core Inventory

- [ ] **CORE-01**: Library exports an Inventory class that can be instantiated with optional configuration
- [ ] **CORE-02**: User can add an item with name, SKU, quantity, price, category, and location
- [ ] **CORE-03**: User can remove an item by SKU
- [ ] **CORE-04**: User can update item properties (quantity, price, category, location, name)
- [ ] **CORE-05**: User can get an item by SKU (returns copy, not reference)
- [ ] **CORE-06**: User can list all items in inventory
- [ ] **CORE-07**: Adding an item with duplicate SKU throws an error
- [ ] **CORE-08**: Removing more quantity than available throws an error or caps at zero (configurable)

### Stock Tracking

- [ ] **STCK-01**: User can set a global low-stock threshold
- [ ] **STCK-02**: User can set per-item low-stock thresholds
- [ ] **STCK-03**: Library emits 'low-stock-alert' event when item quantity drops below threshold
- [ ] **STCK-04**: User can query which items are below their low-stock threshold

### Transaction Log

- [ ] **TLOG-01**: Every add operation is logged with timestamp and reason
- [ ] **TLOG-02**: Every remove operation is logged with timestamp and reason
- [ ] **TLOG-03**: Every update operation is logged with timestamp, changed fields, and reason
- [ ] **TLOG-04**: User can query transaction log by SKU
- [ ] **TLOG-05**: User can query transaction log by action type (add/remove/update)
- [ ] **TLOG-06**: User can query transaction log by date range
- [ ] **TLOG-07**: User can clear the transaction log

### Events

- [ ] **EVNT-01**: Library emits 'item-added' event with item data when an item is added
- [ ] **EVNT-02**: Library emits 'item-removed' event with item data when an item is removed
- [ ] **EVNT-03**: Library emits 'item-updated' event with old and new item data on update
- [ ] **EVNT-04**: Inventory class extends Node.js EventEmitter

### Batch Operations

- [ ] **BTCH-01**: User can bulk-add multiple items in a single call
- [ ] **BTCH-02**: User can bulk-update quantities for multiple items in a single call
- [ ] **BTCH-03**: Batch operations are atomic — all succeed or all fail with rollback

### Search & Filter

- [ ] **SRCH-01**: User can search items by name (case-insensitive substring match)
- [ ] **SRCH-02**: User can filter items by category
- [ ] **SRCH-03**: User can filter items by location
- [ ] **SRCH-04**: User can filter items by price range (min/max)
- [ ] **SRCH-05**: User can combine multiple filters (AND logic)

### Reports

- [ ] **REPT-01**: User can get total stock valuation (sum of quantity * price for all items)
- [ ] **REPT-02**: User can get category breakdown (item count and total value per category)
- [ ] **REPT-03**: User can get list of low-stock items
- [ ] **REPT-04**: User can get most-stocked items (top N by quantity)
- [ ] **REPT-05**: User can get least-stocked items (bottom N by quantity)

### Import/Export

- [ ] **IMEX-01**: User can export full inventory to JSON format
- [ ] **IMEX-02**: User can import inventory from JSON format
- [ ] **IMEX-03**: Import supports merge mode (add to existing) and replace mode (overwrite)

### Package Quality

- [ ] **QUAL-01**: Clean API exported from src/index.js
- [ ] **QUAL-02**: Comprehensive JSDoc comments on all public methods
- [ ] **QUAL-03**: README with usage examples for all major features
- [ ] **QUAL-04**: Proper package.json with main, files, exports, engines fields

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Features

- **ADV-01**: Warehouse/multi-location transfer operations
- **ADV-02**: Reorder point calculations with lead time
- **ADV-03**: Inventory forecasting based on transaction history
- **ADV-04**: Plugin system for custom storage backends

## Out of Scope

| Feature | Reason |
|---------|--------|
| Database persistence | Consumers handle storage; library is in-memory only |
| REST API / server | Library-only; consumers wrap as needed |
| Frontend / UI | Library-only; no visual interface |
| Authentication | Not applicable for a library |
| Currency formatting | Locale-specific; consumers handle display |
| TypeScript source | JSDoc provides type hints without build step |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORE-01 | Phase 1 | Pending |
| CORE-02 | Phase 1 | Pending |
| CORE-03 | Phase 1 | Pending |
| CORE-04 | Phase 1 | Pending |
| CORE-05 | Phase 1 | Pending |
| CORE-06 | Phase 1 | Pending |
| CORE-07 | Phase 1 | Pending |
| CORE-08 | Phase 1 | Pending |
| STCK-01 | Phase 1 | Pending |
| STCK-02 | Phase 1 | Pending |
| TLOG-01 | Phase 2 | Pending |
| TLOG-02 | Phase 2 | Pending |
| TLOG-03 | Phase 2 | Pending |
| TLOG-04 | Phase 2 | Pending |
| TLOG-05 | Phase 2 | Pending |
| TLOG-06 | Phase 2 | Pending |
| TLOG-07 | Phase 2 | Pending |
| EVNT-01 | Phase 2 | Pending |
| EVNT-02 | Phase 2 | Pending |
| EVNT-03 | Phase 2 | Pending |
| EVNT-04 | Phase 2 | Pending |
| STCK-03 | Phase 2 | Pending |
| STCK-04 | Phase 2 | Pending |
| SRCH-01 | Phase 3 | Pending |
| SRCH-02 | Phase 3 | Pending |
| SRCH-03 | Phase 3 | Pending |
| SRCH-04 | Phase 3 | Pending |
| SRCH-05 | Phase 3 | Pending |
| BTCH-01 | Phase 3 | Pending |
| BTCH-02 | Phase 3 | Pending |
| BTCH-03 | Phase 3 | Pending |
| REPT-01 | Phase 3 | Pending |
| REPT-02 | Phase 3 | Pending |
| REPT-03 | Phase 3 | Pending |
| REPT-04 | Phase 3 | Pending |
| REPT-05 | Phase 3 | Pending |
| IMEX-01 | Phase 3 | Pending |
| IMEX-02 | Phase 3 | Pending |
| IMEX-03 | Phase 3 | Pending |
| QUAL-01 | Phase 4 | Pending |
| QUAL-02 | Phase 4 | Pending |
| QUAL-03 | Phase 4 | Pending |
| QUAL-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 32 total
- Mapped to phases: 32
- Unmapped: 0

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-10 after roadmap creation*
