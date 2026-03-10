# ax-test-inventory

## What This Is

An Inventory Management Library published as an npm package. It provides a programmatic API for tracking inventory items with features like stock level monitoring, batch operations, transaction logging, search/filter, reporting, and import/export. This is a library (no frontend, no server) — consumers import it into their own applications.

## Core Value

Reliable inventory tracking with full transaction history — every add, remove, and update is logged with timestamp and reason, ensuring complete auditability.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Inventory class with add/remove/update items (name, SKU, quantity, price, category, location)
- [ ] Stock level tracking with configurable low-stock threshold alerts
- [ ] Batch operations (bulk add, bulk update quantities)
- [ ] Transaction log (every add/remove/update logged with timestamp and reason)
- [ ] Search and filter (by name, SKU, category, location, price range)
- [ ] Reports: stock valuation, category breakdown, low-stock items, most/least stocked
- [ ] Import/export (JSON format)
- [ ] Event emitter for stock changes (item-added, item-removed, low-stock-alert)
- [ ] Clean API exported from index.js
- [ ] Comprehensive JSDoc comments
- [ ] README with usage examples

### Out of Scope

- Frontend/UI — This is a library, not a web app
- Database persistence — In-memory only; consumers handle storage
- REST API / server — Library-only, consumers wrap as needed
- Authentication — Not applicable for a library

## Context

This is a test project for validating the AX workflow system, specifically the non-Vercel (npm library) deployment path. The library should be production-quality with comprehensive tests, clean API design, and proper npm package structure.

Node.js library using CommonJS exports. No external runtime dependencies — only dev dependencies for testing.

## Constraints

- **Stack**: Node.js with no runtime dependencies
- **Format**: CommonJS (require/module.exports) for maximum compatibility
- **Type**: npm library — must have proper package.json with main, files, exports fields
- **Testing**: Node.js built-in test runner (node:test) and assert (node:assert)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| CommonJS over ESM | Maximum compatibility with existing Node.js ecosystems | — Pending |
| No runtime deps | Library should be lightweight and dependency-free | — Pending |
| Node built-in test runner | No need for external test frameworks for a focused library | — Pending |
| EventEmitter for notifications | Node.js standard pattern for event-driven APIs | — Pending |

---
*Last updated: 2026-03-10 after initialization*
