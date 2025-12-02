import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
	getPresets,
	savePresets,
	getPresetById,
	addPreset,
	updatePreset,
	deletePreset,
	addParameter,
	updateParameter,
	removeParameter,
	getTabPresetStates,
	saveTabPresetStates,
	getActivePresetsForTab,
	updateTabPresetState,
	addActivePresetToTab,
	removeActivePresetFromTab,
	isPresetActiveOnTab,
	cleanupTabState,
	onPresetsChanged,
	onTabPresetStatesChanged,
} from "../logic/parameters/storage";
import type { Preset, Parameter } from "../logic/parameters/types";

describe("storage", () => {
	let mockSyncStorage: Record<string, any>;
	let mockLocalStorage: Record<string, any>;
	let storageChangeListeners: Array<(changes: any, areaName: string) => void>;

	beforeEach(() => {
		mockSyncStorage = {};
		mockLocalStorage = {};
		storageChangeListeners = [];

		// Reset chrome mock
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

		// Mock local storage
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

		// Mock storage.onChanged
		(globalThis.chrome.storage.onChanged.addListener as any).mockImplementation(
			(listener: (changes: any, areaName: string) => void) => {
				storageChangeListeners.push(listener);
			}
		);

		(globalThis.chrome.storage.onChanged as any).removeListener = vi.fn(
			(listener: (changes: any, areaName: string) => void) => {
				const index = storageChangeListeners.indexOf(listener);
				if (index > -1) {
					storageChangeListeners.splice(index, 1);
				}
			}
		);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("getPresets", () => {
		it("should return empty array when no presets exist", async () => {
			const presets = await getPresets();
			expect(presets).toEqual([]);
		});

		it("should return stored presets", async () => {
			const mockPresets: Preset[] = [
				{
					id: "1",
					name: "Test Preset",
					parameters: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
			];
			mockSyncStorage.presets = mockPresets;

			const presets = await getPresets();
			expect(presets).toEqual(mockPresets);
		});
	});

	describe("savePresets", () => {
		it("should save presets to storage", async () => {
			const mockPresets: Preset[] = [
				{
					id: "1",
					name: "Test Preset",
					parameters: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
			];

			await savePresets(mockPresets);
			expect(mockSyncStorage.presets).toEqual(mockPresets);
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
			mockSyncStorage.presets = mockPresets;

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
			expect(mockSyncStorage.presets.length).toBe(1);
			expect(mockSyncStorage.presets[0].name).toBe("New Preset");
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

			expect(mockSyncStorage.presets[0].createdAt).toBeGreaterThanOrEqual(before);
			expect(mockSyncStorage.presets[0].createdAt).toBeLessThanOrEqual(after);
			expect(mockSyncStorage.presets[0].updatedAt).toBeGreaterThanOrEqual(before);
			expect(mockSyncStorage.presets[0].updatedAt).toBeLessThanOrEqual(after);
		});
	});

	describe("updatePreset", () => {
		it("should update an existing preset", async () => {
			mockSyncStorage.presets = [
				{ id: "1", name: "Original", parameters: [], updatedAt: 1000 },
			];

			await updatePreset("1", { name: "Updated" });
			expect(mockSyncStorage.presets[0].name).toBe("Updated");
		});

		it("should update the updatedAt timestamp", async () => {
			mockSyncStorage.presets = [
				{ id: "1", name: "Original", parameters: [], updatedAt: 1000 },
			];

			const before = Date.now();
			await updatePreset("1", { name: "Updated" });
			const after = Date.now();

			expect(mockSyncStorage.presets[0].updatedAt).toBeGreaterThanOrEqual(before);
			expect(mockSyncStorage.presets[0].updatedAt).toBeLessThanOrEqual(after);
		});

		it("should not modify storage if preset not found", async () => {
			mockSyncStorage.presets = [
				{ id: "1", name: "Original", parameters: [] },
			];

			await updatePreset("nonexistent", { name: "Updated" });
			expect(mockSyncStorage.presets[0].name).toBe("Original");
		});
	});

	describe("deletePreset", () => {
		it("should remove a preset from storage", async () => {
			mockSyncStorage.presets = [
				{ id: "1", name: "Preset 1", parameters: [] },
				{ id: "2", name: "Preset 2", parameters: [] },
			];
			mockLocalStorage.tabPresetStates = {};

			await deletePreset("1");
			expect(mockSyncStorage.presets.length).toBe(1);
			expect(mockSyncStorage.presets[0].id).toBe("2");
		});

		it("should clean up tab states referencing the deleted preset", async () => {
			mockSyncStorage.presets = [
				{ id: "1", name: "Preset 1", parameters: [] },
			];
			mockLocalStorage.tabPresetStates = {
				"123": ["1", "2"],
				"456": ["1"],
			};

			await deletePreset("1");
			expect(mockLocalStorage.tabPresetStates["123"]).toEqual(["2"]);
			expect(mockLocalStorage.tabPresetStates["456"]).toEqual([]);
		});
	});

	describe("addParameter", () => {
		it("should add a parameter to a preset", async () => {
			mockSyncStorage.presets = [
				{ id: "1", name: "Preset", parameters: [], updatedAt: 1000 },
			];

			const param: Parameter = {
				id: "p1",
				type: "queryParam",
				key: "test",
				value: "value",
			};

			await addParameter("1", param);
			expect(mockSyncStorage.presets[0].parameters.length).toBe(1);
			expect(mockSyncStorage.presets[0].parameters[0].key).toBe("test");
		});

		it("should update updatedAt timestamp", async () => {
			mockSyncStorage.presets = [
				{ id: "1", name: "Preset", parameters: [], updatedAt: 1000 },
			];

			const before = Date.now();
			const param: Parameter = {
				id: "p1",
				type: "queryParam",
				key: "test",
				value: "value",
			};

			await addParameter("1", param);
			expect(mockSyncStorage.presets[0].updatedAt).toBeGreaterThanOrEqual(before);
		});
	});

	describe("updateParameter", () => {
		it("should update a parameter within a preset", async () => {
			mockSyncStorage.presets = [
				{
					id: "1",
					name: "Preset",
					parameters: [
						{ id: "p1", type: "queryParam", key: "original", value: "val" },
					],
					updatedAt: 1000,
				},
			];

			await updateParameter("1", "p1", { key: "updated" });
			expect(mockSyncStorage.presets[0].parameters[0].key).toBe("updated");
		});

		it("should not modify if parameter not found", async () => {
			mockSyncStorage.presets = [
				{
					id: "1",
					name: "Preset",
					parameters: [
						{ id: "p1", type: "queryParam", key: "original", value: "val" },
					],
				},
			];

			await updateParameter("1", "nonexistent", { key: "updated" });
			expect(mockSyncStorage.presets[0].parameters[0].key).toBe("original");
		});

		it("should not modify if preset not found", async () => {
			mockSyncStorage.presets = [
				{
					id: "1",
					name: "Preset",
					parameters: [
						{ id: "p1", type: "queryParam", key: "original", value: "val" },
					],
				},
			];

			await updateParameter("nonexistent", "p1", { key: "updated" });
			expect(mockSyncStorage.presets[0].parameters[0].key).toBe("original");
		});
	});

	describe("removeParameter", () => {
		it("should remove a parameter from a preset", async () => {
			mockSyncStorage.presets = [
				{
					id: "1",
					name: "Preset",
					parameters: [
						{ id: "p1", type: "queryParam", key: "key1", value: "val1" },
						{ id: "p2", type: "queryParam", key: "key2", value: "val2" },
					],
				},
			];

			await removeParameter("1", "p1");
			expect(mockSyncStorage.presets[0].parameters.length).toBe(1);
			expect(mockSyncStorage.presets[0].parameters[0].id).toBe("p2");
		});

		it("should not modify if preset not found", async () => {
			mockSyncStorage.presets = [
				{
					id: "1",
					name: "Preset",
					parameters: [
						{ id: "p1", type: "queryParam", key: "key1", value: "val1" },
					],
				},
			];

			await removeParameter("nonexistent", "p1");
			expect(mockSyncStorage.presets[0].parameters.length).toBe(1);
		});
	});

	describe("getTabPresetStates", () => {
		it("should return empty object when no states exist", async () => {
			const states = await getTabPresetStates();
			expect(states).toEqual({});
		});

		it("should return stored tab states", async () => {
			mockLocalStorage.tabPresetStates = {
				"123": ["preset1", "preset2"],
			};

			const states = await getTabPresetStates();
			expect(states["123"]).toEqual(["preset1", "preset2"]);
		});
	});

	describe("saveTabPresetStates", () => {
		it("should save tab states to local storage", async () => {
			const states = { "123": ["preset1"] };
			await saveTabPresetStates(states);
			expect(mockLocalStorage.tabPresetStates).toEqual(states);
		});
	});

	describe("getActivePresetsForTab", () => {
		it("should return empty array when tab has no active presets", async () => {
			const activePresets = await getActivePresetsForTab(123);
			expect(activePresets).toEqual([]);
		});

		it("should return active preset IDs for a tab", async () => {
			mockLocalStorage.tabPresetStates = {
				"123": ["preset1", "preset2"],
			};

			const activePresets = await getActivePresetsForTab(123);
			expect(activePresets).toEqual(["preset1", "preset2"]);
		});
	});

	describe("updateTabPresetState", () => {
		it("should update active presets for a tab", async () => {
			mockLocalStorage.tabPresetStates = {};

			await updateTabPresetState(123, ["preset1", "preset2"]);
			expect(mockLocalStorage.tabPresetStates["123"]).toEqual([
				"preset1",
				"preset2",
			]);
		});

		it("should remove tab entry when presets array is empty", async () => {
			mockLocalStorage.tabPresetStates = {
				"123": ["preset1"],
			};

			await updateTabPresetState(123, []);
			expect(mockLocalStorage.tabPresetStates["123"]).toBeUndefined();
		});
	});

	describe("addActivePresetToTab", () => {
		it("should add a preset to tab's active list", async () => {
			mockLocalStorage.tabPresetStates = {};

			await addActivePresetToTab(123, "preset1");
			expect(mockLocalStorage.tabPresetStates["123"]).toContain("preset1");
		});

		it("should not add duplicate preset", async () => {
			mockLocalStorage.tabPresetStates = {
				"123": ["preset1"],
			};

			await addActivePresetToTab(123, "preset1");
			expect(mockLocalStorage.tabPresetStates["123"]).toEqual(["preset1"]);
		});
	});

	describe("removeActivePresetFromTab", () => {
		it("should remove a preset from tab's active list", async () => {
			mockLocalStorage.tabPresetStates = {
				"123": ["preset1", "preset2"],
			};

			await removeActivePresetFromTab(123, "preset1");
			expect(mockLocalStorage.tabPresetStates["123"]).toEqual(["preset2"]);
		});

		it("should handle removing non-existent preset gracefully", async () => {
			mockLocalStorage.tabPresetStates = {
				"123": ["preset1"],
			};

			await removeActivePresetFromTab(123, "nonexistent");
			expect(mockLocalStorage.tabPresetStates["123"]).toEqual(["preset1"]);
		});
	});

	describe("isPresetActiveOnTab", () => {
		it("should return true when preset is active on tab", async () => {
			mockLocalStorage.tabPresetStates = {
				"123": ["preset1", "preset2"],
			};

			const isActive = await isPresetActiveOnTab(123, "preset1");
			expect(isActive).toBe(true);
		});

		it("should return false when preset is not active on tab", async () => {
			mockLocalStorage.tabPresetStates = {
				"123": ["preset1"],
			};

			const isActive = await isPresetActiveOnTab(123, "preset2");
			expect(isActive).toBe(false);
		});

		it("should return false when tab has no active presets", async () => {
			mockLocalStorage.tabPresetStates = {};

			const isActive = await isPresetActiveOnTab(123, "preset1");
			expect(isActive).toBe(false);
		});
	});

	describe("cleanupTabState", () => {
		it("should remove all state for a tab", async () => {
			mockLocalStorage.tabPresetStates = {
				"123": ["preset1", "preset2"],
				"456": ["preset3"],
			};

			await cleanupTabState(123);
			expect(mockLocalStorage.tabPresetStates["123"]).toBeUndefined();
			expect(mockLocalStorage.tabPresetStates["456"]).toEqual(["preset3"]);
		});
	});

	describe("onPresetsChanged", () => {
		it("should subscribe to preset changes", () => {
			const callback = vi.fn();
			onPresetsChanged(callback);

			expect(chrome.storage.onChanged.addListener).toHaveBeenCalled();
		});

		it("should call callback when presets change in sync storage", () => {
			const callback = vi.fn();
			onPresetsChanged(callback);

			// Simulate storage change
			const newPresets: Preset[] = [
				{ id: "1", name: "New", parameters: [] },
			];
			storageChangeListeners.forEach((listener) => {
				listener({ presets: { newValue: newPresets } }, "sync");
			});

			expect(callback).toHaveBeenCalledWith(newPresets);
		});

		it("should not call callback for non-preset changes", () => {
			const callback = vi.fn();
			onPresetsChanged(callback);

			// Simulate other storage change
			storageChangeListeners.forEach((listener) => {
				listener({ otherKey: { newValue: "value" } }, "sync");
			});

			expect(callback).not.toHaveBeenCalled();
		});

		it("should not call callback for local storage changes", () => {
			const callback = vi.fn();
			onPresetsChanged(callback);

			// Simulate local storage change
			storageChangeListeners.forEach((listener) => {
				listener({ presets: { newValue: [] } }, "local");
			});

			expect(callback).not.toHaveBeenCalled();
		});

		it("should return unsubscribe function", () => {
			const callback = vi.fn();
			const unsubscribe = onPresetsChanged(callback);

			expect(typeof unsubscribe).toBe("function");
			unsubscribe();
			expect(chrome.storage.onChanged.removeListener).toHaveBeenCalled();
		});

		it("should handle undefined newValue", () => {
			const callback = vi.fn();
			onPresetsChanged(callback);

			// Simulate storage change with undefined newValue
			storageChangeListeners.forEach((listener) => {
				listener({ presets: { newValue: undefined } }, "sync");
			});

			expect(callback).toHaveBeenCalledWith([]);
		});
	});

	describe("onTabPresetStatesChanged", () => {
		it("should subscribe to tab preset state changes", () => {
			const callback = vi.fn();
			onTabPresetStatesChanged(callback);

			expect(chrome.storage.onChanged.addListener).toHaveBeenCalled();
		});

		it("should call callback when tab states change in local storage", () => {
			const callback = vi.fn();
			onTabPresetStatesChanged(callback);

			const newStates = { "123": ["preset1"] };
			storageChangeListeners.forEach((listener) => {
				listener({ tabPresetStates: { newValue: newStates } }, "local");
			});

			expect(callback).toHaveBeenCalledWith(newStates);
		});

		it("should not call callback for sync storage changes", () => {
			const callback = vi.fn();
			onTabPresetStatesChanged(callback);

			storageChangeListeners.forEach((listener) => {
				listener({ tabPresetStates: { newValue: {} } }, "sync");
			});

			expect(callback).not.toHaveBeenCalled();
		});

		it("should return unsubscribe function", () => {
			const callback = vi.fn();
			const unsubscribe = onTabPresetStatesChanged(callback);

			expect(typeof unsubscribe).toBe("function");
			unsubscribe();
			expect(chrome.storage.onChanged.removeListener).toHaveBeenCalled();
		});

		it("should handle undefined newValue", () => {
			const callback = vi.fn();
			onTabPresetStatesChanged(callback);

			storageChangeListeners.forEach((listener) => {
				listener({ tabPresetStates: { newValue: undefined } }, "local");
			});

			expect(callback).toHaveBeenCalledWith({});
		});
	});
});

