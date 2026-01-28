import { describe, expect, it } from "vitest";

import type { Parameter, Preset } from "../logic/parameters/types";
import { PresetCoder } from "../utils/presetCoder";

describe("PresetCoder", () => {
	// Helper to create a test preset
	const createTestPreset = (overrides: Partial<Preset> = {}): Preset => ({
		createdAt: 1700000000000,
		id: "test-id-123",
		name: "Test Preset",
		parameters: [],
		updatedAt: 1700000000000,
		...overrides,
	});

	// Helper to create a test parameter
	const createTestParameter = (overrides: Partial<Parameter> = {}): Parameter => ({
		id: "param-id-456",
		key: "testKey",
		type: "queryParam",
		value: "testValue",
		...overrides,
	});

	describe("compress", () => {
		it("should return a non-empty string for a single preset", () => {
			const preset = createTestPreset({ name: "Debug Mode" });
			const result = PresetCoder.compress([preset]);

			expect(typeof result).toBe("string");
			expect(result.length).toBeGreaterThan(0);
		});

		it("should return a URL-safe string (no special URL characters)", () => {
			const preset = createTestPreset({
				name: "Test with special chars: &?=#",
				parameters: [createTestParameter({ key: "foo", value: "bar&baz=qux" })],
			});
			const result = PresetCoder.compress([preset]);

			// URL-safe means no unencoded &, ?, =, #, /, etc.
			// lz-string's compressToEncodedURIComponent produces URL-safe output
			expect(result).not.toMatch(/[&?=#/]/);
		});

		it("should compress multiple presets", () => {
			const presets = [
				createTestPreset({ name: "Preset 1" }),
				createTestPreset({ name: "Preset 2" }),
				createTestPreset({ name: "Preset 3" }),
			];
			const result = PresetCoder.compress(presets);

			expect(typeof result).toBe("string");
			expect(result.length).toBeGreaterThan(0);
		});

		it("should handle presets with all parameter types", () => {
			const preset = createTestPreset({
				name: "All Types",
				parameters: [
					createTestParameter({ key: "query", type: "queryParam", value: "1" }),
					createTestParameter({ key: "cook", type: "cookie", value: "2" }),
					createTestParameter({ key: "local", type: "localStorage", value: "3" }),
				],
			});
			const result = PresetCoder.compress([preset]);

			expect(typeof result).toBe("string");
			expect(result.length).toBeGreaterThan(0);
		});

		it("should handle boolean primitiveType", () => {
			const preset = createTestPreset({
				name: "Boolean Test",
				parameters: [
					createTestParameter({ key: "enabled", primitiveType: "boolean", value: "true" }),
				],
			});
			const result = PresetCoder.compress([preset]);

			expect(typeof result).toBe("string");
		});

		it("should handle empty parameters array", () => {
			const preset = createTestPreset({ name: "Empty", parameters: [] });
			const result = PresetCoder.compress([preset]);

			expect(typeof result).toBe("string");
			expect(result.length).toBeGreaterThan(0);
		});

		it("should handle unicode characters", () => {
			const preset = createTestPreset({
				description: "Emoji test 🚀🎉",
				name: "日本語テスト",
				parameters: [createTestParameter({ key: "名前", value: "値" })],
			});
			const result = PresetCoder.compress([preset]);

			expect(typeof result).toBe("string");
			expect(result.length).toBeGreaterThan(0);
		});

		it("should handle preset with description", () => {
			const preset = createTestPreset({
				description: "This is a detailed description of the preset",
				name: "With Description",
			});
			const result = PresetCoder.compress([preset]);

			expect(typeof result).toBe("string");
		});

		it("should handle parameter with description", () => {
			const preset = createTestPreset({
				name: "Param Description",
				parameters: [
					createTestParameter({
						description: "This parameter enables debug mode",
						key: "debug",
						value: "true",
					}),
				],
			});
			const result = PresetCoder.compress([preset]);

			expect(typeof result).toBe("string");
		});
	});

	describe("decompress", () => {
		it("should return an object with result, count, and isMultiplePresets", () => {
			const original = [createTestPreset({ name: "Test" })];
			const compressed = PresetCoder.compress(original);
			const result = PresetCoder.decompress(compressed);

			expect(result).toHaveProperty("result");
			expect(result).toHaveProperty("count");
			expect(result).toHaveProperty("isMultiplePresets");
			expect(Array.isArray(result.result)).toBe(true);
			expect(typeof result.count).toBe("number");
			expect(typeof result.isMultiplePresets).toBe("boolean");
		});

		it("should set count and isMultiplePresets correctly for single preset", () => {
			const original = [createTestPreset({ name: "Test" })];
			const compressed = PresetCoder.compress(original);
			const result = PresetCoder.decompress(compressed);

			expect(result.count).toBe(1);
			expect(result.isMultiplePresets).toBe(false);
			expect(result.result.length).toBe(1);
		});

		it("should set count and isMultiplePresets correctly for multiple presets", () => {
			const original = [
				createTestPreset({ name: "Preset 1" }),
				createTestPreset({ name: "Preset 2" }),
				createTestPreset({ name: "Preset 3" }),
			];
			const compressed = PresetCoder.compress(original);
			const result = PresetCoder.decompress(compressed);

			expect(result.count).toBe(3);
			expect(result.isMultiplePresets).toBe(true);
			expect(result.result.length).toBe(3);
		});

		it("should regenerate IDs on decompress", () => {
			const original = [createTestPreset({ id: "original-id", name: "Test" })];
			const compressed = PresetCoder.compress(original);
			const { result } = PresetCoder.decompress(compressed);

			// ID should be regenerated, not the original
			expect(result[0].id).not.toBe("original-id");
			expect(result[0].id).toBeTruthy();
		});

		it("should regenerate parameter IDs on decompress", () => {
			const original = [
				createTestPreset({
					name: "Test",
					parameters: [createTestParameter({ id: "original-param-id" })],
				}),
			];
			const compressed = PresetCoder.compress(original);
			const { result } = PresetCoder.decompress(compressed);

			expect(result[0].parameters[0].id).not.toBe("original-param-id");
			expect(result[0].parameters[0].id).toBeTruthy();
		});

		it("should set createdAt and updatedAt on decompress", () => {
			const original = [createTestPreset({ name: "Test" })];
			const compressed = PresetCoder.compress(original);
			const beforeDecompress = Date.now();
			const { result } = PresetCoder.decompress(compressed);

			expect(result[0].createdAt).toBeGreaterThanOrEqual(beforeDecompress);
			expect(result[0].updatedAt).toBeGreaterThanOrEqual(beforeDecompress);
		});

		it("should preserve preset name and description", () => {
			const original = [
				createTestPreset({
					description: "Test description",
					name: "My Preset",
				}),
			];
			const compressed = PresetCoder.compress(original);
			const { result } = PresetCoder.decompress(compressed);

			expect(result[0].name).toBe("My Preset");
			expect(result[0].description).toBe("Test description");
		});

		it("should preserve parameter properties", () => {
			const original = [
				createTestPreset({
					name: "Test",
					parameters: [
						createTestParameter({
							description: "Debug param",
							key: "debug",
							primitiveType: "boolean",
							type: "queryParam",
							value: "true",
						}),
					],
				}),
			];
			const compressed = PresetCoder.compress(original);
			const { result } = PresetCoder.decompress(compressed);

			const param = result[0].parameters[0];
			expect(param.key).toBe("debug");
			expect(param.value).toBe("true");
			expect(param.type).toBe("queryParam");
			expect(param.primitiveType).toBe("boolean");
			expect(param.description).toBe("Debug param");
		});

		it("should handle all parameter types correctly", () => {
			const original = [
				createTestPreset({
					name: "All Types",
					parameters: [
						createTestParameter({ key: "q", type: "queryParam", value: "1" }),
						createTestParameter({ key: "c", type: "cookie", value: "2" }),
						createTestParameter({ key: "l", type: "localStorage", value: "3" }),
					],
				}),
			];
			const compressed = PresetCoder.compress(original);
			const { result } = PresetCoder.decompress(compressed);

			expect(result[0].parameters[0].type).toBe("queryParam");
			expect(result[0].parameters[1].type).toBe("cookie");
			expect(result[0].parameters[2].type).toBe("localStorage");
		});

		it("should handle unicode characters in round-trip", () => {
			const original = [
				createTestPreset({
					description: "Emoji test 🚀🎉",
					name: "日本語テスト",
					parameters: [createTestParameter({ key: "名前", value: "値" })],
				}),
			];
			const compressed = PresetCoder.compress(original);
			const { result } = PresetCoder.decompress(compressed);

			expect(result[0].name).toBe("日本語テスト");
			expect(result[0].description).toBe("Emoji test 🚀🎉");
			expect(result[0].parameters[0].key).toBe("名前");
			expect(result[0].parameters[0].value).toBe("値");
		});
	});

	describe("compression efficiency", () => {
		it("should produce output significantly smaller than JSON.stringify", () => {
			const preset = createTestPreset({
				name: "Debug Mode with Long Name",
				parameters: [
					createTestParameter({ key: "debug", type: "queryParam", value: "true" }),
					createTestParameter({ key: "verbose", type: "queryParam", value: "true" }),
					createTestParameter({ key: "logLevel", type: "localStorage", value: "debug" }),
				],
			});

			const jsonLength = JSON.stringify([preset]).length;
			const compressedLength = PresetCoder.compress([preset]).length;

			// Compressed should be at least 50% smaller than raw JSON
			expect(compressedLength).toBeLessThan(jsonLength * 0.5);
		});

		it("should handle large presets efficiently", () => {
			const parameters = Array.from({ length: 10 }, (_, i) =>
				createTestParameter({
					key: `param${i}`,
					type: i % 3 === 0 ? "queryParam" : i % 3 === 1 ? "cookie" : "localStorage",
					value: `value${i}`,
				}),
			);
			const preset = createTestPreset({
				description: "A preset with many parameters for testing compression",
				name: "Large Preset",
				parameters,
			});

			const jsonLength = JSON.stringify([preset]).length;
			const compressedLength = PresetCoder.compress([preset]).length;

			// Should still be significantly smaller
			expect(compressedLength).toBeLessThan(jsonLength * 0.5);
		});

		it("should benefit from compression with multiple similar presets", () => {
			const presets = Array.from({ length: 5 }, (_, i) =>
				createTestPreset({
					name: `Preset ${i}`,
					parameters: [
						createTestParameter({ key: "debug", type: "queryParam", value: "true" }),
						createTestParameter({ key: "env", type: "queryParam", value: "staging" }),
					],
				}),
			);

			const jsonLength = JSON.stringify(presets).length;
			const compressedLength = PresetCoder.compress(presets).length;

			// LZ compression should be very effective with repetitive data
			expect(compressedLength).toBeLessThan(jsonLength * 0.4);
		});
	});

	describe("error handling", () => {
		it("should throw on invalid compressed string", () => {
			expect(() => PresetCoder.decompress("invalid-string")).toThrow();
		});

		it("should throw on empty string", () => {
			expect(() => PresetCoder.decompress("")).toThrow();
		});

		it("should handle empty array", () => {
			const compressed = PresetCoder.compress([]);
			const result = PresetCoder.decompress(compressed);

			expect(result.result).toEqual([]);
			expect(result.count).toBe(0);
			expect(result.isMultiplePresets).toBe(false);
		});
	});
});
