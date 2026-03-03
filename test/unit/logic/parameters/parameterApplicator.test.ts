/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
} from "@/logic/parameters/parameterApplicator";
import type { Parameter, Preset } from "@/logic/parameters/types";

describe("parameterApplicator", () => {
	let mockTabUrl: string;

	beforeEach(() => {
		fakeBrowser.reset();
		mockTabUrl = "https://example.com/page";

		// Setup fake tabs

		(fakeBrowser.tabs.get as any) = vi.fn(async (tabId: number) => ({
			id: tabId,
			url: mockTabUrl,
		}));

		(fakeBrowser.tabs.update as any) = vi.fn(async (tabId: number, updateProperties: any) => {
			if (updateProperties.url) {
				mockTabUrl = updateProperties.url;
			}
			return { id: tabId, url: mockTabUrl };
		});

		// Setup fake cookies

		(fakeBrowser.cookies.set as any) = vi.fn(async () => ({}));

		(fakeBrowser.cookies.get as any) = vi.fn(async () => null);

		(fakeBrowser.cookies.remove as any) = vi.fn(async () => ({}));

		// Setup fake scripting

		(fakeBrowser.scripting.executeScript as any) = vi.fn(async () => [{ result: undefined }]);

		// Setup fake runtime.sendMessage for LS operations

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

				type: "unknown" as any,
				value: "value",
			};

			const result = await applyParameter(123, param);
			expect(result).toBeFalsy();
		});

		it("should return false when tab URL is not available", async () => {
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

			const callArg = (fakeBrowser.tabs.update as any).mock.calls[0][1];
			expect(callArg.url).toContain("qp1=v1");
			expect(callArg.url).toContain("qp2=v2");
		});

		it("should handle errors during batch query param application", async () => {
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

	describe("getQueryParamValue", () => {
		it("should return the value of an existing query parameter", async () => {
			const { getQueryParamValue } = await import("@/logic/parameters/parameterApplicator");
			mockTabUrl = "https://example.com/page?testKey=testValue";

			const value = await getQueryParamValue(123, "testKey");
			expect(value).toBe("testValue");
		});

		it("should return null for non-existent query parameter", async () => {
			const { getQueryParamValue } = await import("@/logic/parameters/parameterApplicator");
			mockTabUrl = "https://example.com/page";

			const value = await getQueryParamValue(123, "testKey");
			expect(value).toBeNull();
		});

		it("should return empty string for query parameter with no value", async () => {
			const { getQueryParamValue } = await import("@/logic/parameters/parameterApplicator");
			mockTabUrl = "https://example.com/page?testKey=";

			const value = await getQueryParamValue(123, "testKey");
			expect(value).toBe("");
		});
	});

	describe("getCookieValue", () => {
		it("should return the value of an existing cookie", async () => {
			const { getCookieValue } = await import("@/logic/parameters/parameterApplicator");
			(fakeBrowser.cookies.get as any).mockResolvedValue({
				name: "testCookie",
				value: "cookieValue",
			});

			const value = await getCookieValue(123, "testCookie");
			expect(value).toBe("cookieValue");
		});

		it("should return null for non-existent cookie", async () => {
			const { getCookieValue } = await import("@/logic/parameters/parameterApplicator");
			(fakeBrowser.cookies.get as any).mockResolvedValue(null);

			const value = await getCookieValue(123, "nonexistent");
			expect(value).toBeNull();
		});
	});

	describe("getLocalStorageValue", () => {
		it("should return the value of an existing localStorage item", async () => {
			const { getLocalStorageValue } = await import("@/logic/parameters/parameterApplicator");
			(fakeBrowser.runtime.sendMessage as any).mockResolvedValue({
				success: true,
				value: "storedValue",
			});

			const value = await getLocalStorageValue(123, "storageKey");
			expect(value).toBe("storedValue");
		});

		it("should return null for non-existent localStorage item", async () => {
			const { getLocalStorageValue } = await import("@/logic/parameters/parameterApplicator");
			(fakeBrowser.runtime.sendMessage as any).mockResolvedValue({ success: true, value: null });

			const value = await getLocalStorageValue(123, "nonexistent");
			expect(value).toBeNull();
		});
	});

	describe("getParameterCurrentValue", () => {
		it("should dispatch to getQueryParamValue for queryParam type", async () => {
			const { getParameterCurrentValue } = await import("@/logic/parameters/parameterApplicator");
			mockTabUrl = "https://example.com/page?myKey=myValue";

			const param: Parameter = {
				id: "1",
				key: "myKey",
				type: "queryParam",
				value: "",
			};

			const value = await getParameterCurrentValue(123, param);
			expect(value).toBe("myValue");
		});

		it("should dispatch to getCookieValue for cookie type", async () => {
			const { getParameterCurrentValue } = await import("@/logic/parameters/parameterApplicator");
			(fakeBrowser.cookies.get as any).mockResolvedValue({ name: "myCookie", value: "cookieVal" });

			const param: Parameter = {
				id: "1",
				key: "myCookie",
				type: "cookie",
				value: "",
			};

			const value = await getParameterCurrentValue(123, param);
			expect(value).toBe("cookieVal");
		});

		it("should dispatch to getLocalStorageValue for localStorage type", async () => {
			const { getParameterCurrentValue } = await import("@/logic/parameters/parameterApplicator");
			(fakeBrowser.runtime.sendMessage as any).mockResolvedValue({
				success: true,
				value: "lsValue",
			});

			const param: Parameter = {
				id: "1",
				key: "lsKey",
				type: "localStorage",
				value: "",
			};

			const value = await getParameterCurrentValue(123, param);
			expect(value).toBe("lsValue");
		});
	});

	describe("incognito mode - cookie store isolation", () => {
		beforeEach(() => {
			// Mock tabs.get to return incognito: true
			(fakeBrowser.tabs.get as any) = vi.fn(async (tabId: number) => ({
				id: tabId,
				url: mockTabUrl,
				incognito: true,
			}));

			// Mock getAllCookieStores to return both normal and incognito stores
			(fakeBrowser.cookies.getAllCookieStores as any) = vi.fn(async () => [
				{ id: "0", tabIds: [] },
				{ id: "1", tabIds: [123] },
			]);
		});

		it("should pass storeId when applying a cookie on an incognito tab", async () => {
			const param: Parameter = {
				id: "1",
				key: "incognitoCookie",
				type: "cookie",
				value: "secretValue",
			};

			const result = await applyParameter(123, param);
			expect(result).toBeTruthy();
			expect(fakeBrowser.cookies.set).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "incognitoCookie",
					value: "secretValue",
					storeId: "1",
				})
			);
		});

		it("should pass storeId when removing a cookie on an incognito tab", async () => {
			const param: Parameter = {
				id: "1",
				key: "incognitoCookie",
				type: "cookie",
				value: "secretValue",
			};

			const result = await removeParameter(123, param);
			expect(result).toBeTruthy();
			expect(fakeBrowser.cookies.remove).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "incognitoCookie",
					storeId: "1",
				})
			);
		});

		it("should pass storeId when getting a cookie value on an incognito tab", async () => {
			const { getCookieValue } = await import("@/logic/parameters/parameterApplicator");
			(fakeBrowser.cookies.get as any).mockResolvedValue({
				name: "incognitoCookie",
				value: "secretValue",
			});

			await getCookieValue(123, "incognitoCookie");
			expect(fakeBrowser.cookies.get).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "incognitoCookie",
					storeId: "1",
				})
			);
		});

		it("should pass storeId when verifying a cookie on an incognito tab", async () => {
			(fakeBrowser.cookies.get as any).mockResolvedValue({
				value: "secretValue",
			});

			const param: Parameter = {
				id: "1",
				key: "incognitoCookie",
				type: "cookie",
				value: "secretValue",
			};

			const result = await verifyParameter(123, param);
			expect(result).toBeTruthy();
			expect(fakeBrowser.cookies.get).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "incognitoCookie",
					storeId: "1",
				})
			);
		});

		it("should NOT pass storeId for normal (non-incognito) tabs", async () => {
			// Override to non-incognito
			(fakeBrowser.tabs.get as any) = vi.fn(async (tabId: number) => ({
				id: tabId,
				url: mockTabUrl,
				incognito: false,
			}));

			const param: Parameter = {
				id: "1",
				key: "normalCookie",
				type: "cookie",
				value: "normalValue",
			};

			await applyParameter(123, param);
			const callArgs = (fakeBrowser.cookies.set as any).mock.calls[0][0];
			expect(callArgs.storeId).toBeUndefined();
		});

		it("should use correct cookie store when applying a preset with cookies on incognito tab", async () => {
			const preset: Preset = {
				id: "preset1",
				name: "Incognito Preset",
				parameters: [
					{ id: "p1", key: "qp1", type: "queryParam", value: "v1" },
					{ id: "p2", key: "ck1", type: "cookie", value: "cv1" },
					{ id: "p3", key: "ck2", type: "cookie", value: "cv2" },
				],
			};
			await fakeBrowser.storage.sync.set({ presets: [preset] });

			const result = await applyPreset(123, "preset1");
			expect(result).toBeTruthy();

			// Both cookie.set calls should include storeId for incognito
			const cookieSetCalls = (fakeBrowser.cookies.set as any).mock.calls;
			for (const call of cookieSetCalls) {
				expect(call[0]).toHaveProperty("storeId", "1");
			}
		});

		it("should use correct cookie store when removing a preset with cookies on incognito tab", async () => {
			const preset: Preset = {
				id: "preset1",
				name: "Incognito Preset",
				parameters: [{ id: "p1", key: "ck1", type: "cookie", value: "cv1" }],
			};
			await fakeBrowser.storage.sync.set({ presets: [preset] });
			await fakeBrowser.storage.local.set({ tabPresetStates: { "123": [] } });

			const result = await removePreset(123, "preset1");
			expect(result).toBeTruthy();

			expect(fakeBrowser.cookies.remove).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "ck1",
					storeId: "1",
				})
			);
		});

		it("should handle getAllCookieStores failure gracefully for incognito tabs", async () => {
			(fakeBrowser.cookies.getAllCookieStores as any) = vi.fn(async () => {
				throw new Error("API not available");
			});

			const param: Parameter = {
				id: "1",
				key: "fallbackCookie",
				type: "cookie",
				value: "value",
			};

			// Should still succeed (falls back to no storeId)
			const result = await applyParameter(123, param);
			expect(result).toBeTruthy();
		});

		it("should handle missing incognito store gracefully", async () => {
			// Only return the default store, no incognito store
			(fakeBrowser.cookies.getAllCookieStores as any) = vi.fn(async () => [
				{ id: "0", tabIds: [] },
			]);

			const param: Parameter = {
				id: "1",
				key: "noStoreCookie",
				type: "cookie",
				value: "value",
			};

			// Should still succeed (falls back to no storeId)
			const result = await applyParameter(123, param);
			expect(result).toBeTruthy();
		});
	});

	describe("incognito mode - localStorage error diagnostics", () => {
		let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

		beforeEach(() => {
			consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		});

		afterEach(() => {
			consoleWarnSpy.mockRestore();
		});

		it("should log a diagnostic warning when applyLocalStorage receives incognito_not_allowed", async () => {
			(fakeBrowser.runtime.sendMessage as any).mockResolvedValueOnce({
				error: "APPLY_LS failed on incognito tab: Cannot access",
				incognito: true,
				reason: "incognito_not_allowed",
				success: false,
			});

			const param: Parameter = {
				id: "1",
				key: "lsKey",
				type: "localStorage",
				value: "lsValue",
			};

			const result = await applyParameter(123, param);
			expect(result).toBeFalsy();
			expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("Allow in incognito"));
		});

		it("should log a diagnostic warning when removeLocalStorage receives incognito_not_allowed", async () => {
			(fakeBrowser.runtime.sendMessage as any).mockResolvedValueOnce({
				error: "REMOVE_LS failed on incognito tab: Cannot access",
				incognito: true,
				reason: "incognito_not_allowed",
				success: false,
			});

			const param: Parameter = {
				id: "1",
				key: "lsKey",
				type: "localStorage",
				value: "lsValue",
			};

			const result = await removeParameter(123, param);
			expect(result).toBeFalsy();
			expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("Allow in incognito"));
		});

		it("should log a diagnostic warning when getLocalStorageValue receives incognito_not_allowed", async () => {
			const { getLocalStorageValue } = await import("@/logic/parameters/parameterApplicator");
			(fakeBrowser.runtime.sendMessage as any).mockResolvedValueOnce({
				error: "GET_LS failed on incognito tab: Cannot access",
				incognito: true,
				reason: "incognito_not_allowed",
				success: false,
			});

			const value = await getLocalStorageValue(123, "lsKey");
			expect(value).toBeNull();
			expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("Allow in incognito"));
		});

		it("should log a generic incognito warning when applyLocalStorage receives incognito_script_error", async () => {
			(fakeBrowser.runtime.sendMessage as any).mockResolvedValueOnce({
				error: "APPLY_LS failed on incognito tab: Some scripting error",
				incognito: true,
				reason: "incognito_script_error",
				success: false,
			});

			const param: Parameter = {
				id: "1",
				key: "lsKey",
				type: "localStorage",
				value: "lsValue",
			};

			const result = await applyParameter(123, param);
			expect(result).toBeFalsy();
			expect(consoleWarnSpy).toHaveBeenCalledWith(
				expect.stringContaining("failed on incognito tab")
			);
		});

		it("should not log incognito warning for normal script_error responses", async () => {
			(fakeBrowser.runtime.sendMessage as any).mockResolvedValueOnce({
				error: "APPLY_LS failed: Tab not found",
				reason: "script_error",
				success: false,
			});

			const param: Parameter = {
				id: "1",
				key: "lsKey",
				type: "localStorage",
				value: "lsValue",
			};

			const result = await applyParameter(123, param);
			expect(result).toBeFalsy();
			// Should NOT log an incognito-specific warning
			expect(consoleWarnSpy).not.toHaveBeenCalledWith(expect.stringContaining("incognito"));
		});

		it("should handle null response from sendMessage without crashing", async () => {
			(fakeBrowser.runtime.sendMessage as any).mockResolvedValueOnce(null);

			const param: Parameter = {
				id: "1",
				key: "lsKey",
				type: "localStorage",
				value: "lsValue",
			};

			const result = await applyParameter(123, param);
			expect(result).toBeFalsy();
			// logIncognitoLocalStorageError should early-return, no warnings
			expect(consoleWarnSpy).not.toHaveBeenCalled();
		});

		it("should handle response with no reason field without logging incognito warnings", async () => {
			(fakeBrowser.runtime.sendMessage as any).mockResolvedValueOnce({
				error: "Some unknown error",
				success: false,
			});

			const param: Parameter = {
				id: "1",
				key: "lsKey",
				type: "localStorage",
				value: "lsValue",
			};

			const result = await applyParameter(123, param);
			expect(result).toBeFalsy();
			// No reason field → logIncognitoLocalStorageError early-returns
			expect(consoleWarnSpy).not.toHaveBeenCalled();
		});

		it("should log a generic incognito warning when removeLocalStorage receives incognito_script_error", async () => {
			(fakeBrowser.runtime.sendMessage as any).mockResolvedValueOnce({
				error: "REMOVE_LS failed on incognito tab: Some scripting error",
				incognito: true,
				reason: "incognito_script_error",
				success: false,
			});

			const param: Parameter = {
				id: "1",
				key: "lsKey",
				type: "localStorage",
				value: "lsValue",
			};

			const result = await removeParameter(123, param);
			expect(result).toBeFalsy();
			expect(consoleWarnSpy).toHaveBeenCalledWith(
				expect.stringContaining("failed on incognito tab")
			);
		});

		it("should not log incognito warning when removeLocalStorage receives script_error", async () => {
			(fakeBrowser.runtime.sendMessage as any).mockResolvedValueOnce({
				error: "REMOVE_LS failed: Tab not found",
				reason: "script_error",
				success: false,
			});

			const param: Parameter = {
				id: "1",
				key: "lsKey",
				type: "localStorage",
				value: "lsValue",
			};

			const result = await removeParameter(123, param);
			expect(result).toBeFalsy();
			expect(consoleWarnSpy).not.toHaveBeenCalledWith(expect.stringContaining("incognito"));
		});

		it("should log a generic incognito warning when getLocalStorageValue receives incognito_script_error", async () => {
			const { getLocalStorageValue } = await import("@/logic/parameters/parameterApplicator");
			(fakeBrowser.runtime.sendMessage as any).mockResolvedValueOnce({
				error: "GET_LS failed on incognito tab: Some scripting error",
				incognito: true,
				reason: "incognito_script_error",
				success: false,
			});

			const value = await getLocalStorageValue(123, "lsKey");
			expect(value).toBeNull();
			expect(consoleWarnSpy).toHaveBeenCalledWith(
				expect.stringContaining("failed on incognito tab")
			);
		});

		it("should log a generic incognito warning when verifyLocalStorage receives incognito_script_error", async () => {
			(fakeBrowser.runtime.sendMessage as any).mockResolvedValueOnce({
				error: "GET_LS failed on incognito tab: Some scripting error",
				incognito: true,
				reason: "incognito_script_error",
				success: false,
			});

			const param: Parameter = {
				id: "1",
				key: "lsKey",
				type: "localStorage",
				value: "lsValue",
			};

			const result = await verifyParameter(123, param);
			expect(result).toBeFalsy();
			expect(consoleWarnSpy).toHaveBeenCalledWith(
				expect.stringContaining("failed on incognito tab")
			);
		});

		it("should log a diagnostic warning when verifyLocalStorage receives incognito_not_allowed", async () => {
			(fakeBrowser.runtime.sendMessage as any).mockResolvedValueOnce({
				error: "GET_LS failed on incognito tab: Cannot access",
				incognito: true,
				reason: "incognito_not_allowed",
				success: false,
			});

			const param: Parameter = {
				id: "1",
				key: "lsKey",
				type: "localStorage",
				value: "lsValue",
			};

			const result = await verifyParameter(123, param);
			expect(result).toBeFalsy();
			expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("Allow in incognito"));
		});
	});

	describe("incognito mode - composite function failures", () => {
		let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

		beforeEach(() => {
			consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		});

		afterEach(() => {
			consoleWarnSpy.mockRestore();
		});

		it("should return false when applyPreset has localStorage items that fail on incognito", async () => {
			// sendMessage returns incognito error for LS operations
			(fakeBrowser.runtime.sendMessage as any).mockResolvedValue({
				error: "APPLY_LS failed on incognito tab: Cannot access",
				incognito: true,
				reason: "incognito_not_allowed",
				success: false,
			});

			const preset: Preset = {
				id: "preset1",
				name: "Incognito LS Preset",
				parameters: [
					{ id: "p1", key: "lsKey1", type: "localStorage", value: "v1" },
					{ id: "p2", key: "lsKey2", type: "localStorage", value: "v2" },
				],
			};
			await fakeBrowser.storage.sync.set({ presets: [preset] });

			const result = await applyPreset(123, "preset1");
			expect(result).toBeFalsy();
			expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("Allow in incognito"));
		});

		it("should return false when removePreset has localStorage items that fail on incognito", async () => {
			// sendMessage returns incognito error for LS operations
			(fakeBrowser.runtime.sendMessage as any).mockResolvedValue({
				error: "REMOVE_LS failed on incognito tab: Cannot access",
				incognito: true,
				reason: "incognito_not_allowed",
				success: false,
			});

			const preset: Preset = {
				id: "preset1",
				name: "Incognito LS Preset",
				parameters: [{ id: "p1", key: "lsKey1", type: "localStorage", value: "v1" }],
			};
			await fakeBrowser.storage.sync.set({ presets: [preset] });
			await fakeBrowser.storage.local.set({ tabPresetStates: { "123": [] } });

			const result = await removePreset(123, "preset1");
			expect(result).toBeFalsy();
			expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("Allow in incognito"));
		});

		it("should return false when syncParameter for localStorage fails on incognito", async () => {
			// First call (apply) fails, so syncParameter returns false immediately
			(fakeBrowser.runtime.sendMessage as any).mockResolvedValue({
				error: "APPLY_LS failed on incognito tab: Cannot access",
				incognito: true,
				reason: "incognito_not_allowed",
				success: false,
			});

			const param: Parameter = {
				id: "1",
				key: "lsKey",
				type: "localStorage",
				value: "lsValue",
			};

			const result = await syncParameter(123, param);
			expect(result).toBeFalsy();
		});
	});

	describe("boolean parameter removal", () => {
		it("should set value to 'false' instead of removing for boolean queryParam", async () => {
			mockTabUrl = "https://example.com/page?boolKey=true";

			const param: Parameter = {
				id: "1",
				key: "boolKey",
				primitiveType: "boolean",
				type: "queryParam",
				value: "true",
			};

			await removeParameter(123, param);

			// Should set to false, not remove
			expect(mockTabUrl).toContain("boolKey=false");
		});

		it("should remove parameter completely for string type", async () => {
			mockTabUrl = "https://example.com/page?stringKey=value";

			const param: Parameter = {
				id: "1",
				key: "stringKey",
				primitiveType: "string",
				type: "queryParam",
				value: "value",
			};

			await removeParameter(123, param);

			// Should be removed completely
			expect(mockTabUrl).not.toContain("stringKey");
		});

		it("should set cookie value to 'false' for boolean type instead of removing", async () => {
			const param: Parameter = {
				id: "1",
				key: "boolCookie",
				primitiveType: "boolean",
				type: "cookie",
				value: "true",
			};

			await removeParameter(123, param);

			// Should call cookies.set with value "false"
			expect(fakeBrowser.cookies.set).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "boolCookie",
					value: "false",
				})
			);
		});

		it("should set localStorage value to 'false' for boolean type instead of removing", async () => {
			const param: Parameter = {
				id: "1",
				key: "boolLS",
				primitiveType: "boolean",
				type: "localStorage",
				value: "true",
			};

			await removeParameter(123, param);

			// Should send APPLY_LS with value "false"
			expect(fakeBrowser.runtime.sendMessage).toHaveBeenCalledWith(
				expect.objectContaining({
					key: "boolLS",
					type: "APPLY_LS",
					value: "false",
				})
			);
		});
	});
});
