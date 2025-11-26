import {
	Component,
	createSignal,
	createEffect,
	For,
	Show,
	onMount,
	onCleanup,
	createMemo,
} from "solid-js";
import {
	type Preset,
	type Parameter,
	type ParameterType,
	getPresets,
	createPreset,
	updatePresetData,
	deletePreset,
	onPresetsChanged,
	getParameterTypeIcon,
	createEmptyParameter,
} from "~/logic/parameters";

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
	const [initialParameterData, setInitialParameterData] = createSignal<
		Map<string, Parameter>
	>(new Map());

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
	const getParameterData = (paramId: string): Parameter => {
		return initialParameterData().get(paramId) ?? createEmptyParameter();
	};

	// Save the preset (create or update) - reads all data from DOM
	const savePreset = async (e?: Event) => {
		e?.preventDefault();

		// Read form data from DOM
		const form = document.querySelector(
			"[data-preset-form]"
		) as HTMLFormElement;
		if (!form) return;

		const formData = new FormData(form);
		const name = (formData.get("preset-name") as string)?.trim();

		if (!name) {
			alert("Please enter a preset name");
			return;
		}

		const description =
			(formData.get("preset-description") as string)?.trim() || undefined;

		// Read all parameters from DOM
		const params: Parameter[] = [];
		for (const paramId of parameterIds()) {
			const key = formData.get(`param-${paramId}-key`) as string;
			if (!key?.trim()) continue; // Skip empty parameters

			const type = formData.get(
				`param-${paramId}-type`
			) as string as ParameterType;
			const value =
				(formData.get(`param-${paramId}-value`) as string) || "";
			const paramDescription =
				(
					formData.get(`param-${paramId}-description`) as string
				)?.trim() || undefined;

			params.push({
				id: paramId,
				type,
				key: key.trim(),
				value,
				description: paramDescription,
			});
		}

		setSaving(true);
		try {
			if (viewMode() === "create") {
				await createPreset({
					name,
					description,
					parameters: params,
				});
			} else {
				const preset = editingPreset();
				if (preset) {
					await updatePresetData(preset.id, {
						name,
						description,
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

	// Render the list view
	const renderListView = () => (
		<div class="flex flex-col h-full">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-semibold text-foreground">
					Manage Presets
				</h2>
				<div class="flex gap-2">
					<button
						onClick={startCreate}
						class="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
					>
						+ New Preset
					</button>
					<Show when={props.onClose}>
						<button
							onClick={props.onClose}
							class="px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
						>
							Close
						</button>
					</Show>
				</div>
			</div>

			<Show when={loading()}>
				<div class="flex items-center justify-center py-8">
					<div class="text-sm text-muted-foreground">Loading...</div>
				</div>
			</Show>

			<Show when={!loading() && presets().length === 0}>
				<div class="text-center py-8 px-4 bg-muted/50 rounded-lg border border-border">
					<p class="text-muted-foreground mb-2">No presets yet</p>
					<p class="text-sm text-muted-foreground">
						Create presets to save groups of parameters that you can
						quickly apply to any tab.
					</p>
				</div>
			</Show>

			<Show when={!loading() && presets().length > 0}>
				<div class="flex-1 overflow-y-auto space-y-2">
					<For each={presets()}>
						{(preset) => (
							<div class="p-3 bg-card rounded-lg border border-border">
								<div class="flex items-start justify-between">
									<div class="flex-1 min-w-0">
										<div class="font-medium text-foreground">
											{preset.name}
										</div>
										<Show when={preset.description}>
											<div class="text-sm text-muted-foreground mt-0.5">
												{preset.description}
											</div>
										</Show>
										<div class="flex flex-wrap gap-1 mt-2">
											<For
												each={preset.parameters.slice(
													0,
													3
												)}
											>
												{(param) => (
													<span class="inline-flex items-center px-1.5 py-0.5 text-xs bg-muted rounded">
														<span class="mr-1">
															{getParameterTypeIcon(
																param.type
															)}
														</span>
														<span class="font-mono text-foreground">
															{param.key}
														</span>
													</span>
												)}
											</For>
											<Show
												when={
													preset.parameters.length > 3
												}
											>
												<span class="text-xs text-muted-foreground px-1.5 py-0.5">
													+
													{preset.parameters.length -
														3}{" "}
													more
												</span>
											</Show>
										</div>
									</div>
									<div class="flex gap-1 ml-2">
										<button
											onClick={() => startEdit(preset)}
											class="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
											title="Edit preset"
										>
											<svg
												class="w-4 h-4"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
												/>
											</svg>
										</button>
										<Show
											when={confirmDelete() === preset.id}
											fallback={
												<button
													onClick={() =>
														setConfirmDelete(
															preset.id
														)
													}
													class="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
													title="Delete preset"
												>
													<svg
														class="w-4 h-4"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
														/>
													</svg>
												</button>
											}
										>
											<div class="flex gap-1">
												<button
													onClick={() =>
														handleDelete(preset.id)
													}
													class="px-2 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
												>
													Delete
												</button>
												<button
													onClick={() =>
														setConfirmDelete(null)
													}
													class="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors"
												>
													Cancel
												</button>
											</div>
										</Show>
									</div>
								</div>
							</div>
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
				class="flex flex-col h-full"
				onSubmit={savePreset}
			>
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-lg font-semibold text-foreground">
						{viewMode() === "create"
							? "Create Preset"
							: "Edit Preset"}
					</h2>
					<button
						type="button"
						onClick={cancelForm}
						class="px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
					>
						Cancel
					</button>
				</div>

				<div class="flex-1 overflow-y-auto space-y-4">
					{/* Preset name */}
					<div>
						<label class="block text-sm font-medium text-foreground mb-1">
							Name <span class="text-destructive">*</span>
						</label>
						<input
							type="text"
							name="preset-name"
							placeholder="My Preset"
							required
							ref={(el) => {
								if (el && defaultName) el.value = defaultName;
							}}
							class="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
						/>
					</div>

					{/* Description */}
					<div>
						<label class="block text-sm font-medium text-foreground mb-1">
							Description
						</label>
						<input
							type="text"
							name="preset-description"
							placeholder="Optional description"
							ref={(el) => {
								if (el && defaultDescription)
									el.value = defaultDescription;
							}}
							class="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
						/>
					</div>

					{/* Parameters */}
					<div>
						<div class="flex items-center justify-between mb-2">
							<label class="block text-sm font-medium text-foreground">
								Parameters
							</label>
							<button
								type="button"
								onClick={addParameter}
								class="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors"
							>
								+ Add Parameter
							</button>
						</div>

						<Show when={parameterIds().length === 0}>
							<div class="text-center py-4 px-3 bg-muted/50 rounded-lg border border-border">
								<p class="text-sm text-muted-foreground">
									No parameters yet
								</p>
								<button
									type="button"
									onClick={addParameter}
									class="mt-2 text-xs text-primary hover:underline"
								>
									Add your first parameter
								</button>
							</div>
						</Show>

						<div class="space-y-3">
							<For each={parameterIds()}>
								{(paramId, index) => {
									const param = createMemo(() =>
										getParameterData(paramId)
									);
									const paramData = param();
									return (
										<div class="p-3 bg-muted/50 rounded-lg border border-border">
											<div class="flex items-center justify-between mb-2">
												<span class="text-xs font-medium text-muted-foreground">
													Parameter {index() + 1}
												</span>
												<button
													type="button"
													onClick={() =>
														removeFormParameter(
															paramId
														)
													}
													class="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
													title="Remove parameter"
												>
													<svg
														class="w-3.5 h-3.5"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M6 18L18 6M6 6l12 12"
														/>
													</svg>
												</button>
											</div>

											<div class="grid grid-cols-1 gap-2">
												{/* Type selector */}
												<div>
													<label class="block text-xs text-muted-foreground mb-1">
														Type
													</label>
													<select
														name={`param-${paramId}-type`}
														class="w-full px-2 py-1.5 text-sm bg-background border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
														ref={(el) => {
															if (el)
																el.value =
																	paramData.type;
														}}
													>
														<option value="queryParam">
															🔗 Query Parameter
														</option>
														<option value="cookie">
															🍪 Cookie
														</option>
														<option value="localStorage">
															💾 Local Storage
														</option>
													</select>
												</div>

												{/* Key */}
												<div>
													<label class="block text-xs text-muted-foreground mb-1">
														Key
													</label>
													<input
														type="text"
														name={`param-${paramId}-key`}
														placeholder="parameter_name"
														ref={(el) => {
															if (el)
																el.value =
																	paramData.key;
														}}
														class="w-full px-2 py-1.5 text-sm font-mono bg-background border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
													/>
												</div>

												{/* Value */}
												<div>
													<label class="block text-xs text-muted-foreground mb-1">
														Value
													</label>
													<input
														type="text"
														name={`param-${paramId}-value`}
														placeholder="value"
														ref={(el) => {
															if (el)
																el.value =
																	paramData.value;
														}}
														class="w-full px-2 py-1.5 text-sm font-mono bg-background border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
													/>
												</div>

												{/* Description */}
												<div>
													<label class="block text-xs text-muted-foreground mb-1">
														Description (optional)
													</label>
													<input
														type="text"
														name={`param-${paramId}-description`}
														placeholder="What this parameter does"
														ref={(el) => {
															if (el)
																el.value =
																	paramData.description ??
																	"";
														}}
														class="w-full px-2 py-1.5 text-sm bg-background border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
													/>
												</div>
											</div>
										</div>
									);
								}}
							</For>
						</div>
					</div>
				</div>

				{/* Save button */}
				<div class="pt-4 mt-4 border-t border-border">
					<button
						type="submit"
						disabled={saving()}
						class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{saving()
							? "Saving..."
							: viewMode() === "create"
							? "Create Preset"
							: "Save Changes"}
					</button>
				</div>
			</form>
		);
	};

	return (
		<div class={`flex flex-col ${props.class ?? ""}`}>
			<Show when={viewMode() === "list"}>{renderListView()}</Show>
			<Show when={viewMode() === "create" || viewMode() === "edit"}>
				{renderFormView()}
			</Show>
		</div>
	);
};

export default PresetManager;
