/**
 * ShareImport component logic - handles local state for import selections
 */
import type { Accessor } from "solid-js";
import { createMemo, createSignal } from "solid-js";

import type { Preset } from "@/logic/parameters";
import type { DecompressResult } from "@/utils/presetCoder";

// ============================================================================
// External Props (passed in from parent)
// ============================================================================

export interface ShareImportProps {
	shareImportData: DecompressResult | null;
	shareImportError: string | null;
	expandedPresetId: string | null;
	onToggleExpanded: (presetId: string) => void;
	onConfirm: (selectedPresetIds: Set<string>) => void;
	onCancel: () => void;
}

// ============================================================================
// Logic Interface (what UI receives)
// ============================================================================

export interface ShareImportLogic {
	// Pass-through props from parent (used directly in UI)
	shareImportError: string | null;
	expandedPresetId: string | null;
	onToggleExpanded: (presetId: string) => void;
	onCancel: () => void;

	// Reactive getters (local state managed here)
	importSelections: Accessor<Set<string>>;
	presets: Accessor<Preset[]>;
	allSelected: Accessor<boolean>;

	// Callbacks
	onToggleSelection: (presetId: string) => void;
	onSelectAll: () => void;
	onDeselectAll: () => void;
	onConfirm: () => void;
}

// ============================================================================
// Logic Factory
// ============================================================================

export function createShareImportLogic(props: ShareImportProps): ShareImportLogic {
	// Extract presets from share data
	const presets = createMemo((): Preset[] => {
		if (!props.shareImportData) return [];
		return props.shareImportData.result;
	});

	// Initialize import selections with all presets selected
	const initialSelections = (): Set<string> => {
		const allPresets = presets();
		return new Set(allPresets.map((p) => p.id));
	};

	const [importSelections, setImportSelections] = createSignal<Set<string>>(initialSelections());

	// Computed: check if all are selected
	const allSelected = createMemo(
		() => presets().length > 0 && importSelections().size === presets().length
	);

	// Toggle individual selection
	const onToggleSelection = (presetId: string): void => {
		setImportSelections((prev) => {
			const next = new Set(prev);
			if (next.has(presetId)) {
				next.delete(presetId);
			} else {
				next.add(presetId);
			}
			return next;
		});
	};

	// Select all presets
	const onSelectAll = (): void => {
		const allPresets = presets();
		setImportSelections(new Set(allPresets.map((p) => p.id)));
	};

	// Deselect all presets
	const onDeselectAll = (): void => {
		setImportSelections(new Set<string>());
	};

	// Confirm with current selections
	const onConfirm = (): void => {
		props.onConfirm(importSelections());
	};

	return {
		// Pass-through props
		shareImportError: props.shareImportError,
		expandedPresetId: props.expandedPresetId,
		onToggleExpanded: props.onToggleExpanded,
		onCancel: props.onCancel,

		// Reactive getters
		importSelections,
		presets,
		allSelected,

		// Callbacks
		onToggleSelection,
		onSelectAll,
		onDeselectAll,
		onConfirm,
	};
}
