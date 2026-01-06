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
} from "../logic/parameters/presetManager";
import type { Preset } from "../logic/parameters/types";

describe("presetManager", () => {
	let mockTabUrl: string;

	beforeEach(() => {
		fakeBrowser.reset();
		mockTabUrl = "https://example.com/page";

		// Setup fake tabs
		// biome-ignore lint/suspicious/noExplicitAny: complex fake-browser types
		(fakeBrowser.tabs.get as any) = vi.fn(async (tabId: number) => ({
			id: tabId,
			url: mockTabUrl,
		}));

		// biome-ignore lint/suspicious/noExplicitAny: complex fake-browser types
		(fakeBrowser.tabs.update as any) = vi.fn(async (tabId: number, props: any) => {
			if (props.url) {
				mockTabUrl = props.url;
			}
			return { id: tabId, url: mockTabUrl };
		});

		// Setup fake cookies
		// biome-ignore lint/suspicious/noExplicitAny: complex fake-browser types
		(fakeBrowser.cookies.set as any) = vi.fn(async () => ({}));
		// biome-ignore lint/suspicious/noExplicitAny: complex fake-browser types
		(fakeBrowser.cookies.get as any) = vi.fn(async () => null);
		// biome-ignore lint/suspicious/noExplicitAny: complex fake-browser types
		(fakeBrowser.cookies.remove as any) = vi.fn(async () => ({}));

		// Setup fake scripting
		// biome-ignore lint/suspicious/noExplicitAny: complex fake-browser types
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
});
