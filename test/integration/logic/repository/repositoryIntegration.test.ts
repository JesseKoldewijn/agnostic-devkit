/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";

import {
	addProviderInstance,
	addRepositorySource,
	clearRepositoryStorage,
	createProviderInstance,
	createRepositorySource,
	getProviderInstanceById,
	getProviderInstances,
	getRepositorySourceById,
	getRepositorySources,
	getSourcesWithProviders,
	onProviderInstancesChanged,
	onRepositorySourcesChanged,
	removeProviderInstance,
	removeRepositorySource,
	updateProviderInstance,
	updateRepositorySource,
} from "@/logic/repository";

// ============================================================================
// Storage Integration Tests
// ============================================================================

describe("Repository Storage Integration", () => {
	beforeEach(async () => {
		fakeBrowser.reset();
	});

	describe("Provider Instances CRUD", () => {
		it("should start with empty provider instances", async () => {
			const instances = await getProviderInstances();
			expect(instances).toEqual([]);
		});

		it("should add a provider instance", async () => {
			const instance = createProviderInstance("github", "GitHub.com", "github.com", "ghp_token123");

			await addProviderInstance(instance);

			const instances = await getProviderInstances();
			expect(instances).toHaveLength(1);
			expect(instances[0].name).toBe("GitHub.com");
			expect(instances[0].baseUrl).toBe("github.com");
			expect(instances[0].token).toBe("ghp_token123");
		});

		it("should get provider instance by ID", async () => {
			const instance = createProviderInstance("github", "Test", "github.com");
			await addProviderInstance(instance);

			const found = await getProviderInstanceById(instance.id);
			expect(found).toBeDefined();
			expect(found?.name).toBe("Test");
		});

		it("should return undefined for non-existent ID", async () => {
			const found = await getProviderInstanceById("non-existent");
			expect(found).toBeUndefined();
		});

		it("should update a provider instance", async () => {
			const instance = createProviderInstance("github", "Old Name", "github.com");
			await addProviderInstance(instance);

			const updated = await updateProviderInstance(instance.id, {
				name: "New Name",
				token: "new_token",
			});

			expect(updated).toBe(true);

			const found = await getProviderInstanceById(instance.id);
			expect(found?.name).toBe("New Name");
			expect(found?.token).toBe("new_token");
			expect(found?.baseUrl).toBe("github.com"); // unchanged
		});

		it("should return false when updating non-existent instance", async () => {
			const updated = await updateProviderInstance("non-existent", { name: "Test" });
			expect(updated).toBe(false);
		});

		it("should remove a provider instance", async () => {
			const instance = createProviderInstance("github", "Test", "github.com");
			await addProviderInstance(instance);

			const removed = await removeProviderInstance(instance.id);
			expect(removed).toBe(true);

			const instances = await getProviderInstances();
			expect(instances).toHaveLength(0);
		});

		it("should return false when removing non-existent instance", async () => {
			const removed = await removeProviderInstance("non-existent");
			expect(removed).toBe(false);
		});

		it("should support multiple provider instances", async () => {
			const instance1 = createProviderInstance("github", "GitHub.com", "github.com");
			const instance2 = createProviderInstance(
				"github",
				"Company GitHub",
				"git.company.com",
				"enterprise_token"
			);

			await addProviderInstance(instance1);
			await addProviderInstance(instance2);

			const instances = await getProviderInstances();
			expect(instances).toHaveLength(2);
		});
	});

	describe("Repository Sources CRUD", () => {
		it("should start with empty repository sources", async () => {
			const sources = await getRepositorySources();
			expect(sources).toEqual([]);
		});

		it("should add a repository source", async () => {
			const source = createRepositorySource("My Presets", "https://github.com/user/presets");

			await addRepositorySource(source);

			const sources = await getRepositorySources();
			expect(sources).toHaveLength(1);
			expect(sources[0].name).toBe("My Presets");
			expect(sources[0].url).toBe("https://github.com/user/presets");
		});

		it("should add a source linked to a provider instance", async () => {
			const instance = createProviderInstance("github", "GitHub", "github.com", "token");
			await addProviderInstance(instance);

			const source = createRepositorySource(
				"Private Repo",
				"https://github.com/user/private",
				"github",
				instance.id
			);
			await addRepositorySource(source);

			const sources = await getRepositorySources();
			expect(sources[0].providerInstanceId).toBe(instance.id);
		});

		it("should get repository source by ID", async () => {
			const source = createRepositorySource("Test", "https://example.com/presets.json");
			await addRepositorySource(source);

			const found = await getRepositorySourceById(source.id);
			expect(found).toBeDefined();
			expect(found?.name).toBe("Test");
		});

		it("should update a repository source", async () => {
			const source = createRepositorySource("Old", "https://old.com/presets.json");
			await addRepositorySource(source);

			const updated = await updateRepositorySource(source.id, {
				name: "New",
				url: "https://new.com/presets.json",
			});

			expect(updated).toBe(true);

			const found = await getRepositorySourceById(source.id);
			expect(found?.name).toBe("New");
			expect(found?.url).toBe("https://new.com/presets.json");
		});

		it("should remove a repository source", async () => {
			const source = createRepositorySource("Test", "https://example.com");
			await addRepositorySource(source);

			const removed = await removeRepositorySource(source.id);
			expect(removed).toBe(true);

			const sources = await getRepositorySources();
			expect(sources).toHaveLength(0);
		});
	});

	describe("Provider-Source Relationship", () => {
		it("should unlink sources when provider instance is removed", async () => {
			const instance = createProviderInstance("github", "GitHub", "github.com");
			await addProviderInstance(instance);

			const source = createRepositorySource(
				"Presets",
				"https://github.com/user/repo",
				"github",
				instance.id
			);
			await addRepositorySource(source);

			// Verify link exists
			let sources = await getRepositorySources();
			expect(sources[0].providerInstanceId).toBe(instance.id);

			// Remove provider instance
			await removeProviderInstance(instance.id);

			// Source should still exist but be unlinked
			sources = await getRepositorySources();
			expect(sources).toHaveLength(1);
			expect(sources[0].providerInstanceId).toBeUndefined();
		});

		it("should get sources with their providers resolved", async () => {
			const instance = createProviderInstance("github", "GitHub", "github.com", "token");
			await addProviderInstance(instance);

			const linkedSource = createRepositorySource(
				"Private",
				"https://github.com/user/private",
				"github",
				instance.id
			);
			const publicSource = createRepositorySource(
				"Public",
				"https://example.com/presets.json",
				"url"
			);

			await addRepositorySource(linkedSource);
			await addRepositorySource(publicSource);

			const sourcesWithProviders = await getSourcesWithProviders();

			expect(sourcesWithProviders).toHaveLength(2);

			const linked = sourcesWithProviders.find((s) => s.source.name === "Private");
			const pub = sourcesWithProviders.find((s) => s.source.name === "Public");

			expect(linked?.providerInstance).toBeDefined();
			expect(linked?.providerInstance?.name).toBe("GitHub");
			expect(linked?.providerInstance?.token).toBe("token");

			expect(pub?.providerInstance).toBeUndefined();
		});
	});

	describe("Change Listeners", () => {
		it("should return unsubscribe function for provider instances", async () => {
			const callback = vi.fn();
			const unsubscribe = onProviderInstancesChanged(callback);

			expect(typeof unsubscribe).toBe("function");

			// Calling unsubscribe should not throw
			expect(() => unsubscribe()).not.toThrow();
		});

		it("should return unsubscribe function for repository sources", async () => {
			const callback = vi.fn();
			const unsubscribe = onRepositorySourcesChanged(callback);

			expect(typeof unsubscribe).toBe("function");

			// Calling unsubscribe should not throw
			expect(() => unsubscribe()).not.toThrow();
		});
	});

	describe("Clear Storage", () => {
		it("should clear all repository configuration", async () => {
			const instance = createProviderInstance("github", "Test", "github.com");
			const source = createRepositorySource("Test", "https://example.com");

			await addProviderInstance(instance);
			await addRepositorySource(source);

			await clearRepositoryStorage();

			const instances = await getProviderInstances();
			const sources = await getRepositorySources();

			expect(instances).toEqual([]);
			expect(sources).toEqual([]);
		});
	});
});

