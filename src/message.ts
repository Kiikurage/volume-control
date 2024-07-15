// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const listeners = new Map<string, (...args: any) => void>();
const rootListener = (
	message: unknown,
	sender: chrome.runtime.MessageSender,
	sendResponse: (response: unknown) => void,
) => {
	if (typeof message !== "object" || message === null) return;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const listener = listeners.get((message as any).type);
	if (listener === undefined) return;
	const response = listener(message) as unknown;
	if (response instanceof Promise) {
		response.then(sendResponse);
		return true;
	}

	sendResponse(response);
};

function defineMessage<Request, Response>(
	type: string,
): {
	send: (request: Request) => Promise<Response>;
	addListener(
		listener: (request: Request) => Response | Promise<Response>,
	): void;
	removeListener(
		listener: (request: Request) => Response | Promise<Response>,
	): void;
} {
	const send = (request: Request) => {
		return chrome.runtime.sendMessage<Request, Response>(undefined, {
			type,
			...request,
		});
	};

	const addListener = (
		listener: (request: Request) => Response | Promise<Response>,
	) => {
		if (listeners.size === 0) {
			chrome.runtime.onMessage.addListener(rootListener);
		}
		listeners.set(type, listener);
	};

	const removeListener = (
		listener: (request: Request) => Response | Promise<Response>,
	) => {
		if (listeners.get(type) !== listener) return;

		listeners.delete(type);
		if (listeners.size === 0) {
			chrome.runtime.onMessage.removeListener(rootListener);
		}
	};

	return {
		send,
		addListener,
		removeListener,
	};
}

export interface Tab {
	tabId: number;
	title: string;
	url: string;
	audible: boolean;
}

export interface Item {
	tabId: number;
	title: string;
	url: string;
	audible: boolean;
	active: boolean;
	volume: number;
}

const OriginalStartCapture = defineMessage<
	{ tabId: number; streamId: string },
	void
>("startCapture");

export const SetVolume = defineMessage<{ tabId: number; volume: number }, void>(
	"setVolume",
);

export const StartCapture = {
	send: async (tabId: number) => {
		const streamId = await chrome.tabCapture.getMediaStreamId({
			targetTabId: tabId,
		});

		return OriginalStartCapture.send({ tabId, streamId });
	},
	addListener: OriginalStartCapture.addListener,
};

export const OnTabCreate = defineMessage<Tab, void>("onTabCreate");

export const OnTabUpdate = defineMessage<Tab, void>("onTabUpdate");

export const OnTabActivate = defineMessage<{ tabId: number }, void>(
	"onTabActivate",
);

export const OnTabDelete = defineMessage<{ tabId: number }, void>(
	"onTabDelete",
);

export const GetTabs = defineMessage<
	void,
	{
		tabs: Tab[];
		activeTabIds: number[];
	}
>("getTabs");

export const GetItemList = defineMessage<void, Item[]>("getItemList");

export const OnItemCreate = defineMessage<Item, void>("onItemCreate");

export const OnItemUpdate = defineMessage<Item, void>("onItemUpdate");

export const OnItemDelete = defineMessage<{ tabId: number }, void>(
	"onItemDelete",
);
