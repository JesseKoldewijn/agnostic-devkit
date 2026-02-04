import type { Component, JSX } from "solid-js";
import { splitProps } from "solid-js";

import { cn } from "@/utils/cn";

interface LayoutProps extends JSX.HTMLAttributes<HTMLDivElement> {
	children: JSX.Element;
	class?: string;
	/**
	 * When true, uses a constrained viewport layout (h-dvh flex flex-col overflow-hidden)
	 * suitable for popup and sidepanel views where content should not overflow the viewport.
	 * The children should handle their own scrolling via flex-1 min-h-0 overflow-y-auto.
	 */
	constrained?: boolean;
}

export const Layout: Component<LayoutProps> = (props) => {
	const [local, others] = splitProps(props, ["children", "class", "constrained"]);
	return (
		<div
			{...others}
			class={cn(
				"bg-background text-foreground selection:bg-primary/10 w-full",
				local.constrained ? "flex h-dvh flex-col overflow-hidden" : "min-h-screen p-4",
				local.class
			)}
		>
			<div
				class={cn("mx-auto w-full max-w-4xl", local.constrained && "flex min-h-0 flex-1 flex-col")}
			>
				{local.children}
			</div>
		</div>
	);
};
