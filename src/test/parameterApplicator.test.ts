import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";
import {
	applyParameter,
	applyPreset,
	getParameterTypeIcon,
	getParameterTypeLabel,
	removeParameter,
	removePreset,
	syncParameter,
	verifyParameter,
	verifyPreset,
} from "../logic/parameters/parameterApplicator";
import type { Parameter, Preset } from "../logic/parameters/types";

describe("parameterApplicator", () => {
	let mockTabUrl: string;

	beforeEach(() => {
		fakeBrowser.reset();
		mockTabUrl = "https://example.com/page";

		// Setup fake tabs
		// biome-ignore lint/suspicious/noExplicitAny: complex fake-browser types
		(fakeBrowser.tabs.get as any) = vi.fn(async (tabId: number) => ({
			id: tabId,
			url: mockTabUrl,
		}));

		// biome-ignore lint/suspicious/noExplicitAny: complex fake-browser types
		(fakeBrowser.tabs.update as any) = vi.fn(async (tabId: number, updateProperties: any) => {
			if (updateProperties.url) {
				mockTabUrl = updateProperties.url;
			}
			return { id: tabId, url: mockTabUrl };
		});

		// Setup fake cookies
		// biome-ignore lint/suspicious/noExplicitAny: complex fake-browser types
		(fakeBrowser.cookies.set as any) = vi.fn(async () => ({}));
		// biome-ignore lint/suspicious/noExplicitAny: complex fake-browser types
		(fakeBrowser.cookies.get as any) = vi.fn(async () => null);
		// biome-ignore lint/suspicious/noExplicitAny: complex fake-browser types
		(fakeBrowser.cookies.remove as any) = vi.fn(async () => ({}));

		// Setup fake scripting
		// biome-ignore lint/suspicious/noExplicitAny: complex fake-browser types
		(fakeBrowser.scripting.executeScript as any) = vi.fn(async () => [{ result: undefined }]);

		// Setup fake runtime.sendMessage for LS operations
		// biome-ignore lint/suspicious/noExplicitAny: complex fake-browser types
		(fakeBrowser.runtime.sendMessage as any) = vi.fn(async (msg: any) => {
			if (msg.type === "APPLY_LS") {
				return { success: true };
			}
			if (msg.type === "REMOVE_LS") {
				return { success: true };
			}
			if (msg.type === "GET_LS") {
				return { success: true, value: msg.key === "storageKey" ? "storageValue" : null };
			}
			return { success: true };
		});
	});

	describe("applyParameter", () => {
		it("should apply a query parameter to the URL", async () => {
			const param: Parameter = {
				id: "1",
				key: "testKey",
				type: "queryParam",
				value: "testValue",
			};

			const result = await applyParameter(123, param);
			expect(result).toBeTruthy();
			expect(fakeBrowser.tabs.update).toHaveBeenCalledWith(123, {
				url: expect.stringContaining("testKey=testValue"),
			});
		});

		it("should apply a cookie", async () => {
			const param: Parameter = {
				id: "1",
				key: "cookieKey",
				type: "cookie",
				value: "cookieValue",
			};

			const result = await applyParameter(123, param);
			expect(result).toBeTruthy();
			expect(fakeBrowser.cookies.set).toHaveBeenCalledWith({
				name: "cookieKey",
				path: "/",
				url: "https://example.com",
				value: "cookieValue",
			});
		});

		it("should apply a localStorage item", async () => {
			const param: Parameter = {
				id: "1",
				key: "storageKey",
				type: "localStorage",
				value: "storageValue",
			};

			const result = await applyParameter(123, param);
			expect(result).toBeTruthy();
			expect(fakeBrowser.runtime.sendMessage).toHaveBeenCalledWith(
				expect.objectContaining({
					key: "storageKey",
					type: "APPLY_LS",
					value: "storageValue",
				})
			);
		});

		it("should return false for unknown parameter type", async () => {
			const param = {
				id: "1",
				key: "key",
				// biome-ignore lint/suspicious/noExplicitAny: testing unknown type
				type: "unknown" as any,
				value: "value",
			};

			const result = await applyParameter(123, param);
			expect(result).toBeFalsy();
		});

		it("should return false when tab URL is not available", async () => {
			// biome-ignore lint/suspicious/noExplicitAny: complex fake-browser types
			(fakeBrowser.tabs.get as any).mockResolvedValueOnce({ id: 123, url: undefined });

			const param: Parameter = {
				id: "1",
				key: "key",
				type: "queryParam",
				value: "value",
			};

			const result = await applyParameter(123, param);
			expect(result).toBeFalsy();
		});

		it("should handle errors gracefully for query params", async () => {
			// biome-ignore lint/suspicious/noExplicitAny: complex fake-browser types
			(fakeBrowser.tabs.update as any).mockRejectedValueOnce(new Error("Tab error"));

			const param: Parameter = {
				id: "1",
				key: "key",
				type: "queryParam",
				value: "value",
			};

			const result = await applyParameter(123, param);
			expect(result).toBeFalsy();
		});

		it("should handle errors gracefully for cookies", async () => {
			// biome-ignore lint/suspicious/noExplicitAny: complex fake-browser types
			(fakeBrowser.cookies.set as any).mockRejectedValueOnce(new Error("Cookie error"));

			const param: Parameter = {
				id: "1",
				key: "key",
				type: "cookie",
				value: "value",
			};

			const result = await applyParameter(123, param);
			expect(result).toBeFalsy();
		});

		it("should handle errors gracefully for localStorage", async () => {
			// biome-ignore lint/suspicious/noExplicitAny: complex fake-browser types
			(fakeBrowser.runtime.sendMessage as any).mockRejectedValueOnce(new Error("Script error"));

			const param: Parameter = {
				id: "1",
				key: "key",
				type: "localStorage",
				value: "value",
			};

			const result = await applyParameter(123, param);
			expect(result).toBeFalsy();
		});
	});

	describe("removeParameter", () => {
		it("should remove a query parameter from the URL", async () => {
			mockTabUrl = "https://example.com/page?testKey=testValue&other=1";

			const param: Parameter = {
				id: "1",
				key: "testKey",
				type: "queryParam",
				value: "testValue",
			};

			const result = await removeParameter(123, param);
			expect(result).toBeTruthy();
			expect(fakeBrowser.tabs.update).toHaveBeenCalledWith(123, {
				url: expect.not.stringContaining("testKey="),
			});
		});

		it("should return true when query param does not exist", async () => {
			mockTabUrl = "https://example.com/page?other=1";

			const param: Parameter = {
				id: "1",
				key: "nonexistent",
				type: "queryParam",
				value: "value",
			};

			const result = await removeParameter(123, param);
			expect(result).toBeTruthy();
		});

		it("should remove a cookie", async () => {
			const param: Parameter = {
				id: "1",
				key: "cookieKey",
				type: "cookie",
				value: "cookieValue",
			};

			const result = await removeParameter(123, param);
			expect(result).toBeTruthy();
			expect(fakeBrowser.cookies.remove).toHaveBeenCalledWith({
				name: "cookieKey",
				url: "https://example.com",
			});
		});

		it("should remove a localStorage item", async () => {
			const param: Parameter = {
				id: "1",
				key: "storageKey",
				type: "localStorage",
				value: "storageValue",
			};

			const result = await removeParameter(123, param);
			expect(result).toBeTruthy();
			expect(fakeBrowser.runtime.sendMessage).toHaveBeenCalledWith(
				expect.objectContaining({
					key: "storageKey",
					type: "REMOVE_LS",
				})
			);
		});
	});

	describe("applyPreset", () => {
		it("should apply all parameters from a preset", async () => {
			const preset: Preset = {
				id: "preset1",
				name: "Test Preset",
				parameters: [
					{ id: "p1", key: "qp1", type: "queryParam", value: "v1" },
					{ id: "p2", key: "ck1", type: "cookie", value: "cv1" },
				],
			};
			await fakeBrowser.storage.sync.set({ presets: [preset] });

			const result = await applyPreset(123, "preset1");
			expect(result).toBeTruthy();
		});

		it("should return false when preset not found", async () => {
			await fakeBrowser.storage.sync.set({ presets: [] });

			const result = await applyPreset(123, "nonexistent");
			expect(result).toBeFalsy();
		});

		it("should batch apply query parameters", async () => {
			const preset: Preset = {
				id: "preset1",
				name: "Test Preset",
				parameters: [
					{ id: "p1", key: "qp1", type: "queryParam", value: "v1" },
					{ id: "p2", key: "qp2", type: "queryParam", value: "v2" },
				],
			};
			await fakeBrowser.storage.sync.set({ presets: [preset] });

			await applyPreset(123, "preset1");

			// Should be called once with both params in URL
			expect(fakeBrowser.tabs.update).toHaveBeenCalledTimes(1);
			// biome-ignore lint/suspicious/noExplicitAny: complex fake-browser types
			const callArg = (fakeBrowser.tabs.update as any).mock.calls[0][1];
			expect(callArg.url).toContain("qp1=v1");
			expect(callArg.url).toContain("qp2=v2");
		});

		it("should handle errors during batch query param application", async () => {
			// biome-ignore lint/suspicious/noExplicitAny: complex fake-browser types
			(fakeBrowser.tabs.update as any).mockRejectedValueOnce(new Error("Update error"));

			const preset: Preset = {
				id: "preset1",
				name: "Test Preset",
				parameters: [{ id: "p1", key: "qp1", type: "queryParam", value: "v1" }],
			};
			await fakeBrowser.storage.sync.set({ presets: [preset] });

			const result = await applyPreset(123, "preset1");
			expect(result).toBeFalsy();
		});
	});

	describe("removePreset", () => {
		it("should remove all parameters from a preset", async () => {
			const preset: Preset = {
				id: "preset1",
				name: "Test Preset",
				parameters: [
					{ id: "p1", key: "qp1", type: "queryParam", value: "v1" },
					{ id: "p2", key: "ck1", type: "cookie", value: "cv1" },
				],
			};
			await fakeBrowser.storage.sync.set({ presets: [preset] });
			await fakeBrowser.storage.local.set({ tabPresetStates: { "123": [] } });
			mockTabUrl = "https://example.com/page?qp1=v1";

			const result = await removePreset(123, "preset1");
			expect(result).toBeTruthy();
		});

		it("should not remove parameters used by other active presets", async () => {
			const preset1: Preset = {
				id: "preset1",
				name: "Preset 1",
				parameters: [{ id: "p1", key: "shared", type: "queryParam", value: "v1" }],
			};
			const preset2: Preset = {
				id: "preset2",
				name: "Preset 2",
				parameters: [{ id: "p2", key: "shared", type: "queryParam", value: "v1" }],
			};
			await fakeBrowser.storage.sync.set({ presets: [preset1, preset2] });
			await fakeBrowser.storage.local.set({ tabPresetStates: { "123": ["preset2"] } });
			mockTabUrl = "https://example.com/page?shared=v1";

			await removePreset(123, "preset1");

			// Should not call update since "shared" is used by preset2
			expect(fakeBrowser.tabs.update).not.toHaveBeenCalled();
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
			// biome-ignore lint/suspicious/noExplicitAny: testing invalid type
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
			// biome-ignore lint/suspicious/noExplicitAny: testing invalid type
			expect(getParameterTypeIcon("invalid" as any)).toBe("❓");
		});
	});

	describe("verifyParameter", () => {
		it("should verify query parameter is set correctly", async () => {
			mockTabUrl = "https://example.com/page?testKey=testValue";

			const param: Parameter = {
				id: "1",
				key: "testKey",
				type: "queryParam",
				value: "testValue",
			};

			const result = await verifyParameter(123, param);
			expect(result).toBeTruthy();
		});

		it("should return false when query parameter has wrong value", async () => {
			mockTabUrl = "https://example.com/page?testKey=wrongValue";

			const param: Parameter = {
				id: "1",
				key: "testKey",
				type: "queryParam",
				value: "testValue",
			};

			const result = await verifyParameter(123, param);
			expect(result).toBeFalsy();
		});

		it("should verify cookie is set correctly", async () => {
			// biome-ignore lint/suspicious/noExplicitAny: complex fake-browser types
			(fakeBrowser.cookies.get as any).mockResolvedValueOnce({
				value: "cookieValue",
			});

			const param: Parameter = {
				id: "1",
				key: "cookieKey",
				type: "cookie",
				value: "cookieValue",
			};

			const result = await verifyParameter(123, param);
			expect(result).toBeTruthy();
		});

		it("should verify localStorage is set correctly", async () => {
			const param: Parameter = {
				id: "1",
				key: "storageKey",
				type: "localStorage",
				value: "storageValue",
			};

			const result = await verifyParameter(123, param);
			expect(result).toBeTruthy();
			expect(fakeBrowser.runtime.sendMessage).toHaveBeenCalledWith(
				expect.objectContaining({
					key: "storageKey",
					type: "GET_LS",
				})
			);
		});
	});

	describe("verifyPreset", () => {
		it("should verify all parameters in a preset", async () => {
			mockTabUrl = "https://example.com/page?qp1=v1";
			// biome-ignore lint/suspicious/noExplicitAny: complex fake-browser types
			(fakeBrowser.cookies.get as any).mockResolvedValueOnce({ value: "cv1" });

			const preset: Preset = {
				id: "preset1",
				name: "Test Preset",
				parameters: [
					{ id: "p1", key: "qp1", type: "queryParam", value: "v1" },
					{ id: "p2", key: "ck1", type: "cookie", value: "cv1" },
				],
			};
			await fakeBrowser.storage.sync.set({ presets: [preset] });

			const result = await verifyPreset(123, "preset1");
			expect(result.allVerified).toBeTruthy();
			expect(result.results).toHaveLength(2);
			expect(result.results.every((r) => r.verified)).toBeTruthy();
		});
	});

	describe("syncParameter", () => {
		it("should apply and verify a parameter", async () => {
			mockTabUrl = "https://example.com/page";

			const param: Parameter = {
				id: "1",
				key: "testKey",
				type: "queryParam",
				value: "testValue",
			};

			const result = await syncParameter(123, param);
			expect(result).toBeTruthy();
		});

		it("should retry once when verification fails", async () => {
			mockTabUrl = "https://example.com/page";
			let callCount = 0;

			// biome-ignore lint/suspicious/noExplicitAny: complex fake-browser types
			(fakeBrowser.tabs.update as any).mockImplementation(async (tabId: number, props: any) => {
				callCount++;
				// First call fails verification, second succeeds
				if (callCount >= 2) {
					mockTabUrl = props.url;
				}
				return { id: tabId, url: mockTabUrl };
			});

			const param: Parameter = {
				id: "1",
				key: "testKey",
				type: "queryParam",
				value: "testValue",
			};

			const result = await syncParameter(123, param);
			expect(callCount).toBe(2);
			expect(result).toBeTruthy();
		});
	});
});
