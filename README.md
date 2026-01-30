# Agnostic Devkit

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Chrome Web Store Version](https://img.shields.io/chrome-web-store/v/ahpllpcmljhdaeijgfjljopamoaeinpp.svg)
![Mozilla Add-on Version](https://img.shields.io/amo/v/agnostic-devkit)
[![CI](https://github.com/JesseKoldewijn/agnostic-devkit/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/JesseKoldewijn/agnostic-devkit/actions/workflows/ci.yml)

A platform-agnostic developer toolkit for web development, built as a modern browser extension. Designed to streamline common development tasks with a clean, intuitive interface.

## Features

### 🎛️ Parameter Presets

Create and manage reusable presets of parameters that can be instantly applied to any tab:

- **Query Parameters** — Add or modify URL query strings
- **Cookies** — Set browser cookies for the current domain
- **Local Storage** — Inject localStorage values

Perfect for testing different feature flags, user segments, or debug modes across environments.

### 📤 Import & Export

Share and backup your presets with flexible import/export options:

**Export:**

- **JSON Download** — Export selected presets as a JSON file
- **Shareable URL** — Generate a compressed URL to share presets instantly

**Import:**

- **File Import** — Load presets from a JSON file
- **GitHub Repository** — Import presets directly from a GitHub repo or Gist
- **Share URL** — Paste a shareable URL to import presets

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
- ⚠️ Firefox (limited sidebar support)
- ⚠️ Other Chromium browsers (with potential feature limitations)

## Preset File Format

Preset files are JSON arrays containing preset objects. This format is used for file import/export and GitHub repository imports.

**Required fields:**

- `name` (string) — Display name of the preset
- `parameters` (array) — List of parameters, each with:
  - `type` — One of: `"queryParam"`, `"cookie"`, or `"localStorage"`
  - `key` (string) — Parameter name
  - `value` (string) — Value to set

**Optional fields:**

- Preset `id` (string) — Internal ID of the preset (auto-generated on import)
- Preset `description` (string) — Description of the preset
- Preset `createdAt`, `updatedAt` — Metadata (auto-generated on import)
- Parameter `description` (string) — Description of the parameter
- Parameter `primitiveType` (`"string"` or `"boolean"`, not required but does get autmatically assigned on import if value is a string of `"true"` or `"false"` and can be overridden if you want)

**Example:**

```json
[
	{
		"id": "3fa85f64-5717-4562-b3fc-2c963f66afa6", // Optional internal ID which defaults to a new UUID on import
		"name": "Debug Mode",
		"description": "Enable debug features", // Optional description
		"parameters": [
			{
				// Minimal required fields for a query parameter
				"type": "queryParam",
				"key": "debug",
				"value": "true"
			},
			{
				// Minimal reqyuired fields for a localStorage parameter
				"type": "localStorage",
				"key": "devTools",
				"value": "enabled"
			},
			{
				// Minimal required fields for a cookie parameter
				"type": "cookie",
				"key": "sessionId",
				"value": "abc123"
			},
			{
				"type": "queryParam",
				"key": "debug",
				"value": "true", // Gets parsed as boolean on import
				"primitiveType": "boolean" // Optional primitive type
			},
			{
				"type": "localStorage",
				"key": "devTools with description",
				"description": "Enables debug mode", // Optional description
				"value": "enabled"
			},
			{
				"id": "session-cookie-id", // Optional internal ID which defaults to a new UUID on import
				"type": "cookie",
				"key": "sessionId with id",
				"value": "abc123"
			}
		],
		"createdAt": "2024-01-01T12:00:00.000Z", // Optional metadata
		"updatedAt": "2024-01-02T12:00:00.000Z" // Optional metadata
	}
	... optionally more presets ...
]
```

---

## Development

### Tech Stack

| Category             | Technology                                                     |
| -------------------- | -------------------------------------------------------------- |
| Build                | [WXT](https://wxt.dev) & [Vite](https://vite.dev)              |
| Language             | [TypeScript](https://www.typescriptlang.org)                   |
| UI Framework         | [SolidJS](https://www.solidjs.com)                             |
| Styling              | [Tailwind CSS](https://tailwindcss.com) (CSS-based config)     |
| Unit Testing         | [Vitest](https://vitest.dev)                                   |
| E2E Testing          | [Playwright](https://playwright.dev)                           |
| Linting & Formatting | [ESLint](https://eslint.org) & [Prettier](https://prettier.io) |
| Package Manager      | [Yarn](https://yarnpkg.com) (via Corepack)                     |
| Releases             | [semantic-release](https://semantic-release.gitbook.io)        |

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

### Running Locally

Build the extension with watch mode:

```bash
yarn dev
```

This creates a `build-output` folder that rebuilds automatically on changes. The folder contains separate builds for Chrome (Manifest V3) and Firefox (Manifest V2), and will be automatically opened in the selected browser if available.

> **Note:** If the browser does not open automatically, like when running in a headless environment (CI/CD, remote server, WSL, etc.)

#### Chrome / Chromium

1. Navigate to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `build-output/chrome-mv3` folder

#### Firefox

1. Navigate to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select any file in the `build-output/firefox-mv2` folder

> **Note:** After code changes, manually reload the extension (Chrome: click the reload icon; Firefox: click **Reload**) but in most cases the HMR should handle this for you.

### Production Build

```bash
yarn build
```

### Packaging

Create a distributable `.zip` file:

```bash
yarn package
```

### Testing

#### Unit Tests

```bash
yarn test              # Run once
yarn test:watch        # Watch mode
yarn test:ui           # Interactive UI
yarn test:coverage     # Generate coverage report
```

#### E2E Tests

```bash
yarn test:e2e          # Run E2E tests
yarn test:e2e:ui       # Interactive Playwright UI
```

#### Coverage Reports

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

- **Vitest coverage**: `coverage/vitest/index.html` - Unit test coverage
- **Playwright coverage**: `coverage/playwright/index.html` - E2E test coverage

### Linting & Formatting

```bash
yarn lint          # Run ESLint
yarn lint:fix      # Run ESLint with auto-fix
yarn format        # Run Prettier format
yarn format:check  # Check Prettier formatting
yarn type-check    # Run TypeScript type check
```

### Project Structure

```
src/
├── entrypoints/        # Extension entrypoints (auto-detected by WXT)
│   ├── background.ts   # Service worker
│   ├── content.ts      # Content scripts (injected into pages)
│   ├── popup/          # Extension popup UI
│   ├── sidepanel/      # Extension sidebar/sidepanel UI
│   └── settings/       # Options/settings page
├── components/         # Shared UI components
├── logic/              # Business logic (presets, parameters, repository)
├── utils/              # Utility functions (browser compat, themes, etc.)
├── styles/             # Global styles & Tailwind config
└── test/               # Test files & helpers
```

### CI/CD

The project uses GitHub Actions for continuous integration. The CI workflow runs on all branches and pull requests, performing:

- ESLint & Prettier checks
- TypeScript type checking
- Unit tests (Vitest)
- E2E tests (Playwright)
- Semantic versioning and packaging (on `main` and `develop` branches)

Coverage reports are available as downloadable artifacts on each CI run.

### Tailwind CSS v4 Configuration

This project uses Tailwind CSS v4's CSS-based configuration with shadcn-style design tokens. Customize the theme in `src/styles/main.css`:

```css
@theme {
	--color-primary: #18181b;
	--color-primary-foreground: #fafafa;
	/* ... more tokens */
}
```

## License

[MIT License](LICENSE) © 2025-2026 Jesse Koldewijn
