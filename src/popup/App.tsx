import { Component, createSignal, onMount, Show } from "solid-js";
import { getTheme, type Theme } from "../utils/theme";
import { browser } from "../utils/browser";
import { PresetToggleList, PresetManager } from "../components";

export const App: Component = () => {
	const [currentTheme, setCurrentTheme] = createSignal<Theme>("system");
	const [showManager, setShowManager] = createSignal(false);
	const [currentUrl, setCurrentUrl] = createSignal<string>("");

	onMount(async () => {
		const theme = await getTheme();
		setCurrentTheme(theme);

		// Get current tab URL
		const tabs = await browser.tabs?.query({ active: true, currentWindow: true });
		if (tabs?.[0]?.url) {
			setCurrentUrl(tabs[0].url);
		}

		// Listen for theme changes
		browser.storage?.onChanged.addListener((changes, areaName) => {
			if (areaName === "sync" && changes.theme) {
				setCurrentTheme(changes.theme.newValue as Theme);
			}
		});
	});

	return (
		<div class="w-96 min-h-96 p-4 bg-background" data-testid="popup-container">
			<Show
				when={!showManager()}
				fallback={
					<PresetManager
						onClose={() => setShowManager(false)}
						class="h-[400px]"
					/>
				}
			>
				<div class="flex flex-col space-y-4">
					{/* Header */}
					<div class="flex items-center justify-between">
						<h1 class="text-lg font-bold text-foreground" data-testid="popup-heading">
							Parameters
						</h1>
						<div class="px-2 py-0.5 bg-secondary rounded text-xs text-secondary-foreground" data-testid="theme-indicator">
							{currentTheme()}
						</div>
					</div>

					{/* Current URL display */}
					<Show when={currentUrl()}>
						<div class="px-3 py-2 bg-muted/50 rounded-lg border border-border" data-testid="current-tab-section">
							<div class="text-xs text-muted-foreground mb-1">Current Tab</div>
							<div class="text-xs font-mono text-foreground truncate" title={currentUrl()} data-testid="current-tab-url">
								{currentUrl()}
							</div>
						</div>
					</Show>

					{/* Preset Toggle List */}
					<PresetToggleList
						onManagePresets={() => setShowManager(true)}
					/>

					{/* Footer buttons */}
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
