/**
 * Parameters module - exports all types and functions for parameter management
 */

// Types
export type {
	ParameterType,
	Parameter,
	Preset,
	TabPresetState,
	SyncStorageSchema,
	LocalStorageSchema,
	ParameterMessage,
	ParameterMessageResponse,
} from "./types";

export {
	generateId,
	createEmptyParameter,
	createEmptyPreset,
} from "./types";

// Storage
export {
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
} from "./storage";

// Parameter Applicator
export {
	applyParameter,
	removeParameter as removeParameterFromTab,
	applyPreset,
	removePreset,
	getParameterTypeLabel,
	getParameterTypeIcon,
	verifyParameter,
	verifyPreset,
	syncParameter,
} from "./parameterApplicator";

// Preset Manager (high-level operations)
export {
	togglePreset,
	activatePreset,
	deactivatePreset,
	getPresetsWithActiveState,
	createPreset,
	updatePreset as updatePresetData,
	deletePreset as deletePresetData,
	addParameterToPreset,
	updateParameterInPreset,
	removeParameterFromPreset,
	duplicatePreset,
	reorderParameters,
	exportPresets,
	importPresets,
} from "./presetManager";

