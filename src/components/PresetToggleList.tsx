import { Component, createSignal, createEffect, For, Show, onMount, onCleanup } from "solid-js";
import { browser } from "@/utils/browser";
import {
	type Preset,
	getPresetsWithActiveState,
	togglePreset,
	onPresetsChanged,
	onTabPresetStatesChanged,
	getParameterTypeIcon,
} from "@/logic/parameters";

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
		// Check for test override via URL param (used in e2e tests)
		const urlParams = new URLSearchParams(window.location.search);
		const overrideTabId = urlParams.get("targetTabId");
		if (overrideTabId) {
			const parsed = parseInt(overrideTabId, 10);
			if (!isNaN(parsed)) {
				return parsed;
			}
		}

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
		<div class={`flex flex-col space-y-3 ${props.class ?? ""}`} data-testid="preset-toggle-list">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-semibold text-foreground" data-testid="presets-heading">Parameter Presets</h2>
				<Show when={props.onManagePresets}>
					<button
						onClick={props.onManagePresets}
						class="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors"
						data-testid="manage-presets-button"
					>
						Manage
					</button>
				</Show>
			</div>

			<Show when={loading()}>
				<div class="flex items-center justify-center py-4">
					<div class="text-sm text-muted-foreground" data-testid="loading-indicator">Loading...</div>
				</div>
			</Show>

			<Show when={!loading() && presets().length === 0}>
				<div class="text-center py-4 px-3 bg-muted/50 rounded-lg border border-border" data-testid="no-presets-message">
					<p class="text-sm text-muted-foreground">No presets yet</p>
					<Show when={props.onManagePresets}>
						<button
							onClick={props.onManagePresets}
							class="mt-2 text-xs text-primary hover:underline"
							data-testid="create-first-preset-button"
						>
							Create your first preset
						</button>
					</Show>
				</div>
			</Show>

			<Show when={!loading() && presets().length > 0}>
				<div class="flex flex-col space-y-2" data-testid="presets-container">
					<For each={presets()}>
						{(preset) => (
							<div
								class={`p-3 rounded-lg border transition-all ${
									preset.isActive
										? "bg-primary/10 border-primary/30"
										: "bg-card border-border"
								}`}
								data-testid={`preset-toggle-item-${preset.id}`}
							>
								<div class="flex items-center justify-between">
									<div class="flex-1 min-w-0">
										<button
											class="text-left w-full"
											onClick={() => props.expanded && toggleExpanded(preset.id)}
											data-testid="preset-expand-button"
										>
											<div class="font-medium text-sm text-foreground truncate" data-testid="preset-toggle-name">
												{preset.name}
											</div>
											<Show when={preset.description}>
												<div class="text-xs text-muted-foreground mt-0.5 truncate" data-testid="preset-toggle-description">
													{preset.description}
												</div>
											</Show>
											<div class="text-xs text-muted-foreground mt-1" data-testid="preset-parameter-count">
												{preset.parameters.length} parameter{preset.parameters.length !== 1 ? "s" : ""}
											</div>
										</button>
									</div>

									<label class="relative inline-flex items-center cursor-pointer ml-3" data-testid="preset-toggle-label">
										<input
											type="checkbox"
											checked={preset.isActive}
											disabled={togglingPreset() === preset.id}
											onChange={() => handleToggle(preset.id)}
											class="sr-only peer"
											data-testid="preset-toggle-checkbox"
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
									<div class="mt-3 pt-3 border-t border-border" data-testid="preset-expanded-params">
										<div class="text-xs font-medium text-muted-foreground mb-2">
											Parameters:
										</div>
										<div class="space-y-1.5">
											<For each={preset.parameters}>
												{(param) => (
													<div class="flex items-center text-xs bg-muted/50 rounded px-2 py-1.5" data-testid="preset-expanded-param">
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

