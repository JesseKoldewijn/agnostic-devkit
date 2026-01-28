import type { Component, JSX } from "solid-js";
import { splitProps } from "solid-js";

interface LabelProps extends JSX.LabelHTMLAttributes<HTMLLabelElement> {
	required?: boolean;
}

export const Label: Component<LabelProps> = (props) => {
	const [local, others] = splitProps(props, ["required", "class", "children"]);

	return (
		<label
			{...others}
			class={`text-foreground/70 mb-1.5 ml-1 block text-[10px] font-black tracking-widest uppercase ${local.class ?? ""}`}
		>
			{local.children}
			{local.required && <span class="text-destructive ml-1 font-black">*</span>}
		</label>
	);
};
