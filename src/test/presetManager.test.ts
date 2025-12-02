import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
	togglePreset,
	activatePreset,
	deactivatePreset,
	getPresetsWithActiveState,
	createPreset,
	updatePreset,
	deletePreset,
	addParameterToPreset,
	updateParameterInPreset,
	removeParameterFromPreset,
	duplicatePreset,
	reorderParameters,
	exportPresets,
	importPresets,
} from "../logic/parameters/presetManager";
import type { Preset } from "../logic/parameters/types";

describe("presetManager", () => {
	let mockSyncStorage: Record<string, any>;
	let mockLocalStorage: Record<string, any>;
	let mockTabUrl: string;

	beforeEach(() => {
		mockSyncStorage = {};
		mockLocalStorage = {};
		mockTabUrl = "https://example.com/page";

		vi.clearAllMocks();

		// Mock chrome.tabs
		(globalThis.chrome.tabs as any).get = vi.fn(async (tabId: number) => ({
			id: tabId,
			url: mockTabUrl,
		}));

		(globalThis.chrome.tabs as any).update = vi.fn(
			async (tabId: number, props: any) => {
				if (props.url) mockTabUrl = props.url;
				return { id: tabId, url: mockTabUrl };
			}
		);

		// Mock chrome.cookies
		(globalThis.chrome as any).cookies = {
			set: vi.fn(async () => ({})),
			get: vi.fn(async () => null),
			remove: vi.fn(async () => ({})),
		};

		// Mock chrome.scripting
		(globalThis.chrome as any).scripting = {
			executeScript: vi.fn(async () => [{ result: undefined }]),
		};

		// Mock chrome.storage.sync
		(globalThis.chrome.storage.sync.get as any).mockImplementation(
			async (keys: string[]) => {
				const result: Record<string, any> = {};
				for (const key of keys) {
					if (mockSyncStorage[key] !== undefined) {
						result[key] = mockSyncStorage[key];
					}
				}
				return result;
			}
		);

		(globalThis.chrome.storage.sync.set as any).mockImplementation(
			async (data: Record<string, any>) => {
				Object.assign(mockSyncStorage, data);
			}
		);

		// Mock chrome.storage.local
		(globalThis.chrome.storage as any).local = {
			get: vi.fn(async (keys: string[]) => {
				const result: Record<string, any> = {};
				for (const key of keys) {
					if (mockLocalStorage[key] !== undefined) {
						result[key] = mockLocalStorage[key];
					}
				}
				return result;
			}),
			set: vi.fn(async (data: Record<string, any>) => {
				Object.assign(mockLocalStorage, data);
			}),
		};
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("togglePreset", () => {
		it("should activate an inactive preset", async () => {
			const preset: Preset = {
				id: "preset1",
				name: "Test Preset",
				parameters: [],
			};
			mockSyncStorage.presets = [preset];
			mockLocalStorage.tabPresetStates = {};

			const result = await togglePreset(123, "preset1");
			expect(result.active).toBe(true);
			expect(result.success).toBe(true);
		});

		it("should deactivate an active preset", async () => {
			const preset: Preset = {
				id: "preset1",
				name: "Test Preset",
				parameters: [],
			};
			mockSyncStorage.presets = [preset];
			mockLocalStorage.tabPresetStates = { "123": ["preset1"] };

			const result = await togglePreset(123, "preset1");
			expect(result.active).toBe(false);
			expect(result.success).toBe(true);
		});

		it("should update tab preset state when activating", async () => {
			const preset: Preset = {
				id: "preset1",
				name: "Test Preset",
				parameters: [],
			};
			mockSyncStorage.presets = [preset];
			mockLocalStorage.tabPresetStates = {};

			await togglePreset(123, "preset1");
			expect(mockLocalStorage.tabPresetStates["123"]).toContain("preset1");
		});

		it("should update tab preset state when deactivating", async () => {
			const preset: Preset = {
				id: "preset1",
				name: "Test Preset",
				parameters: [],
			};
			mockSyncStorage.presets = [preset];
			mockLocalStorage.tabPresetStates = { "123": ["preset1"] };

			await togglePreset(123, "preset1");
			expect(mockLocalStorage.tabPresetStates["123"] || []).not.toContain(
				"preset1"
			);
		});
	});

	describe("activatePreset", () => {
		it("should activate an inactive preset", async () => {
			const preset: Preset = {
				id: "preset1",
				name: "Test Preset",
				parameters: [],
			};
			mockSyncStorage.presets = [preset];
			mockLocalStorage.tabPresetStates = {};

			const result = await activatePreset(123, "preset1");
			expect(result).toBe(true);
		});

		it("should return true if preset is already active", async () => {
			const preset: Preset = {
				id: "preset1",
				name: "Test Preset",
				parameters: [],
			};
			mockSyncStorage.presets = [preset];
			mockLocalStorage.tabPresetStates = { "123": ["preset1"] };

			const result = await activatePreset(123, "preset1");
			expect(result).toBe(true);
		});

		it("should update tab preset state", async () => {
			const preset: Preset = {
				id: "preset1",
				name: "Test Preset",
				parameters: [],
			};
			mockSyncStorage.presets = [preset];
			mockLocalStorage.tabPresetStates = {};

			await activatePreset(123, "preset1");
			expect(mockLocalStorage.tabPresetStates["123"]).toContain("preset1");
		});
	});

	describe("deactivatePreset", () => {
		it("should deactivate an active preset", async () => {
			const preset: Preset = {
				id: "preset1",
				name: "Test Preset",
				parameters: [],
			};
			mockSyncStorage.presets = [preset];
			mockLocalStorage.tabPresetStates = { "123": ["preset1"] };

			const result = await deactivatePreset(123, "preset1");
			expect(result).toBe(true);
		});

		it("should return true if preset is already inactive", async () => {
			const preset: Preset = {
				id: "preset1",
				name: "Test Preset",
				parameters: [],
			};
			mockSyncStorage.presets = [preset];
			mockLocalStorage.tabPresetStates = {};

			const result = await deactivatePreset(123, "preset1");
			expect(result).toBe(true);
		});
	});

	describe("getPresetsWithActiveState", () => {
		it("should return presets with isActive flag", async () => {
			const preset1: Preset = { id: "p1", name: "Preset 1", parameters: [] };
			const preset2: Preset = { id: "p2", name: "Preset 2", parameters: [] };
			mockSyncStorage.presets = [preset1, preset2];
			mockLocalStorage.tabPresetStates = { "123": ["p1"] };

			const result = await getPresetsWithActiveState(123);
			expect(result.length).toBe(2);
			expect(result.find((p) => p.id === "p1")?.isActive).toBe(true);
			expect(result.find((p) => p.id === "p2")?.isActive).toBe(false);
		});

		it("should return empty array when no presets exist", async () => {
			mockSyncStorage.presets = [];
			mockLocalStorage.tabPresetStates = {};

			const result = await getPresetsWithActiveState(123);
			expect(result).toEqual([]);
		});
	});

	describe("createPreset", () => {
		it("should create a new preset", async () => {
			mockSyncStorage.presets = [];

			const preset = await createPreset({
				name: "New Preset",
				parameters: [],
			});

			expect(preset.name).toBe("New Preset");
			expect(preset.id).toBeTruthy();
			expect(mockSyncStorage.presets.length).toBe(1);
		});

		it("should generate unique ID", async () => {
			mockSyncStorage.presets = [];

			const preset1 = await createPreset({
				name: "Preset 1",
				parameters: [],
			});
			const preset2 = await createPreset({
				name: "Preset 2",
				parameters: [],
			});

			expect(preset1.id).not.toBe(preset2.id);
		});

		it("should include description if provided", async () => {
			mockSyncStorage.presets = [];

			const preset = await createPreset({
				name: "Preset",
				description: "Test description",
				parameters: [],
			});

			expect(preset.description).toBe("Test description");
		});
	});

	describe("updatePreset", () => {
		it("should update preset properties", async () => {
			mockSyncStorage.presets = [
				{ id: "p1", name: "Original", parameters: [] },
			];

			await updatePreset("p1", { name: "Updated" });
			expect(mockSyncStorage.presets[0].name).toBe("Updated");
		});

		it("should update description", async () => {
			mockSyncStorage.presets = [
				{ id: "p1", name: "Preset", parameters: [] },
			];

			await updatePreset("p1", { description: "New description" });
			expect(mockSyncStorage.presets[0].description).toBe("New description");
		});
	});

	describe("deletePreset", () => {
		it("should delete a preset", async () => {
			mockSyncStorage.presets = [
				{ id: "p1", name: "Preset 1", parameters: [] },
				{ id: "p2", name: "Preset 2", parameters: [] },
			];
			mockLocalStorage.tabPresetStates = {};

			await deletePreset("p1");
			expect(mockSyncStorage.presets.length).toBe(1);
			expect(mockSyncStorage.presets[0].id).toBe("p2");
		});
	});

	describe("addParameterToPreset", () => {
		it("should add a parameter to a preset", async () => {
			mockSyncStorage.presets = [
				{ id: "p1", name: "Preset", parameters: [] },
			];

			const param = await addParameterToPreset("p1", {
				type: "queryParam",
				key: "test",
				value: "value",
			});

			expect(param.id).toBeTruthy();
			expect(param.key).toBe("test");
			expect(mockSyncStorage.presets[0].parameters.length).toBe(1);
		});

		it("should generate unique parameter ID", async () => {
			mockSyncStorage.presets = [
				{ id: "p1", name: "Preset", parameters: [] },
			];

			const param1 = await addParameterToPreset("p1", {
				type: "queryParam",
				key: "key1",
				value: "val1",
			});
			const param2 = await addParameterToPreset("p1", {
				type: "queryParam",
				key: "key2",
				value: "val2",
			});

			expect(param1.id).not.toBe(param2.id);
		});
	});

	describe("updateParameterInPreset", () => {
		it("should update a parameter", async () => {
			mockSyncStorage.presets = [
				{
					id: "p1",
					name: "Preset",
					parameters: [
						{ id: "param1", type: "queryParam", key: "original", value: "v" },
					],
				},
			];

			await updateParameterInPreset("p1", "param1", { key: "updated" });
			expect(mockSyncStorage.presets[0].parameters[0].key).toBe("updated");
		});
	});

	describe("removeParameterFromPreset", () => {
		it("should remove a parameter from a preset", async () => {
			mockSyncStorage.presets = [
				{
					id: "p1",
					name: "Preset",
					parameters: [
						{ id: "param1", type: "queryParam", key: "key1", value: "v1" },
						{ id: "param2", type: "queryParam", key: "key2", value: "v2" },
					],
				},
			];

			await removeParameterFromPreset("p1", "param1");
			expect(mockSyncStorage.presets[0].parameters.length).toBe(1);
			expect(mockSyncStorage.presets[0].parameters[0].id).toBe("param2");
		});
	});

	describe("duplicatePreset", () => {
		it("should create a copy of a preset", async () => {
			mockSyncStorage.presets = [
				{
					id: "p1",
					name: "Original",
					description: "Test desc",
					parameters: [
						{ id: "param1", type: "queryParam", key: "key", value: "val" },
					],
				},
			];

			const duplicate = await duplicatePreset("p1");
			expect(duplicate).not.toBeNull();
			expect(duplicate?.name).toBe("Original (Copy)");
			expect(duplicate?.description).toBe("Test desc");
			expect(duplicate?.id).not.toBe("p1");
		});

		it("should use custom name if provided", async () => {
			mockSyncStorage.presets = [
				{ id: "p1", name: "Original", parameters: [] },
			];

			const duplicate = await duplicatePreset("p1", "Custom Name");
			expect(duplicate?.name).toBe("Custom Name");
		});

		it("should generate new IDs for parameters", async () => {
			mockSyncStorage.presets = [
				{
					id: "p1",
					name: "Original",
					parameters: [
						{ id: "param1", type: "queryParam", key: "key", value: "val" },
					],
				},
			];

			const duplicate = await duplicatePreset("p1");
			expect(duplicate?.parameters[0].id).not.toBe("param1");
		});

		it("should return null when preset not found", async () => {
			mockSyncStorage.presets = [];

			const duplicate = await duplicatePreset("nonexistent");
			expect(duplicate).toBeNull();
		});
	});

	describe("reorderParameters", () => {
		it("should reorder parameters based on provided IDs", async () => {
			mockSyncStorage.presets = [
				{
					id: "p1",
					name: "Preset",
					parameters: [
						{ id: "a", type: "queryParam", key: "keyA", value: "valA" },
						{ id: "b", type: "queryParam", key: "keyB", value: "valB" },
						{ id: "c", type: "queryParam", key: "keyC", value: "valC" },
					],
				},
			];

			await reorderParameters("p1", ["c", "a", "b"]);

			const params = mockSyncStorage.presets[0].parameters;
			expect(params[0].id).toBe("c");
			expect(params[1].id).toBe("a");
			expect(params[2].id).toBe("b");
		});

		it("should filter out non-existent parameter IDs", async () => {
			mockSyncStorage.presets = [
				{
					id: "p1",
					name: "Preset",
					parameters: [
						{ id: "a", type: "queryParam", key: "keyA", value: "valA" },
						{ id: "b", type: "queryParam", key: "keyB", value: "valB" },
					],
				},
			];

			await reorderParameters("p1", ["b", "nonexistent", "a"]);

			const params = mockSyncStorage.presets[0].parameters;
			expect(params.length).toBe(2);
			expect(params[0].id).toBe("b");
			expect(params[1].id).toBe("a");
		});

		it("should do nothing when preset not found", async () => {
			mockSyncStorage.presets = [];

			await reorderParameters("nonexistent", ["a", "b"]);
			expect(mockSyncStorage.presets.length).toBe(0);
		});
	});

	describe("exportPresets", () => {
		it("should export presets as JSON string", async () => {
			const presets: Preset[] = [
				{ id: "p1", name: "Preset 1", parameters: [] },
				{ id: "p2", name: "Preset 2", parameters: [] },
			];
			mockSyncStorage.presets = presets;

			const json = await exportPresets();
			const parsed = JSON.parse(json);

			expect(parsed.length).toBe(2);
			expect(parsed[0].name).toBe("Preset 1");
		});

		it("should return empty array JSON when no presets", async () => {
			mockSyncStorage.presets = [];

			const json = await exportPresets();
			const parsed = JSON.parse(json);

			expect(parsed).toEqual([]);
		});

		it("should pretty print JSON", async () => {
			mockSyncStorage.presets = [{ id: "p1", name: "Preset", parameters: [] }];

			const json = await exportPresets();
			expect(json).toContain("\n"); // Should have newlines from pretty print
		});
	});

	describe("importPresets", () => {
		it("should import presets from JSON (merge mode)", async () => {
			mockSyncStorage.presets = [
				{ id: "existing", name: "Existing", parameters: [] },
			];

			const json = JSON.stringify([
				{ name: "Imported", parameters: [] },
			]);

			const result = await importPresets(json, true);
			expect(result.imported).toBe(1);
			expect(result.errors.length).toBe(0);
			expect(mockSyncStorage.presets.length).toBe(2);
		});

		it("should import presets from JSON (replace mode)", async () => {
			mockSyncStorage.presets = [
				{ id: "existing", name: "Existing", parameters: [] },
			];

			const json = JSON.stringify([
				{ name: "Imported", parameters: [] },
			]);

			const result = await importPresets(json, false);
			expect(result.imported).toBe(1);
			expect(mockSyncStorage.presets.length).toBe(1);
			expect(mockSyncStorage.presets[0].name).toBe("Imported");
		});

		it("should generate new IDs for imported presets", async () => {
			mockSyncStorage.presets = [];

			const json = JSON.stringify([
				{ id: "original-id", name: "Imported", parameters: [] },
			]);

			await importPresets(json, true);
			expect(mockSyncStorage.presets[0].id).toBeTruthy();
		});

		it("should handle invalid JSON", async () => {
			const result = await importPresets("invalid json", true);
			expect(result.imported).toBe(0);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it("should handle non-array JSON", async () => {
			const json = JSON.stringify({ name: "Not an array" });

			const result = await importPresets(json, true);
			expect(result.imported).toBe(0);
			expect(result.errors).toContain("Invalid format: expected an array");
		});

		it("should skip invalid preset objects", async () => {
			mockSyncStorage.presets = [];

			const json = JSON.stringify([
				{ name: "Valid", parameters: [] },
				{ noName: true }, // Invalid - missing name
				{ name: "Also Valid", parameters: [] },
			]);

			const result = await importPresets(json, true);
			expect(result.imported).toBe(2);
			expect(result.errors.length).toBe(1);
		});

		it("should assign default type to parameters without type", async () => {
			mockSyncStorage.presets = [];

			const json = JSON.stringify([
				{
					name: "Preset",
					parameters: [{ key: "test", value: "val" }], // No type
				},
			]);

			await importPresets(json, true);
			expect(mockSyncStorage.presets[0].parameters[0].type).toBe("queryParam");
		});

		it("should use existing ID if not already in use", async () => {
			mockSyncStorage.presets = [];

			const json = JSON.stringify([
				{ id: "unique-id", name: "Preset", parameters: [] },
			]);

			await importPresets(json, true);
			expect(mockSyncStorage.presets[0].id).toBe("unique-id");
		});

		it("should generate new ID if ID already exists", async () => {
			mockSyncStorage.presets = [
				{ id: "existing-id", name: "Existing", parameters: [] },
			];

			const json = JSON.stringify([
				{ id: "existing-id", name: "Imported", parameters: [] },
			]);

			await importPresets(json, true);

			const importedPreset = mockSyncStorage.presets.find(
				(p: Preset) => p.name === "Imported"
			);
			expect(importedPreset?.id).not.toBe("existing-id");
		});

		it("should set timestamps on imported presets", async () => {
			mockSyncStorage.presets = [];

			const before = Date.now();
			const json = JSON.stringify([
				{ name: "Preset", parameters: [] },
			]);

			await importPresets(json, true);
			const after = Date.now();

			const preset = mockSyncStorage.presets[0];
			expect(preset.createdAt).toBeGreaterThanOrEqual(before);
			expect(preset.createdAt).toBeLessThanOrEqual(after);
		});
	});
});

