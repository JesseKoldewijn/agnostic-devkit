/**
 * Unit tests for API cache module
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
	ApiError,
	apiCache,
	cachedFetch,
	generateCacheKey,
	getErrorMessage,
	isRateLimitError,
} from "@/logic/repository/providers/cache";

describe("cache", () => {
	beforeEach(() => {
		apiCache.clear();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("ApiCache", () => {
		describe("get/set", () => {
			it("should store and retrieve a value", () => {
				apiCache.set("key1", { data: "test" });
				expect(apiCache.get("key1")).toEqual({ data: "test" });
			});

			it("should return null for non-existent key", () => {
				expect(apiCache.get("nonexistent")).toBeNull();
			});

			it("should return null for expired entry", () => {
				apiCache.set("key1", "value", 1000); // 1 second TTL

				// Move time forward past expiration
				vi.advanceTimersByTime(1500);

				expect(apiCache.get("key1")).toBeNull();
			});

			it("should not return expired entry before TTL", () => {
				apiCache.set("key1", "value", 1000);

				// Move time forward but not past expiration
				vi.advanceTimersByTime(500);

				expect(apiCache.get("key1")).toBe("value");
			});
		});

		describe("has", () => {
			it("should return true for existing non-expired key", () => {
				apiCache.set("key1", "value");
				expect(apiCache.has("key1")).toBe(true);
			});

			it("should return false for non-existent key", () => {
				expect(apiCache.has("nonexistent")).toBe(false);
			});

			it("should return false for expired key", () => {
				apiCache.set("key1", "value", 1000);
				vi.advanceTimersByTime(1500);
				expect(apiCache.has("key1")).toBe(false);
			});
		});

		describe("delete", () => {
			it("should remove an entry", () => {
				apiCache.set("key1", "value");
				apiCache.delete("key1");
				expect(apiCache.get("key1")).toBeNull();
			});

			it("should not throw when deleting non-existent key", () => {
				expect(() => apiCache.delete("nonexistent")).not.toThrow();
			});
		});

		describe("clear", () => {
			it("should remove all entries", () => {
				apiCache.set("key1", "value1");
				apiCache.set("key2", "value2");
				apiCache.set("key3", "value3");

				apiCache.clear();

				expect(apiCache.get("key1")).toBeNull();
				expect(apiCache.get("key2")).toBeNull();
				expect(apiCache.get("key3")).toBeNull();
				expect(apiCache.stats().size).toBe(0);
			});
		});

		describe("stats", () => {
			it("should return cache statistics", () => {
				apiCache.set("key1", "value1");
				apiCache.set("key2", "value2");

				const stats = apiCache.stats();
				expect(stats.size).toBe(2);
				expect(stats.maxEntries).toBe(100); // default
			});
		});

		describe("LRU eviction", () => {
			it("should evict oldest entry when at capacity", () => {
				// Create a small cache for testing (we use the global one, so set many entries)
				// The default maxEntries is 100, so we need to fill it up
				for (let i = 0; i < 100; i++) {
					apiCache.set(`key${i}`, `value${i}`);
				}

				// The first key should still be there
				expect(apiCache.get("key0")).toBe("value0");

				// Add one more - this should evict the least recently used
				// Since we just accessed key0, key1 should be the oldest
				apiCache.set("key100", "value100");

				// key1 should be evicted (oldest after we accessed key0)
				expect(apiCache.get("key1")).toBeNull();
				// key100 should exist
				expect(apiCache.get("key100")).toBe("value100");
			});
		});
	});

	describe("generateCacheKey", () => {
		it("should generate key with public marker for no token", () => {
			const key = generateCacheKey("https://api.github.com/test");
			expect(key).toBe("https://api.github.com/test:public");
		});

		it("should generate key with auth marker for token", () => {
			const key = generateCacheKey("https://api.github.com/test", { token: "ghp_secret" });
			expect(key).toBe("https://api.github.com/test:auth");
		});

		it("should not include actual token in key", () => {
			const key = generateCacheKey("https://api.github.com/test", { token: "ghp_secret" });
			expect(key).not.toContain("ghp_secret");
		});
	});

	describe("cachedFetch", () => {
		const originalFetch = globalThis.fetch;

		beforeEach(() => {
			globalThis.fetch = vi.fn();
		});

		afterEach(() => {
			globalThis.fetch = originalFetch;
		});

		it("should fetch and cache data on first call", async () => {
			const mockData = { id: 1, name: "test" };
			(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockData),
			});

			const result = await cachedFetch("https://api.example.com/data");

			expect(result.data).toEqual(mockData);
			expect(result.fromCache).toBe(false);
			expect(globalThis.fetch).toHaveBeenCalledTimes(1);
		});

		it("should return cached data on subsequent calls", async () => {
			const mockData = { id: 1, name: "test" };
			(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockData),
			});

			// First call - fetches
			await cachedFetch("https://api.example.com/data");

			// Second call - should use cache
			const result = await cachedFetch("https://api.example.com/data");

			expect(result.data).toEqual(mockData);
			expect(result.fromCache).toBe(true);
			expect(globalThis.fetch).toHaveBeenCalledTimes(1);
		});

		it("should throw ApiError for non-ok response", async () => {
			(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: false,
				status: 404,
				statusText: "Not Found",
				json: () => Promise.resolve({ message: "Not Found" }),
			});

			await expect(cachedFetch("https://api.example.com/notfound")).rejects.toThrow(ApiError);
		});

		it("should not cache error responses", async () => {
			(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: false,
				status: 500,
				statusText: "Internal Server Error",
				json: () => Promise.resolve({ message: "Server Error" }),
			});

			try {
				await cachedFetch("https://api.example.com/error");
			} catch {
				// Expected
			}

			// Cache should be empty
			expect(apiCache.get("https://api.example.com/error:public")).toBeNull();
		});

		it("should use custom TTL when provided", async () => {
			const mockData = { id: 1 };
			(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockData),
			});

			await cachedFetch("https://api.example.com/short-ttl", { cacheTtl: 1000 });

			// Should be cached initially
			expect(apiCache.has("https://api.example.com/short-ttl:public")).toBe(true);

			// After TTL expires, should not be cached
			vi.advanceTimersByTime(1500);
			expect(apiCache.has("https://api.example.com/short-ttl:public")).toBe(false);
		});
	});

	describe("ApiError", () => {
		it("should create error with status and message", () => {
			const error = new ApiError(404, "Not Found", "Resource not found");

			expect(error.status).toBe(404);
			expect(error.statusText).toBe("Not Found");
			expect(error.apiMessage).toBe("Resource not found");
			expect(error.name).toBe("ApiError");
		});

		it("should include documentation URL when provided", () => {
			const error = new ApiError(
				403,
				"Forbidden",
				"Rate limit",
				"https://docs.github.com/rate-limiting"
			);

			expect(error.documentationUrl).toBe("https://docs.github.com/rate-limiting");
		});

		it("should format rate limit error message", () => {
			const error = new ApiError(403, "Forbidden", "API rate limit exceeded for 192.168.1.1");

			expect(error.message).toContain("rate limit");
			expect(error.message).not.toContain("192.168.1.1"); // IP should be removed
		});

		it("should format 401 error with authentication message", () => {
			const error = new ApiError(401, "Unauthorized");

			expect(error.message).toContain("Authentication");
			expect(error.message).toContain("token");
		});

		it("should format 404 error with friendly message", () => {
			const error = new ApiError(404, "Not Found");

			expect(error.message).toContain("not found");
			expect(error.message).toContain("check the URL");
		});

		it("should format 500 error with server message", () => {
			const error = new ApiError(500, "Internal Server Error");

			expect(error.message).toContain("GitHub");
			expect(error.message).toContain("try again");
		});
	});

	describe("isRateLimitError", () => {
		it("should return true for 429 status", () => {
			const error = new ApiError(429, "Too Many Requests");
			expect(isRateLimitError(error)).toBe(true);
		});

		it("should return true for 403 with rate limit message", () => {
			const error = new ApiError(403, "Forbidden", "API rate limit exceeded");
			expect(isRateLimitError(error)).toBe(true);
		});

		it("should return false for 403 without rate limit message", () => {
			const error = new ApiError(403, "Forbidden", "Access denied");
			expect(isRateLimitError(error)).toBe(false);
		});

		it("should return false for other errors", () => {
			const error = new ApiError(404, "Not Found");
			expect(isRateLimitError(error)).toBe(false);
		});

		it("should return false for non-ApiError", () => {
			expect(isRateLimitError(new Error("Some error"))).toBe(false);
			expect(isRateLimitError("string error")).toBe(false);
			expect(isRateLimitError(null)).toBe(false);
		});
	});

	describe("getErrorMessage", () => {
		it("should return message from ApiError", () => {
			const error = new ApiError(404, "Not Found");
			const message = getErrorMessage(error);

			expect(message).toContain("not found");
		});

		it("should return message from regular Error", () => {
			const error = new Error("Something went wrong");
			expect(getErrorMessage(error)).toBe("Something went wrong");
		});

		it("should handle network errors", () => {
			const error = new Error("Failed to fetch");
			const message = getErrorMessage(error);

			expect(message).toContain("Network error");
		});

		it("should return string errors as-is", () => {
			expect(getErrorMessage("Custom error message")).toBe("Custom error message");
		});

		it("should return fallback for unknown error types", () => {
			expect(getErrorMessage(null)).toContain("unexpected error");
			expect(getErrorMessage(undefined)).toContain("unexpected error");
			expect(getErrorMessage(123)).toContain("unexpected error");
		});
	});
});
