# Stack Research: Inventory Management Library

## Recommended Stack

### Runtime
- **Node.js 18+** (LTS) — Built-in test runner (`node:test`), stable EventEmitter, good performance
- **Confidence:** High

### Module Format
- **CommonJS** (`require`/`module.exports`) — Maximum compatibility with existing Node.js apps
- ESM support can be added later via `exports` field in package.json
- **Confidence:** High

### Testing
- **`node:test`** — Built-in test runner, no external dependencies needed
- **`node:assert`** — Built-in assertion library
- No need for Jest, Vitest, or Mocha for a focused library
- **Confidence:** High

### Code Quality
- **ESLint** — Standard linting for Node.js
- **JSDoc** — Inline documentation that generates IDE hints
- **Confidence:** High

### What NOT to Use
- **TypeScript** — Adds build complexity for a simple library; JSDoc provides type hints without a build step
- **External test frameworks** — Built-in `node:test` is sufficient
- **Bundlers** — Not needed for a Node.js library (no browser target)
- **Runtime dependencies** — Library should be zero-dependency

## Package Structure

```
package.json
src/
  index.js          # Public API exports
  inventory.js      # Core Inventory class
  transaction-log.js # Transaction logging
  reports.js        # Reporting functions
  search.js         # Search and filter
test/
  unit/             # Unit tests
  integration/      # Integration tests
  scenarios/        # End-to-end scenario tests
```

## npm Package Configuration

```json
{
  "main": "src/index.js",
  "files": ["src/"],
  "engines": { "node": ">=18.0.0" },
  "exports": {
    ".": "./src/index.js"
  }
}
```
