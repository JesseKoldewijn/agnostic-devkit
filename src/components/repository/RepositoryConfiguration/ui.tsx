/**
 * RepositoryConfiguration UI component
 * Pure presentational component for managing provider instances and repository sources
 */
import type { Component } from "solid-js";
import { For, Show } from "solid-js";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Separator } from "@/components/ui/Separator";
import { PRESET_SCHEMA_DESCRIPTION, PRESET_SCHEMA_EXAMPLE } from "@/logic/repository";
import { cn } from "@/utils/cn";

import type { RepositoryConfigurationLogic } from "./logic";

// Icons
const PlusIcon = () => (
	<svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
	</svg>
);

const TrashIcon = () => (
	<svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
			d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
		/>
	</svg>
);

const EditIcon = () => (
	<svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
			d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
		/>
	</svg>
);

const InfoIcon = () => (
	<svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
			d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
		/>
	</svg>
);

const EyeIcon = () => (
	<svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
			d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
		/>
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
			d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
		/>
	</svg>
);

const EyeOffIcon = () => (
	<svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
			d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
		/>
	</svg>
);

export const RepositoryConfigurationUI: Component<RepositoryConfigurationLogic> = (props) => {
	return (
		<>
			<Card class={cn("md:col-span-2")} data-testid="repository-configuration-section">
				<CardHeader>
					<div class={cn("flex items-start justify-between")}>
						<div>
							<CardTitle>Repository Sources</CardTitle>
							<CardDescription>
								Import presets from GitHub repositories, Gists, or URLs
							</CardDescription>
						</div>
						<Button
							variant="ghost"
							size="xs"
							onClick={props.onOpenSchemaInfo}
							title="View preset file format"
							data-testid="schema-info-button"
						>
							<InfoIcon />
						</Button>
					</div>
				</CardHeader>
				<CardContent class={cn("space-y-6")}>
					{/* Provider Instances Section */}
					<div class={cn("space-y-3")}>
						<div class={cn("flex items-center justify-between")}>
							<Label class={cn("mb-0! ml-0! text-[11px] font-black tracking-widest uppercase")}>
								GitHub Instances
							</Label>
							<Button
								variant="ghost"
								size="xs"
								onClick={props.onOpenAddProvider}
								data-testid="add-provider-button"
							>
								<PlusIcon />
								<span class={cn("ml-1 text-[10px]")}>Add</span>
							</Button>
						</div>

						<Show
							when={props.providerInstances().length > 0}
							fallback={
								<div
									class={cn(
										"border-border/50 bg-muted/30 rounded-xl border-2 border-dashed p-4 text-center"
									)}
									data-testid="no-providers-message"
								>
									<p class={cn("text-muted-foreground text-[11px]")}>
										No GitHub instances configured.
									</p>
									<p class={cn("text-muted-foreground/70 mt-1 text-[10px]")}>
										Add a GitHub instance to access private repositories.
									</p>
								</div>
							}
						>
							<div class={cn("space-y-2")}>
								<For each={props.providerInstances()}>
									{(instance) => (
										<div
											class={cn(
												"border-border/50 bg-muted/30 flex items-center justify-between rounded-xl border p-3"
											)}
											data-testid="provider-instance-item"
										>
											<div class={cn("min-w-0 flex-1")}>
												<p class={cn("text-foreground truncate text-[12px] font-black")}>
													{instance.name}
												</p>
												<p class={cn("text-muted-foreground truncate text-[10px]")}>
													{instance.baseUrl}
													{instance.token && " • Token configured"}
												</p>
											</div>
											<div class={cn("flex gap-1")}>
												<Button
													variant="ghost"
													size="xs"
													onClick={() => props.onOpenEditProvider(instance)}
													aria-label={`Edit ${instance.name}`}
													data-testid="edit-provider-button"
												>
													<EditIcon />
												</Button>
												<Button
													variant="ghost"
													size="xs"
													onClick={() => props.onDeleteProvider(instance.id)}
													aria-label={`Delete ${instance.name}`}
													data-testid="delete-provider-button"
												>
													<TrashIcon />
												</Button>
											</div>
										</div>
									)}
								</For>
							</div>
						</Show>
					</div>

					<Separator class={cn("opacity-50")} />

					{/* Repository Sources Section */}
					<div class={cn("space-y-3")}>
						<div class={cn("flex items-center justify-between")}>
							<Label class={cn("mb-0! ml-0! text-[11px] font-black tracking-widest uppercase")}>
								Preset Sources
							</Label>
							<Button
								variant="ghost"
								size="xs"
								onClick={props.onOpenAddSource}
								data-testid="add-source-button"
							>
								<PlusIcon />
								<span class={cn("ml-1 text-[10px]")}>Add</span>
							</Button>
						</div>

						<Show
							when={props.repositorySources().length > 0}
							fallback={
								<div
									class={cn(
										"border-border/50 bg-muted/30 rounded-xl border-2 border-dashed p-4 text-center"
									)}
									data-testid="no-sources-message"
								>
									<p class={cn("text-muted-foreground text-[11px]")}>
										No preset sources configured.
									</p>
									<p class={cn("text-muted-foreground/70 mt-1 text-[10px]")}>
										Add a repository, Gist, or URL to import presets from.
									</p>
								</div>
							}
						>
							<div class={cn("space-y-2")}>
								<For each={props.repositorySources()}>
									{(source) => {
										const provider = props
											.providerInstances()
											.find((p) => p.id === source.providerInstanceId);
										return (
											<div
												class={cn(
													"border-border/50 bg-muted/30 flex items-center justify-between rounded-xl border p-3"
												)}
												data-testid="repository-source-item"
											>
												<div class={cn("min-w-0 flex-1")}>
													<p class={cn("text-foreground truncate text-[12px] font-black")}>
														{source.name}
													</p>
													<p class={cn("text-muted-foreground truncate text-[10px]")}>
														{source.url}
													</p>
													<Show when={provider}>
														<p class={cn("text-muted-foreground/70 mt-0.5 text-[9px]")}>
															via {provider?.name}
														</p>
													</Show>
												</div>
												<div class={cn("flex gap-1")}>
													<Button
														variant="ghost"
														size="xs"
														onClick={() => props.onOpenEditSource(source)}
														aria-label={`Edit ${source.name}`}
														data-testid="edit-source-button"
													>
														<EditIcon />
													</Button>
													<Button
														variant="ghost"
														size="xs"
														onClick={() => props.onDeleteSource(source.id)}
														aria-label={`Delete ${source.name}`}
														data-testid="delete-source-button"
													>
														<TrashIcon />
													</Button>
												</div>
											</div>
										);
									}}
								</For>
							</div>
						</Show>
					</div>
				</CardContent>
			</Card>

			{/* Provider Modal */}
			<Modal
				open={props.showProviderModal()}
				onClose={props.onCloseProviderModal}
				title={`${props.editingProvider() ? "Edit" : "Add"} GitHub Instance`}
				data-testid="provider-modal"
			>
				<div class={cn("space-y-4")}>
					<Input
						label="Display Name"
						placeholder="e.g., Company GitHub"
						value={props.providerName()}
						onInput={(e) => props.onProviderNameChange(e.currentTarget.value)}
						data-testid="provider-name-input"
					/>

					<Input
						label="Domain"
						placeholder="e.g., github.com or git.company.com"
						value={props.providerBaseUrl()}
						onInput={(e) => props.onProviderBaseUrlChange(e.currentTarget.value)}
						data-testid="provider-baseurl-input"
					/>

					<div class={cn("space-y-2")}>
						<Label>Personal Access Token (optional)</Label>
						<div class={cn("flex gap-2")}>
							<Input
								type={props.showToken() ? "text" : "password"}
								placeholder="github_pat_xxxxxxxxxxxx"
								value={props.providerToken()}
								onInput={(e) => props.onProviderTokenChange(e.currentTarget.value)}
								containerClass={cn("flex-1")}
								data-testid="provider-token-input"
							/>
							<Button
								variant="ghost"
								size="sm"
								onClick={props.onToggleShowToken}
								title={props.showToken() ? "Hide token" : "Show token"}
							>
								<Show when={props.showToken()} fallback={<EyeIcon />}>
									<EyeOffIcon />
								</Show>
							</Button>
						</div>
						<Show
							when={props.providerTokenError()}
							fallback={
								<p class={cn("text-muted-foreground/70 text-[10px]")}>
									Required for private repositories. Use a fine-grained PAT from GitHub → Settings →
									Developer settings → Personal access tokens → Fine-grained tokens
								</p>
							}
						>
							<p class={cn("text-destructive text-[10px] font-medium")}>
								{props.providerTokenError()}
							</p>
						</Show>
					</div>
				</div>

				<div class={cn("flex justify-end gap-3 pt-2")}>
					<Button variant="ghost" size="sm" onClick={props.onCloseProviderModal}>
						Cancel
					</Button>
					<Button
						variant="secondary"
						size="sm"
						onClick={props.onSaveProvider}
						disabled={!props.providerName().trim() || !props.providerBaseUrl().trim()}
						data-testid="save-provider-button"
					>
						{props.editingProvider() ? "Save" : "Add"}
					</Button>
				</div>
			</Modal>

			{/* Source Modal */}
			<Modal
				open={props.showSourceModal()}
				onClose={props.onCloseSourceModal}
				title={`${props.editingSource() ? "Edit" : "Add"} Preset Source`}
				data-testid="source-modal"
			>
				<div class={cn("space-y-4")}>
					<Input
						label="Display Name"
						placeholder="e.g., My Development Presets"
						value={props.sourceName()}
						onInput={(e) => props.onSourceNameChange(e.currentTarget.value)}
						data-testid="source-name-input"
					/>

					<Select
						label="Source Type"
						value={props.sourceType()}
						onChange={(e) => props.onSourceTypeChange(e.currentTarget.value as "github" | "url")}
						data-testid="source-type-select"
					>
						<option value="github">GitHub Repository / Gist</option>
						<option value="url">Direct JSON URL</option>
					</Select>

					<Input
						label="URL"
						placeholder={
							props.sourceType() === "github"
								? "e.g., https://github.com/user/repo or gist URL"
								: "e.g., https://example.com/presets.json"
						}
						value={props.sourceUrl()}
						onInput={(e) => props.onSourceUrlChange(e.currentTarget.value)}
						data-testid="source-url-input"
					/>

					<Show when={props.sourceType() === "github"}>
						<Select
							label="GitHub Instance (optional)"
							value={props.sourceProviderId()}
							onChange={(e) => props.onSourceProviderChange(e.currentTarget.value)}
							data-testid="source-provider-select"
						>
							<option value="">Public (no authentication)</option>
							<For each={props.providerInstances()}>
								{(instance) => (
									<option value={instance.id}>
										{instance.name} ({instance.baseUrl})
									</option>
								)}
							</For>
						</Select>
						<Show when={props.providerInstances().length === 0}>
							<p class={cn("text-muted-foreground/70 -mt-2 text-[10px]")}>
								Add a GitHub instance above to access private repositories.
							</p>
						</Show>
					</Show>
				</div>

				<div class={cn("flex justify-end gap-3 pt-2")}>
					<Button variant="ghost" size="sm" onClick={props.onCloseSourceModal}>
						Cancel
					</Button>
					<Button
						variant="secondary"
						size="sm"
						onClick={props.onSaveSource}
						disabled={!props.sourceName().trim() || !props.sourceUrl().trim()}
						data-testid="save-source-button"
					>
						{props.editingSource() ? "Save" : "Add"}
					</Button>
				</div>
			</Modal>

			{/* Schema Info Modal */}
			<Modal
				open={props.showSchemaInfo()}
				onClose={props.onCloseSchemaInfo}
				title="Preset File Format"
				size="lg"
				class={cn("flex max-h-[80vh] flex-col")}
				data-testid="schema-info-modal"
			>
				<div class={cn("flex-1 space-y-4 overflow-y-auto")}>
					<div class={cn("text-foreground/80 text-[12px] leading-relaxed whitespace-pre-wrap")}>
						{PRESET_SCHEMA_DESCRIPTION}
					</div>

					<Separator class={cn("opacity-50")} />

					<div>
						<p class={cn("text-foreground mb-2 text-[11px] font-black tracking-widest uppercase")}>
							Example
						</p>
						<pre
							class={cn(
								"bg-muted/50 border-border/50 overflow-x-auto rounded-xl border p-4 text-[11px]"
							)}
						>
							<code>{PRESET_SCHEMA_EXAMPLE}</code>
						</pre>
					</div>
				</div>

				<div class={cn("flex justify-end pt-2")}>
					<Button variant="secondary" size="sm" onClick={props.onCloseSchemaInfo}>
						Got it
					</Button>
				</div>
			</Modal>
		</>
	);
};
