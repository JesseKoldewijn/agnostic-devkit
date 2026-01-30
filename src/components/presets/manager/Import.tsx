/**
 * File import view component for importing presets from files
 */
import type { Component } from "solid-js";
import { createSignal } from "solid-js";

import { cn } from "@/utils/cn";

import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { Input } from "../../ui/Input";
import { Separator } from "../../ui/Separator";

export interface ImportProps {
	onCancel: () => void;
	onImport: (e: Event) => void;
	onStartRepositoryImport: () => void;
	onLoadShareUrl: (url: string) => void;
}

export const Import: Component<ImportProps> = (props) => {
	let fileInputRef: HTMLInputElement | undefined;
	const [shareUrlInput, setShareUrlInput] = createSignal("");

	return (
		<div class={cn("flex h-full flex-col")} data-testid="file-import-view">
			<div class={cn("mb-4 flex flex-col space-y-4")}>
				<div class={cn("flex items-center justify-between")}>
					<h2
						class={cn(
							"text-foreground text-[10px] font-black tracking-[0.2em] uppercase opacity-70"
						)}
						data-testid="import-presets-heading"
					>
						Import Presets
					</h2>
					<Button
						variant="ghost"
						size="xs"
						onClick={props.onCancel}
						data-testid="import-back-button"
						aria-label="Cancel import"
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
			</div>

			<div class={cn("-mr-1 flex-1 space-y-4 overflow-y-auto pr-1")}>
				{/* File Import Option */}
				<Card
					class={cn(
						"border-border/60 hover:border-primary/40 hover:bg-primary/5 cursor-pointer p-6 shadow-sm transition-all"
					)}
					onClick={() => fileInputRef?.click()}
					data-testid="file-import-card"
				>
					<div class={cn("flex flex-col items-center text-center")}>
						<div
							class={cn("bg-primary/10 mb-4 flex size-12 items-center justify-center rounded-full")}
						>
							<svg
								class={cn("text-primary size-6")}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
						</div>
						<h3 class={cn("text-foreground mb-2 text-[13px] font-black tracking-tight uppercase")}>
							Import from File
						</h3>
						<p class={cn("text-muted-foreground mb-4 text-[11px] font-bold")}>
							Select a JSON file containing exported presets
						</p>
						<Button variant="outline" size="sm" data-testid="select-file-button">
							<svg
								class={cn("mr-2 size-4")}
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
							Select File
						</Button>
						<input
							ref={fileInputRef}
							type="file"
							accept=".json"
							onChange={props.onImport}
							class={cn("hidden")}
							data-testid="import-file-input"
						/>
					</div>
				</Card>

				<div class={cn("flex items-center gap-3")}>
					<Separator class={cn("flex-1 opacity-30")} />
					<span class={cn("text-muted-foreground text-[9px] font-black tracking-widest uppercase")}>
						Or
					</span>
					<Separator class={cn("flex-1 opacity-30")} />
				</div>

				{/* Repository Import Option */}
				<Card
					class={cn(
						"border-border/60 hover:border-primary/40 hover:bg-primary/5 cursor-pointer p-6 shadow-sm transition-all"
					)}
					onClick={props.onStartRepositoryImport}
					data-testid="repository-import-card"
				>
					<div class={cn("flex flex-col items-center text-center")}>
						<div
							class={cn("bg-primary/10 mb-4 flex size-12 items-center justify-center rounded-full")}
						>
							<svg
								class={cn("text-primary size-6")}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
								/>
							</svg>
						</div>
						<h3 class={cn("text-foreground mb-2 text-[13px] font-black tracking-tight uppercase")}>
							Import from Repository
						</h3>
						<p class={cn("text-muted-foreground mb-4 text-[11px] font-bold")}>
							Browse and import presets from the online repository
						</p>
						<Button variant="outline" size="sm" data-testid="import-from-repo-button">
							<svg
								class={cn("mr-2 size-4")}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
								/>
							</svg>
							Browse Repositories
						</Button>
					</div>
				</Card>

				<div class={cn("flex items-center gap-3")}>
					<Separator class={cn("flex-1 opacity-30")} />
					<span class={cn("text-muted-foreground text-[9px] font-black tracking-widest uppercase")}>
						Or
					</span>
					<Separator class={cn("flex-1 opacity-30")} />
				</div>

				{/* Share URL Import Option */}
				<Card
					class={cn("border-border/60 p-6 shadow-sm transition-all")}
					data-testid="share-url-import-card"
				>
					<div class={cn("flex flex-col items-center text-center")}>
						<div
							class={cn("bg-primary/10 mb-4 flex size-12 items-center justify-center rounded-full")}
						>
							<svg
								class={cn("text-primary size-6")}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
								/>
							</svg>
						</div>
						<h3 class={cn("text-foreground mb-2 text-[13px] font-black tracking-tight uppercase")}>
							Import from Share URL
						</h3>
						<p class={cn("text-muted-foreground mb-4 text-[11px] font-bold")}>
							Paste a share URL to import presets shared by others
						</p>
						<div class={cn("flex w-full gap-2")}>
							<Input
								type="text"
								value={shareUrlInput()}
								onInput={(e) => setShareUrlInput(e.currentTarget.value)}
								placeholder="Paste share URL here..."
								class={cn("h-9 flex-1 text-[11px]")}
								containerClass={cn("flex-1")}
								data-testid="share-url-input"
								onKeyDown={(e) => {
									if (e.key === "Enter" && shareUrlInput().trim()) {
										props.onLoadShareUrl(shareUrlInput().trim());
									}
								}}
							/>
							<Button
								variant="outline"
								size="sm"
								onClick={() => props.onLoadShareUrl(shareUrlInput().trim())}
								disabled={!shareUrlInput().trim()}
								data-testid="share-url-load-button"
							>
								<svg
									class={cn("mr-1 size-4")}
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
								Load
							</Button>
						</div>
					</div>
				</Card>
			</div>
		</div>
	);
};
