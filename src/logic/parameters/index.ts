/**
 * Parameters module - exports all types and functions for parameter management
 */

// Parameter Applicator
export {
	applyPreset,
	getParameterTypeIcon,
	getParameterTypeLabel,
	removePreset,
	syncParameter,
	verifyParameter,
	verifyPreset,
} from "./parameterApplicator";
// Preset Manager (high-level operations)
export {
	createPreset,
	duplicatePreset,
	exportPresets,
	getPresetsWithActiveState,
	importPresets,
	migrateParameter,
	migratePresetsIfNeeded,
	togglePreset,
	updatePreset,
	updatePreset as updatePresetData,
} from "./presetManager";

// Storage
export {
	addActivePresetToTab,
	cleanupTabState,
	deletePreset,
	getActivePresetsForTab,
	getPresets,
	onPresetsChanged,
	onTabPresetStatesChanged,
} from "./storage";
// Types
export type {
	LocalStorageSchema,
	Parameter,
	ParameterMessage,
	ParameterMessageResponse,
	ParameterType,
	Preset,
	PrimitiveType,
	SyncStorageSchema,
	TabPresetState,
} from "./types";
export { createEmptyParameter } from "./types";
