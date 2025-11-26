import { Component, createSignal, createEffect, For, Show, onMount, onCleanup } from "solid-js";
import { browser } from "~/utils/browser";
import {
	type Preset,
	getPresetsWithActiveState,
	togglePreset,
	onPresetsChanged,
	onTabPresetStatesChanged,
	getParameterTypeIcon,
} from "~/logic/parameters";

interface PresetToggleListProps {
	/** Whether to show expanded details (parameter list) */
	expanded?: boolean;
	/** Callback when manage presets button is clicked */
	onManagePresets?: () => void;
	/** Custom class for the container */
	class?: string;
}

/**
 * A list of presets with toggle switches for the current tab
 */
export const PresetToggleList: Component<PresetToggleListProps> = (props) => {
	const [presets, setPresets] = createSignal<Array<Preset & { isActive: boolean }>>([]);
	const [currentTabId, setCurrentTabId] = createSignal<number | null>(null);
	const [loading, setLoading] = createSignal(true);
	const [togglingPreset, setTogglingPreset] = createSignal<string | null>(null);
	const [expandedPresetId, setExpandedPresetId] = createSignal<string | null>(null);

	// Get the current tab ID
	const getCurrentTabId = async (): Promise<number | null> => {
		try {
			const tabs = await browser.tabs?.query({ active: true, currentWindow: true });
			return tabs?.[0]?.id ?? null;
		} catch {
			return null;
		}
	};

	// Load presets for the current tab
	const loadPresets = async () => {
		const tabId = currentTabId();
		if (tabId === null) return;

		try {
			const presetsWithState = await getPresetsWithActiveState(tabId);
			setPresets(presetsWithState);
		} catch (error) {
			console.error("[PresetToggleList] Failed to load presets:", error);
		} finally {
			setLoading(false);
		}
	};

	// Handle toggle
	const handleToggle = async (presetId: string) => {
		const tabId = currentTabId();
		if (tabId === null) return;

		setTogglingPreset(presetId);
		try {
			await togglePreset(tabId, presetId);
			await loadPresets();
		} catch (error) {
			console.error("[PresetToggleList] Failed to toggle preset:", error);
		} finally {
			setTogglingPreset(null);
		}
	};

	// Toggle expanded state for a preset
	const toggleExpanded = (presetId: string) => {
		setExpandedPresetId((current) => (current === presetId ? null : presetId));
	};

	onMount(async () => {
		const tabId = await getCurrentTabId();
		setCurrentTabId(tabId);
		if (tabId !== null) {
			await loadPresets();
		} else {
			setLoading(false);
		}
	});

	// Subscribe to changes
	createEffect(() => {
		const unsubPresets = onPresetsChanged(() => {
			loadPresets();
		});

		const unsubTabStates = onTabPresetStatesChanged(() => {
			loadPresets();
		});

		onCleanup(() => {
			unsubPresets();
			unsubTabStates();
		});
	});

	return (
		<div class={`flex flex-col space-y-3 ${props.class ?? ""}`}>
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-semibold text-foreground">Parameter Presets</h2>
				<Show when={props.onManagePresets}>
					<button
						onClick={props.onManagePresets}
						class="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors"
					>
						Manage
					</button>
				</Show>
			</div>

			<Show when={loading()}>
				<div class="flex items-center justify-center py-4">
					<div class="text-sm text-muted-foreground">Loading...</div>
				</div>
			</Show>

			<Show when={!loading() && presets().length === 0}>
				<div class="text-center py-4 px-3 bg-muted/50 rounded-lg border border-border">
					<p class="text-sm text-muted-foreground">No presets yet</p>
					<Show when={props.onManagePresets}>
						<button
							onClick={props.onManagePresets}
							class="mt-2 text-xs text-primary hover:underline"
						>
							Create your first preset
						</button>
					</Show>
				</div>
			</Show>

			<Show when={!loading() && presets().length > 0}>
				<div class="flex flex-col space-y-2">
					<For each={presets()}>
						{(preset) => (
							<div
								class={`p-3 rounded-lg border transition-all ${
									preset.isActive
										? "bg-primary/10 border-primary/30"
										: "bg-card border-border"
								}`}
							>
								<div class="flex items-center justify-between">
									<div class="flex-1 min-w-0">
										<button
											class="text-left w-full"
											onClick={() => props.expanded && toggleExpanded(preset.id)}
										>
											<div class="font-medium text-sm text-foreground truncate">
												{preset.name}
											</div>
											<Show when={preset.description}>
												<div class="text-xs text-muted-foreground mt-0.5 truncate">
													{preset.description}
												</div>
											</Show>
											<div class="text-xs text-muted-foreground mt-1">
												{preset.parameters.length} parameter{preset.parameters.length !== 1 ? "s" : ""}
											</div>
										</button>
									</div>

									<label class="relative inline-flex items-center cursor-pointer ml-3">
										<input
											type="checkbox"
											checked={preset.isActive}
											disabled={togglingPreset() === preset.id}
											onChange={() => handleToggle(preset.id)}
											class="sr-only peer"
										/>
										<div
											class={`w-9 h-5 bg-muted rounded-full peer 
												peer-checked:bg-primary 
												peer-disabled:opacity-50 
												after:content-[''] after:absolute after:top-0.5 after:left-0.5 
												after:bg-background after:border after:border-border after:rounded-full 
												after:h-4 after:w-4 after:transition-all 
												peer-checked:after:translate-x-full peer-checked:after:border-primary-foreground
												${togglingPreset() === preset.id ? "animate-pulse" : ""}`}
										/>
									</label>
								</div>

								{/* Expanded parameter list */}
								<Show when={props.expanded && expandedPresetId() === preset.id}>
									<div class="mt-3 pt-3 border-t border-border">
										<div class="text-xs font-medium text-muted-foreground mb-2">
											Parameters:
										</div>
										<div class="space-y-1.5">
											<For each={preset.parameters}>
												{(param) => (
													<div class="flex items-center text-xs bg-muted/50 rounded px-2 py-1.5">
														<span class="mr-1.5">{getParameterTypeIcon(param.type)}</span>
														<span class="font-mono text-foreground">{param.key}</span>
														<span class="mx-1 text-muted-foreground">=</span>
														<span class="font-mono text-muted-foreground truncate">
															{param.value}
														</span>
													</div>
												)}
											</For>
										</div>
									</div>
								</Show>
							</div>
						)}
					</For>
				</div>
			</Show>
		</div>
	);
};

export default PresetToggleList;

