/**
 * Mock builder for PresetToggleList logic
 */
import type { Accessor } from "solid-js";

import { vi } from "vitest";

import type { Preset } from "@/logic/parameters";

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

export interface PresetToggleListProps {
	expanded?: boolean;
	onManagePresets?: () => void;
	class?: string;
}

/**
 * Create a mock PresetToggleListLogic for testing UI components
 */
export function createMockPresetToggleListLogic(
	overrides: Partial<{
		// Pass-through props
		expanded: boolean;
		onManagePresets: () => void;
		class: string;
		// State
		presets: (Preset & { isActive: boolean })[];
		currentTabId: number | null;
		loading: boolean;
		togglingPreset: string | null;
		expandedPresetId: string | null;
		onToggle: (presetId: string) => Promise<void>;
		onToggleExpanded: (presetId: string) => void;
	}> = {}
): PresetToggleListLogic {
	const {
		// Pass-through props
		expanded = false,
		onManagePresets = undefined,
		class: className = undefined,
		// State
		presets = [],
		currentTabId = 1,
		loading = false,
		togglingPreset = null,
		expandedPresetId = null,
		onToggle = vi.fn().mockResolvedValue(undefined),
		onToggleExpanded = vi.fn(),
	} = overrides;

	return {
		// Pass-through props
		expanded,
		onManagePresets,
		class: className,
		// Reactive getters
		presets: () => presets,
		currentTabId: () => currentTabId,
		loading: () => loading,
		togglingPreset: () => togglingPreset,
		expandedPresetId: () => expandedPresetId,
		// Callbacks
		onToggle,
		onToggleExpanded,
	};
}

/**
 * Create sample presets with active state for testing
 */
export function createPresetsWithActiveState(
	presets: Preset[],
	activeIds: string[] = []
): (Preset & { isActive: boolean })[] {
	return presets.map((preset) => ({
		...preset,
		isActive: activeIds.includes(preset.id),
	}));
}
