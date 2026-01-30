/**
 * RepositoryImportEmptyStates - Various empty and error states
 */
import type { Accessor, Component } from "solid-js";
import { For, Show, createSignal } from "solid-js";

import type { FetchResult } from "@/logic/repository/types";
import { PRESET_SCHEMA_DESCRIPTION, PRESET_SCHEMA_EXAMPLE } from "@/logic/repository/types";
import { cn } from "@/utils/cn";

import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Separator } from "../ui/Separator";

interface NoSourcesStateProps {
	onCancel: () => void;
}

export const NoSourcesState: Component<NoSourcesStateProps> = (props) => (
	<Card
		class={cn(
			"flex flex-1 flex-col items-center justify-center gap-4 border-dashed py-12 text-center"
		)}
		data-testid="no-sources-message"
	>
		<svg
			class={cn("text-muted-foreground/40 size-10")}
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			aria-hidden="true"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="1.5"
				d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
			/>
		</svg>
		<div>
			<p class={cn("text-muted-foreground text-[10px] font-black tracking-widest uppercase")}>
				No repository sources configured
			</p>
			<p class={cn("text-muted-foreground/70 mt-1 text-[10px]")}>
				Configure sources in Settings → Repository Sources
			</p>
		</div>
		<Button variant="outline" size="sm" onClick={props.onCancel}>
			Back to Presets
		</Button>
	</Card>
);

interface ErrorStateProps {
	error: string;
}

export const ErrorState: Component<ErrorStateProps> = (props) => (
	<div
		class={cn(
			"border-destructive/30 bg-destructive/10 text-destructive mb-4 rounded-lg border p-3 text-[11px]"
		)}
		data-testid="fetch-error"
	>
		{props.error}
	</div>
);

export const FetchPromptState: Component = () => (
	<Card
		class={cn(
			"flex flex-1 flex-col items-center justify-center gap-2 border-dashed py-12 text-center"
		)}
		data-testid="fetch-prompt"
	>
		<svg
			class={cn("text-muted-foreground/40 size-8")}
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			aria-hidden="true"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="1.5"
				d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12"
			/>
		</svg>
		<p class={cn("text-muted-foreground text-[10px] font-black tracking-widest uppercase")}>
			Select a source and fetch
		</p>
		<p class={cn("text-muted-foreground/70 text-[10px]")}>
			Presets will be loaded from the repository
		</p>
	</Card>
);

export const LoadingState: Component = () => (
	<Card
		class={cn(
			"flex flex-1 flex-col items-center justify-center gap-2 border-dashed py-12 text-center"
		)}
		data-testid="loading-state"
	>
		<svg
			class={cn("text-muted-foreground/40 size-8 animate-spin")}
			fill="none"
			viewBox="0 0 24 24"
			aria-hidden="true"
		>
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
			<path
				class="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
			/>
		</svg>
		<p class={cn("text-muted-foreground text-[10px] font-black tracking-widest uppercase")}>
			Fetching presets...
		</p>
	</Card>
);

export const NoFilesFoundState: Component = () => (
	<Card
		class={cn(
			"flex flex-1 flex-col items-center justify-center gap-2 border-dashed py-12 text-center"
		)}
		data-testid="no-files-found"
	>
		<svg
			class={cn("text-muted-foreground/40 size-8")}
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			aria-hidden="true"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="1.5"
				d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
			/>
		</svg>
		<p class={cn("text-muted-foreground text-[10px] font-black tracking-widest uppercase")}>
			No preset files found
		</p>
		<p class={cn("text-muted-foreground/70 text-[10px]")}>
			Check that the repository contains JSON preset files
		</p>
	</Card>
);

interface InvalidFilesStateProps {
	fetchResult: Accessor<FetchResult | null>;
}

export const InvalidFilesState: Component<InvalidFilesStateProps> = (props) => {
	const [showSchemaInfo, setShowSchemaInfo] = createSignal(false);

	return (
		<div class={cn("flex flex-1 flex-col space-y-3 overflow-hidden")}>
			<Card class={cn("flex-1 overflow-y-auto p-4")} data-testid="no-valid-files-message">
				<div class={cn("mb-3 flex items-center gap-2")}>
					<svg
						class={cn("text-muted-foreground/70 size-4")}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
					<span class={cn("text-foreground text-[11px] font-black uppercase")}>
						No valid preset files found
					</span>
				</div>

				<div
					class={cn("text-muted-foreground mb-3 text-[10px] leading-relaxed whitespace-pre-wrap")}
					data-testid="schema-description"
				>
					{PRESET_SCHEMA_DESCRIPTION}
				</div>

				<button
					type="button"
					class={cn(
						"text-muted-foreground/70 hover:text-foreground mb-2 flex w-full items-center justify-between text-[9px] font-black uppercase transition-colors"
					)}
					onClick={() => setShowSchemaInfo(!showSchemaInfo())}
					data-testid="toggle-example-button"
				>
					<span>Example JSON</span>
					<span>{showSchemaInfo() ? "▲" : "▼"}</span>
				</button>

				<Show when={showSchemaInfo()}>
					<pre
						class={cn(
							"border-border/40 bg-background/60 mb-3 overflow-auto rounded-lg border p-2 text-[9px] leading-relaxed"
						)}
						data-testid="schema-example"
					>
						{PRESET_SCHEMA_EXAMPLE}
					</pre>
				</Show>

				{/* List invalid files with errors */}
				<Show when={props.fetchResult()?.files && props.fetchResult()!.files.length > 0}>
					<Separator class={cn("mb-3 opacity-50")} />
					<span class={cn("text-muted-foreground/70 mb-2 block text-[9px] font-black uppercase")}>
						Files with validation errors:
					</span>
					<div class={cn("space-y-1.5")}>
						<For each={props.fetchResult()?.files.filter((f) => !f.isValid)}>
							{(file) => (
								<div
									class={cn("border-destructive/20 bg-destructive/5 rounded-lg border p-2")}
									data-testid="invalid-file-item"
								>
									<div class={cn("text-foreground truncate text-[10px] font-bold")}>
										{file.filename}
									</div>
									<div class={cn("text-destructive mt-0.5 text-[9px]")}>{file.error}</div>
								</div>
							)}
						</For>
					</div>
				</Show>
			</Card>
		</div>
	);
};
