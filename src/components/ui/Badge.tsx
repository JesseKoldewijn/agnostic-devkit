import type { Component, JSX } from "solid-js";
import { splitProps } from "solid-js";

import { cn } from "@/utils/cn";

interface BadgeProps extends JSX.HTMLAttributes<HTMLDivElement> {
	variant?: "default" | "secondary" | "outline" | "destructive" | "success";
}

export const Badge: Component<BadgeProps> = (props) => {
	const [local, others] = splitProps(props, ["variant", "class", "children"]);

	const variantStyles = {
		default: "bg-primary text-primary-foreground border-transparent shadow-sm",
		destructive: "bg-destructive text-destructive-foreground border-transparent",
		outline: "bg-foreground/5 text-foreground/70 border-foreground/10 hover:bg-foreground/10",
		secondary: "bg-secondary text-secondary-foreground border-transparent",
		success: "bg-emerald-500 text-white border-transparent",
	};

	return (
		<div
			{...others}
			class={cn(
				"inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black tracking-widest uppercase transition-colors",
				variantStyles[local.variant ?? "default"],
				local.class
			)}
		>
			{local.children}
		</div>
	);
};
