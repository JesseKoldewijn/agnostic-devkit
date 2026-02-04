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
	if (userAgent.includes("Edg")) {
		return "Edge";
	}
	if (userAgent.includes("OPR") || userAgent.includes("Opera")) {
		return "Opera";
	}
	if ((navigator as unknown as { brave?: object }).brave) {
		return "Brave";
	}
	if (userAgent.includes("Chrome")) {
		return "Chrome";
	}
	if (userAgent.includes("Firefox")) {
		return "Firefox";
	}
	if (userAgent.includes("Safari")) {
		return "Safari";
	}
	return "Unknown";
}

/**
 * Check if sidebar/sidePanel is supported
 */
export function isSidebarSupported(): boolean {
	return Boolean(browser.sidePanel);
}

/**
 * Check if notifications are supported
 */
export function isNotificationsSupported(): boolean {
	return browser.notifications?.create != null;
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
	if (!isNotificationsSupported()) {
		return true;
	}

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
	if ((await isNotificationDisabled()) && !force) {
		return "";
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- WXT's browser.runtime type is missing getURL
	const iconUrl = (browser.runtime as any).getURL("/icons/icon-48.png");
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- notification options are complex
	const options: any = {
		iconUrl,
		message,
		title,
		type: "basic",
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- notifications.create expects string or undefined as first arg
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
	if ((await isNotificationDisabled()) && !force) {
		return "";
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- WXT's browser.runtime type is missing getURL
	const iconUrl = (browser.runtime as any).getURL("/icons/icon-48.png");
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- notification options are complex
	const options: any = {
		buttons,
		iconUrl,
		message,
		requireInteraction: true,
		title,
		type: "basic", // Keep notification visible until user interacts
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- notifications.create expects string or undefined as first arg
	return await browser.notifications.create(undefined as any, options);
}
