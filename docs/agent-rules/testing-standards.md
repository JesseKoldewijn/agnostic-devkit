# Testing Standards

## Test Organization

| Type        | Location            | Tool       | File Pattern   | Purpose                                         |
| ----------- | ------------------- | ---------- | -------------- | ----------------------------------------------- |
| Unit        | `test/unit/`        | Vitest     | `*.test.ts(x)` | Test logic functions and utilities in isolation |
| Integration | `test/integration/` | Vitest     | `*.test.ts(x)` | Test component interactions and state flows     |
| E2E         | `test/e2e/`         | Playwright | `*.spec.ts`    | Test full extension behavior in real browsers   |

## Test File Location

Test files **must mirror the source directory structure**:

```
src/utils/browser.ts           → test/unit/utils/browser.test.ts
src/logic/parameters/storage.ts → test/unit/logic/parameters/storage.test.ts
src/components/ui/Button.tsx   → test/unit/components/ui/Button.test.tsx
```

## Coverage Requirements

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
