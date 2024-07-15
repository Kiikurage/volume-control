import {
	GetTabs,
	OnTabActivate,
	OnTabCreate,
	OnTabDelete,
	OnTabUpdate,
	type Tab,
} from "./message";

ensureOffscreenDocument();

chrome.tabs.onCreated.addListener((tab) => {
	OnTabCreate.send(convertTab(tab));
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	OnTabUpdate.send(convertTab(tab));
});

chrome.tabs.onActivated.addListener((activeInfo) => {
	OnTabActivate.send({ tabId: activeInfo.tabId });
});

chrome.tabs.onRemoved.addListener((tabId) => {
	OnTabDelete.send({ tabId });
});

GetTabs.addListener(async () => {
	const activeTabIds = (await chrome.tabs.query({ active: true })).map(
		(tab) => tab.id,
	);
	const tabs = (await chrome.tabs.query({})).map((tab) => convertTab(tab));

	return { tabs, activeTabIds };
});

function convertTab(rawTab: chrome.tabs.Tab): Tab {
	return {
		tabId: rawTab.id,
		title: rawTab.title ?? "",
		url: rawTab.url ?? "",
		audible: rawTab.audible ?? false,
	};
}

async function ensureOffscreenDocument() {
	const existingContexts = await chrome.runtime.getContexts({});
	const offscreenDocument = existingContexts.find(
		(context) => context.contextType === "OFFSCREEN_DOCUMENT",
	);

	if (!offscreenDocument) {
		await chrome.offscreen.createDocument({
			url: "offscreen.html",
			reasons: ["USER_MEDIA"],
			justification: "",
		});
	}

	return offscreenDocument;
}
