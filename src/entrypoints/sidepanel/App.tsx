import type { Component } from "solid-js";
import { Show, createSignal, onMount } from "solid-js";

import { browser } from "wxt/browser";

import { PresetManager, PresetToggleList } from "@/components/presets";
import { Layout } from "@/components/ui-shared/Layout";
import { PageHeader } from "@/components/ui-shared/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { getBrowserName } from "@/utils/browser";
import { cn } from "@/utils/cn";
import type { Theme } from "@/utils/theme";
import { getTheme } from "@/utils/theme";

export const App: Component = () => {
	const [currentTheme, setCurrentTheme] = createSignal<Theme>("system");
	const [showManager, setShowManager] = createSignal(false);
	const [currentUrl, setCurrentUrl] = createSignal<string>("");
	const [currentTabTitle, setCurrentTabTitle] = createSignal<string>("");
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

		// Get current tab info
		const tabs = await browser.tabs?.query({
			active: true,
			currentWindow: true,
		});
		if (tabs?.[0]) {
			setCurrentUrl(tabs[0].url ?? "");
			setCurrentTabTitle(tabs[0].title ?? "");
			setIsIncognito(tabs[0].incognito ?? false);
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
				setIsIncognito(tab.incognito ?? false);
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
				setIsIncognito(tab.incognito ?? false);
			}
		});
	});

	return (
		<Layout class={cn("min-h-screen w-full p-5!")} data-testid="sidebar-container">
			<Show
				when={!showManager()}
				fallback={
					<PresetManager onClose={() => setShowManager(false)} class={cn("min-h-[500px]")} />
				}
			>
				<div class={cn("flex flex-col space-y-5")}>
					<PageHeader
						title="Agnostic Devkit"
						subtitle="Active Control Panel"
						theme={currentTheme()}
						titleTestId="sidebar-heading"
					/>

					{/* Current Tab Info */}
					<Card
						class={cn(
							"border-border/50 bg-muted/30 shadow-none",
							isIncognito() && "border-purple-500/30 bg-purple-500/5"
						)}
						data-testid="current-tab-section"
					>
						<CardContent class={cn("p-4")}>
							<div class={cn("mb-2.5 flex items-center gap-2")}>
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
							<Show when={currentTabTitle()}>
								<div
									class={cn("text-foreground mb-1 truncate text-[13px] font-black")}
									title={currentTabTitle()}
									data-testid="current-tab-title"
								>
									{currentTabTitle()}
								</div>
							</Show>
							<Show
								when={currentUrl()}
								fallback={
									<div class={cn("text-muted-foreground text-[11px] italic")}>
										No active tab detected
									</div>
								}
							>
								<div
									class={cn("text-muted-foreground/80 truncate font-mono text-[11px]")}
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
									"text-primary mb-1.5 text-[10px] font-black tracking-widest uppercase opacity-80"
								)}
								data-testid="about-presets-heading"
							>
								Quick Guide
							</h3>
							<p class={cn("text-foreground/70 text-[12px] leading-relaxed font-bold")}>
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
