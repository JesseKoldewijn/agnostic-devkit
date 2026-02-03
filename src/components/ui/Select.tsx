import type { Component, JSX } from "solid-js";
import { createUniqueId, splitProps } from "solid-js";

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
		"id",
	]);
	const selectId = local.id ?? createUniqueId();

	return (
		<div class={cn("flex flex-col", local.containerClass)}>
			{local.label && (
				<Label for={selectId} required={local.required as boolean}>
					{local.label}
				</Label>
			)}
			<div class="group relative w-full">
				<select
					{...others}
					id={selectId}
					class={cn(
						"border-border bg-background text-foreground focus:border-primary focus:ring-primary/10 flex h-11 w-full cursor-pointer appearance-none items-center justify-between rounded-xl border-2 px-4 text-[13px] font-black tracking-wider uppercase transition-all focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
						local.class
					)}
				>
					{local.children}
				</select>
				<div class="text-muted-foreground group-hover:text-foreground pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 transition-colors">
					<svg
						class="size-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
						role="img"
					>
						<title>Chevron Down</title>
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
