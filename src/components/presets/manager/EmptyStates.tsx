/**
 * Empty states for the preset manager
 */
import type { Component } from "solid-js";
import { Show } from "solid-js";

import { cn } from "@/utils/cn";

import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";

export interface EmptyStatesProps {
	isLoading: boolean;
	hasPresets: boolean;
	onStartCreate: () => void;
}

export const EmptyStates: Component<EmptyStatesProps> = (props) => {
	return (
		<>
			<Show when={props.isLoading}>
				<div class={cn("flex flex-col items-center justify-center space-y-2 py-12")}>
					<div
						class={cn(
							"border-primary/30 border-t-primary size-5 animate-spin rounded-full border-2"
						)}
					/>
				</div>
			</Show>

			<Show when={!props.isLoading && !props.hasPresets}>
				<Card
					class={cn(
						"border-border/40 bg-muted/10 flex flex-col items-center justify-center border-dashed px-6 py-12 text-center"
					)}
					data-testid="no-presets-message"
				>
					<p
						class={cn(
							"text-muted-foreground mb-4 text-[10px] font-black tracking-widest uppercase"
						)}
					>
						No presets found
					</p>
					<Button variant="outline" size="sm" onClick={props.onStartCreate}>
						Create First Preset
					</Button>
				</Card>
			</Show>
		</>
	);
};
