declare module chrome {
	namespace action {
		const onClicked: events.Event<[tab: tabs.Tab]>;

		// https://developer.chrome.com/docs/extensions/reference/api/action#type-OpenPopupOptions
		interface OpenPopupOptions {
			windowId?: number;
		}

		// https://developer.chrome.com/docs/extensions/reference/api/action#method-openPopup
		function openPopup(options?: OpenPopupOptions): Promise<void>;
	}

	namespace declarativeNetRequest {
		type UpdateRuleOptions = {};

		function updateDynamicRules(options: UpdateRuleOptions): Promise<void>;
	}

	// https://developer.chrome.com/docs/extensions/reference/api/events
	namespace events {
		// https://developer.chrome.com/docs/extensions/reference/api/events#type-Event
		interface Event<Args extends unknown[] = []> {
			addListener: (callback: (...args: Args) => void) => void;
			removeListener: (callback: (...args: Args) => void) => void;
		}
	}

	namespace runtime {
		interface MessageSender {
			tab?: tabs.Tab;
		}

		const id: string;

		// https://developer.chrome.com/docs/extensions/reference/api/runtime#method-getURL
		function getURL(path: string): string;

		// https://developer.chrome.com/docs/extensions/reference/api/runtime#method-sendMessage
		function sendMessage<Request, Response = unknown>(
			extensionId: undefined,
			message: Request,
			options?: undefined,
		): Promise<Response>;

		const onInstalled: events.Event<[details: { reason: string }]>;
		const onMessage: events.Event<
			[
				message: unknown,
				sender: MessageSender,
				sendResponse: (response: unknown) => void,
			]
		>;

		// https://developer.chrome.com/docs/extensions/reference/api/runtime#type-ContextType
		type ContextType =
			| "TAB"
			| "POPUP"
			| "BACKGROUND"
			| "OFFSCREEN_DOCUMENT"
			| "SIDE_PANEL";

		// https://developer.chrome.com/docs/extensions/reference/api/runtime#type-ExtensionContext
		interface ExtensionContext {
			contextId: string;
			contextType: ContextType;
		}

		// https://developer.chrome.com/docs/extensions/reference/api/runtime#type-ContextFilter
		type ContextFilter = {};

		// https://developer.chrome.com/docs/extensions/reference/api/runtime#method-getContexts
		function getContexts(filter: ContextFilter): Promise<ExtensionContext[]>;
	}

	// https://developer.chrome.com/docs/extensions/reference/api/scripting
	namespace scripting {
		// https://developer.chrome.com/docs/extensions/reference/api/scripting#type-ScriptInjection
		interface ScriptInjection {
			files?: string[];
			target: InjectionTarget;
			world?: ExecutionWorld;
			injectImmediately?: boolean;
		}

		// https://developer.chrome.com/docs/extensions/reference/api/scripting#type-ExecutionWorld
		type ExecutionWorld = "ISOLATED" | "WORLD";

		// https://developer.chrome.com/docs/extensions/reference/api/scripting#type-InjectionResult
		type InjectionResult = {};

		// https://developer.chrome.com/docs/extensions/reference/api/scripting#type-InjectionTarget
		interface InjectionTarget {
			tabId: number;
			allFrames?: boolean;
		}

		// https://developer.chrome.com/docs/extensions/reference/api/scripting#method-executeScript
		function executeScript(
			injection: ScriptInjection,
		): Promise<InjectionResult[]>;
	}

	// https://developer.chrome.com/docs/extensions/reference/api/tabs
	namespace tabs {
		// https://developer.chrome.com/docs/extensions/reference/api/tabs#type-Tab
		interface Tab {
			id: number;
			active?: boolean;
			title?: string;
			url?: string;
			pendingUrl?: string;
			audible?: boolean;
		}

		function create(createProperties: CreateProperties): Promise<Tab>;
		interface CreateProperties {
			url: string;
		}

