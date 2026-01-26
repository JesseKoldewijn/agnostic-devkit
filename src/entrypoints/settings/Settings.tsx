import type { Component } from "solid-js";
import { createResource, createSignal, onMount, Show } from "solid-js";
import { browser } from "wxt/browser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { Layout } from "@/components/ui-shared/Layout";
import { PageHeader } from "@/components/ui-shared/PageHeader";
import { getUpdateInfo } from "@/logic/releaseService";
import { getBrowserName, isSidebarSupported } from "@/utils/browser";
import { cn } from "@/utils/cn";
import type { DisplayMode } from "@/utils/displayMode";
import { applyDisplayMode, getDisplayMode, setDisplayMode } from "@/utils/displayMode";
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
		</Layout>
	);
};
