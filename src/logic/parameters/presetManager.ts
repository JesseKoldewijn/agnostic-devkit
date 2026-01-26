/**
 * High-level preset management operations
 * Combines storage and applicator functionality for toggling presets
 */

import {
	applyPreset as applyPresetToTab,
	removePreset as removePresetFromTab,
} from "./parameterApplicator";
import {
	addActivePresetToTab,
	addParameter as addParameterToStorage,
	addPreset as addPresetToStorage,
	deletePreset as deletePresetFromStorage,
	getActivePresetsForTab,
	getPresetById,
	getPresets,
	isPresetActiveOnTab,
	removeActivePresetFromTab,
	removeParameter as removeParameterFromStorage,
	savePresets as savePresetsToStorage,
	updateParameter as updateParameterInStorage,
	updatePreset as updatePresetInStorage,
} from "./storage";
import type { Parameter, Preset } from "./types";
import { createEmptyPreset, generateId } from "./types";

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
		// Toggling off - remove the preset parameters first, then mark as inactive
		// This ensures shared parameters are kept if other active presets need them
		const success = await removePresetFromTab(tabId, presetId);
		if (success) {
			await removeActivePresetFromTab(tabId, presetId);
		}
		return { active: false, success };
	}
	// Toggling on - mark as active first, then apply parameters
	// This ensures that if another preset is removed during application,
	// it sees this preset as active and doesn't remove shared parameters.
	await addActivePresetToTab(tabId, presetId);
	const success = await applyPresetToTab(tabId, presetId);

	if (!success) {
		// If application failed, revert the active state
		await removeActivePresetFromTab(tabId, presetId);
	}

	return { active: success, success };
}

/**
 * Apply a preset to a tab (without toggling)
 */
export async function activatePreset(tabId: number, presetId: string): Promise<boolean> {
	const isActive = await isPresetActiveOnTab(tabId, presetId);
	if (isActive) {
		return true;
	} // Already active

	await addActivePresetToTab(tabId, presetId);
	const success = await applyPresetToTab(tabId, presetId);

	if (!success) {
		await removeActivePresetFromTab(tabId, presetId);
	}

	return success;
}

/**
 * Remove a preset from a tab (without toggling)
 */
export async function deactivatePreset(tabId: number, presetId: string): Promise<boolean> {
	const isActive = await isPresetActiveOnTab(tabId, presetId);
	if (!isActive) {
		return true;
	} // Already inactive

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
): Promise<(Preset & { isActive: boolean })[]> {
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
export async function duplicatePreset(presetId: string, newName?: string): Promise<Preset | null> {
	const original = await getPresetById(presetId);
	if (!original) {
		return null;
	}

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
export async function reorderParameters(presetId: string, parameterIds: string[]): Promise<void> {
	const preset = await getPresetById(presetId);
	if (!preset) {
		return;
	}

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
 * @param presetIds Optional array of preset IDs to export. If not provided, exports all presets.
 */
export async function exportPresets(presetIds?: string[]): Promise<string> {
	const allPresets = await getPresets();
	const presetsToExport = presetIds
		? allPresets.filter((p) => presetIds.includes(p.id))
		: allPresets;
	return JSON.stringify(presetsToExport, null, 2);
}

/**
 * Import presets from JSON
 * @param json The JSON string containing presets
 * @param merge If true, merges with existing presets; if false, replaces all
 */
export async function importPresets(
	json: string,
	merge = true
): Promise<{ imported: number; errors: string[] }> {
	const errors: string[] = [];
	let imported = 0;

	try {
		const data = JSON.parse(json);

		if (!Array.isArray(data)) {
			return {
				errors: ["Invalid format: expected an array"],
				imported: 0,
			};
		}

		const existingPresets = merge ? await getPresets() : [];
		const existingIds = new Set(existingPresets.map((p) => p.id));

		for (const item of data) {
			try {
				// Validate basic structure
				if (!item.name || !Array.isArray(item.parameters)) {
					errors.push(`Invalid preset: ${JSON.stringify(item).slice(0, 50)}...`);
					continue;
				}

				// Assign new ID if it already exists or is missing
				const preset: Preset = {
					createdAt: Date.now(),
					description: item.description,
					id: item.id && !existingIds.has(item.id) ? item.id : generateId(),
					name: item.name,
					parameters: (item.parameters as Partial<Parameter>[]).map((p) => ({
						description: p.description,
						id: generateId(),
						key: p.key ?? "",
						type: p.type ?? "queryParam",
						value: p.value ?? "",
					})),
					updatedAt: Date.now(),
				};

				existingPresets.push(preset);
				existingIds.add(preset.id);
				imported++;
			} catch (error) {
				errors.push(`Failed to import preset: ${error}`);
			}
		}

		// Save all presets
		await savePresetsToStorage(existingPresets);

		return { errors, imported };
	} catch (error) {
		return { errors: [`Failed to parse JSON: ${error}`], imported: 0 };
	}
}

/**
 * Migrate a single parameter for backwards compatibility
 * If primitiveType is not set, infer it from the value:
 * - "true" or "false" → boolean
 * - anything else → string
 */
export function migrateParameter(param: Parameter): Parameter {
	// Already migrated
	if (param.primitiveType !== undefined) {
		return param;
	}

	// Infer boolean type from value
	if (param.value === "true" || param.value === "false") {
		return { ...param, primitiveType: "boolean" };
	}

	// Default to string
	return { ...param, primitiveType: "string" };
}

/**
 * Check all presets and migrate parameters that don't have primitiveType set
 * Saves back to storage if any changes were made
 */
export async function migratePresetsIfNeeded(): Promise<void> {
	const presets = await getPresets();
	let needsUpdate = false;

	const migratedPresets = presets.map((preset) => {
		const migratedParams = preset.parameters.map((param) => {
			const migrated = migrateParameter(param);
			if (migrated !== param) {
				needsUpdate = true;
			}
			return migrated;
		});
		return { ...preset, parameters: migratedParams };
	});

	if (needsUpdate) {
		await savePresetsToStorage(migratedPresets);
	}
}
