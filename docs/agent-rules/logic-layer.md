# Logic Layer Guidelines

## Domain Logic vs Component Logic

There are two types of logic files in this project with different rules:

### Domain Logic (`src/logic/`)

The `src/logic/` directory contains **framework-agnostic business logic** that must:

- Use **plain TypeScript** (no `createSignal`, `createEffect`, `createStore`).
- Export **pure functions** and **async handlers**.
- Use **callbacks** for event-driven behavior (e.g., storage listeners).
- Return **plain objects/arrays**, not reactive primitives.

This ensures domain logic is:

1. Testable without SolidJS test utilities.
2. Portable if the UI framework changes.
3. Easy to reason about in isolation.

### Component Logic (`src/components/*/ComponentName/logic.ts`)

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

## Validation with Zod

- All **external data** (API responses, imports, storage reads) must be validated with Zod schemas.
- Schemas live alongside their domain logic in `src/logic/[domain]/schemas.ts`.
- Use `.safeParse()` for user-facing flows to provide meaningful error messages.
