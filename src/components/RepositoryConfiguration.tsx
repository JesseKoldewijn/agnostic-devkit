/**
 * Repository Configuration Component
 * Manages provider instances and repository sources in Settings
 */
import type { Component } from "solid-js";
import { For, Show, createEffect, createSignal, onCleanup, onMount } from "solid-js";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { Separator } from "@/components/ui/Separator";
import {
	PRESET_SCHEMA_DESCRIPTION,
	PRESET_SCHEMA_EXAMPLE,
	type ProviderInstance,
	type RepositorySource,
	type RepositorySourceType,
	addProviderInstance,
	addRepositorySource,
	createProviderInstance,
	createRepositorySource,
	getProviderInstances,
	getRepositorySources,
	onProviderInstancesChanged,
	onRepositorySourcesChanged,
	removeProviderInstance,
	removeRepositorySource,
	updateProviderInstance,
	updateRepositorySource,
} from "@/logic/repository";
import { cn } from "@/utils/cn";

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

const CloseIcon = () => (
	<svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
			d="M6 18L18 6M6 6l12 12"
		/>
	</svg>
);

export const RepositoryConfiguration: Component = () => {
	// State
	const [providerInstances, setProviderInstances] = createSignal<ProviderInstance[]>([]);
	const [repositorySources, setRepositorySources] = createSignal<RepositorySource[]>([]);

	// Modal states
	const [showProviderModal, setShowProviderModal] = createSignal(false);
	const [showSourceModal, setShowSourceModal] = createSignal(false);
	const [showSchemaInfo, setShowSchemaInfo] = createSignal(false);
	const [editingProvider, setEditingProvider] = createSignal<ProviderInstance | null>(null);
	const [editingSource, setEditingSource] = createSignal<RepositorySource | null>(null);

	// Form states
	const [providerName, setProviderName] = createSignal("");
	const [providerBaseUrl, setProviderBaseUrl] = createSignal("");
	const [providerToken, setProviderToken] = createSignal("");
	const [providerTokenError, setProviderTokenError] = createSignal("");
	const [showToken, setShowToken] = createSignal(false);

	const [sourceName, setSourceName] = createSignal("");
	const [sourceUrl, setSourceUrl] = createSignal("");
	const [sourceProviderId, setSourceProviderId] = createSignal<string>("");
	const [sourceType, setSourceType] = createSignal<RepositorySourceType>("github");

	// Load data on mount
	onMount(async () => {
		const [instances, sources] = await Promise.all([
			getProviderInstances(),
			getRepositorySources(),
		]);
		setProviderInstances(instances);
		setRepositorySources(sources);
	});

	// Subscribe to changes
	createEffect(() => {
		const unsubProviders = onProviderInstancesChanged(setProviderInstances);
		const unsubSources = onRepositorySourcesChanged(setRepositorySources);

		onCleanup(() => {
			unsubProviders();
			unsubSources();
		});
	});

	// Reset provider form
	const resetProviderForm = () => {
		setProviderName("");
		setProviderBaseUrl("");
		setProviderToken("");
		setProviderTokenError("");
		setShowToken(false);
		setEditingProvider(null);
	};

	// Reset source form
	const resetSourceForm = () => {
		setSourceName("");
		setSourceUrl("");
		setSourceProviderId("");
		setSourceType("github");
		setEditingSource(null);
	};

	// Open add provider modal
	const openAddProvider = () => {
		resetProviderForm();
		setShowProviderModal(true);
	};

	// Open edit provider modal
	const openEditProvider = (provider: ProviderInstance) => {
		setEditingProvider(provider);
		setProviderName(provider.name);
		setProviderBaseUrl(provider.baseUrl);
		setProviderToken(provider.token ?? "");
		setShowProviderModal(true);
	};

	// Validate PAT token format
	const validateToken = (token: string): string | null => {
		if (!token) return null;
		// Classic PAT tokens start with ghp_
		if (token.startsWith("ghp_")) {
			return "Classic PAT tokens are not supported. Please use a fine-grained personal access token instead (starts with github_pat_).";
		}
		// GitHub OAuth tokens start with gho_
		if (token.startsWith("gho_")) {
			return "OAuth tokens are not supported. Please use a fine-grained personal access token (starts with github_pat_).";
		}
		// GitHub App tokens start with ghu_ or ghs_
		if (token.startsWith("ghu_") || token.startsWith("ghs_")) {
			return "GitHub App tokens are not supported. Please use a fine-grained personal access token (starts with github_pat_).";
		}
		return null;
	};

	// Save provider
	const handleSaveProvider = async () => {
		const name = providerName().trim();
		const baseUrl = providerBaseUrl()
			.trim()
			.toLowerCase()
			.replace(/^https?:\/\//, "");
		const token = providerToken().trim() || undefined;

		if (!name || !baseUrl) return;

		// Validate token format
		if (token) {
			const tokenError = validateToken(token);
			if (tokenError) {
				setProviderTokenError(tokenError);
				return;
			}
		}
		setProviderTokenError("");

		const editing = editingProvider();
		if (editing) {
			await updateProviderInstance(editing.id, { baseUrl, name, token });
		} else {
			const instance = createProviderInstance("github", name, baseUrl, token);
			await addProviderInstance(instance);
		}

		setShowProviderModal(false);
		resetProviderForm();
	};

	// Delete provider
	const handleDeleteProvider = async (id: string) => {
		await removeProviderInstance(id);
	};

	// Open add source modal
	const openAddSource = () => {
		resetSourceForm();
		setShowSourceModal(true);
	};

	// Open edit source modal
	const openEditSource = (source: RepositorySource) => {
		setEditingSource(source);
		setSourceName(source.name);
		setSourceUrl(source.url);
		setSourceProviderId(source.providerInstanceId ?? "");
		setSourceType(source.type);
		setShowSourceModal(true);
	};

	// Save source
	const handleSaveSource = async () => {
		const name = sourceName().trim();
		const url = sourceUrl().trim();
		const type = sourceType();
		const providerId = type === "github" ? sourceProviderId() || undefined : undefined;

		if (!name || !url) return;

		const editing = editingSource();
		if (editing) {
			await updateRepositorySource(editing.id, {
				name,
				providerInstanceId: providerId,
				type,
				url,
			});
		} else {
			const source = createRepositorySource(name, url, type, providerId);
			await addRepositorySource(source);
		}

		setShowSourceModal(false);
		resetSourceForm();
	};

	// Delete source
	const handleDeleteSource = async (id: string) => {
		await removeRepositorySource(id);
	};

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
							onClick={() => setShowSchemaInfo(true)}
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
								onClick={openAddProvider}
								data-testid="add-provider-button"
							>
								<PlusIcon />
								<span class={cn("ml-1 text-[10px]")}>Add</span>
							</Button>
						</div>

						<Show
							when={providerInstances().length > 0}
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
								<For each={providerInstances()}>
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
													onClick={() => openEditProvider(instance)}
													data-testid="edit-provider-button"
												>
													<EditIcon />
												</Button>
												<Button
													variant="ghost"
													size="xs"
													onClick={() => handleDeleteProvider(instance.id)}
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
								onClick={openAddSource}
								data-testid="add-source-button"
							>
								<PlusIcon />
								<span class={cn("ml-1 text-[10px]")}>Add</span>
							</Button>
						</div>

						<Show
							when={repositorySources().length > 0}
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
								<For each={repositorySources()}>
									{(source) => {
										const provider = providerInstances().find(
											(p) => p.id === source.providerInstanceId
										);
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
														onClick={() => openEditSource(source)}
														data-testid="edit-source-button"
													>
														<EditIcon />
													</Button>
													<Button
														variant="ghost"
														size="xs"
														onClick={() => handleDeleteSource(source.id)}
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
			<Show when={showProviderModal()}>
				<div
					class={cn(
						"bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
					)}
					data-testid="provider-modal"
				>
					<Card class={cn("m-4 w-full max-w-md")}>
						<div class={cn("flex flex-col gap-4 p-6")}>
							<div class={cn("flex items-center justify-between")}>
								<h2
									class={cn("text-foreground text-[13px] font-black tracking-[0.15em] uppercase")}
								>
									{editingProvider() ? "Edit" : "Add"} GitHub Instance
								</h2>
								<Button
									variant="ghost"
									size="xs"
									onClick={() => {
										setShowProviderModal(false);
										resetProviderForm();
									}}
									aria-label="Close"
								>
									<CloseIcon />
								</Button>
							</div>

							<div class={cn("space-y-4")}>
								<Input
									label="Display Name"
									placeholder="e.g., Company GitHub"
									ref={(el) => {
										if (el) {
											const name = providerName();
											queueMicrotask(() => {
												el.value = name;
											});
										}
									}}
									onInput={(e) => setProviderName(e.currentTarget.value)}
									data-testid="provider-name-input"
								/>

								<Input
									label="Domain"
									placeholder="e.g., github.com or git.company.com"
									ref={(el) => {
										if (el) {
											const url = providerBaseUrl();
											queueMicrotask(() => {
												el.value = url;
											});
										}
									}}
									onInput={(e) => setProviderBaseUrl(e.currentTarget.value)}
									data-testid="provider-baseurl-input"
								/>

								<div class={cn("space-y-2")}>
									<Label>Personal Access Token (optional)</Label>
									<div class={cn("flex gap-2")}>
										<Input
											type={showToken() ? "text" : "password"}
											placeholder="github_pat_xxxxxxxxxxxx"
											ref={(el) => {
												if (el) {
													const token = providerToken();
													queueMicrotask(() => {
														el.value = token;
													});
												}
											}}
											onInput={(e) => {
												setProviderToken(e.currentTarget.value);
												setProviderTokenError("");
											}}
											containerClass={cn("flex-1")}
											data-testid="provider-token-input"
										/>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setShowToken(!showToken())}
											title={showToken() ? "Hide token" : "Show token"}
										>
											<Show when={showToken()} fallback={<EyeIcon />}>
												<EyeOffIcon />
											</Show>
										</Button>
									</div>
									<Show
										when={providerTokenError()}
										fallback={
											<p class={cn("text-muted-foreground/70 text-[10px]")}>
												Required for private repositories. Use a fine-grained PAT from GitHub →
												Settings → Developer settings → Personal access tokens → Fine-grained tokens
											</p>
										}
									>
										<p class={cn("text-destructive text-[10px] font-medium")}>
											{providerTokenError()}
										</p>
									</Show>
								</div>
							</div>

							<div class={cn("flex justify-end gap-3 pt-2")}>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										setShowProviderModal(false);
										resetProviderForm();
									}}
								>
									Cancel
								</Button>
								<Button
									variant="secondary"
									size="sm"
									onClick={handleSaveProvider}
									disabled={!providerName().trim() || !providerBaseUrl().trim()}
									data-testid="save-provider-button"
								>
									{editingProvider() ? "Save" : "Add"}
								</Button>
							</div>
						</div>
					</Card>
				</div>
			</Show>

			{/* Source Modal */}
			<Show when={showSourceModal()}>
				<div
					class={cn(
						"bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
					)}
					data-testid="source-modal"
				>
					<Card class={cn("m-4 w-full max-w-md")}>
						<div class={cn("flex flex-col gap-4 p-6")}>
							<div class={cn("flex items-center justify-between")}>
								<h2
									class={cn("text-foreground text-[13px] font-black tracking-[0.15em] uppercase")}
								>
									{editingSource() ? "Edit" : "Add"} Preset Source
								</h2>
								<Button
									variant="ghost"
									size="xs"
									onClick={() => {
										setShowSourceModal(false);
										resetSourceForm();
									}}
									aria-label="Close"
								>
									<CloseIcon />
								</Button>
							</div>

							<div class={cn("space-y-4")}>
								<Input
									label="Display Name"
									placeholder="e.g., My Development Presets"
									ref={(el) => {
										if (el) {
											const name = sourceName();
											queueMicrotask(() => {
												el.value = name;
											});
										}
									}}
									onInput={(e) => setSourceName(e.currentTarget.value)}
									data-testid="source-name-input"
								/>

								<Select
									label="Source Type"
									ref={(el) => {
										if (el) {
											const type = sourceType();
											queueMicrotask(() => {
												el.value = type;
											});
										}
									}}
									onChange={(e) => {
										setSourceType(e.currentTarget.value as "github" | "url");
										if (e.currentTarget.value === "url") {
											setSourceProviderId("");
										}
									}}
									data-testid="source-type-select"
								>
									<option value="github">GitHub Repository / Gist</option>
									<option value="url">Direct JSON URL</option>
								</Select>

								<Input
									label="URL"
									placeholder={
										sourceType() === "github"
											? "e.g., https://github.com/user/repo or gist URL"
											: "e.g., https://example.com/presets.json"
									}
									ref={(el) => {
										if (el) {
											const url = sourceUrl();
											queueMicrotask(() => {
												el.value = url;
											});
										}
									}}
									onInput={(e) => setSourceUrl(e.currentTarget.value)}
									data-testid="source-url-input"
								/>

								<Show when={sourceType() === "github"}>
									<Select
										label="GitHub Instance (optional)"
										ref={(el) => {
											if (el) {
												const providerId = sourceProviderId();
												queueMicrotask(() => {
													el.value = providerId;
												});
											}
										}}
										onChange={(e) => setSourceProviderId(e.currentTarget.value)}
										data-testid="source-provider-select"
									>
										<option value="">Public (no authentication)</option>
										<For each={providerInstances()}>
											{(instance) => (
												<option value={instance.id}>
													{instance.name} ({instance.baseUrl})
												</option>
											)}
										</For>
									</Select>
									<Show when={providerInstances().length === 0}>
										<p class={cn("text-muted-foreground/70 -mt-2 text-[10px]")}>
											Add a GitHub instance above to access private repositories.
										</p>
									</Show>
								</Show>
							</div>

							<div class={cn("flex justify-end gap-3 pt-2")}>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										setShowSourceModal(false);
										resetSourceForm();
									}}
								>
									Cancel
								</Button>
								<Button
									variant="secondary"
									size="sm"
									onClick={handleSaveSource}
									disabled={!sourceName().trim() || !sourceUrl().trim()}
									data-testid="save-source-button"
								>
									{editingSource() ? "Save" : "Add"}
								</Button>
							</div>
						</div>
					</Card>
				</div>
			</Show>

			{/* Schema Info Modal */}
			<Show when={showSchemaInfo()}>
				<div
					class={cn(
						"bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
					)}
					data-testid="schema-info-modal"
				>
					<Card class={cn("m-4 flex max-h-[80vh] w-full max-w-lg flex-col")}>
						<div class={cn("flex flex-col gap-4 overflow-hidden p-6")}>
							<div class={cn("flex items-center justify-between")}>
								<h2
									class={cn("text-foreground text-[13px] font-black tracking-[0.15em] uppercase")}
								>
									Preset File Format
								</h2>
								<Button
									variant="ghost"
									size="xs"
									onClick={() => setShowSchemaInfo(false)}
									aria-label="Close"
								>
									<CloseIcon />
								</Button>
							</div>

							<div class={cn("flex-1 space-y-4 overflow-y-auto")}>
								<div
									class={cn("text-foreground/80 text-[12px] leading-relaxed whitespace-pre-wrap")}
								>
									{PRESET_SCHEMA_DESCRIPTION}
								</div>

								<Separator class={cn("opacity-50")} />

								<div>
									<p
										class={cn(
											"text-foreground mb-2 text-[11px] font-black tracking-widest uppercase"
										)}
									>
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
								<Button variant="secondary" size="sm" onClick={() => setShowSchemaInfo(false)}>
									Got it
								</Button>
							</div>
						</div>
					</Card>
				</div>
			</Show>
		</>
	);
};
