import { initDisplayMode } from "@/utils/displayMode";
import { browser } from "wxt/browser";
import { logBrowserInfo, showNotification } from "@/utils/browser";
import { cleanupTabState } from "@/logic/parameters";

export default defineBackground(() => {
	browser.runtime?.onInstalled.addListener(async () => {
		console.log("Extension installed");
		// Log browser info for debugging
		logBrowserInfo();
		// Initialize display mode
		await initDisplayMode();

		// Check current popup state
		const popup = await browser.action?.getPopup({});
		console.log("[Background] Current popup after init:", popup);
	});

	// Initialize display mode on startup
	browser.runtime?.onStartup.addListener(async () => {
		logBrowserInfo();
		await initDisplayMode();

		// Check current popup state
		const popup = await browser.action?.getPopup({});
		console.log("[Background] Current popup after init:", popup);
	});

	browser.runtime?.onMessage.addListener((msg, _sender, sendResponse) => {
		// Handle context menu actions
		sendResponse({ success: true, msg });

		return true;
	});

	// Listen for changes to display mode and re-apply
	browser.storage?.onChanged.addListener((changes, areaName) => {
		console.log("[Background] Storage changed:", areaName, changes);
		if (areaName === "sync" && changes.displayMode) {
			console.log(
				"[Background] Display mode changed:",
				changes.displayMode.oldValue,
				"->",
				changes.displayMode.newValue
			);
			// Re-initialize display mode when it changes
			initDisplayMode();
		}
	});

	// Example: Listen for tab updates
	browser.tabs?.onUpdated.addListener((_tabId, changeInfo, tab) => {
		if (changeInfo.status === "complete" && tab.url) {
			console.log("Tab updated:", tab.url);
			// send a browser notification
			showNotification("Tab Updated", `You have opened: ${tab.url}`);
		}
	});

	// Clean up tab preset states when tabs are closed
	browser.tabs?.onRemoved.addListener(async (tabId, _removeInfo) => {
		console.log("[Background] Tab closed, cleaning up preset state:", tabId);
		try {
			await cleanupTabState(tabId);
		} catch (error) {
			console.error("[Background] Failed to cleanup tab state:", error);
		}
	});
});

