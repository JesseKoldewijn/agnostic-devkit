import { describe, it, expect, vi, beforeEach } from "vitest";
import { DisplayModeManager } from "../utils/browserClasses";

describe("DisplayModeManager", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getDisplayMode", () => {
		it("should return popup as default", async () => {
			vi.mocked(chrome.storage.sync.get).mockResolvedValue({} as any);

			const mode = await DisplayModeManager.getDisplayMode();

			expect(mode).toBe("popup");
		});

		it("should return stored display mode", async () => {
			vi.mocked(chrome.storage.sync.get).mockResolvedValue({
				displayMode: "sidebar",
			} as any);

			const mode = await DisplayModeManager.getDisplayMode();

			expect(mode).toBe("sidebar");
			expect(chrome.storage.sync.get).toHaveBeenCalledWith([
				"displayMode",
			]);
		});

		it("should handle undefined chrome gracefully", async () => {
			const originalChrome = globalThis.chrome;
			// @ts-expect-error - testing undefined case
			globalThis.chrome = undefined;

			const mode = await DisplayModeManager.getDisplayMode();

			expect(mode).toBe("popup");

			globalThis.chrome = originalChrome;
		});
	});

	describe("setDisplayMode", () => {
		it("should store display mode", async () => {
			await DisplayModeManager.setDisplayMode("sidebar");

			expect(chrome.storage.sync.set).toHaveBeenCalledWith({
				displayMode: "sidebar",
			});
		});

		it("should throw error when chrome is undefined", async () => {
			const originalChrome = globalThis.chrome;
			// @ts-expect-error - testing undefined case
			globalThis.chrome = undefined;

			await expect(
				DisplayModeManager.setDisplayMode("sidebar")
			).rejects.toThrow("Chrome storage API is undefined");

			globalThis.chrome = originalChrome;
		});
	});

	describe("applyDisplayMode", () => {
		it("should configure sidebar mode", async () => {
			await DisplayModeManager.applyDisplayMode("sidebar");

			expect(chrome.sidePanel.setOptions).toHaveBeenCalledWith({
				enabled: true,
				path: "src/sidebar/index.html",
			});
			expect(chrome.sidePanel.setPanelBehavior).toHaveBeenCalledWith({
				openPanelOnActionClick: true,
			});
			expect(chrome.action.setPopup).toHaveBeenCalledWith({ popup: "" });
		});

		it("should configure popup mode", async () => {
			await DisplayModeManager.applyDisplayMode("popup");

			expect(chrome.action.setPopup).toHaveBeenCalledWith({
				popup: "src/popup/index.html",
			});
			expect(chrome.sidePanel.setOptions).toHaveBeenCalledWith({
				enabled: false,
			});
		});

		it("should fallback to popup when sidebar not available", async () => {
			const originalSidePanel = chrome.sidePanel;
			// @ts-expect-error - testing undefined case
			chrome.sidePanel = undefined;

			const consoleSpy = vi
				.spyOn(console, "warn")
				.mockImplementation(() => {});

			await DisplayModeManager.applyDisplayMode("sidebar");

			expect(chrome.action.setPopup).toHaveBeenCalledWith({
				popup: "src/sidebar/index.html",
			});
			expect(consoleSpy).toHaveBeenCalled();

			chrome.sidePanel = originalSidePanel;
			consoleSpy.mockRestore();
		});

		it("should throw error when chrome is undefined", async () => {
			const originalChrome = globalThis.chrome;
			// @ts-expect-error - testing undefined case
			globalThis.chrome = undefined;

			await expect(
				DisplayModeManager.applyDisplayMode("popup")
			).rejects.toThrow("Chrome API is undefined");

			globalThis.chrome = originalChrome;
		});
	});
});
