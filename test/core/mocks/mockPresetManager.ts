/**
 * Mock builder for PresetManager logic
 */
import type { Accessor } from "solid-js";

import { vi } from "vitest";

import type { ViewMode } from "@/components/presets/manager/types";
import type { Parameter, Preset, PrimitiveType } from "@/logic/parameters";
import type { DecompressResult } from "@/utils/presetCoder";

export interface PresetManagerLogic {
	// Pass-through props
	class: string | undefined;

	// Core state
	presets: Accessor<Preset[]>;
	loading: Accessor<boolean>;
	viewMode: Accessor<ViewMode>;
	editingPreset: Accessor<Preset | null>;
	confirmDelete: Accessor<string | null>;
	expandedPresetId: Accessor<string | null>;

	// Selection state (for export)
	selectedPresets: Accessor<Set<string>>;
	copySuccess: Accessor<boolean>;

	// Share import state
	shareImportData: Accessor<DecompressResult | null>;
	shareImportError: Accessor<string | null>;
	shareImportExpandedId: Accessor<string | null>;

	// Form state
	parameterIds: Accessor<string[]>;
	saving: Accessor<boolean>;

	// Navigation callbacks
	onClose: (() => void) | undefined;
	onStartCreate: () => void;
	onStartEdit: (preset: Preset) => void;
	onCancelForm: () => void;
	onToggleExpanded: (id: string) => void;
	onStartExport: () => void;
	onCancelExport: () => void;
	onStartFileImport: () => void;
	onCancelFileImport: () => void;
	onStartRepositoryImport: () => void;
	onRepositoryImportCancel: () => void;

	// Form callbacks
	onAddParameter: () => void;
	onRemoveParameter: (id: string) => void;
	onSavePreset: (e?: Event) => Promise<void>;
	getParameterData: (id: string) => Parameter;
	getPrimitiveType: (id: string) => PrimitiveType;
	onPrimitiveTypeChange: (id: string, type: PrimitiveType) => void;
	getBoolValue: (id: string) => boolean;
	onBoolValueChange: (id: string, value: boolean) => void;

	// CRUD callbacks
	onDelete: (id: string) => Promise<void>;
	onDuplicate: (id: string) => Promise<void>;
	onSetConfirmDelete: (id: string | null) => void;

	// Selection callbacks (for export)
	onTogglePresetSelection: (id: string) => void;
	onSelectAll: () => void;
	onClearSelection: () => void;

	// Export callbacks
	onExportDownload: () => Promise<void>;
	onExportUrl: () => Promise<void>;
	onExportSingle: (preset: Preset) => Promise<void>;

	// Import callbacks
	onImportFile: (e: Event) => Promise<void>;
	onRepositoryImportConfirm: (presets: Preset[]) => Promise<void>;

	// Share import callbacks
	onLoadShareUrl: (url: string) => void;
	onShareImportConfirm: () => Promise<void>;
	onShareImportCancel: () => void;
	onToggleShareImportExpanded: (id: string) => void;
}

export interface PresetManagerProps {
	class?: string;
	onClose?: () => void;
}

/**
 * Create a default empty parameter for form state
 */
function createEmptyParameter(): Parameter {
	return {
		id: `param-${Date.now()}`,
		type: "queryParam",
		key: "",
		value: "",
	};
}

/**
 * Create a mock PresetManagerLogic for testing UI components
 */
