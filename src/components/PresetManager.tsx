import type { Component } from "solid-js";
import { For, Show, createEffect, createSignal, onCleanup, onMount } from "solid-js";

import type { Parameter, ParameterType, Preset, PrimitiveType } from "@/logic/parameters";
import {
	createEmptyParameter,
	createPreset,
	deletePreset,
	duplicatePreset,
	exportPresets,
	generateShareUrl,
	getParameterTypeIcon,
	getPresets,
	importPresets,
	migratePresetsIfNeeded,
	onPresetsChanged,
	parseShareUrl,
	updatePresetData,
} from "@/logic/parameters";
import { cn } from "@/utils/cn";
import type { DecompressResult } from "@/utils/presetCoder";

import { RepositoryImportView } from "./RepositoryImportView";
import { PlusIcon } from "./icons/Plus";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Select } from "./ui/Select";
import { Separator } from "./ui/Separator";
import { Textarea } from "./ui/Textarea";

interface PresetManagerProps {
	/** Callback when user wants to close the manager */
	onClose?: () => void;
	/** Custom class for the container */
	class?: string;
}

type ViewMode =
	| "list"
	| "create"
	| "edit"
	| "export"
	| "share-import"
	| "repository-import"
	| "file-import";

/**
 * Full CRUD interface for managing presets and their parameters
 */
