# Feature Flags

Feature flags allow enabling/disabling functionality per build environment (development, canary, production). Use them to safely develop and test new features before releasing to production users.

## When to Use Feature Flags

- **New features** that need testing before production rollout
- **Experimental functionality** that may change or be removed
- **Debug utilities** that should only be available to developers
- **Gradual rollouts** where canary users test before production

## Architecture

### Core Module: `src/logic/featureFlags.ts`

The feature flags system provides:

- **Type-safe flag definitions** with per-environment defaults
- **Storage-based overrides** (only in development/canary)
- **Production protection** - cannot override flags in production builds

### Debug Menu: `src/components/debug/DebugMenu.tsx`

A UI component (only rendered in dev/canary builds) that allows toggling flags at runtime via the Settings page.

## Adding a New Feature Flag

### 1. Define the Flag

Add your flag to `FEATURE_FLAG_META` in `src/logic/featureFlags.ts`:

```typescript
export const FEATURE_FLAG_META = {
	// ... existing flags ...

	myNewFeature: {
		name: "My New Feature",
		description: "Brief description of what this flag controls",
		defaults: {
			development: true, // Enable by default in dev for testing
			canary: false, // Disabled in canary until ready
			production: false, // Always start disabled in production
		},
	},
} as const satisfies Record<string, FeatureFlagMeta>;
```

The `FeatureFlags` type is automatically derived from `FEATURE_FLAG_META`, so TypeScript will enforce type safety.

### 2. Use the Flag in Code

```typescript
import { getFeatureFlags } from "@/logic/featureFlags";

// In async code (e.g., on component mount)
const flags = await getFeatureFlags(__EXTENSION_ENV__);
if (flags.myNewFeature) {
	// Feature-specific code
}
```

For reactive usage in SolidJS components:

```typescript
import { createResource, Show } from "solid-js";
import { getFeatureFlags, type FeatureFlags } from "@/logic/featureFlags";

const [flags] = createResource(() => getFeatureFlags(__EXTENSION_ENV__));

// In JSX
<Show when={flags()?.myNewFeature}>
  <MyNewFeatureComponent />
</Show>
```

### 3. Write Tests

Test both enabled and disabled states:

```typescript
import { getDefaultFlags, getFeatureFlags } from "@/logic/featureFlags";

it("should behave correctly when feature is enabled", async () => {
	// In development, flag is enabled by default
	const flags = await getFeatureFlags("development");
	expect(flags.myNewFeature).toBe(true);
	// Test enabled behavior...
});

it("should behave correctly when feature is disabled", async () => {
	// In production, flag is disabled
	const flags = await getFeatureFlags("production");
	expect(flags.myNewFeature).toBe(false);
	// Test disabled behavior...
});
```

## Default Recommendations

| Environment   | Recommended Default | Reason                                  |
| ------------- | ------------------- | --------------------------------------- |
| `development` | `true`              | Developers should see and test features |
| `canary`      | `false` initially   | Enable after dev testing is complete    |
| `production`  | `false` until ready | Only enable when feature is stable      |

## Graduating a Feature

When a feature is ready for production:

1. **Test thoroughly** in development
2. **Enable in canary** (`defaults.canary: true`) and monitor
3. **Enable in production** (`defaults.production: true`) after canary validation
4. **Remove the flag** once the feature is fully stable (clean up conditional checks)

## API Reference

### Functions

| Function                      | Description                                    |
| ----------------------------- | ---------------------------------------------- |
| `getDefaultFlags(env)`        | Get default flag values for an environment     |
| `canOverrideFlags(env)`       | Check if overrides are allowed (false in prod) |
| `getFeatureFlags(env)`        | Get current flags (defaults + overrides)       |
| `setFeatureFlagOverride()`    | Save an override (throws in production)        |
| `resetFeatureFlagOverrides()` | Clear all overrides (throws in production)     |

### Constants

| Export              | Description                                 |
| ------------------- | ------------------------------------------- |
| `FEATURE_FLAG_META` | Flag definitions with metadata and defaults |
| `FeatureFlags`      | TypeScript type for all flag values         |

## Security Notes

- **Production overrides are blocked** - `setFeatureFlagOverride()` throws an error in production
- **Storage is not read in production** - `getFeatureFlags("production")` always returns defaults
- **Debug menu is not bundled** - The `<DebugMenu />` component is conditionally rendered only in dev/canary builds
