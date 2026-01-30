/**
 * RepositoryImportHeader - Header with title and back button
 */
import type { Component } from "solid-js";

import { cn } from "@/utils/cn";

import { Button } from "../../ui/Button";

interface RepositoryImportHeaderProps {
	onCancel: () => void;
}

export const RepositoryImportHeader: Component<RepositoryImportHeaderProps> = (props) => {
	return (
		<div class={cn("flex items-center justify-between")}>
			<h2
				class={cn("text-foreground text-[10px] font-black tracking-[0.2em] uppercase opacity-70")}
			>
				Import from Repository
			</h2>
			<Button
				variant="ghost"
				size="xs"
				onClick={props.onCancel}
				data-testid="repository-import-back-button"
				aria-label="Back to preset list"
			>
				<svg
					class={cn("size-3.5")}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 19l-7-7m0 0l7-7m-7 7h18"
					/>
				</svg>
				<span>Back</span>
			</Button>
		</div>
	);
};
