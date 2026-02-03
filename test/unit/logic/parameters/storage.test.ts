/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";

import {
	addActivePresetToTab,
	addParameter,
	addPreset,
	cleanupTabState,
	deletePreset,
	getActivePresetsForTab,
	getPresetById,
	getPresets,
	getTabPresetStates,
	isPresetActiveOnTab,
	removeActivePresetFromTab,
	removeParameter,
	savePresets,
	saveTabPresetStates,
	updateParameter,
	updatePreset,
	updateTabPresetState,
} from "@/logic/parameters/storage";
import type { Parameter, Preset } from "@/logic/parameters/types";

describe("storage", () => {
	beforeEach(() => {
		fakeBrowser.reset();
	});

	describe("getPresets", () => {
		it("should return empty array when no presets exist", async () => {
			const presets = await getPresets();
			expect(presets).toStrictEqual([]);
		});

		it("should return stored presets", async () => {
			const mockPresets: Preset[] = [
				{
					createdAt: Date.now(),
					id: "1",
					name: "Test Preset",
					parameters: [],
					updatedAt: Date.now(),
				},
			];
			await fakeBrowser.storage.sync.set({ presets: mockPresets });

			const presets = await getPresets();
			expect(presets).toStrictEqual(mockPresets);
		});
	});

	describe("savePresets", () => {
		it("should save presets to storage", async () => {
			const mockPresets: Preset[] = [
				{
					createdAt: Date.now(),
					id: "1",
					name: "Test Preset",
					parameters: [],
					updatedAt: Date.now(),
				},
			];

			await savePresets(mockPresets);
			const result = await fakeBrowser.storage.sync.get("presets");
			expect(result.presets).toStrictEqual(mockPresets);
		});
	});

	describe("getPresetById", () => {
		it("should return undefined when preset not found", async () => {
			const preset = await getPresetById("nonexistent");
			expect(preset).toBeUndefined();
		});

		it("should return the correct preset by ID", async () => {
			const mockPresets: Preset[] = [
				{ id: "1", name: "Preset 1", parameters: [] },
				{ id: "2", name: "Preset 2", parameters: [] },
			];
			await fakeBrowser.storage.sync.set({ presets: mockPresets });

			const preset = await getPresetById("2");
			expect(preset?.name).toBe("Preset 2");
		});
	});

	describe("addPreset", () => {
		it("should add a new preset to storage", async () => {
			const newPreset: Preset = {
				id: "new-1",
				name: "New Preset",
				parameters: [],
			};

			await addPreset(newPreset);
			const result = await fakeBrowser.storage.sync.get("presets");
			expect(result.presets).toHaveLength(1);
			expect(result.presets[0].name).toBe("New Preset");
		});

		it("should set createdAt and updatedAt timestamps", async () => {
			const before = Date.now();
			const newPreset: Preset = {
				id: "new-1",
				name: "New Preset",
				parameters: [],
			};

			await addPreset(newPreset);
			const after = Date.now();
			const result = await fakeBrowser.storage.sync.get("presets");

			expect(result.presets[0].createdAt).toBeGreaterThanOrEqual(before);
			expect(result.presets[0].createdAt).toBeLessThanOrEqual(after);
			expect(result.presets[0].updatedAt).toBeGreaterThanOrEqual(before);
			expect(result.presets[0].updatedAt).toBeLessThanOrEqual(after);
		});
	});

	describe("updatePreset", () => {
		it("should update an existing preset", async () => {
			await fakeBrowser.storage.sync.set({
				presets: [{ id: "1", name: "Original", parameters: [], updatedAt: 1000 }],
			});

			await updatePreset("1", { name: "Updated" });
			const result = await fakeBrowser.storage.sync.get("presets");
			expect(result.presets[0].name).toBe("Updated");
		});

		it("should update the updatedAt timestamp", async () => {
			await fakeBrowser.storage.sync.set({
				presets: [{ id: "1", name: "Original", parameters: [], updatedAt: 1000 }],
			});

			const before = Date.now();
			await updatePreset("1", { name: "Updated" });
			const after = Date.now();
			const result = await fakeBrowser.storage.sync.get("presets");

			expect(result.presets[0].updatedAt).toBeGreaterThanOrEqual(before);
			expect(result.presets[0].updatedAt).toBeLessThanOrEqual(after);
		});

		it("should not modify storage if preset not found", async () => {
			await fakeBrowser.storage.sync.set({
				presets: [{ id: "1", name: "Original", parameters: [] }],
			});

			await updatePreset("nonexistent", { name: "Updated" });
			const result = await fakeBrowser.storage.sync.get("presets");
			expect(result.presets[0].name).toBe("Original");
		});
	});

	describe("deletePreset", () => {
		it("should remove a preset from storage", async () => {
			await fakeBrowser.storage.sync.set({
				presets: [
					{ id: "1", name: "Preset 1", parameters: [] },
					{ id: "2", name: "Preset 2", parameters: [] },
				],
			});

			await deletePreset("1");
			const result = await fakeBrowser.storage.sync.get("presets");
			expect(result.presets).toHaveLength(1);
			expect(result.presets[0].id).toBe("2");
		});

		it("should clean up tab states referencing the deleted preset", async () => {
			await fakeBrowser.storage.sync.set({
				presets: [{ id: "1", name: "Preset 1", parameters: [] }],
			});
			await fakeBrowser.storage.local.set({
				tabPresetStates: {
					"123": ["1", "2"],
					"456": ["1"],
				},
			});

			await deletePreset("1");
			const result = await fakeBrowser.storage.local.get("tabPresetStates");
			expect(result.tabPresetStates["123"]).toStrictEqual(["2"]);
			expect(result.tabPresetStates["456"]).toStrictEqual([]);
		});
	});

	describe("addParameter", () => {
		it("should add a parameter to a preset", async () => {
			await fakeBrowser.storage.sync.set({
				presets: [{ id: "1", name: "Preset", parameters: [], updatedAt: 1000 }],
			});

			const param: Parameter = {
				id: "p1",
				key: "test",
				type: "queryParam",
				value: "value",
			};

			await addParameter("1", param);
			const result = await fakeBrowser.storage.sync.get("presets");
			expect(result.presets[0].parameters).toHaveLength(1);
			expect(result.presets[0].parameters[0].key).toBe("test");
		});
	});

	describe("updateParameter", () => {
		it("should update a parameter within a preset", async () => {
			await fakeBrowser.storage.sync.set({
				presets: [
					{
						id: "1",
						name: "Preset",
						parameters: [{ id: "p1", key: "original", type: "queryParam", value: "val" }],
						updatedAt: 1000,
					},
				],
			});

			await updateParameter("1", "p1", { key: "updated" });
			const result = await fakeBrowser.storage.sync.get("presets");
			expect(result.presets[0].parameters[0].key).toBe("updated");
		});
	});

	describe("removeParameter", () => {
		it("should remove a parameter from a preset", async () => {
			await fakeBrowser.storage.sync.set({
				presets: [
					{
						id: "1",
						name: "Preset",
						parameters: [
							{ id: "p1", key: "key1", type: "queryParam", value: "val1" },
							{ id: "p2", key: "key2", type: "queryParam", value: "val2" },
						],
					},
				],
			});

			await removeParameter("1", "p1");
			const result = await fakeBrowser.storage.sync.get("presets");
			expect(result.presets[0].parameters).toHaveLength(1);
			expect(result.presets[0].parameters[0].id).toBe("p2");
		});
	});

	describe("getTabPresetStates", () => {
		it("should return empty object when no states exist", async () => {
			const states = await getTabPresetStates();
			expect(states).toStrictEqual({});
		});

		it("should return stored tab states", async () => {
			await fakeBrowser.storage.local.set({
				tabPresetStates: { "123": ["preset1", "preset2"] },
			});

			const states = await getTabPresetStates();
			expect(states["123"]).toStrictEqual(["preset1", "preset2"]);
		});
	});

	describe("saveTabPresetStates", () => {
		it("should save tab states to local storage", async () => {
			const states = { "123": ["preset1"] };
			await saveTabPresetStates(states);
			const result = await fakeBrowser.storage.local.get("tabPresetStates");
			expect(result.tabPresetStates).toStrictEqual(states);
		});
	});

	describe("getActivePresetsForTab", () => {
		it("should return empty array when tab has no active presets", async () => {
			const activePresets = await getActivePresetsForTab(123);
			expect(activePresets).toStrictEqual([]);
		});

		it("should return active preset IDs for a tab", async () => {
			await fakeBrowser.storage.local.set({
				tabPresetStates: { "123": ["preset1", "preset2"] },
			});

			const activePresets = await getActivePresetsForTab(123);
			expect(activePresets).toStrictEqual(["preset1", "preset2"]);
		});
	});

	describe("updateTabPresetState", () => {
		it("should update active presets for a tab", async () => {
			await updateTabPresetState(123, ["preset1", "preset2"]);
			const result = await fakeBrowser.storage.local.get("tabPresetStates");
			expect(result.tabPresetStates["123"]).toStrictEqual(["preset1", "preset2"]);
		});

		it("should remove tab entry when presets array is empty", async () => {
			await fakeBrowser.storage.local.set({
				tabPresetStates: { "123": ["preset1"] },
			});

			await updateTabPresetState(123, []);
			const result = await fakeBrowser.storage.local.get("tabPresetStates");
			expect(result.tabPresetStates["123"]).toBeUndefined();
		});
	});

	describe("addActivePresetToTab", () => {
		it("should add a preset to tab's active list", async () => {
			await addActivePresetToTab(123, "preset1");
			const result = await fakeBrowser.storage.local.get("tabPresetStates");
			expect(result.tabPresetStates["123"]).toContain("preset1");
		});
	});

	describe("removeActivePresetFromTab", () => {
		it("should remove a preset from tab's active list", async () => {
			await fakeBrowser.storage.local.set({
				tabPresetStates: { "123": ["preset1", "preset2"] },
			});

			await removeActivePresetFromTab(123, "preset1");
			const result = await fakeBrowser.storage.local.get("tabPresetStates");
			expect(result.tabPresetStates["123"]).toStrictEqual(["preset2"]);
		});
	});

	describe("isPresetActiveOnTab", () => {
		it("should return true when preset is active on tab", async () => {
			await fakeBrowser.storage.local.set({
				tabPresetStates: { "123": ["preset1", "preset2"] },
			});

			const isActive = await isPresetActiveOnTab(123, "preset1");
			expect(isActive).toBeTruthy();
		});
	});

	describe("cleanupTabState", () => {
		it("should remove all state for a tab", async () => {
			await fakeBrowser.storage.local.set({
				tabPresetStates: {
					"123": ["preset1", "preset2"],
					"456": ["preset3"],
				},
			});

			await cleanupTabState(123);
			const result = await fakeBrowser.storage.local.get("tabPresetStates");
			expect(result.tabPresetStates["123"]).toBeUndefined();
			expect(result.tabPresetStates["456"]).toStrictEqual(["preset3"]);
		});
	});
});
