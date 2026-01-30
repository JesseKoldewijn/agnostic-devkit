/**
 * Shared types for preset manager components
 */
import type { Accessor, Setter } from "solid-js";

import type { Parameter, ParameterType, Preset, PrimitiveType } from "@/logic/parameters";
import type { DecompressResult } from "@/utils/presetCoder";

export type ViewMode =
	| "list"
	| "create"
	| "edit"
	| "export"
	| "share-import"
	| "repository-import"
	| "file-import";

export interface PresetManagerProps {
	/** Callback when user wants to close the manager */
	onClose?: () => void;
	/** Custom class for the container */
	class?: string;
}

export interface PresetManagerState {
	presets: Accessor<Preset[]>;
	loading: Accessor<boolean>;
	viewMode: Accessor<ViewMode>;
	setViewMode: Setter<ViewMode>;
	editingPreset: Accessor<Preset | null>;
	confirmDelete: Accessor<string | null>;
	setConfirmDelete: Setter<string | null>;
	expandedPresetId: Accessor<string | null>;
	setExpandedPresetId: Setter<string | null>;
	selectedPresets: Accessor<Set<string>>;
	setSelectedPresets: Setter<Set<string>>;
	copySuccess: Accessor<boolean>;
}

export interface PresetFormState {
	parameterIds: Accessor<string[]>;
	setParameterIds: Setter<string[]>;
	saving: Accessor<boolean>;
	initialParameterData: Accessor<Map<string, Parameter>>;
	setInitialParameterData: Setter<Map<string, Parameter>>;
	paramPrimitiveTypes: Accessor<Map<string, PrimitiveType>>;
	setParamPrimitiveTypes: Setter<Map<string, PrimitiveType>>;
	paramBoolValues: Accessor<Map<string, boolean>>;
	setParamBoolValues: Setter<Map<string, boolean>>;
}

export interface ShareImportState {
	shareImportData: Accessor<DecompressResult | null>;
	setShareImportData: Setter<DecompressResult | null>;
	shareImportError: Accessor<string | null>;
	setShareImportError: Setter<string | null>;
	shareUrlInput: Accessor<string>;
	setShareUrlInput: Setter<string>;
	shareImportExpandedId: Accessor<string | null>;
	setShareImportExpandedId: Setter<string | null>;
}

export interface PresetManagerActions {
	handleStartCreate: () => void;
	handleStartEdit: (preset: Preset) => void;
	handleCancelForm: () => void;
	handleDelete: (presetId: string) => Promise<void>;
	handleDuplicate: (presetId: string) => Promise<void>;
	handleToggleExpanded: (presetId: string) => void;
	handleStartExport: () => void;
	handleCancelExport: () => void;
	handleExportDownload: () => Promise<void>;
	handleExportUrl: () => Promise<void>;
	handleExportSingle: (preset: Preset) => Promise<void>;
	handleImport: (e: Event) => Promise<void>;
	handleStartRepositoryImport: () => void;
	handleRepositoryImportConfirm: (presets: Preset[]) => Promise<void>;
	handleRepositoryImportCancel: () => void;
}

export interface PresetFormActions {
	handleSavePreset: (e?: Event) => Promise<void>;
	handleAddParameter: () => void;
	handleRemoveParameter: (paramId: string) => void;
	getParameterData: (paramId: string) => Parameter;
	getParamPrimitiveType: (paramId: string) => PrimitiveType;
	setParamPrimitiveType: (paramId: string, type: PrimitiveType) => void;
	getParamBoolValue: (paramId: string) => boolean;
	setParamBoolValue: (paramId: string, value: boolean) => void;
}

export interface ShareImportActions {
	handleShareImportConfirm: () => Promise<void>;
	handleShareImportCancel: () => void;
	handleToggleShareImportExpanded: (presetId: string) => void;
	handleLoadShareUrl: () => void;
}

export interface PresetSelectionActions {
	handleTogglePresetSelection: (presetId: string) => void;
	handleClearSelection: () => void;
	handleSelectAll: () => void;
}

/** Combined state for components that need everything */
export interface PresetManagerCombinedState
	extends PresetManagerState, PresetFormState, ShareImportState {}

/** Combined actions for components that need everything */
export interface PresetManagerCombinedActions
	extends PresetManagerActions, PresetFormActions, ShareImportActions, PresetSelectionActions {}

/** Parameter type options for the form */
export const PARAMETER_TYPE_OPTIONS: { value: ParameterType; label: string }[] = [
	{ value: "queryParam", label: "Query Param" },
	{ value: "cookie", label: "Cookie" },
	{ value: "localStorage", label: "Local Storage" },
];

/** Primitive type options for the form */
export const PRIMITIVE_TYPE_OPTIONS: { value: PrimitiveType; label: string }[] = [
	{ value: "string", label: "String" },
	{ value: "boolean", label: "Boolean" },
];
