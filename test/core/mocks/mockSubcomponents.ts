/**
 * Mock builders for sub-components (Export, ShareImport)
 */
import type { Accessor } from "solid-js";

import { vi } from "vitest";

import type { Preset } from "@/logic/parameters";

// ============================================================================
// Export Logic Mock
// ============================================================================

/**
 * ExportLogic interface - matches src/components/presets/manager/Export/logic.ts
 * Includes pass-through props from parent and local state management
 */
export interface ExportLogic {
	// Pass-through props from parent (used directly in UI)
	presets: Preset[];
	selectedPresets: Set<string>;
	copySuccess: boolean;
	onToggleSelection: (presetId: string) => void;
	onSelectAll: () => void;
	onClearSelection: () => void;
	onCancel: () => void;

	// Reactive getters (local state managed by logic)
	expandedPresetId: Accessor<string | null>;
	isExporting: Accessor<boolean>;
	allSelected: Accessor<boolean>;
	// Search state
	searchQuery: Accessor<string>;
	setSearchQuery: (query: string) => void;
	filteredPresets: Accessor<Preset[]>;
	// Wrapped callbacks (add loading state management)
	onToggleExpanded: (presetId: string) => void;
	handleExportDownload: () => Promise<void>;
	handleExportUrl: () => Promise<void>;
}

/**
 * ExportProps interface - external props passed to connected component
 */
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

/**
 * Create a mock ExportLogic for testing UI components
 */
export function createMockExportLogic(
	overrides: Partial<{
		// Pass-through props
		presets: Preset[];
		selectedPresets: Set<string>;
		copySuccess: boolean;
		onToggleSelection: (presetId: string) => void;
		onSelectAll: () => void;
		onClearSelection: () => void;
		onCancel: () => void;
		// Local state
		expandedPresetId: string | null;
		isExporting: boolean;
		allSelected: boolean;
		// Search state
		searchQuery: string;
		setSearchQuery: (query: string) => void;
		filteredPresets: Preset[];
		// Wrapped callbacks
		onToggleExpanded: (presetId: string) => void;
		handleExportDownload: () => Promise<void>;
		handleExportUrl: () => Promise<void>;
	}> = {}
): ExportLogic {
	const {
		// Pass-through props with defaults
		presets = [],
		selectedPresets = new Set<string>(),
		copySuccess = false,
		onToggleSelection = vi.fn(),
		onSelectAll = vi.fn(),
		onClearSelection = vi.fn(),
		onCancel = vi.fn(),
		// Local state
		expandedPresetId = null,
		isExporting = false,
		allSelected = false,
		// Search state
		searchQuery = "",
		setSearchQuery = vi.fn(),
		filteredPresets = presets, // Default to showing all presets
		// Wrapped callbacks
		onToggleExpanded = vi.fn(),
		handleExportDownload = vi.fn().mockResolvedValue(undefined),
		handleExportUrl = vi.fn().mockResolvedValue(undefined),
	} = overrides;

	return {
		// Pass-through props
		presets,
		selectedPresets,
		copySuccess,
		onToggleSelection,
		onSelectAll,
		onClearSelection,
		onCancel,
		// Reactive getters
		expandedPresetId: () => expandedPresetId,
		isExporting: () => isExporting,
		allSelected: () => allSelected,
		// Search state
		searchQuery: () => searchQuery,
		setSearchQuery,
		filteredPresets: () => filteredPresets,
		// Wrapped callbacks
		onToggleExpanded,
		handleExportDownload,
		handleExportUrl,
	};
}

// ============================================================================
// ShareImport Logic Mock
// ============================================================================

/**
 * ShareImportLogic interface - matches src/components/presets/manager/ShareImport/logic.ts
 * Includes pass-through props from parent and local state management
 */
export interface ShareImportLogic {
	// Pass-through props from parent (used directly in UI)
	shareImportError: string | null;
	expandedPresetId: string | null;
	onToggleExpanded: (presetId: string) => void;
	onCancel: () => void;

	// Reactive getters (local state managed by logic)
	importSelections: Accessor<Set<string>>;
	presets: Accessor<Preset[]>;
	filteredPresets: Accessor<Preset[]>;
	searchQuery: Accessor<string>;
	setSearchQuery: (query: string) => void;
	allSelected: Accessor<boolean>;

	// Callbacks
	onToggleSelection: (presetId: string) => void;
	onSelectAll: () => void;
	onClearSelection: () => void;
	onConfirm: () => void;
}

/**
 * ShareImportProps interface - external props passed to connected component
 */
export interface ShareImportProps {
	shareImportData: { result: Preset[] } | null;
	shareImportError: string | null;
	expandedPresetId: string | null;
	onToggleExpanded: (presetId: string) => void;
	onConfirm: (selectedPresetIds: Set<string>) => void;
	onCancel: () => void;
}

/**
 * Create a mock ShareImportLogic for testing UI components
 */
export function createMockShareImportLogic(
	overrides: Partial<{
		// Pass-through props
		shareImportError: string | null;
		expandedPresetId: string | null;
		onToggleExpanded: (presetId: string) => void;
		onCancel: () => void;
		// Local state
		importSelections: Set<string>;
		presets: Preset[];
		filteredPresets: Preset[];
		searchQuery: string;
		setSearchQuery: (query: string) => void;
		allSelected: boolean;
		// Callbacks
		onToggleSelection: (presetId: string) => void;
		onSelectAll: () => void;
		onClearSelection: () => void;
		onConfirm: () => void;
	}> = {}
): ShareImportLogic {
	const {
		// Pass-through props with defaults
		shareImportError = null,
		expandedPresetId = null,
		onToggleExpanded = vi.fn(),
		onCancel = vi.fn(),
		// Local state
		importSelections = new Set<string>(),
		presets = [],
		filteredPresets = presets, // Default to showing all presets
		searchQuery = "",
		setSearchQuery = vi.fn(),
		allSelected = false,
		// Callbacks
		onToggleSelection = vi.fn(),
		onSelectAll = vi.fn(),
		onClearSelection = vi.fn(),
		onConfirm = vi.fn(),
	} = overrides;

	return {
		// Pass-through props
		shareImportError,
		expandedPresetId,
		onToggleExpanded,
		onCancel,
		// Reactive getters
		importSelections: () => importSelections,
		presets: () => presets,
		filteredPresets: () => filteredPresets,
		searchQuery: () => searchQuery,
		setSearchQuery,
		allSelected: () => allSelected,
		// Callbacks
		onToggleSelection,
		onSelectAll,
		onClearSelection,
		onConfirm,
	};
}
