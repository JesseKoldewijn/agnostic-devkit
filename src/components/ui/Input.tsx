import type { Component, JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "@/utils/cn";
import { Label } from "./Label";

interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	containerClass?: string;
	required?: boolean;
}

export const Input: Component<InputProps> = (props) => {
	const [local, others] = splitProps(props, ["class", "label", "containerClass", "required"]);

	return (
		<div class={cn("flex flex-col", local.containerClass)}>
			{local.label && <Label required={local.required}>{local.label}</Label>}
			<input
				{...others}
				required={local.required}
				class={cn(
					"w-full rounded-xl border-2 border-border bg-background px-4 py-2 font-bold text-[13px] text-foreground transition-all placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50",
					local.class
				)}
			/>
		</div>
	);
};
