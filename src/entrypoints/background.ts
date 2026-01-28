import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";

import { cleanupTabState } from "@/logic/parameters";
import { logBrowserInfo } from "@/utils/browser";
import { initDisplayMode } from "@/utils/displayMode";

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
		console.log(`[Background] Received message:`, JSON.stringify(msg));

		if (msg.type === "APPLY_LS") {
			const { tabId, key, value } = msg;
			if (!browser.scripting) {
				sendResponse({
					error: "browser.scripting not available",
					success: false,
				});
				return true;
			}

			browser.scripting
				.executeScript({
					args: [key, value],
					func: (k: string, v: string) => {
						console.log(`[ContentScript] Setting LS (MAIN): ${k}=${v}`);
						localStorage.setItem(k, v);
					},
					target: { tabId },
					world: "MAIN",
				})
				.then(() => sendResponse({ success: true }))
				.catch((error) => sendResponse({ error: error.message, success: false }));
			return true;
		}

		if (msg.type === "REMOVE_LS") {
			const { tabId, key } = msg;
			if (!browser.scripting) {
				sendResponse({
					error: "browser.scripting not available",
					success: false,
				});
				return true;
			}

			browser.scripting
				.executeScript({
					args: [key],
					func: (k: string) => {
						console.log(`[ContentScript] Removing LS (MAIN): ${k}`);
						localStorage.removeItem(k);
					},
					target: { tabId },
					world: "MAIN",
				})
				.then(() => sendResponse({ success: true }))
				.catch((error) => sendResponse({ error: error.message, success: false }));
			return true;
		}

		if (msg.type === "GET_LS") {
			const { tabId, key } = msg;
			if (!browser.scripting) {
				sendResponse({
					error: "browser.scripting not available",
					success: false,
				});
				return true;
			}
			browser.scripting
				.executeScript({
					args: [key],
					func: (k: string) => localStorage.getItem(k),
					target: { tabId },
					world: "MAIN",
				})
				.then((results) => sendResponse({ success: true, value: results[0]?.result }))
				.catch((error) => sendResponse({ error: error.message, success: false }));
			return true;
		}

		sendResponse({ msg, success: true });

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
