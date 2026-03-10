# Roadmap: ax-test-inventory

## Overview

Build a zero-dependency Node.js inventory management library from the ground up. Start with core item CRUD and validation, add transaction logging and event-driven stock alerts, layer on search/filter, reporting, batch operations, and import/export, then polish with documentation and package configuration for npm publishing.

## Phases

- [ ] **Phase 1: Core Inventory** - Item CRUD operations with validation and storage
- [ ] **Phase 2: Transaction Log & Events** - Audit trail logging and EventEmitter integration
- [ ] **Phase 3: Search, Reports & Batch** - Search/filter, reporting, batch operations, import/export
- [ ] **Phase 4: Documentation & Package** - JSDoc, README, package.json polish, final quality pass

## Phase Details

### Phase 1: Core Inventory
**Goal**: Establish the Inventory class with complete item CRUD operations, input validation, and stock tracking configuration
**Depends on**: Nothing (first phase)
**Requirements**: CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, CORE-06, CORE-07, CORE-08, STCK-01, STCK-02
**Success Criteria** (what must be TRUE):
  1. Inventory class can be instantiated with optional config (e.g., default low-stock threshold)
  2. Items can be added with all fields (name, SKU, quantity, price, category, location) and retrieved by SKU
  3. Items can be updated and removed, with proper validation (no duplicate SKUs, no negative quantities)
  4. getItem returns a copy, not a mutable reference to internal state
  5. Low-stock thresholds can be set globally and per-item
**Plans**: 3 plans

Plans:
- [ ] 01-01: Project scaffolding — package.json, directory structure, test setup
- [ ] 01-02: Inventory class — constructor, addItem, removeItem, updateItem, getItem, listItems
- [ ] 01-03: Stock tracking — global and per-item low-stock thresholds, validation

### Phase 2: Transaction Log & Events
**Goal**: Add complete transaction logging for all mutations and EventEmitter integration for real-time stock change notifications
**Depends on**: Phase 1
**Requirements**: TLOG-01, TLOG-02, TLOG-03, TLOG-04, TLOG-05, TLOG-06, TLOG-07, EVNT-01, EVNT-02, EVNT-03, EVNT-04, STCK-03, STCK-04
**Success Criteria** (what must be TRUE):
  1. Every add/remove/update operation creates a transaction log entry with timestamp and reason
  2. Transaction log can be queried by SKU, action type, and date range
  3. Inventory emits 'item-added', 'item-removed', 'item-updated' events on mutations
  4. Inventory emits 'low-stock-alert' when item quantity drops below threshold
  5. getLowStockItems returns all items below their threshold
**Plans**: 3 plans

Plans:
- [ ] 02-01: TransactionLog class — append-only log, record structure, query methods
- [ ] 02-02: EventEmitter integration — extend EventEmitter, emit events on all mutations
- [ ] 02-03: Low-stock alerting — threshold checks on quantity changes, alert events, getLowStockItems

### Phase 3: Search, Reports & Batch
**Goal**: Add search/filter capabilities, inventory reporting, batch operations, and JSON import/export
**Depends on**: Phase 2
**Requirements**: SRCH-01, SRCH-02, SRCH-03, SRCH-04, SRCH-05, BTCH-01, BTCH-02, BTCH-03, REPT-01, REPT-02, REPT-03, REPT-04, REPT-05, IMEX-01, IMEX-02, IMEX-03
**Success Criteria** (what must be TRUE):
  1. Items can be searched by name and filtered by category, location, and price range with combined filters
  2. Reports return stock valuation, category breakdown, low-stock list, and most/least stocked items
  3. Batch add and batch update operations are atomic (all succeed or all fail)
  4. Inventory can be exported to JSON and imported back with merge or replace modes
**Plans**: 4 plans

Plans:
- [ ] 03-01: Search and filter — name search, category/location/price filters, composable filter API
- [ ] 03-02: Reports — stock valuation, category breakdown, low-stock report, most/least stocked
- [ ] 03-03: Batch operations — bulkAdd, bulkUpdateQuantities, atomic rollback on failure
- [ ] 03-04: Import/export — exportToJSON, importFromJSON with merge and replace modes

### Phase 4: Documentation & Package
**Goal**: Complete JSDoc documentation, README with usage examples, and package.json configuration for npm publishing
**Depends on**: Phase 3
**Requirements**: QUAL-01, QUAL-02, QUAL-03, QUAL-04
**Success Criteria** (what must be TRUE):
  1. All public methods have comprehensive JSDoc comments with @param, @returns, @throws, @example
  2. README includes installation, quick start, and detailed examples for every major feature
  3. package.json has correct main, files, exports, engines, and keywords fields
  4. src/index.js provides a clean, well-organized public API
**Plans**: 3 plans

Plans:
- [ ] 04-01: JSDoc comments — comprehensive documentation on all public methods
- [ ] 04-02: README — installation, quick start, API reference, usage examples
- [ ] 04-03: Package configuration — package.json fields, src/index.js clean exports, final review

## Progress

**Execution Order:**
Phases execute in order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core Inventory | 0/3 | Not started | - |
| 2. Transaction Log & Events | 0/3 | Not started | - |
| 3. Search, Reports & Batch | 0/4 | Not started | - |
| 4. Documentation & Package | 0/3 | Not started | - |
