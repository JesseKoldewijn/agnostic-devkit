/**
 * Parameter applicator - handles applying and removing parameters to tabs
 * Supports queryParam, cookie, and localStorage parameter types
 */

import { browser } from "~/utils/browser";
import type { Parameter, ParameterType } from "./types";
import {
	getPresetById,
	getActivePresetsForTab,
	getPresets,
} from "./storage";

/**
 * Get the current tab's URL
 */
async function getTabUrl(tabId: number): Promise<string | undefined> {
	try {
		const tab = await browser.tabs?.get(tabId);
		return tab?.url;
	} catch {
		return undefined;
	}
}

/**
 * Apply a query parameter to a tab's URL
 */
async function applyQueryParam(
	tabId: number,
	key: string,
	value: string
): Promise<boolean> {
	try {
		const url = await getTabUrl(tabId);
		if (!url) return false;

		const urlObj = new URL(url);
		urlObj.searchParams.set(key, value);

		await browser.tabs?.update(tabId, { url: urlObj.toString() });
		return true;
	} catch (error) {
		console.error("[ParameterApplicator] Failed to apply query param:", error);
		return false;
	}
}

/**
 * Remove a query parameter from a tab's URL
 */
async function removeQueryParam(tabId: number, key: string): Promise<boolean> {
	try {
		const url = await getTabUrl(tabId);
		if (!url) return false;

		const urlObj = new URL(url);
		if (!urlObj.searchParams.has(key)) return true; // Already removed

		urlObj.searchParams.delete(key);

		await browser.tabs?.update(tabId, { url: urlObj.toString() });
		return true;
	} catch (error) {
		console.error("[ParameterApplicator] Failed to remove query param:", error);
		return false;
	}
}

/**
 * Apply a cookie to a tab's domain
 */
async function applyCookie(
	tabId: number,
	key: string,
	value: string
): Promise<boolean> {
	try {
		const url = await getTabUrl(tabId);
		if (!url) return false;

		const urlObj = new URL(url);

		await chrome.cookies.set({
			url: urlObj.origin,
			name: key,
			value: value,
			path: "/",
		});

		return true;
	} catch (error) {
		console.error("[ParameterApplicator] Failed to apply cookie:", error);
		return false;
	}
}

/**
 * Remove a cookie from a tab's domain
 */
async function removeCookie(tabId: number, key: string): Promise<boolean> {
	try {
		const url = await getTabUrl(tabId);
		if (!url) return false;

		const urlObj = new URL(url);

		await chrome.cookies.remove({
			url: urlObj.origin,
			name: key,
		});

		return true;
	} catch (error) {
		console.error("[ParameterApplicator] Failed to remove cookie:", error);
		return false;
	}
}

/**
 * Apply a localStorage item to a tab
 */
async function applyLocalStorage(
	tabId: number,
	key: string,
	value: string
): Promise<boolean> {
	try {
		await chrome.scripting.executeScript({
			target: { tabId },
			func: (k: string, v: string) => {
				localStorage.setItem(k, v);
			},
			args: [key, value],
		});

		return true;
	} catch (error) {
		console.error("[ParameterApplicator] Failed to apply localStorage:", error);
		return false;
	}
}

/**
 * Remove a localStorage item from a tab
 */
async function removeLocalStorage(tabId: number, key: string): Promise<boolean> {
	try {
		await chrome.scripting.executeScript({
			target: { tabId },
			func: (k: string) => {
				localStorage.removeItem(k);
			},
			args: [key],
		});

		return true;
	} catch (error) {
		console.error("[ParameterApplicator] Failed to remove localStorage:", error);
		return false;
	}
}

/**
 * Apply a single parameter to a tab
 */
export async function applyParameter(
	tabId: number,
	parameter: Parameter
): Promise<boolean> {
	switch (parameter.type) {
		case "queryParam":
			return applyQueryParam(tabId, parameter.key, parameter.value);
		case "cookie":
			return applyCookie(tabId, parameter.key, parameter.value);
		case "localStorage":
			return applyLocalStorage(tabId, parameter.key, parameter.value);
		default:
			console.warn(
				"[ParameterApplicator] Unknown parameter type:",
				parameter.type
			);
			return false;
	}
}

/**
 * Remove a single parameter from a tab
 */
