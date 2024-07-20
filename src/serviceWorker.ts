import { GetVolume, GetVolumeAll, SetGain, SetVolume } from "./message";

const volumeByTabId = new Map<number, number>();

SetVolume.addListener((message) => {
	volumeByTabId.set(message.tabId, message.volume);
	SetGain.sendToTab(message.tabId, { volume: message.volume });
});

GetVolumeAll.addListener(() => {
	return Object.fromEntries(volumeByTabId.entries());
});

GetVolume.addListener((message, sender) => {
	const tabId = sender.tab?.id;
	if (tabId === undefined) return 100;

	return volumeByTabId.get(tabId) ?? 100;
});

chrome.tabs.onRemoved.addListener((tabId) => {
	volumeByTabId.delete(tabId);
});
