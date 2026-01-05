import type { Component, JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "@/utils/cn";

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline" | "link";
	size?: "xs" | "sm" | "md" | "lg" | "icon";
}

export const Button: Component<ButtonProps> = (props) => {
	const [local, others] = splitProps(props, ["variant", "size", "class", "children"]);

	const variantStyles = {
		destructive:
			"bg-destructive text-destructive-foreground hover:brightness-110 shadow-sm active:scale-95",
		ghost:
			"bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95",
		link: "text-primary underline-offset-4 hover:underline active:scale-95",
		outline: "bg-transparent border-2 border-border text-foreground hover:bg-muted active:scale-95",
		primary: "bg-primary text-primary-foreground hover:brightness-110 shadow-sm active:scale-95",
		secondary: "bg-secondary text-secondary-foreground hover:brightness-105 active:scale-95",
	};

	const sizeStyles = {
		icon: "p-2",
		lg: "px-8 py-3 text-base font-bold",
		md: "px-5 py-2 text-sm font-bold",
		sm: "px-4 py-1.5 text-xs font-bold",
		xs: "px-3 py-1 text-[10px] font-black uppercase tracking-widest",
	};

	const baseStyles =
		"inline-flex items-center justify-center rounded-lg transition-all focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

	return (
		<button
			{...others}
			class={cn(
				baseStyles,
				variantStyles[local.variant ?? "primary"],
				sizeStyles[local.size ?? "md"],
				local.class
			)}
		>
			{local.children}
		</button>
	);
};
