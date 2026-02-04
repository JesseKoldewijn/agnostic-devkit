/**
 * Feature Flags System
 *
 * Provides a type-safe feature flag mechanism with:
 * - Per-environment defaults (development, canary, production)
 * - Runtime overrides in development and canary builds
 * - No override capability in production (security)
 * - Category grouping for scalable UI
 * - Deprecation tracking with lifecycle management
 * - Force profile override for cross-environment testing (localStorage only)
 */
import { browser } from "wxt/browser";

// Build-time environment type from WXT
export type ExtensionEnv = "development" | "canary" | "production";

/**
 * Feature flag categories for grouping in UI
 */
export const FEATURE_FLAG_CATEGORIES = {
	debugging: {
		name: "Debugging",
		description: "Tools for debugging and development",
	},
	experimental: {
		name: "Experimental",
		description: "Features still in active development",
	},
	testing: {
		name: "Testing",
		description: "Options for testing and QA",
	},
} as const;

export type FeatureFlagCategory = keyof typeof FEATURE_FLAG_CATEGORIES;

/**
 * Feature flag definitions with metadata
 */
export interface FeatureFlagMeta {
	name: string;
	description: string;
	category: FeatureFlagCategory;
	defaults: Record<ExtensionEnv, boolean>;
	/**
	 * Mark flag as deprecated. If string, provides reason/replacement info.
	 * Deprecated flags trigger ESLint warnings and show visual indicators in UI.
	 */
	deprecated?: boolean | string;
}

/**
 * All available feature flags
 * Add new flags here with their metadata and defaults per environment
 */
export const FEATURE_FLAG_META = {
	debugLogging: {
		name: "Debug Logging",
		description: "Enable verbose debug logging to the console",
		category: "debugging",
		defaults: {
			development: true,
			canary: false,
			production: false,
		},
	},
	experimentalFeatures: {
		name: "Experimental Features",
		description: "Enable experimental features that are still in development",
		category: "experimental",
		defaults: {
			development: true,
			canary: true,
			production: false,
		},
	},
	mockApiResponses: {
		name: "Mock API Responses",
		description: "Use mock data instead of real API calls (for testing)",
		category: "testing",
		defaults: {
			development: false,
			canary: false,
			production: false,
		},
	},
} as const satisfies Record<string, FeatureFlagMeta>;

/**
 * Type-safe feature flags interface derived from FEATURE_FLAG_META
 * Using -readonly to make the type mutable for internal operations
 */
export type FeatureFlags = {
	-readonly [K in keyof typeof FEATURE_FLAG_META]: boolean;
};

/**
 * Storage key for feature flag overrides
 */
const STORAGE_KEY = "featureFlagOverrides";

/**
 * LocalStorage key for force profile override
 * Uses localStorage (not browser.storage) to ensure it's local-only
 */
const FORCE_PROFILE_KEY = "forceProfile";

/**
 * Get the effective profile, checking for force override first
 * This reads from localStorage (local-only, not synced) and falls back to build-time constant
 *
 * @param buildEnv - The build-time environment constant (__EXTENSION_ENV__)
 * @returns The effective environment to use for feature flags
 */
export function getEffectiveProfile(buildEnv: ExtensionEnv): ExtensionEnv {
	// Only check localStorage in browser environments
	if (typeof localStorage === "undefined") {
		return buildEnv;
	}

	const forced = localStorage.getItem(FORCE_PROFILE_KEY);
	if (forced && isValidExtensionEnv(forced)) {
		return forced;
	}

	return buildEnv;
}

/**
 * Get the current force profile override, if any
 * @returns The forced profile or null if not set
 */
export function getForceProfile(): ExtensionEnv | null {
	if (typeof localStorage === "undefined") {
		return null;
	}

	const forced = localStorage.getItem(FORCE_PROFILE_KEY);
	if (forced && isValidExtensionEnv(forced)) {
		return forced;
	}

	return null;
}

/**
 * Set a force profile override (localStorage only, not synced)
 * @param env - The environment to force, or null to clear
 */
export function setForceProfile(env: ExtensionEnv | null): void {
	if (typeof localStorage === "undefined") {
		return;
	}

	if (env === null) {
		localStorage.removeItem(FORCE_PROFILE_KEY);
	} else {
		localStorage.setItem(FORCE_PROFILE_KEY, env);
	}
}

/**
 * Clear the force profile override
 */
export function clearForceProfile(): void {
	setForceProfile(null);
}

/**
 * Type guard to check if a string is a valid ExtensionEnv
 */
export function isValidExtensionEnv(value: string): value is ExtensionEnv {
	return value === "development" || value === "canary" || value === "production";
}

