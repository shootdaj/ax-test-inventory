# Pitfalls Research: Inventory Management Library

## Critical Pitfalls

### 1. Mutable Item References
- **Warning signs:** Consumer modifies returned item objects, corrupting internal state
- **Prevention:** Return copies/frozen objects, not direct references to internal state
- **Phase:** Phase 1 (Core)

### 2. SKU Uniqueness Not Enforced
- **Warning signs:** Duplicate SKUs overwrite existing items silently
- **Prevention:** Throw on duplicate SKU in addItem, require explicit update
- **Phase:** Phase 1 (Core)

### 3. Negative Quantities
- **Warning signs:** Removing more than available stock, resulting in negative inventory
- **Prevention:** Validate quantity >= 0 after operations, throw or cap at 0
- **Phase:** Phase 1 (Core)

### 4. Transaction Log Memory Growth
- **Warning signs:** Unbounded log grows indefinitely in long-running processes
- **Prevention:** Provide log.clear() method, optional max log size
- **Phase:** Phase 2 (Transaction Log)

### 5. Event Listener Leaks
- **Warning signs:** MaxListeners warnings, memory leaks from unremoved listeners
- **Prevention:** Document cleanup patterns, inherit standard EventEmitter behavior
- **Phase:** Phase 2 (Events)

### 6. Batch Atomicity
- **Warning signs:** Partial batch application on error leaves inconsistent state
- **Prevention:** Validate entire batch first, apply only if all valid, rollback on error
- **Phase:** Phase 3 (Batch)

### 7. Import Overwrites Without Warning
- **Warning signs:** Import silently replaces existing inventory
- **Prevention:** Provide merge vs replace options, validate import data schema
- **Phase:** Phase 3 (Import/Export)

### 8. Floating Point Price Arithmetic
- **Warning signs:** $0.1 + $0.2 !== $0.3 in valuation reports
- **Prevention:** Document that prices are stored as-is (floats); consumers should use integer cents for precision
- **Phase:** Phase 3 (Reports)

## Minor Pitfalls

### 9. Case Sensitivity in Search
- Searching for "widget" should find "Widget" and "WIDGET"
- **Phase:** Phase 3

### 10. Empty Inventory Edge Cases
- Reports and search should handle empty inventory gracefully
- **Phase:** Phase 3
