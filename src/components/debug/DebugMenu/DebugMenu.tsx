/**
 * DebugMenu Component
 *
 * A modal dialog for managing feature flags with:
 * - Category grouping with collapsible sections
 * - Search filtering
 * - Virtualized list for performance
 * - Deprecated flag indicators
 * - Profile switching with confirmation
 */
import { For, Show, createMemo, createSignal } from "solid-js";

import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { VirtualList } from "@/components/ui/VirtualList";
import {
	type ExtensionEnv,
	FEATURE_FLAG_CATEGORIES,
	type FeatureFlagCategory,
	setForceProfile,
} from "@/logic/featureFlags";
import { cn } from "@/utils/cn";

import { createDebugMenuState } from "./logic";
import type { DebugMenuProps, FlagState } from "./types";

/**
 * Props for FlagRow component
 */
interface FlagRowProps {
	readonly flag: FlagState;
	readonly onToggle: () => void;
}

/**
 * Single flag row component
 */
function FlagRow(props: FlagRowProps) {
	const inputId = `flag-${props.flag.key}`;
	const isDeprecated = (): boolean => Boolean(props.flag.deprecated);
	const deprecationReason = (): string =>
		typeof props.flag.deprecated === "string" ? props.flag.deprecated : "This flag is deprecated";

	return (
		<div
			class={cn(
				"flex cursor-pointer items-start gap-3 rounded-md p-2 transition-colors",
				"hover:bg-neutral-100 dark:hover:bg-neutral-800",
				isDeprecated() && "opacity-60"
			)}
		>
			<input
				id={inputId}
				type="checkbox"
				checked={props.flag.value}
				onChange={props.onToggle}
				class="mt-0.5 size-4 rounded-sm border-neutral-300 accent-yellow-500"
			/>
			<label for={inputId} class="flex-1 cursor-pointer">
				<div class="flex items-center gap-2">
					<span
						class={cn(
							"font-medium text-neutral-900 dark:text-neutral-100",
							isDeprecated() && "line-through"
						)}
					>
						{props.flag.name}
					</span>
					<Show when={props.flag.isOverridden}>
						<span class="text-xs text-yellow-600 dark:text-yellow-400">(overridden)</span>
					</Show>
					<Show when={isDeprecated()}>
						<span class="text-xs text-orange-600 dark:text-orange-400" title={deprecationReason()}>
							⚠️ deprecated
						</span>
					</Show>
				</div>
				<div class={cn("text-sm text-neutral-500", isDeprecated() && "line-through")}>
					{props.flag.description}
				</div>
				<Show when={isDeprecated()}>
					<div class="mt-1 text-xs text-orange-600/80 dark:text-orange-400/80">
						{deprecationReason()}
					</div>
				</Show>
			</label>
		</div>
	);
}

/**
 * Props for CategorySection component
 */
interface CategorySectionProps {
	readonly category: FeatureFlagCategory;
	readonly flags: FlagState[];
	readonly isCollapsed: boolean;
	readonly onToggleCollapse: () => void;
	readonly onToggleFlag: (flag: FlagState) => void;
}

/**
 * Category section with collapsible content
 */
function CategorySection(props: CategorySectionProps) {
	const categoryMeta = (): (typeof FEATURE_FLAG_CATEGORIES)[FeatureFlagCategory] =>
		FEATURE_FLAG_CATEGORIES[props.category];

	return (
		<div class="border-b border-neutral-200 last:border-b-0 dark:border-neutral-700">
			<button
				type="button"
				onClick={props.onToggleCollapse}
				class={cn(
					"flex w-full items-center justify-between px-4 py-3 text-left",
					"hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
					"transition-colors"
				)}
			>
				<div>
					<span class="font-semibold text-neutral-900 dark:text-neutral-100">
						{categoryMeta().name}
					</span>
					<span class="ml-2 text-xs text-neutral-500">
						({props.flags.length} flag{props.flags.length === 1 ? "" : "s"})
					</span>
				</div>
				<svg
					class={cn(
						"size-4 text-neutral-500 transition-transform",
						props.isCollapsed && "-rotate-90"
					)}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>
			<Show when={!props.isCollapsed}>
				<div class="space-y-1 px-4 pb-3">
					<For each={props.flags}>
						{(flag) => <FlagRow flag={flag} onToggle={() => props.onToggleFlag(flag)} />}
					</For>
				</div>
			</Show>
		</div>
	);
}

