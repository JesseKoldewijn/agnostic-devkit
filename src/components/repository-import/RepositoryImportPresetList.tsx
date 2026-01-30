/**
 * RepositoryImportPresetList - List of presets with checkboxes
 */
import type { Accessor, Component } from "solid-js";
import { For, Show } from "solid-js";

import { cn } from "@/utils/cn";

import { Badge } from "../ui/Badge";
import { Separator } from "../ui/Separator";
import type { PresetWithMeta } from "./types";

// Helper to get parameter type icon
const getParameterTypeIcon = (type: string) => {
	switch (type) {
		case "queryParam":
			return "?";
		case "cookie":
			return "🍪";
		case "localStorage":
			return "📦";
		default:
			return "•";
	}
};

interface RepositoryImportPresetListProps {
	presets: Accessor<PresetWithMeta[]>;
	selectedPresets: Accessor<Set<string>>;
	expandedPresetId: Accessor<string | null>;
	onTogglePreset: (presetKey: string) => void;
	onToggleExpanded: (presetKey: string) => void;
}

export const RepositoryImportPresetList: Component<RepositoryImportPresetListProps> = (props) => {
	return (
		<div class={cn("-mr-1 flex-1 space-y-2 overflow-y-auto pr-1")} data-testid="presets-list">
			<For each={props.presets()}>
				{({ preset, filename, presetKey }) => (
					<div
						role="button"
						tabIndex={0}
						class={cn(
							"flex w-full cursor-pointer items-start gap-3 rounded-lg border p-3 text-left transition-all",
							props.selectedPresets().has(presetKey)
								? "border-primary/50 bg-primary/5"
								: "border-border/60 hover:border-primary/30"
						)}
						onClick={() => props.onTogglePreset(presetKey)}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								props.onTogglePreset(presetKey);
							}
						}}
						data-testid="preset-item"
						data-preset-key={presetKey}
					>
						{/* Checkbox */}
						<div
							class={cn(
								"mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border-2 transition-colors",
								props.selectedPresets().has(presetKey)
									? "border-primary bg-primary text-primary-foreground"
									: "border-border"
							)}
							data-testid="preset-checkbox"
						>
							<Show when={props.selectedPresets().has(presetKey)}>
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
						</div>

						{/* Preset info */}
						<div class={cn("min-w-0 flex-1")}>
							<div class={cn("flex items-start justify-between gap-2")}>
								<div
									class={cn(
										"text-foreground truncate text-[12px] font-black tracking-tight uppercase"
									)}
								>
									{preset.name}
								</div>
								<Badge
									variant="outline"
									class={cn("text-muted-foreground/60 h-4 shrink-0 px-1.5 text-[7px] font-medium")}
								>
									{filename}
								</Badge>
							</div>
							<Show when={preset.description}>
								<div class={cn("text-muted-foreground mt-0.5 line-clamp-1 text-[10px]")}>
									{preset.description}
								</div>
							</Show>
							<div class={cn("mt-1.5 flex items-center gap-2")}>
								<Badge variant="secondary" class={cn("h-4 shrink-0 px-1.5 text-[8px]! font-black")}>
									{preset.parameters.length} VARS
								</Badge>
								<button
									type="button"
									class={cn(
										"text-muted-foreground/50 hover:text-foreground text-[8px] font-black uppercase transition-colors"
									)}
									onClick={(e) => {
										e.stopPropagation();
										props.onToggleExpanded(presetKey);
									}}
									data-testid="preset-expand-toggle"
								>
									{props.expandedPresetId() === presetKey ? "Hide" : "View"}
								</button>
							</div>

							{/* Expanded parameter list */}
							<Show when={props.expandedPresetId() === presetKey}>
								<div class={cn("mt-2")} data-testid="preset-params">
									<Separator class={cn("mb-2 opacity-50")} />
									<div class={cn("space-y-1")}>
										<For each={preset.parameters}>
											{(param) => (
												<div
													class={cn(
														"border-border/40 bg-muted/40 flex items-center justify-between rounded px-2 py-1 text-[9px]"
													)}
													data-testid="preset-param"
												>
													<div class={cn("flex min-w-0 flex-1 items-center")}>
														<span class={cn("mr-1 scale-90 opacity-60")}>
															{getParameterTypeIcon(param.type)}
														</span>
														<span
															class={cn(
																"text-foreground truncate font-bold tracking-tight uppercase"
															)}
														>
															{param.key}
														</span>
													</div>
													<span
														class={cn(
															"border-border/20 bg-background/60 text-muted-foreground/90 ml-2 max-w-[50%] truncate rounded-sm border px-1 py-0.5 font-mono"
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
						</div>
					</div>
				)}
			</For>
		</div>
	);
};
