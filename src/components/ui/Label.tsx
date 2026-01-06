import type { Component, JSX } from "solid-js";
import { splitProps } from "solid-js";

interface LabelProps extends JSX.LabelHTMLAttributes<HTMLLabelElement> {
	required?: boolean;
}

export const Label: Component<LabelProps> = (props) => {
	const [local, others] = splitProps(props, ["required", "class", "children"]);

	return (
		// biome-ignore lint/a11y/noLabelWithoutControl: generic label component used with htmlFor in parent components
		<label
			{...others}
			class={`mb-1.5 ml-1 block font-black text-[10px] text-foreground/70 uppercase tracking-widest ${local.class ?? ""}`}
		>
			{local.children}
			{local.required && <span class="ml-1 font-black text-destructive">*</span>}
		</label>
	);
};
