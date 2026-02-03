/**
 * PresetManager Logic
 * Pure business logic for the PresetManager orchestrator component
 * Uses SolidJS primitives only for reactive state management
 */
import type { Accessor } from "solid-js";
import { createEffect, createSignal, onCleanup, onMount } from "solid-js";

import type { Parameter, Preset, PrimitiveType } from "@/logic/parameters";
import {
	createEmptyParameter,
	createPreset,
	deletePreset,
	duplicatePreset,
	exportPresets,
	generateShareUrl,
	getPresets,
	importPresets,
	migratePresetsIfNeeded,
	onPresetsChanged,
	parseShareUrl,
	updatePresetData,
} from "@/logic/parameters";
import type { DecompressResult } from "@/utils/presetCoder";

import type { ViewMode } from "../manager/types";

// ============================================================================
// Types
// ============================================================================

export interface PresetManagerProps {
	class?: string;
	onClose?: () => void;
}

export interface PresetManagerLogic {
	// Pass-through props
	class: string | undefined;

	// Core state accessors
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

// ============================================================================
// Helper Functions (Pure)
// ============================================================================

/**
 * Download JSON data as a file
 */
function downloadJson(json: string, filename: string): void {
	const blob = new Blob([json], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
function getDateString(): string {
	return new Date().toISOString().split("T")[0];
}

/**
 * Create a filename-safe version of a name
 */
function sanitizeFilename(name: string): string {
	return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

// ============================================================================
// Logic Factory
// ============================================================================

export function createPresetManagerLogic(props: PresetManagerProps): PresetManagerLogic {
	// ============================================
	// Core State
	// ============================================
	const [presets, setPresets] = createSignal<Preset[]>([]);
	const [loading, setLoading] = createSignal(true);
	const [viewMode, setViewMode] = createSignal<ViewMode>("list");
	const [editingPreset, setEditingPreset] = createSignal<Preset | null>(null);
	const [confirmDelete, setConfirmDelete] = createSignal<string | null>(null);
	const [expandedPresetId, setExpandedPresetId] = createSignal<string | null>(null);

	// Selection for export view
	const [selectedPresets, setSelectedPresets] = createSignal<Set<string>>(new Set());

	// Copy success feedback
	const [copySuccess, setCopySuccess] = createSignal(false);

	// Share import state
	const [shareImportData, setShareImportData] = createSignal<DecompressResult | null>(null);
	const [shareImportError, setShareImportError] = createSignal<string | null>(null);
	const [shareImportExpandedId, setShareImportExpandedId] = createSignal<string | null>(null);

	// Form state
	const [parameterIds, setParameterIds] = createSignal<string[]>([]);
	const [saving, setSaving] = createSignal(false);
	const [initialParameterData, setInitialParameterData] = createSignal<Map<string, Parameter>>(
		new Map()
	);
	const [paramPrimitiveTypes, setParamPrimitiveTypes] = createSignal<Map<string, PrimitiveType>>(
		new Map()
	);
	const [paramBoolValues, setParamBoolValues] = createSignal<Map<string, boolean>>(new Map());

	// ============================================
	// Data Loading
	// ============================================

	const loadPresets = async () => {
		try {
			await migratePresetsIfNeeded();
			const allPresets = await getPresets();
			setPresets(allPresets);
		} catch (error) {
			console.error("[PresetManager] Failed to load presets:", error);
		} finally {
			setLoading(false);
		}
	};

	onMount(() => {
		loadPresets();

		// Check for share parameter in URL
		try {
			const shareData = parseShareUrl(globalThis.window.location.href);
			if (shareData) {
				setShareImportData(shareData);
				setViewMode("share-import");
				const url = new URL(globalThis.window.location.href);
				url.searchParams.delete("share");
				globalThis.window.history.replaceState({}, "", url.toString());
			}
		} catch (error) {
			console.error("[PresetManager] Failed to parse share URL:", error);
			setShareImportError("Invalid share link. The data may be corrupted or expired.");
			setViewMode("share-import");
		}
	});

	createEffect(() => {
		const unsubPresets = onPresetsChanged((newPresets) => {
			setPresets(newPresets);
		});

		onCleanup(() => {
			unsubPresets();
		});
	});

	// ============================================
	// Form Helpers
	// ============================================

	const getParamPrimitiveType = (paramId: string): PrimitiveType => {
		return (
			paramPrimitiveTypes().get(paramId) ??
			initialParameterData().get(paramId)?.primitiveType ??
			"string"
		);
	};

	const setParamPrimitiveType = (paramId: string, type: PrimitiveType) => {
		setParamPrimitiveTypes((prev) => {
			const next = new Map(prev);
			next.set(paramId, type);
			return next;
		});
		if (type === "boolean") {
			setParamBoolValue(paramId, true);
		}
	};

	const getParamBoolValue = (paramId: string): boolean => {
		const cached = paramBoolValues().get(paramId);
		if (cached !== undefined) return cached;
		const paramData = initialParameterData().get(paramId);
		return paramData?.value === "true";
	};

	const setParamBoolValue = (paramId: string, value: boolean) => {
		setParamBoolValues((prev) => {
			const next = new Map(prev);
			next.set(paramId, value);
			return next;
		});
	};

	const getParameterData = (paramId: string): Parameter =>
		initialParameterData().get(paramId) ?? createEmptyParameter();

	const resetForm = () => {
		setParameterIds([]);
		setInitialParameterData(new Map());
		setEditingPreset(null);
		setParamPrimitiveTypes(new Map());
		setParamBoolValues(new Map());
	};

	// ============================================
	// Actions: Navigation
	// ============================================

	const handleStartCreate = () => {
		resetForm();
		setViewMode("create");
	};

	const handleStartEdit = (preset: Preset) => {
		setEditingPreset(preset);
		const paramMap = new Map<string, Parameter>();
		preset.parameters.forEach((p) => {
			paramMap.set(p.id, p);
		});
		setInitialParameterData(paramMap);
		setParameterIds(preset.parameters.map((p) => p.id));
		setParamPrimitiveTypes(new Map());
		setParamBoolValues(new Map());
		setViewMode("edit");
	};

	const handleCancelForm = () => {
		resetForm();
		setViewMode("list");
	};

	const handleToggleExpanded = (presetId: string) => {
		setExpandedPresetId((current) => (current === presetId ? null : presetId));
	};

	const handleStartExport = () => {
		setSelectedPresets(new Set<string>());
		setViewMode("export");
	};

	const handleCancelExport = () => {
		setSelectedPresets(new Set<string>());
		setViewMode("list");
	};

	const handleStartFileImport = () => {
		setViewMode("file-import");
	};

	const handleCancelFileImport = () => {
		setViewMode("list");
	};

	const handleStartRepositoryImport = () => {
		setViewMode("repository-import");
	};

	const handleRepositoryImportCancel = () => {
		setViewMode("list");
	};

	// ============================================
	// Actions: Form
	// ============================================

	const handleAddParameter = () => {
		const newParam = createEmptyParameter();
		const paramMap = new Map(initialParameterData());
		paramMap.set(newParam.id, newParam);
		setInitialParameterData(paramMap);
		setParameterIds([...parameterIds(), newParam.id]);
	};

	const handleRemoveParameter = (paramId: string) => {
		setParameterIds((ids) => ids.filter((id) => id !== paramId));
		const paramMap = new Map(initialParameterData());
		paramMap.delete(paramId);
		setInitialParameterData(paramMap);
	};

	const handleSavePreset = async (e?: Event) => {
		e?.preventDefault();

		const form = document.querySelector("[data-preset-form]") as HTMLFormElement;
		if (!form) return;

		const formData = new FormData(form);
		const name = (formData.get("preset-name") as string)?.trim();

		if (!name) {
			alert("Please enter a preset name");
			return;
		}

		const description = (formData.get("preset-description") as string)?.trim() || undefined;

		const params: Parameter[] = [];
		for (const paramId of parameterIds()) {
			const key = formData.get(`param-${paramId}-key`) as string;
			if (!key?.trim()) continue;

			const type = formData.get(`param-${paramId}-type`) as string as Parameter["type"];
			const primitiveType = formData.get(`param-${paramId}-primitiveType`) as PrimitiveType;
			const value = (formData.get(`param-${paramId}-value`) as string) || "";
			const paramDescription =
				(formData.get(`param-${paramId}-description`) as string)?.trim() || undefined;

			params.push({
				description: paramDescription,
				id: paramId,
				key: key.trim(),
				primitiveType: primitiveType || "string",
				type,
				value,
			});
		}

		setSaving(true);

		try {
			if (viewMode() === "create") {
				await createPreset({ description, name, parameters: params });
			} else {
				const preset = editingPreset();
				if (preset) {
					await updatePresetData(preset.id, { description, name, parameters: params });
				}
			}

			resetForm();
			setViewMode("list");
			await loadPresets();
		} catch (error) {
			console.error("[PresetManager] Failed to save preset:", error);
			alert("Failed to save preset. Please try again.");
		} finally {
			setSaving(false);
		}
	};

	// ============================================
	// Actions: CRUD
	// ============================================

	const handleDelete = async (presetId: string) => {
		try {
			await deletePreset(presetId);
			setConfirmDelete(null);
			await loadPresets();
		} catch (error) {
			console.error("[PresetManager] Failed to delete preset:", error);
			alert("Failed to delete preset. Please try again.");
		}
	};

	const handleDuplicate = async (presetId: string) => {
		try {
			await duplicatePreset(presetId);
			await loadPresets();
		} catch (error) {
			console.error("[PresetManager] Failed to duplicate preset:", error);
			alert("Failed to duplicate preset. Please try again.");
		}
	};

	// ============================================
	// Actions: Selection
	// ============================================

	const handleTogglePresetSelection = (presetId: string) => {
		setSelectedPresets((prev) => {
			const next = new Set(prev);
			if (next.has(presetId)) {
				next.delete(presetId);
			} else {
				next.add(presetId);
			}
			return next;
		});
	};

	const handleSelectAll = () => {
		setSelectedPresets(new Set(presets().map((p) => p.id)));
	};

	const handleClearSelection = () => {
		setSelectedPresets(new Set<string>());
	};

	// ============================================
	// Actions: Export
	// ============================================

	const handleExportDownload = async () => {
		try {
			const selected = Array.from(selectedPresets());
			const date = getDateString();

			if (selected.length === 0) {
				const json = await exportPresets();
				downloadJson(json, `presets-all-${date}.json`);
			} else {
				const json = await exportPresets(selected);
				downloadJson(json, `presets-selected-${date}.json`);
			}
			handleCancelExport();
		} catch (error) {
			console.error("[PresetManager] Failed to export presets:", error);
			alert("Failed to export presets.");
		}
	};

	const handleExportUrl = async () => {
		try {
			const selected = Array.from(selectedPresets());
			let presetsToShare: Preset[];

			if (selected.length === 0) {
				presetsToShare = presets();
			} else {
				presetsToShare = presets().filter((p) => selected.includes(p.id));
			}

			if (presetsToShare.length === 0) {
				alert("No presets to share.");
				return;
			}

			const shareUrl = generateShareUrl(presetsToShare);
			await navigator.clipboard.writeText(shareUrl);

			setCopySuccess(true);
			setTimeout(() => setCopySuccess(false), 2000);
		} catch (error) {
			console.error("[PresetManager] Failed to copy share URL:", error);
			alert("Failed to copy share URL.");
		}
	};

	const handleExportSingle = async (preset: Preset) => {
		try {
			const json = await exportPresets([preset.id]);
			const date = getDateString();
			const safeName = sanitizeFilename(preset.name);
			downloadJson(json, `preset-${safeName}-${date}.json`);
		} catch (error) {
			console.error("[PresetManager] Failed to export preset:", error);
			alert("Failed to export preset.");
		}
	};

	// ============================================
	// Actions: Import
	// ============================================

	const handleImportFile = async (e: Event) => {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = async (event) => {
			try {
				const json = event.target?.result as string;
				const { imported, errors } = await importPresets(json);
				if (errors.length > 0) {
					alert(`Imported ${imported} presets with some errors: ${errors.join(", ")}`);
				} else {
					alert(`Successfully imported ${imported} presets!`);
				}
				await loadPresets();
			} catch (error) {
				console.error("[PresetManager] Failed to import presets:", error);
				alert("Failed to import presets. Invalid file format.");
			} finally {
				input.value = "";
			}
		};
		reader.readAsText(file);
	};

	const handleRepositoryImportConfirm = async (importedPresets: Preset[]) => {
		try {
			for (const preset of importedPresets) {
				await createPreset({
					name: preset.name,
					parameters: preset.parameters,
					description: preset.description,
				});
			}
			setViewMode("list");
			await loadPresets();
		} catch (error) {
			console.error("[PresetManager] Failed to import repository presets:", error);
		}
	};

	// ============================================
	// Actions: Share Import
	// ============================================

	const handleLoadShareUrl = (url: string) => {
		if (!url) return;

		try {
			const shareData = parseShareUrl(url);
			if (shareData) {
				setShareImportData(shareData);
				setViewMode("share-import");
			} else {
				setShareImportError("No share data found in the URL.");
				setViewMode("share-import");
			}
		} catch (error) {
			console.error("[PresetManager] Failed to parse share URL:", error);
			setShareImportError("Invalid share link. The data may be corrupted or expired.");
			setViewMode("share-import");
		}
	};

	const handleShareImportConfirm = async () => {
		const data = shareImportData();
		if (!data) return;

		try {
			for (const preset of data.result) {
				await createPreset({
					name: preset.name,
					parameters: preset.parameters,
					description: preset.description,
				});
			}
			setShareImportData(null);
			setShareImportError(null);
			setViewMode("list");
			await loadPresets();
		} catch (error) {
			console.error("[PresetManager] Failed to import shared presets:", error);
			setShareImportError("Failed to import presets. Please try again.");
		}
	};

	const handleShareImportCancel = () => {
		setShareImportData(null);
		setShareImportError(null);
		setShareImportExpandedId(null);
		setViewMode("list");
	};

	const handleToggleShareImportExpanded = (presetId: string) => {
		setShareImportExpandedId((current) => (current === presetId ? null : presetId));
	};

	// ============================================
	// Return Logic Interface
	// ============================================

	return {
		// Pass-through props
		class: props.class,

		// Core state
		presets,
		loading,
		viewMode,
		editingPreset,
		confirmDelete,
		expandedPresetId,

		// Selection state
		selectedPresets,
		copySuccess,

		// Share import state
		shareImportData,
		shareImportError,
		shareImportExpandedId,

		// Form state
		parameterIds,
		saving,

		// Navigation callbacks
		onClose: props.onClose,
		onStartCreate: handleStartCreate,
		onStartEdit: handleStartEdit,
		onCancelForm: handleCancelForm,
		onToggleExpanded: handleToggleExpanded,
		onStartExport: handleStartExport,
		onCancelExport: handleCancelExport,
		onStartFileImport: handleStartFileImport,
		onCancelFileImport: handleCancelFileImport,
		onStartRepositoryImport: handleStartRepositoryImport,
		onRepositoryImportCancel: handleRepositoryImportCancel,

		// Form callbacks
		onAddParameter: handleAddParameter,
		onRemoveParameter: handleRemoveParameter,
		onSavePreset: handleSavePreset,
		getParameterData,
		getPrimitiveType: getParamPrimitiveType,
		onPrimitiveTypeChange: setParamPrimitiveType,
		getBoolValue: getParamBoolValue,
		onBoolValueChange: setParamBoolValue,

		// CRUD callbacks
		onDelete: handleDelete,
		onDuplicate: handleDuplicate,
		onSetConfirmDelete: setConfirmDelete,

		// Selection callbacks
		onTogglePresetSelection: handleTogglePresetSelection,
		onSelectAll: handleSelectAll,
		onClearSelection: handleClearSelection,

		// Export callbacks
		onExportDownload: handleExportDownload,
		onExportUrl: handleExportUrl,
		onExportSingle: handleExportSingle,

		// Import callbacks
		onImportFile: handleImportFile,
		onRepositoryImportConfirm: handleRepositoryImportConfirm,

		// Share import callbacks
		onLoadShareUrl: handleLoadShareUrl,
		onShareImportConfirm: handleShareImportConfirm,
		onShareImportCancel: handleShareImportCancel,
		onToggleShareImportExpanded: handleToggleShareImportExpanded,
	};
}
