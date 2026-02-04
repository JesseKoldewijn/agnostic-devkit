/**
 * Types for DebugMenu component
 */
import type { Accessor, Setter } from "solid-js";

import type { ExtensionEnv, FeatureFlagCategory, FeatureFlags } from "@/logic/featureFlags";

/**
 * Props for DebugMenu modal
 */
export interface DebugMenuProps {
	/** Whether the modal is open */
	readonly open: boolean;
	/** Callback when modal should close */
	readonly onClose: () => void;
}

/**
 * State for a single feature flag in the UI
 */
export interface FlagState {
	key: keyof FeatureFlags;
	name: string;
	description: string;
	category: FeatureFlagCategory;
	value: boolean;
	isOverridden: boolean;
	deprecated?: boolean | string;
}

/**
 * State returned by createDebugMenuState hook
 */
export interface DebugMenuState {
	/** Current effective environment profile */
	effectiveProfile: Accessor<ExtensionEnv>;
	/** Build-time environment */
	buildProfile: ExtensionEnv;
	/** The currently forced profile (null if none) */
	forceProfile: Accessor<ExtensionEnv | null>;
	/** Whether force profile is active (forced to a different profile than build) */
	isForceProfileActive: Accessor<boolean>;
	/** Search query for filtering flags */
	searchQuery: Accessor<string>;
	/** Set the search query */
	setSearchQuery: Setter<string>;
	/** Collapsed category state */
	collapsedCategories: Accessor<Set<FeatureFlagCategory>>;
	/** Toggle category collapse state */
	toggleCategory: (category: FeatureFlagCategory) => void;
	/** All flags grouped by category (filtered by search) */
	filteredFlagsByCategory: Accessor<Map<FeatureFlagCategory, FlagState[]>>;
	/** Total count of visible flags after filtering */
	visibleFlagCount: Accessor<number>;
	/** Toggle a feature flag value */
	toggleFlag: (flag: keyof FeatureFlags) => Promise<void>;
	/** Reset all flag overrides */
	resetAllFlags: () => Promise<void>;
	/** Whether flags are loading */
	isLoading: Accessor<boolean>;
	/** Refetch flags from storage */
	refetch: () => void;
}
