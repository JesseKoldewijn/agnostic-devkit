import { browser } from "wxt/browser";
import { getBrowserName, isSidebarSupported } from "@/utils/browser";

export type DisplayMode = "popup" | "sidebar";

const STORAGE_KEY = "displayMode";

/**
 * Get the current display mode from storage
 */
export async function getDisplayMode(): Promise<DisplayMode> {
	const result = (await browser.storage?.sync.get([STORAGE_KEY])) ?? {};
	return (result[STORAGE_KEY] as DisplayMode | undefined) ?? "popup";
}

/**
 * Set the display mode in storage
 */
export async function setDisplayMode(mode: DisplayMode): Promise<void> {
	await browser.storage?.sync.set({ [STORAGE_KEY]: mode });
}

/**
 * Apply the display mode by updating the extension's action
 * Uses browser compatibility layer for cross-browser support
 */
export async function applyDisplayMode(mode: DisplayMode): Promise<void> {
	console.log(`[DisplayMode] Applying mode: ${mode}`);
	console.log(`[DisplayMode] Browser: ${getBrowserName()}`);
	console.log(`[DisplayMode] Sidebar supported: ${isSidebarSupported()}`);
	console.log(`[DisplayMode] browser.sidePanel:`, Boolean(browser.sidePanel));

	if (mode === "sidebar") {
		// Check if sidebar is supported
		if (!isSidebarSupported()) {
			console.warn(
				`[DisplayMode] Sidebar not supported in ${getBrowserName()}, falling back to popup`
			);
			// Fallback: use sidebar HTML in popup mode
			await browser.action?.setPopup({ popup: "sidepanel.html" });
			return;
		}

		// Enable sidebar using browser-agnostic API
		console.log(`[DisplayMode] Enabling sidebar with path: sidepanel.html`);
		await browser.sidePanel.setOptions({
			enabled: true,
			path: "sidepanel.html",
		});

		// Set panel behavior to open on action click
		if (browser.sidePanel?.setPanelBehavior) {
			console.log(`[DisplayMode] Setting panel behavior to openPanelOnActionClick`);
			try {
				await browser.sidePanel.setPanelBehavior({
					openPanelOnActionClick: true,
				});
				console.log(`[DisplayMode] ✓ Panel behavior set successfully`);
			} catch (error) {
				console.warn(`[DisplayMode] Could not set panel behavior:`, error);
			}
		}

		// Disable popup when sidebar is active - this is CRITICAL for action.onClicked to fire
		console.log(`[DisplayMode] Clearing popup (setting to empty string "")`);
		await browser.action?.setPopup({ popup: "" });

		// Verify the popup was cleared
		const verifyPopup = await browser.action?.getPopup({});
		console.log(`[DisplayMode] Popup after clearing: "${verifyPopup}"`);
		if (verifyPopup && verifyPopup !== "") {
			console.error(`[DisplayMode] ERROR: Popup was NOT cleared! Value: "${verifyPopup}"`);
		} else {
			console.log(`[DisplayMode] ✓ Popup cleared successfully`);
		}
		console.log(`[DisplayMode] Sidebar enabled, popup disabled`);
	} else {
		// Enable popup
		await browser.action?.setPopup({ popup: "popup.html" });
		// Disable sidebar when popup is active
		if (isSidebarSupported()) {
			await browser.sidePanel?.setOptions({
				enabled: false,
			});
		}
		console.log(`[DisplayMode] Popup mode enabled`);
	}
}

/**
 * Initialize display mode on extension startup
 */
export async function initDisplayMode(): Promise<void> {
	const mode = await getDisplayMode();
	await applyDisplayMode(mode);
}
