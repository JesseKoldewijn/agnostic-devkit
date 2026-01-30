/**
 * RepositoryImportView - View for importing presets from configured repository sources
 * Refactored to use smaller, focused sub-components with signal-based reactivity
 */
import type { Component } from "solid-js";
import { Match, Switch, createMemo, createSignal, onMount } from "solid-js";

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
import { cn } from "@/utils/cn";

import {
	ErrorState,
	FetchPromptState,
	InvalidFilesState,
	LoadingState,
	NoFilesFoundState,
	NoSourcesState,
	RepositoryImportHeader,
	RepositoryImportPresetList,
	RepositoryImportSourceSelector,
} from "./repository-import";
import type { PresetWithMeta, SourceWithProvider } from "./repository-import/types";

interface RepositoryImportViewProps {
	onCancel: () => void;
	onImport: (presets: Preset[]) => void;
}

export const RepositoryImportView: Component<RepositoryImportViewProps> = (props) => {
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
	type ViewState =
		| "no-sources"
		| "loading"
		| "fetch-prompt"
		| "no-files"
		| "invalid-files"
		| "presets"
		| "error";

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

	// ========== Provider Logic ==========

	const getProviderForSource = (
		source: RepositorySource,
		providerInstance?: ProviderInstance
	): RepositoryProvider | null => {
		if (providerInstance) return GitHubProvider;
		if (GitHubProvider.validateUrl(source.url)) return GitHubProvider;
		return UrlProvider;
	};

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

	const handleFetch = async () => {
		const sourceId = selectedSourceId();
		const sourceData = sources().find((s) => s.source.id === sourceId);
		if (!sourceData) return;
		await fetchFromSource(sourceData);
	};

	const handleSourceChange = async (id: string) => {
		setSelectedSourceId(id);
		setFetchResult(null);
		// Auto-fetch when source changes
		const sourceData = sources().find((s) => s.source.id === id);
		if (sourceData) {
			await fetchFromSource(sourceData);
		}
	};

	const togglePresetSelection = (presetKey: string) => {
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

	const togglePresetExpanded = (presetKey: string) => {
		setExpandedPresetId(expandedPresetId() === presetKey ? null : presetKey);
	};

	const selectAllPresets = () => {
		const allKeys = new Set(allPresets().map((p) => p.presetKey));
		setSelectedPresets(allKeys);
	};

	const clearSelection = () => {
		setSelectedPresets(new Set<string>());
	};

	const handleImport = () => {
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

	// ========== Render ==========

	return (
		<div class={cn("flex h-full flex-col")} data-testid="repository-import-view">
			{/* Header */}
			<div class={cn("mb-4 flex flex-col space-y-4")}>
				<RepositoryImportHeader onCancel={props.onCancel} />

				{/* Source selector - only show when we have sources */}
				<Switch>
					<Match when={!hasNoSources()}>
						<RepositoryImportSourceSelector
							sources={sources}
							selectedSourceId={selectedSourceId}
							onSourceChange={handleSourceChange}
							isLoading={isLoading}
							onFetch={handleFetch}
							showImportControls={hasValidFiles}
							selectedCount={selectedPresetCount}
							totalCount={totalPresetCount}
							onSelectAll={selectAllPresets}
							onClearSelection={clearSelection}
							onImport={handleImport}
						/>
					</Match>
				</Switch>
			</div>

			{/* Content area - shows different states */}
			<Switch>
				<Match when={viewState() === "no-sources"}>
					<NoSourcesState onCancel={props.onCancel} />
				</Match>
				<Match when={viewState() === "error"}>
					<ErrorState error={fetchResult()?.error || "Unknown error"} />
				</Match>
				<Match when={viewState() === "loading"}>
					<LoadingState />
				</Match>
				<Match when={viewState() === "fetch-prompt"}>
					<FetchPromptState />
				</Match>
				<Match when={viewState() === "no-files"}>
					<NoFilesFoundState />
				</Match>
				<Match when={viewState() === "invalid-files"}>
					<InvalidFilesState fetchResult={fetchResult} />
				</Match>
				<Match when={viewState() === "presets"}>
					<RepositoryImportPresetList
						presets={allPresets}
						selectedPresets={selectedPresets}
						expandedPresetId={expandedPresetId}
						onTogglePreset={togglePresetSelection}
						onToggleExpanded={togglePresetExpanded}
					/>
				</Match>
			</Switch>
		</div>
	);
};
