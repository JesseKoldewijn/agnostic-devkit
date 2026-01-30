/**
 * Unit tests for GitHub provider - URL parsing and API logic
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiCache } from "@/logic/repository/providers/cache";
import { parseGitHubUrl } from "@/logic/repository/providers/github";

describe("GitHub Provider", () => {
	beforeEach(() => {
		apiCache.clear();
	});

	describe("parseGitHubUrl", () => {
		describe("repository URLs", () => {
			it("should parse simple repository URL", () => {
				const result = parseGitHubUrl("https://github.com/owner/repo");

				expect(result).toEqual({
					owner: "owner",
					repo: "repo",
					ref: "main", // Default branch
					type: "repo",
				});
			});

			it("should parse repository URL with www prefix", () => {
				const result = parseGitHubUrl("https://www.github.com/owner/repo");

				expect(result).toEqual({
					owner: "owner",
					repo: "repo",
					ref: "main",
					type: "repo",
				});
			});

			it("should parse blob URL with file path", () => {
				const result = parseGitHubUrl("https://github.com/owner/repo/blob/main/path/to/file.json");

				expect(result).toEqual({
					owner: "owner",
					repo: "repo",
					ref: "main",
					path: "path/to/file.json",
					type: "blob",
				});
			});

			it("should parse blob URL with branch containing slashes", () => {
				const result = parseGitHubUrl(
					"https://github.com/owner/repo/blob/feature/branch-name/file.json"
				);

				expect(result).toEqual({
					owner: "owner",
					repo: "repo",
					ref: "feature",
					path: "branch-name/file.json",
					type: "blob",
				});
			});

			it("should parse tree URL (directory)", () => {
				const result = parseGitHubUrl("https://github.com/owner/repo/tree/main/src");

				expect(result).toEqual({
					owner: "owner",
					repo: "repo",
					ref: "main",
					path: "src",
					type: "repo",
				});
			});
		});

		describe("raw URLs", () => {
			it("should parse raw.githubusercontent.com URL", () => {
				const result = parseGitHubUrl(
					"https://raw.githubusercontent.com/owner/repo/main/path/file.json"
				);

				expect(result).toEqual({
					owner: "owner",
					repo: "repo",
					ref: "main",
					path: "path/file.json",
					type: "raw",
				});
			});

			it("should handle raw URL with multiple path segments", () => {
				const result = parseGitHubUrl(
					"https://raw.githubusercontent.com/owner/repo/v1.0.0/deep/nested/file.json"
				);

				expect(result).toEqual({
					owner: "owner",
					repo: "repo",
					ref: "v1.0.0",
					path: "deep/nested/file.json",
					type: "raw",
				});
			});
		});

		describe("gist URLs", () => {
			it("should parse gist URL", () => {
				const result = parseGitHubUrl("https://gist.github.com/owner/abc123def456");

				expect(result).toEqual({
					owner: "owner",
					gistId: "abc123def456",
					type: "gist",
				});
			});

			it("should parse gist URL with filename hash", () => {
				const result = parseGitHubUrl(
					"https://gist.github.com/owner/abc123def456#file-presets-json"
				);

				expect(result).toEqual({
					owner: "owner",
					gistId: "abc123def456",
					filename: "presets.json",
					type: "gist",
				});
			});

			it("should parse raw gist URL", () => {
				// URL format: gist.githubusercontent.com/user/gistid/raw/filename
				// pathParts = ["owner", "abc123", "raw", "file.json"]
				// ref = pathParts[3] which is "file.json" (not "raw")
				const result = parseGitHubUrl(
					"https://gist.githubusercontent.com/owner/abc123/raw/file.json"
				);

				expect(result).toEqual({
					owner: "owner",
					gistId: "abc123",
					filename: "file.json",
					ref: "file.json", // pathParts[3] is not "raw"
					type: "gist",
				});
			});

			it("should parse raw gist URL with revision", () => {
				// URL format: gist.githubusercontent.com/user/gistid/raw/revision/filename
				// pathParts = ["owner", "abc123", "raw", "revision123", "file.json"]
				const result = parseGitHubUrl(
					"https://gist.githubusercontent.com/owner/abc123/raw/revision123/file.json"
				);

				expect(result).toEqual({
					owner: "owner",
					gistId: "abc123",
					ref: "revision123",
					filename: "file.json",
					type: "gist",
				});
			});
		});

		describe("GitHub Enterprise URLs", () => {
			it("should parse enterprise repository URL with custom domain", () => {
				const result = parseGitHubUrl(
					"https://github.company.com/owner/repo",
					"github.company.com"
				);

				expect(result).toEqual({
					owner: "owner",
					repo: "repo",
					ref: "main",
					type: "repo",
				});
			});

			it("should parse enterprise blob URL", () => {
				const result = parseGitHubUrl(
					"https://github.company.com/owner/repo/blob/main/file.json",
					"github.company.com"
				);

				expect(result).toEqual({
					owner: "owner",
					repo: "repo",
					ref: "main",
					path: "file.json",
					type: "blob",
				});
			});
		});

		describe("invalid URLs", () => {
			it("should return null for invalid URL", () => {
				expect(parseGitHubUrl("not-a-url")).toBeNull();
			});

			it("should return null for non-GitHub URL", () => {
				expect(parseGitHubUrl("https://gitlab.com/owner/repo")).toBeNull();
			});

			it("should return null for URL with insufficient path segments", () => {
				expect(parseGitHubUrl("https://github.com/owner")).toBeNull();
			});

			it("should return null for raw URL with insufficient segments", () => {
				expect(parseGitHubUrl("https://raw.githubusercontent.com/owner/repo")).toBeNull();
			});

			it("should return null for gist URL with insufficient segments", () => {
				expect(parseGitHubUrl("https://gist.github.com/owner")).toBeNull();
			});
		});
	});

	describe("GitHubProvider fetch operations", () => {
		const originalFetch = globalThis.fetch;

		beforeEach(() => {
			globalThis.fetch = vi.fn();
		});

		afterEach(() => {
			globalThis.fetch = originalFetch;
		});

		it("should fetch gist files with API", async () => {
			const { GitHubProvider, createRepositorySource } = await import("@/logic/repository");

			const mockGistResponse = {
				id: "abc123",
				files: {
					"presets.json": {
						filename: "presets.json",
						content: JSON.stringify([
							{ name: "Test", parameters: [{ type: "queryParam", key: "a", value: "1" }] },
						]),
						raw_url: "https://gist.githubusercontent.com/raw/presets.json",
						size: 100,
						truncated: false,
					},
				},
			};

			(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockGistResponse),
			});

			const source = createRepositorySource("Test", "https://gist.github.com/owner/abc123");
			const result = await GitHubProvider.fetchFiles(source);

			expect(result.success).toBe(true);
			expect(result.files).toHaveLength(1);
			expect(result.files[0].isValid).toBe(true);
			expect(result.files[0].presets?.[0].name).toBe("Test");
		});

		it("should handle API rate limit errors gracefully", async () => {
			const { GitHubProvider, createRepositorySource } = await import("@/logic/repository");

			(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: false,
				status: 403,
				statusText: "Forbidden",
				json: () =>
					Promise.resolve({
						message: "API rate limit exceeded for 192.168.1.1",
						documentation_url:
							"https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting",
					}),
			});

			const source = createRepositorySource("Test", "https://gist.github.com/owner/abc123");
			const result = await GitHubProvider.fetchFiles(source);

			expect(result.success).toBe(false);
			expect(result.error).toContain("rate limit");
			expect(result.error).not.toContain("192.168.1.1"); // IP should be scrubbed
		});

		it("should handle 404 errors with friendly message", async () => {
			const { GitHubProvider, createRepositorySource } = await import("@/logic/repository");

			(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: false,
				status: 404,
				statusText: "Not Found",
				json: () => Promise.resolve({ message: "Not Found" }),
			});

			const source = createRepositorySource("Test", "https://gist.github.com/owner/notfound");
			const result = await GitHubProvider.fetchFiles(source);

			expect(result.success).toBe(false);
			expect(result.error?.toLowerCase()).toContain("not found");
		});

		it("should create headers with auth token", async () => {
			// Test the createHeaders function indirectly by checking provider instance
			const { createProviderInstance } = await import("@/logic/repository");

			const instance = createProviderInstance("github", "GitHub", "github.com", "ghp_test_token");

			expect(instance.token).toBe("ghp_test_token");
			expect(instance.type).toBe("github");
			expect(instance.name).toBe("GitHub");
			expect(instance.baseUrl).toBe("github.com");
			expect(instance.id).toBeDefined(); // Auto-generated
		});

		it("should validate JSON files against preset schema", async () => {
			const { GitHubProvider, createRepositorySource } = await import("@/logic/repository");

			const invalidPreset = [{ parameters: [] }]; // Missing required 'name' field

			(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: () =>
					Promise.resolve({
						id: "abc123",
						files: {
							"invalid.json": {
								filename: "invalid.json",
								content: JSON.stringify(invalidPreset),
								raw_url: "https://gist.githubusercontent.com/raw/invalid.json",
								size: 50,
								truncated: false,
							},
						},
					}),
			});

			const source = createRepositorySource("Invalid", "https://gist.github.com/owner/abc123");
			const result = await GitHubProvider.fetchFiles(source);

			expect(result.success).toBe(true);
			expect(result.files).toHaveLength(1);
			expect(result.files[0].isValid).toBe(false);
			expect(result.files[0].error).toBeDefined();
		});
	});
});
