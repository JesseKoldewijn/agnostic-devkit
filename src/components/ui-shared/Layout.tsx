import type { Component, JSX } from "solid-js";
import { splitProps } from "solid-js";

import { cn } from "@/utils/cn";

interface LayoutProps extends JSX.HTMLAttributes<HTMLDivElement> {
	children: JSX.Element;
	class?: string;
}

export const Layout: Component<LayoutProps> = (props) => {
	const [local, others] = splitProps(props, ["children", "class"]);
	return (
		<div
			{...others}
			class={cn(
				"bg-background text-foreground selection:bg-primary/10 min-h-screen w-full p-4",
				local.class
			)}
		>
			<div class="mx-auto w-full max-w-4xl">{local.children}</div>
		</div>
	);
};
