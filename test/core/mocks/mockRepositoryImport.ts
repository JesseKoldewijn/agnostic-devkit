/**
 * Mock builder for RepositoryImportView logic
 */
import type { Accessor } from "solid-js";

import { vi } from "vitest";

import type { PresetWithMeta, SourceWithProvider } from "@/components/repository/import/types";
import type { Preset } from "@/logic/parameters";
import type { FetchResult } from "@/logic/repository/types";

export type ViewState =
	| "no-sources"
	| "loading"
	| "fetch-prompt"
	| "no-files"
	| "invalid-files"
	| "presets"
	| "error";

export interface RepositoryImportViewLogic {
	// Reactive getters
	sources: Accessor<SourceWithProvider[]>;
	selectedSourceId: Accessor<string>;
	isLoading: Accessor<boolean>;
	fetchResult: Accessor<FetchResult | null>;
	selectedPresets: Accessor<Set<string>>;
	expandedPresetId: Accessor<string | null>;
	allPresets: Accessor<PresetWithMeta[]>;
	viewState: Accessor<ViewState>;
	totalPresetCount: Accessor<number>;
	selectedPresetCount: Accessor<number>;
	hasNoSources: Accessor<boolean>;
	hasValidFiles: Accessor<boolean>;

	// External props (passed through)
	onCancel: () => void;

	// Callbacks
	onSourceChange: (id: string) => Promise<void>;
	onFetch: () => Promise<void>;
	onTogglePresetSelection: (key: string) => void;
	onTogglePresetExpanded: (key: string) => void;
	onSelectAll: () => void;
	onClearSelection: () => void;
	onImportPresets: () => void;
}

export interface RepositoryImportViewProps {
	onCancel: () => void;
	onImport: (presets: Preset[]) => void;
}

/**
 * Create a mock RepositoryImportViewLogic for testing UI components
 */
export function createMockRepositoryImportViewLogic(
	overrides: Partial<{
		sources: SourceWithProvider[];
		selectedSourceId: string;
		isLoading: boolean;
		fetchResult: FetchResult | null;
		selectedPresets: Set<string>;
		expandedPresetId: string | null;
		allPresets: PresetWithMeta[];
		viewState: ViewState;
		totalPresetCount: number;
		selectedPresetCount: number;
		hasNoSources: boolean;
		hasValidFiles: boolean;
		onSourceChange: (id: string) => Promise<void>;
		onFetch: () => Promise<void>;
		onTogglePresetSelection: (key: string) => void;
		onTogglePresetExpanded: (key: string) => void;
		onSelectAll: () => void;
		onClearSelection: () => void;
		onCancel: () => void;
		onImportPresets: () => void;
	}> = {}
): RepositoryImportViewLogic {
	const {
		sources = [],
		selectedSourceId = "",
		isLoading = false,
		fetchResult = null,
		selectedPresets = new Set<string>(),
		expandedPresetId = null,
		allPresets = [],
		viewState = "fetch-prompt",
		totalPresetCount = 0,
		selectedPresetCount = 0,
		hasNoSources = false,
		hasValidFiles = false,
		onSourceChange = vi.fn().mockResolvedValue(undefined),
		onFetch = vi.fn().mockResolvedValue(undefined),
		onTogglePresetSelection = vi.fn(),
		onTogglePresetExpanded = vi.fn(),
		onSelectAll = vi.fn(),
		onClearSelection = vi.fn(),
		onCancel = vi.fn(),
		onImportPresets = vi.fn(),
	} = overrides;

	return {
		sources: () => sources,
		selectedSourceId: () => selectedSourceId,
		isLoading: () => isLoading,
		fetchResult: () => fetchResult,
		selectedPresets: () => selectedPresets,
		expandedPresetId: () => expandedPresetId,
		allPresets: () => allPresets,
		viewState: () => viewState,
		totalPresetCount: () => totalPresetCount,
		selectedPresetCount: () => selectedPresetCount,
		hasNoSources: () => hasNoSources,
		hasValidFiles: () => hasValidFiles,
		onSourceChange,
		onFetch,
		onTogglePresetSelection,
		onTogglePresetExpanded,
		onSelectAll,
		onClearSelection,
		onCancel,
		onImportPresets,
	};
}
