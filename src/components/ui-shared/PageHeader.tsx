import type { Component, JSX } from "solid-js";
import { Show } from "solid-js";

import { cn } from "@/utils/cn";

import { Badge } from "../ui/Badge";
import { Separator } from "../ui/Separator";

interface PageHeaderProps {
	title: string;
	subtitle?: string;
	theme?: string;
	actions?: JSX.Element;
	titleTestId?: string;
}

export const PageHeader: Component<PageHeaderProps> = (props) => (
	<div class="flex flex-col space-y-4 pb-4">
		<div class="flex items-center justify-between">
			<div class="flex flex-col">
				<h1
					class={cn("text-foreground text-2xl leading-none font-black tracking-tight uppercase")}
					data-testid={props.titleTestId}
				>
					{props.title}
				</h1>
				<Show when={props.subtitle}>
					<p
						class={cn(
							"text-muted-foreground mt-1.5 text-[11px] font-black tracking-widest uppercase opacity-70"
						)}
					>
						{props.subtitle}
					</p>
				</Show>
			</div>
			<div class="flex items-center space-x-2">
				<Show when={props.theme}>
					<Badge
						variant="secondary"
						class={cn("px-2 py-0.5 font-black")}
						data-testid="theme-indicator"
					>
						{props.theme}
					</Badge>
				</Show>
				{props.actions}
			</div>
		</div>
		<Separator />
	</div>
);
