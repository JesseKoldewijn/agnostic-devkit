import type { Component, JSX } from "solid-js";
import { createUniqueId, splitProps } from "solid-js";

import { cn } from "@/utils/cn";

import { Label } from "./Label";

interface TextareaProps extends JSX.TextareaHTMLAttributes<HTMLTextAreaElement> {
	label?: string;
	containerClass?: string;
}

export const Textarea: Component<TextareaProps> = (props) => {
	const [local, others] = splitProps(props, ["class", "label", "containerClass", "required", "id"]);
	const textareaId = local.id ?? createUniqueId();

	return (
		<div class={cn("flex flex-col", local.containerClass)}>
			{local.label && (
				<Label for={textareaId} required={local.required as boolean}>
					{local.label}
				</Label>
			)}
			<textarea
				{...others}
				id={textareaId}
				required={local.required as boolean}
				class={cn(
					"border-border bg-background text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:ring-primary/10 w-full resize-none rounded-xl border-2 px-3 py-2 text-sm font-bold transition-all focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
					local.class
				)}
			/>
		</div>
	);
};
