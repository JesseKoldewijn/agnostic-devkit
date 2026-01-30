import { describe, expect, it } from "vitest";

import {
	PRESET_SCHEMA_DESCRIPTION,
	PRESET_SCHEMA_EXAMPLE,
	ParameterSchema,
	PresetSchema,
	PresetsArraySchema,
	createProviderInstance,
	createRepositorySource,
	generateRepositoryId,
	parseGitHubUrl,
	validatePresets,
} from "../logic/repository";

// ============================================================================
// Zod Schema Validation Tests
// ============================================================================

describe("Zod Schema Validation", () => {
	describe("ParameterSchema", () => {
		it("should validate a valid parameter with all fields", () => {
			const param = {
				id: "param-1",
				type: "queryParam",
				key: "debug",
				value: "true",
				description: "Enable debug mode",
				primitiveType: "boolean",
			};
			const result = ParameterSchema.safeParse(param);
			expect(result.success).toBe(true);
		});

		it("should validate a minimal parameter (required fields only)", () => {
			const param = {
				type: "queryParam",
				key: "test",
				value: "123",
			};
			const result = ParameterSchema.safeParse(param);
			expect(result.success).toBe(true);
		});

		it("should accept all valid parameter types", () => {
			const types = ["queryParam", "cookie", "localStorage"] as const;
			for (const type of types) {
				const param = { type, key: "k", value: "v" };
				const result = ParameterSchema.safeParse(param);
				expect(result.success, `type "${type}" should be valid`).toBe(true);
			}
		});

		it("should reject invalid parameter type", () => {
			const param = {
				type: "invalidType",
				key: "test",
				value: "123",
			};
			const result = ParameterSchema.safeParse(param);
			expect(result.success).toBe(false);
		});

		it("should reject missing required fields", () => {
			const testCases = [
				{ key: "test", value: "123" }, // missing type
				{ type: "queryParam", value: "123" }, // missing key
				{ type: "queryParam", key: "test" }, // missing value
			];

			for (const param of testCases) {
				const result = ParameterSchema.safeParse(param);
				expect(result.success).toBe(false);
			}
		});

		it("should reject wrong field types", () => {
			const param = {
				type: "queryParam",
				key: 123, // should be string
				value: "test",
			};
			const result = ParameterSchema.safeParse(param);
			expect(result.success).toBe(false);
		});
	});

	describe("PresetSchema", () => {
		it("should validate a valid preset with all fields", () => {
			const preset = {
				id: "preset-1",
				name: "Test Preset",
				description: "A test preset",
				parameters: [
					{ type: "queryParam", key: "debug", value: "true" },
					{ type: "cookie", key: "session", value: "abc123" },
				],
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};
			const result = PresetSchema.safeParse(preset);
			expect(result.success).toBe(true);
		});

		it("should validate a minimal preset (required fields only)", () => {
			const preset = {
				name: "Minimal Preset",
				parameters: [],
			};
			const result = PresetSchema.safeParse(preset);
			expect(result.success).toBe(true);
		});

		it("should reject empty preset name", () => {
			const preset = {
				name: "",
				parameters: [],
			};
			const result = PresetSchema.safeParse(preset);
			expect(result.success).toBe(false);
			if (!result.success) {
				// Zod 4 uses .issues instead of .errors
				expect(result.error.issues[0].message).toContain("required");
			}
		});

		it("should reject missing name", () => {
			const preset = {
				parameters: [],
			};
			const result = PresetSchema.safeParse(preset);
			expect(result.success).toBe(false);
		});

		it("should reject missing parameters", () => {
			const preset = {
				name: "Test",
			};
			const result = PresetSchema.safeParse(preset);
			expect(result.success).toBe(false);
		});

		it("should reject invalid parameters array", () => {
			const preset = {
				name: "Test",
				parameters: "not an array",
			};
			const result = PresetSchema.safeParse(preset);
			expect(result.success).toBe(false);
		});

		it("should reject preset with invalid parameter inside", () => {
			const preset = {
				name: "Test",
				parameters: [{ type: "invalidType", key: "k", value: "v" }],
			};
			const result = PresetSchema.safeParse(preset);
			expect(result.success).toBe(false);
		});
	});

	describe("PresetsArraySchema", () => {
		it("should validate an array of valid presets", () => {
			const presets = [
				{ name: "Preset 1", parameters: [] },
				{
					name: "Preset 2",
					parameters: [{ type: "queryParam", key: "k", value: "v" }],
				},
			];
			const result = PresetsArraySchema.safeParse(presets);
			expect(result.success).toBe(true);
		});

		it("should validate an empty array", () => {
			const result = PresetsArraySchema.safeParse([]);
			expect(result.success).toBe(true);
		});

		it("should reject non-array input", () => {
			const testCases = [
				{ name: "Single preset", parameters: [] }, // object, not array
				"string",
				123,
				null,
				undefined,
			];

			for (const input of testCases) {
				const result = PresetsArraySchema.safeParse(input);
				expect(result.success).toBe(false);
			}
		});

		it("should reject array with invalid preset", () => {
			const presets = [
				{ name: "Valid", parameters: [] },
				{ name: "", parameters: [] }, // invalid: empty name
			];
			const result = PresetsArraySchema.safeParse(presets);
			expect(result.success).toBe(false);
		});
	});

	describe("validatePresets helper", () => {
		it("should return success with valid presets", () => {
			const data = [{ name: "Test", parameters: [] }];
			const result = validatePresets(data);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.presets).toEqual(data);
			}
		});

		it("should return error with invalid data", () => {
			const data = { name: "Not an array" };
			const result = validatePresets(data);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBeDefined();
				expect(typeof result.error).toBe("string");
			}
		});

		it("should provide readable error messages", () => {
			const data = [{ name: "", parameters: [] }];
			const result = validatePresets(data);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContain("name");
			}
		});
	});
});

