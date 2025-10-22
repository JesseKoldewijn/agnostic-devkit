// Background service worker for the extension
import { initDisplayMode } from "~/utils/displayMode";
import { browser, logBrowserInfo, showNotification } from "~/utils/browser";
import { cleanCopyUrlAction } from "~/logic/cleanCopyUrl";
import { ContextMenu } from "~/utils/contextMenu";

const initExtension = async () => {
	// Log browser info for debugging
	logBrowserInfo();
	// Initialize display mode
	await initDisplayMode();

	// Check current popup state
	const popup = await browser.action?.getPopup({});
	console.log("[Background] Current popup after init:", popup);

	// Example: Add a context menu item
	new ContextMenu()
		.mutateContext("add", {
			title: "Clean Copy URL",
			action: cleanCopyUrlAction(),
		})
		.addToChrome();

	console.log("[Background] Context menu item added");
};

browser.runtime?.onInstalled.addListener(async () => {
	console.log("Extension installed");
	initExtension();
});

browser.runtime?.onStartup.addListener(async () => {
	console.log("Extension started up");
	initExtension();
});

// Initialize display mode on startup
browser.runtime?.onStartup.addListener(async () => {
	logBrowserInfo();
	await initDisplayMode();
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
