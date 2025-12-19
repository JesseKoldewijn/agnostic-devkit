import { Component, createEffect, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { browser } from "wxt/browser";
import type { Preset } from "@/logic/parameters";
import {
	getParameterTypeIcon,
	getPresetsWithActiveState,
	onPresetsChanged,
	onTabPresetStatesChanged,
	togglePreset,
} from "@/logic/parameters";
import { cn } from "@/utils/cn";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Separator } from "./ui/Separator";
import { Switch } from "./ui/Switch";

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
	const [presets, setPresets] = createSignal<(Preset & { isActive: boolean })[]>([]);
	const [currentTabId, setCurrentTabId] = createSignal<number | null>(null);
	const [loading, setLoading] = createSignal(true);
	const [togglingPreset, setTogglingPreset] = createSignal<string | null>(null);
	const [expandedPresetId, setExpandedPresetId] = createSignal<string | null>(null);

	// Check if there's a test override for the target tab ID
	const getTestOverrideTabId = (): number | null => {
		const urlParams = new URLSearchParams(window.location.search);
		const overrideTabId = urlParams.get("targetTabId");
		if (overrideTabId) {
			const parsed = parseInt(overrideTabId, 10);
			if (!isNaN(parsed)) {
				return parsed;
			}
		}
		return null;
	};

	// Get the current tab ID
	const getCurrentTabId = async (): Promise<number | null> => {
		// Check for test override via URL param (used in e2e tests)
		const overrideId = getTestOverrideTabId();
		if (overrideId !== null) {
			return overrideId;
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
		if (tabId === null) {
			return;
		}

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
		if (tabId === null) {
			return;
		}

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

		// Don't set up tab change listeners if using a test override
		// (test override should remain fixed to the specified tab)
		const hasTestOverride = getTestOverrideTabId() !== null;
		if (hasTestOverride) {
			return;
		}

		// Listen for tab activation changes to update currentTabId
		const handleTabActivated = async (activeInfo: { tabId: number; windowId: number }) => {
			// Update to the newly activated tab
			setCurrentTabId(activeInfo.tabId);
			await loadPresets();
		};

		// Listen for tab updates (URL changes in the current tab)
		const handleTabUpdated = async (
			tabId: number,
			_changeInfo: { status?: string; url?: string },
			_tab: { id?: number; url?: string }
		) => {
			// Only care about updates to the currently tracked tab
			if (tabId === currentTabId()) {
				// Reload presets to reflect any URL changes
				await loadPresets();
			}
		};

		// Add listeners
		browser.tabs?.onActivated.addListener(handleTabActivated);
		browser.tabs?.onUpdated.addListener(handleTabUpdated);

		// Store handlers for cleanup
		onCleanup(() => {
			browser.tabs?.onActivated.removeListener(handleTabActivated);
			browser.tabs?.onUpdated.removeListener(handleTabUpdated);
		});
	});

	// Subscribe to storage changes
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
		<div class={cn("flex flex-col space-y-3", props.class)} data-testid="preset-toggle-list">
			<div class={cn("flex items-center justify-between")}>
				<h2
					class={cn("font-black text-[10px] text-foreground/50 uppercase tracking-[0.2em]")}
					data-testid="presets-heading"
				>
					Active Presets
				</h2>
				<Show when={props.onManagePresets}>
					<Button
						variant="ghost"
						size="xs"
						onClick={props.onManagePresets}
						class={cn("font-black text-[9px] uppercase tracking-widest")}
						data-testid="manage-presets-button"
					>
						Manage
					</Button>
				</Show>
			</div>

			<Show when={loading()}>
				<div class={cn("flex items-center justify-center py-6")}>
					<div
						class={cn(
							"h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
						)}
					/>
				</div>
			</Show>

			<Show when={!loading() && presets().length === 0}>
				<Card class={cn("border-border/50 border-dashed bg-muted/10 px-4 py-10 text-center")}>
					<p class={cn("font-black text-[10px] text-muted-foreground uppercase tracking-widest")}>
						No presets active
					</p>
					<Show when={props.onManagePresets}>
						<Button
							variant="link"
							size="xs"
							onClick={props.onManagePresets}
							class={cn("mt-2")}
							data-testid="create-first-preset-button"
						>
							Create Your First Preset
						</Button>
					</Show>
				</Card>
			</Show>

			<Show when={!loading() && presets().length > 0}>
				<div class={cn("flex flex-col space-y-3")} data-testid="presets-container">
					<For each={presets()}>
						{(preset) => (
							<Card
								class={cn(
									"p-4 shadow-sm transition-all",
									preset.isActive ? "border-primary/30 bg-primary/5" : "border-border/60 bg-card"
								)}
								data-testid="preset-toggle-item"
								data-preset-id={preset.id}
							>
								<div class={cn("flex items-start justify-between")}>
									<div class={cn("min-w-0 flex-1 pr-4")}>
										<button
											class={cn("group w-full text-left")}
											onClick={() => props.expanded && toggleExpanded(preset.id)}
											data-testid="preset-expand-button"
										>
											<div
												class={cn(
													"mb-1 truncate font-black text-[14px] text-foreground uppercase leading-tight tracking-tight transition-colors group-hover:text-primary"
												)}
												data-testid="preset-toggle-name"
											>
												{preset.name}
											</div>
											<Show when={preset.description}>
												<div
													class={cn(
														"truncate font-bold text-[11px] text-muted-foreground leading-none"
													)}
													data-testid="preset-toggle-description"
												>
													{preset.description}
												</div>
											</Show>
											<div class={cn("mt-3 flex items-center space-x-2")}>
												<Badge variant="secondary" class={cn("!text-[8px] h-4 px-2 font-black")}>
													{preset.parameters.length} VARS
												</Badge>
												<Show when={props.expanded}>
													<span
														class={cn(
															"font-black text-[9px] text-muted-foreground/50 uppercase tracking-widest"
														)}
													>
														{expandedPresetId() === preset.id ? "Hide Details" : "View Details"}
													</span>
												</Show>
											</div>
										</button>
									</div>

									<div class={cn("flex h-full items-center pt-1.5")}>
										<Switch
											checked={preset.isActive}
											disabled={togglingPreset() === preset.id}
											onCheckedChange={() => handleToggle(preset.id)}
											data-testid="preset-toggle-checkbox"
										/>
									</div>
								</div>

								{/* Expanded parameter list */}
								<Show when={props.expanded && expandedPresetId() === preset.id}>
									<div class={cn("mt-4")} data-testid="preset-expanded-params">
										<Separator class={cn("mb-4 opacity-50")} />
										<div class={cn("space-y-2")}>
											<For each={preset.parameters}>
												{(param) => (
													<div
														class={cn(
															"flex items-center justify-between rounded-lg border border-border/40 bg-muted/40 px-3 py-2 text-[11px] shadow-sm"
														)}
														data-testid="preset-expanded-param"
													>
														<div class={cn("flex min-w-0 flex-1 items-center")}>
															<span class={cn("mr-2 scale-90 opacity-60")}>
																{getParameterTypeIcon(param.type)}
															</span>
															<span
																class={cn(
																	"truncate font-black text-foreground uppercase tracking-tighter"
																)}
															>
																{param.key}
															</span>
														</div>
														<span
															class={cn(
																"ml-2 max-w-[55%] truncate rounded border border-border/20 bg-background/60 px-2 py-1 font-mono text-muted-foreground/90"
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
};
