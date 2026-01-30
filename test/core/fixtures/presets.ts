/**
 * Shared test fixtures for preset and parameter data
 */
import type { Parameter, Preset } from "@/logic/parameters/types";

/**
 * Create a valid parameter for testing
 */
export function createParameter(overrides: Partial<Parameter> = {}): Parameter {
	return {
		id: `param-${Date.now()}-${Math.random().toString(36).slice(2)}`,
		type: "queryParam",
		key: "testKey",
		value: "testValue",
		...overrides,
	};
}

/**
 * Create a valid preset for testing
 */
export function createPreset(overrides: Partial<Preset> = {}): Preset {
	const now = Date.now();
	return {
		id: `preset-${now}-${Math.random().toString(36).slice(2)}`,
		name: "Test Preset",
		parameters: [],
		createdAt: now,
		updatedAt: now,
		...overrides,
	};
}

/**
 * Create a preset with parameters for testing
 */
export function createPresetWithParams(
	paramCount: number = 1,
	presetOverrides: Partial<Preset> = {},
	paramOverrides: Partial<Parameter> = {}
): Preset {
	const parameters = Array.from({ length: paramCount }, (_, i) =>
		createParameter({
			key: `key${i + 1}`,
			value: `value${i + 1}`,
			...paramOverrides,
		})
	);

	return createPreset({
		parameters,
		...presetOverrides,
	});
}

/**
 * Sample presets for common test scenarios
 */
export const samplePresets = {
	empty: createPreset({ name: "Empty Preset", parameters: [] }),

	withQueryParam: createPreset({
		name: "Query Param Preset",
		parameters: [createParameter({ type: "queryParam", key: "debug", value: "true" })],
	}),

	withCookie: createPreset({
		name: "Cookie Preset",
		parameters: [createParameter({ type: "cookie", key: "session", value: "abc123" })],
	}),

	withLocalStorage: createPreset({
		name: "LocalStorage Preset",
		parameters: [createParameter({ type: "localStorage", key: "theme", value: "dark" })],
	}),

	withMixedParams: createPreset({
		name: "Mixed Params Preset",
		parameters: [
			createParameter({ type: "queryParam", key: "debug", value: "true" }),
			createParameter({ type: "cookie", key: "session", value: "abc123" }),
			createParameter({ type: "localStorage", key: "theme", value: "dark" }),
		],
	}),
};

/**
 * Invalid preset data for testing validation
 */
export const invalidPresets = {
	missingName: { parameters: [] },
	emptyName: { name: "", parameters: [] },
	invalidParameterType: {
		name: "Invalid",
		parameters: [{ type: "invalid", key: "test", value: "test" }],
	},
	missingParameterKey: {
		name: "Missing Key",
		parameters: [{ type: "queryParam", value: "test" }],
	},
};
