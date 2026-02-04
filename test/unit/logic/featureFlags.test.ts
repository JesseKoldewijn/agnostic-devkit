/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";

import {
	FEATURE_FLAG_CATEGORIES,
	FEATURE_FLAG_META,
	type FeatureFlagCategory,
	type FeatureFlags,
	canOverrideFlags,
	clearForceProfile,
	getDefaultFlags,
	getDeprecatedFlags,
	getEffectiveProfile,
	getFeatureFlags,
	getFlagsByCategory,
	getForceProfile,
	isValidExtensionEnv,
	resetFeatureFlagOverrides,
	setFeatureFlagOverride,
	setForceProfile,
} from "@/logic/featureFlags";

// Mock localStorage for node environment
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] ?? null,
		setItem: (key: string, value: string) => {
			store[key] = value;
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		},
	};
})();

describe("featureFlags", () => {
	beforeEach(() => {
		fakeBrowser.reset();
		// Setup localStorage mock
		vi.stubGlobal("localStorage", localStorageMock);
		localStorageMock.clear();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	describe("FEATURE_FLAG_META", () => {
		it("should have metadata for all feature flags", () => {
			expect(FEATURE_FLAG_META).toBeDefined();
			expect(typeof FEATURE_FLAG_META).toBe("object");

			// Each flag should have name, description, and defaults
			for (const meta of Object.values(FEATURE_FLAG_META)) {
				expect(meta).toHaveProperty("name");
				expect(meta).toHaveProperty("description");
				expect(meta).toHaveProperty("defaults");
				expect(meta.defaults).toHaveProperty("development");
				expect(meta.defaults).toHaveProperty("canary");
				expect(meta.defaults).toHaveProperty("production");
				expect(typeof meta.defaults.development).toBe("boolean");
				expect(typeof meta.defaults.canary).toBe("boolean");
				expect(typeof meta.defaults.production).toBe("boolean");
			}
		});
	});

	describe("getDefaultFlags", () => {
		it("should return development defaults for development environment", () => {
			const flags = getDefaultFlags("development");

			// All flags should be present
			for (const key of Object.keys(FEATURE_FLAG_META)) {
				expect(flags).toHaveProperty(key);
				expect(flags[key as keyof FeatureFlags]).toBe(
					FEATURE_FLAG_META[key as keyof typeof FEATURE_FLAG_META].defaults.development
				);
			}
		});

		it("should return canary defaults for canary environment", () => {
			const flags = getDefaultFlags("canary");

			for (const key of Object.keys(FEATURE_FLAG_META)) {
				expect(flags).toHaveProperty(key);
				expect(flags[key as keyof FeatureFlags]).toBe(
					FEATURE_FLAG_META[key as keyof typeof FEATURE_FLAG_META].defaults.canary
				);
			}
		});

		it("should return production defaults for production environment", () => {
			const flags = getDefaultFlags("production");

			for (const key of Object.keys(FEATURE_FLAG_META)) {
				expect(flags).toHaveProperty(key);
				expect(flags[key as keyof FeatureFlags]).toBe(
					FEATURE_FLAG_META[key as keyof typeof FEATURE_FLAG_META].defaults.production
				);
			}
		});
	});

	describe("canOverrideFlags", () => {
		it("should return true for development environment", () => {
			expect(canOverrideFlags("development")).toBe(true);
		});

		it("should return true for canary environment", () => {
			expect(canOverrideFlags("canary")).toBe(true);
		});

		it("should return false for production environment", () => {
			expect(canOverrideFlags("production")).toBe(false);
		});
	});

	describe("getFeatureFlags", () => {
		it("should return default flags when no overrides exist in development", async () => {
			const flags = await getFeatureFlags("development");
			const defaults = getDefaultFlags("development");

			expect(flags).toEqual(defaults);
		});

		it("should return default flags when no overrides exist in canary", async () => {
			const flags = await getFeatureFlags("canary");
			const defaults = getDefaultFlags("canary");

			expect(flags).toEqual(defaults);
		});

		it("should return default flags in production (ignoring any overrides)", async () => {
			// Even if someone somehow writes overrides to storage
			await fakeBrowser.storage.local.set({
				featureFlagOverrides: { debugLogging: true },
			});

			const flags = await getFeatureFlags("production");
			const defaults = getDefaultFlags("production");

			expect(flags).toEqual(defaults);
		});

		it("should merge overrides with defaults in development", async () => {
			// debugLogging default in development is true, so we set it to false to test override
			await fakeBrowser.storage.local.set({
				featureFlagOverrides: { debugLogging: false },
			});

			const flags = await getFeatureFlags("development");

			expect(flags.debugLogging).toBe(false);
		});

		it("should merge overrides with defaults in canary", async () => {
			await fakeBrowser.storage.local.set({
				featureFlagOverrides: { experimentalFeatures: false },
			});

			const flags = await getFeatureFlags("canary");

			expect(flags.experimentalFeatures).toBe(false);
		});

		it("should ignore invalid override keys", async () => {
			await fakeBrowser.storage.local.set({
				featureFlagOverrides: {
					debugLogging: false,
					invalidFlag: true,
				},
			});

			const flags = await getFeatureFlags("development");

			expect(flags.debugLogging).toBe(false);
			expect(flags).not.toHaveProperty("invalidFlag");
		});

		it("should ignore non-boolean override values", async () => {
			await fakeBrowser.storage.local.set({
				featureFlagOverrides: {
					debugLogging: "true", // string, not boolean
				},
			});

			const flags = await getFeatureFlags("development");
			const defaults = getDefaultFlags("development");

			// Should use default because override value is invalid
			expect(flags.debugLogging).toBe(defaults.debugLogging);
		});
	});

	describe("setFeatureFlagOverride", () => {
		it("should save override to storage in development", async () => {
			await setFeatureFlagOverride("debugLogging", false, "development");

			const result = await fakeBrowser.storage.local.get(["featureFlagOverrides"]);
			expect(result.featureFlagOverrides).toEqual({
				debugLogging: false,
			});
		});

		it("should save override to storage in canary", async () => {
			await setFeatureFlagOverride("experimentalFeatures", false, "canary");

			const result = await fakeBrowser.storage.local.get(["featureFlagOverrides"]);
			expect(result.featureFlagOverrides).toEqual({
				experimentalFeatures: false,
			});
		});

		it("should throw error when trying to override in production", async () => {
			await expect(setFeatureFlagOverride("debugLogging", true, "production")).rejects.toThrow(
				"Cannot override feature flags in production"
			);
		});

		it("should merge with existing overrides", async () => {
			await fakeBrowser.storage.local.set({
				featureFlagOverrides: { debugLogging: false },
			});

			await setFeatureFlagOverride("experimentalFeatures", false, "development");

			const result = await fakeBrowser.storage.local.get(["featureFlagOverrides"]);
			expect(result.featureFlagOverrides).toEqual({
				debugLogging: false,
				experimentalFeatures: false,
			});
		});

		it("should remove override when value matches default", async () => {
			const defaults = getDefaultFlags("development");
			await fakeBrowser.storage.local.set({
				featureFlagOverrides: { debugLogging: !defaults.debugLogging },
			});

			await setFeatureFlagOverride("debugLogging", defaults.debugLogging, "development");

			// Override should be removed since it matches default
			const result = await fakeBrowser.storage.local.get(["featureFlagOverrides"]);
			expect(result.featureFlagOverrides).toEqual({});
		});
	});

	describe("resetFeatureFlagOverrides", () => {
		it("should clear all overrides from storage in development", async () => {
			await fakeBrowser.storage.local.set({
				featureFlagOverrides: {
					debugLogging: false,
					experimentalFeatures: false,
				},
			});

			await resetFeatureFlagOverrides("development");

			const result = await fakeBrowser.storage.local.get(["featureFlagOverrides"]);
			expect(result.featureFlagOverrides).toBeUndefined();
		});

		it("should clear all overrides from storage in canary", async () => {
			await fakeBrowser.storage.local.set({
				featureFlagOverrides: { debugLogging: false },
			});

			await resetFeatureFlagOverrides("canary");

			const result = await fakeBrowser.storage.local.get(["featureFlagOverrides"]);
			expect(result.featureFlagOverrides).toBeUndefined();
		});

		it("should throw error when trying to reset in production", async () => {
			await expect(resetFeatureFlagOverrides("production")).rejects.toThrow(
				"Cannot modify feature flags in production"
			);
		});
	});

	describe("type safety", () => {
		it("should have consistent flag keys across all exports", () => {
			const metaKeys = Object.keys(FEATURE_FLAG_META).sort((a, b) => a.localeCompare(b));
			const defaultKeys = Object.keys(getDefaultFlags("development")).sort((a, b) =>
				a.localeCompare(b)
			);

			expect(metaKeys).toEqual(defaultKeys);
		});
	});

	describe("categories", () => {
		it("should have category for all flags", () => {
			for (const meta of Object.values(FEATURE_FLAG_META)) {
				expect(meta.category).toBeDefined();
				expect(typeof meta.category).toBe("string");
				expect(FEATURE_FLAG_CATEGORIES[meta.category]).toBeDefined();
			}
		});

		it("getFlagsByCategory should group flags correctly", () => {
			const grouped = getFlagsByCategory();

			// Should have all categories
			for (const category of Object.keys(FEATURE_FLAG_CATEGORIES)) {
				expect(grouped.has(category as FeatureFlagCategory)).toBe(true);
			}

			// Count total flags
			let totalFlags = 0;
			for (const flags of grouped.values()) {
				totalFlags += flags.length;
			}
			expect(totalFlags).toBe(Object.keys(FEATURE_FLAG_META).length);
		});
	});

	describe("getDeprecatedFlags", () => {
		it("should return empty array when no flags are deprecated", () => {
			const deprecated = getDeprecatedFlags();
			// Current implementation has no deprecated flags
			expect(deprecated).toEqual([]);
		});
	});

	describe("forceProfile", () => {
		beforeEach(() => {
			// Clear localStorage before each test
			localStorageMock.clear();
		});

		it("isValidExtensionEnv should return true for valid environments", () => {
			expect(isValidExtensionEnv("development")).toBe(true);
			expect(isValidExtensionEnv("canary")).toBe(true);
			expect(isValidExtensionEnv("production")).toBe(true);
		});

		it("isValidExtensionEnv should return false for invalid values", () => {
			expect(isValidExtensionEnv("invalid")).toBe(false);
			expect(isValidExtensionEnv("")).toBe(false);
			expect(isValidExtensionEnv("dev")).toBe(false);
		});

		it("getForceProfile should return null when not set", () => {
			expect(getForceProfile()).toBeNull();
		});

		it("setForceProfile should store value in localStorage", () => {
			setForceProfile("canary");
			expect(localStorageMock.getItem("forceProfile")).toBe("canary");
		});

		it("getForceProfile should return stored value", () => {
			localStorageMock.setItem("forceProfile", "production");
			expect(getForceProfile()).toBe("production");
		});

		it("clearForceProfile should remove value from localStorage", () => {
			localStorageMock.setItem("forceProfile", "canary");
			clearForceProfile();
			expect(localStorageMock.getItem("forceProfile")).toBeNull();
		});

		it("setForceProfile(null) should clear the value", () => {
			localStorageMock.setItem("forceProfile", "canary");
			setForceProfile(null);
			expect(localStorageMock.getItem("forceProfile")).toBeNull();
		});

		it("getEffectiveProfile should return buildEnv when no override", () => {
			expect(getEffectiveProfile("development")).toBe("development");
			expect(getEffectiveProfile("production")).toBe("production");
		});

		it("getEffectiveProfile should return forced profile when set", () => {
			setForceProfile("canary");
			expect(getEffectiveProfile("development")).toBe("canary");
			expect(getEffectiveProfile("production")).toBe("canary");
		});

		it("getEffectiveProfile should ignore invalid localStorage values", () => {
			localStorageMock.setItem("forceProfile", "invalid");
			expect(getEffectiveProfile("development")).toBe("development");
		});
	});
});
