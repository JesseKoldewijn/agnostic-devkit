/**
 * Header component for the preset manager list view
 */
import type { Component } from "solid-js";
import { Show } from "solid-js";

import { cn } from "@/utils/cn";

import { PlusIcon } from "../../icons/Plus";
import { Button } from "../../ui/Button";

export interface HeaderProps {
	onClose?: () => void;
	onStartCreate: () => void;
	onStartExport: () => void;
	onStartFileImport: () => void;
}

export const Header: Component<HeaderProps> = (props) => {
	return (
		<div class={cn("mb-4 flex flex-col space-y-4")}>
			<div class={cn("flex items-center justify-between")}>
				<h2
					class={cn("text-foreground text-[10px] font-black tracking-[0.2em] uppercase opacity-70")}
					data-testid="manage-presets-heading"
				>
					Manage Presets
				</h2>
				<Show when={props.onClose}>
					<Button
						variant="ghost"
						size="xs"
						onClick={props.onClose}
						data-testid="close-manager-button"
						aria-label="Close preset manager"
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
						<span>Close</span>
					</Button>
				</Show>
			</div>

			<div
				class={cn(
					"border-border/50 bg-muted/30 flex items-center justify-between gap-3 rounded-xl border p-3"
				)}
			>
				<div class={cn("flex gap-2")}>
					<Button
						variant="secondary"
						size="sm"
						onClick={props.onStartExport}
						title="Export presets"
						data-testid="export-presets-button"
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
								d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
							/>
						</svg>
						Export
					</Button>
					<Button
						variant="secondary"
						size="sm"
						onClick={props.onStartFileImport}
						title="Import presets"
						data-testid="import-presets-button"
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
						Import
					</Button>
				</div>
				<Button size="sm" onClick={props.onStartCreate} data-testid="create-preset-button">
					<PlusIcon /> New
				</Button>
			</div>
		</div>
	);
};
