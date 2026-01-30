/**
 * Single parameter card component for the preset form
 */
import type { Component } from "solid-js";
import { Show } from "solid-js";

import type { Parameter, PrimitiveType } from "@/logic/parameters";
import { cn } from "@/utils/cn";

import { Badge } from "../../ui/Badge";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { Input } from "../../ui/Input";
import { Label } from "../../ui/Label";
import { Select } from "../../ui/Select";

export interface FormParameterProps {
	paramId: string;
	index: number;
	paramData: Parameter;
	primitiveType: PrimitiveType;
	boolValue: boolean;
	onRemove: (paramId: string) => void;
	onPrimitiveTypeChange: (paramId: string, type: PrimitiveType) => void;
	onBoolValueChange: (paramId: string, value: boolean) => void;
}

export const FormParameter: Component<FormParameterProps> = (props) => {
	return (
		<Card
			class={cn("group border-border/40 relative p-4 shadow-sm")}
			data-testid={`parameter-item-${props.index}`}
		>
			{/* Header with badge and delete button */}
			<div class={cn("mb-3 flex items-center justify-between")}>
				<Badge
					variant="default"
					class={cn("flex size-5 items-center justify-center rounded-sm p-0! text-[9px]!")}
				>
					{props.index + 1}
				</Badge>
				<Button
					variant="ghost-destructive"
					size="icon"
					type="button"
					onClick={() => props.onRemove(props.paramId)}
					class={cn("opacity-0 transition-opacity group-hover:opacity-100")}
					aria-label="Remove this parameter"
					data-testid="remove-parameter-button"
				>
					<svg
						class={cn("size-4")}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						/>
					</svg>
				</Button>
			</div>

			<div class={cn("grid grid-cols-2 gap-3")}>
				{/* Row 1: Storage Type and Value Type */}
				<div class={cn("flex flex-col gap-1.5")}>
					<Label class={cn("text-[10px]! font-black tracking-widest uppercase opacity-70")}>
						Storage Type
					</Label>
					<Select
						name={`param-${props.paramId}-type`}
						ref={(el) => {
							if (el) {
								const paramType = props.paramData.type;
								queueMicrotask(() => {
									el.value = paramType;
								});
							}
						}}
						class={cn("h-9 rounded-lg px-3! py-1.5! text-[12px]! uppercase")}
						data-testid="parameter-type-select"
					>
						<option value="queryParam">URL Query</option>
						<option value="cookie">Cookie</option>
						<option value="localStorage">Storage</option>
					</Select>
				</div>

				<div class={cn("flex flex-col gap-1.5")}>
					<Label class={cn("text-[10px]! font-black tracking-widest uppercase opacity-70")}>
						Value Type
					</Label>
					<Select
						name={`param-${props.paramId}-primitiveType`}
						ref={(el) => {
							if (el) {
								const primitiveType = props.paramData.primitiveType ?? "string";
								queueMicrotask(() => {
									el.value = primitiveType;
								});
							}
						}}
						onChange={(e) => {
							props.onPrimitiveTypeChange(props.paramId, e.currentTarget.value as PrimitiveType);
						}}
						class={cn("h-9 rounded-lg px-3! py-1.5! text-[12px]! uppercase")}
						data-testid="parameter-primitive-type-select"
					>
						<option value="string">String</option>
						<option value="boolean">Boolean</option>
					</Select>
				</div>

				{/* Row 2: Key and Value */}
				<Input
					label="Key"
					name={`param-${props.paramId}-key`}
					placeholder="variable_name"
					ref={(el) => {
						if (el) {
							el.value = props.paramData.key;
						}
					}}
					class={cn("h-9 rounded-lg px-3! py-1.5! font-mono text-[12px]!")}
					data-testid="parameter-key-input"
				/>

				<Show
					when={props.primitiveType === "boolean"}
					fallback={
						<Input
							label="Value"
							name={`param-${props.paramId}-value`}
							placeholder="value"
							ref={(el) => {
								if (el) {
									el.value = props.paramData.value;
								}
							}}
							class={cn("h-9 rounded-lg px-3! py-1.5! font-mono text-[12px]!")}
							data-testid="parameter-value-input"
						/>
					}
				>
					{/* Boolean value toggle */}
					<div class={cn("flex min-w-0 flex-col")}>
						<Label>Value</Label>
						<input
							type="hidden"
							name={`param-${props.paramId}-value`}
							value={props.boolValue ? "true" : "false"}
						/>
						<button
							type="button"
							class={cn(
								"flex h-9 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 text-[13px] font-bold transition-colors",
								props.boolValue
									? "border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400"
									: "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400"
							)}
							onClick={() => props.onBoolValueChange(props.paramId, !props.boolValue)}
							data-testid="parameter-value-toggle"
						>
							<Show when={props.boolValue}>
								<span data-testid="parameter-value-true">True</span>
							</Show>
							<Show when={!props.boolValue}>
								<span data-testid="parameter-value-false">False</span>
							</Show>
						</button>
					</div>
				</Show>

				{/* Row 3: Notes */}
				<Input
					label="Notes (Optional)"
					name={`param-${props.paramId}-description`}
					placeholder="How is this variable used?"
					ref={(el) => {
						if (el) {
							el.value = props.paramData.description ?? "";
						}
					}}
					containerClass={cn("col-span-2")}
					class={cn(
						"border-border/30 bg-muted/10 h-8 rounded-lg px-3! py-1.5! text-[10px]! font-bold"
					)}
					data-testid="parameter-description-input"
				/>
			</div>
		</Card>
	);
};
