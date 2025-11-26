/**
 * Parameter type definitions for the search parameters management system
 */

/**
 * The type of parameter - determines how it's applied to the page
 */
export type ParameterType = "queryParam" | "cookie" | "localStorage";

/**
 * A single parameter that can be applied to a page
 */
export interface Parameter {
	/** Unique identifier for this parameter */
	id: string;
	/** The type of parameter (queryParam, cookie, or localStorage) */
	type: ParameterType;
	/** The key/name of the parameter */
	key: string;
	/** The value to set for this parameter */
	value: string;
	/** Optional description for this parameter */
	description?: string;
}

/**
 * A preset is a collection of parameters that can be toggled together
 */
export interface Preset {
	/** Unique identifier for this preset */
	id: string;
	/** Display name for the preset */
	name: string;
	/** Optional description for the preset */
	description?: string;
	/** The parameters contained in this preset */
	parameters: Parameter[];
	/** When the preset was created */
	createdAt?: number;
	/** When the preset was last modified */
	updatedAt?: number;
}

/**
 * Tracks which presets are active for a specific tab
 */
export interface TabPresetState {
	/** The tab ID */
	tabId: number;
	/** List of active preset IDs for this tab */
	activePresetIds: string[];
}

/**
 * Storage schema for chrome.storage.sync
 */
export interface SyncStorageSchema {
	presets: Preset[];
}

/**
 * Storage schema for chrome.storage.local
 */
export interface LocalStorageSchema {
	tabPresetStates: Record<string, string[]>; // Maps tabId (as string) to active preset IDs
}

/**
 * Message types for communication between popup/sidebar and background script
 */
export type ParameterMessage =
	| { type: "TOGGLE_PRESET"; tabId: number; presetId: string }
	| { type: "APPLY_PRESET"; tabId: number; presetId: string }
	| { type: "REMOVE_PRESET"; tabId: number; presetId: string }
	| { type: "GET_ACTIVE_PRESETS"; tabId: number }
	| { type: "PRESETS_UPDATED" };

/**
 * Response types for parameter messages
 */
export interface ParameterMessageResponse {
	success: boolean;
	data?: unknown;
	error?: string;
}

/**
 * Helper function to generate a unique ID
 */
export function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new empty parameter with default values
 */
export function createEmptyParameter(type: ParameterType = "queryParam"): Parameter {
	return {
		id: generateId(),
		type,
		key: "",
		value: "",
	};
}

/**
 * Create a new empty preset with default values
 */
export function createEmptyPreset(): Preset {
	return {
		id: generateId(),
		name: "",
		parameters: [],
		createdAt: Date.now(),
		updatedAt: Date.now(),
	};
}

