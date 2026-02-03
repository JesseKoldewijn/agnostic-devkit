/**
 * RepositoryImportView Logic
 *
 * Pure TypeScript logic for the RepositoryImportView component.
 * Manages state for importing presets from repository sources.
 */
import type { Accessor } from "solid-js";
import { createMemo, createSignal, onMount } from "solid-js";

import type { Preset } from "@/logic/parameters";
import { GitHubProvider } from "@/logic/repository/providers/github";
import { UrlProvider } from "@/logic/repository/providers/url";
import { getSourcesWithProviders } from "@/logic/repository/storage";
import type {
	FetchResult,
	ProviderInstance,
	RepositoryProvider,
	RepositorySource,
} from "@/logic/repository/types";

import type { PresetWithMeta, SourceWithProvider } from "../import/types";

// ============================================================================
// Types
// ============================================================================

export interface RepositoryImportViewProps {
	onCancel: () => void;
	onImport: (presets: Preset[]) => void;
}

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

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the appropriate provider for a repository source
 */
function getProviderForSource(
	source: RepositorySource,
	providerInstance?: ProviderInstance
): RepositoryProvider | null {
	if (providerInstance) return GitHubProvider;
	if (GitHubProvider.validateUrl(source.url)) return GitHubProvider;
	return UrlProvider;
}

// ============================================================================
// Logic Factory
// ============================================================================

/**
 * Create the logic for RepositoryImportView component
 */