/**
 * Props for VirtualizedFlagList component
 */
interface VirtualizedFlagListProps {
	readonly flags: FlagState[];
	readonly onToggleFlag: (flag: FlagState) => void;
	readonly containerRef: HTMLDivElement | undefined;
}

/**
 * Virtualized flag list using the shared VirtualList component
 */
function VirtualizedFlagList(props: VirtualizedFlagListProps) {
	return (
		<VirtualList
			items={props.flags}
			estimateSize={72}
			overscan={5}
			scrollContainerRef={props.containerRef}
			minItemsForVirtualization={20}
			renderItem={(flag) => <FlagRow flag={flag} onToggle={() => props.onToggleFlag(flag)} />}
		/>
	);
}

/**
 * Main DebugMenu modal component
 */
export function DebugMenu(props: Readonly<DebugMenuProps>) {
	const state = createDebugMenuState();
	let scrollContainerRef: HTMLDivElement | undefined;

	// Profile switching state
	const [pendingProfile, setPendingProfile] = createSignal<ExtensionEnv | null>(null);

	// Available profiles for the buttons
	const profileOptions: ExtensionEnv[] = ["development", "canary", "production"];

	// Handle profile button click
	const handleProfileClick = (profile: ExtensionEnv) => {
		// If clicking the currently effective profile, do nothing
		if (profile === state.effectiveProfile()) {
			return;
		}
		// Set pending profile for confirmation
		setPendingProfile(profile);
	};

	// Confirm profile switch
	const confirmProfileSwitch = () => {
		const profile = pendingProfile();
		// Profile can be null (clearing override) or a specific profile
		setForceProfile(profile === state.buildProfile ? null : profile);
		setPendingProfile(null);
		// Reload to apply the new profile
		window.location.reload();
	};

	// Cancel profile switch
	const cancelProfileSwitch = () => {
		setPendingProfile(null);
	};

	// Flat list of all filtered flags for virtualization
	const allFilteredFlags = createMemo(() => {
		const flags: FlagState[] = [];
		for (const categoryFlags of state.filteredFlagsByCategory().values()) {
			flags.push(...categoryFlags);
		}
		return flags;
	});

	// Whether to show category view or flat search results
	const showCategories = createMemo(() => state.searchQuery().trim() === "");

	// Categories with flags (non-empty)
	const categoriesWithFlags = createMemo(() => {
		const result: Array<{
			category: FeatureFlagCategory;
			flags: FlagState[];
		}> = [];

		for (const [category, flags] of state.filteredFlagsByCategory()) {
			if (flags.length > 0) {
				result.push({ category, flags });
			}
		}

		return result;
	});

	return (
		<Modal
			open={props.open}
			onClose={props.onClose}
			title="Feature Flags"
			description="Toggle feature flags for testing and development"
			size="lg"
			data-testid="debug-menu-modal"
		>
			<div class="flex h-full max-h-[70vh] flex-col">
				{/* Header with environment info and profile selector */}
				<div class="mb-4 flex items-center justify-between gap-4">
					<fieldset class="m-0 flex items-center gap-2 border-none p-0">
						<legend class="text-sm text-neutral-500">Profile:</legend>
						<div
							class="flex rounded-md border border-neutral-200 dark:border-neutral-700"
							data-testid="profile-button-group"
						>
							<For each={profileOptions}>
								{(profile) => {
									const isActive = () => state.effectiveProfile() === profile;
									const isBuildProfile = profile === state.buildProfile;
									const isForced = () => state.forceProfile() === profile;

									return (
										<button
											type="button"
											class={cn(
												"px-3 py-1.5 text-xs font-medium transition-colors first:rounded-l-md last:rounded-r-md",
												"border-r border-neutral-200 last:border-r-0 dark:border-neutral-700",
												"focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
												isActive()
													? "bg-primary text-primary-foreground"
													: "bg-transparent text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
											)}
											onClick={() => handleProfileClick(profile)}
											data-testid={`profile-button-${profile}`}
											aria-pressed={isActive()}
											aria-label={`${profile} profile${isBuildProfile ? " (build default)" : ""}${isForced() && !isBuildProfile ? " (forced override)" : ""}`}
										>
											{profile}
											<Show when={isBuildProfile}>
												<span class="ml-1 text-[10px] opacity-60" aria-hidden="true">
													(build)
												</span>
											</Show>
											<Show when={isForced() && !isBuildProfile}>
												<span
													class="ml-1 text-[10px] text-orange-400"
													aria-hidden="true"
													title="Profile override active"
												>
													●
												</span>
											</Show>
										</button>
									);
								}}
							</For>
						</div>
					</fieldset>
					<span class="text-xs text-neutral-500">
						{state.visibleFlagCount()} flag{state.visibleFlagCount() === 1 ? "" : "s"}
					</span>
				</div>

				{/* Profile switch confirmation dialog */}
				<ConfirmDialog
					open={pendingProfile() !== null}
					onConfirm={confirmProfileSwitch}
					onCancel={cancelProfileSwitch}
					title="Switch Profile?"
					message={`Switching to the "${pendingProfile()}" profile requires a page reload. Any unsaved changes will be lost.`}
					confirmText="Switch & Reload"
					cancelText="Cancel"
					variant="default"
					data-testid="profile-switch-confirm"
				/>

				{/* Search input */}
				<div class="mb-4">
					<Input
						type="search"
						placeholder="Search flags..."
						value={state.searchQuery()}
						onInput={(e) => state.setSearchQuery(e.currentTarget.value)}
						class="w-full"
						data-testid="flag-search-input"
					/>
				</div>

				{/* Flags list */}
				<div
					ref={scrollContainerRef}
					class="flex-1 overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-700"
				>
					<Show when={state.isLoading()}>
						<div class="flex items-center justify-center p-8">
							<span class="text-sm text-neutral-500">Loading flags...</span>
						</div>
					</Show>

					<Show when={!state.isLoading() && state.visibleFlagCount() === 0}>
						<div class="flex items-center justify-center p-8">
							<span class="text-sm text-neutral-500">
								{state.searchQuery() ? "No flags match your search" : "No feature flags defined"}
							</span>
						</div>
					</Show>

					<Show when={!state.isLoading() && state.visibleFlagCount() > 0}>
						<Show
							when={showCategories()}
							fallback={
								<div class="p-4">
									<VirtualizedFlagList
										flags={allFilteredFlags()}
										onToggleFlag={(flag) => state.toggleFlag(flag.key)}
										containerRef={scrollContainerRef}
									/>
								</div>
							}
						>
							<For each={categoriesWithFlags()}>
								{({ category, flags }) => (
									<CategorySection
										category={category}
										flags={flags}
										isCollapsed={state.collapsedCategories().has(category)}
										onToggleCollapse={() => state.toggleCategory(category)}
										onToggleFlag={(flag) => state.toggleFlag(flag.key)}
									/>
								)}
							</For>
						</Show>
					</Show>
				</div>

				{/* Footer with actions */}
				<div class="mt-4 flex items-center justify-end gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-700">
					<Button variant="ghost" onClick={state.resetAllFlags} data-testid="reset-flags-button">
						Reset to Defaults
					</Button>
					<Button variant="secondary" onClick={props.onClose}>
						Close
					</Button>
				</div>
			</div>
		</Modal>
	);
}
