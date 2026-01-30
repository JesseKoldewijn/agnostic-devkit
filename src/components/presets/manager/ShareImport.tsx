/**
 * Share import modal component for importing presets from shared URLs
 */
import type { Component } from "solid-js";
import { For, Show, createSignal } from "solid-js";

import type { Preset } from "@/logic/parameters";
import { getParameterTypeIcon } from "@/logic/parameters";
import { cn } from "@/utils/cn";
import type { DecompressResult } from "@/utils/presetCoder";

import { Badge } from "../../ui/Badge";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { Separator } from "../../ui/Separator";

export interface ShareImportProps {
	shareImportData: DecompressResult | null;
	shareImportError: string | null;
	expandedPresetId: string | null;
	onToggleExpanded: (presetId: string) => void;
	onConfirm: () => void;
	onCancel: () => void;
}

export const ShareImport: Component<ShareImportProps> = (props) => {
	const [importSelections, setImportSelections] = createSignal<Set<string>>(new Set());

	const getPresets = (): Preset[] => {
		if (!props.shareImportData) return [];
		// DecompressResult has result: Preset[]
		return props.shareImportData.result;
	};

	const toggleSelection = (presetId: string) => {
		setImportSelections((prev) => {
			const next = new Set(prev);
			if (next.has(presetId)) {
				next.delete(presetId);
			} else {
				next.add(presetId);
			}
			return next;
		});
	};

	const selectAll = () => {
		const presets = getPresets();
		setImportSelections(new Set(presets.map((p: Preset) => p.id)));
	};

	const deselectAll = () => {
		setImportSelections(new Set<string>());
	};

	// Initialize all selected
	const presets = getPresets();
	if (presets.length > 0 && importSelections().size === 0) {
		selectAll();
	}

	return (
		<div class={cn("flex h-full flex-col")} data-testid="share-import-modal">
			<div class={cn("mb-4 flex flex-col space-y-4")}>
				<div class={cn("flex items-center justify-between")}>
					<h2
						class={cn(
							"text-foreground text-[10px] font-black tracking-[0.2em] uppercase opacity-70"
						)}
						data-testid="share-import-heading"
					>
						Import Shared Presets
					</h2>
					<Button
						variant="ghost"
						size="xs"
						onClick={props.onCancel}
						data-testid="cancel-share-import-button"
						aria-label="Cancel share import"
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

				<Show when={props.shareImportError}>
					<Card
						class={cn("border-destructive/50 bg-destructive/10 p-3")}
						data-testid="share-import-error"
					>
						<p class={cn("text-destructive text-[11px] font-bold")}>{props.shareImportError}</p>
					</Card>
				</Show>

				<Show when={props.shareImportData && !props.shareImportError}>
					<div
						class={cn(
							"border-border/50 bg-muted/30 flex items-center justify-between gap-3 rounded-xl border p-3"
						)}
					>
						<div class={cn("flex gap-2")}>
							<Button
								variant="secondary"
								size="sm"
								onClick={importSelections().size === presets.length ? deselectAll : selectAll}
								data-testid="share-import-select-all-button"
							>
								{importSelections().size === presets.length ? "Deselect All" : "Select All"}
							</Button>
						</div>
						<Button
							size="sm"
							onClick={props.onConfirm}
							disabled={importSelections().size === 0}
							data-testid="share-import-confirm"
						>
							Import ({importSelections().size})
						</Button>
					</div>
				</Show>
			</div>

			<Show when={props.shareImportData && !props.shareImportError}>
				<div class={cn("-mr-1 flex-1 space-y-3 overflow-y-auto pr-1")}>
					<For each={getPresets()}>
						{(preset) => (
							<Card
								class={cn(
									"border-border/60 p-4 shadow-sm transition-all",
									importSelections().has(preset.id) && "border-primary/40 bg-primary/5"
								)}
								data-testid="share-import-preset-item"
							>
								<div class={cn("flex items-start gap-3")}>
									<input
										type="checkbox"
										checked={importSelections().has(preset.id)}
										onChange={() => toggleSelection(preset.id)}
										class={cn("mt-1")}
										data-testid="share-import-preset-checkbox"
									/>
									<button
										type="button"
										class={cn("group min-w-0 flex-1 text-left")}
										onClick={() => props.onToggleExpanded(preset.id)}
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
											<span
												class={cn(
													"text-muted-foreground/50 text-[9px] font-black tracking-widest uppercase"
												)}
											>
												{props.expandedPresetId === preset.id ? "Hide" : "View"}
											</span>
										</div>
									</button>
								</div>

								<Show when={props.expandedPresetId === preset.id}>
									<div class={cn("mt-4")}>
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
						)}
					</For>
				</div>
			</Show>
		</div>
	);
};
