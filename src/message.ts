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
	const response = listener(message, sender) as unknown;
	if (response instanceof Promise) {
		response.then(sendResponse);
		return true;
	}

	sendResponse(response);
};

function defineMessage<Request, Response>(type: string) {
	const send = (request: Request) => {
		return chrome.runtime.sendMessage<Request, Response>(undefined, {
			type,
			...request,
		});
	};

	const sendToTab = (tabId: number, request: Request) => {
		return chrome.tabs.sendMessage<Request, Response>(tabId, {
			type,
			...request,
		});
	};

	const addListener = (
		listener: (
			request: Request,
			sender: chrome.runtime.MessageSender,
		) => Response | Promise<Response>,
	) => {
		if (listeners.size === 0) {
			chrome.runtime.onMessage.addListener(rootListener);
		}
		listeners.set(type, listener);
	};

	const removeListener = (
		listener: (
			request: Request,
			sender: chrome.runtime.MessageSender,
		) => Response | Promise<Response>,
	) => {
		if (listeners.get(type) !== listener) return;

		listeners.delete(type);
		if (listeners.size === 0) {
			chrome.runtime.onMessage.removeListener(rootListener);
		}
	};

	return {
		send,
		sendToTab,
		addListener,
		removeListener,
	};
}

export const SetVolume = defineMessage<{ tabId: number; volume: number }, void>(
	"setVolume",
);

export const SetGain = defineMessage<{ volume: number }, void>("setGain");

export const GetVolume = defineMessage<void, number>("getVolume");

export const GetVolumeAll = defineMessage<void, Record<number, number>>(
	"getVolumeAll",
);
