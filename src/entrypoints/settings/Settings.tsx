import { Component, createSignal, onMount, Show } from "solid-js";
import { browser } from "wxt/browser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { Layout } from "@/components/ui-shared/Layout";
import { PageHeader } from "@/components/ui-shared/PageHeader";
import { getBrowserName, isSidebarSupported } from "@/utils/browser";
import { cn } from "@/utils/cn";
import type { DisplayMode } from "@/utils/displayMode";
import { applyDisplayMode, getDisplayMode, setDisplayMode } from "@/utils/displayMode";
import type { Theme } from "@/utils/theme";
import { applyTheme, getTheme, setTheme } from "@/utils/theme";

export const Settings: Component = () => {
	const version = browser.runtime.getManifest().version;

	const [theme, setThemeInput] = createSignal<Theme>("system");
	const [displayMode, setDisplayModeInput] = createSignal<DisplayMode>("popup");
	const [notifications, setNotifications] = createSignal(true);

	const [showSaved, setShowSaved] = createSignal(false);
	const [sidebarSupported, setSidebarSupported] = createSignal(true);
	const [browserName, setBrowserName] = createSignal("");

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
		const storage = browser.storage?.sync || (browser.storage as any)?.local;
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
								<option value="popup">Popup</option>
								<option value="sidebar">Sidebar</option>
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
								<option value="light">Light</option>
								<option value="dark">Dark</option>
								<option value="system">System Preference</option>
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
							<Label class={cn("!mb-0 !ml-0 font-black text-[11px]")}>Enable Notifications</Label>
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
			</div>

			{/* Auto-save Status Indicator */}
			<Show when={showSaved()}>
				<div
					data-testid="settings-saved-indicator"
					class={cn(
						"fade-in slide-in-from-bottom-4 fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 animate-in items-center gap-2 rounded-full bg-foreground px-4 py-2 text-background shadow-2xl duration-300"
					)}
				>
					<svg class={cn("h-4 w-4")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
				<p class={cn("font-black text-[10px] text-muted-foreground/30 uppercase tracking-[0.4em]")}>
					Agnostic Devkit &copy; {new Date().getFullYear()}
				</p>
			</div>
		</Layout>
	);
};
