# AGENTS.md - Ways of Working

Development standards for the **Agnostic Devkit** browser extension.

## Quick Start

- **Stack**: WXT + SolidJS + Tailwind CSS v4 + Zod + Vitest/Playwright
- **Imports**: Use `@/` for `src/`, `@test/` for test utilities
- **Commits**: Follow [Conventional Commits](https://www.conventionalcommits.org/)
- **Linting**: ESLint errors are strictly blocking

## Documentation Index

| Document                                                               | When to Read                                               |
| ---------------------------------------------------------------------- | ---------------------------------------------------------- |
| [Core Philosophy](./docs/agent-rules/core-philosophy.md)               | Understanding coding principles and complexity rules       |
| [Project Architecture](./docs/agent-rules/project-architecture.md)     | Navigating the codebase, understanding tech stack          |
| [Component Architecture](./docs/agent-rules/component-architecture.md) | Building UI components with the Enhanced Component pattern |
| [Logic Layer](./docs/agent-rules/logic-layer.md)                       | Writing business logic, domain vs component logic rules    |
| [Feature Flags](./docs/agent-rules/feature-flags.md)                   | Adding and using feature flags for new functionality       |
| [Testing Standards](./docs/agent-rules/testing-standards.md)           | Writing tests, accessibility checks, mocking strategies    |
| [Workflow](./docs/agent-rules/workflow.md)                             | Import aliases, Tailwind utilities, available scripts      |
| [Release & Automation](./docs/agent-rules/release-automation.md)       | Commit conventions, semantic versioning                    |
| [Code Style](./docs/agent-rules/code-style.md)                         | Quick Do's and Don'ts checklist                            |

## Critical Rules

1. **ESLint errors are blocking** - Code must not be merged with ESLint errors
2. **Domain logic is framework-agnostic** - No SolidJS primitives in `src/logic/`
3. **Component logic may use SolidJS** - `logic.ts` files in components can use `createSignal`, etc.
4. **All external data must be validated** - Use Zod schemas for API responses, imports, storage
5. **All UI components need accessibility tests** - Use `vitest-axe` or `@axe-core/playwright`
6. **Use import aliases** - `@/` for source, `@test/` for test utilities
7. **New features should be behind feature flags** - Add flags in `src/logic/featureFlags.ts` and enable by default only in development
