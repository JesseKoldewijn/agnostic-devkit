import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
	applyParameter,
	removeParameter,
	applyPreset,
	removePreset,
	getParameterTypeLabel,
	getParameterTypeIcon,
	verifyParameter,
	verifyPreset,
	syncParameter,
} from "../logic/parameters/parameterApplicator";
import type { Parameter, Preset } from "../logic/parameters/types";

describe("parameterApplicator", () => {
	let mockSyncStorage: Record<string, any>;
	let mockLocalStorage: Record<string, any>;
	let mockTabUrl: string;

	beforeEach(() => {
		mockSyncStorage = {};
		mockLocalStorage = {};
		mockTabUrl = "https://example.com/page";

		// Reset all mocks
		vi.clearAllMocks();

		// Mock chrome.tabs.get
		(globalThis.chrome.tabs as any).get = vi.fn(async (tabId: number) => ({
			id: tabId,
			url: mockTabUrl,
		}));

		// Mock chrome.tabs.update
		(globalThis.chrome.tabs as any).update = vi.fn(
			async (tabId: number, updateProperties: any) => {
				if (updateProperties.url) {
					mockTabUrl = updateProperties.url;
				}
				return { id: tabId, url: mockTabUrl };
			}
		);

		// Mock chrome.cookies
		(globalThis.chrome as any).cookies = {
			set: vi.fn(async () => ({})),
			get: vi.fn(async (details: any) => {
				const key = `${details.url}-${details.name}`;
				return mockLocalStorage[key] || null;
			}),
			remove: vi.fn(async () => ({})),
		};

		// Mock chrome.scripting
		(globalThis.chrome as any).scripting = {
			executeScript: vi.fn(async ({ args }: any) => {
				// Simulate localStorage operations
				if (args && args.length === 2) {
					// setItem
					mockLocalStorage[args[0]] = args[1];
					return [{ result: undefined }];
				} else if (args && args.length === 1) {
					// getItem or removeItem
					const result = mockLocalStorage[args[0]];
					return [{ result }];
				}
				return [{ result: undefined }];
			}),
		};

		// Mock chrome.storage
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

		(globalThis.chrome.storage as any).local = {
			get: vi.fn(async (keys: string[]) => {
				const result: Record<string, any> = {};
				for (const key of keys) {
					if (mockLocalStorage[key] !== undefined) {
						result[key] = mockLocalStorage[key];
					}
				}
				return result;
			}),
			set: vi.fn(async (data: Record<string, any>) => {
				Object.assign(mockLocalStorage, data);
			}),
		};
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("applyParameter", () => {
		it("should apply a query parameter to the URL", async () => {
			const param: Parameter = {
				id: "1",
				type: "queryParam",
				key: "testKey",
				value: "testValue",
			};

			const result = await applyParameter(123, param);
			expect(result).toBe(true);
			expect(chrome.tabs.update).toHaveBeenCalledWith(123, {
				url: expect.stringContaining("testKey=testValue"),
			});
		});

		it("should apply a cookie", async () => {
			const param: Parameter = {
				id: "1",
				type: "cookie",
				key: "cookieKey",
				value: "cookieValue",
			};

			const result = await applyParameter(123, param);
			expect(result).toBe(true);
			expect(chrome.cookies.set).toHaveBeenCalledWith({
				url: "https://example.com",
				name: "cookieKey",
				value: "cookieValue",
				path: "/",
			});
		});

		it("should apply a localStorage item", async () => {
			const param: Parameter = {
				id: "1",
				type: "localStorage",
				key: "storageKey",
				value: "storageValue",
			};

			const result = await applyParameter(123, param);
			expect(result).toBe(true);
			expect(chrome.scripting.executeScript).toHaveBeenCalled();
		});

		it("should return false for unknown parameter type", async () => {
			const param = {
				id: "1",
				type: "unknown" as any,
				key: "key",
				value: "value",
			};

			const result = await applyParameter(123, param);
			expect(result).toBe(false);
		});

		it("should return false when tab URL is not available", async () => {
			(chrome.tabs.get as any).mockResolvedValueOnce({ id: 123, url: undefined });

			const param: Parameter = {
				id: "1",
				type: "queryParam",
				key: "key",
				value: "value",
			};

			const result = await applyParameter(123, param);
			expect(result).toBe(false);
		});

		it("should handle errors gracefully for query params", async () => {
			(chrome.tabs.update as any).mockRejectedValueOnce(new Error("Tab error"));

			const param: Parameter = {
				id: "1",
				type: "queryParam",
				key: "key",
				value: "value",
			};

			const result = await applyParameter(123, param);
			expect(result).toBe(false);
		});

		it("should handle errors gracefully for cookies", async () => {
			(chrome.cookies.set as any).mockRejectedValueOnce(new Error("Cookie error"));

			const param: Parameter = {
				id: "1",
				type: "cookie",
				key: "key",
				value: "value",
			};

			const result = await applyParameter(123, param);
			expect(result).toBe(false);
		});

		it("should handle errors gracefully for localStorage", async () => {
			(chrome.scripting.executeScript as any).mockRejectedValueOnce(
				new Error("Script error")
			);

			const param: Parameter = {
				id: "1",
				type: "localStorage",
				key: "key",
				value: "value",
			};

			const result = await applyParameter(123, param);
			expect(result).toBe(false);
		});
	});

	describe("removeParameter", () => {
		it("should remove a query parameter from the URL", async () => {
			mockTabUrl = "https://example.com/page?testKey=testValue&other=1";

			const param: Parameter = {
				id: "1",
				type: "queryParam",
				key: "testKey",
				value: "testValue",
			};

			const result = await removeParameter(123, param);
			expect(result).toBe(true);
			expect(chrome.tabs.update).toHaveBeenCalledWith(123, {
				url: expect.not.stringContaining("testKey="),
			});
		});

		it("should return true when query param does not exist", async () => {
			mockTabUrl = "https://example.com/page?other=1";

			const param: Parameter = {
				id: "1",
				type: "queryParam",
				key: "nonexistent",
				value: "value",
			};

			const result = await removeParameter(123, param);
			expect(result).toBe(true);
		});

		it("should remove a cookie", async () => {
			const param: Parameter = {
				id: "1",
				type: "cookie",
				key: "cookieKey",
				value: "cookieValue",
			};

			const result = await removeParameter(123, param);
			expect(result).toBe(true);
			expect(chrome.cookies.remove).toHaveBeenCalledWith({
				url: "https://example.com",
				name: "cookieKey",
			});
		});

		it("should remove a localStorage item", async () => {
			const param: Parameter = {
				id: "1",
				type: "localStorage",
				key: "storageKey",
				value: "storageValue",
			};

			const result = await removeParameter(123, param);
			expect(result).toBe(true);
			expect(chrome.scripting.executeScript).toHaveBeenCalled();
		});

		it("should return false for unknown parameter type", async () => {
			const param = {
				id: "1",
				type: "unknown" as any,
				key: "key",
				value: "value",
			};

			const result = await removeParameter(123, param);
			expect(result).toBe(false);
		});
	});

	describe("applyPreset", () => {
		it("should apply all parameters from a preset", async () => {
			const preset: Preset = {
				id: "preset1",
				name: "Test Preset",
				parameters: [
					{ id: "p1", type: "queryParam", key: "qp1", value: "v1" },
					{ id: "p2", type: "cookie", key: "ck1", value: "cv1" },
				],
			};
			mockSyncStorage.presets = [preset];

			const result = await applyPreset(123, "preset1");
			expect(result).toBe(true);
		});

		it("should return false when preset not found", async () => {
			mockSyncStorage.presets = [];

			const result = await applyPreset(123, "nonexistent");
			expect(result).toBe(false);
		});

		it("should batch apply query parameters", async () => {
			const preset: Preset = {
				id: "preset1",
				name: "Test Preset",
				parameters: [
					{ id: "p1", type: "queryParam", key: "qp1", value: "v1" },
					{ id: "p2", type: "queryParam", key: "qp2", value: "v2" },
				],
			};
			mockSyncStorage.presets = [preset];

			await applyPreset(123, "preset1");

			// Should be called once with both params in URL
			expect(chrome.tabs.update).toHaveBeenCalledTimes(1);
			const callArg = (chrome.tabs.update as any).mock.calls[0][1];
			expect(callArg.url).toContain("qp1=v1");
			expect(callArg.url).toContain("qp2=v2");
		});

		it("should handle preset with no parameters", async () => {
			const preset: Preset = {
				id: "preset1",
				name: "Empty Preset",
				parameters: [],
			};
			mockSyncStorage.presets = [preset];

			const result = await applyPreset(123, "preset1");
			expect(result).toBe(true);
		});

		it("should handle errors during batch query param application", async () => {
			(chrome.tabs.update as any).mockRejectedValueOnce(new Error("Update error"));

			const preset: Preset = {
				id: "preset1",
				name: "Test Preset",
				parameters: [
					{ id: "p1", type: "queryParam", key: "qp1", value: "v1" },
				],
			};
			mockSyncStorage.presets = [preset];

			const result = await applyPreset(123, "preset1");
			expect(result).toBe(false);
		});
	});

	describe("removePreset", () => {
		it("should remove all parameters from a preset", async () => {
			const preset: Preset = {
				id: "preset1",
				name: "Test Preset",
				parameters: [
					{ id: "p1", type: "queryParam", key: "qp1", value: "v1" },
					{ id: "p2", type: "cookie", key: "ck1", value: "cv1" },
				],
			};
			mockSyncStorage.presets = [preset];
			mockLocalStorage.tabPresetStates = { "123": [] };
			mockTabUrl = "https://example.com/page?qp1=v1";

			const result = await removePreset(123, "preset1");
			expect(result).toBe(true);
		});

		it("should return false when preset not found", async () => {
			mockSyncStorage.presets = [];

			const result = await removePreset(123, "nonexistent");
			expect(result).toBe(false);
		});

		it("should not remove parameters used by other active presets", async () => {
			const preset1: Preset = {
				id: "preset1",
				name: "Preset 1",
				parameters: [
					{ id: "p1", type: "queryParam", key: "shared", value: "v1" },
				],
			};
			const preset2: Preset = {
				id: "preset2",
				name: "Preset 2",
				parameters: [
					{ id: "p2", type: "queryParam", key: "shared", value: "v1" },
				],
			};
			mockSyncStorage.presets = [preset1, preset2];
			mockLocalStorage.tabPresetStates = { "123": ["preset2"] }; // preset2 is still active
			mockTabUrl = "https://example.com/page?shared=v1";

			await removePreset(123, "preset1");

			// Should not call update since "shared" is used by preset2
			expect(chrome.tabs.update).not.toHaveBeenCalled();
		});
	});

	describe("getParameterTypeLabel", () => {
		it("should return correct label for queryParam", () => {
			expect(getParameterTypeLabel("queryParam")).toBe("Query Parameter");
		});

		it("should return correct label for cookie", () => {
			expect(getParameterTypeLabel("cookie")).toBe("Cookie");
		});

		it("should return correct label for localStorage", () => {
			expect(getParameterTypeLabel("localStorage")).toBe("Local Storage");
		});

		it("should return Unknown for invalid type", () => {
			expect(getParameterTypeLabel("invalid" as any)).toBe("Unknown");
		});
	});

	describe("getParameterTypeIcon", () => {
		it("should return correct icon for queryParam", () => {
			expect(getParameterTypeIcon("queryParam")).toBe("🔗");
		});

		it("should return correct icon for cookie", () => {
			expect(getParameterTypeIcon("cookie")).toBe("🍪");
		});

		it("should return correct icon for localStorage", () => {
			expect(getParameterTypeIcon("localStorage")).toBe("💾");
		});

		it("should return question mark for invalid type", () => {
			expect(getParameterTypeIcon("invalid" as any)).toBe("❓");
		});
	});

	describe("verifyParameter", () => {
		it("should verify query parameter is set correctly", async () => {
			mockTabUrl = "https://example.com/page?testKey=testValue";

			const param: Parameter = {
				id: "1",
				type: "queryParam",
				key: "testKey",
				value: "testValue",
			};

			const result = await verifyParameter(123, param);
			expect(result).toBe(true);
		});

		it("should return false when query parameter has wrong value", async () => {
			mockTabUrl = "https://example.com/page?testKey=wrongValue";

			const param: Parameter = {
				id: "1",
				type: "queryParam",
				key: "testKey",
				value: "testValue",
			};

			const result = await verifyParameter(123, param);
			expect(result).toBe(false);
		});

		it("should return false when query parameter is missing", async () => {
			mockTabUrl = "https://example.com/page";

			const param: Parameter = {
				id: "1",
				type: "queryParam",
				key: "testKey",
				value: "testValue",
			};

			const result = await verifyParameter(123, param);
			expect(result).toBe(false);
		});

		it("should verify cookie is set correctly", async () => {
			(chrome.cookies.get as any).mockResolvedValueOnce({
				value: "cookieValue",
			});

			const param: Parameter = {
				id: "1",
				type: "cookie",
				key: "cookieKey",
				value: "cookieValue",
			};

			const result = await verifyParameter(123, param);
			expect(result).toBe(true);
		});

		it("should return false when cookie has wrong value", async () => {
			(chrome.cookies.get as any).mockResolvedValueOnce({
				value: "wrongValue",
			});

			const param: Parameter = {
				id: "1",
				type: "cookie",
				key: "cookieKey",
				value: "cookieValue",
			};

			const result = await verifyParameter(123, param);
			expect(result).toBe(false);
		});

		it("should verify localStorage is set correctly", async () => {
			mockLocalStorage["storageKey"] = "storageValue";

			const param: Parameter = {
				id: "1",
				type: "localStorage",
				key: "storageKey",
				value: "storageValue",
			};

			const result = await verifyParameter(123, param);
			expect(result).toBe(true);
		});

		it("should return false for unknown parameter type", async () => {
			const param = {
				id: "1",
				type: "unknown" as any,
				key: "key",
				value: "value",
			};

			const result = await verifyParameter(123, param);
			expect(result).toBe(false);
		});

		it("should handle errors gracefully", async () => {
			(chrome.tabs.get as any).mockRejectedValueOnce(new Error("Tab error"));

			const param: Parameter = {
				id: "1",
				type: "queryParam",
				key: "key",
				value: "value",
			};

			const result = await verifyParameter(123, param);
			expect(result).toBe(false);
		});
	});

	describe("verifyPreset", () => {
		it("should verify all parameters in a preset", async () => {
			mockTabUrl = "https://example.com/page?qp1=v1";
			(chrome.cookies.get as any).mockResolvedValueOnce({ value: "cv1" });

			const preset: Preset = {
				id: "preset1",
				name: "Test Preset",
				parameters: [
					{ id: "p1", type: "queryParam", key: "qp1", value: "v1" },
					{ id: "p2", type: "cookie", key: "ck1", value: "cv1" },
				],
			};
			mockSyncStorage.presets = [preset];

			const result = await verifyPreset(123, "preset1");
			expect(result.allVerified).toBe(true);
			expect(result.results.length).toBe(2);
			expect(result.results.every((r) => r.verified)).toBe(true);
		});

		it("should return false when preset not found", async () => {
			mockSyncStorage.presets = [];

			const result = await verifyPreset(123, "nonexistent");
			expect(result.allVerified).toBe(false);
			expect(result.results).toEqual([]);
		});

		it("should return partial verification results", async () => {
			mockTabUrl = "https://example.com/page?qp1=v1";
			(chrome.cookies.get as any).mockResolvedValueOnce({ value: "wrongValue" });

			const preset: Preset = {
				id: "preset1",
				name: "Test Preset",
				parameters: [
					{ id: "p1", type: "queryParam", key: "qp1", value: "v1" },
					{ id: "p2", type: "cookie", key: "ck1", value: "cv1" },
				],
			};
			mockSyncStorage.presets = [preset];

			const result = await verifyPreset(123, "preset1");
			expect(result.allVerified).toBe(false);
			expect(result.results[0].verified).toBe(true);
			expect(result.results[1].verified).toBe(false);
		});
	});

	describe("syncParameter", () => {
		it("should apply and verify a parameter", async () => {
			mockTabUrl = "https://example.com/page";

			const param: Parameter = {
				id: "1",
				type: "queryParam",
				key: "testKey",
				value: "testValue",
			};

			// Mock update to change the URL
			(chrome.tabs.update as any).mockImplementation(
				async (tabId: number, props: any) => {
					mockTabUrl = props.url;
					return { id: tabId, url: mockTabUrl };
				}
			);

			const result = await syncParameter(123, param);
			expect(result).toBe(true);
		});

		it("should return false when apply fails", async () => {
			(chrome.tabs.get as any).mockResolvedValueOnce({ id: 123, url: undefined });

			const param: Parameter = {
				id: "1",
				type: "queryParam",
				key: "key",
				value: "value",
			};

			const result = await syncParameter(123, param);
			expect(result).toBe(false);
		});

		it("should retry once when verification fails", async () => {
			mockTabUrl = "https://example.com/page";
			let callCount = 0;

			(chrome.tabs.update as any).mockImplementation(
				async (tabId: number, props: any) => {
					callCount++;
					// First call fails verification, second succeeds
					if (callCount >= 2) {
						mockTabUrl = props.url;
					}
					return { id: tabId, url: mockTabUrl };
				}
			);

			const param: Parameter = {
				id: "1",
				type: "queryParam",
				key: "testKey",
				value: "testValue",
			};

			const result = await syncParameter(123, param);
			expect(callCount).toBe(2);
			expect(result).toBe(true);
		});
	});
});