// ============================================================================
// Provider Fetch Tests (with mocked fetch)
// ============================================================================

describe("Provider Fetch Integration", () => {
	const originalFetch = globalThis.fetch;

	beforeEach(async () => {
		fakeBrowser.reset();
		// Clear the API cache to prevent cached responses from previous tests
		const { apiCache } = await import("@/logic/repository");
		apiCache.clear();
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	describe("GitHub Provider with mocked API", () => {
		it("should fetch and validate presets from a gist", async () => {
			const { GitHubProvider, createRepositorySource } = await import("@/logic/repository");

			const validPresets = [
				{
					name: "Test Preset",
					parameters: [{ type: "queryParam", key: "debug", value: "true" }],
				},
			];

			// Mock fetch for Gist API
			globalThis.fetch = vi.fn().mockImplementation((url: string) => {
				if (url.includes("api.github.com/gists")) {
					return Promise.resolve({
						json: () =>
							Promise.resolve({
								files: {
									"presets.json": {
										content: JSON.stringify(validPresets),
										filename: "presets.json",
										raw_url: "https://gist.githubusercontent.com/raw/presets.json",
										size: 100,
										truncated: false,
									},
								},
								id: "abc123",
							}),
						ok: true,
					});
				}
				return Promise.reject(new Error("Unexpected URL"));
			});

			const source = createRepositorySource("Test Gist", "https://gist.github.com/user/abc123");

			const result = await GitHubProvider.fetchFiles(source);

			expect(result.success).toBe(true);
			expect(result.files).toHaveLength(1);
			expect(result.files[0].isValid).toBe(true);
			expect(result.files[0].presets).toHaveLength(1);
			expect(result.files[0].presets?.[0].name).toBe("Test Preset");
		});

		it("should return invalid file when preset doesn't match schema", async () => {
			const { GitHubProvider, createRepositorySource } = await import("@/logic/repository");

			const invalidPresets = [
				{
					// Missing required 'name' field
					parameters: [],
				},
			];

			globalThis.fetch = vi.fn().mockImplementation((url: string) => {
				if (url.includes("api.github.com/gists")) {
					return Promise.resolve({
						json: () =>
							Promise.resolve({
								files: {
									"invalid.json": {
										content: JSON.stringify(invalidPresets),
										filename: "invalid.json",
										raw_url: "https://gist.githubusercontent.com/raw/invalid.json",
										size: 50,
										truncated: false,
									},
								},
								id: "abc123",
							}),
						ok: true,
					});
				}
				return Promise.reject(new Error("Unexpected URL"));
			});

			const source = createRepositorySource("Invalid Gist", "https://gist.github.com/user/abc123");

			const result = await GitHubProvider.fetchFiles(source);

			expect(result.success).toBe(true);
			expect(result.files).toHaveLength(1);
			expect(result.files[0].isValid).toBe(false);
			expect(result.files[0].error).toBeDefined();
		});

		it("should use PAT token in Authorization header", async () => {
			const { GitHubProvider, createRepositorySource, createProviderInstance } =
				await import("@/logic/repository");

			let capturedHeaders: HeadersInit | undefined;

			globalThis.fetch = vi.fn().mockImplementation((_url: string, options: RequestInit) => {
				capturedHeaders = options.headers;
				return Promise.resolve({
					json: () =>
						Promise.resolve({
							files: {},
							id: "abc123",
						}),
					ok: true,
				});
			});

			const instance = createProviderInstance("github", "GitHub", "github.com", "ghp_secret_token");
			const source = createRepositorySource("Test", "https://gist.github.com/user/abc123");

			await GitHubProvider.fetchFiles(source, instance);

			expect(capturedHeaders).toBeDefined();
			expect((capturedHeaders as Record<string, string>)["Authorization"]).toBe(
				"Bearer ghp_secret_token"
			);
		});
	});

	describe("URL Provider with mocked fetch", () => {
		it("should fetch and validate presets from a direct URL", async () => {
			const { UrlProvider, createRepositorySource } = await import("@/logic/repository");

			const validPresets = [
				{
					name: "URL Preset",
					parameters: [{ type: "localStorage", key: "theme", value: "dark" }],
				},
			];

			globalThis.fetch = vi.fn().mockResolvedValue({
				headers: {
					get: () => "application/json",
				},
				json: () => Promise.resolve(validPresets),
				ok: true,
			});

			const source = createRepositorySource("Direct URL", "https://example.com/presets.json");

			const result = await UrlProvider.fetchFiles(source);

			expect(result.success).toBe(true);
			expect(result.files).toHaveLength(1);
			expect(result.files[0].isValid).toBe(true);
			expect(result.files[0].filename).toBe("presets.json");
		});

		it("should handle HTTP errors gracefully", async () => {
			const { UrlProvider, createRepositorySource } = await import("@/logic/repository");

			globalThis.fetch = vi.fn().mockResolvedValue({
				json: () =>
					Promise.resolve({
						documentation_url: "https://docs.example.com",
						message: "Not Found",
					}),
				ok: false,
				status: 404,
				statusText: "Not Found",
			});

			const source = createRepositorySource("Missing", "https://example.com/missing.json");

			const result = await UrlProvider.fetchFiles(source);

			expect(result.success).toBe(true); // Operation succeeded, but file is invalid
			expect(result.files[0].isValid).toBe(false);
			// Should have human-readable error message
			expect(result.files[0].error).toContain("not found");
		});

		it("should reject invalid URLs", async () => {
			const { UrlProvider, createRepositorySource } = await import("@/logic/repository");

			const source = createRepositorySource("Invalid", "not-a-url");

			const result = await UrlProvider.fetchFiles(source);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Invalid URL");
		});
	});
});
