import type { Component } from "solid-js";
import { Show, createSignal, onMount } from "solid-js";

import { browser } from "wxt/browser";

import { PresetManager, PresetToggleList } from "@/components/presets";
import { Layout } from "@/components/ui-shared/Layout";
import { PageHeader } from "@/components/ui-shared/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { getBrowserName } from "@/utils/browser";
import { cn } from "@/utils/cn";
import type { Theme } from "@/utils/theme";
import { getTheme } from "@/utils/theme";

export const App: Component = () => {
	const [currentTheme, setCurrentTheme] = createSignal<Theme>("system");
	const [showManager, setShowManager] = createSignal(false);
	const [currentUrl, setCurrentUrl] = createSignal<string>("");
	const [isIncognito, setIsIncognito] = createSignal(false);

	/**
	 * Get the appropriate label for private browsing mode based on browser
	 * Firefox uses "Private", Chrome/Edge/others use "Incognito"
	 */
	const getPrivateModeLabel = () => {
		const browserName = getBrowserName();
		return browserName === "Firefox" ? "Private" : "Incognito";
	};

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
					setIsIncognito(tab.incognito ?? false);
				}
			}
		} else {
			// Get current tab URL
			const tabs = await browser.tabs?.query({
				active: true,
				currentWindow: true,
			});
			if (tabs?.[0]) {
				setCurrentUrl(tabs[0].url ?? "");
				setIsIncognito(tabs[0].incognito ?? false);
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
			if (tab) {
				setCurrentUrl(tab.url ?? "");
				setIsIncognito(tab.incognito ?? false);
			}
		});

		browser.tabs?.onUpdated.addListener(async (tabId, _changeInfo, tab) => {
			const targetTabIdParam = urlParams.get("targetTabId");
			const hasTestOverride = Boolean(targetTabIdParam);
			const targetId = hasTestOverride ? Number.parseInt(targetTabIdParam ?? "", 10) : null;

			if (hasTestOverride && targetId !== null) {
				if (tabId === targetId) {
					setCurrentUrl(tab.url ?? "");
					setIsIncognito(tab.incognito ?? false);
				}
				return;
			}

			const currentTabs = await browser.tabs?.query({
				active: true,
				currentWindow: true,
			});
			if (currentTabs?.[0]?.id === tabId) {
				setCurrentUrl(tab.url ?? "");
				setIsIncognito(tab.incognito ?? false);
			}
		});
	});

	return (
		<Layout constrained class={cn("min-h-[500px] min-w-[440px] p-4")} data-testid="popup-container">
			<Show
				when={!showManager()}
				fallback={
					<div class={cn("flex min-h-0 flex-1 flex-col")} data-testid="preset-manager-container">
						<PresetManager onClose={() => setShowManager(false)} class={cn("min-h-0 flex-1")} />
					</div>
				}
			>
				<div class={cn("flex min-h-0 flex-1 flex-col space-y-5")}>
					{/* Fixed header section */}
					<div class={cn("shrink-0")}>
						<PageHeader
							title="Agnostic Devkit"
							subtitle="Active Control Panel"
							theme={currentTheme()}
							titleTestId="popup-heading"
						/>
					</div>

					{/* Current URL display - fixed outside scroll area */}
					<Show when={currentUrl()}>
						<Card
							class={cn(
								"border-border/50 bg-muted/30 shrink-0 shadow-none",
								isIncognito() && "border-purple-500/30 bg-purple-500/5"
							)}
							data-testid="current-tab-section"
						>
							<CardContent class={cn("p-4")}>
								<div class={cn("mb-1.5 flex items-center gap-2")}>
									<div
										class={cn(
											"text-muted-foreground text-[10px] font-black tracking-widest uppercase opacity-70"
										)}
									>
										Active Tab
									</div>
									<Show when={isIncognito()}>
										<Badge
											variant="outline"
											class={cn("border-purple-500/50 text-purple-600 dark:text-purple-400")}
											data-testid="incognito-badge"
										>
											{getPrivateModeLabel()}
										</Badge>
									</Show>
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

					{/* Scrollable preset list area */}
					<ScrollArea class={cn("flex-1")}>
						<PresetToggleList onManagePresets={() => setShowManager(true)} />
					</ScrollArea>

					{/* Fixed footer */}
					<div class={cn("shrink-0 pt-3")}>
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