/**
 * Get feature flags grouped by category
 * @returns Map of category to array of [flagKey, meta] tuples
 */
export function getFlagsByCategory(): Map<
	FeatureFlagCategory,
	Array<[keyof FeatureFlags, (typeof FEATURE_FLAG_META)[keyof typeof FEATURE_FLAG_META]]>
> {
	const grouped = new Map<
		FeatureFlagCategory,
		Array<[keyof FeatureFlags, (typeof FEATURE_FLAG_META)[keyof typeof FEATURE_FLAG_META]]>
	>();

	for (const category of Object.keys(FEATURE_FLAG_CATEGORIES) as FeatureFlagCategory[]) {
		grouped.set(category, []);
	}

	for (const [key, meta] of Object.entries(FEATURE_FLAG_META)) {
		const flagKey = key as keyof FeatureFlags;
		const arr = grouped.get(meta.category);
		if (arr) {
			arr.push([flagKey, meta]);
		}
	}

	return grouped;
}

/**
 * Get all deprecated flags with their deprecation info
 * @returns Array of [flagKey, deprecationReason] tuples
 */
export function getDeprecatedFlags(): Array<[keyof FeatureFlags, string]> {
	const deprecated: Array<[keyof FeatureFlags, string]> = [];

	for (const [key, meta] of Object.entries(FEATURE_FLAG_META) as Array<[string, FeatureFlagMeta]>) {
		if (meta.deprecated) {
			const reason =
				typeof meta.deprecated === "string" ? meta.deprecated : "This flag is deprecated";
			deprecated.push([key as keyof FeatureFlags, reason]);
		}
	}

	return deprecated;
}

/**
 * Get the default flags for a given environment
 */
export function getDefaultFlags(env: ExtensionEnv): FeatureFlags {
	const flags: Partial<FeatureFlags> = {};

	for (const [key, meta] of Object.entries(FEATURE_FLAG_META)) {
		flags[key as keyof FeatureFlags] = meta.defaults[env];
	}

	return flags as FeatureFlags;
}

/**
 * Check if the current environment allows flag overrides
 */
export function canOverrideFlags(env: ExtensionEnv): boolean {
	return env !== "production";
}

/**
 * Get the current feature flags, merging defaults with any stored overrides
 *
 * In production: Always returns defaults, no storage access
 * In dev/canary: Merges stored overrides with defaults
 */
export async function getFeatureFlags(env: ExtensionEnv): Promise<FeatureFlags> {
	const defaults = getDefaultFlags(env);

	// Production never reads overrides
	if (!canOverrideFlags(env)) {
		return defaults;
	}

	// Read overrides from storage
	const result = await browser.storage.local.get([STORAGE_KEY]);
	const overrides = result[STORAGE_KEY] as Record<string, unknown> | undefined;

	if (!overrides || typeof overrides !== "object") {
		return defaults;
	}

	// Merge overrides with defaults, validating each key
	const flags = { ...defaults };
	const validKeys = Object.keys(FEATURE_FLAG_META) as (keyof FeatureFlags)[];

	for (const key of validKeys) {
		if (key in overrides && typeof overrides[key] === "boolean") {
			flags[key] = overrides[key];
		}
	}

	return flags;
}

/**
 * Set a feature flag override
 *
 * @throws Error if called in production environment
 */
export async function setFeatureFlagOverride(
	flag: keyof FeatureFlags,
	value: boolean,
	env: ExtensionEnv
): Promise<void> {
	if (!canOverrideFlags(env)) {
		throw new Error("Cannot override feature flags in production");
	}

	const defaults = getDefaultFlags(env);

	// Read existing overrides
	const result = await browser.storage.local.get([STORAGE_KEY]);
	const existingOverrides = (result[STORAGE_KEY] as Record<string, boolean> | undefined) ?? {};

	// If value matches default, remove the override
	if (value === defaults[flag]) {
		const remaining = Object.fromEntries(
			Object.entries(existingOverrides).filter(([key]) => key !== flag)
		);
		await browser.storage.local.set({ [STORAGE_KEY]: remaining });
	} else {
		// Otherwise, set the override
		await browser.storage.local.set({
			[STORAGE_KEY]: {
				...existingOverrides,
				[flag]: value,
			},
		});
	}
}

/**
 * Reset all feature flag overrides to defaults
 *
 * @throws Error if called in production environment
 */
export async function resetFeatureFlagOverrides(env: ExtensionEnv): Promise<void> {
	if (!canOverrideFlags(env)) {
		throw new Error("Cannot modify feature flags in production");
	}

	await browser.storage.local.remove([STORAGE_KEY]);
}
