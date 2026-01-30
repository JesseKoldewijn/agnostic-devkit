import type { Component } from "solid-js";
import { Show, createSignal, onMount } from "solid-js";

import { browser } from "wxt/browser";

import { PresetManager, PresetToggleList } from "@/components/presets";
import { Layout } from "@/components/ui-shared/Layout";
import { PageHeader } from "@/components/ui-shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/utils/cn";
import type { Theme } from "@/utils/theme";
import { getTheme } from "@/utils/theme";

export const App: Component = () => {
	const [currentTheme, setCurrentTheme] = createSignal<Theme>("system");
	const [showManager, setShowManager] = createSignal(false);
	const [currentUrl, setCurrentUrl] = createSignal<string>("");

	onMount(async () => {
		const theme = await getTheme();
		setCurrentTheme(theme);

		// Check for test override via URL param (used in e2e tests)
		const urlParams = new URLSearchParams(window.location.search);

		// Check for share parameter and auto-show the manager if present
		const shareParam = urlParams.get("share");
		if (shareParam) {
			setShowManager(true);
		}

		const overrideTabId = urlParams.get("targetTabId");

		if (overrideTabId) {
			const parsed = Number.parseInt(overrideTabId, 10);
			if (!Number.isNaN(parsed)) {
				const tab = await browser.tabs?.get(parsed);
				if (tab?.url) {
					setCurrentUrl(tab.url);
				}
			}
		} else {
			// Get current tab URL
			const tabs = await browser.tabs?.query({
				active: true,
				currentWindow: true,
			});
			if (tabs?.[0]?.url) {
				setCurrentUrl(tabs[0].url);
			}
		}

		// Listen for theme changes
		browser.storage?.onChanged.addListener((changes, areaName) => {
			if (areaName === "sync" && changes.theme) {
				setCurrentTheme(changes.theme.newValue as Theme);
			}
		});

		// Listen for tab changes (in case popup stays open during tab switch)
		browser.tabs?.onActivated.addListener(async (activeInfo) => {
			const hasTestOverride = Boolean(urlParams.get("targetTabId"));
			if (hasTestOverride) {
				return;
			}

			const tab = await browser.tabs?.get(activeInfo.tabId);
			if (tab?.url) {
				setCurrentUrl(tab.url);
			}
		});

		browser.tabs?.onUpdated.addListener(async (tabId, _changeInfo, tab) => {
			const targetTabIdParam = urlParams.get("targetTabId");
			const hasTestOverride = Boolean(targetTabIdParam);
			const targetId = hasTestOverride ? Number.parseInt(targetTabIdParam ?? "", 10) : null;

			if (hasTestOverride && targetId !== null) {
				if (tabId === targetId && tab.url) {
					setCurrentUrl(tab.url);
				}
				return;
			}

			const currentTabs = await browser.tabs?.query({
				active: true,
				currentWindow: true,
			});
			if (currentTabs?.[0]?.id === tabId && tab.url) {
				setCurrentUrl(tab.url);
			}
		});
	});

	return (
		<Layout class={cn("min-h-[400px] w-[400px] p-4!")} data-testid="popup-container">
			<Show
				when={!showManager()}
				fallback={
					<div data-testid="preset-manager-container">
						<PresetManager onClose={() => setShowManager(false)} class={cn("min-h-[400px]")} />
					</div>
				}
			>
				<div class={cn("flex flex-col space-y-5")}>
					<PageHeader
						title="Agnostic Devkit"
						subtitle="Active Control Panel"
						theme={currentTheme()}
						titleTestId="popup-heading"
					/>

					{/* Current URL display */}
					<Show when={currentUrl()}>
						<Card
							class={cn("border-border/50 bg-muted/30 shadow-none")}
							data-testid="current-tab-section"
						>
							<CardContent class={cn("p-4")}>
								<div
									class={cn(
										"text-muted-foreground mb-1.5 text-[10px] font-black tracking-widest uppercase opacity-70"
									)}
								>
									Active Tab
								</div>
								<div
									class={cn("text-foreground truncate font-mono text-[12px]")}
									title={currentUrl()}
									data-testid="current-tab-url"
								>
									{currentUrl()}
								</div>
							</CardContent>
						</Card>
					</Show>

					{/* Preset Toggle List */}
					<PresetToggleList onManagePresets={() => setShowManager(true)} />

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
