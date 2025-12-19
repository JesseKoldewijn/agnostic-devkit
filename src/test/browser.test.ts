import { describe, it, expect, vi, beforeEach } from "vitest";
import {
	isSidebarSupported,
	isNotificationsSupported,
	logBrowserInfo,
	isNotificationDisabled,
	showNotification,
	showNotificationWithButtons,
	getBrowserName,
} from "../utils/browser";
import { fakeBrowser } from "wxt/testing/fake-browser";

describe("browser utilities", () => {
	let consoleLogSpy: any;

	beforeEach(() => {
		fakeBrowser.reset();
		// fake-browser might not have sidePanel by default
		(fakeBrowser as any).sidePanel = {};
		
		consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "warn").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	describe("getBrowserName", () => {
		it("should return Chrome for Chrome browser", () => {
			Object.defineProperty(navigator, "userAgent", {
				value: "Chrome/120.0.0.0",
				configurable: true,
			});
			(navigator as any).brave = undefined;

			expect(getBrowserName()).toBe("Chrome");
		});

		it("should return Edge for Edge browser", () => {
			Object.defineProperty(navigator, "userAgent", {
				value: "Chrome/120.0.0.0 Edg/120.0.0.0",
				configurable: true,
			});
			(navigator as any).brave = undefined;

			expect(getBrowserName()).toBe("Edge");
		});

		it("should return Opera for Opera browser", () => {
			Object.defineProperty(navigator, "userAgent", {
				value: "Chrome/120.0.0.0 OPR/105.0.0.0",
				configurable: true,
			});
			(navigator as any).brave = undefined;

			expect(getBrowserName()).toBe("Opera");
		});

		it("should return Brave for Brave browser", () => {
			Object.defineProperty(navigator, "userAgent", {
				value: "Chrome/120.0.0.0",
				configurable: true,
			});
			(navigator as any).brave = { isBrave: () => true };

			expect(getBrowserName()).toBe("Brave");
		});

		it("should return Unknown for unrecognized browser", () => {
			Object.defineProperty(navigator, "userAgent", {
				value: "Mozilla/5.0 InternetExplorer/11.0",
				configurable: true,
			});
			(navigator as any).brave = undefined;

			expect(getBrowserName()).toBe("Unknown");
		});
	});

	describe("isSidebarSupported", () => {
		it("should return true when sidePanel is available", () => {
			expect(isSidebarSupported()).toBe(true);
		});

		it("should return false when sidePanel is not available", () => {
			const originalSidePanel = fakeBrowser.sidePanel;
			(fakeBrowser as any).sidePanel = undefined;
			
			expect(isSidebarSupported()).toBe(false);
			
			(fakeBrowser as any).sidePanel = originalSidePanel;
		});
	});

	describe("isNotificationsSupported", () => {
		it("should return true when notifications.create is defined", () => {
			expect(isNotificationsSupported()).toBe(true);
		});
	});

	describe("logBrowserInfo", () => {
		it("should log browser information", () => {
			Object.defineProperty(navigator, "userAgent", {
				value: "Chrome/120.0.0.0",
				configurable: true,
			});
			(navigator as any).brave = undefined;

			logBrowserInfo();

			expect(consoleLogSpy).toHaveBeenCalledWith(
				"[Browser] Running in:",
				"Chrome"
			);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				"[Browser] Sidebar support:",
				true
			);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				"[Browser] Notifications support:",
				true
			);
		});
	});

	describe("isNotificationDisabled", () => {
		it("should return true when notifications support is not available", async () => {
			// Temporarily hide notifications
			const originalNotifications = fakeBrowser.notifications;
			(fakeBrowser as any).notifications = undefined;

			const disabled = await isNotificationDisabled();
			expect(disabled).toBe(true);

			// Restore
			(fakeBrowser as any).notifications = originalNotifications;
		});

		it("should return true when notifications are disabled in settings", async () => {
			await fakeBrowser.storage.sync.set({ notifications: false });

			const disabled = await isNotificationDisabled();
			expect(disabled).toBe(true);
		});

		it("should return false when notifications are enabled", async () => {
			await fakeBrowser.storage.sync.set({ notifications: true });

			const disabled = await isNotificationDisabled();
			expect(disabled).toBe(false);
		});

		it("should return false when notifications setting is not set", async () => {
			const disabled = await isNotificationDisabled();
			expect(disabled).toBe(false);
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
					type: "basic",
					title: "Test Title",
					message: "Test message",
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

			expect(createSpy).toHaveBeenCalled();
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
					type: "basic",
					title: "Test Title",
					message: "Test message",
					buttons: [{ title: "Button 1" }, { title: "Button 2" }],
					requireInteraction: true,
				})
			);
		});
	});
});
