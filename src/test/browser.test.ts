import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
	browser,
	isSidebarSupported,
	isNotificationsSupported,
	logBrowserInfo,
	isNotificationDisabled,
	showNotification,
	showNotificationWithButtons,
} from "../utils/browser";

describe("browser utilities", () => {
	let mockSyncStorage: Record<string, any>;
	let consoleLogSpy: any;

	beforeEach(() => {
		mockSyncStorage = {};
		consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "warn").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});

		// Mock chrome.storage.sync.get
		(globalThis.chrome.storage.sync.get as any).mockImplementation(
			async (keys: string[]) => {
				const result: Record<string, any> = {};
				for (const key of keys) {
					if (mockSyncStorage[key] !== undefined) {
						result[key] = mockSyncStorage[key];
					}
				}
				return result;
			}
		);

		// Mock chrome.notifications
		(globalThis.chrome.notifications as any).create = vi.fn(
			async (id: any, _options: any) => id || "notification-id"
		);
		(globalThis.chrome.notifications as any).getPermissionLevel = vi.fn();

		// Mock chrome.runtime.getURL
		(globalThis.chrome.runtime as any).getURL = vi.fn(
			(path: string) => `chrome-extension://test-id/${path}`
		);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("browser object", () => {
		describe("browser.is", () => {
			it("should detect Chrome browser", () => {
				Object.defineProperty(navigator, "userAgent", {
					value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
					configurable: true,
				});
				(navigator as any).brave = undefined;

				expect(browser.is.chrome()).toBe(true);
				expect(browser.is.edge()).toBe(false);
				expect(browser.is.opera()).toBe(false);
				expect(browser.is.brave()).toBe(false);
			});

			it("should detect Edge browser", () => {
				Object.defineProperty(navigator, "userAgent", {
					value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
					configurable: true,
				});
				(navigator as any).brave = undefined;

				expect(browser.is.edge()).toBe(true);
				expect(browser.is.chrome()).toBe(false);
			});

			it("should detect Opera browser", () => {
				Object.defineProperty(navigator, "userAgent", {
					value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/105.0.0.0",
					configurable: true,
				});
				(navigator as any).brave = undefined;

				expect(browser.is.opera()).toBe(true);
				expect(browser.is.chrome()).toBe(false);
			});

			it("should detect Brave browser", () => {
				Object.defineProperty(navigator, "userAgent", {
					value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
					configurable: true,
				});
				(navigator as any).brave = { isBrave: () => true };

				expect(browser.is.brave()).toBe(true);
				expect(browser.is.chrome()).toBe(false);
			});
		});

		describe("browser.getBrowserName", () => {
			it("should return Chrome for Chrome browser", () => {
				Object.defineProperty(navigator, "userAgent", {
					value: "Chrome/120.0.0.0",
					configurable: true,
				});
				(navigator as any).brave = undefined;

				expect(browser.getBrowserName()).toBe("Chrome");
			});

			it("should return Edge for Edge browser", () => {
				Object.defineProperty(navigator, "userAgent", {
					value: "Chrome/120.0.0.0 Edg/120.0.0.0",
					configurable: true,
				});
				(navigator as any).brave = undefined;

				expect(browser.getBrowserName()).toBe("Edge");
			});

			it("should return Opera for Opera browser", () => {
				Object.defineProperty(navigator, "userAgent", {
					value: "Chrome/120.0.0.0 OPR/105.0.0.0",
					configurable: true,
				});
				(navigator as any).brave = undefined;

				expect(browser.getBrowserName()).toBe("Opera");
			});

			it("should return Brave for Brave browser", () => {
				Object.defineProperty(navigator, "userAgent", {
					value: "Chrome/120.0.0.0",
					configurable: true,
				});
				(navigator as any).brave = { isBrave: () => true };

				expect(browser.getBrowserName()).toBe("Brave");
			});

			it("should return Unknown for unrecognized browser", () => {
				Object.defineProperty(navigator, "userAgent", {
					value: "Mozilla/5.0 Firefox/120.0",
					configurable: true,
				});
				(navigator as any).brave = undefined;

				expect(browser.getBrowserName()).toBe("Unknown");
			});
		});

		describe("browser.sidePanel", () => {
			it("should check sidePanel availability", () => {
				expect(browser.sidePanel.isAvailable()).toBe(true);
			});

			it("should set sidePanel options", async () => {
				await browser.sidePanel.setOptions({
					enabled: true,
					path: "sidebar.html",
				});
				expect(chrome.sidePanel.setOptions).toHaveBeenCalledWith({
					enabled: true,
					path: "sidebar.html",
				});
			});

			it("should get sidePanel options", async () => {
				(chrome.sidePanel.getOptions as any).mockResolvedValue({
					enabled: true,
				});
				const options = await browser.sidePanel.getOptions();
				expect(options).toEqual({ enabled: true });
			});

			it("should open sidePanel", async () => {
				(chrome.sidePanel.open as any).mockResolvedValue(undefined);
				await browser.sidePanel.open();
				expect(chrome.sidePanel.open).toHaveBeenCalled();
			});

			it("should open sidePanel with tabId", async () => {
				(chrome.sidePanel.open as any).mockResolvedValue(undefined);
				await browser.sidePanel.open({ tabId: 123 });
				expect(chrome.sidePanel.open).toHaveBeenCalledWith({
					tabId: 123,
				});
			});

			it("should handle sidePanel open errors", async () => {
				const error = new Error("Open failed");
				(chrome.sidePanel.open as any).mockRejectedValue(error);

				await expect(browser.sidePanel.open()).rejects.toThrow(
					"Open failed"
				);
			});
		});
	});

	describe("isSidebarSupported", () => {
		it("should return true when sidePanel is available", () => {
			expect(isSidebarSupported()).toBe(true);
		});
	});

	describe("isNotificationsSupported", () => {
		it("should return true when notifications.getPermissionLevel is defined", () => {
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
			expect(consoleLogSpy).toHaveBeenCalledWith(
				"[Browser] User agent:",
				expect.any(String)
			);
		});
	});

	describe("isNotificationDisabled", () => {
		it("should return true when notifications support is not available", async () => {
			(globalThis.chrome.notifications as any).getPermissionLevel =
				undefined;

			const disabled = await isNotificationDisabled();
			expect(disabled).toBe(true);
		});

		it("should return true when notifications are disabled in settings", async () => {
			mockSyncStorage.notifications = false;

			const disabled = await isNotificationDisabled();
			expect(disabled).toBe(true);
		});

		it("should return false when notifications are enabled", async () => {
			mockSyncStorage.notifications = true;

			const disabled = await isNotificationDisabled();
			expect(disabled).toBe(false);
		});

		it("should return false when notifications setting is not set", async () => {
			// No notifications key in storage
			const disabled = await isNotificationDisabled();
			expect(disabled).toBe(false);
		});
	});

	describe("showNotification", () => {
		it("should create a notification", async () => {
			mockSyncStorage.notifications = true;

			await showNotification("Test Title", "Test message");

			expect(chrome.notifications.create).toHaveBeenCalledWith(
				undefined,
				{
					type: "basic",
					iconUrl: expect.stringContaining("icon-48.png"),
					title: "Test Title",
					message: "Test message",
				}
			);
		});

		it("should return empty string when notifications are disabled", async () => {
			mockSyncStorage.notifications = false;

			const id = await showNotification("Test", "Message");

			expect(id).toBe("");
			expect(chrome.notifications.create).not.toHaveBeenCalled();
		});

		it("should show notification when force is true even if disabled", async () => {
			mockSyncStorage.notifications = false;

			await showNotification("Test", "Message", true);

			expect(chrome.notifications.create).toHaveBeenCalled();
		});
	});

	describe("showNotificationWithButtons", () => {
		it("should create a notification with buttons", async () => {
			mockSyncStorage.notifications = true;

			await showNotificationWithButtons("Test Title", "Test message", [
				{ title: "Button 1" },
				{ title: "Button 2" },
			]);

			expect(chrome.notifications.create).toHaveBeenCalledWith(
				undefined,
				{
					type: "basic",
					iconUrl: expect.stringContaining("icon-48.png"),
					title: "Test Title",
					message: "Test message",
					buttons: [{ title: "Button 1" }, { title: "Button 2" }],
					requireInteraction: true,
				}
			);
		});

		it("should return empty string when notifications are disabled", async () => {
			mockSyncStorage.notifications = false;

			const id = await showNotificationWithButtons("Test", "Message", [
				{ title: "Button" },
			]);

			expect(id).toBe("");
			expect(chrome.notifications.create).not.toHaveBeenCalled();
		});

		it("should show notification when force is true even if disabled", async () => {
			mockSyncStorage.notifications = false;

			await showNotificationWithButtons(
				"Test",
				"Message",
				[{ title: "Button" }],
				true
			);

			expect(chrome.notifications.create).toHaveBeenCalled();
		});
	});
});
