/**
 * Browser compatibility wrapper for Chrome Extension APIs
 * Provides a simplified interface that works across Chrome, Brave, Edge, Opera, etc.
 *
 * Usage: Import `browser` instead of using `chrome` directly
 * Example: browser.sidePanel.setOptions(...) instead of chrome.sidePanel.setOptions(...)
 */

/**
 * Cross-browser compatible sidePanel/sidebar API
 */
const sidePanel = {
	/**
	 * Check if any sidebar API is available
	 */
	isAvailable(): boolean {
		if (typeof chrome === "undefined") return false;
		return !!chrome.sidePanel;
	},

	/**
	 * Set sidebar panel options (enable/disable, set path)
	 */
	async setOptions(options: {
		enabled?: boolean;
		path?: string;
	}): Promise<void> {
		// Try modern API first (Chrome 114+, modern Brave/Edge)
		if (chrome.sidePanel) {
			await chrome.sidePanel.setOptions(options);
		} else {
			console.warn(
				"[Browser] sidePanel API not available in this browser"
			);
		}
	},

	/**
	 * Open the sidebar programmatically
	 */
	async open(options?: { tabId?: number }) {
		try {
			await chrome.sidePanel.open(
				(options || {}) as chrome.sidePanel.OpenOptions
			);
		} catch (error) {
			console.error("[Browser] chrome.sidePanel.open() failed:", error);
			// Log more details about the error
			if (error instanceof Error) {
				console.error("[Browser] Error message:", error.message);
				console.error("[Browser] Error stack:", error.stack);
			}
			throw error;
		}
	},

	/**
	 * Get sidebar options
	 */
	async getOptions(options?: { tabId?: number }): Promise<any> {
		if (chrome.sidePanel?.getOptions) {
			return await chrome.sidePanel.getOptions(options || {});
		}
		return null;
	},
};

/**
 * Browser-agnostic extension API wrapper
 * Use this instead of the global `chrome` object for better compatibility
 */
export const browser = {
	// Pass-through for standard APIs that work everywhere
	storage: typeof chrome === "undefined" ? undefined : chrome.storage,
	runtime: typeof chrome === "undefined" ? undefined : chrome.runtime,
	tabs: typeof chrome === "undefined" ? undefined : chrome.tabs,
	windows: typeof chrome === "undefined" ? undefined : chrome.windows,
	action: typeof chrome === "undefined" ? undefined : chrome.action,
	sidePanel,

	/**
	 * Check if we're running in a specific browser
	 */
	is: {
		chrome(): boolean {
			return (
				/Chrome/.test(navigator.userAgent) &&
				!/Edg|OPR/.test(navigator.userAgent) &&
				!(navigator as any).brave
			);
		},
		brave(): boolean {
			return !!(navigator as any).brave;
		},
		edge(): boolean {
			return /Edg/.test(navigator.userAgent);
		},
		opera(): boolean {
			return /OPR/.test(navigator.userAgent);
		},
	},

	/**
	 * Get browser name
	 */
	getBrowserName(): string {
		if (this.is.brave()) return "Brave";
		if (this.is.edge()) return "Edge";
		if (this.is.opera()) return "Opera";
		if (this.is.chrome()) return "Chrome";
		return "Unknown";
	},
};

/**
 * Check if sidebar/sidePanel is supported
 */
export function isSidebarSupported(): boolean {
	return browser.sidePanel.isAvailable();
}

/**
 * Check if notifications are supported
 */
export function isNotificationsSupported(): boolean {
	return chrome.notifications?.getPermissionLevel !== undefined;
}

/**
 * Log browser information for debugging
 */
export function logBrowserInfo(): void {
	console.log("[Browser] Running in:", browser.getBrowserName());
	console.log("[Browser] Sidebar support:", isSidebarSupported());
	console.log("[Browser] Notifications support:", isNotificationsSupported());
	console.log("[Browser] User agent:", navigator.userAgent);
}

export const isNotificationDisabled = async (): Promise<boolean> => {
	if (!isNotificationsSupported()) return true;

	const result = await browser.storage?.sync.get(["notifications"]);
	return result?.notifications === false;
};

/**
 * Helper: Show a simple notification with sensible defaults
 */
export async function showNotification(
	title: string,
	message: string,
	force?: boolean
): Promise<string> {
	if ((await isNotificationDisabled()) && !force) return "";
	const iconUrl = chrome.runtime.getURL("./icons/icon-48.png");
	const options: chrome.notifications.NotificationCreateOptions = {
		type: "basic",
		iconUrl,
		title,
		message,
	};

	return await chrome.notifications.create(undefined as any, options);
}

/**
 * Helper: Show a notification with action buttons
 */
export async function showNotificationWithButtons(
	title: string,
	message: string,
	buttons: { title: string }[],
	force?: boolean
): Promise<string> {
	if ((await isNotificationDisabled()) && !force) return "";
	const iconUrl = chrome.runtime.getURL("./icons/icon-48.png");
	const options: chrome.notifications.NotificationCreateOptions = {
		type: "basic",
		title,
		iconUrl,
		message,
		buttons,
		requireInteraction: true, // Keep notification visible until user interacts
	};

	return await chrome.notifications.create(undefined as any, options);
}

// Export testable classes for use in other modules and tests
export {
	BrowserDetector,
	SidePanelManager,
	DisplayModeManager,
	ThemeManager,
} from "./browserClasses";
