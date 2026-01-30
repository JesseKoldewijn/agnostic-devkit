/**
 * Export view component for selecting and exporting presets
 */
import type { Component } from "solid-js";
import { For, Show, createMemo, createSignal } from "solid-js";

import type { Preset } from "@/logic/parameters";
import { getParameterTypeIcon } from "@/logic/parameters";
import { cn } from "@/utils/cn";

import { Badge } from "../../ui/Badge";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { Separator } from "../../ui/Separator";

export interface ExportProps {
	presets: Preset[];
	selectedPresets: Set<string>;
	copySuccess: boolean;
	onToggleSelection: (presetId: string) => void;
	onSelectAll: () => void;
	onClearSelection: () => void;
	onCancel: () => void;
	onExportDownload: () => Promise<void>;
	onExportUrl: () => Promise<void>;
}

export const Export: Component<ExportProps> = (props) => {
	const [expandedPresetId, setExpandedPresetId] = createSignal<string | null>(null);
	const [isExporting, setIsExporting] = createSignal(false);

	const allSelected = createMemo(
		() => props.presets.length > 0 && props.selectedPresets.size === props.presets.length
	);

	const handleExportDownload = async () => {
		setIsExporting(true);
		try {
			await props.onExportDownload();
		} finally {
			setIsExporting(false);
		}
	};

	const handleExportUrl = async () => {
		setIsExporting(true);
		try {
			await props.onExportUrl();
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<div class={cn("flex h-full flex-col")} data-testid="preset-export-view">
			<div class={cn("mb-4 flex flex-col space-y-4")}>
				<div class={cn("flex items-center justify-between")}>
					<h2
						class={cn(
							"text-foreground text-[10px] font-black tracking-[0.2em] uppercase opacity-70"
						)}
						data-testid="export-presets-heading"
					>
						Export Presets
					</h2>
					<Button
						variant="ghost"
						size="xs"
						onClick={props.onCancel}
						data-testid="export-back-button"
						aria-label="Cancel export"
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
						"border-border/50 bg-muted/30 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
					)}
				>
					<div class={cn("flex w-full items-center justify-between gap-2 sm:justify-end")}>
						<div class="flex flex-1 items-center gap-2 sm:hidden">
							<Button
								variant="secondary"
								size="sm"
								onClick={props.onSelectAll}
								data-testid="export-select-all-button-sm"
								disabled={allSelected()}
							>
								Select All
							</Button>
							<Button
								variant="secondary"
								size="sm"
								onClick={props.onClearSelection}
								data-testid="export-deselect-all-button-sm"
								disabled={props.selectedPresets.size === 0}
							>
								Deselect All
							</Button>
						</div>
						<span class={cn("text-muted-foreground text-xs font-medium")}>
							<Show
								when={props.selectedPresets.size > 0}
								fallback={`${props.presets.length} total`}
							>
								{props.selectedPresets.size} selected
							</Show>
						</span>
					</div>

					<div class={cn("flex w-full items-center justify-end gap-2")}>
						<div class="hidden flex-1 items-center gap-2 sm:flex">
							<Button
								variant="secondary"
								size="sm"
								onClick={props.onSelectAll}
								data-testid="export-select-all-button-lg"
								disabled={allSelected()}
							>
								Select All
							</Button>
							<Button
								variant="secondary"
								size="sm"
								onClick={props.onClearSelection}
								data-testid="export-deselect-all-button-lg"
								disabled={props.selectedPresets.size === 0}
							>
								Deselect All
							</Button>
						</div>
						<div class={cn("flex flex-1 items-center gap-2 sm:flex-none")}>
							<Button
								variant="secondary"
								size="sm"
								onClick={handleExportDownload}
								disabled={props.selectedPresets.size === 0 || isExporting()}
								title="Download as JSON file"
								data-testid="export-download-button"
								class="flex-1 sm:flex-initial"
							>
								<Show when={isExporting()} fallback="Download">
									Exporting...
								</Show>
							</Button>
							<Button
								size="sm"
								onClick={handleExportUrl}
								disabled={props.selectedPresets.size === 0 || isExporting()}
								title="Copy as shareable URL"
								data-testid="export-url-button"
								class="flex-1 sm:flex-initial"
							>
								<Show
									when={props.copySuccess}
									fallback={
										<Show when={isExporting()} fallback="Copy URL">
											Exporting...
										</Show>
									}
								>
									<span data-testid="copy-success-message">Copied!</span>
								</Show>
							</Button>
						</div>
					</div>
				</div>
			</div>

			<div class={cn("-mr-1 flex-1 space-y-3 overflow-y-auto pr-1")}>
				<For each={props.presets}>
					{(preset) => (
						<button
							type="button"
							onClick={() => props.onToggleSelection(preset.id)}
							data-testid="export-preset-item"
							data-preset-id={preset.id}
							class="w-full text-left"
						>
							<Card
								class={cn(
									"border-border/60 hover:border-primary/30 cursor-pointer p-4 shadow-sm transition-all",
									props.selectedPresets.has(preset.id) && "border-primary/40 bg-primary/5"
								)}
							>
								<div class={cn("flex items-start justify-between gap-3")}>
									<div class={cn("flex min-w-0 flex-1 items-start")}>
										<button
											type="button"
											class={cn(
												"mt-1 mr-3 flex size-4 shrink-0 items-center justify-center rounded-sm border-2 transition-colors",
												props.selectedPresets.has(preset.id)
													? "border-primary bg-primary text-primary-foreground"
													: "border-border"
											)}
											onClick={(e) => {
												e.stopPropagation();
												props.onToggleSelection(preset.id);
											}}
											data-testid="export-preset-checkbox"
											aria-label={`Select ${preset.name} for export`}
										>
											<Show when={props.selectedPresets.has(preset.id)}>
												<svg
													class={cn("size-2.5")}
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
										</button>
										<div
											class={cn("group w-full text-left")}
											data-testid="export-preset-expand-button"
										>
											<div
												class={cn(
													"text-foreground group-hover:text-primary truncate text-[14px] font-black tracking-tight uppercase transition-colors"
												)}
											>
												{preset.name}
											</div>
											<Show when={preset.description}>
												<div
													class={cn(
														"text-muted-foreground mt-1 truncate text-[11px] leading-tight font-bold"
													)}
												>
													{preset.description}
												</div>
											</Show>
											<div class={cn("mt-2.5 flex items-center gap-2")}>
												<Badge variant="secondary" class={cn("h-4 px-2 text-[8px]! font-black")}>
													{preset.parameters.length} VARS
												</Badge>
												<button
													type="button"
													class={cn(
														"text-muted-foreground/50 hover:text-muted-foreground text-[9px] font-black tracking-widest uppercase transition-colors"
													)}
													onClick={(e) => {
														e.stopPropagation();
														setExpandedPresetId(
															expandedPresetId() === preset.id ? null : preset.id
														);
													}}
													data-testid="export-preset-expand-button"
												>
													{expandedPresetId() === preset.id ? "Hide" : "View"}
												</button>
											</div>
										</div>
									</div>
								</div>

								{/* Expanded parameter list */}
								<Show when={expandedPresetId() === preset.id}>
									<div class={cn("mt-4")} data-testid="export-preset-expanded-params">
										<Separator class={cn("mb-4 opacity-50")} />
										<div class={cn("space-y-2")}>
											<For each={preset.parameters}>
												{(param) => (
													<div
														class={cn(
															"border-border/40 bg-muted/40 flex items-center justify-between rounded-lg border px-3 py-2 text-[11px] shadow-sm"
														)}
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
						</button>
					)}
				</For>
			</div>
		</div>
	);
};
