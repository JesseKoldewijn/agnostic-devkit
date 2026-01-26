/**
 * Parameter applicator - handles applying and removing parameters to tabs
 * Supports queryParam, cookie, and localStorage parameter types
 */

import { browser } from "wxt/browser";
import { getActivePresetsForTab, getPresetById, getPresets } from "./storage";
import type { Parameter, ParameterType, Preset } from "./types";

console.log("[ParameterApplicator] Module loaded");

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
async function applyQueryParam(tabId: number, key: string, value: string): Promise<boolean> {
	try {
		const url = await getTabUrl(tabId);
		if (!url) {
			return false;
		}

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
		if (!url) {
			return false;
		}

		const urlObj = new URL(url);
		if (!urlObj.searchParams.has(key)) {
			return true;
		} // Already removed

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
async function applyCookie(tabId: number, key: string, value: string): Promise<boolean> {
	try {
		const url = await getTabUrl(tabId);
		if (!url) {
			return false;
		}

		const urlObj = new URL(url);

		await browser.cookies.set({
			name: key,
			path: "/",
			url: urlObj.origin,
			value: value,
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
		if (!url) {
			return false;
		}

		const urlObj = new URL(url);

		await browser.cookies.remove({
			name: key,
			url: urlObj.origin,
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
async function applyLocalStorage(tabId: number, key: string, value: string): Promise<boolean> {
	try {
		const response = await browser.runtime.sendMessage({
			key,
			tabId,
			type: "APPLY_LS",
			value,
		});
		return Boolean(response?.success);
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
		const response = await browser.runtime.sendMessage({
			key,
			tabId,
			type: "REMOVE_LS",
		});
		return Boolean(response?.success);
	} catch (error) {
		console.error("[ParameterApplicator] Failed to remove localStorage:", error);
		return false;
	}
}

/**
 * Get the current value of a query parameter from a tab's URL
 */
export async function getQueryParamValue(tabId: number, key: string): Promise<string | null> {
	try {
		const url = await getTabUrl(tabId);
		if (!url) {
			return null;
		}

		const urlObj = new URL(url);
		if (!urlObj.searchParams.has(key)) {
			return null;
		}
		return urlObj.searchParams.get(key);
	} catch {
		return null;
	}
}

/**
 * Get the current value of a cookie from a tab's domain
 */
export async function getCookieValue(tabId: number, key: string): Promise<string | null> {
	try {
		const url = await getTabUrl(tabId);
		if (!url) {
			return null;
		}

		const urlObj = new URL(url);
		const cookie = await browser.cookies.get({
			name: key,
			url: urlObj.origin,
		});

		return cookie?.value ?? null;
	} catch {
		return null;
	}
}

/**
 * Get the current value of a localStorage item from a tab
 */
export async function getLocalStorageValue(tabId: number, key: string): Promise<string | null> {
	try {
		const response = await browser.runtime.sendMessage({
			key,
			tabId,
			type: "GET_LS",
		});
		return response?.value ?? null;
	} catch {
		return null;
	}
}

/**
 * Get the current value of a parameter from the page
 * Dispatches to the appropriate getter based on parameter type
 */
export async function getParameterCurrentValue(
	tabId: number,
	param: Parameter
): Promise<string | null> {
	switch (param.type) {
		case "queryParam":
			return getQueryParamValue(tabId, param.key);
		case "cookie":
			return getCookieValue(tabId, param.key);
		case "localStorage":
			return getLocalStorageValue(tabId, param.key);
		default:
			return null;
	}
}

/**
 * Apply a single parameter to a tab
 */
export async function applyParameter(tabId: number, parameter: Parameter): Promise<boolean> {
	switch (parameter.type) {
		case "queryParam": {
			return applyQueryParam(tabId, parameter.key, parameter.value);
		}
		case "cookie": {
			return applyCookie(tabId, parameter.key, parameter.value);
		}
		case "localStorage": {
			return applyLocalStorage(tabId, parameter.key, parameter.value);
		}
		default: {
			console.warn("[ParameterApplicator] Unknown parameter type:", parameter.type);
			return false;
		}
	}
}

/**
 * Remove a single parameter from a tab
 * For boolean parameters, sets value to "false" instead of removing
 */
export async function removeParameter(tabId: number, parameter: Parameter): Promise<boolean> {
	// For boolean parameters, set to "false" instead of removing
	if (parameter.primitiveType === "boolean") {
		switch (parameter.type) {
			case "queryParam": {
				return applyQueryParam(tabId, parameter.key, "false");
			}
			case "cookie": {
				return applyCookie(tabId, parameter.key, "false");
			}
			case "localStorage": {
				return applyLocalStorage(tabId, parameter.key, "false");
			}
			default: {
				console.warn("[ParameterApplicator] Unknown parameter type:", parameter.type);
				return false;
			}
		}
	}

	// For string parameters, remove completely
	switch (parameter.type) {
		case "queryParam": {
			return removeQueryParam(tabId, parameter.key);
		}
		case "cookie": {
			return removeCookie(tabId, parameter.key);
		}
		case "localStorage": {
			return removeLocalStorage(tabId, parameter.key);
		}
		default: {
			console.warn("[ParameterApplicator] Unknown parameter type:", parameter.type);
			return false;
		}
	}
}

/**
 * Apply all parameters from a preset to a tab
 * Note: Verification should be done separately after application to avoid interference
 */
export async function applyPreset(tabId: number, presetId: string): Promise<boolean> {
	const preset = await getPresetById(presetId);
	if (!preset) {
		console.warn("[ParameterApplicator] Preset not found:", presetId);
		return false;
	}

	// Group parameters by type to batch URL updates
	const queryParams = preset.parameters.filter((p) => p.type === "queryParam");
	const cookies = preset.parameters.filter((p) => p.type === "cookie");
	const localStorageItems = preset.parameters.filter((p) => p.type === "localStorage");

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
			console.error("[ParameterApplicator] Failed to apply query params batch:", error);
			success = false;
		}
	}

	// Apply cookies (after URL update, cookies persist across reloads)
	for (const param of cookies) {
		const result = await applyCookie(tabId, param.key, param.value);
		if (!result) {
			success = false;
		}
	}

	// Apply localStorage items (after URL update, localStorage persists across reloads)
	for (const param of localStorageItems) {
		const result = await applyLocalStorage(tabId, param.key, param.value);
		if (!result) {
			success = false;
		}
	}

	return success;
}

/**
 * Find the effective value for a parameter from a list of presets
 * The last preset in the list that contains the parameter wins
 */
function getEffectiveValue(
	type: ParameterType,
	key: string,
	presets: Preset[]
): string | undefined {
	// Search from back to front (last wins)
	for (let i = presets.length - 1; i >= 0; i--) {
		const param = presets[i].parameters.find((p) => p.type === type && p.key === key);
		if (param) {
			return param.value;
		}
	}
	return undefined;
}

/**
 * Remove all parameters from a preset that are not used by other active presets
 * For shared parameters, reverts to the value from the next most recent active preset
 */
export async function removePreset(tabId: number, presetId: string): Promise<boolean> {
	const preset = await getPresetById(presetId);
	if (!preset) {
		console.warn("[ParameterApplicator] Preset not found:", presetId);
		return false;
	}

	console.log(
		`[ParameterApplicator] Removing preset ${preset.name} (${preset.id}) from tab ${tabId}`
	);

	// Get other active presets to determine what to remove or revert
	const activePresetIds = await getActivePresetsForTab(tabId);
	const otherActivePresetIds = activePresetIds.filter((id) => id !== presetId);

	const allPresets = await getPresets();
	const otherActivePresets = otherActivePresetIds
		.map((id) => allPresets.find((p: Preset) => p.id === id))
		.filter((p): p is Preset => p !== undefined);

	// Determine which parameters to remove and which to revert
	const paramsToRemove: Parameter[] = [];
	const paramsToRevert: Parameter[] = [];

	for (const param of preset.parameters) {
		const effectiveValue = getEffectiveValue(param.type, param.key, otherActivePresets);
		if (effectiveValue === undefined) {
			paramsToRemove.push(param);
		} else if (effectiveValue !== param.value) {
			// Only need to revert if the value is different from the current one
			paramsToRevert.push({ ...param, value: effectiveValue });
		}
	}

	console.log(
		`[ParameterApplicator] Params to remove: ${paramsToRemove.length}, to revert: ${paramsToRevert.length}`
	);

	let success = true;

	// Handle query params
	const queryParamsToRemove = paramsToRemove.filter((p) => p.type === "queryParam");
	const queryParamsToRevert = paramsToRevert.filter((p) => p.type === "queryParam");

	if (queryParamsToRemove.length > 0 || queryParamsToRevert.length > 0) {
		try {
			const url = await getTabUrl(tabId);
			if (url) {
				const urlObj = new URL(url);
				for (const param of queryParamsToRemove) {
					urlObj.searchParams.delete(param.key);
				}
				for (const param of queryParamsToRevert) {
					urlObj.searchParams.set(param.key, param.value);
				}
				await browser.tabs?.update(tabId, { url: urlObj.toString() });

				// Wait for page to start reloading
				await new Promise((resolve) => setTimeout(resolve, 200));
			}
		} catch (error) {
			console.error("[ParameterApplicator] Failed to update query params during removal:", error);
			success = false;
		}
	}

	// Handle cookies
	for (const param of paramsToRemove.filter((p) => p.type === "cookie")) {
		if (!(await removeCookie(tabId, param.key))) {
			success = false;
		}
	}
	for (const param of paramsToRevert.filter((p) => p.type === "cookie")) {
		if (!(await applyCookie(tabId, param.key, param.value))) {
			success = false;
		}
	}

	// Handle localStorage
	for (const param of paramsToRemove.filter((p) => p.type === "localStorage")) {
		if (!(await removeLocalStorage(tabId, param.key))) {
			success = false;
		}
	}
	for (const param of paramsToRevert.filter((p) => p.type === "localStorage")) {
		if (!(await applyLocalStorage(tabId, param.key, param.value))) {
			success = false;
		}
	}

	return success;
}

/**
 * Get the display label for a parameter type
 */
export function getParameterTypeLabel(type: ParameterType): string {
	switch (type) {
		case "queryParam": {
			return "Query Parameter";
		}
		case "cookie": {
			return "Cookie";
		}
		case "localStorage": {
			return "Local Storage";
		}
		default: {
			return "Unknown";
		}
	}
}

/**
 * Get the icon/emoji for a parameter type
 */
export function getParameterTypeIcon(type: ParameterType): string {
	switch (type) {
		case "queryParam": {
			return "🔗";
		}
		case "cookie": {
			return "🍪";
		}
		case "localStorage": {
			return "💾";
		}
		default: {
			return "❓";
		}
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
		if (!url) {
			return false;
		}

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
async function verifyCookie(tabId: number, key: string, expectedValue: string): Promise<boolean> {
	try {
		const url = await getTabUrl(tabId);
		if (!url) {
			return false;
		}

		const urlObj = new URL(url);
		const cookie = await browser.cookies.get({
			name: key,
			url: urlObj.origin,
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
		const response = await browser.runtime.sendMessage({
			key,
			tabId,
			type: "GET_LS",
		});
		return response?.success && response.value === expectedValue;
	} catch {
		return false;
	}
}

/**
 * Verify a parameter is correctly applied
 */
export async function verifyParameter(tabId: number, parameter: Parameter): Promise<boolean> {
	switch (parameter.type) {
		case "queryParam": {
			return verifyQueryParam(tabId, parameter.key, parameter.value);
		}
		case "cookie": {
			return verifyCookie(tabId, parameter.key, parameter.value);
		}
		case "localStorage": {
			return verifyLocalStorage(tabId, parameter.key, parameter.value);
		}
		default: {
			return false;
		}
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
	results: { parameter: Parameter; verified: boolean }[];
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
export async function syncParameter(tabId: number, parameter: Parameter): Promise<boolean> {
	// Apply the parameter
	const applied = await applyParameter(tabId, parameter);
	if (!applied) {
		return false;
	}

	// Verify it was set correctly
	const verified = await verifyParameter(tabId, parameter);
	if (verified) {
		return true;
	}

	// If verification failed, retry once
	console.warn(`[ParameterApplicator] Parameter ${parameter.key} verification failed, retrying...`);
	const retryApplied = await applyParameter(tabId, parameter);
	if (!retryApplied) {
		return false;
	}

	// Wait a bit for the value to propagate
	await new Promise((resolve) => setTimeout(resolve, 100));

	// Verify again
	return verifyParameter(tabId, parameter);
}
