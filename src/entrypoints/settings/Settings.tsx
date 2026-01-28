import type { Component } from "solid-js";
import { createResource, createSignal, For, onMount, Show } from "solid-js";
import { browser } from "wxt/browser";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { Separator } from "@/components/ui/Separator";
import { Switch } from "@/components/ui/Switch";
import { Layout } from "@/components/ui-shared/Layout";
import { PageHeader } from "@/components/ui-shared/PageHeader";
import { createPreset, getParameterTypeIcon, parseShareUrl } from "@/logic/parameters";
import { getUpdateInfo } from "@/logic/releaseService";
import { getBrowserName, isSidebarSupported } from "@/utils/browser";
import { cn } from "@/utils/cn";
import type { DisplayMode } from "@/utils/displayMode";
import { applyDisplayMode, getDisplayMode, setDisplayMode } from "@/utils/displayMode";
import type { DecompressResult } from "@/utils/presetCoder";
import type { Theme } from "@/utils/theme";
import { applyTheme, getTheme, setTheme } from "@/utils/theme";

export const Settings: Component = () => {
	const extensionEnv = __EXTENSION_ENV__;
	const version = __EXTENSION_VERSION__;

	const [theme, setThemeInput] = createSignal<Theme>("system");
	const [displayMode, setDisplayModeInput] = createSignal<DisplayMode>("popup");
	const [notifications, setNotifications] = createSignal(true);

	const [showSaved, setShowSaved] = createSignal(false);
	const [sidebarSupported, setSidebarSupported] = createSignal(true);
	const [browserName, setBrowserName] = createSignal("");

	// Share import state
	const [shareImportData, setShareImportData] = createSignal<DecompressResult | null>(null);
	const [shareImportError, setShareImportError] = createSignal<string | null>(null);
	const [importSuccess, setImportSuccess] = createSignal(false);
	const [shareImportExpandedId, setShareImportExpandedId] = createSignal<string | null>(null);

	// Toggle expanded state for a preset in share import view
	const toggleShareImportExpanded = (presetId: string) => {
		setShareImportExpandedId((current) => (current === presetId ? null : presetId));
	};

	// Resource for fetching update info
	const [updateInfo] = createResource(() => getUpdateInfo(version, extensionEnv));

	onMount(async () => {
		const currentTheme = await getTheme();
		const currentDisplayMode = await getDisplayMode();
		const result = await browser.storage?.sync.get(["notifications"]);

		setThemeInput(currentTheme);
		setDisplayModeInput(currentDisplayMode);
		setNotifications((result?.notifications as boolean) ?? true);

		setSidebarSupported(isSidebarSupported());
		setBrowserName(getBrowserName());

		// Check for share parameter in URL
		try {
			const shareData = parseShareUrl(window.location.href);
			if (shareData) {
				setShareImportData(shareData);
			}
		} catch (error) {
			console.error("[Settings] Failed to parse share URL:", error);
			setShareImportError("Invalid share link. The data may be corrupted or expired.");
		}
	});

	const triggerSaved = () => {
		setShowSaved(true);
		setTimeout(() => setShowSaved(false), 2000);
	};

	const handleThemeChange = async (newTheme: Theme) => {
		setThemeInput(newTheme);
		try {
			await setTheme(newTheme);
			applyTheme(newTheme);
			triggerSaved();
		} catch (error) {
			console.error("[Settings] Failed to save theme:", error);
		}
	};

	const handleDisplayModeChange = async (newMode: DisplayMode) => {
		setDisplayModeInput(newMode);
		try {
			await setDisplayMode(newMode);
			await applyDisplayMode(newMode);
			triggerSaved();
		} catch (error) {
			console.error("[Settings] Failed to save display mode:", error);
		}
	};

	const handleNotificationsChange = async (enabled: boolean) => {
		setNotifications(enabled);
		const storage = browser.storage?.sync || browser.storage?.local;
		if (storage) {
			try {
				await storage.set({ notifications: enabled });
				triggerSaved();
			} catch (error) {
				console.error("[Settings] Failed to save notifications:", error);
			}
		}
	};

	// Clean up share parameter from URL
	const cleanupShareUrl = () => {
		const url = new URL(window.location.href);
		if (url.searchParams.has("share")) {
			url.searchParams.delete("share");
			window.history.replaceState({}, "", url.toString());
		}
	};

	// Handle share import confirmation
	const handleShareImportConfirm = async () => {
		const data = shareImportData();
		if (!data) return;

		try {
			// Add imported presets to storage
			for (const preset of data.result) {
				await createPreset({
					name: preset.name,
					parameters: preset.parameters,
					description: preset.description,
				});
			}
			// Show success and clear state
			setShareImportData(null);
			setShareImportError(null);
			setImportSuccess(true);
			cleanupShareUrl();
			setTimeout(() => setImportSuccess(false), 3000);
		} catch (error) {
			console.error("[Settings] Failed to import shared presets:", error);
			setShareImportError("Failed to import presets. Please try again.");
		}
	};

	// Handle share import cancel
	const handleShareImportCancel = () => {
		setShareImportData(null);
		setShareImportError(null);
		setShareImportExpandedId(null);
		cleanupShareUrl();
	};

	return (
		<Layout data-testid="options-container">
			<PageHeader
				title="Extension Options"
				subtitle={`v${version}`}
				theme={theme()}
				titleTestId="extension-options-heading"
			/>

			<div class={cn("mt-6 grid grid-cols-1 gap-6 md:grid-cols-2")}>
				<Card class={cn("md:col-span-2")}>
					<CardHeader>
						<CardTitle>Interface Settings</CardTitle>
						<CardDescription>Customize how you interact with the extension</CardDescription>
					</CardHeader>
					<CardContent class={cn("grid grid-cols-1 gap-8 sm:grid-cols-2")}>
						<div class={cn("space-y-4")}>
							<Select
								label="Display Mode"
								value={displayMode()}
								onChange={(e) => handleDisplayModeChange(e.currentTarget.value as DisplayMode)}
								data-testid="display-mode-select"
							>
								<option value="popup" selected={displayMode() === "popup"}>
									Popup
								</option>
								<option value="sidebar" selected={displayMode() === "sidebar"}>
									Sidebar
								</option>
							</Select>
							<p class={cn("ml-1 text-[11px] text-muted-foreground")}>
								Choose your preferred view for the extension interface.
							</p>
							<Show when={!sidebarSupported()}>
								<div
									class={cn(
										"rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 font-bold text-[10px] text-amber-600 dark:text-amber-400"
									)}
									data-testid="sidebar-warning"
								>
									⚠️ Sidebar is not supported in {browserName()}.
								</div>
							</Show>
						</div>

						<div class={cn("space-y-4")}>
							<Select
								label="Color Theme"
								value={theme()}
								onChange={(e) => handleThemeChange(e.currentTarget.value as Theme)}
								data-testid="theme-select"
							>
								<option value="light" selected={theme() === "light"}>
									Light
								</option>
								<option value="dark" selected={theme() === "dark"}>
									Dark
								</option>
								<option value="system" selected={theme() === "system"}>
									System Preference
								</option>
							</Select>
							<p class={cn("ml-1 text-[11px] text-muted-foreground")}>
								The extension will adapt its appearance based on this selection.
							</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>System Notifications</CardTitle>
						<CardDescription>Manage browser alerts and updates</CardDescription>
					</CardHeader>
					<CardContent>
						<div
							class={cn(
								"flex items-center justify-between rounded-xl border-2 border-border/50 bg-muted/50 p-4"
							)}
						>
							<Label class={cn("mb-0! ml-0! font-black text-[11px]")}>Enable Notifications</Label>
							<Switch
								checked={notifications()}
								onCheckedChange={handleNotificationsChange}
								data-testid="notifications-checkbox"
							/>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>System Information</CardTitle>
						<CardDescription>Extension and environment details</CardDescription>
					</CardHeader>
					<CardContent class={cn("space-y-3")}>
						<div
							class={cn(
								"flex items-center justify-between px-1 font-black text-[11px] text-foreground/60 uppercase tracking-widest"
							)}
							data-testid="browser-info"
						>
							<span>Browser</span>
							<span class="text-foreground">{browserName()}</span>
						</div>
						<div
							class={cn(
								"flex items-center justify-between px-1 font-black text-[11px] text-foreground/60 uppercase tracking-widest"
							)}
						>
							<span>Build Version</span>
							<span class="text-foreground" data-testid="extension-version">
								v{version}
							</span>
						</div>
					</CardContent>
				</Card>

				<Card data-testid="release-channels-section">
					<CardHeader>
						<CardTitle>Release Channel</CardTitle>
						<CardDescription>Stay updated with latest features</CardDescription>
					</CardHeader>
					<CardContent class={cn("space-y-4")}>
						<div
							class={cn(
								"flex items-center justify-between rounded-xl border-2 border-border/50 bg-muted/50 p-4"
							)}
						>
							<div class="space-y-1">
								<p class="font-black text-[11px] uppercase tracking-widest">Active Channel</p>
								<div class="flex items-center gap-2">
									<span
										class={cn(
											"inline-flex items-center rounded-full px-2 py-0.5 font-bold text-[10px] uppercase tracking-tighter",
											extensionEnv === "production"
												? "bg-blue-500/10 text-blue-500"
												: "bg-red-500/10 text-red-500"
										)}
										data-testid="current-channel-label"
									>
										{extensionEnv.charAt(0).toUpperCase() + extensionEnv.slice(1)}
									</span>
								</div>
							</div>
						</div>

						<div class="space-y-2 px-1">
							<Show when={updateInfo.loading}>
								<p class="animate-pulse text-[11px] text-muted-foreground">
									Checking for updates...
								</p>
							</Show>
							<Show when={!updateInfo.loading && updateInfo()}>
								<div class="flex flex-col gap-2" data-testid="update-status">
									<Show when={updateInfo()?.isUpdateAvailable}>
										<div class="flex items-center justify-between">
											<span class="animate-pulse font-bold text-[11px] text-amber-500 uppercase tracking-widest">
												Update available: {updateInfo()?.latestVersion}
											</span>
											<a
												href={updateInfo()?.url}
												target="_blank"
												rel="noopener noreferrer"
												class="font-black text-[10px] text-foreground uppercase tracking-widest hover:underline"
												data-testid="latest-release-link"
											>
												View Release
											</a>
										</div>
									</Show>
									<Show when={!updateInfo()?.isUpdateAvailable}>
										<p class="text-[11px] text-muted-foreground uppercase tracking-widest">
											You are on the latest {extensionEnv} version
										</p>
									</Show>
								</div>
							</Show>
						</div>

						<Show when={extensionEnv === "production"}>
							<div class="mt-4 rounded-lg border border-red-500/10 bg-red-500/5 p-3">
								<p class="font-medium text-[10px] text-red-500/80 leading-relaxed">
									Want to try early features? Push to the <span class="font-bold">develop</span>{" "}
									branch to trigger a Canary build.
								</p>
							</div>
						</Show>
					</CardContent>
				</Card>
			</div>

			{/* Auto-save Status Indicator */}
			<Show when={showSaved()}>
				<div
					data-testid="settings-saved-indicator"
					class={cn(
						"fade-in slide-in-from-bottom-4 fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 animate-in items-center gap-2 rounded-full bg-foreground px-4 py-2 text-background shadow-2xl duration-300"
					)}
				>
					<svg
						class={cn("size-4")}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
						role="img"
					>
						<title>Check</title>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="3"
							d="M5 13l4 4L19 7"
						/>
					</svg>
					<span class={cn("font-black text-[11px] uppercase tracking-widest")}>Settings Saved</span>
				</div>
			</Show>

			<div class={cn("pt-20 pb-10 text-center")}>
				<p class={cn("font-black text-[10px] text-muted-foreground uppercase tracking-[0.4em]")}>
					Agnostic Devkit | {new Date().getFullYear()}
				</p>
			</div>

			{/* Share Import Modal */}
			<Show when={shareImportData() || shareImportError()}>
				<div
					class={cn(
						"fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
					)}
					data-testid="share-import-modal"
				>
					<Card class={cn("m-4 flex max-h-[400px] max-w-md flex-col size-full")}>
					<div class={cn("flex h-full flex-col gap-4 overflow-hidden p-6")}>
							{/* Header */}
							<div class={cn("flex items-center justify-between")}>
								<h2
									class={cn(
										"font-black text-[13px] text-foreground uppercase tracking-[0.15em]"
									)}
								>
									Import Shared Presets
								</h2>
								<Button
									variant="ghost"
									size="xs"
									onClick={handleShareImportCancel}
									aria-label="Close"
								>
									<svg
										class={cn("size-5")}
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
								</Button>
							</div>

							<Show
								when={!shareImportError()}
								fallback={
									<div
										class={cn(
											"rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-[13px] text-destructive"
										)}
										data-testid="share-import-error"
									>
										{shareImportError()}
									</div>
								}
							>
								{/* Content */}
								<div class={cn("flex-1 space-y-4")}>
									<p class={cn("text-[13px] text-muted-foreground")}>
										<span
											class={cn("font-bold text-foreground")}
											data-testid="share-import-count"
										>
											{shareImportData()?.count}
										</span>{" "}
										preset{shareImportData()?.isMultiplePresets ? "s" : ""} to import:
									</p>

								<div
									class={cn(
										"flex-1 space-y-2 overflow-y-auto rounded-xl border border-border/50 bg-muted/30 p-3"
									)}
								>
									<For each={shareImportData()?.result ?? []}>
										{(preset) => (
											<Card
												class={cn(
													"border-border/60 p-3 shadow-sm transition-all hover:border-primary/30"
												)}
												data-testid="share-import-preset-item"
											>
												<button
													type="button"
													class={cn("group w-full text-left")}
													onClick={() => toggleShareImportExpanded(preset.id)}
													data-testid="share-import-preset-expand"
												>
													<div
														class={cn(
															"truncate font-black text-[13px] text-foreground uppercase tracking-tight transition-colors group-hover:text-primary"
														)}
													>
														{preset.name}
													</div>
													<Show when={preset.description}>
														<div
															class={cn(
																"mt-1 truncate font-bold text-[10px] text-muted-foreground leading-tight"
															)}
														>
															{preset.description}
														</div>
													</Show>
													<div class={cn("mt-2 flex items-center gap-2")}>
														<Badge
															variant="secondary"
															class={cn("text-[8px]! h-4 px-2 font-black")}
														>
															{preset.parameters.length} VARS
														</Badge>
														<span
															class={cn(
																"font-black text-[9px] text-muted-foreground/50 uppercase tracking-widest"
															)}
														>
															{shareImportExpandedId() === preset.id ? "Hide" : "View"}
														</span>
													</div>
												</button>

												{/* Expanded parameter list */}
												<Show when={shareImportExpandedId() === preset.id}>
													<div class={cn("mt-3")} data-testid="share-import-preset-params">
														<Separator class={cn("mb-3 opacity-50")} />
														<div class={cn("space-y-1.5")}>
															<For each={preset.parameters}>
																{(param) => (
																	<div
																		class={cn(
																			"flex items-center justify-between rounded-lg border border-border/40 bg-muted/40 px-2.5 py-1.5 text-[10px] shadow-sm"
																		)}
																		data-testid="share-import-preset-param"
																	>
																		<div class={cn("flex min-w-0 flex-1 items-center")}>
																			<span class={cn("mr-1.5 scale-90 opacity-60")}>
																				{getParameterTypeIcon(param.type)}
																			</span>
																			<span
																				class={cn(
																					"truncate font-black text-foreground uppercase tracking-tighter"
																				)}
																			>
																				{param.key}
																			</span>
																		</div>
																		<span
																			class={cn(
																				"ml-2 max-w-[55%] truncate rounded-sm border border-border/20 bg-background/60 px-1.5 py-0.5 font-mono text-muted-foreground/90"
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
								</div>
							</Show>

							{/* Actions */}
							<div class={cn("flex justify-end gap-3 pt-2")}>
								<Button
									variant="ghost"
									size="sm"
									onClick={handleShareImportCancel}
									data-testid="share-import-cancel"
								>
									Cancel
								</Button>
								<Show when={!shareImportError()}>
									<Button
										variant="secondary"
										size="sm"
										onClick={handleShareImportConfirm}
										data-testid="share-import-confirm"
									>
										<svg
											class={cn("size-4 opacity-70")}
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
								</Show>
							</div>
						</div>
					</Card>
				</div>
			</Show>

			{/* Import Success Indicator */}
			<Show when={importSuccess()}>
				<div
					data-testid="import-success-indicator"
					class={cn(
						"fade-in slide-in-from-bottom-4 fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 animate-in items-center gap-2 rounded-full bg-foreground px-4 py-2 text-background shadow-2xl duration-300"
					)}
				>
					<svg
						class={cn("size-4")}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
						role="img"
					>
						<title>Check</title>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="3"
							d="M5 13l4 4L19 7"
						/>
					</svg>
					<span class={cn("font-black text-[11px] uppercase tracking-widest")}>
						Presets Imported
					</span>
				</div>
			</Show>
		</Layout>
	);
};
