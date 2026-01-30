/**
 * Form view component for creating and editing presets
 */
import type { Component } from "solid-js";
import { For, Show } from "solid-js";

import type { Parameter, Preset, PrimitiveType } from "@/logic/parameters";
import { cn } from "@/utils/cn";

import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { Input } from "../../ui/Input";
import { Label } from "../../ui/Label";
import { Separator } from "../../ui/Separator";
import { Textarea } from "../../ui/Textarea";
import { FormParameter } from "./FormParameter";
import type { ViewMode } from "./types";

export interface FormProps {
	viewMode: ViewMode;
	editingPreset: Preset | null;
	parameterIds: string[];
	saving: boolean;
	onSave: (e?: Event) => Promise<void>;
	onCancel: () => void;
	onAddParameter: () => void;
	onRemoveParameter: (paramId: string) => void;
	getParameterData: (paramId: string) => Parameter;
	getPrimitiveType: (paramId: string) => PrimitiveType;
	onPrimitiveTypeChange: (paramId: string, type: PrimitiveType) => void;
	getBoolValue: (paramId: string) => boolean;
	onBoolValueChange: (paramId: string, value: boolean) => void;
}

export const Form: Component<FormProps> = (props) => {
	const preset = () => props.editingPreset;
	const defaultName = () => preset()?.name ?? "";
	const defaultDescription = () => preset()?.description ?? "";

	return (
		<form
			data-preset-form
			data-testid="preset-form"
			class={cn("flex h-full flex-col")}
			onSubmit={props.onSave}
		>
			<div class={cn("mb-4 flex flex-col space-y-4")}>
				<div class={cn("flex items-center justify-between")}>
					<h2
						class={cn(
							"text-foreground text-[10px] font-black tracking-[0.2em] uppercase opacity-50"
						)}
						data-testid="preset-form-heading"
					>
						{props.viewMode === "create" ? "Create New Preset" : "Edit Preset Details"}
					</h2>
					<Button
						variant="ghost"
						size="xs"
						type="button"
						onClick={props.onCancel}
						data-testid="cancel-form-button"
						aria-label="Cancel and go back"
					>
						<svg
							class={cn("size-3.5")}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
						<span>Cancel</span>
					</Button>
				</div>

				<div
					class={cn(
						"border-border/50 bg-muted/30 flex items-center justify-between rounded-xl border p-2.5"
					)}
				>
					<p class={cn("text-foreground/40 ml-2 text-[10px] font-black tracking-widest uppercase")}>
						Preset Configuration
					</p>
					<Button type="submit" size="sm" disabled={props.saving} data-testid="save-preset-button">
						<Show
							when={props.saving}
							fallback={props.viewMode === "create" ? "Save Preset" : "Update Preset"}
						>
							Saving...
						</Show>
					</Button>
				</div>
			</div>

			<div class={cn("-mr-1 flex-1 space-y-6 overflow-y-auto pr-1")}>
				{/* Preset name & Description */}
				<div class={cn("space-y-4 px-1")}>
					<Input
						label="Name"
						name="preset-name"
						placeholder="e.g. Production Config"
						required
						ref={(el) => {
							if (el && defaultName()) {
								el.value = defaultName();
							}
						}}
						data-testid="preset-name-input"
					/>

					<Textarea
						label="Description (Optional)"
						name="preset-description"
						placeholder="Briefly describe what these parameters do..."
						rows="2"
						ref={(el) => {
							if (el && defaultDescription()) {
								el.value = defaultDescription();
							}
						}}
						data-testid="preset-description-input"
					/>
				</div>

				<Separator class={cn("opacity-50")} />

				{/* Parameters section */}
				<div class={cn("space-y-4")}>
					<div class={cn("flex items-center justify-between px-1")}>
						<Label class={cn("mb-0 text-[10px]! font-black tracking-[0.2em] uppercase opacity-50")}>
							Parameters ({props.parameterIds.length})
						</Label>
						<Button
							type="button"
							variant="ghost"
							size="xs"
							onClick={props.onAddParameter}
							data-testid="add-parameter-button"
						>
							+ Add Variable
						</Button>
					</div>

					<Show when={props.parameterIds.length === 0}>
						<Card
							class={cn(
								"border-border/30 bg-muted/10 flex flex-col items-center justify-center border-dashed px-4 py-10"
							)}
							data-testid="no-parameters-message"
						>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={props.onAddParameter}
								data-testid="add-first-parameter-button"
							>
								Add First Parameter
							</Button>
						</Card>
					</Show>

					<div class={cn("space-y-4")} data-testid="parameters-list">
						<For each={props.parameterIds}>
							{(paramId, index) => (
								<FormParameter
									paramId={paramId}
									index={index()}
									paramData={props.getParameterData(paramId)}
									primitiveType={props.getPrimitiveType(paramId)}
									boolValue={props.getBoolValue(paramId)}
									onRemove={props.onRemoveParameter}
									onPrimitiveTypeChange={props.onPrimitiveTypeChange}
									onBoolValueChange={props.onBoolValueChange}
								/>
							)}
						</For>
					</div>
				</div>
			</div>
		</form>
	);
};
