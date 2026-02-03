/**
 * Export component - Connected via HOC pattern
 * Wires the logic factory to the UI component
 */
import { connectWithProps } from "@/utils/connect";

import { createExportLogic } from "./logic";
import type { ExportProps } from "./logic";
import { ExportUI } from "./ui";

/**
 * Export component for selecting and exporting presets
 * Uses the Enhanced Component pattern with HOC connection
 */
export const Export = connectWithProps<ReturnType<typeof createExportLogic>, ExportProps>(
	ExportUI,
	createExportLogic
);

// Re-export types for external use
export type { ExportLogic, ExportProps } from "./logic";
