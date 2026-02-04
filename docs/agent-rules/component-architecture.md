# Component Architecture

## The Enhanced Component Pattern

All components with logic **must** follow the 3-file "Enhanced Component" pattern, inspired by Redux's `connect` paradigm. This enforces strict separation between business logic and presentation.

### File Structure

```
src/components/[feature]/ComponentName/
├── index.ts      # Connector: wires logic to UI via `connect` HOC
├── ui.tsx        # Dumb UI component: receives props, renders JSX
└── logic.ts      # Pure logic: event handlers, data transformations, state
```

### Responsibilities

| File       | Responsibility                                                                                                                                                                                                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `logic.ts` | Reactive logic factory. **May use SolidJS primitives** (`createSignal`, `createEffect`, `onMount`, etc.) since it runs within a component context via the `connect` HOC. Handles state management, data fetching, and event handlers. Returns an interface of accessors and callbacks. |
| `ui.tsx`   | Presentational component. Receives all data and callbacks via props. Contains minimal logic (only rendering conditionals).                                                                                                                                                             |
| `index.ts` | Uses the `connect` HOC to bind `logic.ts` exports to `ui.tsx` props. The HOC calls the logic factory within a SolidJS component context.                                                                                                                                               |

> **Note:** Component `logic.ts` files differ from domain logic in `src/logic/`. Domain logic must remain framework-agnostic (pure TypeScript), while component logic files may use SolidJS primitives because they execute within a reactive component context.

### Example

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

### When to Skip the Pattern

- **Pure UI components** with zero logic (e.g., `Button`, `Card`, `Badge`) do not need this pattern.
- If a component only receives props from a parent and has no internal state or handlers, a single `.tsx` file is acceptable.
