# Project Architecture

## Technology Stack

| Layer           | Technology                                                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework       | [WXT](https://wxt.dev/) (Browser Extension)                                                                                                              |
| UI              | [SolidJS](https://www.solidjs.com/)                                                                                                                      |
| Styling         | [Tailwind CSS v4](https://tailwindcss.com/)                                                                                                              |
| Validation      | [Zod](https://zod.dev/)                                                                                                                                  |
| Testing         | [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/)                                                                                    |
| Component Tests | [@solidjs/testing-library](https://github.com/solidjs/solid-testing-library)                                                                             |
| Accessibility   | [vitest-axe](https://github.com/chaance/vitest-axe) + [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright) |

## Directory Structure

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