export async function removeParameter(
	tabId: number,
	parameter: Parameter
): Promise<boolean> {
	switch (parameter.type) {
		case "queryParam":
			return removeQueryParam(tabId, parameter.key);
		case "cookie":
			return removeCookie(tabId, parameter.key);
		case "localStorage":
			return removeLocalStorage(tabId, parameter.key);
		default:
			console.warn(
				"[ParameterApplicator] Unknown parameter type:",
				parameter.type
			);
			return false;
	}
}

/**
 * Apply all parameters from a preset to a tab
 * Note: Verification should be done separately after application to avoid interference
 */
export async function applyPreset(
	tabId: number,
	presetId: string
): Promise<boolean> {
	const preset = await getPresetById(presetId);
	if (!preset) {
		console.warn("[ParameterApplicator] Preset not found:", presetId);
		return false;
	}

	// Group parameters by type to batch URL updates
	const queryParams = preset.parameters.filter((p) => p.type === "queryParam");
	const cookies = preset.parameters.filter((p) => p.type === "cookie");
	const localStorageItems = preset.parameters.filter(
		(p) => p.type === "localStorage"
	);

	let success = true;

	// Apply query params in batch to avoid multiple URL updates
	// This will cause a page reload, so we need to wait for it to complete
	// before applying cookies/localStorage
	if (queryParams.length > 0) {
		try {
			const url = await getTabUrl(tabId);
			if (url) {
				const urlObj = new URL(url);
				for (const param of queryParams) {
					urlObj.searchParams.set(param.key, param.value);
				}
				await browser.tabs?.update(tabId, { url: urlObj.toString() });
				
				// Wait for page to start reloading
				await new Promise((resolve) => setTimeout(resolve, 200));
			}
		} catch (error) {
			console.error(
				"[ParameterApplicator] Failed to apply query params batch:",
				error
			);
			success = false;
		}
	}

	// Apply cookies (after URL update, cookies persist across reloads)
	for (const param of cookies) {
		const result = await applyCookie(tabId, param.key, param.value);
		if (!result) success = false;
	}

	// Apply localStorage items (after URL update, localStorage persists across reloads)
	for (const param of localStorageItems) {
		const result = await applyLocalStorage(tabId, param.key, param.value);
		if (!result) success = false;
	}

	return success;
}

/**
 * Get all parameters that are still active from other presets
 * This is used when removing a preset to determine which parameters should not be removed
 */
async function getParametersFromOtherActivePresets(
	tabId: number,
	excludePresetId: string
): Promise<Parameter[]> {
	const activePresetIds = await getActivePresetsForTab(tabId);
	const otherActivePresetIds = activePresetIds.filter(
		(id) => id !== excludePresetId
	);

	const allPresets = await getPresets();
	const otherActivePresets = allPresets.filter((p) =>
		otherActivePresetIds.includes(p.id)
	);

	// Flatten all parameters from other active presets
	return otherActivePresets.flatMap((p) => p.parameters);
}

/**
 * Check if a parameter is still needed by another active preset
 */
function isParameterNeededByOtherPresets(
	parameter: Parameter,
	otherParameters: Parameter[]
): boolean {
	return otherParameters.some(
		(p) => p.type === parameter.type && p.key === parameter.key
	);
}

/**
 * Remove all parameters from a preset that are not used by other active presets
 */
export async function removePreset(
	tabId: number,
	presetId: string
): Promise<boolean> {
	const preset = await getPresetById(presetId);
	if (!preset) {
		console.warn("[ParameterApplicator] Preset not found:", presetId);
		return false;
	}

	const otherActiveParams = await getParametersFromOtherActivePresets(
		tabId,
		presetId
	);

	// Filter out parameters that are still needed by other presets
	const paramsToRemove = preset.parameters.filter(
		(p) => !isParameterNeededByOtherPresets(p, otherActiveParams)
	);

	// Group parameters by type
	const queryParams = paramsToRemove.filter((p) => p.type === "queryParam");
	const cookies = paramsToRemove.filter((p) => p.type === "cookie");
	const localStorageItems = paramsToRemove.filter(
		(p) => p.type === "localStorage"
	);

	let success = true;

	// Remove query params in batch
	if (queryParams.length > 0) {
		try {
			const url = await getTabUrl(tabId);
			if (url) {
				const urlObj = new URL(url);
				for (const param of queryParams) {
					urlObj.searchParams.delete(param.key);
				}
				await browser.tabs?.update(tabId, { url: urlObj.toString() });
			}
		} catch (error) {
			console.error(
				"[ParameterApplicator] Failed to remove query params batch:",
				error
			);
			success = false;
		}
	}

	// Remove cookies
	for (const param of cookies) {
		const result = await removeCookie(tabId, param.key);
		if (!result) success = false;
	}

	// Remove localStorage items
	for (const param of localStorageItems) {
		const result = await removeLocalStorage(tabId, param.key);
		if (!result) success = false;
	}

	return success;
}

