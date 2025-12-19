import { browser } from "wxt/browser";

/**
 * Browser compatibility wrapper for Chrome Extension APIs
 * Provides a simplified interface that works across Chrome, Brave, Edge, Opera, etc.
 *
 * Usage: Import `browser` from "wxt/browser" instead of using `chrome` directly
 */

/**
 * Get browser name
 */
export function getBrowserName(): string {
	const userAgent = navigator.userAgent;
	if (userAgent.includes("Edg")) return "Edge";
	if (userAgent.includes("OPR") || userAgent.includes("Opera")) return "Opera";
	if ((navigator as any).brave) return "Brave";
	if (userAgent.includes("Chrome")) return "Chrome";
	if (userAgent.includes("Firefox")) return "Firefox";
	if (userAgent.includes("Safari")) return "Safari";
	return "Unknown";
}

/**
 * Check if sidebar/sidePanel is supported
 */
export function isSidebarSupported(): boolean {
	return !!browser.sidePanel;
}

/**
 * Check if notifications are supported
 */
export function isNotificationsSupported(): boolean {
	return browser.notifications?.create !== undefined;
}

/**
 * Log browser information for debugging
 */
export function logBrowserInfo(): void {
	console.log("[Browser] Running in:", getBrowserName());
	console.log("[Browser] Sidebar support:", isSidebarSupported());
	console.log("[Browser] Notifications support:", isNotificationsSupported());
	console.log("[Browser] User agent:", navigator.userAgent);
}

export const isNotificationDisabled = async (): Promise<boolean> => {
	if (!isNotificationsSupported()) return true;

	const result = await browser.storage.sync.get(["notifications"]);
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
	const iconUrl = browser.runtime.getURL("/icons/icon-48.png");
	const options: any = {
		type: "basic",
		iconUrl,
		title,
		message,
	};

	return await browser.notifications.create(undefined as any, options);
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
	const iconUrl = browser.runtime.getURL("/icons/icon-48.png");
	const options: any = {
		type: "basic",
		title,
		iconUrl,
		message,
		buttons,
		requireInteraction: true, // Keep notification visible until user interacts
	};

	return await browser.notifications.create(undefined as any, options);
}
