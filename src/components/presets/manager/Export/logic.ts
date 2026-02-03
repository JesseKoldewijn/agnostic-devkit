/**
 * Export component logic - handles local state and event wrappers
 */
import type { Accessor } from "solid-js";
import { createMemo, createSignal } from "solid-js";

import type { Preset } from "@/logic/parameters";

// ============================================================================
// External Props (passed in from parent)
// ============================================================================

export interface ExportProps {
	presets: Preset[];
	selectedPresets: Set<string>;
	copySuccess: boolean;
	onToggleSelection: (presetId: string) => void;
	onSelectAll: () => void;
	onClearSelection: () => void;
	onCancel: () => void;
	onExportDownload: () => Promise<void>;
	onExportUrl: () => Promise<void>;
}

// ============================================================================
// Logic Interface (what UI receives)
// ============================================================================

export interface ExportLogic {
	// Pass-through props from parent (used directly in UI)
	presets: Preset[];
	selectedPresets: Set<string>;
	copySuccess: boolean;
	onToggleSelection: (presetId: string) => void;
	onSelectAll: () => void;
	onClearSelection: () => void;
	onCancel: () => void;

	// Reactive getters (local state managed here)
	expandedPresetId: Accessor<string | null>;
	isExporting: Accessor<boolean>;
	allSelected: Accessor<boolean>;

	// Wrapped callbacks (add loading state management)
	onToggleExpanded: (presetId: string) => void;
	handleExportDownload: () => Promise<void>;
	handleExportUrl: () => Promise<void>;
}

// ============================================================================
// Logic Factory
// ============================================================================

export function createExportLogic(props: ExportProps): ExportLogic {
	// Local state
	const [expandedPresetId, setExpandedPresetId] = createSignal<string | null>(null);
	const [isExporting, setIsExporting] = createSignal(false);

	// Computed values
	const allSelected = createMemo(
		() => props.presets.length > 0 && props.selectedPresets.size === props.presets.length
	);

	// Toggle expanded preset
	const onToggleExpanded = (presetId: string): void => {
		setExpandedPresetId(expandedPresetId() === presetId ? null : presetId);
	};

	// Wrapped export download with loading state
	const handleExportDownload = async (): Promise<void> => {
		setIsExporting(true);
		try {
			await props.onExportDownload();
		} finally {
			setIsExporting(false);
		}
	};

	// Wrapped export URL with loading state
	const handleExportUrl = async (): Promise<void> => {
		setIsExporting(true);
		try {
			await props.onExportUrl();
		} finally {
			setIsExporting(false);
		}
	};

	return {
		// Pass-through props
		presets: props.presets,
		selectedPresets: props.selectedPresets,
		copySuccess: props.copySuccess,
		onToggleSelection: props.onToggleSelection,
		onSelectAll: props.onSelectAll,
		onClearSelection: props.onClearSelection,
		onCancel: props.onCancel,

		// Reactive getters
		expandedPresetId,
		isExporting,
		allSelected,

		// Wrapped callbacks
		onToggleExpanded,
		handleExportDownload,
		handleExportUrl,
	};
}
