/**
 * PresetToggleList Logic
 *
 * Pure TypeScript logic for the PresetToggleList component.
 * Manages state for displaying and toggling presets on the current tab.
 */
import type { Accessor } from "solid-js";
import { createEffect, createSignal, onCleanup, onMount } from "solid-js";

import { browser } from "wxt/browser";

import type { Preset } from "@/logic/parameters";
import {
	getPresetsWithActiveState,
	onPresetsChanged,
	onTabPresetStatesChanged,
	togglePreset,
} from "@/logic/parameters";

// ============================================================================
// Types
// ============================================================================

export interface PresetToggleListProps {
	/** Whether to show expanded details (parameter list) */
	expanded?: boolean;
	/** Callback when manage presets button is clicked */
	onManagePresets?: () => void;
	/** Custom class for the container */
	class?: string;
}

export interface PresetToggleListLogic {
	// Pass-through props from external
	expanded: boolean | undefined;
	onManagePresets: (() => void) | undefined;
	class: string | undefined;

	// Reactive getters
	presets: Accessor<(Preset & { isActive: boolean })[]>;
	currentTabId: Accessor<number | null>;
	loading: Accessor<boolean>;
	togglingPreset: Accessor<string | null>;
	expandedPresetId: Accessor<string | null>;

	// Callbacks
	onToggle: (presetId: string) => Promise<void>;
	onToggleExpanded: (presetId: string) => void;
}

// ============================================================================
// Logic Factory
// ============================================================================

/**
 * Create the logic for PresetToggleList component
 */
export function createPresetToggleListLogic(props: PresetToggleListProps): PresetToggleListLogic {
	// State signals
	const [presets, setPresets] = createSignal<(Preset & { isActive: boolean })[]>([]);
	const [currentTabId, setCurrentTabId] = createSignal<number | null>(null);
	const [loading, setLoading] = createSignal(true);
	const [togglingPreset, setTogglingPreset] = createSignal<string | null>(null);
	const [expandedPresetId, setExpandedPresetId] = createSignal<string | null>(null);

	// ========== Helper Functions ==========

	/**
	 * Check if there's a test override for the target tab ID
	 */
	const getTestOverrideTabId = (): number | null => {
		const urlParams = new URLSearchParams(window.location.search);
		const overrideTabId = urlParams.get("targetTabId");
		if (overrideTabId) {
			const parsed = Number.parseInt(overrideTabId, 10);
			if (!Number.isNaN(parsed)) {
				return parsed;
			}
		}
		return null;
	};

	/**
	 * Get the current tab ID
	 */
	const getCurrentTabId = async (): Promise<number | null> => {
		// Check for test override via URL param (used in e2e tests)
		const overrideId = getTestOverrideTabId();
		if (overrideId !== null) {
			return overrideId;
		}

		try {
			const tabs = await browser.tabs?.query({ active: true, currentWindow: true });
			return tabs?.[0]?.id ?? null;
		} catch {
			return null;
		}
	};

	/**
	 * Load presets for the current tab
	 */
	const loadPresets = async () => {
		const tabId = currentTabId();
		if (tabId === null) {
			return;
		}

		try {
			const presetsWithState = await getPresetsWithActiveState(tabId);
			setPresets(presetsWithState);
		} catch (error) {
			console.error("[PresetToggleList] Failed to load presets:", error);
		} finally {
			setLoading(false);
		}
	};

	// ========== Callbacks ==========

	/**
	 * Handle preset toggle
	 */
	const onToggle = async (presetId: string): Promise<void> => {
		const tabId = currentTabId();
		if (tabId === null) {
			return;
		}

		setTogglingPreset(presetId);
		try {
			await togglePreset(tabId, presetId);
			await loadPresets();
		} catch (error) {
			console.error("[PresetToggleList] Failed to toggle preset:", error);
		} finally {
			setTogglingPreset(null);
		}
	};

	/**
	 * Toggle expanded state for a preset
	 */
	const onToggleExpanded = (presetId: string): void => {
		// Only allow expansion if expanded prop is true
		if (props.expanded) {
			setExpandedPresetId((current) => (current === presetId ? null : presetId));
		}
	};

	// ========== Lifecycle ==========

	onMount(async () => {
		const tabId = await getCurrentTabId();
		setCurrentTabId(tabId);
		if (tabId !== null) {
			await loadPresets();
		} else {
			setLoading(false);
		}

		// Don't set up tab change listeners if using a test override
		const hasTestOverride = getTestOverrideTabId() !== null;
		if (hasTestOverride) {
			return;
		}

		// Listen for tab activation changes
		const handleTabActivated = async (activeInfo: { tabId: number; windowId: number }) => {
			setCurrentTabId(activeInfo.tabId);
			await loadPresets();
		};

		// Listen for tab updates (URL changes in the current tab)
		const handleTabUpdated = async (
			tabId: number,
			_changeInfo: { status?: string; url?: string },
			_tab: { id?: number; url?: string }
		) => {
			if (tabId === currentTabId()) {
				await loadPresets();
			}
		};

		// Add listeners
		browser.tabs?.onActivated.addListener(handleTabActivated);
		browser.tabs?.onUpdated.addListener(handleTabUpdated);

		// Cleanup on unmount
		onCleanup(() => {
			browser.tabs?.onActivated.removeListener(handleTabActivated);
			browser.tabs?.onUpdated.removeListener(handleTabUpdated);
		});
	});

	// Subscribe to storage changes
	createEffect(() => {
		const unsubPresets = onPresetsChanged(() => {
			loadPresets();
		});

		const unsubTabStates = onTabPresetStatesChanged(() => {
			loadPresets();
		});

		onCleanup(() => {
			unsubPresets();
			unsubTabStates();
		});
	});

	// ========== Return Logic Interface ==========

	return {
		// Pass-through props from external
		expanded: props.expanded,
		onManagePresets: props.onManagePresets,
		class: props.class,

		// Reactive getters
		presets,
		currentTabId,
		loading,
		togglingPreset,
		expandedPresetId,

		// Callbacks
		onToggle,
		onToggleExpanded,
	};
}
