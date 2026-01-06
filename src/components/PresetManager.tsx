import type { Component } from "solid-js";
import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import type { Parameter, ParameterType, Preset } from "@/logic/parameters";
import {
	createEmptyParameter,
	createPreset,
	deletePreset,
	duplicatePreset,
	exportPresets,
	getPresets,
	importPresets,
	onPresetsChanged,
	updatePresetData,
} from "@/logic/parameters";
import { cn } from "@/utils/cn";
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

type ViewMode = "list" | "create" | "edit";

/**
 * Full CRUD interface for managing presets and their parameters
 */
export const PresetManager: Component<PresetManagerProps> = (props) => {
	const [presets, setPresets] = createSignal<Preset[]>([]);
	const [loading, setLoading] = createSignal(true);
	const [viewMode, setViewMode] = createSignal<ViewMode>("list");
	const [editingPreset, setEditingPreset] = createSignal<Preset | null>(null);
	const [confirmDelete, setConfirmDelete] = createSignal<string | null>(null);

	// Form state - only track parameter IDs for rendering, not their values
	const [parameterIds, setParameterIds] = createSignal<string[]>([]);
	const [saving, setSaving] = createSignal(false);

	// Store initial parameter data for default values (only used when editing)
	const [initialParameterData, setInitialParameterData] = createSignal<Map<string, Parameter>>(
		new Map()
	);

	// Load presets
	const loadPresets = async () => {
		try {
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
		setViewMode("edit");
	};

	// Cancel create/edit
	const cancelForm = () => {
		resetForm();
		setViewMode("list");
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
			const value = (formData.get(`param-${paramId}-value`) as string) || "";
			const paramDescription =
				(formData.get(`param-${paramId}-description`) as string)?.trim() || undefined;

			params.push({
				description: paramDescription,
				id: paramId,
				key: key.trim(),
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

	// Export presets
	const handleExport = async () => {
		try {
			const json = await exportPresets();
			const blob = new Blob([json], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `presets-${new Date().toISOString().split("T")[0]}.json`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error("[PresetManager] Failed to export presets:", error);
			alert("Failed to export presets.");
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
							"font-black text-[10px] text-foreground uppercase tracking-[0.2em] opacity-70"
						)}
						data-testid="manage-presets-heading"
					>
						Manage Presets
					</h2>
					<Show when={props.onClose}>
						<Button
							variant="ghost"
							size="icon"
							onClick={props.onClose}
							class={cn("h-6 w-6 text-foreground/50 hover:text-foreground")}
							data-testid="close-manager-button"
							title="Close manager"
						>
							<svg
								class={cn("h-4 w-4")}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
								role="img"
							>
								<title>Close</title>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</Button>
					</Show>
				</div>

				<div
					class={cn(
						"flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/30 p-3"
					)}
				>
					<div class={cn("flex gap-2")}>
						<Button
							variant="secondary"
							size="xs"
							onClick={handleExport}
							class={cn("h-8 min-w-[85px] border border-border/40 shadow-sm")}
							title="Export presets to JSON"
							data-testid="export-presets-button"
						>
							<svg
								class={cn("mr-1.5 h-3.5 w-3.5 opacity-70")}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
								role="img"
							>
								<title>Export</title>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
								/>
							</svg>
							Export
						</Button>
						<div class={cn("relative")}>
							<input
								type="file"
								id="import-presets-input"
								accept=".json"
								onChange={handleImport}
								class={cn("hidden")}
								data-testid="import-presets-input"
							/>
							<Button
								variant="secondary"
								size="xs"
								onClick={() =>
									(document.querySelector("#import-presets-input") as HTMLInputElement)?.click()
								}
								class={cn("h-8 min-w-[85px] border border-border/40 shadow-sm")}
								title="Import presets from JSON"
								data-testid="import-presets-button"
							>
								<svg
									class={cn("mr-1.5 h-3.5 w-3.5 opacity-70")}
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
									role="img"
								>
									<title>Import</title>
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
					</div>
					<Button
						size="xs"
						onClick={startCreate}
						data-testid="create-preset-button"
						class={cn("h-8 px-4")}
					>
						<span>+ New Preset</span>
					</Button>
				</div>
			</div>

			<Show when={loading()}>
				<div class={cn("flex flex-col items-center justify-center space-y-2 py-12")}>
					<div
						class={cn(
							"h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
						)}
					/>
				</div>
			</Show>

			<Show when={!loading() && presets().length === 0}>
				<Card
					class={cn(
						"flex flex-col items-center justify-center border-border/40 border-dashed bg-muted/10 px-6 py-12 text-center"
					)}
					data-testid="no-presets-message"
				>
					<p
						class={cn(
							"mb-4 font-black text-[10px] text-muted-foreground uppercase tracking-widest"
						)}
					>
						No presets found
					</p>
					<Button variant="outline" size="xs" onClick={startCreate} class={cn("h-8")}>
						Create First Preset
					</Button>
				</Card>
			</Show>

			<Show when={!loading() && presets().length > 0}>
				<div class={cn("-mr-1 flex-1 space-y-3 overflow-y-auto pr-1")} data-testid="presets-list">
					<For each={presets()}>
						{(preset) => (
							<Card
								class={cn("border-border/60 p-4 shadow-sm transition-all hover:border-primary/30")}
								data-testid="preset-item"
								data-preset-id={preset.id}
							>
								<div class={cn("flex items-start justify-between gap-4")}>
									<div class={cn("min-w-0 flex-1")}>
										<div
											class={cn(
												"truncate font-black text-[14px] text-foreground uppercase tracking-tight"
											)}
											data-testid="preset-name"
										>
											{preset.name}
										</div>
										<Show when={preset.description}>
											<div
												class={cn(
													"mt-1 line-clamp-1 font-bold text-[11px] text-muted-foreground leading-tight"
												)}
												data-testid="preset-description"
											>
												{preset.description}
											</div>
										</Show>
										<div class={cn("mt-2.5 flex flex-wrap gap-1.5")}>
											<For each={preset.parameters.slice(0, 3)}>
												{(param) => (
													<Badge variant="outline" class={cn("!text-[8px] h-4 px-1.5")}>
														{param.key}
													</Badge>
												)}
											</For>
											<Show when={preset.parameters.length > 3}>
												<Badge variant="outline" class={cn("!text-[8px] h-4 px-1.5 italic")}>
													+{preset.parameters.length - 3}
												</Badge>
											</Show>
										</div>
									</div>
									<div class={cn("flex items-center space-x-1")}>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleDuplicate(preset.id)}
											class={cn("h-7 w-7 text-foreground/50 hover:bg-muted hover:text-foreground")}
											title="Duplicate preset"
											data-testid="duplicate-preset-button"
										>
											<svg
												class={cn("h-3.5 w-3.5")}
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												aria-hidden="true"
												role="img"
											>
												<title>Duplicate</title>
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
											class={cn("h-7 w-7 text-foreground/50 hover:bg-muted hover:text-foreground")}
											title="Edit preset"
											data-testid="edit-preset-button"
										>
											<svg
												class={cn("h-3.5 w-3.5")}
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												aria-hidden="true"
												role="img"
											>
												<title>Edit</title>
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
													variant="ghost"
													size="icon"
													onClick={() => setConfirmDelete(preset.id)}
													class={cn(
														"h-7 w-7 text-destructive/50 hover:bg-destructive/10 hover:text-destructive"
													)}
													title="Delete preset"
													data-testid="delete-preset-button"
												>
													<svg
														class={cn("h-3.5 w-3.5")}
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
														aria-hidden="true"
														role="img"
													>
														<title>Delete</title>
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
													class={cn("!text-[8px] h-6 px-2")}
													data-testid="confirm-delete-button"
												>
													Confirm
												</Button>
												<Button
													variant="secondary"
													size="xs"
													onClick={() => setConfirmDelete(null)}
													class={cn("!text-[8px] h-6 px-2")}
													data-testid="cancel-delete-button"
												>
													X
												</Button>
											</div>
										</Show>
									</div>
								</div>
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
								"font-black text-[10px] text-foreground uppercase tracking-[0.2em] opacity-50"
							)}
							data-testid="preset-form-heading"
						>
							{viewMode() === "create" ? "Create New Preset" : "Edit Preset Details"}
						</h2>
						<Button
							variant="ghost"
							size="icon"
							type="button"
							onClick={cancelForm}
							class={cn("h-6 w-6")}
							data-testid="cancel-form-button"
							title="Cancel"
						>
							<svg
								class={cn("h-4 w-4")}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
								role="img"
							>
								<title>Cancel</title>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</Button>
					</div>

					<div
						class={cn(
							"flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 p-2.5"
						)}
					>
						<p
							class={cn("ml-2 font-black text-[10px] text-foreground/40 uppercase tracking-widest")}
						>
							Preset Configuration
						</p>
						<Button
							type="submit"
							size="xs"
							class={cn("h-8 px-4")}
							disabled={saving()}
							data-testid="save-preset-button"
						>
							<Show
								when={saving()}
								fallback={<span>{viewMode() === "create" ? "Save Preset" : "Update Preset"}</span>}
							>
								<span>Saving...</span>
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
								class={cn("!text-[10px] mb-0 font-black uppercase tracking-[0.2em] opacity-50")}
							>
								Parameters ({parameterIds().length})
							</Label>
							<Button
								type="button"
								variant="ghost"
								size="xs"
								onClick={addParameter}
								class={cn("!text-[10px] h-7 px-3")}
								data-testid="add-parameter-button"
							>
								+ Add Variable
							</Button>
						</div>

						<Show when={parameterIds().length === 0}>
							<Card
								class={cn(
									"flex flex-col items-center justify-center border-border/30 border-dashed bg-muted/10 px-4 py-10"
								)}
								data-testid="no-parameters-message"
							>
								<Button
									type="button"
									variant="outline"
									size="xs"
									onClick={addParameter}
									class={cn("h-9 px-5")}
									data-testid="add-first-parameter-button"
								>
									Add First Parameter
								</Button>
							</Card>
						</Show>

						<div class={cn("space-y-4")} data-testid="parameters-list">
							<For each={parameterIds()}>
								{(paramId, index) => {
									const param = createMemo(() => getParameterData(paramId));
									const paramData = param();
									return (
										<Card
											class={cn("group relative border-border/40 p-4 shadow-sm")}
											data-testid={`parameter-item-${index()}`}
										>
											<div class={cn("mb-4 flex items-center justify-between")}>
												<div class={cn("flex items-center gap-2.5")}>
													<Badge
														variant="default"
														class={cn(
															"!p-0 !text-[9px] flex h-5 w-5 items-center justify-center rounded-sm"
														)}
													>
														{index() + 1}
													</Badge>
													<Select
														name={`param-${paramId}-type`}
														ref={(el) => {
															if (el) {
																el.value = paramData.type;
															}
														}}
														class={cn(
															"!py-0 !px-2 !text-[10px] h-7 w-28 rounded-md uppercase tracking-widest"
														)}
														data-testid="parameter-type-select"
													>
														<option value="queryParam">URL Query</option>
														<option value="cookie">Cookie</option>
														<option value="localStorage">Storage</option>
													</Select>
												</div>
												<Button
													variant="ghost"
													size="icon"
													type="button"
													onClick={() => removeFormParameter(paramId)}
													class={cn(
														"h-7 w-7 text-destructive/40 opacity-0 transition-opacity hover:bg-destructive/5 hover:text-destructive group-hover:opacity-100"
													)}
													title="Remove parameter"
													data-testid="remove-parameter-button"
												>
													<svg
														class={cn("h-4 w-4")}
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
														aria-hidden="true"
														role="img"
													>
														<title>Remove</title>
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
												<Input
													label="Key"
													name={`param-${paramId}-key`}
													placeholder="variable_name"
													ref={(el) => {
														if (el) {
															el.value = paramData.key;
														}
													}}
													class={cn("!px-3 !py-1.5 !text-[12px] h-9 rounded-lg font-mono")}
													data-testid="parameter-key-input"
												/>

												<Input
													label="Value"
													name={`param-${paramId}-value`}
													placeholder="value"
													ref={(el) => {
														if (el) {
															el.value = paramData.value;
														}
													}}
													class={cn("!px-3 !py-1.5 !text-[12px] h-9 rounded-lg font-mono")}
													data-testid="parameter-value-input"
												/>

												<Input
													label="Notes (Optional)"
													name={`param-${paramId}-description`}
													placeholder="How is this variable used?"
													ref={(el) => {
														if (el) {
															el.value = paramData.description ?? "";
														}
													}}
													containerClass={cn("col-span-2")}
													class={cn(
														"!px-3 !py-1.5 !text-[10px] h-8 rounded-lg border-border/30 bg-muted/10 font-bold"
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

	return (
		<div class={cn("flex flex-col", props.class)}>
			<Show when={viewMode() === "list"}>{renderListView()}</Show>
			<Show when={viewMode() === "create" || viewMode() === "edit"}>{renderFormView()}</Show>
		</div>
	);
};
