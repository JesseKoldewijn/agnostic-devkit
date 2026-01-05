import type { Component } from "solid-js";
import { Show } from "solid-js";
import { cn } from "@/utils/cn";
import { Badge } from "../ui/Badge";
import { Separator } from "../ui/Separator";

interface PageHeaderProps {
	title: string;
	subtitle?: string;
	theme?: string;
	actions?: any;
	titleTestId?: string;
}

export const PageHeader: Component<PageHeaderProps> = (props) => (
	<div class="flex flex-col space-y-4 pb-4">
		<div class="flex items-center justify-between">
			<div class="flex flex-col">
				<h1
					class={cn("font-black text-2xl text-foreground uppercase leading-none tracking-tight")}
					data-testid={props.titleTestId}
				>
					{props.title}
				</h1>
				<Show when={props.subtitle}>
					<p
						class={cn(
							"mt-1.5 font-black text-[11px] text-muted-foreground uppercase tracking-widest opacity-70"
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
