# ax-test-inventory

Inventory Management Library for Node.js. Published as an npm package.

## Project Structure

- `src/` - Library source code
- `test/unit/` - Unit tests
- `test/integration/` - Integration tests
- `test/scenarios/` - Scenario tests

## Commands

```bash
# Run tests
node --test test/unit/
node --test test/integration/
node --test test/scenarios/
```

# Testing Requirements (AX)

Every feature implementation MUST include tests at all three tiers:

## Test Tiers
1. **Unit tests** -- Test individual functions/methods in isolation. Mock external dependencies.
2. **Integration tests** -- Test component interactions with real services via docker-compose.test.yml.
3. **Scenario tests** -- Test full user workflows end-to-end.

## Test Naming
Use semantic names: `Test<Component>_<Behavior>[_<Condition>]`
- Good: `TestAuthService_LoginWithValidCredentials`, `TestFullCheckoutFlow`
- Bad: `TestShouldWork`, `Test1`, `TestGivenUserWhenLoginThenSuccess`

## Reference
- See `TEST_GUIDE.md` for requirement-to-test mapping
- See `.claude/ax/references/testing-pyramid.md` for full methodology
- Every requirement in ROADMAP.md must map to at least one scenario test