export function createRepositoryImportViewLogic(
	props: RepositoryImportViewProps
): RepositoryImportViewLogic {
	// ========== State Signals ==========
	const [sources, setSources] = createSignal<SourceWithProvider[]>([]);
	const [selectedSourceId, setSelectedSourceId] = createSignal<string>("");
	const [isLoading, setIsLoading] = createSignal(false);
	const [fetchResult, setFetchResult] = createSignal<FetchResult | null>(null);
	const [selectedPresets, setSelectedPresets] = createSignal<Set<string>>(new Set<string>());
	const [expandedPresetId, setExpandedPresetId] = createSignal<string | null>(null);

	// ========== Computed Values (Memos) ==========

	// All presets from valid files, flattened
	const allPresets = createMemo<PresetWithMeta[]>(() => {
		const result = fetchResult();
		if (!result) return [];

		const presets: PresetWithMeta[] = [];
		for (const file of result.files) {
			if (file.isValid && file.presets) {
				for (const preset of file.presets) {
					presets.push({
						preset,
						filename: file.filename,
						presetKey: `${file.filename}-${preset.name}-${preset.id || ""}`,
					});
				}
			}
		}
		return presets;
	});

	// Check conditions for view states
	const hasNoSources = createMemo(() => sources().length === 0);
	const hasValidFiles = createMemo(() => allPresets().length > 0);
	const hasOnlyInvalidFiles = createMemo(() => {
		const result = fetchResult();
		if (!result?.success) return false;
		return result.files.length > 0 && !result.files.some((f) => f.isValid);
	});
	const hasNoFilesFound = createMemo(() => {
		const result = fetchResult();
		if (!result?.success) return false;
		return result.files.length === 0;
	});
	const totalPresetCount = createMemo(() => allPresets().length);
	const selectedPresetCount = createMemo(() => selectedPresets().size);

	// View state for Switch/Match
	const viewState = createMemo<ViewState>(() => {
		if (hasNoSources()) return "no-sources";
		if (isLoading()) return "loading";
		if (fetchResult()?.error) return "error";
		if (!fetchResult()) return "fetch-prompt";
		if (hasNoFilesFound()) return "no-files";
		if (hasOnlyInvalidFiles()) return "invalid-files";
		if (hasValidFiles()) return "presets";
		return "fetch-prompt";
	});

	// ========== Actions ==========

	const fetchFromSource = async (sourceData: SourceWithProvider) => {
		setIsLoading(true);
		setFetchResult(null);
		setSelectedPresets(new Set<string>());

		try {
			const provider = getProviderForSource(sourceData.source, sourceData.providerInstance);
			if (!provider) {
				setFetchResult({
					success: false,
					files: [],
					error: "No provider available for this source",
				});
				return;
			}

			const result = await provider.fetchFiles(sourceData.source, sourceData.providerInstance);
			setFetchResult(result);

			// Auto-select all presets from valid files
			if (result.success) {
				const allPresetKeys = new Set<string>();
				for (const file of result.files) {
					if (file.isValid && file.presets) {
						for (const preset of file.presets) {
							allPresetKeys.add(`${file.filename}-${preset.name}-${preset.id || ""}`);
						}
					}
				}
				setSelectedPresets(allPresetKeys);
			}
		} catch (err) {
			setFetchResult({
				success: false,
				files: [],
				error: err instanceof Error ? err.message : "Failed to fetch files",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const onFetch = async () => {
		const sourceId = selectedSourceId();
		const sourceData = sources().find((s) => s.source.id === sourceId);
		if (!sourceData) return;
		await fetchFromSource(sourceData);
	};

	const onSourceChange = async (id: string) => {
		setSelectedSourceId(id);
		setFetchResult(null);
		// Auto-fetch when source changes
		const sourceData = sources().find((s) => s.source.id === id);
		if (sourceData) {
			await fetchFromSource(sourceData);
		}
	};

	const onTogglePresetSelection = (presetKey: string) => {
		setSelectedPresets((prev) => {
			const next = new Set(prev);
			if (next.has(presetKey)) {
				next.delete(presetKey);
			} else {
				next.add(presetKey);
			}
			return next;
		});
	};

	const onTogglePresetExpanded = (presetKey: string) => {
		setExpandedPresetId(expandedPresetId() === presetKey ? null : presetKey);
	};

	const onSelectAll = () => {
		const allKeys = new Set(allPresets().map((p) => p.presetKey));
		setSelectedPresets(allKeys);
	};

	const onClearSelection = () => {
		setSelectedPresets(new Set<string>());
	};

	const onImportPresets = () => {
		const result = fetchResult();
		if (!result?.success) return;

		const selected = selectedPresets();
		const presetsToImport: Preset[] = [];

		for (const file of result.files) {
			if (file.isValid && file.presets) {
				for (const preset of file.presets) {
					const presetKey = `${file.filename}-${preset.name}-${preset.id || ""}`;
					if (selected.has(presetKey)) {
						const presetWithId: Preset = {
							...preset,
							id: preset.id || crypto.randomUUID(),
							createdAt: preset.createdAt || Date.now(),
							updatedAt: preset.updatedAt || Date.now(),
							parameters: preset.parameters.map((p) => ({
								...p,
								id: p.id || crypto.randomUUID(),
							})),
						};
						presetsToImport.push(presetWithId);
					}
				}
			}
		}

		props.onImport(presetsToImport);
	};

	// ========== Lifecycle ==========

	onMount(async () => {
		const sourcesWithProviders = await getSourcesWithProviders();
		setSources(sourcesWithProviders);

		if (sourcesWithProviders.length > 0) {
			setSelectedSourceId(sourcesWithProviders[0].source.id);
			await fetchFromSource(sourcesWithProviders[0]);
		}
	});

	// ========== Return Logic Interface ==========

	return {
		// Reactive getters
		sources,
		selectedSourceId,
		isLoading,
		fetchResult,
		selectedPresets,
		expandedPresetId,
		allPresets,
		viewState,
		totalPresetCount,
		selectedPresetCount,
		hasNoSources,
		hasValidFiles,

		// External props (passed through)
		onCancel: props.onCancel,

		// Callbacks
		onSourceChange,
		onFetch,
		onTogglePresetSelection,
		onTogglePresetExpanded,
		onSelectAll,
		onClearSelection,
		onImportPresets,
	};
}
