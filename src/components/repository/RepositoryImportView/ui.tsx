/**
 * RepositoryImportView UI Component
 *
 * Presentational component that renders the repository import view.
 * Receives all data and callbacks via props from the logic layer.
 */
import type { Component } from "solid-js";
import { Match, Switch } from "solid-js";

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
} from "../import";
import type { RepositoryImportViewLogic } from "./logic";

// ============================================================================
// UI Component
// ============================================================================

export const RepositoryImportViewUI: Component<RepositoryImportViewLogic> = (props) => {
	return (
		<div class={cn("flex h-full flex-col")} data-testid="repository-import-view">
			{/* Header */}
			<div class={cn("mb-4 flex flex-col space-y-4")}>
				<RepositoryImportHeader onCancel={props.onCancel} />

				{/* Source selector - only show when we have sources */}
				<Switch>
					<Match when={!props.hasNoSources()}>
						<RepositoryImportSourceSelector
							sources={props.sources}
							selectedSourceId={props.selectedSourceId}
							onSourceChange={props.onSourceChange}
							isLoading={props.isLoading}
							onFetch={props.onFetch}
							showImportControls={props.hasValidFiles}
							selectedCount={props.selectedPresetCount}
							totalCount={props.totalPresetCount}
							onSelectAll={props.onSelectAll}
							onClearSelection={props.onClearSelection}
							onImport={props.onImportPresets}
						/>
					</Match>
				</Switch>
			</div>

			{/* Content area - shows different states */}
			<Switch>
				<Match when={props.viewState() === "no-sources"}>
					<NoSourcesState onCancel={props.onCancel} />
				</Match>
				<Match when={props.viewState() === "error"}>
					<ErrorState error={props.fetchResult()?.error || "Unknown error"} />
				</Match>
				<Match when={props.viewState() === "loading"}>
					<LoadingState />
				</Match>
				<Match when={props.viewState() === "fetch-prompt"}>
					<FetchPromptState />
				</Match>
				<Match when={props.viewState() === "no-files"}>
					<NoFilesFoundState />
				</Match>
				<Match when={props.viewState() === "invalid-files"}>
					<InvalidFilesState fetchResult={props.fetchResult} />
				</Match>
				<Match when={props.viewState() === "presets"}>
					<RepositoryImportPresetList
						presets={props.allPresets}
						selectedPresets={props.selectedPresets}
						expandedPresetId={props.expandedPresetId}
						onTogglePreset={props.onTogglePresetSelection}
						onToggleExpanded={props.onTogglePresetExpanded}
					/>
				</Match>
			</Switch>
		</div>
	);
};