		// https://developer.chrome.com/docs/extensions/reference/api/tabs#method-query
		function query(queryInfo: QueryInfo): Promise<Tab[]>;
		interface QueryInfo {
			url?: string;
			active?: boolean;
			audible?: boolean;
			lastFocusedWindow?: boolean;
		}

		// https://developer.chrome.com/docs/extensions/reference/api/tabs#method-get
		function get(tabId: number): Promise<Tab>;

		// https://developer.chrome.com/docs/extensions/reference/api/tabs#method-sendMessage
		function sendMessage<Request, Response = unknown>(
			tabId: number,
			message: Request,
			options?: undefined,
			callback?: (response: Response) => void,
		): Promise<Response>;

		// https://developer.chrome.com/docs/extensions/reference/api/tabs#method-remove
		function remove(tabIds: number | number[]): Promise<void>;

		// https://developer.chrome.com/docs/extensions/reference/api/tabs#method-update
		function update(
			tabId: number,
			updateProperties: UpdateProperties,
		): Promise<Tab | undefined>;
		interface UpdateProperties {
			active?: boolean;
			muted?: boolean;
		}

		// https://developer.chrome.com/docs/extensions/reference/api/tabs#event-onCreated
		const onCreated: events.Event<[tab: Tab]>;

		// https://developer.chrome.com/docs/extensions/reference/api/tabs#event-onRemoved
		const onRemoved: events.Event<[tabId: number, removeInfo: RemovedInfo]>;
		interface RemovedInfo {
			isWindowClosing: boolean;
			windowId: number;
		}

		// https://developer.chrome.com/docs/extensions/reference/api/tabs#event-onUpdated
		const onUpdated: events.Event<
			[tabId: number, changeInfo: ChangeInfo, tab: Tab]
		>;
		interface ChangeInfo {
			audible?: boolean;
		}

		// https://developer.chrome.com/docs/extensions/reference/api/tabs#event-onActivated
		const onActivated: events.Event<[activeInfo: ActiveInfo]>;
		interface ActiveInfo {
			tabId: number;
			windowId: number;
		}
	}

	// https://developer.chrome.com/docs/extensions/reference/api/tabCapture
	namespace tabCapture {
		// https://developer.chrome.com/docs/extensions/reference/api/tabCapture#type-GetMediaStreamOptions

		interface GetMediaStreamOptions {
			consumerTabId?: number;
			targetTabId?: number;
		}

		// https://developer.chrome.com/docs/extensions/reference/api/tabCapture#method-getMediaStreamId
		function getMediaStreamId(options?: GetMediaStreamOptions): Promise<string>;
	}

	// https://developer.chrome.com/docs/extensions/reference/api/offscreen
	namespace offscreen {
		// https://developer.chrome.com/docs/extensions/reference/api/offscreen#type-Reason
		type Reason =
			| "TESTING"
			| "AUDIO_PLAYBACK"
			| "IFRAME_SCRIPTING"
			| "DOM_SCRAPING"
			| "BLOBS"
			| "DOM_PARSER"
			| "USER_MEDIA"
			| "DISPLAY_MEDIA"
			| "WEB_RTC"
			| "CLIPBOARD"
			| "LOCAL_STORAGE"
			| "WORKERS"
			| "BATTERY_STATUS"
			| "MATCH_MEDIA"
			| "GEOLOCATION";

		// https://developer.chrome.com/docs/extensions/reference/api/offscreen#type-CreateParameters
		interface CreateParameters {
			justification: string;
			reasons: Reason[];
			url: string;
		}

		// https://developer.chrome.com/docs/extensions/reference/api/offscreen#method-createDocument
		function createDocument(parameters: CreateParameters): Promise<void>;
	}

	// https://developer.chrome.com/docs/extensions/reference/api/sidePanel
	namespace sidePanel {
		interface PanelBehavior {
			openPanelOnActionClick: boolean;
		}

		// https://developer.chrome.com/docs/extensions/reference/api/sidePanel#method-setPanelBehavior
		function setPanelBehavior(behavior: PanelBehavior): Promise<void>;
	}
}