/**
 * Get the display label for a parameter type
 */
export function getParameterTypeLabel(type: ParameterType): string {
	switch (type) {
		case "queryParam":
			return "Query Parameter";
		case "cookie":
			return "Cookie";
		case "localStorage":
			return "Local Storage";
		default:
			return "Unknown";
	}
}

/**
 * Get the icon/emoji for a parameter type
 */
export function getParameterTypeIcon(type: ParameterType): string {
	switch (type) {
		case "queryParam":
			return "🔗";
		case "cookie":
			return "🍪";
		case "localStorage":
			return "💾";
		default:
			return "❓";
	}
}

/**
 * Verify a query parameter is set correctly
 */
async function verifyQueryParam(
	tabId: number,
	key: string,
	expectedValue: string
): Promise<boolean> {
	try {
		const url = await getTabUrl(tabId);
		if (!url) return false;

		const urlObj = new URL(url);
		const actualValue = urlObj.searchParams.get(key);
		return actualValue === expectedValue;
	} catch {
		return false;
	}
}

/**
 * Verify a cookie is set correctly
 */
async function verifyCookie(
	tabId: number,
	key: string,
	expectedValue: string
): Promise<boolean> {
	try {
		const url = await getTabUrl(tabId);
		if (!url) return false;

		const urlObj = new URL(url);
		const cookie = await chrome.cookies.get({
			url: urlObj.origin,
			name: key,
		});

		return cookie?.value === expectedValue;
	} catch {
		return false;
	}
}

/**
 * Verify a localStorage item is set correctly
 */
async function verifyLocalStorage(
	tabId: number,
	key: string,
	expectedValue: string
): Promise<boolean> {
	try {
		const result = await chrome.scripting.executeScript({
			target: { tabId },
			func: (k: string) => {
				return localStorage.getItem(k);
			},
			args: [key],
		});

		const actualValue = result[0]?.result;
		return actualValue === expectedValue;
	} catch {
		return false;
	}
}

/**
 * Verify a parameter is correctly applied
 */
export async function verifyParameter(
	tabId: number,
	parameter: Parameter
): Promise<boolean> {
	switch (parameter.type) {
		case "queryParam":
			return verifyQueryParam(tabId, parameter.key, parameter.value);
		case "cookie":
			return verifyCookie(tabId, parameter.key, parameter.value);
		case "localStorage":
			return verifyLocalStorage(tabId, parameter.key, parameter.value);
		default:
			return false;
	}
}

/**
 * Verify all parameters from a preset are correctly applied
 * Returns an object with verification results for each parameter
 */
export async function verifyPreset(
	tabId: number,
	presetId: string
): Promise<{
	allVerified: boolean;
	results: Array<{ parameter: Parameter; verified: boolean }>;
}> {
	const preset = await getPresetById(presetId);
	if (!preset) {
		console.warn("[ParameterApplicator] Preset not found for verification:", presetId);
		return { allVerified: false, results: [] };
	}

	const results = await Promise.all(
		preset.parameters.map(async (param) => ({
			parameter: param,
			verified: await verifyParameter(tabId, param),
		}))
	);

	const allVerified = results.every((r) => r.verified);
	return { allVerified, results };
}

/**
 * Sync a parameter - apply it and verify it was set correctly
 * If verification fails, retry once
 */
export async function syncParameter(
	tabId: number,
	parameter: Parameter
): Promise<boolean> {
	// Apply the parameter
	const applied = await applyParameter(tabId, parameter);
	if (!applied) return false;

	// Verify it was set correctly
	const verified = await verifyParameter(tabId, parameter);
	if (verified) return true;

	// If verification failed, retry once
	console.warn(
		`[ParameterApplicator] Parameter ${parameter.key} verification failed, retrying...`
	);
	const retryApplied = await applyParameter(tabId, parameter);
	if (!retryApplied) return false;

	// Wait a bit for the value to propagate
	await new Promise((resolve) => setTimeout(resolve, 100));

	// Verify again
	return verifyParameter(tabId, parameter);
}

