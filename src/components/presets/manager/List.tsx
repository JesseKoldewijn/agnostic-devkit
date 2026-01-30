/**
 * List view component for displaying all presets
 */
import type { Component } from "solid-js";
import { For, Show } from "solid-js";

import type { Preset } from "@/logic/parameters";
import { getParameterTypeIcon } from "@/logic/parameters";
import { cn } from "@/utils/cn";

import { Badge } from "../../ui/Badge";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { Separator } from "../../ui/Separator";

export interface ListProps {
	presets: Preset[];
	expandedPresetId: string | null;
	confirmDelete: string | null;
	onToggleExpanded: (presetId: string) => void;
	onStartEdit: (preset: Preset) => void;
	onDelete: (presetId: string) => void;
	onDuplicate: (presetId: string) => void;
	onExportSingle: (preset: Preset) => void;
	onSetConfirmDelete: (presetId: string | null) => void;
}

export const List: Component<ListProps> = (props) => {
	return (
		<div class={cn("-mr-1 flex-1 space-y-3 overflow-y-auto pr-1")} data-testid="presets-list">
			<For each={props.presets}>
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
									onClick={() => props.onToggleExpanded(preset.id)}
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
									<div class={cn("mt-2.5 flex shrink-0 items-center gap-2")}>
										<Badge
											variant="secondary"
											class={cn("h-4 shrink-0 px-2 text-[8px]! font-black whitespace-nowrap")}
										>
											{preset.parameters.length} VARS
										</Badge>
										<span
											class={cn(
												"text-muted-foreground/50 shrink-0 text-[9px] font-black tracking-widest whitespace-nowrap uppercase"
											)}
										>
											{props.expandedPresetId === preset.id ? "Hide" : "View"}
										</span>
									</div>
								</button>
							</div>
							<div class={cn("flex items-center space-x-1")}>
								{/* Export single preset */}
								<Button
									variant="ghost"
									size="icon"
									onClick={() => props.onExportSingle(preset)}
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
									onClick={() => props.onDuplicate(preset.id)}
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
									onClick={() => props.onStartEdit(preset)}
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
									when={props.confirmDelete === preset.id}
									fallback={
										<Button
											variant="ghost-destructive"
											size="icon"
											onClick={() => props.onSetConfirmDelete(preset.id)}
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
											onClick={() => props.onDelete(preset.id)}
											data-testid="confirm-delete-button"
										>
											Yes
										</Button>
										<Button
											variant="secondary"
											size="xs"
											onClick={() => props.onSetConfirmDelete(null)}
											data-testid="cancel-delete-button"
										>
											No
										</Button>
									</div>
								</Show>
							</div>
						</div>

						{/* Expanded parameter list */}
						<Show when={props.expandedPresetId === preset.id}>
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
	);
};
