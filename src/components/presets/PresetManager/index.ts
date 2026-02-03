/**
 * PresetManager Component - Connected via HOC pattern
 * Wires the logic factory to the UI component
 */
import { connectWithProps } from "@/utils/connect";

import { createPresetManagerLogic } from "./logic";
import type { PresetManagerLogic, PresetManagerProps } from "./logic";
import { PresetManagerUI } from "./ui";

/**
 * PresetManager - Full CRUD interface for managing presets and their parameters
 * This is the main orchestrator component that manages state and delegates to sub-components
 * Uses the Enhanced Component pattern with HOC connection
 */
export const PresetManager = connectWithProps<PresetManagerLogic, PresetManagerProps>(
	PresetManagerUI,
	createPresetManagerLogic
);

// Re-export types for external use
export type { PresetManagerLogic, PresetManagerProps } from "./logic";
