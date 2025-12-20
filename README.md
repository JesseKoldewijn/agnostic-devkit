# Agnostic Devkit

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Chrome Web Store Version](https://img.shields.io/chrome-web-store/v/ahpllpcmljhdaeijgfjljopamoaeinpp.svg)

A platform-agnostic developer toolkit for web development, built as a modern Browser extension. Designed to streamline common development tasks with a clean, intuitive interface.

## Status

[![CI](https://github.com/JesseKoldewijn/agnostic-devkit/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/JesseKoldewijn/agnostic-devkit/actions/workflows/ci.yml)
[![Total Coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/JesseKoldewijn/agnostic-devkit/main/.badges/coverage-total.json)](https://github.com/JesseKoldewijn/agnostic-devkit/actions/workflows/ci.yml)
[![Unit Coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/JesseKoldewijn/agnostic-devkit/main/.badges/coverage-unit.json)](https://github.com/JesseKoldewijn/agnostic-devkit/actions/workflows/ci.yml)
[![E2E Coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/JesseKoldewijn/agnostic-devkit/main/.badges/coverage-e2e.json)](https://github.com/JesseKoldewijn/agnostic-devkit/actions/workflows/ci.yml)

## Features

### 🎛️ Parameter Presets

Create and manage reusable presets of parameters that can be instantly applied to any tab:

-   **Query Parameters** — Add or modify URL query strings
-   **Cookies** — Set browser cookies for the current domain
-   **Local Storage** — Inject localStorage values

Perfect for testing different feature flags, user segments, or debug modes across environments.

### 🖥️ Flexible Display Modes

Choose between two display modes based on your workflow:

-   **Popup** — Traditional extension popup for quick access
-   **Sidebar** — Full-height side panel for extended functionality

### 🌓 Theme System

Supports Light, Dark, and System theme modes that persist across sessions.

### 🌐 Cross-Browser Compatibility

Works across all Chromium-based browsers with automatic fallbacks for unsupported features:

-   ✅ Chrome 114+
-   ✅ Brave
-   ✅ Edge
-   ✅ Opera
-   ⚠️ Other Chromium browsers (with potential feature limitations)

## Tech Stack

| Category             | Technology                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| Build                | [WXT](https://wxt.dev) 0.20.x & [Vite](https://vite.dev) 7.x                                                 |
| Language             | [TypeScript](https://www.typescriptlang.org) 5.9                                                            |
| UI Framework         | [SolidJS](https://www.solidjs.com) 1.9                                                                      |
| Styling              | [Tailwind CSS](https://tailwindcss.com) 4.x (CSS-based config)                                              |
| Unit Testing         | [Vitest](https://vitest.dev) 4.x                                                                            |
| E2E Testing          | [Playwright](https://playwright.dev) 1.57                                                                   |
| Linting & Formatting | [Oxlint](https://oxlint.js.org) & [Biome](https://biomejs.dev)                                              |
| Package Manager      | [Yarn](https://yarnpkg.com) 4.x (via Corepack)                                                              |
| Releases             | [semantic-release](https://semantic-release.gitbook.io)                                                     |

## Getting Started

### Prerequisites

-   **Node.js**: 25.0.0 (managed via Volta)
-   **Yarn**: 4.10.3 (managed via Corepack)

Enable Corepack if you haven't already:

```bash
corepack enable
```

### Installation

```bash
yarn install
```

### Development

Build the extension with watch mode:

```bash
yarn dev
```

This creates a `build-output` folder that rebuilds automatically on changes. Load it as an unpacked extension:

1. Navigate to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `build-output/chrome-mv3` (or `firefox-mv2`) folder

> **Note:** After changes, manually reload the extension in Chrome (click the reload icon on the extension card).

### Production Build

```bash
yarn build
```

### Packaging

Create a distributable `.zip` file:

```bash
yarn package
```

## Testing

### Unit Tests

```bash
yarn test              # Run once
yarn test:watch        # Watch mode
yarn test:ui           # Interactive UI
yarn test:coverage     # Generate coverage report
```

### E2E Tests

```bash
yarn test:e2e          # Run E2E tests
yarn test:e2e:ui       # Interactive Playwright UI
```

### Coverage Reports

```bash
# Run all tests with coverage
yarn test:all:coverage # Runs unit tests, builds with coverage, then E2E tests

# Individual coverage commands
yarn test:coverage      # Unit test coverage (Vitest) - outputs score
yarn test:e2e:coverage  # E2E test coverage (Playwright) - outputs score

# Get coverage scores
yarn coverage:score:vitest      # Display unit test coverage score
yarn coverage:score:playwright  # Display E2E test coverage score

# Generate coverage badges (for CI/CD)
yarn coverage:badges  # Generates badge JSON files in .badges/

# View coverage reports
yarn coverage:open:vitest      # Open Vitest coverage report
yarn coverage:open:playwright  # Open Playwright coverage report
```

Coverage reports are generated separately:

-   **Vitest coverage**: `coverage/vitest/index.html` - Unit test coverage
-   **Playwright coverage**: `coverage/playwright/index.html` - E2E test coverage

Coverage scores are displayed automatically when running coverage commands and can also be viewed separately using the `coverage:score:*` commands.

## Project Structure

```
src/
├── entrypoints/        # Extension entrypoints (auto-detected by WXT)
│   ├── background.ts   # Service worker
│   ├── content.ts      # Content scripts (injected into pages)
│   ├── popup/          # Extension popup UI
│   ├── sidepanel/      # Extension sidebar/sidepanel UI
│   └── settings/       # Options/settings page
├── components/         # Shared UI components
│   ├── ui/             # Primitive UI components (shadcn-style)
│   ├── PresetManager.tsx     # Full CRUD interface for presets
│   └── PresetToggleList.tsx  # Quick preset toggles
├── logic/              # Business logic
│   └── parameters/           # Preset & parameter management
├── utils/              # Utility functions
│   ├── browser.ts            # Cross-browser compatibility
│   ├── displayMode.ts        # Display mode management
│   ├── dom.ts                # DOM utilities
│   └── theme.ts              # Theme management
├── styles/             # Global styles & Tailwind config
├── public/             # Static assets & icons
└── test/               # Test files & helpers
```

## Linting & Formatting

```bash
yarn lint          # Run Oxlint
yarn lint:fix      # Run Oxlint with auto-fix
yarn check         # Run Biome check (format & lint)
yarn format        # Run Biome format
yarn type-check    # Run TypeScript type check
```

## CI/CD

The project uses GitHub Actions for continuous integration and deployment:

-   **CI Workflow** — Runs on all branches: Oxlint, Biome check, type checking, unit tests, E2E tests, and coverage badge generation
-   **Release Workflow** — Triggered on `main`: semantic versioning and packaging

Coverage badges are automatically updated on each push for the current branch.

## Tailwind CSS v4 Configuration

This project uses Tailwind CSS v4's CSS-based configuration with shadcn-style design tokens. Customize the theme in `src/styles/main.css`:

```css
@theme {
	--color-primary: #18181b;
	--color-primary-foreground: #fafafa;
	/* ... more tokens */
}
```

## License

[MIT License](LICENSE) © 2025 Jesse Koldewijn
