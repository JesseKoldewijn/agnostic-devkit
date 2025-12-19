import { describe, expect, it } from "vitest";
import type { Parameter, ParameterType, Preset } from "../logic/parameters/types";
import { createEmptyParameter, createEmptyPreset, generateId } from "../logic/parameters/types";

describe("types", () => {
	describe("generateId", () => {
		it("should generate a unique string ID", () => {
			const id = generateId();
			expect(typeof id).toBe("string");
			expect(id.length).toBeGreaterThan(0);
		});

		it("should generate different IDs on subsequent calls", () => {
			const id1 = generateId();
			const id2 = generateId();
			const id3 = generateId();

			expect(id1).not.toBe(id2);
			expect(id2).not.toBe(id3);
			expect(id1).not.toBe(id3);
		});

		it("should contain a timestamp component", () => {
			const before = Date.now();
			const id = generateId();
			const after = Date.now();

			// ID format is "timestamp-randomstring"
			const timestampPart = parseInt(id.split("-")[0], 10);
			expect(timestampPart).toBeGreaterThanOrEqual(before);
			expect(timestampPart).toBeLessThanOrEqual(after);
		});

		it("should contain a random component", () => {
			const id = generateId();
			const parts = id.split("-");

			// Should have timestamp and random part
			expect(parts).toHaveLength(2);
			expect(parts[1].length).toBeGreaterThan(0);
		});
	});

	describe("createEmptyParameter", () => {
		it("should create a parameter with default queryParam type", () => {
			const param = createEmptyParameter();

			expect(param.type).toBe("queryParam");
			expect(param.key).toBe("");
			expect(param.value).toBe("");
			expect(param.id).toBeTruthy();
		});

		it("should create a parameter with specified type", () => {
			const cookieParam = createEmptyParameter("cookie");
			expect(cookieParam.type).toBe("cookie");

			const localStorageParam = createEmptyParameter("localStorage");
			expect(localStorageParam.type).toBe("localStorage");

			const queryParamParam = createEmptyParameter("queryParam");
			expect(queryParamParam.type).toBe("queryParam");
		});

		it("should generate unique IDs for each parameter", () => {
			const param1 = createEmptyParameter();
			const param2 = createEmptyParameter();

			expect(param1.id).not.toBe(param2.id);
		});

		it("should create parameters with empty key and value", () => {
			const param = createEmptyParameter("cookie");

			expect(param.key).toBe("");
			expect(param.value).toBe("");
		});

		it("should not include description by default", () => {
			const param = createEmptyParameter();

			expect(param.description).toBeUndefined();
		});
	});

	describe("createEmptyPreset", () => {
		it("should create a preset with empty name", () => {
			const preset = createEmptyPreset();

			expect(preset.name).toBe("");
		});

		it("should create a preset with empty parameters array", () => {
			const preset = createEmptyPreset();

			expect(preset.parameters).toStrictEqual([]);
			expect(Array.isArray(preset.parameters)).toBeTruthy();
		});

		it("should generate a unique ID", () => {
			const preset1 = createEmptyPreset();
			const preset2 = createEmptyPreset();

			expect(preset1.id).toBeTruthy();
			expect(preset2.id).toBeTruthy();
			expect(preset1.id).not.toBe(preset2.id);
		});

		it("should set createdAt timestamp", () => {
			const before = Date.now();
			const preset = createEmptyPreset();
			const after = Date.now();

			expect(preset.createdAt).toBeGreaterThanOrEqual(before);
			expect(preset.createdAt).toBeLessThanOrEqual(after);
		});

		it("should set updatedAt timestamp", () => {
			const before = Date.now();
			const preset = createEmptyPreset();
			const after = Date.now();

			expect(preset.updatedAt).toBeGreaterThanOrEqual(before);
			expect(preset.updatedAt).toBeLessThanOrEqual(after);
		});

		it("should have matching createdAt and updatedAt for new presets", () => {
			const preset = createEmptyPreset();

			// They should be very close (within a few ms)
			expect(Math.abs((preset.createdAt ?? 0) - (preset.updatedAt ?? 0))).toBeLessThan(10);
		});

		it("should not include description by default", () => {
			const preset = createEmptyPreset();

			expect(preset.description).toBeUndefined();
		});
	});

	describe("type definitions", () => {
		it("should allow valid ParameterType values", () => {
			const types: ParameterType[] = ["queryParam", "cookie", "localStorage"];

			types.forEach((type) => {
				const param = createEmptyParameter(type);
				expect(param.type).toBe(type);
			});
		});

		it("should create valid Parameter objects", () => {
			const param: Parameter = {
				description: "Test description",
				id: "test-id",
				key: "testKey",
				type: "queryParam",
				value: "testValue",
			};

			expect(param.id).toBe("test-id");
			expect(param.type).toBe("queryParam");
			expect(param.key).toBe("testKey");
			expect(param.value).toBe("testValue");
			expect(param.description).toBe("Test description");
		});

		it("should create valid Preset objects", () => {
			const preset: Preset = {
				createdAt: Date.now(),
				description: "Test description",
				id: "preset-id",
				name: "Test Preset",
				parameters: [
					{
						id: "param-1",
						key: "key1",
						type: "queryParam",
						value: "value1",
					},
				],
				updatedAt: Date.now(),
			};

			expect(preset.id).toBe("preset-id");
			expect(preset.name).toBe("Test Preset");
			expect(preset.parameters).toHaveLength(1);
		});
	});
});
