import { Component, JSX, splitProps } from "solid-js";
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
				"min-h-screen w-full bg-background p-4 text-foreground selection:bg-primary/10",
				local.class
			)}
		>
			<div class="mx-auto w-full max-w-4xl">{local.children}</div>
		</div>
	);
};