export function createMockPresetManagerLogic(
	overrides: Partial<{
		class: string | undefined;
		presets: Preset[];
		loading: boolean;
		viewMode: ViewMode;
		editingPreset: Preset | null;
		confirmDelete: string | null;
		expandedPresetId: string | null;
		selectedPresets: Set<string>;
		copySuccess: boolean;
		shareImportData: DecompressResult | null;
		shareImportError: string | null;
		shareImportExpandedId: string | null;
		parameterIds: string[];
		saving: boolean;
		onClose: (() => void) | undefined;
		onStartCreate: () => void;
		onStartEdit: (preset: Preset) => void;
		onCancelForm: () => void;
		onToggleExpanded: (id: string) => void;
		onStartExport: () => void;
		onCancelExport: () => void;
		onStartFileImport: () => void;
		onCancelFileImport: () => void;
		onStartRepositoryImport: () => void;
		onRepositoryImportCancel: () => void;
		onAddParameter: () => void;
		onRemoveParameter: (id: string) => void;
		onSavePreset: (e?: Event) => Promise<void>;
		getParameterData: (id: string) => Parameter;
		getPrimitiveType: (id: string) => PrimitiveType;
		onPrimitiveTypeChange: (id: string, type: PrimitiveType) => void;
		getBoolValue: (id: string) => boolean;
		onBoolValueChange: (id: string, value: boolean) => void;
		onDelete: (id: string) => Promise<void>;
		onDuplicate: (id: string) => Promise<void>;
		onSetConfirmDelete: (id: string | null) => void;
		onTogglePresetSelection: (id: string) => void;
		onSelectAll: () => void;
		onClearSelection: () => void;
		onExportDownload: () => Promise<void>;
		onExportUrl: () => Promise<void>;
		onExportSingle: (preset: Preset) => Promise<void>;
		onImportFile: (e: Event) => Promise<void>;
		onRepositoryImportConfirm: (presets: Preset[]) => Promise<void>;
		onLoadShareUrl: (url: string) => void;
		onShareImportConfirm: () => Promise<void>;
		onShareImportCancel: () => void;
		onToggleShareImportExpanded: (id: string) => void;
	}> = {}
): PresetManagerLogic {
	const {
		class: className = undefined,
		presets = [],
		loading = false,
		viewMode = "list",
		editingPreset = null,
		confirmDelete = null,
		expandedPresetId = null,
		selectedPresets = new Set<string>(),
		copySuccess = false,
		shareImportData = null,
		shareImportError = null,
		shareImportExpandedId = null,
		parameterIds = [],
		saving = false,
		onClose = undefined,
		onStartCreate = vi.fn(),
		onStartEdit = vi.fn(),
		onCancelForm = vi.fn(),
		onToggleExpanded = vi.fn(),
		onStartExport = vi.fn(),
		onCancelExport = vi.fn(),
		onStartFileImport = vi.fn(),
		onCancelFileImport = vi.fn(),
		onStartRepositoryImport = vi.fn(),
		onRepositoryImportCancel = vi.fn(),
		onAddParameter = vi.fn(),
		onRemoveParameter = vi.fn(),
		onSavePreset = vi.fn().mockResolvedValue(undefined),
		getParameterData = () => createEmptyParameter(),
		getPrimitiveType = () => "string" as PrimitiveType,
		onPrimitiveTypeChange = vi.fn(),
		getBoolValue = () => false,
		onBoolValueChange = vi.fn(),
		onDelete = vi.fn().mockResolvedValue(undefined),
		onDuplicate = vi.fn().mockResolvedValue(undefined),
		onSetConfirmDelete = vi.fn(),
		onTogglePresetSelection = vi.fn(),
		onSelectAll = vi.fn(),
		onClearSelection = vi.fn(),
		onExportDownload = vi.fn().mockResolvedValue(undefined),
		onExportUrl = vi.fn().mockResolvedValue(undefined),
		onExportSingle = vi.fn().mockResolvedValue(undefined),
		onImportFile = vi.fn().mockResolvedValue(undefined),
		onRepositoryImportConfirm = vi.fn().mockResolvedValue(undefined),
		onLoadShareUrl = vi.fn(),
		onShareImportConfirm = vi.fn().mockResolvedValue(undefined),
		onShareImportCancel = vi.fn(),
		onToggleShareImportExpanded = vi.fn(),
	} = overrides;

	return {
		class: className,
		presets: () => presets,
		loading: () => loading,
		viewMode: () => viewMode,
		editingPreset: () => editingPreset,
		confirmDelete: () => confirmDelete,
		expandedPresetId: () => expandedPresetId,
		selectedPresets: () => selectedPresets,
		copySuccess: () => copySuccess,
		shareImportData: () => shareImportData,
		shareImportError: () => shareImportError,
		shareImportExpandedId: () => shareImportExpandedId,
		parameterIds: () => parameterIds,
		saving: () => saving,
		onClose,
		onStartCreate,
		onStartEdit,
		onCancelForm,
		onToggleExpanded,
		onStartExport,
		onCancelExport,
		onStartFileImport,
		onCancelFileImport,
		onStartRepositoryImport,
		onRepositoryImportCancel,
		onAddParameter,
		onRemoveParameter,
		onSavePreset,
		getParameterData,
		getPrimitiveType,
		onPrimitiveTypeChange,
		getBoolValue,
		onBoolValueChange,
		onDelete,
		onDuplicate,
		onSetConfirmDelete,
		onTogglePresetSelection,
		onSelectAll,
		onClearSelection,
		onExportDownload,
		onExportUrl,
		onExportSingle,
		onImportFile,
		onRepositoryImportConfirm,
		onLoadShareUrl,
		onShareImportConfirm,
		onShareImportCancel,
		onToggleShareImportExpanded,
	};
}
