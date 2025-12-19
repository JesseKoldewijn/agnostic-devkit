import { Component, JSX, splitProps } from "solid-js";
import { cn } from "@/utils/cn";
import { Label } from "./Label";

interface TextareaProps extends JSX.TextareaHTMLAttributes<HTMLTextAreaElement> {
	label?: string;
	containerClass?: string;
}

export const Textarea: Component<TextareaProps> = (props) => {
	const [local, others] = splitProps(props, ["class", "label", "containerClass", "required"]);

	return (
		<div class={cn("flex flex-col", local.containerClass)}>
			{local.label && <Label required={local.required as boolean}>{local.label}</Label>}
			<textarea
				{...others}
				required={local.required as boolean}
				class={cn(
					"w-full resize-none rounded-xl border-2 border-border bg-background px-3 py-2 font-bold text-foreground text-sm transition-all placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50",
					local.class
				)}
			/>
		</div>
	);
};
