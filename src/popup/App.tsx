import { Component, createSignal, onMount } from "solid-js";
import { getTheme, type Theme } from "../utils/theme";
import { browser } from "../utils/browser";

export const App: Component = () => {
	const [count, setCount] = createSignal(0);
	const [currentTheme, setCurrentTheme] = createSignal<Theme>("system");

	onMount(async () => {
		const theme = await getTheme();
		setCurrentTheme(theme);

		// Listen for theme changes
		browser.storage?.onChanged.addListener((changes, areaName) => {
			if (areaName === "sync" && changes.theme) {
				setCurrentTheme(changes.theme.newValue);
			}
		});
	});

	return (
		<div class="w-96 h-96 p-6 bg-background">
			<div class="flex flex-col items-center justify-center h-full space-y-4">
				<h1 class="text-3xl font-bold text-foreground">
					Chrome Extension
				</h1>
				<p class="text-muted-foreground">
					Built with Vite + SolidJS + Tailwind CSS v4
				</p>

				<div class="px-3 py-1 bg-secondary rounded-md text-xs text-secondary-foreground">
					Theme: {currentTheme()}
				</div>

				<div class="flex flex-col items-center space-y-3">
					<button
						onClick={() => setCount(count() + 1)}
						class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
					>
						Count: {count()}
					</button>

					<button
						onClick={() => browser.runtime?.openOptionsPage()}
						class="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
					>
						Open Options
					</button>
				</div>
			</div>
		</div>
	);
};
