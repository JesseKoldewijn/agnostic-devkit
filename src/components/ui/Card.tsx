import type { Component, JSX } from "solid-js";
import { splitProps } from "solid-js";

import { cn } from "@/utils/cn";

interface CardProps extends JSX.HTMLAttributes<HTMLDivElement> {
	hoverable?: boolean;
}

export const Card: Component<CardProps> = (props) => {
	const [local, others] = splitProps(props, ["hoverable", "class", "children"]);

	return (
		<div
			{...others}
			class={cn(
				"border-border bg-card rounded-2xl border-2 shadow-md transition-all",
				local.hoverable && "hover:border-primary/30 hover:shadow-lg",
				local.class
			)}
		>
			{local.children}
		</div>
	);
};

export const CardHeader: Component<JSX.HTMLAttributes<HTMLDivElement>> = (props) => {
	const [local, others] = splitProps(props, ["class", "children"]);
	return (
		<div {...others} class={cn("flex flex-col space-y-1.5 p-5 pb-3", local.class)}>
			{local.children}
		</div>
	);
};

export const CardTitle: Component<JSX.HTMLAttributes<HTMLHeadingElement>> = (props) => {
	const [local, others] = splitProps(props, ["class", "children"]);
	return (
		<h3
			{...others}
			class={cn(
				"text-foreground text-[15px] leading-none font-black tracking-tight uppercase",
				local.class
			)}
		>
			{local.children}
		</h3>
	);
};

export const CardDescription: Component<JSX.HTMLAttributes<HTMLParagraphElement>> = (props) => {
	const [local, others] = splitProps(props, ["class", "children"]);
	return (
		<p
			class={cn("text-muted-foreground text-[11px] font-bold opacity-80", local.class)}
			{...others}
		>
			{local.children}
		</p>
	);
};

export const CardContent: Component<JSX.HTMLAttributes<HTMLDivElement>> = (props) => {
	const [local, others] = splitProps(props, ["class", "children"]);
	return (
		<div {...others} class={cn("p-5 pt-3", local.class)}>
			{local.children}
		</div>
	);
};

export const CardFooter: Component<JSX.HTMLAttributes<HTMLDivElement>> = (props) => {
	const [local, others] = splitProps(props, ["class", "children"]);
	return (
		<div {...others} class={cn("flex items-center p-5 pt-3", local.class)}>
			{local.children}
		</div>
	);
};
