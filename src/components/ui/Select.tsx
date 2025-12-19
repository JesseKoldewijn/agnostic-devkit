import { Component, JSX, splitProps } from "solid-js";
import { cn } from "@/utils/cn";
import { Label } from "./Label";

interface SelectProps extends JSX.SelectHTMLAttributes<HTMLSelectElement> {
	label?: string;
	containerClass?: string;
}

export const Select: Component<SelectProps> = (props) => {
	const [local, others] = splitProps(props, [
		"class",
		"children",
		"label",
		"containerClass",
		"required",
	]);

	return (
		<div class={cn("flex flex-col", local.containerClass)}>
			{local.label && <Label required={local.required as boolean}>{local.label}</Label>}
			<div class="group relative w-full">
				<select
					{...others}
					class={cn(
						"flex h-11 w-full cursor-pointer appearance-none items-center justify-between rounded-xl border-2 border-border bg-background px-4 font-black text-[13px] text-foreground uppercase tracking-wider transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50",
						local.class
					)}
				>
					{local.children}
				</select>
				<div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground transition-colors group-hover:text-foreground">
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="3"
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</div>
			</div>
		</div>
	);
};
