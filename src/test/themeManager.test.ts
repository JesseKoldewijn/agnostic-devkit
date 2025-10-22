import { describe, it, expect, vi, beforeEach } from "vitest";
import { ThemeManager } from "../utils/browserClasses";

describe("ThemeManager", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getTheme", () => {
		it("should return system as default", async () => {
			vi.mocked(chrome.storage.sync.get).mockResolvedValue({} as any);

			const theme = await ThemeManager.getTheme();

			expect(theme).toBe("system");
		});

		it("should return stored theme", async () => {
			vi.mocked(chrome.storage.sync.get).mockResolvedValue({
				theme: "dark",
			} as any);

			const theme = await ThemeManager.getTheme();

			expect(theme).toBe("dark");
			expect(chrome.storage.sync.get).toHaveBeenCalledWith(["theme"]);
		});

		it("should handle undefined chrome gracefully", async () => {
			const originalChrome = globalThis.chrome;
			// @ts-expect-error - testing undefined case
			globalThis.chrome = undefined;

			const theme = await ThemeManager.getTheme();

			expect(theme).toBe("system");

			globalThis.chrome = originalChrome;
		});
	});

	describe("setTheme", () => {
		it("should store theme", async () => {
			await ThemeManager.setTheme("dark");

			expect(chrome.storage.sync.set).toHaveBeenCalledWith({
				theme: "dark",
			});
		});

		it("should throw error when chrome is undefined", async () => {
			const originalChrome = globalThis.chrome;
			// @ts-expect-error - testing undefined case
			globalThis.chrome = undefined;

			await expect(ThemeManager.setTheme("dark")).rejects.toThrow(
				"Chrome storage API is undefined"
			);

			globalThis.chrome = originalChrome;
		});
	});

	describe("resolveTheme", () => {
		it("should return light when theme is light", () => {
			const resolved = ThemeManager.resolveTheme("light");
			expect(resolved).toBe("light");
		});

		it("should return dark when theme is dark", () => {
			const resolved = ThemeManager.resolveTheme("dark");
			expect(resolved).toBe("dark");
		});

		it("should resolve system to dark when system prefers dark", () => {
			// Mock matchMedia
			Object.defineProperty(globalThis, "matchMedia", {
				writable: true,
				value: vi.fn().mockImplementation((query) => ({
					matches: query === "(prefers-color-scheme: dark)",
					media: query,
					onchange: null,
					addListener: vi.fn(),
					removeListener: vi.fn(),
					addEventListener: vi.fn(),
					removeEventListener: vi.fn(),
					dispatchEvent: vi.fn(),
				})),
			});

			const resolved = ThemeManager.resolveTheme("system");
			expect(resolved).toBe("dark");
		});

		it("should resolve system to light when system prefers light", () => {
			// Mock matchMedia
			Object.defineProperty(globalThis, "matchMedia", {
				writable: true,
				value: vi.fn().mockImplementation(() => ({
					matches: false,
					media: "(prefers-color-scheme: dark)",
					onchange: null,
					addListener: vi.fn(),
					removeListener: vi.fn(),
					addEventListener: vi.fn(),
					removeEventListener: vi.fn(),
					dispatchEvent: vi.fn(),
				})),
			});

			const resolved = ThemeManager.resolveTheme("system");
			expect(resolved).toBe("light");
		});
	});
});
