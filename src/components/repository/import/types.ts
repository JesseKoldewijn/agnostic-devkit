/**
 * Shared types for repository import components
 */
import type { Accessor, Setter } from "solid-js";

import type { z } from "zod";

import type {
	FetchResult,
	PresetsArraySchema,
	ProviderInstance,
	RepositorySource,
} from "@/logic/repository/types";

export interface SourceWithProvider {
	source: RepositorySource;
	providerInstance?: ProviderInstance;
}

export interface PresetWithMeta {
	preset: z.infer<typeof PresetsArraySchema>[number];
	filename: string;
	presetKey: string;
}

export interface RepositoryImportState {
	sources: Accessor<SourceWithProvider[]>;
	selectedSourceId: Accessor<string>;
	setSelectedSourceId: Setter<string>;
	isLoading: Accessor<boolean>;
	fetchResult: Accessor<FetchResult | null>;
	selectedPresets: Accessor<Set<string>>;
	setSelectedPresets: Setter<Set<string>>;
	expandedPresetId: Accessor<string | null>;
	setExpandedPresetId: Setter<string | null>;
}

export interface RepositoryImportActions {
	onFetch: () => Promise<void>;
	onTogglePreset: (presetKey: string) => void;
	onSelectAll: () => void;
	onClearSelection: () => void;
	onImport: () => void;
	onCancel: () => void;
}

export interface RepositoryImportComputed {
	allPresets: Accessor<PresetWithMeta[]>;
	hasValidFiles: Accessor<boolean>;
	hasOnlyInvalidFiles: Accessor<boolean>;
	hasNoFilesFound: Accessor<boolean>;
	totalPresetCount: Accessor<number>;
}
