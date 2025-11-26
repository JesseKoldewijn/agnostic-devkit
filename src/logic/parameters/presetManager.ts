/**
 * High-level preset management operations
 * Combines storage and applicator functionality for toggling presets
 */

import type { Preset, Parameter } from "./types";
import { generateId, createEmptyPreset } from "./types";
import {
	getPresets,
	getPresetById,
	addPreset as addPresetToStorage,
	updatePreset as updatePresetInStorage,
	deletePreset as deletePresetFromStorage,
	addParameter as addParameterToStorage,
	updateParameter as updateParameterInStorage,
	removeParameter as removeParameterFromStorage,
	getActivePresetsForTab,
	addActivePresetToTab,
	removeActivePresetFromTab,
	isPresetActiveOnTab,
	savePresets as savePresetsToStorage,
} from "./storage";
import {
	applyPreset as applyPresetToTab,
	removePreset as removePresetFromTab,
} from "./parameterApplicator";

/**
 * Toggle a preset on/off for a specific tab
 * When toggled on, applies all parameters from the preset
 * When toggled off, removes parameters not used by other active presets
 */
export async function togglePreset(
	tabId: number,
	presetId: string
): Promise<{ active: boolean; success: boolean }> {
	const isActive = await isPresetActiveOnTab(tabId, presetId);

	if (isActive) {
		// Toggling off - remove the preset
		const success = await removePresetFromTab(tabId, presetId);
		if (success) {
			await removeActivePresetFromTab(tabId, presetId);
		}
		return { active: false, success };
	} else {
		// Toggling on - apply the preset first, then mark as active
		const success = await applyPresetToTab(tabId, presetId);

		if (success) {
			await addActivePresetToTab(tabId, presetId);
		}

		return { active: success, success };
	}
}

/**
 * Apply a preset to a tab (without toggling)
 */
export async function activatePreset(
	tabId: number,
	presetId: string
): Promise<boolean> {
	const isActive = await isPresetActiveOnTab(tabId, presetId);
	if (isActive) return true; // Already active

	const success = await applyPresetToTab(tabId, presetId);

	if (success) {
		await addActivePresetToTab(tabId, presetId);
	}

	return success;
}

/**
 * Remove a preset from a tab (without toggling)
 */
export async function deactivatePreset(
	tabId: number,
	presetId: string
): Promise<boolean> {
	const isActive = await isPresetActiveOnTab(tabId, presetId);
	if (!isActive) return true; // Already inactive

	const success = await removePresetFromTab(tabId, presetId);
	if (success) {
		await removeActivePresetFromTab(tabId, presetId);
	}
	return success;
}

/**
 * Get all presets with their active state for a specific tab
 */
export async function getPresetsWithActiveState(
	tabId: number
): Promise<Array<Preset & { isActive: boolean }>> {
	const presets = await getPresets();
	const activePresetIds = await getActivePresetsForTab(tabId);

	return presets.map((preset) => ({
		...preset,
		isActive: activePresetIds.includes(preset.id),
	}));
}

/**
 * Create a new preset with the given data
 */
export async function createPreset(
	data: Omit<Preset, "id" | "createdAt" | "updatedAt">
): Promise<Preset> {
	const preset: Preset = {
		...createEmptyPreset(),
		...data,
	};

	await addPresetToStorage(preset);
	return preset;
}

/**
 * Update an existing preset
 */
export async function updatePreset(
	presetId: string,
	updates: Partial<Omit<Preset, "id">>
): Promise<void> {
	await updatePresetInStorage(presetId, updates);
}

/**
 * Delete a preset
 */
export async function deletePreset(presetId: string): Promise<void> {
	await deletePresetFromStorage(presetId);
}

/**
 * Add a parameter to a preset
 */
export async function addParameterToPreset(
	presetId: string,
	parameter: Omit<Parameter, "id">
): Promise<Parameter> {
	const newParameter: Parameter = {
		...parameter,
		id: generateId(),
	};

	await addParameterToStorage(presetId, newParameter);
	return newParameter;
}

/**
 * Update a parameter within a preset
 */
export async function updateParameterInPreset(
	presetId: string,
	parameterId: string,
	updates: Partial<Omit<Parameter, "id">>
): Promise<void> {
	await updateParameterInStorage(presetId, parameterId, updates);
}

/**
 * Remove a parameter from a preset
 */
export async function removeParameterFromPreset(
	presetId: string,
	parameterId: string
): Promise<void> {
	await removeParameterFromStorage(presetId, parameterId);
}

/**
 * Duplicate a preset with a new name
 */
export async function duplicatePreset(
	presetId: string,
	newName?: string
): Promise<Preset | null> {
	const original = await getPresetById(presetId);
	if (!original) return null;

	const duplicate: Preset = {
		...createEmptyPreset(),
		name: newName ?? `${original.name} (Copy)`,
		description: original.description,
		parameters: original.parameters.map((p) => ({
			...p,
			id: generateId(),
		})),
	};

	await addPresetToStorage(duplicate);
	return duplicate;
}

/**
 * Reorder parameters within a preset
 */
export async function reorderParameters(
	presetId: string,
	parameterIds: string[]
): Promise<void> {
	const preset = await getPresetById(presetId);
	if (!preset) return;

	// Create a map for quick lookup
	const paramMap = new Map(preset.parameters.map((p) => [p.id, p]));

	// Reorder based on the provided IDs
	const reorderedParams = parameterIds
		.map((id) => paramMap.get(id))
		.filter((p): p is Parameter => p !== undefined);

	await updatePresetInStorage(presetId, { parameters: reorderedParams });
}

/**
 * Export presets as JSON
 */
export async function exportPresets(): Promise<string> {
	const presets = await getPresets();
	return JSON.stringify(presets, null, 2);
}

/**
 * Import presets from JSON
 * @param json The JSON string containing presets
 * @param merge If true, merges with existing presets; if false, replaces all
 */
export async function importPresets(
	json: string,
	merge: boolean = true
): Promise<{ imported: number; errors: string[] }> {
	const errors: string[] = [];
	let imported = 0;

	try {
		const data = JSON.parse(json);

		if (!Array.isArray(data)) {
			return {
				imported: 0,
				errors: ["Invalid format: expected an array"],
			};
		}

		const existingPresets = merge ? await getPresets() : [];
		const existingIds = new Set(existingPresets.map((p) => p.id));

		for (const item of data) {
			try {
				// Validate basic structure
				if (!item.name || !Array.isArray(item.parameters)) {
					errors.push(
						`Invalid preset: ${JSON.stringify(item).slice(
							0,
							50
						)}...`
					);
					continue;
				}

				// Assign new ID if it already exists or is missing
				const preset: Preset = {
					id:
						item.id && !existingIds.has(item.id)
							? item.id
							: generateId(),
					name: item.name,
					description: item.description,
					parameters: item.parameters.map((p: any) => ({
						id: generateId(),
						type: p.type ?? "queryParam",
						key: p.key ?? "",
						value: p.value ?? "",
						description: p.description,
					})),
					createdAt: Date.now(),
					updatedAt: Date.now(),
				};

				existingPresets.push(preset);
				existingIds.add(preset.id);
				imported++;
			} catch (e) {
				errors.push(`Failed to import preset: ${e}`);
			}
		}

		// Save all presets
		await savePresetsToStorage(existingPresets);

		return { imported, errors };
	} catch (e) {
		return { imported: 0, errors: [`Failed to parse JSON: ${e}`] };
	}
}
