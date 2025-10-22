# agnostic-devkit - Chrome Extension

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/JesseKoldewijn/agnostic-devkit/actions/workflows/ci.yml/badge.svg)](https://github.com/JesseKoldewijn/agnostic-devkit/actions/workflows/ci.yml)
[![Total Coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/JesseKoldewijn/agnostic-devkit/main/.badges/coverage.json)](https://github.com/JesseKoldewijn/agnostic-devkit/actions/workflows/ci.yml)
[![Unit Coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/JesseKoldewijn/agnostic-devkit/main/.badges/coverage-unit.json)](https://github.com/JesseKoldewijn/agnostic-devkit/actions/workflows/ci.yml)
[![E2E Coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/JesseKoldewijn/agnostic-devkit/main/.badges/coverage-e2e.json)](https://github.com/JesseKoldewijn/agnostic-devkit/actions/workflows/ci.yml)

A modern Chromium extension built with cutting-edge web technologies:

-   **Vite** - Fast build tool and dev server
-   **TypeScript** - Type-safe JavaScript
-   **SolidJS** - Reactive UI framework
-   **Tailwind CSS v4** - Utility-first CSS with CSS-based configuration (shadcn-style)
-   **Vitest** - Unit testing framework
-   **Playwright** - End-to-end testing

## Features

-   🚀 Fast development with HMR
-   📦 Optimized production builds
-   🎨 Tailwind CSS v4 with shadcn-style theming
-   🔧 TypeScript for type safety
-   ⚡ SolidJS for reactive UIs
-   🧩 Complete extension structure: Popup, Sidebar, Options page, Background service worker, and Content scripts
-   🔀 Configurable display mode (Popup or Sidebar)
-   🌓 Theme system with Light, Dark, and System modes
-   🌐 Cross-browser compatibility layer for extension APIs
-   ✅ Comprehensive testing setup (Unit + E2E)
-   📦 Yarn 4.x with Corepack

## Project Structure

```
src/
├── popup/          # Extension popup UI
├── sidebar/        # Extension sidebar UI
├── options/        # Options/settings page
├── background/     # Background service worker
├── content/        # Content scripts (injected into web pages)
├── styles/         # Global styles with Tailwind config
├── utils/          # Utility functions
│   ├── browser.ts        # Cross-browser compatibility layer
│   ├── browserClasses.ts # Browser-specific CSS classes
│   ├── displayMode.ts    # Display mode management (popup/sidebar)
│   └── theme.ts          # Theme management (light/dark/system)
├── test/           # Test files
│   ├── *.test.ts         # Unit tests (Vitest)
│   ├── setup.ts          # Test setup
│   └── e2e/              # End-to-end tests (Playwright)
├── icons/          # Extension icons
└── manifest.json   # Extension manifest (Chrome MV3)
```

## Getting Started

### Prerequisites

-   **Node.js**: 25.0.0 (managed via Volta)
-   **Yarn**: 4.10.3 (managed via Corepack)

Enable Corepack if you haven't already:

```bash
corepack enable
```

### Install Dependencies

```bash
yarn install
```

### Development

Build the extension with watch mode:

```bash
yarn dev
# or
yarn watch
```

This will create a `dist` folder and automatically rebuild when you make changes. Load this folder as an unpacked extension in Chrome:

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `dist` folder

**Note:** You'll need to manually reload the extension in Chrome after making changes (click the reload icon on the extension card).

### Build for Production

```bash
yarn build
```

The production-ready extension will be in the `dist` folder.

### Testing

Run unit tests with Vitest:

```bash
yarn test          # Run in watch mode
yarn test:ui       # Run with UI
yarn test:run      # Run once
yarn test:coverage # Generate coverage report
```

Run end-to-end tests with Playwright:

```bash
yarn test:e2e      # Run E2E tests
yarn test:e2e:ui   # Run with Playwright UI
```

### Type Checking

```bash
yarn type-check
```

## Tailwind CSS v4 Configuration

This project uses Tailwind CSS v4's new CSS-based configuration with shadcn-style design tokens. The configuration is in `src/styles/main.css` using the `@theme` directive.

### Customizing Theme

Edit `src/styles/main.css` to customize colors, spacing, and other design tokens:

```css
@theme {
	--color-primary: #18181b;
	--color-primary-foreground: #fafafa;
	/* ... more tokens */
}
```

## Extension Features

### Display Modes

The extension supports two display modes, configurable in the Options page:

-   **Popup**: Traditional extension popup that appears when clicking the extension icon
-   **Sidebar**: Full-height side panel for extended content and functionality

To switch between modes, open the extension's Options page and select your preferred display mode from the dropdown. The change takes effect immediately.

### Theme System

Three theme modes available:

-   **Light**: Light color scheme
-   **Dark**: Dark color scheme
-   **System**: Automatically follows your operating system's theme preference

Themes can be changed in the Options page and persist across sessions.

### Cross-Browser Compatibility

The extension includes a browser compatibility layer (`src/utils/browser.ts`) that provides:

-   Unified API for Chrome, Brave, Edge, and other Chromium browsers
-   Automatic fallback for unsupported features
-   Browser detection and capability checking
-   Abstraction over `chrome.sidePanel` and legacy `sidebarAction` APIs

## Extension Components

### Popup (`src/popup/`)

The extension popup shown when clicking the extension icon (when Popup mode is selected). Built with SolidJS and includes:

-   Theme indicator
-   Interactive counter example
-   Quick access to options

### Sidebar (`src/sidebar/`)

The extension sidebar shown in the browser's side panel (when Sidebar mode is selected). Provides more space for complex UIs.

### Options (`src/options/`)

Full-page settings interface accessible via right-click menu or from the popup. Allows configuration of:

-   Display mode (Popup/Sidebar)
-   Theme preference (Light/Dark/System)
-   Additional settings

### Background (`src/background/`)

Service worker for background tasks and extension lifecycle management. Handles:

-   Extension installation
-   Display mode application
-   Browser action click events
-   Sidebar panel management

### Content Scripts (`src/content/`)

Scripts that run in the context of web pages. Configured to run on all URLs with custom styling.

## Technology Stack

### Core

-   **Vite** 7.1.11 - Build tool with fast HMR
-   **TypeScript** 5.9.3 - Type safety
-   **SolidJS** 1.9.9 - Reactive UI framework

### Styling

-   **Tailwind CSS** 4.1.15 - Utility-first CSS
-   **@tailwindcss/vite** 4.1.15 - Vite integration
-   **vite-plugin-scope-tailwind** 2.0.2 - Scoped Tailwind classes

### Extension Build

-   **vite-plugin-web-extension** 4.4.5 - Chrome extension support
-   **vite-plugin-solid** 2.11.10 - SolidJS integration

### Testing

-   **Vitest** 4.0.1 - Unit testing with happy-dom environment
-   **Playwright** 1.56.1 - End-to-end testing
-   **@vitest/ui** 4.0.1 - Interactive test UI

### Development Tools

-   **@types/chrome** 0.1.24 - Chrome extension API types
-   **Yarn** 4.10.3 - Package manager
-   **Volta** - Node.js version manager

## Browser Support

This extension is built for Chromium-based browsers:

-   ✅ Chrome 114+
-   ✅ Brave
-   ✅ Edge
-   ✅ Opera
-   ⚠️ Other Chromium browsers (with potential feature limitations)

The browser compatibility layer automatically detects capabilities and provides fallbacks where needed.

## License

[MIT License](LICENSE)
