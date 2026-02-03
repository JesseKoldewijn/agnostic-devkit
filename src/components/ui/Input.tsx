import type { Component, JSX } from "solid-js";
import { createUniqueId, splitProps } from "solid-js";

import { cn } from "@/utils/cn";

import { Label } from "./Label";

interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	containerClass?: string;
	required?: boolean;
}

export const Input: Component<InputProps> = (props) => {
	const [local, others] = splitProps(props, ["class", "label", "containerClass", "required", "id"]);
	const inputId = local.id ?? createUniqueId();

	return (
		<div class={cn("flex flex-col", local.containerClass)}>
			{local.label && (
				<Label for={inputId} required={local.required}>
					{local.label}
				</Label>
			)}
			<input
				{...others}
				id={inputId}
				required={local.required}
				class={cn(
					"border-border bg-background text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:ring-primary/10 w-full rounded-xl border-2 px-4 py-2 text-[13px] font-bold transition-all focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
					local.class
				)}
			/>
		</div>
	);
};
