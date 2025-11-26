import { Component, createSignal, onMount, Show } from "solid-js";
import { getTheme, setTheme, applyTheme, type Theme } from "../utils/theme";
import {
	getDisplayMode,
	setDisplayMode,
	applyDisplayMode,
	isSidebarSupported,
	type DisplayMode,
} from "../utils/displayMode";
import { browser } from "../utils/browser";

export const Options: Component = () => {
	// Current saved values
	const [savedTheme, setSavedTheme] = createSignal<Theme>("system");
	const [savedDisplayMode, setSavedDisplayMode] =
		createSignal<DisplayMode>("popup");

	// Form input values
	const [theme, setThemeInput] = createSignal<Theme>("system");
	const [displayMode, setDisplayModeInput] =
		createSignal<DisplayMode>("popup");
	const [notifications, setNotifications] = createSignal(true);

	const [saved, setSaved] = createSignal(false);
	const [sidebarSupported, setSidebarSupported] = createSignal(true);
	const [browserName, setBrowserName] = createSignal("");

	onMount(async () => {
		const currentTheme = await getTheme();
		const currentDisplayMode = await getDisplayMode();
		const result = await browser.storage?.sync.get(["notifications"]);

		// Set both saved and form values
		setSavedTheme(currentTheme);
		setThemeInput(currentTheme);
		setSavedDisplayMode(currentDisplayMode);
		setDisplayModeInput(currentDisplayMode);
		setNotifications((result?.notifications as boolean) ?? true);

		// Check browser support
		setSidebarSupported(isSidebarSupported());
		setBrowserName(browser.getBrowserName());
	});

	const saveSettings = async () => {
		// Apply theme changes
		if (theme() !== savedTheme()) {
			await setTheme(theme());
			applyTheme(theme());
			setSavedTheme(theme());
		}

		// Apply display mode changes
		if (displayMode() !== savedDisplayMode()) {
			await setDisplayMode(displayMode());
			await applyDisplayMode(displayMode());
			setSavedDisplayMode(displayMode());
		}

		// Save notifications
		await browser.storage?.sync.set({ notifications: notifications() });

		setSaved(true);
		setTimeout(() => setSaved(false), 2000);
	};

	return (
		<div class="min-h-screen bg-background p-8">
			<div class="max-w-2xl mx-auto">
				<h1 class="text-4xl font-bold text-foreground mb-8">
					Extension Options
				</h1>

				<div class="bg-card p-6 rounded-lg border border-border space-y-6">
					<div class="space-y-2">
						<label class="block text-sm font-medium text-foreground">
							Display Mode
						</label>
						<select
							value={displayMode()}
							onChange={(e) =>
								setDisplayModeInput(
									e.target.value as DisplayMode
								)
							}
							class="w-full px-4 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
						>
							<option value="popup">Popup</option>
							<option value="sidebar">Sidebar</option>
						</select>
						<p class="text-xs text-muted-foreground">
							Choose how to display the extension interface.
						</p>
						<Show when={!sidebarSupported()}>
							<div class="mt-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md">
								<p class="text-xs text-amber-600 dark:text-amber-400">
									⚠️ Sidebar mode is not supported in{" "}
									{browserName()}. The extension will use
									popup mode as a fallback.
								</p>
							</div>
						</Show>
					</div>

					<div class="space-y-2">
						<label class="block text-sm font-medium text-foreground">
							Theme
						</label>
						<select
							value={theme()}
							onChange={(e) =>
								setThemeInput(e.target.value as Theme)
							}
							class="w-full px-4 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
						>
							<option value="light">Light</option>
							<option value="dark">Dark</option>
							<option value="system">System</option>
						</select>
						<p class="text-xs text-muted-foreground">
							Select your preferred theme
						</p>
					</div>

					<div class="flex items-center space-x-3">
						<input
							type="checkbox"
							id="notifications"
							checked={notifications()}
							onChange={(e) => setNotifications(e.target.checked)}
							class="w-4 h-4 text-primary border-input rounded focus:ring-2 focus:ring-ring"
						/>
						<label
							for="notifications"
							class="text-sm font-medium text-foreground"
						>
							Enable notifications
						</label>
					</div>

					<button
						onClick={saveSettings}
						class="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
					>
						{saved() ? "✓ Settings Saved!" : "Save Settings"}
					</button>
				</div>
			</div>
		</div>
	);
};
