/**
 * Storage management for parameters and presets
 * All changes sync immediately to browser.storage.sync
 */

import { browser } from "wxt/browser";
import type { Parameter, Preset } from "./types";

const PRESETS_KEY = "presets";
const TAB_PRESET_STATES_KEY = "tabPresetStates";

/**
 * Get all presets from browser.storage.sync
 */
export async function getPresets(): Promise<Preset[]> {
	const result = await browser.storage?.sync.get([PRESETS_KEY]);
	return (result?.[PRESETS_KEY] as Preset[]) ?? [];
}

/**
 * Save all presets to browser.storage.sync
 */
export async function savePresets(presets: Preset[]): Promise<void> {
	await browser.storage?.sync.set({ [PRESETS_KEY]: presets });
}

/**
 * Get a single preset by ID
 */
export async function getPresetById(presetId: string): Promise<Preset | undefined> {
	const presets = await getPresets();
	return presets.find((p) => p.id === presetId);
}

/**
 * Add a new preset and sync immediately
 */
export async function addPreset(preset: Preset): Promise<void> {
	const presets = await getPresets();
	presets.push({
		...preset,
		createdAt: Date.now(),
		updatedAt: Date.now(),
	});
	await savePresets(presets);
}

/**
 * Update an existing preset and sync immediately
 */
export async function updatePreset(
	presetId: string,
	updates: Partial<Omit<Preset, "id">>
): Promise<void> {
	const presets = await getPresets();
	const index = presets.findIndex((p) => p.id === presetId);
	if (index !== -1) {
		presets[index] = {
			...presets[index],
			...updates,
			updatedAt: Date.now(),
		};
		await savePresets(presets);
	}
}

/**
 * Delete a preset and sync immediately
 */
export async function deletePreset(presetId: string): Promise<void> {
	const presets = await getPresets();
	const filtered = presets.filter((p) => p.id !== presetId);
	await savePresets(filtered);

	// Also clean up any tab states that reference this preset
	const tabStates = await getTabPresetStates();
	const cleanedStates: Record<string, string[]> = {};
	for (const [tabId, presetIds] of Object.entries(tabStates)) {
		cleanedStates[tabId] = presetIds.filter((id) => id !== presetId);
	}
	await saveTabPresetStates(cleanedStates);
}

/**
 * Add a parameter to a preset and sync immediately
 */
export async function addParameter(presetId: string, parameter: Parameter): Promise<void> {
	const presets = await getPresets();
	const index = presets.findIndex((p) => p.id === presetId);
	if (index !== -1) {
		presets[index].parameters.push(parameter);
		presets[index].updatedAt = Date.now();
		await savePresets(presets);
	}
}

/**
 * Update a parameter within a preset and sync immediately
 */
export async function updateParameter(
	presetId: string,
	parameterId: string,
	updates: Partial<Omit<Parameter, "id">>
): Promise<void> {
	const presets = await getPresets();
	const presetIndex = presets.findIndex((p) => p.id === presetId);
	if (presetIndex !== -1) {
		const paramIndex = presets[presetIndex].parameters.findIndex((p) => p.id === parameterId);
		if (paramIndex !== -1) {
			presets[presetIndex].parameters[paramIndex] = {
				...presets[presetIndex].parameters[paramIndex],
				...updates,
			};
			presets[presetIndex].updatedAt = Date.now();
			await savePresets(presets);
		}
	}
}

/**
 * Remove a parameter from a preset and sync immediately
 */
export async function removeParameter(presetId: string, parameterId: string): Promise<void> {
	const presets = await getPresets();
	const presetIndex = presets.findIndex((p) => p.id === presetId);
	if (presetIndex !== -1) {
		presets[presetIndex].parameters = presets[presetIndex].parameters.filter(
			(p) => p.id !== parameterId
		);
		presets[presetIndex].updatedAt = Date.now();
		await savePresets(presets);
	}
}

/**
 * Get tab preset states from browser.storage.local
 */
export async function getTabPresetStates(): Promise<Record<string, string[]>> {
	const result = await browser.storage?.local.get([TAB_PRESET_STATES_KEY]);
	return (result?.[TAB_PRESET_STATES_KEY] as Record<string, string[]>) ?? {};
}

/**
 * Save tab preset states to browser.storage.local
 */
export async function saveTabPresetStates(states: Record<string, string[]>): Promise<void> {
	await browser.storage?.local.set({ [TAB_PRESET_STATES_KEY]: states });
}

/**
 * Get active preset IDs for a specific tab
 */
export async function getActivePresetsForTab(tabId: number): Promise<string[]> {
	const states = await getTabPresetStates();
	return states[tabId.toString()] ?? [];
}

/**
 * Update active presets for a specific tab
 */
export async function updateTabPresetState(tabId: number, presetIds: string[]): Promise<void> {
	const states = await getTabPresetStates();
	if (presetIds.length === 0) {
		delete states[tabId.toString()];
	} else {
		states[tabId.toString()] = presetIds;
	}
	await saveTabPresetStates(states);
}

/**
 * Add a preset to a tab's active presets
 */
export async function addActivePresetToTab(tabId: number, presetId: string): Promise<void> {
	const activePresets = await getActivePresetsForTab(tabId);
	if (!activePresets.includes(presetId)) {
		activePresets.push(presetId);
		await updateTabPresetState(tabId, activePresets);
	}
}

/**
 * Remove a preset from a tab's active presets
 */
export async function removeActivePresetFromTab(tabId: number, presetId: string): Promise<void> {
	const activePresets = await getActivePresetsForTab(tabId);
	const filtered = activePresets.filter((id) => id !== presetId);
	await updateTabPresetState(tabId, filtered);
}

/**
 * Check if a preset is active on a specific tab
 */
export async function isPresetActiveOnTab(tabId: number, presetId: string): Promise<boolean> {
	const activePresets = await getActivePresetsForTab(tabId);
	return activePresets.includes(presetId);
}

/**
 * Clean up tab state for closed tabs
 */
export async function cleanupTabState(tabId: number): Promise<void> {
	const states = await getTabPresetStates();
	delete states[tabId.toString()];
	await saveTabPresetStates(states);
}

/**
 * Subscribe to preset changes
 */
export function onPresetsChanged(callback: (presets: Preset[]) => void): () => void {
	// biome-ignore lint/suspicious/noExplicitAny: browser.storage.onChanged listener types are complex
	const listener = (changes: Record<string, any>, areaName: string) => {
		if (areaName === "sync" && changes[PRESETS_KEY]) {
			callback((changes[PRESETS_KEY].newValue as Preset[] | undefined) ?? []);
		}
	};

	browser.storage?.onChanged.addListener(listener);

	// Return unsubscribe function
	return () => {
		browser.storage?.onChanged.removeListener(listener);
	};
}

/**
 * Subscribe to tab preset state changes
 */
export function onTabPresetStatesChanged(
	callback: (states: Record<string, string[]>) => void
): () => void {
	// biome-ignore lint/suspicious/noExplicitAny: browser.storage.onChanged listener types are complex
	const listener = (changes: Record<string, any>, areaName: string) => {
		if (areaName === "local" && changes[TAB_PRESET_STATES_KEY]) {
			callback(
				(changes[TAB_PRESET_STATES_KEY].newValue as Record<string, string[]> | undefined) ?? {}
			);
		}
	};

	browser.storage?.onChanged.addListener(listener);

	// Return unsubscribe function
	return () => {
		browser.storage?.onChanged.removeListener(listener);
	};
}
