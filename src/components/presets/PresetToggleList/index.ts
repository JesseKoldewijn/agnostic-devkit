/**
 * PresetToggleList Component
 *
 * A list of presets with toggle switches for the current tab.
 * Uses the Enhanced Component pattern with HOC + logic split.
 */
import { connectWithProps } from "@/utils/connect";

import { createPresetToggleListLogic } from "./logic";
import type { PresetToggleListLogic, PresetToggleListProps } from "./logic";
import { PresetToggleListUI } from "./ui";

// ============================================================================
// Connected Component
// ============================================================================

export const PresetToggleList = connectWithProps<PresetToggleListLogic, PresetToggleListProps>(
	PresetToggleListUI,
	createPresetToggleListLogic
);

// ============================================================================
// Type Exports
// ============================================================================

export type { PresetToggleListLogic, PresetToggleListProps };
