# Agnostic Devkit

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/JesseKoldewijn/agnostic-devkit/actions/workflows/ci.yml/badge.svg)](https://github.com/JesseKoldewijn/agnostic-devkit/actions/workflows/ci.yml)
[![Total Coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/JesseKoldewijn/agnostic-devkit/main/.badges/coverage.json)](https://github.com/JesseKoldewijn/agnostic-devkit/actions/workflows/ci.yml)
[![Unit Coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/JesseKoldewijn/agnostic-devkit/main/.badges/coverage-unit.json)](https://github.com/JesseKoldewijn/agnostic-devkit/actions/workflows/ci.yml)
[![E2E Coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/JesseKoldewijn/agnostic-devkit/main/.badges/coverage-e2e.json)](https://github.com/JesseKoldewijn/agnostic-devkit/actions/workflows/ci.yml)

A platform-agnostic developer toolkit for web development, built as a modern Chromium extension. Designed to streamline common development tasks with a clean, intuitive interface.

## Features

### 🧹 Clean Copy URL

Strips tracking parameters and query strings from URLs when copying. Right-click any link or selected text to copy a clean version without UTM parameters, analytics tokens, or other tracking artifacts.

### 🎛️ Parameter Presets

Create and manage reusable presets of parameters that can be instantly applied to any tab:

- **Query Parameters** — Add or modify URL query strings
- **Cookies** — Set browser cookies for the current domain
- **Local Storage** — Inject localStorage values

Perfect for testing different feature flags, user segments, or debug modes across environments.

### 🖥️ Flexible Display Modes

Choose between two display modes based on your workflow:

- **Popup** — Traditional extension popup for quick access
- **Sidebar** — Full-height side panel for extended functionality

### 🌓 Theme System

Supports Light, Dark, and System theme modes that persist across sessions.

### 🌐 Cross-Browser Compatibility

Works across all Chromium-based browsers with automatic fallbacks for unsupported features:

- ✅ Chrome 114+
- ✅ Brave
- ✅ Edge
- ✅ Opera
- ⚠️ Other Chromium browsers (with potential feature limitations)

## Tech Stack

| Category | Technology |
|----------|------------|
| Build | [Vite](https://vite.dev) 7.x |
| Language | [TypeScript](https://www.typescriptlang.org) 5.9 |
| UI Framework | [SolidJS](https://www.solidjs.com) 1.9 |
| Styling | [Tailwind CSS](https://tailwindcss.com) 4.x (CSS-based config) |
| Unit Testing | [Vitest](https://vitest.dev) 4.x |
| E2E Testing | [Playwright](https://playwright.dev) 1.57 |
| Package Manager | [Yarn](https://yarnpkg.com) 4.x (via Corepack) |
| Releases | [semantic-release](https://semantic-release.gitbook.io) |

## Getting Started

### Prerequisites

- **Node.js**: 25.0.0 (managed via Volta)
- **Yarn**: 4.10.3 (managed via Corepack)

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

This creates a `dist` folder that rebuilds automatically on changes. Load it as an unpacked extension:

1. Navigate to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `dist` folder

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

### Full Coverage Suite

```bash
yarn test:all:coverage # Run all tests and merge coverage reports
```

## Project Structure

```
src/
├── popup/              # Extension popup UI
├── sidebar/            # Extension sidebar UI
├── options/            # Settings page
├── background/         # Service worker
├── content/            # Content scripts (injected into pages)
├── components/         # Shared UI components
│   ├── PresetManager.tsx     # Full CRUD interface for presets
│   └── PresetToggleList.tsx  # Quick preset toggles
├── logic/              # Business logic
│   ├── cleanCopyUrl.ts       # URL cleaning logic
│   └── parameters/           # Preset & parameter management
├── utils/              # Utility functions
│   ├── browser.ts            # Cross-browser compatibility
│   ├── contextMenu.ts        # Context menu helpers
│   ├── displayMode.ts        # Display mode management
│   └── theme.ts              # Theme management
├── styles/             # Global styles & Tailwind config
├── icons/              # Extension icons
├── test/               # Test files
└── manifest.json       # Chrome MV3 manifest
```

## CI/CD

The project uses GitHub Actions for continuous integration and deployment:

- **CI Workflow** — Runs on all branches: type checking, unit tests, E2E tests, and coverage merging
- **Release Workflow** — Triggered on `main`: semantic versioning, packaging, and Chrome Web Store upload

Coverage badges are automatically updated on each push to `main`.

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
