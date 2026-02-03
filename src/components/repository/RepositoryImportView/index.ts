/**
 * RepositoryImportView Component
 *
 * A view for importing presets from configured repository sources.
 * Uses the Enhanced Component pattern with HOC + logic split.
 */
import { connectWithProps } from "@/utils/connect";

import { createRepositoryImportViewLogic } from "./logic";
import type { RepositoryImportViewLogic, RepositoryImportViewProps, ViewState } from "./logic";
import { RepositoryImportViewUI } from "./ui";

// ============================================================================
// Connected Component
// ============================================================================

export const RepositoryImportView = connectWithProps<
	RepositoryImportViewLogic,
	RepositoryImportViewProps
>(RepositoryImportViewUI, createRepositoryImportViewLogic);

// ============================================================================
// Type Exports
// ============================================================================

export type { RepositoryImportViewLogic, RepositoryImportViewProps, ViewState };
