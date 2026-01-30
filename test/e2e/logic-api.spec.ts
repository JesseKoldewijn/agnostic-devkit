import { test } from "./core/fixtures";
import { createTestPage, getTabId, openPopupPage } from "./core/helpers";

test.describe("Logic Layer API Exhaustive Tests", () => {
	test("should exhaustively exercise logic layer", async ({ context, extensionId }) => {
		const testPage = await createTestPage(context, "https://example.com");
		const tabId = await getTabId(context, testPage);
		const popupPage = await openPopupPage(context, extensionId, tabId);

		popupPage.on("console", (msg) => console.log(`[Popup Console] ${msg.text()}`));

		await popupPage.evaluate(async (tid) => {
			const logic = window.__LOGIC__;
			if (!logic) {
				return;
			}

			await logic.getPresets();
			await logic.getActivePresetsForTab(tid);

			const p = await logic.createPreset({
				name: "Logic Test",
				parameters: [],
			});
			await logic.updatePreset(p.id, { description: "Updated" });
			await logic.duplicatePreset(p.id);

			const p2 = await logic.createPreset({
				name: "Apply Test",
				parameters: [
					{
						id: "1",
						key: "l_key",
						type: "queryParam",
						value: "l_val",
					},
				],
			});

			await logic.applyPreset(tid, p2.id);
			await logic.verifyPreset(tid, p2.id);
			await logic.syncParameter(tid, p2.parameters[0]);
			await logic.removePreset(tid, p2.id);

			logic.getParameterTypeLabel("queryParam");
			logic.getParameterTypeIcon("cookie");

			await logic.deletePreset(p.id);
			await logic.deletePreset(p2.id);
		}, tabId);
	});

	test("should handle tab cleanup logic when closed", async ({ context, extensionId }) => {
		const testPage = await createTestPage(context, "https://example.com");
		const tabId = await getTabId(context, testPage);
		const popupPage = await openPopupPage(context, extensionId, tabId);

		await popupPage.evaluate(async (tid) => {
			const logic = window.__LOGIC__;
			if (!logic) {
				return;
			}
			await logic.addActivePresetToTab(tid, "some-id");
		}, tabId);

		await testPage.close();
	});
});
