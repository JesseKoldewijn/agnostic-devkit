/**
 * Logic hook for DebugMenu component
 */
import { createMemo, createResource, createSignal } from "solid-js";

import {
	type ExtensionEnv,
	FEATURE_FLAG_CATEGORIES,
	FEATURE_FLAG_META,
	type FeatureFlagCategory,
	type FeatureFlagMeta,
	type FeatureFlags,
	getDefaultFlags,
	getEffectiveProfile,
	getFeatureFlags,
	getForceProfile,
	resetFeatureFlagOverrides,
	setFeatureFlagOverride,
} from "@/logic/featureFlags";

import type { DebugMenuState, FlagState } from "./types";

// Get the build-time environment
declare const __EXTENSION_ENV__: ExtensionEnv;

/**
 * Create state management for the DebugMenu component
 */
export function createDebugMenuState(): DebugMenuState {
	const buildProfile = __EXTENSION_ENV__;

	// Reactive signals
	const [searchQuery, setSearchQuery] = createSignal("");
	const [collapsedCategories, setCollapsedCategories] = createSignal<Set<FeatureFlagCategory>>(
		new Set()
	);

	// Compute effective profile
	const effectiveProfile = createMemo(() => getEffectiveProfile(buildProfile));

	// Reactive signal for force profile, initialized from localStorage
	// This signal is reactive so the UI will update when it changes
	const [forceProfile] = createSignal<ExtensionEnv | null>(getForceProfile());

	// Check if force profile is active (and different from build)
	const isForceProfileActive = createMemo(() => {
		const forced = forceProfile();
		return forced !== null && forced !== buildProfile;
	});

	// Get defaults for effective profile
	const defaults = createMemo(() => getDefaultFlags(effectiveProfile()));

	// Load flags from storage
	const [flags, { refetch }] = createResource(
		effectiveProfile,
		async (env) => {
			return await getFeatureFlags(env);
		},
		{ initialValue: getDefaultFlags(buildProfile) }
	);

	// Compute which flags are overridden
	const overrides = createMemo(() => {
		const currentFlags = flags();
		const currentDefaults = defaults();
		const overridden = new Set<keyof FeatureFlags>();

		for (const key of Object.keys(FEATURE_FLAG_META) as (keyof FeatureFlags)[]) {
			if (currentFlags[key] !== currentDefaults[key]) {
				overridden.add(key);
			}
		}

		return overridden;
	});

	// Build flag states for UI
	const allFlagStates = createMemo((): FlagState[] => {
		const currentFlags = flags();
		const overriddenFlags = overrides();

		return (Object.entries(FEATURE_FLAG_META) as Array<[string, FeatureFlagMeta]>).map(
			([key, meta]) => ({
				key: key as keyof FeatureFlags,
				name: meta.name,
				description: meta.description,
				category: meta.category,
				value: currentFlags[key as keyof FeatureFlags],
				isOverridden: overriddenFlags.has(key as keyof FeatureFlags),
				deprecated: meta.deprecated,
			})
		);
	});

	// Filter flags by search query
	const filteredFlagsByCategory = createMemo(() => {
		const query = searchQuery().toLowerCase().trim();
		const flagStates = allFlagStates();

		// Group by category
		const grouped = new Map<FeatureFlagCategory, FlagState[]>();
		for (const category of Object.keys(FEATURE_FLAG_CATEGORIES) as FeatureFlagCategory[]) {
			grouped.set(category, []);
		}

		for (const flag of flagStates) {
			// Filter by search
			if (query) {
				const matchesName = flag.name.toLowerCase().includes(query);
				const matchesDescription = flag.description.toLowerCase().includes(query);
				const matchesKey = flag.key.toLowerCase().includes(query);
				if (!matchesName && !matchesDescription && !matchesKey) {
					continue;
				}
			}

			const arr = grouped.get(flag.category);
			if (arr) {
				arr.push(flag);
			}
		}

		return grouped;
	});

	// Count visible flags
	const visibleFlagCount = createMemo(() => {
		let count = 0;
		for (const flags of filteredFlagsByCategory().values()) {
			count += flags.length;
		}
		return count;
	});

	// Toggle category collapse
	const toggleCategory = (category: FeatureFlagCategory) => {
		setCollapsedCategories((prev) => {
			const next = new Set(prev);
			if (next.has(category)) {
				next.delete(category);
			} else {
				next.add(category);
			}
			return next;
		});
	};

	// Toggle a flag value
	const toggleFlag = async (flag: keyof FeatureFlags) => {
		const currentValue = flags()[flag];
		await setFeatureFlagOverride(flag, !currentValue, effectiveProfile());
		refetch();
	};

	// Reset all overrides
	const resetAllFlags = async () => {
		await resetFeatureFlagOverrides(effectiveProfile());
		refetch();
	};

	return {
		effectiveProfile,
		buildProfile,
		forceProfile,
		isForceProfileActive,
		searchQuery,
		setSearchQuery,
		collapsedCategories,
		toggleCategory,
		filteredFlagsByCategory,
		visibleFlagCount,
		toggleFlag,
		resetAllFlags,
		isLoading: () => flags.loading,
		refetch: () => {
			refetch();
		},
	};
}
