import type { Component, JSX } from "solid-js";
import { splitProps } from "solid-js";

import { cn } from "@/utils/cn";

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?:
		| "default"
		| "secondary"
		| "destructive"
		| "outline"
		| "ghost"
		| "ghost-destructive"
		| "link";
	size?: "xs" | "sm" | "md" | "lg" | "icon" | "icon-sm";
}

export const Button: Component<ButtonProps> = (props) => {
	const [local, others] = splitProps(props, ["variant", "size", "class", "children"]);

	const variantStyles = {
		default: "bg-primary text-primary-foreground hover:brightness-110 shadow-sm active:scale-95",
		destructive:
			"bg-destructive text-destructive-foreground hover:brightness-110 shadow-sm active:scale-95",
		ghost:
			"bg-transparent text-foreground/70 hover:text-foreground hover:bg-muted border border-transparent hover:border-border/50 active:scale-95",
		"ghost-destructive":
			"bg-transparent text-destructive/70 hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/30 active:scale-95",
		link: "text-primary underline-offset-4 hover:underline active:scale-95",
		outline: "bg-transparent border-2 border-border text-foreground hover:bg-muted active:scale-95",
		secondary:
			"bg-secondary text-secondary-foreground hover:brightness-105 border border-border/40 shadow-sm active:scale-95",
	};

	const sizeStyles = {
		icon: "h-8 w-8 p-0",
		"icon-sm": "h-6 w-6 p-0",
		lg: "h-11 px-8 text-base font-bold",
		md: "h-10 px-5 text-sm font-bold",
		sm: "h-8 px-4 text-xs font-bold",
		xs: "h-6 px-2 text-[10px] font-black uppercase tracking-widest",
	};

	const baseStyles =
		"inline-flex items-center justify-center gap-1.5 rounded-lg transition-all focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

	return (
		<button
			{...others}
			class={cn(
				baseStyles,
				variantStyles[local.variant ?? "default"],
				sizeStyles[local.size ?? "md"],
				local.class
			)}
		>
			{local.children}
		</button>
	);
};
