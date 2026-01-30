import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";

import {
	getBrowserName,
	isNotificationDisabled,
	isNotificationsSupported,
	isSidebarSupported,
	logBrowserInfo,
	showNotification,
	showNotificationWithButtons,
} from "@/utils/browser";

describe("browser utilities", () => {
	let consoleLogSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		fakeBrowser.reset();
		// fake-browser might not have sidePanel by default
		(fakeBrowser as unknown as { sidePanel: object }).sidePanel = {};

		consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "warn").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	describe("getBrowserName", () => {
		it("should return Chrome for Chrome browser", () => {
			Object.defineProperty(navigator, "userAgent", {
				configurable: true,
				value: "Chrome/120.0.0.0",
			});
			(navigator as unknown as { brave: undefined }).brave = undefined;

			expect(getBrowserName()).toBe("Chrome");
		});

		it("should return Edge for Edge browser", () => {
			Object.defineProperty(navigator, "userAgent", {
				configurable: true,
				value: "Chrome/120.0.0.0 Edg/120.0.0.0",
			});
			(navigator as unknown as { brave: undefined }).brave = undefined;

			expect(getBrowserName()).toBe("Edge");
		});

		it("should return Opera for Opera browser", () => {
			Object.defineProperty(navigator, "userAgent", {
				configurable: true,
				value: "Chrome/120.0.0.0 OPR/105.0.0.0",
			});
			(navigator as unknown as { brave: undefined }).brave = undefined;

			expect(getBrowserName()).toBe("Opera");
		});

		it("should return Brave for Brave browser", () => {
			Object.defineProperty(navigator, "userAgent", {
				configurable: true,
				value: "Chrome/120.0.0.0",
			});
			(navigator as unknown as { brave: object }).brave = { isBrave: () => true };

			expect(getBrowserName()).toBe("Brave");
		});

		it("should return Unknown for unrecognized browser", () => {
			Object.defineProperty(navigator, "userAgent", {
				configurable: true,
				value: "Mozilla/5.0 InternetExplorer/11.0",
			});
			(navigator as unknown as { brave: undefined }).brave = undefined;

			expect(getBrowserName()).toBe("Unknown");
		});
	});

	describe("isSidebarSupported", () => {
		it("should return true when sidePanel is available", () => {
			expect(isSidebarSupported()).toBeTruthy();
		});

		it("should return false when sidePanel is not available", () => {
			const originalSidePanel = fakeBrowser.sidePanel;
			(fakeBrowser as unknown as { sidePanel: undefined }).sidePanel = undefined;

			expect(isSidebarSupported()).toBeFalsy();

			(fakeBrowser as unknown as { sidePanel: typeof originalSidePanel }).sidePanel =
				originalSidePanel;
		});
	});

	describe("isNotificationsSupported", () => {
		it("should return true when notifications.create is defined", () => {
			expect(isNotificationsSupported()).toBeTruthy();
		});
	});

	describe("logBrowserInfo", () => {
		it("should log browser information", () => {
			Object.defineProperty(navigator, "userAgent", {
				configurable: true,
				value: "Chrome/120.0.0.0",
			});
			(navigator as unknown as { brave: undefined }).brave = undefined;

			logBrowserInfo();

			expect(consoleLogSpy).toHaveBeenCalledWith("[Browser] Running in:", "Chrome");
			expect(consoleLogSpy).toHaveBeenCalledWith("[Browser] Sidebar support:", true);
			expect(consoleLogSpy).toHaveBeenCalledWith("[Browser] Notifications support:", true);
		});
	});

	describe("isNotificationDisabled", () => {
		it("should return true when notifications support is not available", async () => {
			// Temporarily hide notifications
			const originalNotifications = fakeBrowser.notifications;
			(fakeBrowser as unknown as { notifications: undefined }).notifications = undefined;

			const disabled = await isNotificationDisabled();
			expect(disabled).toBeTruthy();

			// Restore
			(fakeBrowser as unknown as { notifications: typeof originalNotifications }).notifications =
				originalNotifications;
		});

		it("should return true when notifications are disabled in settings", async () => {
			await fakeBrowser.storage.sync.set({ notifications: false });

			const disabled = await isNotificationDisabled();
			expect(disabled).toBeTruthy();
		});

		it("should return false when notifications are enabled", async () => {
			await fakeBrowser.storage.sync.set({ notifications: true });

			const disabled = await isNotificationDisabled();
			expect(disabled).toBeFalsy();
		});

		it("should return false when notifications setting is not set", async () => {
			const disabled = await isNotificationDisabled();
			expect(disabled).toBeFalsy();
		});
	});

	describe("showNotification", () => {
		it("should create a notification", async () => {
			await fakeBrowser.storage.sync.set({ notifications: true });

			const createSpy = vi.spyOn(fakeBrowser.notifications, "create");
			await showNotification("Test Title", "Test message");

			expect(createSpy).toHaveBeenCalledWith(
				undefined,
				expect.objectContaining({
					message: "Test message",
					title: "Test Title",
					type: "basic",
				})
			);
		});

		it("should return empty string when notifications are disabled", async () => {
			await fakeBrowser.storage.sync.set({ notifications: false });

			const createSpy = vi.spyOn(fakeBrowser.notifications, "create");
			const id = await showNotification("Test", "Message");

			expect(id).toBe("");
			expect(createSpy).not.toHaveBeenCalled();
		});

		it("should show notification when force is true even if disabled", async () => {
			await fakeBrowser.storage.sync.set({ notifications: false });

			const createSpy = vi.spyOn(fakeBrowser.notifications, "create");
			await showNotification("Test", "Message", true);

			expect(createSpy).toHaveBeenCalledWith(
				undefined,
				expect.objectContaining({
					message: "Message",
					title: "Test",
					type: "basic",
				})
			);
		});
	});

	describe("showNotificationWithButtons", () => {
		it("should create a notification with buttons", async () => {
			await fakeBrowser.storage.sync.set({ notifications: true });

			const createSpy = vi.spyOn(fakeBrowser.notifications, "create");
			await showNotificationWithButtons("Test Title", "Test message", [
				{ title: "Button 1" },
				{ title: "Button 2" },
			]);

			expect(createSpy).toHaveBeenCalledWith(
				undefined,
				expect.objectContaining({
					buttons: [{ title: "Button 1" }, { title: "Button 2" }],
					message: "Test message",
					requireInteraction: true,
					title: "Test Title",
					type: "basic",
				})
			);
		});
	});
});