// ============================================================================
// Schema Info Constants Tests
// ============================================================================

describe("Schema Info Constants", () => {
	it("should have PRESET_SCHEMA_DESCRIPTION defined", () => {
		expect(PRESET_SCHEMA_DESCRIPTION).toBeDefined();
		expect(typeof PRESET_SCHEMA_DESCRIPTION).toBe("string");
		expect(PRESET_SCHEMA_DESCRIPTION.length).toBeGreaterThan(50);
	});

	it("should mention required fields in description", () => {
		expect(PRESET_SCHEMA_DESCRIPTION).toContain("name");
		expect(PRESET_SCHEMA_DESCRIPTION).toContain("parameters");
		expect(PRESET_SCHEMA_DESCRIPTION).toContain("type");
		expect(PRESET_SCHEMA_DESCRIPTION).toContain("key");
		expect(PRESET_SCHEMA_DESCRIPTION).toContain("value");
	});

	it("should have PRESET_SCHEMA_EXAMPLE defined as valid JSON", () => {
		expect(PRESET_SCHEMA_EXAMPLE).toBeDefined();
		const parsed = JSON.parse(PRESET_SCHEMA_EXAMPLE);
		expect(Array.isArray(parsed)).toBe(true);
	});

	it("should have example that passes schema validation", () => {
		const parsed = JSON.parse(PRESET_SCHEMA_EXAMPLE);
		const result = PresetsArraySchema.safeParse(parsed);
		expect(result.success).toBe(true);
	});
});

// ============================================================================
// Helper Functions Tests
// ============================================================================

