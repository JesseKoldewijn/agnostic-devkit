/**
 * ShareImport component - Connected via HOC pattern
 * Wires the logic factory to the UI component
 */
import { connectWithProps } from "@/utils/connect";

import { createShareImportLogic } from "./logic";
import type { ShareImportProps } from "./logic";
import { ShareImportUI } from "./ui";

/**
 * ShareImport component for importing presets from shared URLs
 * Uses the Enhanced Component pattern with HOC connection
 */
export const ShareImport = connectWithProps<
	ReturnType<typeof createShareImportLogic>,
	ShareImportProps
>(ShareImportUI, createShareImportLogic);

// Re-export types for external use
export type { ShareImportLogic, ShareImportProps } from "./logic";
