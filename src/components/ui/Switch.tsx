import type { Component, JSX } from "solid-js";
import { splitProps } from "solid-js";

import { cn } from "@/utils/cn";

interface SwitchProps extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "type"> {
	checked: boolean;
	onCheckedChange?: (checked: boolean) => void;
	label?: string;
}

export const Switch: Component<SwitchProps> = (props) => {
	const [local, others] = splitProps(props, ["checked", "onCheckedChange", "label", "class"]);

	return (
		<label
			class={cn("group relative inline-flex cursor-pointer items-center select-none", local.class)}
		>
			<input
				type="checkbox"
				class="absolute inset-0 z-10 size-full cursor-pointer opacity-0"
				checked={local.checked}
				onChange={(e) => local.onCheckedChange?.(e.currentTarget.checked)}
				{...others}
			/>
			<div
				class={cn(
					"h-6 w-11 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
					local.checked ? "bg-primary" : "bg-muted"
				)}
			>
				<div
					class={cn(
						"bg-background pointer-events-none inline-block size-5 transform rounded-full shadow-lg ring-0 transition duration-200 ease-in-out",
						local.checked ? "translate-x-5" : "translate-x-0"
					)}
				/>
			</div>
			{local.label && (
				<span class="text-foreground/70 ml-2 text-[10px] font-black tracking-widest uppercase">
					{local.label}
				</span>
			)}
		</label>
	);
};
