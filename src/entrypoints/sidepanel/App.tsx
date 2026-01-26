import type { Component } from "solid-js";
import { createSignal, onMount, Show } from "solid-js";
import { browser } from "wxt/browser";
import { PresetManager } from "@/components/PresetManager";
import { PresetToggleList } from "@/components/PresetToggleList";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Layout } from "@/components/ui-shared/Layout";
import { PageHeader } from "@/components/ui-shared/PageHeader";
import { cn } from "@/utils/cn";
import type { Theme } from "@/utils/theme";
import { getTheme } from "@/utils/theme";

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
		<Layout class={cn("p-5! min-h-screen w-full")} data-testid="sidebar-container">
			<Show
				when={!showManager()}
				fallback={
					<PresetManager onClose={() => setShowManager(false)} class={cn("min-h-[500px]")} />
				}
			>
				<div class={cn("flex flex-col space-y-5")}>
					<PageHeader
						title="Side Panel"
						subtitle="Active Control"
						theme={currentTheme()}
						titleTestId="sidebar-heading"
					/>

					{/* Current Tab Info */}
					<Card
						class={cn("border-border/50 bg-muted/30 shadow-none")}
						data-testid="current-tab-section"
					>
						<CardContent class={cn("p-4")}>
							<div
								class={cn(
									"mb-2.5 font-black text-[10px] text-muted-foreground uppercase tracking-widest opacity-70"
								)}
							>
								Active Tab
							</div>
							<Show when={currentTabTitle()}>
								<div
									class={cn("mb-1 truncate font-black text-[13px] text-foreground")}
									title={currentTabTitle()}
									data-testid="current-tab-title"
								>
									{currentTabTitle()}
								</div>
							</Show>
							<Show
								when={currentUrl()}
								fallback={
									<div class={cn("text-[11px] text-muted-foreground italic")}>
										No active tab detected
									</div>
								}
							>
								<div
									class={cn("truncate font-mono text-[11px] text-muted-foreground/80")}
									title={currentUrl()}
									data-testid="current-tab-url"
								>
									{currentUrl()}
								</div>
							</Show>
						</CardContent>
					</Card>

					{/* Preset Toggle List - Expanded view for sidebar */}
					<PresetToggleList expanded={true} onManagePresets={() => setShowManager(true)} />

					{/* About Card */}
					<Card
						class={cn("border-primary/20 bg-primary/5 shadow-none")}
						data-testid="about-presets-card"
					>
						<CardContent class={cn("p-4")}>
							<h3
								class={cn(
									"mb-1.5 font-black text-[10px] text-primary uppercase tracking-widest opacity-80"
								)}
								data-testid="about-presets-heading"
							>
								Quick Guide
							</h3>
							<p class={cn("font-bold text-[12px] text-foreground/70 leading-relaxed")}>
								Toggle presets to apply URL parameters, cookies, and storage values. Changes are
								applied immediately to the target tab.
							</p>
						</CardContent>
					</Card>

					{/* Footer */}
					<div class={cn("pt-3")}>
						<Button
							variant="secondary"
							class={cn("h-10 w-full")}
							onClick={() =>
								browser.tabs.create({
									// eslint-disable-next-line @typescript-eslint/no-explicit-any -- WXT's browser.runtime type is missing getURL
									url: (browser.runtime as any).getURL("settings.html"),
								})
							}
							data-testid="open-options-button"
						>
							Open Settings
						</Button>
					</div>
				</div>
			</Show>
		</Layout>
	);
};
