/**
 * PresetToggleList UI Component
 *
 * Presentational component that renders the preset toggle list.
 * Receives all data and callbacks via props from the logic layer.
 */
import type { Component } from "solid-js";
import { For, Show } from "solid-js";

import { getParameterTypeIcon } from "@/logic/parameters";
import { cn } from "@/utils/cn";

import { Badge } from "../../ui/Badge";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { Separator } from "../../ui/Separator";
import { Switch } from "../../ui/Switch";
import type { PresetToggleListLogic } from "./logic";

// ============================================================================
// UI Component
// ============================================================================

export const PresetToggleListUI: Component<PresetToggleListLogic> = (props) => {
	return (
		<div class={cn("flex flex-col space-y-3", props.class)} data-testid="preset-toggle-list">
			<div class={cn("flex items-center justify-between")}>
				<h2
					class={cn("text-foreground/50 text-[10px] font-black tracking-[0.2em] uppercase")}
					data-testid="presets-heading"
				>
					Active Presets
				</h2>
				<Show when={props.onManagePresets}>
					<Button
						variant="ghost"
						size="xs"
						onClick={props.onManagePresets}
						data-testid="manage-presets-button"
					>
						Manage
					</Button>
				</Show>
			</div>

			{/* Loading State */}
			<Show when={props.loading()}>
				<div class={cn("flex items-center justify-center py-6")}>
					<div
						class={cn(
							"border-primary/30 border-t-primary size-4 animate-spin rounded-full border-2"
						)}
					/>
				</div>
			</Show>

			{/* Empty State */}
			<Show when={!props.loading() && props.presets().length === 0}>
				<Card class={cn("border-border/50 bg-muted/10 border-dashed px-4 py-10 text-center")}>
					<p class={cn("text-muted-foreground text-[10px] font-black tracking-widest uppercase")}>
						No presets active
					</p>
					<Show when={props.onManagePresets}>
						<Button
							variant="link"
							size="sm"
							onClick={props.onManagePresets}
							class={cn("mt-2")}
							data-testid="create-first-preset-button"
						>
							Create Your First Preset
						</Button>
					</Show>
				</Card>
			</Show>

			{/* Presets List */}
			<Show when={!props.loading() && props.presets().length > 0}>
				<div class={cn("flex flex-col space-y-3")} data-testid="presets-container">
					<For each={props.presets()}>
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
											type="button"
											class={cn("group w-full text-left")}
											onClick={() => props.onToggleExpanded(preset.id)}
											data-testid="preset-expand-button"
										>
											<div
												class={cn(
													"text-foreground group-hover:text-primary mb-1 truncate text-[14px] leading-tight font-black tracking-tight uppercase transition-colors"
												)}
												data-testid="preset-toggle-name"
											>
												{preset.name}
											</div>
											<Show when={preset.description}>
												<div
													class={cn(
														"text-muted-foreground truncate text-[11px] leading-none font-bold"
													)}
													data-testid="preset-toggle-description"
												>
													{preset.description}
												</div>
											</Show>
											<div class={cn("mt-3 flex items-center space-x-2")}>
												<Badge variant="secondary" class={cn("h-4 px-2 text-[8px]! font-black")}>
													{preset.parameters.length} VARS
												</Badge>
												<Show when={props.expanded}>
													<span
														class={cn(
															"text-muted-foreground/50 text-[9px] font-black tracking-widest uppercase"
														)}
													>
														{props.expandedPresetId() === preset.id
															? "Hide Details"
															: "View Details"}
													</span>
												</Show>
											</div>
										</button>
									</div>

									<div class={cn("flex h-full items-center pt-1.5")}>
										<Switch
											checked={preset.isActive}
											disabled={props.togglingPreset() === preset.id}
											onCheckedChange={() => props.onToggle(preset.id)}
											aria-label={`Toggle ${preset.name} preset`}
											data-testid="preset-toggle-checkbox"
										/>
									</div>
								</div>

								{/* Expanded parameter list */}
								<Show when={props.expanded && props.expandedPresetId() === preset.id}>
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
};