describe("Helper Functions", () => {
	describe("generateRepositoryId", () => {
		it("should generate unique IDs", () => {
			const ids = new Set<string>();
			for (let i = 0; i < 100; i++) {
				ids.add(generateRepositoryId());
			}
			expect(ids.size).toBe(100);
		});

		it("should start with 'repo-' prefix", () => {
			const id = generateRepositoryId();
			expect(id.startsWith("repo-")).toBe(true);
		});
	});

	describe("createProviderInstance", () => {
		it("should create a provider instance with all fields", () => {
			const instance = createProviderInstance("github", "My GitHub", "github.com", "ghp_token123");

			expect(instance.id).toMatch(/^repo-/);
			expect(instance.type).toBe("github");
			expect(instance.name).toBe("My GitHub");
			expect(instance.baseUrl).toBe("github.com");
			expect(instance.token).toBe("ghp_token123");
		});

		it("should create a provider instance without token", () => {
			const instance = createProviderInstance("github", "Public GitHub", "github.com");

			expect(instance.token).toBeUndefined();
		});
	});

	describe("createRepositorySource", () => {
		it("should create a source with provider instance", () => {
			const source = createRepositorySource(
				"My Presets",
				"https://github.com/user/repo",
				"github",
				"provider-123"
			);

			expect(source.id).toMatch(/^repo-/);
			expect(source.name).toBe("My Presets");
			expect(source.url).toBe("https://github.com/user/repo");
			expect(source.type).toBe("github");
			expect(source.providerInstanceId).toBe("provider-123");
		});

		it("should create a source without provider instance (public URL)", () => {
			const source = createRepositorySource(
				"Public Presets",
				"https://example.com/presets.json",
				"url"
			);

			expect(source.type).toBe("url");
			expect(source.providerInstanceId).toBeUndefined();
		});

		it("should default to github type", () => {
			const source = createRepositorySource("GitHub Presets", "https://github.com/user/repo");

			expect(source.type).toBe("github");
		});
	});
});

// ============================================================================
// GitHub URL Parsing Tests (for provider implementation)
// ============================================================================

