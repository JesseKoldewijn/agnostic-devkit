import type { Component, JSX } from "solid-js";
import { splitProps } from "solid-js";

interface SeparatorProps extends JSX.HTMLAttributes<HTMLDivElement> {
	orientation?: "horizontal" | "vertical";
}

export const Separator: Component<SeparatorProps> = (props) => {
	const [local, others] = splitProps(props, ["orientation", "class"]);

	return (
		<div
			{...others}
			class={`bg-border shrink-0 ${
				local.orientation === "vertical" ? "h-full w-[2px]" : "h-[2px] w-full"
			} ${local.class ?? ""}`}
		/>
	);
};
