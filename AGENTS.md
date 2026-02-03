# AGENTS.md - Ways of Working

This document defines the development standards, architectural patterns, and coding conventions for the **Agnostic Devkit** browser extension. It serves as a guide for both AI agents and human contributors.

---

## Core Philosophy

### Concise & Targeted Code

- Write **small, single-purpose functions** that do one thing well.
- Prefer multiple smaller functions over large multi-functional ones, unless consolidation significantly reduces complexity (e.g., reusing import logic across multiple import sources).
- Every function should be **well-tested** with clear inputs and outputs.
- Avoid premature abstraction—extract patterns only when reuse is proven.

### Complexity Management

- **ESLint rules are the source of truth** for code complexity.
- **Warnings** should be minimized and addressed when practical.
- **Errors** (especially complexity-related) are **strictly blocking**—code must not be merged with ESLint errors.

---

## Project Architecture

### Technology Stack

| Layer           | Technology                                                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework       | [WXT](https://wxt.dev/) (Browser Extension)                                                                                                              |
| UI              | [SolidJS](https://www.solidjs.com/)                                                                                                                      |
| Styling         | [Tailwind CSS v4](https://tailwindcss.com/)                                                                                                              |
| Validation      | [Zod](https://zod.dev/)                                                                                                                                  |
| Testing         | [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/)                                                                                    |
| Component Tests | [@solidjs/testing-library](https://github.com/solidjs/solid-testing-library)                                                                             |
| Accessibility   | [vitest-axe](https://github.com/chaance/vitest-axe) + [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright) |

### Directory Structure

```
src/
├── entrypoints/     # Manifest-defined entry points (popup, sidepanel, settings)
├── components/      # SolidJS UI components
│   ├── ui/          # Generic, reusable UI primitives (Button, Input, Card)
│   ├── ui-shared/   # Shared composite components
│   └── [feature]/   # Feature-specific components (presets, repository)
├── logic/           # Domain-specific business logic (storage, API, validation)
├── utils/           # Shared utilities (cn, connect, browser helpers)
└── styles/          # Global styles and Tailwind configuration

test/
├── core/                    # Shared test infrastructure
│   ├── fixtures/            # Test data factories and sample data
│   ├── helpers/             # Test utilities (testUtils.ts, renderUtils.ts)
│   ├── mocks/               # Global mock builders
│   ├── setup.ts             # Global Vitest setup (axe matchers)
│   └── index.ts             # Barrel exports for all test utilities
├── unit/                    # Unit tests (mirrors src/ structure)
│   ├── components/ui/       # UI component tests with a11y checks
│   ├── logic/               # Business logic tests
│   │   ├── parameters/      # Parameter/preset logic tests
│   │   └── repository/      # Repository logic tests
│   └── utils/               # Utility function tests
├── integration/             # Integration tests (mirrors src/ structure)
│   ├── components/          # Component integration tests
│   └── logic/               # Logic integration tests
└── e2e/                     # Playwright E2E tests (grouped by feature)
    ├── core/                # E2E fixtures, helpers, a11yUtils
    ├── popup/               # Popup entrypoint tests
    ├── sidepanel/           # Sidepanel entrypoint tests
    ├── settings/            # Settings page tests
    ├── presets/             # Preset feature tests
    └── shared/              # Cross-cutting tests (background, content, sync)
```

---

## Component Architecture

### The Enhanced Component Pattern

All components with logic **must** follow the 3-file "Enhanced Component" pattern, inspired by Redux's `connect` paradigm. This enforces strict separation between business logic and presentation.

#### File Structure

```
src/components/[feature]/ComponentName/
├── index.ts      # Connector: wires logic to UI via `connect` HOC
├── ui.tsx        # Dumb UI component: receives props, renders JSX
└── logic.ts      # Pure logic: event handlers, data transformations, state
```

#### Responsibilities

| File       | Responsibility                                                                                                                                                                                                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `logic.ts` | Reactive logic factory. **May use SolidJS primitives** (`createSignal`, `createEffect`, `onMount`, etc.) since it runs within a component context via the `connect` HOC. Handles state management, data fetching, and event handlers. Returns an interface of accessors and callbacks. |
| `ui.tsx`   | Presentational component. Receives all data and callbacks via props. Contains minimal logic (only rendering conditionals).                                                                                                                                                             |
| `index.ts` | Uses the `connect` HOC to bind `logic.ts` exports to `ui.tsx` props. The HOC calls the logic factory within a SolidJS component context.                                                                                                                                               |

> **Note:** Component `logic.ts` files differ from domain logic in `src/logic/`. Domain logic must remain framework-agnostic (pure TypeScript), while component logic files may use SolidJS primitives because they execute within a reactive component context.

#### Example

```typescript
// ComponentName/logic.ts
import type { Preset } from "@/logic/presets/types";

export interface ComponentNameLogic {
	presets: Preset[];
	isLoading: boolean;
	onDelete: (id: string) => void;
	onSave: (preset: Preset) => Promise<void>;
}

export function createComponentNameLogic(): ComponentNameLogic {
	// Pure logic implementation
}
```

```tsx
// ComponentName/ui.tsx
import type { Component } from "solid-js";

import type { ComponentNameLogic } from "./logic";

export const ComponentNameUI: Component<ComponentNameLogic> = (props) => {
	return <div>{/* Render using props */}</div>;
};
```

```typescript
// ComponentName/index.ts
import { connect } from "@/utils/connect";

import { createComponentNameLogic } from "./logic";
import { ComponentNameUI } from "./ui";

export const ComponentName = connect(ComponentNameUI, createComponentNameLogic);
```

#### When to Skip the Pattern

- **Pure UI components** with zero logic (e.g., `Button`, `Card`, `Badge`) do not need this pattern.
- If a component only receives props from a parent and has no internal state or handlers, a single `.tsx` file is acceptable.

---

## Logic Layer Guidelines

### Domain Logic vs Component Logic

There are two types of logic files in this project with different rules:

#### Domain Logic (`src/logic/`)

The `src/logic/` directory contains **framework-agnostic business logic** that must:

- Use **plain TypeScript** (no `createSignal`, `createEffect`, `createStore`).
- Export **pure functions** and **async handlers**.
- Use **callbacks** for event-driven behavior (e.g., storage listeners).
- Return **plain objects/arrays**, not reactive primitives.

This ensures domain logic is:

1. Testable without SolidJS test utilities.
2. Portable if the UI framework changes.
3. Easy to reason about in isolation.

#### Component Logic (`src/components/*/ComponentName/logic.ts`)

Component `logic.ts` files within the Enhanced Component pattern **may use SolidJS primitives** because:

1. The `connect` HOC calls the logic factory within a SolidJS component context.
2. Reactive state (`createSignal`) and effects (`createEffect`, `onMount`, `onCleanup`) are appropriate here.
3. The logic factory returns `Accessor<T>` types for reactive getters.

```typescript
// Example: Component logic.ts WITH SolidJS primitives (allowed)
import { createSignal, onMount, onCleanup } from "solid-js";

export function createMyComponentLogic(props: MyProps): MyLogic {
  const [items, setItems] = createSignal<Item[]>([]);
  const [loading, setLoading] = createSignal(true);

  onMount(async () => {
    const data = await fetchItems();
    setItems(data);
    setLoading(false);
  });

  return {
    items,      // Accessor<Item[]>
    loading,    // Accessor<boolean>
    onRefresh: () => { ... },
  };
}
```

### Validation with Zod

- All **external data** (API responses, imports, storage reads) must be validated with Zod schemas.
- Schemas live alongside their domain logic in `src/logic/[domain]/schemas.ts`.
- Use `.safeParse()` for user-facing flows to provide meaningful error messages.

---

## Testing Standards

### Test Organization

| Type        | Location            | Tool       | File Pattern   | Purpose                                         |
| ----------- | ------------------- | ---------- | -------------- | ----------------------------------------------- |
| Unit        | `test/unit/`        | Vitest     | `*.test.ts(x)` | Test logic functions and utilities in isolation |
| Integration | `test/integration/` | Vitest     | `*.test.ts(x)` | Test component interactions and state flows     |
| E2E         | `test/e2e/`         | Playwright | `*.spec.ts`    | Test full extension behavior in real browsers   |

### Test File Location

Test files **must mirror the source directory structure**:

```
src/utils/browser.ts           → test/unit/utils/browser.test.ts
src/logic/parameters/storage.ts → test/unit/logic/parameters/storage.test.ts
src/components/ui/Button.tsx   → test/unit/components/ui/Button.test.tsx
```

### Coverage Requirements

- All logic in `src/logic/` and `src/utils/` must have unit tests.
- All UI components in `src/components/ui/` must have accessibility tests.
- Coverage is tracked via a merged pipeline (Vitest + Playwright).
- Run `yarn test:all:coverage` to generate combined coverage reports.

---

## Accessibility Testing

### Requirements

**All component tests must include accessibility validation.** Use `vitest-axe` for unit/integration tests and `@axe-core/playwright` for E2E tests.

### Unit Test Pattern

```tsx
import { checkA11y, render } from "@test/core/helpers/renderUtils";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/Button";

describe("Button", () => {
	describe("accessibility", () => {
		it("should have no accessibility violations", async () => {
			const { container } = render(<Button>Click me</Button>);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});

		it("should have no violations with aria-label for icon buttons", async () => {
			const { container } = render(
				<Button size="icon" aria-label="Add item">
					+
				</Button>
			);
			const results = await checkA11y(container);

			expect(results).toHaveNoViolations();
		});
	});
});
```

### E2E Accessibility Pattern

```typescript
import { assertPageA11y, checkPageA11y } from "../core/a11yUtils";
import { expect, test } from "../core/fixtures";

test("settings page should be accessible", async ({ page, extensionId }) => {
	await page.goto(`chrome-extension://${extensionId}/settings.html`);

	// Option 1: Get results and assert
	const results = await checkPageA11y(page);
	expect(results.violations).toEqual([]);

	// Option 2: Assert directly (throws on violations)
	await assertPageA11y(page);
});
```

### Render Utilities

The project provides rendering helpers in `test/core/helpers/renderUtils.ts`:

| Function                | Description                                         |
| ----------------------- | --------------------------------------------------- |
| `render(jsx)`           | Render a JSX element, returns container and unmount |
| `renderComponent(C, p)` | Render a component with props                       |
| `checkA11y(container)`  | Run axe-core on a container, returns results        |
| `renderWithA11y(jsx)`   | Render and check a11y in one call                   |

---

## Mocking Strategy

### Global, Reusable Mocks

All mocks must be:

1. **Global**: Stored in `test/core/mocks/`, not scattered across test files.
2. **Reusable**: Built as factories/builders for flexible configuration.
3. **Consistent**: Follow the `createMock*` naming convention.

### Mock Builder Pattern

Use the `createMock` prefix for all mock builders:

```typescript
// test/core/mocks/mockStorage.ts
export function createMockStorageBuilder() {
	const store: Record<string, unknown> = {};

	return {
		withPresets(presets: Preset[]) {
			store["local:presets"] = presets;
			return this;
		},
		withSettings(settings: Partial<Settings>) {
			store["local:settings"] = settings;
			return this;
		},
		build() {
			return {
				get: vi.fn((key: string) => store[key]),
				set: vi.fn((key: string, value: unknown) => {
					store[key] = value;
				}),
				// ... other storage methods
			};
		},
	};
}
```

### Mock Location Guidelines

| Type              | Location              | Example                          |
| ----------------- | --------------------- | -------------------------------- |
| Browser API mocks | `test/core/mocks/`    | `fakeBrowser.ts`                 |
| Data fixtures     | `test/core/fixtures/` | `presets.ts`, `settings.ts`      |
| Test helpers      | `test/core/helpers/`  | `testUtils.ts`, `renderUtils.ts` |
| One-off mocks     | Inline in test file   | Only if truly single-use         |

### Existing Infrastructure

The project already provides these utilities via `test/core/index.ts`:

```typescript
// Mocks
export { fakeBrowser, setupBrowserMocks, setupFetchMock } from "./mocks/fakeBrowser";

// Fixtures
export { createPreset, createParameter, samplePresets } from "./fixtures/presets";

// Helpers
export { waitFor, sleep, createDeferred } from "./helpers/testUtils";
export { render, checkA11y, renderWithA11y } from "./helpers/renderUtils";
```

---

## Development Workflow

### Import Aliases

Use the `@/` alias for all imports from `src/`:

```typescript
// ✅ Good
import { cn } from "@/utils/cn";
import { presetStorage } from "@/logic/presets/storage";

// ❌ Bad
import { cn } from "../../../utils/cn";
```

Use `@test/` for test utilities:

```typescript
import { samplePresets, setupBrowserMocks } from "@test/core";
```

### Tailwind CSS Utilities

Use the `cn()` utility for conditional class names:

```typescript
import { cn } from "@/utils/cn";

<div class={cn(
  "base-styles",
  isActive && "active-styles",
  variant === "primary" ? "primary-styles" : "secondary-styles"
)} />
```

### Scripts Reference

| Command                  | Purpose                                 |
| ------------------------ | --------------------------------------- |
| `yarn dev`               | Start development with HMR              |
| `yarn build:all`         | Build for Chrome and Firefox            |
| `yarn test`              | Run Vitest unit/integration tests       |
| `yarn test:e2e`          | Run Playwright E2E tests                |
| `yarn test:all:coverage` | Full coverage run (Vitest + Playwright) |
| `yarn lint`              | Run ESLint                              |
| `yarn lint:fix`          | Auto-fix ESLint issues                  |
| `yarn check:unused`      | Detect unused exports with Knip         |

---

## Release & Automation

### Semantic Release

This project uses [Semantic Release](https://github.com/semantic-release/semantic-release) for automated versioning and changelog generation.

### Conventional Commits

All commits **must** follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Commit Types

| Type       | Release | Description                                      |
| ---------- | ------- | ------------------------------------------------ |
| `feat`     | Minor   | New feature                                      |
| `fix`      | Patch   | Bug fix                                          |
| `docs`     | None    | Documentation only                               |
| `style`    | None    | Code style (formatting, no logic change)         |
| `refactor` | None    | Code change that neither fixes nor adds features |
| `perf`     | Patch   | Performance improvement                          |
| `test`     | None    | Adding or updating tests                         |
| `chore`    | None    | Maintenance tasks                                |

#### Breaking Changes

Add `BREAKING CHANGE:` in the commit footer or use `!` after the type:

```
feat!: remove deprecated API

BREAKING CHANGE: The `oldMethod()` has been removed. Use `newMethod()` instead.
```

---

## Code Style Quick Reference

### Do

- Write small, focused functions
- Validate all external data with Zod
- Use the Enhanced Component pattern for stateful components
- Keep domain logic (`src/logic/`) SolidJS-agnostic
- Use SolidJS primitives in component `logic.ts` files (within HOC pattern)
- Use `createMock*` builders for test mocks
- Follow conventional commits
- Include accessibility tests for all UI components

### Don't

- Ignore ESLint errors (warnings should be minimized too)
- Put SolidJS primitives in domain logic (`src/logic/`)
- Create one-off mocks when a reusable builder exists
- Skip tests for logic functions
- Use relative imports when `@/` alias is available
- Create UI components without accessibility tests
