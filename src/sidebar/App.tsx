import { Component, createSignal, onMount, Show } from "solid-js";
import { getTheme, type Theme } from "../utils/theme";
import { browser } from "../utils/browser";
import { PresetToggleList, PresetManager } from "../components";

export const App: Component = () => {
	const [currentTheme, setCurrentTheme] = createSignal<Theme>("system");
	const [showManager, setShowManager] = createSignal(false);
	const [currentUrl, setCurrentUrl] = createSignal<string>("");
	const [currentTabTitle, setCurrentTabTitle] = createSignal<string>("");

	onMount(async () => {
		const theme = await getTheme();
		setCurrentTheme(theme);

		// Get current tab info
		const tabs = await browser.tabs?.query({
			active: true,
			currentWindow: true,
		});
		if (tabs?.[0]) {
			setCurrentUrl(tabs[0].url ?? "");
			setCurrentTabTitle(tabs[0].title ?? "");
		}

		// Listen for theme changes
		browser.storage?.onChanged.addListener((changes, areaName) => {
			if (areaName === "sync" && changes.theme) {
				setCurrentTheme(changes.theme.newValue as Theme);
			}
		});

		// Listen for tab changes
		browser.tabs?.onActivated.addListener(async (activeInfo) => {
			const tab = await browser.tabs?.get(activeInfo.tabId);
			if (tab) {
				setCurrentUrl(tab.url ?? "");
				setCurrentTabTitle(tab.title ?? "");
			}
		});

		browser.tabs?.onUpdated.addListener(async (tabId, _changeInfo, tab) => {
			const tabs = await browser.tabs?.query({
				active: true,
				currentWindow: true,
			});
			if (tabs?.[0]?.id === tabId) {
				setCurrentUrl(tab.url ?? "");
				setCurrentTabTitle(tab.title ?? "");
			}
		});
	});

	return (
		<div class="min-h-screen w-full p-4 bg-background" data-testid="sidebar-container">
			<Show
				when={!showManager()}
				fallback={
					<PresetManager
						onClose={() => setShowManager(false)}
						class="min-h-[500px]"
					/>
				}
			>
				<div class="flex flex-col space-y-4">
					{/* Header */}
					<div class="flex items-center justify-between">
						<h1 class="text-xl font-bold text-foreground" data-testid="sidebar-heading">
							Parameter Presets
						</h1>
						<div class="px-2 py-0.5 bg-secondary rounded text-xs text-secondary-foreground" data-testid="theme-indicator">
							{currentTheme()}
						</div>
					</div>

					{/* Current Tab Info */}
					<div class="p-3 bg-card rounded-lg border border-border" data-testid="current-tab-section">
						<div class="text-xs text-muted-foreground mb-1">
							Current Tab
						</div>
						<Show when={currentTabTitle()}>
							<div
								class="text-sm font-medium text-foreground truncate mb-1"
								title={currentTabTitle()}
								data-testid="current-tab-title"
							>
								{currentTabTitle()}
							</div>
						</Show>
						<Show when={currentUrl()}>
							<div
								class="text-xs font-mono text-muted-foreground truncate"
								title={currentUrl()}
								data-testid="current-tab-url"
							>
								{currentUrl()}
							</div>
						</Show>
						<Show when={!currentUrl()}>
							<div class="text-sm text-muted-foreground">
								No active tab
							</div>
						</Show>
					</div>

					{/* Preset Toggle List - Expanded view for sidebar */}
					<PresetToggleList
						expanded={true}
						onManagePresets={() => setShowManager(true)}
					/>

					{/* Info card */}
					<div class="p-4 bg-muted/50 border border-border rounded-lg" data-testid="about-presets-card">
						<h3 class="text-sm font-medium text-foreground mb-1" data-testid="about-presets-heading">
							About Presets
						</h3>
						<p class="text-xs text-muted-foreground">
							Presets allow you to quickly apply groups of URL
							parameters, cookies, and localStorage values to any
							tab. Toggle presets on/off to apply or remove their
							parameters.
						</p>
					</div>

					{/* Footer */}
					<div class="pt-2 border-t border-border">
						<button
							onClick={() => browser.runtime?.openOptionsPage()}
							class="w-full px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
							data-testid="open-options-button"
						>
							Open Options
						</button>
					</div>
				</div>
			</Show>
		</div>
	);
};
