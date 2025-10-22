import { describe, it, expect, vi, beforeEach } from "vitest";
import { SidePanelManager } from "../utils/browserClasses";

describe("SidePanelManager", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("isAvailable", () => {
		it("should return true when chrome.sidePanel is available", () => {
			expect(SidePanelManager.isAvailable()).toBe(true);
		});

		it("should return false when chrome is undefined", () => {
			const originalChrome = globalThis.chrome;
			// @ts-expect-error - testing undefined case
			globalThis.chrome = undefined;

			expect(SidePanelManager.isAvailable()).toBe(false);

			globalThis.chrome = originalChrome;
		});
	});

	describe("setOptions", () => {
		it("should call chrome.sidePanel.setOptions with correct options", async () => {
			const options = { enabled: true, path: "test.html" };

			await SidePanelManager.setOptions(options);

			expect(chrome.sidePanel.setOptions).toHaveBeenCalledWith(options);
		});

		it("should handle missing sidePanel API gracefully", async () => {
			const originalSidePanel = chrome.sidePanel;
			// @ts-expect-error - testing undefined case
			chrome.sidePanel = undefined;

			const consoleSpy = vi
				.spyOn(console, "warn")
				.mockImplementation(() => {});

			await SidePanelManager.setOptions({ enabled: true });

			expect(consoleSpy).toHaveBeenCalledWith(
				"[SidePanel] API not available in this browser"
			);

			chrome.sidePanel = originalSidePanel;
			consoleSpy.mockRestore();
		});
	});

	describe("setPanelBehavior", () => {
		it("should call chrome.sidePanel.setPanelBehavior", async () => {
			const behavior = { openPanelOnActionClick: true };

			await SidePanelManager.setPanelBehavior(behavior);

			expect(chrome.sidePanel.setPanelBehavior).toHaveBeenCalledWith(
				behavior
			);
		});

		it("should handle missing setPanelBehavior gracefully", async () => {
			const originalSetPanelBehavior = chrome.sidePanel.setPanelBehavior;
			// @ts-expect-error - testing undefined case
			chrome.sidePanel.setPanelBehavior = undefined;

			const consoleSpy = vi
				.spyOn(console, "warn")
				.mockImplementation(() => {});

			await SidePanelManager.setPanelBehavior({
				openPanelOnActionClick: true,
			});

			expect(consoleSpy).toHaveBeenCalledWith(
				"[SidePanel] setPanelBehavior not available"
			);

			chrome.sidePanel.setPanelBehavior = originalSetPanelBehavior;
			consoleSpy.mockRestore();
		});
	});

	describe("open", () => {
		it("should call chrome.sidePanel.open with windowId", async () => {
			const options = { windowId: 123 };

			await SidePanelManager.open(options);

			expect(chrome.sidePanel.open).toHaveBeenCalledWith({
				windowId: 123,
			});
		});

		it("should call chrome.sidePanel.open without windowId", async () => {
			await SidePanelManager.open();

			expect(chrome.sidePanel.open).toHaveBeenCalledWith({});
		});

		it("should throw error when chrome is undefined", async () => {
			const originalChrome = globalThis.chrome;
			// @ts-expect-error - testing undefined case
			globalThis.chrome = undefined;

			await expect(SidePanelManager.open()).rejects.toThrow(
				"Chrome API is undefined"
			);

			globalThis.chrome = originalChrome;
		});

		it("should throw error when sidebar API is not available", async () => {
			const originalOpen = chrome.sidePanel.open;
			// @ts-expect-error - testing undefined case
			chrome.sidePanel.open = undefined;

			await expect(SidePanelManager.open()).rejects.toThrow(
				"Sidebar API not available"
			);

			chrome.sidePanel.open = originalOpen;
		});
	});

	describe("getOptions", () => {
		it("should call chrome.sidePanel.getOptions", async () => {
			const mockResult = { enabled: true };
			vi.mocked(chrome.sidePanel.getOptions).mockResolvedValue(
				mockResult as any
			);

			const result = await SidePanelManager.getOptions({ tabId: 123 });

			expect(chrome.sidePanel.getOptions).toHaveBeenCalledWith({
				tabId: 123,
			});
			expect(result).toEqual({ enabled: true });
		});

		it("should return null when getOptions is not available", async () => {
			const originalGetOptions = chrome.sidePanel.getOptions;
			// @ts-expect-error - testing undefined case
			chrome.sidePanel.getOptions = undefined;

			const result = await SidePanelManager.getOptions();

			expect(result).toBeNull();

			chrome.sidePanel.getOptions = originalGetOptions;
		});
	});
});