describe("GitHub URL Parsing", () => {
	describe("Repository URLs", () => {
		it("should parse basic repo URL: github.com/user/repo", () => {
			const result = parseGitHubUrl("https://github.com/user/repo");
			expect(result).not.toBeNull();
			expect(result?.type).toBe("repo");
			expect(result?.owner).toBe("user");
			expect(result?.repo).toBe("repo");
			expect(result?.ref).toBe("main");
		});

		it("should parse repo URL with branch: github.com/user/repo/tree/develop", () => {
			const result = parseGitHubUrl("https://github.com/user/repo/tree/develop");
			expect(result).not.toBeNull();
			expect(result?.type).toBe("repo");
			expect(result?.owner).toBe("user");
			expect(result?.repo).toBe("repo");
			expect(result?.ref).toBe("develop");
		});

		it("should parse blob URL: github.com/user/repo/blob/main/presets.json", () => {
			const result = parseGitHubUrl("https://github.com/user/repo/blob/main/presets.json");
			expect(result).not.toBeNull();
			expect(result?.type).toBe("blob");
			expect(result?.owner).toBe("user");
			expect(result?.repo).toBe("repo");
			expect(result?.ref).toBe("main");
			expect(result?.path).toBe("presets.json");
		});

		it("should parse blob URL with nested path", () => {
			const result = parseGitHubUrl(
				"https://github.com/user/repo/blob/main/config/presets/dev.json"
			);
			expect(result).not.toBeNull();
			expect(result?.type).toBe("blob");
			expect(result?.path).toBe("config/presets/dev.json");
		});

		it("should parse raw URL: raw.githubusercontent.com/user/repo/main/file.json", () => {
			const result = parseGitHubUrl("https://raw.githubusercontent.com/user/repo/main/file.json");
			expect(result).not.toBeNull();
			expect(result?.type).toBe("raw");
			expect(result?.owner).toBe("user");
			expect(result?.repo).toBe("repo");
			expect(result?.ref).toBe("main");
			expect(result?.path).toBe("file.json");
		});
	});

	describe("Gist URLs", () => {
		it("should parse gist URL: gist.github.com/user/gistid", () => {
			const result = parseGitHubUrl("https://gist.github.com/user/abc123def456");
			expect(result).not.toBeNull();
			expect(result?.type).toBe("gist");
			expect(result?.owner).toBe("user");
			expect(result?.gistId).toBe("abc123def456");
		});

		it("should parse gist URL with filename hash: gist.github.com/user/id#file-presets-json", () => {
			const result = parseGitHubUrl("https://gist.github.com/user/abc123def456#file-presets-json");
			expect(result).not.toBeNull();
			expect(result?.type).toBe("gist");
			expect(result?.gistId).toBe("abc123def456");
			expect(result?.filename).toBe("presets.json");
		});

		it("should parse raw gist URL: gist.githubusercontent.com/user/id/raw/file.json", () => {
			const result = parseGitHubUrl(
				"https://gist.githubusercontent.com/user/abc123def456/raw/presets.json"
			);
			expect(result).not.toBeNull();
			expect(result?.type).toBe("gist");
			expect(result?.owner).toBe("user");
			expect(result?.gistId).toBe("abc123def456");
			expect(result?.filename).toBe("presets.json");
		});
	});

	describe("Custom Domain (GitHub Enterprise)", () => {
		it("should parse repo URL with custom domain: git.company.com/user/repo", () => {
			const result = parseGitHubUrl("https://git.company.com/user/repo", "git.company.com");
			expect(result).not.toBeNull();
			expect(result?.type).toBe("repo");
			expect(result?.owner).toBe("user");
			expect(result?.repo).toBe("repo");
		});

		it("should parse blob URL with custom domain", () => {
			const result = parseGitHubUrl(
				"https://git.company.com/user/repo/blob/main/config.json",
				"git.company.com"
			);
			expect(result).not.toBeNull();
			expect(result?.type).toBe("blob");
			expect(result?.path).toBe("config.json");
		});

		it("should parse raw URL pattern on enterprise: /user/repo/raw/ref/path", () => {
			const result = parseGitHubUrl(
				"https://git.company.com/user/repo/raw/main/presets.json",
				"git.company.com"
			);
			expect(result).not.toBeNull();
			expect(result?.type).toBe("raw");
			expect(result?.path).toBe("presets.json");
		});

		it("should reject URL when domain doesn't match base URL", () => {
			const result = parseGitHubUrl("https://github.com/user/repo", "git.company.com");
			expect(result).toBeNull();
		});
	});

	describe("Edge Cases", () => {
		it("should return null for invalid URLs", () => {
			expect(parseGitHubUrl("not-a-url")).toBeNull();
			expect(parseGitHubUrl("")).toBeNull();
		});

		it("should return null for non-GitHub URLs", () => {
			expect(parseGitHubUrl("https://gitlab.com/user/repo")).toBeNull();
			expect(parseGitHubUrl("https://bitbucket.org/user/repo")).toBeNull();
		});

		it("should handle URLs with trailing slashes", () => {
			const result = parseGitHubUrl("https://github.com/user/repo/");
			expect(result).not.toBeNull();
			expect(result?.owner).toBe("user");
			expect(result?.repo).toBe("repo");
		});

		it("should handle URLs with www prefix", () => {
			const result = parseGitHubUrl("https://www.github.com/user/repo");
			expect(result).not.toBeNull();
			expect(result?.owner).toBe("user");
		});
	});
});

// ============================================================================
// Type Guards and Inference Tests
// ============================================================================

describe("Type Inference", () => {
	it("should infer correct types from validated data", () => {
		const data = [
			{
				name: "Test",
				parameters: [{ type: "queryParam" as const, key: "k", value: "v" }],
			},
		];
		const result = PresetsArraySchema.safeParse(data);

		if (result.success) {
			// TypeScript should infer the correct type
			const presets = result.data;
			const firstPreset = presets[0];
			expect(firstPreset.name).toBe("Test");
			expect(firstPreset.parameters[0].type).toBe("queryParam");
		} else {
			throw new Error("Validation should have succeeded");
		}
	});
});
