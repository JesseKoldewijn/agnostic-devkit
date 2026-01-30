/**
 * RepositoryImportSourceSelector - Source dropdown, fetch button, and import controls
 */
import type { Accessor, Component } from "solid-js";
import { For, Show } from "solid-js";

import { cn } from "@/utils/cn";

import { Button } from "../ui/Button";
import { Select } from "../ui/Select";
import type { SourceWithProvider } from "./types";

interface RepositoryImportSourceSelectorProps {
	sources: Accessor<SourceWithProvider[]>;
	selectedSourceId: Accessor<string>;
	onSourceChange: (id: string) => void;
	isLoading: Accessor<boolean>;
	onFetch: () => void;
	// Import controls (shown when we have valid presets)
	showImportControls: Accessor<boolean>;
	selectedCount: Accessor<number>;
	totalCount: Accessor<number>;
	onSelectAll: () => void;
	onClearSelection: () => void;
	onImport: () => void;
}

export const RepositoryImportSourceSelector: Component<RepositoryImportSourceSelectorProps> = (
	props
) => {
	return (
		<div class={cn("border-border/50 bg-muted/30 flex flex-col gap-3 rounded-xl border p-3")}>
			{/* Source dropdown + Fetch button */}
			<div class={cn("flex items-center gap-2")}>
				<Select
					value={props.selectedSourceId()}
					onChange={(e) => props.onSourceChange(e.target.value)}
					containerClass="flex-1"
					class={cn("text-[11px]")}
					data-testid="source-select"
				>
					<For each={props.sources()}>
						{(s) => <option value={s.source.id}>{s.source.name}</option>}
					</For>
				</Select>
				<Button
					variant="secondary"
					size="sm"
					onClick={props.onFetch}
					disabled={props.isLoading() || !props.selectedSourceId()}
					data-testid="fetch-button"
					class="h-10 rounded-xl"
				>
					<Show
						when={!props.isLoading()}
						fallback={
							<svg
								class={cn("size-3.5 animate-spin")}
								fill="none"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								/>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								/>
							</svg>
						}
					>
						<svg
							class={cn("size-3.5 opacity-70")}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
							/>
						</svg>
					</Show>
					<span class={cn("ml-1")}>{props.isLoading() ? "Fetching..." : "Fetch"}</span>
				</Button>
			</div>

			{/* Selection controls - only show when we have presets */}
			<Show when={props.showImportControls()}>
				<div class={cn("flex items-center justify-between gap-1")}>
					<div class={cn("flex shrink-0 gap-1")}>
						<Button
							variant="ghost"
							size="xs"
							onClick={props.onSelectAll}
							data-testid="select-all-button"
						>
							All
						</Button>
						<Button
							variant="ghost"
							size="xs"
							onClick={props.onClearSelection}
							disabled={props.selectedCount() === 0}
							data-testid="deselect-all-button"
						>
							None
						</Button>
					</div>
					<span class={cn("text-muted-foreground shrink-0 text-[10px] whitespace-nowrap")}>
						{props.selectedCount()}/{props.totalCount()} selected
					</span>
				</div>

				{/* Import button */}
				<Button
					variant="secondary"
					size="sm"
					onClick={props.onImport}
					disabled={props.selectedCount() === 0}
					data-testid="import-confirm"
					class="w-full"
				>
					<svg
						class={cn("size-3.5 opacity-70")}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12"
						/>
					</svg>
					<span class={cn("ml-1")}>
						Import {props.selectedCount() > 0 ? props.selectedCount() : ""} Preset
						{props.selectedCount() !== 1 ? "s" : ""}
					</span>
				</Button>
			</Show>
		</div>
	);
};
