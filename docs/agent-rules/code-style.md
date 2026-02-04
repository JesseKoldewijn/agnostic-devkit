# Code Style Quick Reference

## Do

- Write small, focused functions
- Validate all external data with Zod
- Use the Enhanced Component pattern for stateful components
- Keep domain logic (`src/logic/`) SolidJS-agnostic
- Use SolidJS primitives in component `logic.ts` files (within HOC pattern)
- Use `createMock*` builders for test mocks
- Follow conventional commits
- Include accessibility tests for all UI components

## Don't

- Ignore ESLint errors (warnings should be minimized too)
- Put SolidJS primitives in domain logic (`src/logic/`)
- Create one-off mocks when a reusable builder exists
- Skip tests for logic functions
- Use relative imports when `@/` alias is available
- Create UI components without accessibility tests
