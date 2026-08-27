/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";

import {
	handleApplyLS,
	handleGetLS,
	handleRemoveLS,
	isStorageUnavailableError,
	privateWindowStorage,
} from "@/entrypoints/background";

describe("background localStorage handlers", () => {
	let storage: Map<number, Map<string, string>>;

	beforeEach(() => {
		fakeBrowser.reset();
		storage = new Map();

		(fakeBrowser.scripting.executeScript as ReturnType<typeof vi.fn>) = vi.fn(async () => [
			{ result: { success: true } },
		]);

		(fakeBrowser.tabs.get as ReturnType<typeof vi.fn>) = vi.fn(async (tabId: number) => ({
			id: tabId,
			url: "https://example.com",
			incognito: false,
		}));
	});

	describe("isStorageUnavailableError", () => {
		it("returns true for QuotaExceededError", () => {
			expect(isStorageUnavailableError("QuotaExceededError")).toBe(true);
		});

		it("returns true for SecurityError", () => {
			expect(isStorageUnavailableError("SecurityError")).toBe(true);
		});

		it("returns false for other error names", () => {
			expect(isStorageUnavailableError("TypeError")).toBe(false);
			expect(isStorageUnavailableError("Error")).toBe(false);
			expect(isStorageUnavailableError("")).toBe(false);
		});

		it("returns false for undefined", () => {
			expect(isStorageUnavailableError(undefined)).toBe(false);
		});
	});

	describe("handleApplyLS", () => {
		it("returns success when executeScript succeeds", async () => {
			(fakeBrowser.scripting.executeScript as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
				{ result: { success: true } },
			]);

			const result = await handleApplyLS(123, "key", "value", storage);

			expect(result.success).toBe(true);
			expect(storage.has(123)).toBe(false);
		});

		it("falls back to in-memory storage on QuotaExceededError", async () => {
			(fakeBrowser.scripting.executeScript as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
				{ result: { success: false, errorName: "QuotaExceededError", error: "storage full" } },
			]);

			const result = await handleApplyLS(123, "key", "value", storage);

			expect(result.success).toBe(true);
			expect(storage.get(123)?.get("key")).toBe("value");
		});

		it("falls back to in-memory storage on SecurityError", async () => {
			(fakeBrowser.scripting.executeScript as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
				{ result: { success: false, errorName: "SecurityError", error: "access denied" } },
			]);

			const result = await handleApplyLS(123, "key", "value", storage);

			expect(result.success).toBe(true);
			expect(storage.get(123)?.get("key")).toBe("value");
		});

		it("returns error response when executeScript rejects (permission denied)", async () => {
			(fakeBrowser.scripting.executeScript as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
				new Error("Cannot access a chrome:// URL")
			);

			const result = await handleApplyLS(123, "key", "value", storage);

			expect(result.success).toBe(false);
			expect(storage.has(123)).toBe(false);
		});

		it("returns error response for non-storage script failures", async () => {
			(fakeBrowser.scripting.executeScript as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
				{ result: { success: false, errorName: "ReferenceError", error: "not defined" } },
			]);

			const result = await handleApplyLS(123, "key", "value", storage);

			expect(result.success).toBe(false);
			expect(storage.has(123)).toBe(false);
		});

		it("isolates memory per tabId", async () => {
			(fakeBrowser.scripting.executeScript as ReturnType<typeof vi.fn>).mockResolvedValue([
				{ result: { success: false, errorName: "QuotaExceededError", error: "" } },
			]);

			await handleApplyLS(1, "key", "tab1value", storage);
			await handleApplyLS(2, "key", "tab2value", storage);

			expect(storage.get(1)?.get("key")).toBe("tab1value");
			expect(storage.get(2)?.get("key")).toBe("tab2value");
		});

		it("overwrites earlier memory value for same tab+key", async () => {
			(fakeBrowser.scripting.executeScript as ReturnType<typeof vi.fn>).mockResolvedValue([
				{ result: { success: false, errorName: "QuotaExceededError", error: "" } },
			]);

			await handleApplyLS(123, "key", "first", storage);
			await handleApplyLS(123, "key", "second", storage);

			expect(storage.get(123)?.get("key")).toBe("second");
		});
	});

	describe("handleGetLS", () => {
		it("returns value from page localStorage on success", async () => {
			(fakeBrowser.scripting.executeScript as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
				{ result: { success: true, value: "storedValue" } },
			]);

			const result = await handleGetLS(123, "key", storage);

			expect(result).toEqual({ success: true, value: "storedValue" });
		});

		it("returns null when page localStorage has no value for key", async () => {
			(fakeBrowser.scripting.executeScript as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
				{ result: { success: true, value: null } },
			]);

			const result = await handleGetLS(123, "key", storage);

			expect(result).toEqual({ success: true, value: null });
		});

		it("returns null from memory when storage unavailable and no memory entry", async () => {
			(fakeBrowser.scripting.executeScript as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
				{ result: { success: false, errorName: "QuotaExceededError", error: "" } },
			]);

			const result = await handleGetLS(123, "key", storage);

			expect(result).toEqual({ success: true, value: null });
		});

		it("returns memory value when storage unavailable and memory has the key", async () => {
			storage.set(123, new Map([["key", "memValue"]]));
			(fakeBrowser.scripting.executeScript as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
				{ result: { success: false, errorName: "SecurityError", error: "" } },
			]);

			const result = await handleGetLS(123, "key", storage);

			expect(result).toEqual({ success: true, value: "memValue" });
		});

		it("reads back a value written by a prior failed apply", async () => {
			(fakeBrowser.scripting.executeScript as ReturnType<typeof vi.fn>).mockResolvedValue([
				{ result: { success: false, errorName: "QuotaExceededError", error: "" } },
			]);

			await handleApplyLS(123, "myKey", "myValue", storage);
			const result = await handleGetLS(123, "myKey", storage);

			expect(result).toEqual({ success: true, value: "myValue" });
		});

		it("returns error response on executeScript rejection", async () => {
			(fakeBrowser.scripting.executeScript as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
				new Error("Missing host permission")
			);

			const result = await handleGetLS(123, "key", storage);

			expect(result.success).toBe(false);
		});
	});

	describe("handleRemoveLS", () => {
		it("returns success when executeScript succeeds", async () => {
			(fakeBrowser.scripting.executeScript as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
				{ result: { success: true } },
			]);

			const result = await handleRemoveLS(123, "key", storage);

			expect(result.success).toBe(true);
		});

		it("deletes key from memory on storage unavailable error", async () => {
			storage.set(123, new Map([["key", "value"]]));
			(fakeBrowser.scripting.executeScript as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
				{ result: { success: false, errorName: "QuotaExceededError", error: "" } },
			]);

			const result = await handleRemoveLS(123, "key", storage);

			expect(result.success).toBe(true);
			expect(storage.get(123)?.has("key")).toBe(false);
		});

		it("does not throw when tab has no memory store and storage unavailable", async () => {
			(fakeBrowser.scripting.executeScript as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
				{ result: { success: false, errorName: "QuotaExceededError", error: "" } },
			]);

			const result = await handleRemoveLS(999, "key", storage);

			expect(result.success).toBe(true);
		});

		it("apply then remove then get returns null from memory", async () => {
			(fakeBrowser.scripting.executeScript as ReturnType<typeof vi.fn>).mockResolvedValue([
				{ result: { success: false, errorName: "QuotaExceededError", error: "" } },
			]);

			await handleApplyLS(123, "key", "value", storage);
			await handleRemoveLS(123, "key", storage);
			const result = await handleGetLS(123, "key", storage);

			expect(result).toEqual({ success: true, value: null });
		});
	});

	describe("privateWindowStorage", () => {
		it("is a Map (module-level store for real browser usage)", () => {
			expect(privateWindowStorage).toBeInstanceOf(Map);
		});
	});
});
