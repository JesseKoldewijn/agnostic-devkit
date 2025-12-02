import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
	getTheme,
	setTheme,
	getEffectiveTheme,
	applyTheme,
	initTheme,
} from "../utils/theme";

describe("theme utilities", () => {
	let mockSyncStorage: Record<string, any>;
	let mockMatchMedia: any;
	let mockDocument: { documentElement: { classList: { add: any; remove: any } } };
	let storageChangeListeners: Array<(changes: any, areaName: string) => void>;

	beforeEach(() => {
		mockSyncStorage = {};
		storageChangeListeners = [];

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

		// Mock chrome.storage.sync.set
		(globalThis.chrome.storage.sync.set as any).mockImplementation(
			async (data: Record<string, any>) => {
				Object.assign(mockSyncStorage, data);
			}
		);

		// Mock storage.onChanged
		(globalThis.chrome.storage.onChanged.addListener as any).mockImplementation(
			(listener: (changes: any, areaName: string) => void) => {
				storageChangeListeners.push(listener);
			}
		);

		// Mock matchMedia
		mockMatchMedia = vi.fn().mockImplementation(() => ({
			matches: false,
			media: "(prefers-color-scheme: dark)",
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		}));
		Object.defineProperty(globalThis, "matchMedia", {
			writable: true,
			value: mockMatchMedia,
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
			writable: true,
			value: mockDocument,
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("getTheme", () => {
		it("should return system as default when no theme is stored", async () => {
			const theme = await getTheme();
			expect(theme).toBe("system");
		});

		it("should return stored theme", async () => {
			mockSyncStorage.theme = "dark";
			const theme = await getTheme();
			expect(theme).toBe("dark");
		});

		it("should return light theme when stored", async () => {
			mockSyncStorage.theme = "light";
			const theme = await getTheme();
			expect(theme).toBe("light");
		});
	});

	describe("setTheme", () => {
		it("should store theme in sync storage", async () => {
			await setTheme("dark");
			expect(mockSyncStorage.theme).toBe("dark");
		});

		it("should store light theme", async () => {
			await setTheme("light");
			expect(mockSyncStorage.theme).toBe("light");
		});

		it("should store system theme", async () => {
			await setTheme("system");
			expect(mockSyncStorage.theme).toBe("system");
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

			expect(mockDocument.documentElement.classList.remove).toHaveBeenCalledWith(
				"light",
				"dark"
			);
			expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith(
				"light"
			);
			expect(mockDocument.documentElement.classList.remove).toHaveBeenCalledWith(
				"system"
			);
		});

		it("should add dark class when theme is dark", () => {
			applyTheme("dark");

			expect(mockDocument.documentElement.classList.remove).toHaveBeenCalledWith(
				"light",
				"dark"
			);
			expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith(
				"dark"
			);
			expect(mockDocument.documentElement.classList.remove).toHaveBeenCalledWith(
				"system"
			);
		});

		it("should add system class when theme is system", () => {
			applyTheme("system");

			expect(mockDocument.documentElement.classList.remove).toHaveBeenCalledWith(
				"light",
				"dark"
			);
			expect(mockDocument.documentElement.classList.remove).toHaveBeenCalledWith(
				"light",
				"dark",
				"system"
			);
			expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith(
				"system"
			);
		});
	});

	describe("initTheme", () => {
		it("should load and apply theme on init", async () => {
			mockSyncStorage.theme = "dark";

			await initTheme();

			expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith(
				"dark"
			);
		});

		it("should apply system theme when none stored", async () => {
			await initTheme();

			expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith(
				"system"
			);
		});

		it("should set up system theme change listener", async () => {
			await initTheme();

			// Verify matchMedia was called to set up listener
			expect(mockMatchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
		});

		it("should set up storage change listener", async () => {
			await initTheme();

			expect(chrome.storage.onChanged.addListener).toHaveBeenCalled();
		});

		it("should apply new theme when storage changes", async () => {
			await initTheme();

			// Reset mocks to verify new calls
			mockDocument.documentElement.classList.add.mockClear();
			mockDocument.documentElement.classList.remove.mockClear();

			// Simulate storage change
			storageChangeListeners.forEach((listener) => {
				listener({ theme: { newValue: "light" } }, "sync");
			});

			expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith(
				"light"
			);
		});

		it("should ignore storage changes for other keys", async () => {
			await initTheme();

			mockDocument.documentElement.classList.add.mockClear();
			mockDocument.documentElement.classList.remove.mockClear();

			// Simulate storage change for different key
			storageChangeListeners.forEach((listener) => {
				listener({ otherKey: { newValue: "value" } }, "sync");
			});

			// Should not have been called again
			expect(mockDocument.documentElement.classList.add).not.toHaveBeenCalled();
		});

		it("should ignore storage changes from local area", async () => {
			await initTheme();

			mockDocument.documentElement.classList.add.mockClear();
			mockDocument.documentElement.classList.remove.mockClear();

			// Simulate storage change from local
			storageChangeListeners.forEach((listener) => {
				listener({ theme: { newValue: "dark" } }, "local");
			});

			// Should not have been called again
			expect(mockDocument.documentElement.classList.add).not.toHaveBeenCalled();
		});
	});
});

