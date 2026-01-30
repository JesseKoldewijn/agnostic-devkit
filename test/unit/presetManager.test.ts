import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";

import {
	activatePreset,
	addParameterToPreset,
	createPreset,
	deactivatePreset,
	deletePreset,
	duplicatePreset,
	exportPresets,
	getPresetsWithActiveState,
	importPresets,
	removeParameterFromPreset,
	reorderParameters,
	togglePreset,
	updateParameterInPreset,
	updatePreset,
} from "@/logic/parameters/presetManager";
import type { Preset } from "@/logic/parameters/types";

describe("presetManager", () => {
	let mockTabUrl: string;

	beforeEach(() => {
		fakeBrowser.reset();
		mockTabUrl = "https://example.com/page";

		// Setup fake tabs

		(fakeBrowser.tabs.get as any) = vi.fn(async (tabId: number) => ({
			id: tabId,
			url: mockTabUrl,
		}));

		(fakeBrowser.tabs.update as any) = vi.fn(async (tabId: number, props: any) => {
			if (props.url) {
				mockTabUrl = props.url;
			}
			return { id: tabId, url: mockTabUrl };
		});

		// Setup fake cookies

		(fakeBrowser.cookies.set as any) = vi.fn(async () => ({}));

		(fakeBrowser.cookies.get as any) = vi.fn(async () => null);

		(fakeBrowser.cookies.remove as any) = vi.fn(async () => ({}));

		// Setup fake scripting

		(fakeBrowser.scripting.executeScript as any) = vi.fn(async () => [{ result: undefined }]);
	});

	describe("togglePreset", () => {
		it("should activate an inactive preset", async () => {
			const preset: Preset = {
				id: "preset1",
				name: "Test Preset",
				parameters: [],
			};
			await fakeBrowser.storage.sync.set({ presets: [preset] });

			const result = await togglePreset(123, "preset1");
			expect(result.active).toBeTruthy();
			expect(result.success).toBeTruthy();
		});

		it("should deactivate an active preset", async () => {
			const preset: Preset = {
				id: "preset1",
				name: "Test Preset",
				parameters: [],
			};
			await fakeBrowser.storage.sync.set({ presets: [preset] });
			await fakeBrowser.storage.local.set({
				tabPresetStates: { "123": ["preset1"] },
			});

			const result = await togglePreset(123, "preset1");
			expect(result.active).toBeFalsy();
			expect(result.success).toBeTruthy();
		});

		it("should update tab preset state when activating", async () => {
			const preset: Preset = {
				id: "preset1",
				name: "Test Preset",
				parameters: [],
			};
			await fakeBrowser.storage.sync.set({ presets: [preset] });

			await togglePreset(123, "preset1");
			const result = await fakeBrowser.storage.local.get("tabPresetStates");
			expect(result.tabPresetStates["123"]).toContain("preset1");
		});

		it("should update tab preset state when deactivating", async () => {
			const preset: Preset = {
				id: "preset1",
				name: "Test Preset",
				parameters: [],
			};
			await fakeBrowser.storage.sync.set({ presets: [preset] });
			await fakeBrowser.storage.local.set({
				tabPresetStates: { "123": ["preset1"] },
			});

			await togglePreset(123, "preset1");
			const result = await fakeBrowser.storage.local.get("tabPresetStates");
			expect(result.tabPresetStates["123"] || []).not.toContain("preset1");
		});
	});

	describe("activatePreset", () => {
		it("should activate an inactive preset", async () => {
			const preset: Preset = {
				id: "preset1",
				name: "Test Preset",
				parameters: [],
			};
			await fakeBrowser.storage.sync.set({ presets: [preset] });

			const result = await activatePreset(123, "preset1");
			expect(result).toBeTruthy();
		});

		it("should return true if preset is already active", async () => {
			const preset: Preset = {
				id: "preset1",
				name: "Test Preset",
				parameters: [],
			};
			await fakeBrowser.storage.sync.set({ presets: [preset] });
			await fakeBrowser.storage.local.set({
				tabPresetStates: { "123": ["preset1"] },
			});

			const result = await activatePreset(123, "preset1");
			expect(result).toBeTruthy();
		});

		it("should update tab preset state", async () => {
			const preset: Preset = {
				id: "preset1",
				name: "Test Preset",
				parameters: [],
			};
			await fakeBrowser.storage.sync.set({ presets: [preset] });

			await activatePreset(123, "preset1");
			const result = await fakeBrowser.storage.local.get("tabPresetStates");
			expect(result.tabPresetStates["123"]).toContain("preset1");
		});
	});

	describe("deactivatePreset", () => {
		it("should deactivate an active preset", async () => {
			const preset: Preset = {
				id: "preset1",
				name: "Test Preset",
				parameters: [],
			};
			await fakeBrowser.storage.sync.set({ presets: [preset] });
			await fakeBrowser.storage.local.set({
				tabPresetStates: { "123": ["preset1"] },
			});

			const result = await deactivatePreset(123, "preset1");
			expect(result).toBeTruthy();
		});

		it("should return true if preset is already inactive", async () => {
			const preset: Preset = {
				id: "preset1",
				name: "Test Preset",
				parameters: [],
			};
			await fakeBrowser.storage.sync.set({ presets: [preset] });

			const result = await deactivatePreset(123, "preset1");
			expect(result).toBeTruthy();
		});
	});

	describe("getPresetsWithActiveState", () => {
		it("should return presets with isActive flag", async () => {
			const preset1: Preset = {
				id: "p1",
				name: "Preset 1",
				parameters: [],
			};
			const preset2: Preset = {
				id: "p2",
				name: "Preset 2",
				parameters: [],
			};
			await fakeBrowser.storage.sync.set({ presets: [preset1, preset2] });
			await fakeBrowser.storage.local.set({
				tabPresetStates: { "123": ["p1"] },
			});

			const result = await getPresetsWithActiveState(123);
			expect(result).toHaveLength(2);
			expect(result.find((p) => p.id === "p1")?.isActive).toBeTruthy();
			expect(result.find((p) => p.id === "p2")?.isActive).toBeFalsy();
		});

		it("should return empty array when no presets exist", async () => {
			await fakeBrowser.storage.sync.set({ presets: [] });

			const result = await getPresetsWithActiveState(123);
			expect(result).toStrictEqual([]);
		});
	});

	describe("createPreset", () => {
		it("should create a new preset", async () => {
			await fakeBrowser.storage.sync.set({ presets: [] });

			const preset = await createPreset({
				name: "New Preset",
				parameters: [],
			});

			expect(preset.name).toBe("New Preset");
			expect(preset.id).toBeTruthy();
			const result = await fakeBrowser.storage.sync.get("presets");
			expect(result.presets).toHaveLength(1);
		});

		it("should generate unique ID", async () => {
			await fakeBrowser.storage.sync.set({ presets: [] });

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
			await fakeBrowser.storage.sync.set({ presets: [] });

			const preset = await createPreset({
				description: "Test description",
				name: "Preset",
				parameters: [],
			});

			expect(preset.description).toBe("Test description");
		});
	});

	describe("updatePreset", () => {
		it("should update preset properties", async () => {
			await fakeBrowser.storage.sync.set({
				presets: [{ id: "p1", name: "Original", parameters: [] }],
			});

			await updatePreset("p1", { name: "Updated" });
			const result = await fakeBrowser.storage.sync.get("presets");
			expect(result.presets[0].name).toBe("Updated");
		});

		it("should update description", async () => {
			await fakeBrowser.storage.sync.set({
				presets: [{ id: "p1", name: "Preset", parameters: [] }],
			});

			await updatePreset("p1", { description: "New description" });
			const result = await fakeBrowser.storage.sync.get("presets");
			expect(result.presets[0].description).toBe("New description");
		});
	});

	describe("deletePreset", () => {
		it("should delete a preset", async () => {
			await fakeBrowser.storage.sync.set({
				presets: [
					{ id: "p1", name: "Preset 1", parameters: [] },
					{ id: "p2", name: "Preset 2", parameters: [] },
				],
			});

			await deletePreset("p1");
			const result = await fakeBrowser.storage.sync.get("presets");
			expect(result.presets).toHaveLength(1);
			expect(result.presets[0].id).toBe("p2");
		});
	});

	describe("addParameterToPreset", () => {
		it("should add a parameter to a preset", async () => {
			await fakeBrowser.storage.sync.set({
				presets: [{ id: "p1", name: "Preset", parameters: [] }],
			});

			const param = await addParameterToPreset("p1", {
				key: "test",
				type: "queryParam",
				value: "value",
			});

			expect(param.id).toBeTruthy();
			expect(param.key).toBe("test");
			const result = await fakeBrowser.storage.sync.get("presets");
			expect(result.presets[0].parameters).toHaveLength(1);
		});

		it("should generate unique parameter ID", async () => {
			await fakeBrowser.storage.sync.set({
				presets: [{ id: "p1", name: "Preset", parameters: [] }],
			});

			const param1 = await addParameterToPreset("p1", {
				key: "key1",
				type: "queryParam",
				value: "val1",
			});
			const param2 = await addParameterToPreset("p1", {
				key: "key2",
				type: "queryParam",
				value: "val2",
			});

			expect(param1.id).not.toBe(param2.id);
		});
	});

	describe("updateParameterInPreset", () => {
		it("should update a parameter", async () => {
			await fakeBrowser.storage.sync.set({
				presets: [
					{
						id: "p1",
						name: "Preset",
						parameters: [
							{
								id: "param1",
								key: "original",
								type: "queryParam",
								value: "v",
							},
						],
					},
				],
			});

			await updateParameterInPreset("p1", "param1", { key: "updated" });
			const result = await fakeBrowser.storage.sync.get("presets");
			expect(result.presets[0].parameters[0].key).toBe("updated");
		});
	});

	describe("removeParameterFromPreset", () => {
		it("should remove a parameter from a preset", async () => {
			await fakeBrowser.storage.sync.set({
				presets: [
					{
						id: "p1",
						name: "Preset",
						parameters: [
							{
								id: "param1",
								key: "key1",
								type: "queryParam",
								value: "v1",
							},
							{
								id: "param2",
								key: "key2",
								type: "queryParam",
								value: "v2",
							},
						],
					},
				],
			});

			await removeParameterFromPreset("p1", "param1");
			const result = await fakeBrowser.storage.sync.get("presets");
			expect(result.presets[0].parameters).toHaveLength(1);
			expect(result.presets[0].parameters[0].id).toBe("param2");
		});
	});

	describe("duplicatePreset", () => {
		it("should create a copy of a preset", async () => {
			await fakeBrowser.storage.sync.set({
				presets: [
					{
						description: "Test desc",
						id: "p1",
						name: "Original",
						parameters: [
							{
								id: "param1",
								key: "key",
								type: "queryParam",
								value: "val",
							},
						],
					},
				],
			});

			const duplicate = await duplicatePreset("p1");
			expect(duplicate).not.toBeNull();
			expect(duplicate?.name).toBe("Original (Copy)");
			expect(duplicate?.description).toBe("Test desc");
			expect(duplicate?.id).not.toBe("p1");
		});

		it("should use custom name if provided", async () => {
			await fakeBrowser.storage.sync.set({
				presets: [{ id: "p1", name: "Original", parameters: [] }],
			});

			const duplicate = await duplicatePreset("p1", "Custom Name");
			expect(duplicate?.name).toBe("Custom Name");
		});

		it("should generate new IDs for parameters", async () => {
			await fakeBrowser.storage.sync.set({
				presets: [
					{
						id: "p1",
						name: "Original",
						parameters: [
							{
								id: "param1",
								key: "key",
								type: "queryParam",
								value: "val",
							},
						],
					},
				],
			});

			const duplicate = await duplicatePreset("p1");
			expect(duplicate?.parameters[0].id).not.toBe("param1");
		});

		it("should return null when preset not found", async () => {
			await fakeBrowser.storage.sync.set({ presets: [] });

			const duplicate = await duplicatePreset("nonexistent");
			expect(duplicate).toBeNull();
		});
	});

	describe("reorderParameters", () => {
		it("should reorder parameters based on provided IDs", async () => {
			await fakeBrowser.storage.sync.set({
				presets: [
					{
						id: "p1",
						name: "Preset",
						parameters: [
							{
								id: "a",
								key: "keyA",
								type: "queryParam",
								value: "valA",
							},
							{
								id: "b",
								key: "keyB",
								type: "queryParam",
								value: "valB",
							},
							{
								id: "c",
								key: "keyC",
								type: "queryParam",
								value: "valC",
							},
						],
					},
				],
			});

			await reorderParameters("p1", ["c", "a", "b"]);

			const result = await fakeBrowser.storage.sync.get("presets");
			const params = result.presets[0].parameters;
			expect(params[0].id).toBe("c");
			expect(params[1].id).toBe("a");
			expect(params[2].id).toBe("b");
		});

		it("should filter out non-existent parameter IDs", async () => {
			await fakeBrowser.storage.sync.set({
				presets: [
					{
						id: "p1",
						name: "Preset",
						parameters: [
							{
								id: "a",
								key: "keyA",
								type: "queryParam",
								value: "valA",
							},
							{
								id: "b",
								key: "keyB",
								type: "queryParam",
								value: "valB",
							},
						],
					},
				],
			});

			await reorderParameters("p1", ["b", "nonexistent", "a"]);

			const result = await fakeBrowser.storage.sync.get("presets");
			const params = result.presets[0].parameters;
			expect(params).toHaveLength(2);
			expect(params[0].id).toBe("b");
			expect(params[1].id).toBe("a");
		});
	});

	describe("exportPresets", () => {
		it("should export presets as JSON string", async () => {
			const presets: Preset[] = [
				{ id: "p1", name: "Preset 1", parameters: [] },
				{ id: "p2", name: "Preset 2", parameters: [] },
			];
			await fakeBrowser.storage.sync.set({ presets });

			const json = await exportPresets();
			const parsed = JSON.parse(json);

			expect(parsed).toHaveLength(2);
			expect(parsed[0].name).toBe("Preset 1");
		});

		it("should return empty array JSON when no presets", async () => {
			await fakeBrowser.storage.sync.set({ presets: [] });

			const json = await exportPresets();
			const parsed = JSON.parse(json);

			expect(parsed).toStrictEqual([]);
		});

		it("should pretty print JSON", async () => {
			await fakeBrowser.storage.sync.set({
				presets: [{ id: "p1", name: "Preset", parameters: [] }],
			});

			const json = await exportPresets();
			expect(json).toContain("\n");
		});

		it("should export only specified presets when IDs provided", async () => {
			const presets: Preset[] = [
				{ id: "p1", name: "Preset 1", parameters: [] },
				{ id: "p2", name: "Preset 2", parameters: [] },
				{ id: "p3", name: "Preset 3", parameters: [] },
			];
			await fakeBrowser.storage.sync.set({ presets });

			const json = await exportPresets(["p1", "p3"]);
			const parsed = JSON.parse(json);

			expect(parsed).toHaveLength(2);
			expect(parsed[0].name).toBe("Preset 1");
			expect(parsed[1].name).toBe("Preset 3");
		});

		it("should export single preset when one ID provided", async () => {
			const presets: Preset[] = [
				{ id: "p1", name: "Preset 1", parameters: [] },
				{ id: "p2", name: "Preset 2", parameters: [] },
			];
			await fakeBrowser.storage.sync.set({ presets });

			const json = await exportPresets(["p2"]);
			const parsed = JSON.parse(json);

			expect(parsed).toHaveLength(1);
			expect(parsed[0].name).toBe("Preset 2");
		});

		it("should return empty array when no IDs match", async () => {
			const presets: Preset[] = [
				{ id: "p1", name: "Preset 1", parameters: [] },
				{ id: "p2", name: "Preset 2", parameters: [] },
			];
			await fakeBrowser.storage.sync.set({ presets });

			const json = await exportPresets(["nonexistent"]);
			const parsed = JSON.parse(json);

			expect(parsed).toStrictEqual([]);
		});

		it("should export all presets when empty array provided", async () => {
			const presets: Preset[] = [
				{ id: "p1", name: "Preset 1", parameters: [] },
				{ id: "p2", name: "Preset 2", parameters: [] },
			];
			await fakeBrowser.storage.sync.set({ presets });

			// Empty array should filter nothing, resulting in empty export
			const json = await exportPresets([]);
			const parsed = JSON.parse(json);

			expect(parsed).toStrictEqual([]);
		});
	});

	describe("importPresets", () => {
		it("should import presets from JSON (merge mode)", async () => {
			await fakeBrowser.storage.sync.set({
				presets: [{ id: "existing", name: "Existing", parameters: [] }],
			});

			const json = JSON.stringify([{ name: "Imported", parameters: [] }]);

			const result = await importPresets(json, true);
			expect(result.imported).toBe(1);
			expect(result.errors).toHaveLength(0);
			const storage = await fakeBrowser.storage.sync.get("presets");
			expect(storage.presets).toHaveLength(2);
		});

		it("should import presets from JSON (replace mode)", async () => {
			await fakeBrowser.storage.sync.set({
				presets: [{ id: "existing", name: "Existing", parameters: [] }],
			});

			const json = JSON.stringify([{ name: "Imported", parameters: [] }]);

			const result = await importPresets(json, false);
			expect(result.imported).toBe(1);
			const storage = await fakeBrowser.storage.sync.get("presets");
			expect(storage.presets).toHaveLength(1);
			expect(storage.presets[0].name).toBe("Imported");
		});

		it("should generate new IDs for imported presets", async () => {
			await fakeBrowser.storage.sync.set({ presets: [] });

			const json = JSON.stringify([{ id: "original-id", name: "Imported", parameters: [] }]);

			await importPresets(json, true);
			const storage = await fakeBrowser.storage.sync.get("presets");
			expect(storage.presets[0].id).toBeTruthy();
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
			await fakeBrowser.storage.sync.set({ presets: [] });

			const json = JSON.stringify([
				{ name: "Valid", parameters: [] },
				{ noName: true }, // Invalid - missing name
				{ name: "Also Valid", parameters: [] },
			]);

			const result = await importPresets(json, true);
			expect(result.imported).toBe(2);
			expect(result.errors).toHaveLength(1);
		});

		it("should assign default type to parameters without type", async () => {
			await fakeBrowser.storage.sync.set({ presets: [] });

			const json = JSON.stringify([
				{
					name: "Preset",
					parameters: [{ key: "test", value: "val" }], // No type
				},
			]);

			await importPresets(json, true);
			const storage = await fakeBrowser.storage.sync.get("presets");
			expect(storage.presets[0].parameters[0].type).toBe("queryParam");
		});

		it("should use existing ID if not already in use", async () => {
			await fakeBrowser.storage.sync.set({ presets: [] });

			const json = JSON.stringify([{ id: "unique-id", name: "Preset", parameters: [] }]);

			await importPresets(json, true);
			const storage = await fakeBrowser.storage.sync.get("presets");
			expect(storage.presets[0].id).toBe("unique-id");
		});

		it("should generate new ID if ID already exists", async () => {
			await fakeBrowser.storage.sync.set({
				presets: [{ id: "existing-id", name: "Existing", parameters: [] }],
			});

			const json = JSON.stringify([{ id: "existing-id", name: "Imported", parameters: [] }]);

			await importPresets(json, true);

			const storage = await fakeBrowser.storage.sync.get("presets");
			const importedPreset = storage.presets.find((p: Preset) => p.name === "Imported");
			expect(importedPreset?.id).not.toBe("existing-id");
		});

		it("should set timestamps on imported presets", async () => {
			await fakeBrowser.storage.sync.set({ presets: [] });

			const before = Date.now();
			const json = JSON.stringify([{ name: "Preset", parameters: [] }]);

			await importPresets(json, true);
			const after = Date.now();

			const storage = await fakeBrowser.storage.sync.get("presets");
			const preset = storage.presets[0];
			expect(preset.createdAt).toBeGreaterThanOrEqual(before);
			expect(preset.createdAt).toBeLessThanOrEqual(after);
		});
	});

	describe("migrateParameter", () => {
		it("should set primitiveType to boolean when value is 'true'", async () => {
			const { migrateParameter } = await import("@/logic/parameters/presetManager");
			const param = {
				id: "test-id",
				key: "testKey",
				type: "queryParam" as const,
				value: "true",
			};

			const migrated = migrateParameter(param);
			expect(migrated.primitiveType).toBe("boolean");
		});

		it("should set primitiveType to boolean when value is 'false'", async () => {
			const { migrateParameter } = await import("@/logic/parameters/presetManager");
			const param = {
				id: "test-id",
				key: "testKey",
				type: "queryParam" as const,
				value: "false",
			};

			const migrated = migrateParameter(param);
			expect(migrated.primitiveType).toBe("boolean");
		});

		it("should set primitiveType to string when value is not a boolean string", async () => {
			const { migrateParameter } = await import("@/logic/parameters/presetManager");
			const param = {
				id: "test-id",
				key: "testKey",
				type: "queryParam" as const,
				value: "someValue",
			};

			const migrated = migrateParameter(param);
			expect(migrated.primitiveType).toBe("string");
		});

		it("should return unchanged parameter when primitiveType already exists", async () => {
			const { migrateParameter } = await import("@/logic/parameters/presetManager");
			const param = {
				id: "test-id",
				key: "testKey",
				primitiveType: "string" as const,
				type: "queryParam" as const,
				value: "true", // Even though value is "true", should stay string
			};

			const migrated = migrateParameter(param);
			expect(migrated.primitiveType).toBe("string");
			expect(migrated).toBe(param); // Same reference = unchanged
		});

		it("should set primitiveType to string for empty value", async () => {
			const { migrateParameter } = await import("@/logic/parameters/presetManager");
			const param = {
				id: "test-id",
				key: "testKey",
				type: "queryParam" as const,
				value: "",
			};

			const migrated = migrateParameter(param);
			expect(migrated.primitiveType).toBe("string");
		});
	});

	describe("migratePresetsIfNeeded", () => {
		it("should migrate presets and save when migration is needed", async () => {
			const { migratePresetsIfNeeded } = await import("@/logic/parameters/presetManager");

			// Set up legacy presets without primitiveType
			await fakeBrowser.storage.sync.set({
				presets: [
					{
						id: "preset-1",
						name: "Legacy Preset",
						parameters: [
							{ id: "p1", key: "boolKey", type: "queryParam", value: "true" },
							{ id: "p2", key: "stringKey", type: "queryParam", value: "hello" },
						],
					},
				],
			});

			await migratePresetsIfNeeded();

			const storage = await fakeBrowser.storage.sync.get("presets");
			const preset = storage.presets[0];
			expect(preset.parameters[0].primitiveType).toBe("boolean");
			expect(preset.parameters[1].primitiveType).toBe("string");
		});

		it("should not save when no migration is needed", async () => {
			const { migratePresetsIfNeeded } = await import("@/logic/parameters/presetManager");

			// Set up presets that are already migrated
			await fakeBrowser.storage.sync.set({
				presets: [
					{
						id: "preset-1",
						name: "Migrated Preset",
						parameters: [
							{ id: "p1", key: "key", type: "queryParam", value: "val", primitiveType: "string" },
						],
					},
				],
			});

			const setSpy = vi.spyOn(fakeBrowser.storage.sync, "set");
			const callCountBefore = setSpy.mock.calls.length;

			await migratePresetsIfNeeded();

			// Should not have called set again (no changes needed)
			expect(setSpy.mock.calls.length).toBe(callCountBefore);
		});

		it("should handle empty presets array", async () => {
			const { migratePresetsIfNeeded } = await import("@/logic/parameters/presetManager");

			await fakeBrowser.storage.sync.set({ presets: [] });

			// Should not throw
			await expect(migratePresetsIfNeeded()).resolves.not.toThrow();
		});

		it("should handle presets with no parameters", async () => {
			const { migratePresetsIfNeeded } = await import("@/logic/parameters/presetManager");

			await fakeBrowser.storage.sync.set({
				presets: [{ id: "preset-1", name: "Empty Preset", parameters: [] }],
			});

			// Should not throw
			await expect(migratePresetsIfNeeded()).resolves.not.toThrow();
		});
	});

	describe("generateShareUrl", () => {
		it("should generate a URL with compressed presets", async () => {
			const { generateShareUrl } = await import("@/logic/parameters/presetManager");

			const presets = [
				{
					createdAt: 1700000000000,
					id: "test-1",
					name: "Test Preset",
					parameters: [{ id: "p1", key: "debug", type: "queryParam" as const, value: "true" }],
					updatedAt: 1700000000000,
				},
			];

			const url = generateShareUrl(presets);

			expect(url).toContain("settings.html");
			expect(url).toContain("share=");
			// Share parameter should be non-empty
			const shareParam = new URL(url).searchParams.get("share");
			expect(shareParam).toBeTruthy();
			expect(shareParam!.length).toBeGreaterThan(0);
		});

		it("should generate URL-safe share parameter", async () => {
			const { generateShareUrl } = await import("@/logic/parameters/presetManager");

			const presets = [
				{
					createdAt: 1700000000000,
					id: "test-1",
					name: "Special chars: &?=#",
					parameters: [{ id: "p1", key: "foo&bar", type: "queryParam" as const, value: "baz=qux" }],
					updatedAt: 1700000000000,
				},
			];

			const url = generateShareUrl(presets);
			const shareParam = new URL(url).searchParams.get("share");

			// Share param itself should not contain URL-unsafe chars (they're encoded)
			expect(shareParam).not.toMatch(/[&?=#/]/);
		});

		it("should handle multiple presets", async () => {
			const { generateShareUrl } = await import("@/logic/parameters/presetManager");

			const presets = [
				{
					createdAt: 1700000000000,
					id: "test-1",
					name: "Preset 1",
					parameters: [],
					updatedAt: 1700000000000,
				},
				{
					createdAt: 1700000000000,
					id: "test-2",
					name: "Preset 2",
					parameters: [],
					updatedAt: 1700000000000,
				},
			];

			const url = generateShareUrl(presets);
			expect(url).toContain("share=");
		});

		it("should handle empty presets array", async () => {
			const { generateShareUrl } = await import("@/logic/parameters/presetManager");

			const url = generateShareUrl([]);
			expect(url).toContain("share=");
		});
	});

	describe("parseShareUrl", () => {
		it("should parse share URL and return presets", async () => {
			const { generateShareUrl, parseShareUrl } = await import("@/logic/parameters/presetManager");

			const originalPresets = [
				{
					createdAt: 1700000000000,
					id: "test-1",
					name: "Test Preset",
					parameters: [{ id: "p1", key: "debug", type: "queryParam" as const, value: "true" }],
					updatedAt: 1700000000000,
				},
			];

			const url = generateShareUrl(originalPresets);
			const result = parseShareUrl(url);

			expect(result).not.toBeNull();
			expect(result!.count).toBe(1);
			expect(result!.isMultiplePresets).toBe(false);
			expect(result!.result[0].name).toBe("Test Preset");
			expect(result!.result[0].parameters[0].key).toBe("debug");
		});

		it("should return null for URL without share parameter", async () => {
			const { parseShareUrl } = await import("@/logic/parameters/presetManager");

			const result = parseShareUrl("chrome-extension://abc123/popup.html");
			expect(result).toBeNull();
		});

		it("should throw for invalid share parameter", async () => {
			const { parseShareUrl } = await import("@/logic/parameters/presetManager");

			expect(() =>
				parseShareUrl("chrome-extension://abc123/popup.html?share=invalid-data")
			).toThrow();
		});

		it("should handle multiple presets in share URL", async () => {
			const { generateShareUrl, parseShareUrl } = await import("@/logic/parameters/presetManager");

			const originalPresets = [
				{
					createdAt: 1700000000000,
					id: "test-1",
					name: "Preset 1",
					parameters: [],
					updatedAt: 1700000000000,
				},
				{
					createdAt: 1700000000000,
					id: "test-2",
					name: "Preset 2",
					parameters: [],
					updatedAt: 1700000000000,
				},
				{
					createdAt: 1700000000000,
					id: "test-3",
					name: "Preset 3",
					parameters: [],
					updatedAt: 1700000000000,
				},
			];

			const url = generateShareUrl(originalPresets);
			const result = parseShareUrl(url);

			expect(result).not.toBeNull();
			expect(result!.count).toBe(3);
			expect(result!.isMultiplePresets).toBe(true);
			expect(result!.result.map((p) => p.name)).toEqual(["Preset 1", "Preset 2", "Preset 3"]);
		});

		it("should regenerate IDs when parsing", async () => {
			const { generateShareUrl, parseShareUrl } = await import("@/logic/parameters/presetManager");

			const originalPresets = [
				{
					createdAt: 1700000000000,
					id: "original-id",
					name: "Test",
					parameters: [
						{ id: "original-param-id", key: "k", type: "queryParam" as const, value: "v" },
					],
					updatedAt: 1700000000000,
				},
			];

			const url = generateShareUrl(originalPresets);
			const result = parseShareUrl(url);

			expect(result!.result[0].id).not.toBe("original-id");
			expect(result!.result[0].parameters[0].id).not.toBe("original-param-id");
		});
	});
});
