/**
 * PresetManager UI Component
 * Pure presentational component for the preset management interface
 */
import type { Component } from "solid-js";
import { Show } from "solid-js";

import { cn } from "@/utils/cn";

import { RepositoryImportView } from "../../repository";
import { Toast } from "../../ui/Toast";
import { EmptyStates } from "../manager/EmptyStates";
import { Export } from "../manager/Export";
import { Form } from "../manager/Form";
import { Header } from "../manager/Header";
import { Import } from "../manager/Import";
import { List } from "../manager/List";
import { ShareImport } from "../manager/ShareImport";
import type { PresetManagerLogic } from "./logic";

export const PresetManagerUI: Component<PresetManagerLogic> = (props) => {
	return (
		<div
			class={cn("relative flex min-h-0 flex-1 flex-col", props.class)}
			data-testid="preset-manager"
		>
			<Show when={props.viewMode() === "list"}>
				<div class={cn("flex min-h-0 flex-1 flex-col")} data-testid="preset-manager-list">
					<Header
						onClose={props.onClose}
						onStartCreate={props.onStartCreate}
						onStartExport={props.onStartExport}
						onStartFileImport={props.onStartFileImport}
					/>

					<EmptyStates
						isLoading={props.loading()}
						hasPresets={props.presets().length > 0}
						onStartCreate={props.onStartCreate}
					/>

					<Show when={!props.loading() && props.presets().length > 0}>
						<List
							presets={props.presets()}
							filteredPresets={props.filteredListPresets()}
							searchQuery={props.listSearchQuery}
							setSearchQuery={props.setListSearchQuery}
							expandedPresetId={props.expandedPresetId()}
							confirmDelete={props.confirmDelete()}
							onToggleExpanded={props.onToggleExpanded}
							onStartEdit={props.onStartEdit}
							onDelete={props.onDelete}
							onDuplicate={props.onDuplicate}
							onExportSingle={props.onExportSingle}
							onSetConfirmDelete={props.onSetConfirmDelete}
						/>
					</Show>
				</div>
			</Show>

			<Show when={props.viewMode() === "create" || props.viewMode() === "edit"}>
				<Form
					viewMode={props.viewMode()}
					editingPreset={props.editingPreset()}
					parameterIds={props.parameterIds()}
					saving={props.saving()}
					onSave={props.onSavePreset}
					onCancel={props.onCancelForm}
					onAddParameter={props.onAddParameter}
					onRemoveParameter={props.onRemoveParameter}
					getParameterData={props.getParameterData}
					getPrimitiveType={props.getPrimitiveType}
					onPrimitiveTypeChange={props.onPrimitiveTypeChange}
					getBoolValue={props.getBoolValue}
					onBoolValueChange={props.onBoolValueChange}
				/>
			</Show>

			<Show when={props.viewMode() === "export"}>
				<Export
					presets={props.presets()}
					selectedPresets={props.selectedPresets()}
					copySuccess={props.copySuccess()}
					onToggleSelection={props.onTogglePresetSelection}
					onSelectAll={props.onSelectAll}
					onClearSelection={props.onClearSelection}
					onExportDownload={props.onExportDownload}
					onExportUrl={props.onExportUrl}
					onCancel={props.onCancelExport}
				/>
			</Show>

			<Show when={props.viewMode() === "file-import"}>
				<Import
					onImport={props.onImportFile}
					onStartRepositoryImport={props.onStartRepositoryImport}
					onCancel={props.onCancelFileImport}
					onLoadShareUrl={props.onLoadShareUrl}
				/>
			</Show>

			<Show when={props.viewMode() === "share-import"}>
				<ShareImport
					shareImportData={props.shareImportData()}
					shareImportError={props.shareImportError()}
					expandedPresetId={props.shareImportExpandedId()}
					onToggleExpanded={props.onToggleShareImportExpanded}
					onConfirm={props.onShareImportConfirm}
					onCancel={props.onShareImportCancel}
				/>
			</Show>

			<Show when={props.viewMode() === "repository-import"}>
				<RepositoryImportView
					onCancel={props.onRepositoryImportCancel}
					onImport={props.onRepositoryImportConfirm}
				/>
			</Show>

			{/* Toast notifications */}
			<Toast
				message={props.toastMessage()}
				type={props.toastType()}
				visible={props.toastVisible()}
				onDismiss={props.onDismissToast}
				dismissible
				data-testid="preset-manager-toast"
			/>
		</div>
	);
};