export const PresetManager: Component<PresetManagerProps> = (props) => {
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
	const [shareUrlInput, setShareUrlInput] = createSignal("");
	const [shareImportExpandedId, setShareImportExpandedId] = createSignal<string | null>(null);

	// Form state - only track parameter IDs for rendering, not their values
	const [parameterIds, setParameterIds] = createSignal<string[]>([]);
	const [saving, setSaving] = createSignal(false);

	// Store initial parameter data for default values (only used when editing)
	const [initialParameterData, setInitialParameterData] = createSignal<Map<string, Parameter>>(
		new Map()
	);

	// Track primitive types for each parameter (for UI reactivity)
	const [paramPrimitiveTypes, setParamPrimitiveTypes] = createSignal<Map<string, PrimitiveType>>(
		new Map()
	);

	// Track boolean values for each parameter (for toggle state)
	const [paramBoolValues, setParamBoolValues] = createSignal<Map<string, boolean>>(new Map());

	// Get primitive type for a parameter
	const getParamPrimitiveType = (paramId: string): PrimitiveType => {
		return (
			paramPrimitiveTypes().get(paramId) ??
			initialParameterData().get(paramId)?.primitiveType ??
			"string"
		);
	};

	// Set primitive type for a parameter
	const setParamPrimitiveType = (paramId: string, type: PrimitiveType) => {
		setParamPrimitiveTypes((prev) => {
			const next = new Map(prev);
			next.set(paramId, type);
			return next;
		});
		// If switching to boolean, set default value to true
		if (type === "boolean") {
			setParamBoolValue(paramId, true);
		}
	};

	// Get boolean value for a parameter
	const getParamBoolValue = (paramId: string): boolean => {
		const cached = paramBoolValues().get(paramId);
		if (cached !== undefined) return cached;
		const paramData = initialParameterData().get(paramId);
		return paramData?.value === "true";
	};

	// Set boolean value for a parameter
	const setParamBoolValue = (paramId: string, value: boolean) => {
		setParamBoolValues((prev) => {
			const next = new Map(prev);
			next.set(paramId, value);
			return next;
		});
	};

	// Load presets
	const loadPresets = async () => {
		try {
			// Migrate legacy presets without primitiveType on first load
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
			const shareData = parseShareUrl(window.location.href);
			if (shareData) {
				setShareImportData(shareData);
				setViewMode("share-import");
				// Clean up URL by removing the share parameter
				const url = new URL(window.location.href);
				url.searchParams.delete("share");
				window.history.replaceState({}, "", url.toString());
			}
		} catch (error) {
			console.error("[PresetManager] Failed to parse share URL:", error);
			setShareImportError("Invalid share link. The data may be corrupted or expired.");
			setViewMode("share-import");
		}
	});

	// Subscribe to changes
	createEffect(() => {
		const unsubPresets = onPresetsChanged((newPresets) => {
			setPresets(newPresets);
		});

		onCleanup(() => {
			unsubPresets();
		});
	});

	// Reset form
	const resetForm = () => {
		setParameterIds([]);
		setInitialParameterData(new Map());
		setEditingPreset(null);
		setParamPrimitiveTypes(new Map());
		setParamBoolValues(new Map());
	};

	// Start creating a new preset
	const startCreate = () => {
		resetForm();
		setViewMode("create");
	};

	// Start editing an existing preset
	const startEdit = (preset: Preset) => {
		setEditingPreset(preset);
		const paramMap = new Map<string, Parameter>();
		preset.parameters.forEach((p) => {
			paramMap.set(p.id, p);
		});
		setInitialParameterData(paramMap);
		setParameterIds(preset.parameters.map((p) => p.id));
		// Clear cached UI state so values are read fresh from initialParameterData
		setParamPrimitiveTypes(new Map());
		setParamBoolValues(new Map());
		setViewMode("edit");
	};

	// Cancel create/edit
	const cancelForm = () => {
		resetForm();
		setViewMode("list");
	};

	// Toggle expanded state for a preset in list view
	const toggleExpanded = (presetId: string) => {
		setExpandedPresetId((current) => (current === presetId ? null : presetId));
	};

	// Add a new parameter to the form
	const addParameter = () => {
		const newParam = createEmptyParameter();
		const paramMap = new Map(initialParameterData());
		paramMap.set(newParam.id, newParam);
		setInitialParameterData(paramMap);
		setParameterIds([...parameterIds(), newParam.id]);
	};

	// Remove a parameter from the form by ID
	const removeFormParameter = (paramId: string) => {
		setParameterIds((ids) => ids.filter((id) => id !== paramId));
		const paramMap = new Map(initialParameterData());
		paramMap.delete(paramId);
		setInitialParameterData(paramMap);
	};

	// Get parameter data for rendering (for default values)
	const getParameterData = (paramId: string): Parameter =>
		initialParameterData().get(paramId) ?? createEmptyParameter();

	// Save the preset (create or update) - reads all data from DOM
	const savePreset = async (e?: Event) => {
		e?.preventDefault();

		// Read form data from DOM
		const form = document.querySelector("[data-preset-form]") as HTMLFormElement;
		if (!form) {
			return;
		}

		const formData = new FormData(form);
		const name = (formData.get("preset-name") as string)?.trim();

		if (!name) {
			alert("Please enter a preset name");
			return;
		}

		const description = (formData.get("preset-description") as string)?.trim() || undefined;

		// Read all parameters from DOM
		const params: Parameter[] = [];
		for (const paramId of parameterIds()) {
			const key = formData.get(`param-${paramId}-key`) as string;
			if (!key?.trim()) {
				continue;
			} // Skip empty parameters

			const type = formData.get(`param-${paramId}-type`) as string as ParameterType;
			const primitiveType = formData.get(
				`param-${paramId}-primitiveType`
			) as string as PrimitiveType;
			// For boolean type, get value from the hidden input (controlled by toggle state)
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
				await createPreset({
					description,
					name,
					parameters: params,
				});
			} else {
				const preset = editingPreset();
				if (preset) {
					await updatePresetData(preset.id, {
						description,
						name,
						parameters: params,
					});
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

	// Delete a preset
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

	// Duplicate a preset
	const handleDuplicate = async (presetId: string) => {
		try {
			await duplicatePreset(presetId);
			await loadPresets();
		} catch (error) {
			console.error("[PresetManager] Failed to duplicate preset:", error);
			alert("Failed to duplicate preset. Please try again.");
		}
	};

	// Selection mode helpers
	const togglePresetSelection = (presetId: string) => {
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

	const clearSelection = () => {
		setSelectedPresets(new Set<string>());
	};

	const selectAllPresets = () => {
		setSelectedPresets(new Set(presets().map((p) => p.id)));
	};

	// Enter export view
	const startExport = () => {
		clearSelection();
		setViewMode("export");
	};

	// Exit export view
	const cancelExport = () => {
		clearSelection();
		setViewMode("list");
	};

	// Helper to download JSON
	const downloadJson = (json: string, filename: string) => {
		const blob = new Blob([json], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	};

	// Export from export view - download JSON file
	const handleExportDownload = async () => {
		try {
			const selected = Array.from(selectedPresets());
			const date = new Date().toISOString().split("T")[0];

			if (selected.length === 0) {
				// Export all
				const json = await exportPresets();
				downloadJson(json, `presets-all-${date}.json`);
			} else {
				// Export selected
				const json = await exportPresets(selected);
				downloadJson(json, `presets-selected-${date}.json`);
			}
			cancelExport();
		} catch (error) {
			console.error("[PresetManager] Failed to export presets:", error);
			alert("Failed to export presets.");
		}
	};

	// Export from export view - copy share URL
	const handleExportUrl = async () => {
		try {
			const selected = Array.from(selectedPresets());
			let presetsToShare: Preset[];

			if (selected.length === 0) {
				// Share all
				presetsToShare = presets();
			} else {
				// Share selected
				presetsToShare = presets().filter((p) => selected.includes(p.id));
			}

			if (presetsToShare.length === 0) {
				alert("No presets to share.");
				return;
			}

			const shareUrl = generateShareUrl(presetsToShare);
			await navigator.clipboard.writeText(shareUrl);

			// Show success feedback
			setCopySuccess(true);
			setTimeout(() => setCopySuccess(false), 2000);
		} catch (error) {
			console.error("[PresetManager] Failed to copy share URL:", error);
			alert("Failed to copy share URL.");
		}
	};

	// Handle share import confirmation
	const handleShareImportConfirm = async () => {
		const data = shareImportData();
		if (!data) return;

		try {
			// Add imported presets to storage
			for (const preset of data.result) {
				await createPreset({
					name: preset.name,
					parameters: preset.parameters,
					description: preset.description,
				});
			}
			// Clear share import state
			setShareImportData(null);
			setShareImportError(null);
			setViewMode("list");
			await loadPresets();
		} catch (error) {
			console.error("[PresetManager] Failed to import shared presets:", error);
			setShareImportError("Failed to import presets. Please try again.");
		}
	};

	// Handle share import cancel
	const handleShareImportCancel = () => {
		setShareImportData(null);
		setShareImportError(null);
		setShareUrlInput("");
		setShareImportExpandedId(null);
		setViewMode("list");
	};

	// Handle repository import - opens the modal
	const startRepositoryImport = () => {
		setViewMode("repository-import");
	};

	// Handle repository import confirm
	const handleRepositoryImportConfirm = async (presets: Preset[]) => {
		try {
			// Add imported presets to storage
			for (const preset of presets) {
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
			// Could show error toast here
		}
	};

	// Handle repository import cancel
	const handleRepositoryImportCancel = () => {
		setViewMode("list");
	};

	// Toggle expanded state for a preset in share import view
	const toggleShareImportExpanded = (presetId: string) => {
		setShareImportExpandedId((current) => (current === presetId ? null : presetId));
	};

	// Handle loading from share URL input
	const handleLoadShareUrl = () => {
		const url = shareUrlInput().trim();
		if (!url) return;

		try {
			const shareData = parseShareUrl(url);
			if (shareData) {
				setShareImportData(shareData);
				setViewMode("share-import");
				setShareUrlInput("");
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

	// Export single preset
	const handleExportSingle = async (preset: Preset) => {
		try {
			const json = await exportPresets([preset.id]);
			const date = new Date().toISOString().split("T")[0];
			const safeName = preset.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
			downloadJson(json, `preset-${safeName}-${date}.json`);
		} catch (error) {
			console.error("[PresetManager] Failed to export preset:", error);
			alert("Failed to export preset.");
		}
	};

	// Import presets
	const handleImport = async (e: Event) => {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) {
			return;
		}

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
				input.value = ""; // Reset input
			}
		};
		reader.readAsText(file);
	};

	// Render the list view
	const renderListView = () => (
		<div class={cn("flex h-full flex-col")} data-testid="preset-manager-list">
			<div class={cn("mb-4 flex flex-col space-y-4")}>
				<div class={cn("flex items-center justify-between")}>
					<h2
						class={cn(
							"text-foreground text-[10px] font-black tracking-[0.2em] uppercase opacity-70"
						)}
						data-testid="manage-presets-heading"
					>
						Manage Presets
					</h2>
					<Show when={props.onClose}>
						<Button
							variant="ghost"
							size="xs"
							onClick={props.onClose}
							data-testid="close-manager-button"
							aria-label="Close preset manager"
						>
							<svg
								class={cn("size-3.5")}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
							<span>Close</span>
						</Button>
					</Show>
				</div>

				<div
					class={cn(
						"border-border/50 bg-muted/30 flex items-center justify-between gap-3 rounded-xl border p-3"
					)}
				>
					<div class={cn("flex gap-2")}>
						<Button
							variant="secondary"
							size="sm"
							onClick={startExport}
							title="Export presets"
							data-testid="export-presets-button"
						>
							<svg
								class={cn("size-3.5 opacity-70")}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
								/>
							</svg>
							Export
						</Button>
						<Button
							variant="secondary"
							size="sm"
							onClick={() => setViewMode("file-import")}
							title="Import presets"
							data-testid="import-presets-button"
						>
							<svg
								class={cn("size-3.5 opacity-70")}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12"
								/>
							</svg>
							Import
						</Button>
					</div>
					<Button size="sm" onClick={startCreate} data-testid="create-preset-button">
						<PlusIcon /> New
					</Button>
				</div>
				{/* Share URL Input */}
				<div class={cn("flex w-full gap-2")}>
					<Input
						type="text"
						value={shareUrlInput()}
						onInput={(e) => setShareUrlInput(e.currentTarget.value)}
						placeholder="Paste share URL here..."
						class={cn("h-8 flex-1 text-[11px]")}
						containerClass={cn("flex-1")}
						data-testid="share-url-input"
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								handleLoadShareUrl();
							}
						}}
					/>
					<Button
						variant="secondary"
						size="sm"
						onClick={handleLoadShareUrl}
						disabled={!shareUrlInput().trim()}
						data-testid="share-url-load-button"
					>
						<svg
							class={cn("size-3.5 opacity-70")}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
							/>
						</svg>
						Load
					</Button>
				</div>
			</div>

			<Show when={loading()}>
				<div class={cn("flex flex-col items-center justify-center space-y-2 py-12")}>
					<div
						class={cn(
							"border-primary/30 border-t-primary size-5 animate-spin rounded-full border-2"
						)}
					/>
				</div>
			</Show>

			<Show when={!loading() && presets().length === 0}>
				<Card
					class={cn(
						"border-border/40 bg-muted/10 flex flex-col items-center justify-center border-dashed px-6 py-12 text-center"
					)}
					data-testid="no-presets-message"
				>
					<p
						class={cn(
							"text-muted-foreground mb-4 text-[10px] font-black tracking-widest uppercase"
						)}
					>
						No presets found
					</p>
					<Button variant="outline" size="sm" onClick={startCreate}>
						Create First Preset
					</Button>
				</Card>
			</Show>

			<Show when={!loading() && presets().length > 0}>
				<div class={cn("-mr-1 flex-1 space-y-3 overflow-y-auto pr-1")} data-testid="presets-list">
					<For each={presets()}>
						{(preset) => (
							<Card
								class={cn("border-border/60 hover:border-primary/30 p-4 shadow-sm transition-all")}
								data-testid="preset-item"
								data-preset-id={preset.id}
							>
								<div class={cn("flex items-start justify-between gap-3")}>
									<div class={cn("min-w-0 flex-1")}>
										<button
											type="button"
											class={cn("group w-full text-left")}
											onClick={() => toggleExpanded(preset.id)}
											data-testid="preset-expand-button"
										>
											<div
												class={cn(
													"text-foreground group-hover:text-primary truncate text-[14px] font-black tracking-tight uppercase transition-colors"
												)}
												data-testid="preset-name"
											>
												{preset.name}
											</div>
											<Show when={preset.description}>
												<div
													class={cn(
														"text-muted-foreground mt-1 truncate text-[11px] leading-tight font-bold"
													)}
													data-testid="preset-description"
												>
													{preset.description}
												</div>
											</Show>
											<div class={cn("mt-2.5 flex items-center gap-2")}>
												<Badge variant="secondary" class={cn("h-4 px-2 text-[8px]! font-black")}>
													{preset.parameters.length} VARS
												</Badge>
												<span
													class={cn(
														"text-muted-foreground/50 text-[9px] font-black tracking-widest uppercase"
													)}
												>
													{expandedPresetId() === preset.id ? "Hide" : "View"}
												</span>
											</div>
										</button>
									</div>
									<div class={cn("flex items-center space-x-1")}>
										{/* Export single preset */}
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleExportSingle(preset)}
											aria-label="Export preset"
											data-testid="export-preset-button"
										>
											<svg
												class={cn("size-4")}
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												aria-hidden="true"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
												/>
											</svg>
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleDuplicate(preset.id)}
											aria-label="Duplicate preset"
											data-testid="duplicate-preset-button"
										>
											<svg
												class={cn("size-4")}
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												aria-hidden="true"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
												/>
											</svg>
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => startEdit(preset)}
											aria-label="Edit preset"
											data-testid="edit-preset-button"
										>
											<svg
												class={cn("size-4")}
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												aria-hidden="true"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
												/>
											</svg>
										</Button>
										<Show
											when={confirmDelete() === preset.id}
											fallback={
												<Button
													variant="ghost-destructive"
													size="icon"
													onClick={() => setConfirmDelete(preset.id)}
													aria-label="Delete preset"
													data-testid="delete-preset-button"
												>
													<svg
														class={cn("size-4")}
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
														aria-hidden="true"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
														/>
													</svg>
												</Button>
											}
										>
											<div class={cn("flex gap-1")}>
												<Button
													variant="destructive"
													size="xs"
													onClick={() => handleDelete(preset.id)}
													data-testid="confirm-delete-button"
												>
													Yes
												</Button>
												<Button
													variant="secondary"
													size="xs"
													onClick={() => setConfirmDelete(null)}
													data-testid="cancel-delete-button"
												>
													No
												</Button>
											</div>
										</Show>
									</div>
								</div>

								{/* Expanded parameter list */}
								<Show when={expandedPresetId() === preset.id}>
									<div class={cn("mt-4")} data-testid="preset-expanded-params">
										<Separator class={cn("mb-4 opacity-50")} />
										<div class={cn("space-y-2")}>
											<For each={preset.parameters}>
												{(param) => (
													<div
														class={cn(
															"border-border/40 bg-muted/40 flex items-center justify-between rounded-lg border px-3 py-2 text-[11px] shadow-sm"
														)}
														data-testid="preset-expanded-param"
													>
														<div class={cn("flex min-w-0 flex-1 items-center")}>
															<span class={cn("mr-2 scale-90 opacity-60")}>
																{getParameterTypeIcon(param.type)}
															</span>
															<span
																class={cn(
																	"text-foreground truncate font-black tracking-tighter uppercase"
																)}
															>
																{param.key}
															</span>
														</div>
														<span
															class={cn(
																"border-border/20 bg-background/60 text-muted-foreground/90 ml-2 max-w-[55%] truncate rounded-sm border px-2 py-1 font-mono"
															)}
														>
															{param.value}
														</span>
													</div>
												)}
											</For>
										</div>
									</div>
								</Show>
							</Card>
						)}
					</For>
				</div>
			</Show>
		</div>
	);

	// Render the create/edit form
	const renderFormView = () => {
		const preset = editingPreset();
		const defaultName = preset?.name ?? "";
		const defaultDescription = preset?.description ?? "";

		return (
			<form
				data-preset-form
				data-testid="preset-form"
				class={cn("flex h-full flex-col")}
				onSubmit={savePreset}
			>
				<div class={cn("mb-4 flex flex-col space-y-4")}>
					<div class={cn("flex items-center justify-between")}>
						<h2
							class={cn(
								"text-foreground text-[10px] font-black tracking-[0.2em] uppercase opacity-50"
							)}
							data-testid="preset-form-heading"
						>
							{viewMode() === "create" ? "Create New Preset" : "Edit Preset Details"}
						</h2>
						<Button
							variant="ghost"
							size="xs"
							type="button"
							onClick={cancelForm}
							data-testid="cancel-form-button"
							aria-label="Cancel and go back"
						>
							<svg
								class={cn("size-3.5")}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
							<span>Cancel</span>
						</Button>
					</div>

					<div
						class={cn(
							"border-border/50 bg-muted/30 flex items-center justify-between rounded-xl border p-2.5"
						)}
					>
						<p
							class={cn("text-foreground/40 ml-2 text-[10px] font-black tracking-widest uppercase")}
						>
							Preset Configuration
						</p>
						<Button type="submit" size="sm" disabled={saving()} data-testid="save-preset-button">
							<Show
								when={saving()}
								fallback={viewMode() === "create" ? "Save Preset" : "Update Preset"}
							>
								Saving...
							</Show>
						</Button>
					</div>
				</div>

				<div class={cn("-mr-1 flex-1 space-y-6 overflow-y-auto pr-1")}>
					{/* Preset name & Description */}
					<div class={cn("space-y-4 px-1")}>
						<Input
							label="Name"
							name="preset-name"
							placeholder="e.g. Production Config"
							required
							ref={(el) => {
								if (el && defaultName) {
									el.value = defaultName;
								}
							}}
							data-testid="preset-name-input"
						/>

						<Textarea
							label="Description (Optional)"
							name="preset-description"
							placeholder="Briefly describe what these parameters do..."
							rows="2"
							ref={(el) => {
								if (el && defaultDescription) {
									el.value = defaultDescription;
								}
							}}
							data-testid="preset-description-input"
						/>
					</div>

					<Separator class={cn("opacity-50")} />

					{/* Parameters section */}
					<div class={cn("space-y-4")}>
						<div class={cn("flex items-center justify-between px-1")}>
							<Label
								class={cn("mb-0 text-[10px]! font-black tracking-[0.2em] uppercase opacity-50")}
							>
								Parameters ({parameterIds().length})
							</Label>
							<Button
								type="button"
								variant="ghost"
								size="xs"
								onClick={addParameter}
								data-testid="add-parameter-button"
							>
								+ Add Variable
							</Button>
						</div>

						<Show when={parameterIds().length === 0}>
							<Card
								class={cn(
									"border-border/30 bg-muted/10 flex flex-col items-center justify-center border-dashed px-4 py-10"
								)}
								data-testid="no-parameters-message"
							>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={addParameter}
									data-testid="add-first-parameter-button"
								>
									Add First Parameter
								</Button>
							</Card>
						</Show>

						<div class={cn("space-y-4")} data-testid="parameters-list">
							<For each={parameterIds()}>
								{(paramId, index) => {
									const getParam = () => getParameterData(paramId);
									return (
										<Card
											class={cn("group border-border/40 relative p-4 shadow-sm")}
											data-testid={`parameter-item-${index()}`}
										>
											{/* Header with badge and delete button */}
											<div class={cn("mb-3 flex items-center justify-between")}>
												<Badge
													variant="default"
													class={cn(
														"flex size-5 items-center justify-center rounded-sm p-0! text-[9px]!"
													)}
												>
													{index() + 1}
												</Badge>
												<Button
													variant="ghost-destructive"
													size="icon"
													type="button"
													onClick={() => removeFormParameter(paramId)}
													class={cn("opacity-0 transition-opacity group-hover:opacity-100")}
													aria-label="Remove this parameter"
													data-testid="remove-parameter-button"
												>
													<svg
														class={cn("size-4")}
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
														aria-hidden="true"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
														/>
													</svg>
												</Button>
											</div>

											<div class={cn("grid grid-cols-2 gap-3")}>
												{/* Row 1: Storage Type and Value Type */}
												<div class={cn("flex flex-col gap-1.5")}>
													<Label
														class={cn(
															"text-[10px]! font-black tracking-widest uppercase opacity-70"
														)}
													>
														Storage Type
													</Label>
													<Select
														name={`param-${paramId}-type`}
														ref={(el) => {
															if (el) {
																const paramType = getParam().type;
																queueMicrotask(() => {
																	el.value = paramType;
																});
															}
														}}
														class={cn("h-9 rounded-lg px-3! py-1.5! text-[12px]! uppercase")}
														data-testid="parameter-type-select"
													>
														<option value="queryParam">URL Query</option>
														<option value="cookie">Cookie</option>
														<option value="localStorage">Storage</option>
													</Select>
												</div>

												<div class={cn("flex flex-col gap-1.5")}>
													<Label
														class={cn(
															"text-[10px]! font-black tracking-widest uppercase opacity-70"
														)}
													>
														Value Type
													</Label>
													<Select
														name={`param-${paramId}-primitiveType`}
														ref={(el) => {
															if (el) {
																const primitiveType = getParam().primitiveType ?? "string";
																queueMicrotask(() => {
																	el.value = primitiveType;
																});
															}
														}}
														onChange={(e) => {
															setParamPrimitiveType(
																paramId,
																e.currentTarget.value as PrimitiveType
															);
														}}
														class={cn("h-9 rounded-lg px-3! py-1.5! text-[12px]! uppercase")}
														data-testid="parameter-primitive-type-select"
													>
														<option value="string">String</option>
														<option value="boolean">Boolean</option>
													</Select>
												</div>

												{/* Row 2: Key and Value */}
												<Input
													label="Key"
													name={`param-${paramId}-key`}
													placeholder="variable_name"
													ref={(el) => {
														if (el) {
															el.value = getParam().key;
														}
													}}
													class={cn("h-9 rounded-lg px-3! py-1.5! font-mono text-[12px]!")}
													data-testid="parameter-key-input"
												/>

												<Show
													when={getParamPrimitiveType(paramId) === "boolean"}
													fallback={
														<Input
															label="Value"
															name={`param-${paramId}-value`}
															placeholder="value"
															ref={(el) => {
																if (el) {
																	el.value = getParam().value;
																}
															}}
															class={cn("h-9 rounded-lg px-3! py-1.5! font-mono text-[12px]!")}
															data-testid="parameter-value-input"
														/>
													}
												>
													{/* Boolean value toggle */}
													<div class={cn("flex min-w-0 flex-col")}>
														<Label>Value</Label>
														<input
															type="hidden"
															name={`param-${paramId}-value`}
															value={getParamBoolValue(paramId) ? "true" : "false"}
														/>
														<button
															type="button"
															class={cn(
																"flex h-9 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 text-[13px] font-bold transition-colors",
																getParamBoolValue(paramId)
																	? "border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400"
																	: "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400"
															)}
															onClick={() =>
																setParamBoolValue(paramId, !getParamBoolValue(paramId))
															}
															data-testid="parameter-value-toggle"
														>
															<Show when={getParamBoolValue(paramId)}>
																<span data-testid="parameter-value-true">True</span>
															</Show>
															<Show when={!getParamBoolValue(paramId)}>
																<span data-testid="parameter-value-false">False</span>
															</Show>
														</button>
													</div>
												</Show>

												{/* Row 3: Notes */}
												<Input
													label="Notes (Optional)"
													name={`param-${paramId}-description`}
													placeholder="How is this variable used?"
													ref={(el) => {
														if (el) {
															el.value = getParam().description ?? "";
														}
													}}
													containerClass={cn("col-span-2")}
													class={cn(
														"border-border/30 bg-muted/10 h-8 rounded-lg px-3! py-1.5! text-[10px]! font-bold"
													)}
													data-testid="parameter-description-input"
												/>
											</div>
										</Card>
									);
								}}
							</For>
						</div>
					</div>
				</div>
			</form>
		);
	};

	// Render the export view
	const renderExportView = () => (
		<div class={cn("flex h-full flex-col")} data-testid="preset-export-view">
			<div class={cn("mb-4 flex flex-col space-y-4")}>
				<div class={cn("flex items-center justify-between")}>
					<h2
						class={cn(
							"text-foreground text-[10px] font-black tracking-[0.2em] uppercase opacity-70"
						)}
					>
						Export Presets
					</h2>
					<Button
						variant="ghost"
						size="xs"
						onClick={cancelExport}
						data-testid="export-back-button"
						aria-label="Back to preset list"
					>
						<svg
							class={cn("size-3.5")}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 19l-7-7m0 0l7-7m-7 7h18"
							/>
						</svg>
						<span>Back</span>
					</Button>
				</div>

				{/* Selection controls */}
				<div class={cn("border-border/50 bg-muted/30 flex flex-col gap-3 rounded-xl border p-3")}>
					<div class={cn("flex items-center justify-between gap-2")}>
						<div class={cn("flex gap-2")}>
							<Button
								variant="ghost"
								size="sm"
								onClick={selectAllPresets}
								data-testid="export-select-all-button"
							>
								Select All
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={clearSelection}
								disabled={selectedPresets().size === 0}
								data-testid="export-deselect-all-button"
							>
								Deselect All
							</Button>
						</div>
						<span class={cn("text-muted-foreground text-xs")}>
							{selectedPresets().size > 0
								? `${selectedPresets().size} selected`
								: `${presets().length} total`}
						</span>
					</div>
					<div class={cn("flex gap-2")}>
						<Button
							variant="secondary"
							size="sm"
							onClick={handleExportDownload}
							disabled={selectedPresets().size === 0}
							data-testid="export-download-button"
							class="flex-1"
						>
							<svg
								class={cn("size-3.5 opacity-70")}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
								/>
							</svg>
							Download
						</Button>
						<Button
							variant="secondary"
							size="sm"
							onClick={handleExportUrl}
							disabled={selectedPresets().size === 0}
							data-testid="export-url-button"
							class="flex-1"
						>
							<Show
								when={!copySuccess()}
								fallback={
									<>
										<svg
											class={cn("size-3.5 text-green-500")}
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											aria-hidden="true"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M5 13l4 4L19 7"
											/>
										</svg>
										<span data-testid="copy-success-message">Copied!</span>
									</>
								}
							>
								<svg
									class={cn("size-3.5 opacity-70")}
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
									/>
								</svg>
								Copy URL
							</Show>
						</Button>
					</div>
				</div>
			</div>

			{/* Preset list with checkboxes */}
			<Show
				when={presets().length > 0}
				fallback={
					<Card
						class={cn(
							"flex flex-col items-center justify-center gap-4 border-dashed py-12 text-center"
						)}
					>
						<p class={cn("text-muted-foreground text-[10px] font-black tracking-widest uppercase")}>
							No presets to export
						</p>
						<Button variant="outline" size="sm" onClick={cancelExport}>
							Back to Presets
						</Button>
					</Card>
				}
			>
				<div
					class={cn("-mr-1 flex-1 space-y-2 overflow-y-auto pr-1")}
					data-testid="export-presets-list"
				>
					<For each={presets()}>
						{(preset) => (
							<button
								type="button"
								class={cn(
									"flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all",
									selectedPresets().has(preset.id)
										? "border-primary/50 bg-primary/5"
										: "border-border/60 hover:border-primary/30"
								)}
								onClick={() => togglePresetSelection(preset.id)}
								data-testid="export-preset-item"
								data-preset-id={preset.id}
							>
								{/* Checkbox */}
								<div
									class={cn(
										"flex size-5 shrink-0 items-center justify-center rounded-sm border-2 transition-colors",
										selectedPresets().has(preset.id)
											? "border-primary bg-primary text-primary-foreground"
											: "border-border"
									)}
									data-testid="export-preset-checkbox"
								>
									<Show when={selectedPresets().has(preset.id)}>
										<svg
											class={cn("size-3")}
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											aria-hidden="true"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="3"
												d="M5 13l4 4L19 7"
											/>
										</svg>
									</Show>
								</div>

								{/* Preset info */}
								<div class={cn("min-w-0 flex-1")}>
									<div
										class={cn(
											"text-foreground truncate text-[13px] font-black tracking-tight uppercase"
										)}
									>
										{preset.name}
									</div>
									<Show when={preset.description}>
										<div class={cn("text-muted-foreground mt-0.5 truncate text-[10px]")}>
											{preset.description}
										</div>
									</Show>
								</div>

								{/* Parameter count badge */}
								<Badge variant="secondary" class={cn("h-4 shrink-0 px-2 text-[8px]! font-black")}>
									{preset.parameters.length} VARS
								</Badge>
							</button>
						)}
					</For>
				</div>
			</Show>
		</div>
	);

	// Render the file import view
	const renderFileImportView = () => (
		<div class={cn("flex h-full flex-col")} data-testid="preset-import-view">
			<div class={cn("mb-4 flex flex-col space-y-4")}>
				<div class={cn("flex items-center justify-between")}>
					<h2
						class={cn(
							"text-foreground text-[10px] font-black tracking-[0.2em] uppercase opacity-70"
						)}
					>
						Import Presets
					</h2>
					<Button
						variant="ghost"
						size="xs"
						onClick={() => setViewMode("list")}
						data-testid="import-back-button"
						aria-label="Back to preset list"
					>
						<svg
							class={cn("size-3.5")}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 19l-7-7m0 0l7-7m-7 7h18"
							/>
						</svg>
						<span>Back</span>
					</Button>
				</div>

				{/* Import options */}
				<div class={cn("border-border/50 bg-muted/30 flex flex-col gap-4 rounded-xl border p-4")}>
					{/* From File */}
					<div class={cn("flex flex-col gap-2")}>
						<h3 class={cn("text-foreground text-[11px] font-bold tracking-wide uppercase")}>
							From JSON File
						</h3>
						<p class={cn("text-muted-foreground text-[10px]")}>
							Import presets from a JSON file exported from this extension or manually created.
						</p>
						<div class={cn("relative")}>
							<input
								type="file"
								id="import-file-input"
								accept=".json"
								onChange={handleImport}
								class={cn("hidden")}
								data-testid="import-file-input"
							/>
							<Button
								variant="secondary"
								size="sm"
								onClick={() =>
									(document.querySelector("#import-file-input") as HTMLInputElement)?.click()
								}
								data-testid="import-file-button"
								class="w-full"
							>
								<svg
									class={cn("size-3.5 opacity-70")}
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
									/>
								</svg>
								Choose JSON File
							</Button>
						</div>
					</div>

					<Separator class={cn("opacity-50")} />

					{/* From Repository */}
					<div class={cn("flex flex-col gap-2")}>
						<h3 class={cn("text-foreground text-[11px] font-bold tracking-wide uppercase")}>
							From Repository
						</h3>
						<p class={cn("text-muted-foreground text-[10px]")}>
							Import presets from GitHub repositories or direct URLs configured in Settings.
						</p>
						<Button
							variant="secondary"
							size="sm"
							onClick={startRepositoryImport}
							data-testid="import-from-repo-button"
							class="w-full"
						>
							<svg
								class={cn("size-3.5 opacity-70")}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
								/>
							</svg>
							Browse Repositories
						</Button>
					</div>

					<Separator class={cn("opacity-50")} />

					{/* From Share URL */}
					<div class={cn("flex flex-col gap-2")}>
						<h3 class={cn("text-foreground text-[11px] font-bold tracking-wide uppercase")}>
							From Share URL
						</h3>
						<p class={cn("text-muted-foreground text-[10px]")}>
							Paste a share URL to import presets shared by others.
						</p>
						<div class={cn("flex gap-2")}>
							<Input
								type="text"
								value={shareUrlInput()}
								onInput={(e) => setShareUrlInput(e.currentTarget.value)}
								placeholder="Paste share URL here..."
								class={cn("h-8 flex-1 text-[11px]")}
								containerClass={cn("flex-1")}
								data-testid="import-share-url-input"
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										handleLoadShareUrl();
									}
								}}
							/>
							<Button
								variant="secondary"
								size="sm"
								onClick={handleLoadShareUrl}
								disabled={!shareUrlInput().trim()}
								data-testid="import-share-url-button"
							>
								<svg
									class={cn("size-3.5 opacity-70")}
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
									/>
								</svg>
								Load
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);

	// Render the share import modal/view
	const renderShareImportView = () => (
		<div
			class={cn(
				"bg-background/95 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
			)}
			data-testid="share-import-modal"
		>
			<Card class={cn("m-4 flex size-full max-h-[400px] max-w-md flex-col")}>
				<div class={cn("flex h-full flex-col gap-4 p-5")}>
					{/* Header */}
					<div class={cn("flex items-center justify-between")}>
						<h2 class={cn("text-foreground text-[13px] font-black tracking-[0.15em] uppercase")}>
							Import Shared Presets
						</h2>
						<Button variant="ghost" size="xs" onClick={handleShareImportCancel} aria-label="Close">
							<svg
								class={cn("size-5")}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</Button>
					</div>

					<Show
						when={!shareImportError()}
						fallback={
							<div
								class={cn(
									"border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-4 text-[13px]"
								)}
								data-testid="share-import-error"
							>
								{shareImportError()}
							</div>
						}
					>
						{/* Content */}
						<div class={cn("flex flex-1 flex-col space-y-4 overflow-hidden")}>
							<p class={cn("text-muted-foreground text-[13px]")}>
								<span class={cn("text-foreground font-bold")} data-testid="share-import-count">
									{shareImportData()?.count}
								</span>{" "}
								preset{shareImportData()?.isMultiplePresets ? "s" : ""} to import:
							</p>

							<div
								class={cn(
									"border-border/50 bg-muted/30 flex-1 space-y-2 overflow-y-auto rounded-xl border p-3"
								)}
							>
								<For each={shareImportData()?.result ?? []}>
									{(preset) => (
										<Card
											class={cn(
												"border-border/60 hover:border-primary/30 p-3 shadow-sm transition-all"
											)}
											data-testid="share-import-preset-item"
										>
											<button
												type="button"
												class={cn("group w-full text-left")}
												onClick={() => toggleShareImportExpanded(preset.id)}
												data-testid="share-import-preset-expand"
											>
												<div
													class={cn(
														"text-foreground group-hover:text-primary truncate text-[13px] font-black tracking-tight uppercase transition-colors"
													)}
												>
													{preset.name}
												</div>
												<Show when={preset.description}>
													<div
														class={cn(
															"text-muted-foreground mt-1 truncate text-[10px] leading-tight font-bold"
														)}
													>
														{preset.description}
													</div>
												</Show>
												<div class={cn("mt-2 flex items-center gap-2")}>
													<Badge variant="secondary" class={cn("h-4 px-2 text-[8px]! font-black")}>
														{preset.parameters.length} VARS
													</Badge>
													<span
														class={cn(
															"text-muted-foreground/50 text-[9px] font-black tracking-widest uppercase"
														)}
													>
														{shareImportExpandedId() === preset.id ? "Hide" : "View"}
													</span>
												</div>
											</button>

											{/* Expanded parameter list */}
											<Show when={shareImportExpandedId() === preset.id}>
												<div class={cn("mt-3")} data-testid="share-import-preset-params">
													<Separator class={cn("mb-3 opacity-50")} />
													<div class={cn("space-y-1.5")}>
														<For each={preset.parameters}>
															{(param) => (
																<div
																	class={cn(
																		"border-border/40 bg-muted/40 flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-[10px] shadow-sm"
																	)}
																	data-testid="share-import-preset-param"
																>
																	<div class={cn("flex min-w-0 flex-1 items-center")}>
																		<span class={cn("mr-1.5 scale-90 opacity-60")}>
																			{getParameterTypeIcon(param.type)}
																		</span>
																		<span
																			class={cn(
																				"text-foreground truncate font-black tracking-tighter uppercase"
																			)}
																		>
																			{param.key}
																		</span>
																	</div>
																	<span
																		class={cn(
																			"border-border/20 bg-background/60 text-muted-foreground/90 ml-2 max-w-[55%] truncate rounded-sm border px-1.5 py-0.5 font-mono"
																		)}
																	>
																		{param.value}
																	</span>
																</div>
															)}
														</For>
													</div>
												</div>
											</Show>
										</Card>
									)}
								</For>
							</div>
						</div>
					</Show>

					{/* Actions */}
					<div class={cn("flex justify-end gap-3 pt-2")}>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleShareImportCancel}
							data-testid="share-import-cancel"
						>
							Cancel
						</Button>
						<Show when={!shareImportError()}>
							<Button
								variant="secondary"
								size="sm"
								onClick={handleShareImportConfirm}
								data-testid="share-import-confirm"
							>
								<svg
									class={cn("size-3.5 opacity-70")}
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12"
									/>
								</svg>
								Import
							</Button>
						</Show>
					</div>
				</div>
			</Card>
		</div>
	);

	return (
		<div class={cn("relative flex flex-col", props.class)}>
			<Show when={viewMode() === "list"}>{renderListView()}</Show>
			<Show when={viewMode() === "create" || viewMode() === "edit"}>{renderFormView()}</Show>
			<Show when={viewMode() === "export"}>{renderExportView()}</Show>
			<Show when={viewMode() === "file-import"}>{renderFileImportView()}</Show>
			<Show when={viewMode() === "share-import"}>{renderShareImportView()}</Show>
			<Show when={viewMode() === "repository-import"}>
				<RepositoryImportView
					onCancel={handleRepositoryImportCancel}
					onImport={handleRepositoryImportConfirm}
				/>
			</Show>
		</div>
	);
};
