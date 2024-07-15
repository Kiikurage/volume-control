import {
	GetItemList,
	GetTabs,
	type Item,
	OnItemCreate,
	OnItemDelete,
	OnItemUpdate,
	OnTabActivate,
	OnTabCreate,
	OnTabDelete,
	OnTabUpdate,
	SetVolume,
	StartCapture,
	type Tab,
} from "./message";

interface State {
	tab: Tab;
	active: boolean;
	stream: MediaStream | null;
	gainNode: GainNode | null;
}
const context = new AudioContext();
const stateByTabId = new Map<number, State>();

GetTabs.send().then(({ activeTabIds, tabs }) => {
	for (const tab of tabs) {
		createState(tab);
	}
	for (const tabId of activeTabIds) {
		setActive(tabId, true);
	}
});

SetVolume.addListener((message) => {
	const state = stateByTabId.get(message.tabId);
	if (state === undefined) {
		throw new Error(`Tab state not found for tabId: ${message.tabId}`);
	}
	const gainNode = state.gainNode;
	if (gainNode === null) {
		throw new Error(`GainNode not found for tabId: ${message.tabId}`);
	}

	gainNode.gain.value = message.volume / 100;

	OnItemUpdate.send(stateToItem(state));
});

GetItemList.addListener(() => {
	const result: Item[] = [];
	for (const state of stateByTabId.values()) {
		result.push(stateToItem(state));
	}
	return result;
});

StartCapture.addListener(async (message) => {
	const state = stateByTabId.get(message.tabId);
	if (state === undefined) {
		throw new Error(`Tab state not found for tabId: ${message.tabId}`);
	}

	const stream = await navigator.mediaDevices.getUserMedia({
		audio: {
			mandatory: {
				chromeMediaSource: "tab",
				chromeMediaSourceId: message.streamId,
			},
			// biome-ignore lint/suspicious/noExplicitAny:
		} as any,
	});
	for (const videoTrack of stream.getVideoTracks()) {
		videoTrack.stop();
		stream.removeTrack(videoTrack);
	}

	const source = context.createMediaStreamSource(stream);
	const gainNode = new GainNode(context, { gain: 1 });

	source.connect(gainNode);
	gainNode.connect(context.destination);
	state.stream = stream;
	state.gainNode = gainNode;

	OnItemUpdate.send(stateToItem(state));
});

OnTabCreate.addListener((message) => {
	createState(message);
});

OnTabUpdate.addListener((message) => {
	updateState(message);
});

OnTabActivate.addListener((message) => {
	const oldActiveState = [...stateByTabId.values()].find(
		(state) => state.active,
	);
	if (oldActiveState !== undefined) {
		setActive(oldActiveState.tab.tabId, false);
	}
	setActive(message.tabId, true);
});

OnTabDelete.addListener((message) => {
	deleteState(message.tabId);
});

function createState(tab: Tab) {
	const state: State = { tab, stream: null, gainNode: null, active: false };
	stateByTabId.set(tab.tabId, state);
	OnItemCreate.send(stateToItem(state));
}

function updateState(tab: Tab) {
	const state = stateByTabId.get(tab.tabId);
	if (state === undefined) {
		return createState(tab);
	}

	state.tab = tab;
	OnItemUpdate.send(stateToItem(state));
}

function setActive(tabId: number, active: boolean) {
	const state = stateByTabId.get(tabId);
	if (state === undefined) {
		return;
	}
	state.active = active;
	OnItemUpdate.send(stateToItem(state));
}

function deleteState(tabId: number) {
	const state = stateByTabId.get(tabId);
	if (state === undefined) return;

	for (const audioTrack of state.stream?.getAudioTracks() ?? []) {
		audioTrack.stop();
	}
	stateByTabId.delete(tabId);
	OnItemDelete.send({ tabId });
}

function stateToItem(state: State): Item {
	if (state.gainNode === null) {
		return {
			...state.tab,
			active: state.active,
			volume: -1,
		};
	}

	return {
		...state.tab,
		active: state.active,
		volume: state.gainNode.gain.value * 100,
	};
}
