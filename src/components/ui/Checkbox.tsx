import type { Component, JSX } from "solid-js";
import { splitProps } from "solid-js";

import { cn } from "@/utils/cn";

export interface CheckboxProps extends Omit<
	JSX.HTMLAttributes<HTMLDivElement>,
	"onChange" | "role"
> {
	/**
	 * Whether the checkbox is checked
	 */
	checked: boolean;
	/**
	 * Callback fired when the checkbox state changes
	 */
	onChange?: (checked: boolean) => void;
	/**
	 * Whether the checkbox is disabled
	 */
	disabled?: boolean;
	/**
	 * Accessible label for the checkbox (required for accessibility if no visible label)
	 */
	"aria-label"?: string;
}

/**
 * A custom styled checkbox component matching the Export view pattern.
 * Uses a div with role="checkbox" for custom styling while maintaining accessibility.
 */
export const Checkbox: Component<CheckboxProps> = (props) => {
	const [local, others] = splitProps(props, [
		"checked",
		"onChange",
		"disabled",
		"class",
		"aria-label",
	]);

	const handleClick = () => {
		if (!local.disabled) {
			local.onChange?.(!local.checked);
		}
	};

	const handleKeyDown: JSX.EventHandler<HTMLDivElement, KeyboardEvent> = (e) => {
		if (local.disabled) return;

		if (e.key === " " || e.key === "Enter") {
			e.preventDefault();
			local.onChange?.(!local.checked);
		}
	};

	return (
		<div
			role="checkbox"
			aria-checked={local.checked}
			aria-disabled={local.disabled || undefined}
			aria-label={local["aria-label"]}
			tabIndex={local.disabled ? -1 : 0}
			class={cn(
				"flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-sm border-2 transition-colors",
				local.checked
					? "border-primary bg-primary text-primary-foreground"
					: "border-border bg-background",
				local.disabled && "cursor-not-allowed opacity-50",
				local.class
			)}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			{...others}
		>
			{local.checked && (
				<svg
					class={cn("size-2.5")}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="3"
						d="M5 13l4 4L19 7"
					/>
				</svg>
			)}
		</div>
	);
};
