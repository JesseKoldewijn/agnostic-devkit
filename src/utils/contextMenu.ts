export interface ContextMenuItem {
	title: string;
	contexts?: chrome.contextMenus.CreateProperties["contexts"];
	action: (context: {
		tab: chrome.tabs.Tab;
		window: chrome.windows.Window;
		selection?: string;
	}) => Promise<void>;
}

export class ContextMenu {
	private menuItems: ContextMenuItem[] = [];
	private readonly menuItemsMap: Map<string, ContextMenuItem> = new Map(); // Track items by ID

	constructor() {
		this.menuItems = [];
		this.setupClickListener();
	}

	private async setupClickListener() {
		// Set up the click listener for context menu items

		chrome.contextMenus.onClicked.addListener(async (info) => {
			const menuItem = this.menuItemsMap.get(info.menuItemId as string);
			const currentWindow = await chrome.windows?.getCurrent();
			const currentTab = await chrome.tabs?.query({
				active: true,
				currentWindow: true,
			});

			const selectedTextOrLink = info.selectionText || info.linkUrl || "";

			if (menuItem) {
				menuItem.action({
					tab: (currentTab
						? currentTab[0]
						: undefined) as chrome.tabs.Tab,
					window: (currentWindow || {}) as chrome.windows.Window,
					selection: selectedTextOrLink,
				});
			}
		});
	}

	mutateContext(
		operation: "add" | "remove",
		item: {
			title: string;
			action: ContextMenuItem;
		}
	) {
		// Iterate over each locale key

		// Create a localized version of the menu item
		const localizedItem: ContextMenuItem = {
			title: item.title,
			action: async (args) => {
				return item.action.action(args);
			},
		}; // item.action is ContextMenuItem, so we need .action property

		if (operation === "add") {
			this.addItem(localizedItem);
		} else if (operation === "remove") {
			// For removal, we need to find items with matching title pattern
			// This is still problematic because we can't easily match by reference
			const itemsToRemove = this.menuItems.filter((menuItem) =>
				menuItem.title.startsWith(item.title)
			);
			for (const itemToRemove of itemsToRemove) {
				this.removeItem(itemToRemove);
			}
		}

		return this;
	}

	addItem(item: ContextMenuItem) {
		this.menuItems.push(item);
		return this;
	}

	removeItem(item: ContextMenuItem) {
		this.menuItems = this.menuItems.filter((i) => i !== item);
		return this;
	}

	getItems() {
		return this.menuItems;
	}

	// Add to chrome context menu
	addToChrome() {
		// Clear existing menu items map
		this.menuItemsMap.clear();

		chrome.contextMenus?.removeAll(() => {
			for (let i = 0; i < this.menuItems.length; i++) {
				const item = this.menuItems[i];
				const menuId = `menu-item-${i}`;

				console.log("Adding context menu item:", item.title);

				// Store the item in our map for the click handler
				this.menuItemsMap.set(menuId, item);

				chrome.contextMenus?.create({
					id: menuId,
					title: item.title,
					contexts: item?.contexts || ["all"],
					type: "normal",
				});
			}
		});
		return this;
	}
}
