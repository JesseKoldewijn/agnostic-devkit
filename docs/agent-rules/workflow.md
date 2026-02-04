# Development Workflow

## Import Aliases

Use the `@/` alias for all imports from `src/`:

```typescript
// Good
import { cn } from "@/utils/cn";
import { presetStorage } from "@/logic/presets/storage";

// Bad
import { cn } from "../../../utils/cn";
```

Use `@test/` for test utilities:

```typescript
import { samplePresets, setupBrowserMocks } from "@test/core";
```

## Tailwind CSS Utilities

Use the `cn()` utility for conditional class names:

```typescript
import { cn } from "@/utils/cn";

<div class={cn(
  "base-styles",
  isActive && "active-styles",
  variant === "primary" ? "primary-styles" : "secondary-styles"
)} />
```

## Scripts Reference

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
