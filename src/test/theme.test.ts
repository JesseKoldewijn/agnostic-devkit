import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { applyTheme, getEffectiveTheme, getTheme, initTheme, setTheme } from "../utils/theme";

describe("theme utilities", () => {
	let mockMatchMedia: any;
	let mockDocument: { documentElement: { classList: { add: any; remove: any } } };

	beforeEach(() => {
		fakeBrowser.reset();

		// Mock matchMedia
		mockMatchMedia = vi.fn().mockImplementation(() => ({
			addEventListener: vi.fn(),
			addListener: vi.fn(),
			dispatchEvent: vi.fn(),
			matches: false,
			media: "(prefers-color-scheme: dark)",
			onchange: null,
			removeEventListener: vi.fn(),
			removeListener: vi.fn(),
		}));
		Object.defineProperty(globalThis, "matchMedia", {
			value: mockMatchMedia,
			writable: true,
		});

		// Mock document.documentElement
		mockDocument = {
			documentElement: {
				classList: {
					add: vi.fn(),
					remove: vi.fn(),
				},
			},
		};
		Object.defineProperty(globalThis, "document", {
			value: mockDocument,
			writable: true,
		});
	});

	describe("getTheme", () => {
		it("should return system as default when no theme is stored", async () => {
			const theme = await getTheme();
			expect(theme).toBe("system");
		});

		it("should return stored theme", async () => {
			await fakeBrowser.storage.sync.set({ theme: "dark" });
			const theme = await getTheme();
			expect(theme).toBe("dark");
		});

		it("should return light theme when stored", async () => {
			await fakeBrowser.storage.sync.set({ theme: "light" });
			const theme = await getTheme();
			expect(theme).toBe("light");
		});
	});

	describe("setTheme", () => {
		it("should store theme in sync storage", async () => {
			await setTheme("dark");
			const result = await fakeBrowser.storage.sync.get("theme");
			expect(result.theme).toBe("dark");
		});

		it("should store light theme", async () => {
			await setTheme("light");
			const result = await fakeBrowser.storage.sync.get("theme");
			expect(result.theme).toBe("light");
		});

		it("should store system theme", async () => {
			await setTheme("system");
			const result = await fakeBrowser.storage.sync.get("theme");
			expect(result.theme).toBe("system");
		});
	});

	describe("getEffectiveTheme", () => {
		it("should return light when theme is light", () => {
			const effective = getEffectiveTheme("light");
			expect(effective).toBe("light");
		});

		it("should return dark when theme is dark", () => {
			const effective = getEffectiveTheme("dark");
			expect(effective).toBe("dark");
		});

		it("should return dark when system prefers dark", () => {
			mockMatchMedia.mockImplementation(() => ({
				matches: true,
				media: "(prefers-color-scheme: dark)",
			}));

			const effective = getEffectiveTheme("system");
			expect(effective).toBe("dark");
		});

		it("should return light when system prefers light", () => {
			mockMatchMedia.mockImplementation(() => ({
				matches: false,
				media: "(prefers-color-scheme: dark)",
			}));

			const effective = getEffectiveTheme("system");
			expect(effective).toBe("light");
		});
	});

	describe("applyTheme", () => {
		it("should add light class when theme is light", () => {
			applyTheme("light");

			expect(mockDocument.documentElement.classList.remove).toHaveBeenCalledWith("light", "dark");
			expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith("light");
			expect(mockDocument.documentElement.classList.remove).toHaveBeenCalledWith("system");
		});

		it("should add dark class when theme is dark", () => {
			applyTheme("dark");

			expect(mockDocument.documentElement.classList.remove).toHaveBeenCalledWith("light", "dark");
			expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith("dark");
			expect(mockDocument.documentElement.classList.remove).toHaveBeenCalledWith("system");
		});

		it("should add system class when theme is system", () => {
			applyTheme("system");

			expect(mockDocument.documentElement.classList.remove).toHaveBeenCalledWith("light", "dark");
			expect(mockDocument.documentElement.classList.remove).toHaveBeenCalledWith(
				"light",
				"dark",
				"system"
			);
			expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith("system");
		});
	});

	describe("initTheme", () => {
		it("should load and apply theme on init", async () => {
			await fakeBrowser.storage.sync.set({ theme: "dark" });

			await initTheme();

			expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith("dark");
		});

		it("should apply system theme when none stored", async () => {
			await initTheme();

			expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith("system");
		});

		it("should set up system theme change listener", async () => {
			await initTheme();

			// Verify matchMedia was called to set up listener
			expect(mockMatchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
		});

		it("should apply new theme when storage changes", async () => {
			await initTheme();

			// Reset mocks to verify new calls
			mockDocument.documentElement.classList.add.mockClear();
			mockDocument.documentElement.classList.remove.mockClear();

			// Simulate storage change
			await fakeBrowser.storage.sync.set({ theme: "light" });

			// Wait for listener to be called (fake-browser storage is async and triggers listeners)
			// Wait a tick
			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith("light");
		});

		it("should ignore storage changes for other keys", async () => {
			await initTheme();

			mockDocument.documentElement.classList.add.mockClear();
			mockDocument.documentElement.classList.remove.mockClear();

			// Simulate storage change for different key
			await fakeBrowser.storage.sync.set({ otherKey: "value" });
			await new Promise((resolve) => setTimeout(resolve, 0));

			// Should not have been called again
			expect(mockDocument.documentElement.classList.add).not.toHaveBeenCalled();
		});

		it("should ignore storage changes from local area", async () => {
			await initTheme();

			mockDocument.documentElement.classList.add.mockClear();
			mockDocument.documentElement.classList.remove.mockClear();

			// Simulate storage change from local
			await fakeBrowser.storage.local.set({ theme: "dark" });
			await new Promise((resolve) => setTimeout(resolve, 0));

			// Should not have been called again
			expect(mockDocument.documentElement.classList.add).not.toHaveBeenCalled();
		});
	});
});
