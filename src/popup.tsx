import { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { GetVolumeAll, SetVolume } from "./message";

export interface Item {
	tabId: number;
	title: string;
	url: string;
	audible: boolean;
	active: boolean;
	volume: number;
}

const App = () => {
	const { items, setVolume } = useItems();

	return (
		<div
			css={{
				display: "flex",
				flexDirection: "column",
			}}
		>
			{items.map((item) => (
				<Control
					key={item.tabId}
					item={item}
					onVolumeChange={(volume) => setVolume(item.tabId, volume)}
				/>
			))}
		</div>
	);
};

const Control = ({
	item,
	onVolumeChange,
}: {
	item: Item;
	onVolumeChange: (volume: number) => void;
}) => {
	const hostname = new URL(item.url).host;
	const tld = hostname.split(".").slice(-2).join(".");
	const [palette, setPalette] = useState<[string, string]>(() => [
		"#f8f8f8",
		"#383838",
	]);

	return (
		<div
			css={{
				padding: "24px 16px",
				display: "grid",
				gridTemplate: `
				"favicon domain -" minmax(24px, min-content)
				"title title volume" minmax(24px, min-content)
				"slider slider slider" 32px / min-content 1fr min-content
				`,
				columnGap: 4,
				alignItems: "center",
				"&+&": {
					borderTop: "1px solid #e0e0e0",
				},
				background: palette[0],
				color: palette[1],
			}}
		>
			<img
				// onLoad={(ev) => setPalette(computePalette(ev.currentTarget))}
				css={{ gridArea: "favicon" }}
				src={getFaviconUrl(item.url)}
				alt="favicon"
			/>
			<header
				css={{
					gridArea: "domain",
					marginRight: 4,
					lineHeight: 1,
					fontSize: "1em",
					position: "relative",
					fontWeight: "normal",
					minWidth: 0,
					overflow: "hidden",
					textOverflow: "ellipsis",
				}}
			>
				{tld}
			</header>
			<h3
				css={{
					gridArea: "title",
					lineHeight: 1,
					fontSize: "1em",
					position: "relative",
					fontWeight: "normal",
					minWidth: 0,
					overflow: "hidden",
					textOverflow: "ellipsis",
				}}
			>
				{item.title}
			</h3>
			<span
				css={{
					gridArea: "volume",
					fontSize: "1.5em",
					fontWeight: "bold",
				}}
			>
				{item.volume.toFixed(1)}%
			</span>

			<input
				type="range"
				min={0}
				max={200}
				css={{
					"--color": palette[1],
					background: "transparent",
					gridArea: "slider",
					display: "block",
					margin: 0,
					padding: "8px 0",
					appearance: "none",
					outline: "none",
					"&::-webkit-slider-runnable-track": {
						"--percentage": `${((item.volume === -1 ? 100 : item.volume) / 200) * 100}%`,
						appearance: "none",
						height: 2,
						background:
							"linear-gradient(to right, var(--color) var(--percentage), color-mix(in srgb, var(--color) 25%, transparent) var(--percentage))",
					},
					"&::-webkit-slider-thumb": {
						appearance: "none",
						width: 16,
						height: 16,
						marginTop: -7,
						borderRadius: "50%",
						background: "var(--color)",
						outline:
							"0 solid color-mix(in srgb, var(--color) 15%, transparent)",
						transition: "outline-width 0.1s",
					},
					"&:disabled": {
						cursor: "not-allowed",
						"&::-webkit-slider-runnable-track": {
							background: "color-mix(in srgb, var(--color) 30%, #fff)",
						},
						"&::-webkit-slider-thumb": {
							outline: "none",
							background: "color-mix(in srgb, var(--color) 30%, #fff)",
						},
					},
					"&:hover, &:focus-visible": {
						"&::-webkit-slider-thumb": {
							outlineWidth: "8px",
							"&:active": {
								outlineColor:
									"color-mix(in srgb, var(--color) 30%, transparent)",
							},
						},
					},
				}}
				value={item.volume === -1 ? 100 : item.volume}
				onChange={(e) => {
					onVolumeChange(Number(e.target.value));
				}}
			/>
		</div>
	);
};

function useVolumes() {
	const [volumes, setVolumes] = useState<Record<number, number>>({});

	useEffect(() => {
		GetVolumeAll.send().then((volumes) => {
			setVolumes(volumes);
		});
	}, []);

	const setVolume = useCallback(async (tabId: number, volume: number) => {
		SetVolume.send({ tabId, volume });
		setVolumes((volumes) => {
			return { ...volumes, [tabId]: volume };
		});
	}, []);

	return { volumes, setVolume };
}

function useItems() {
	const { volumes, setVolume } = useVolumes();
	const [tabs, setTabs] = useState<chrome.tabs.Tab[]>(() => []);

	useEffect(() => {
		(async () => {
			const tabs = await chrome.tabs.query({});
			setTabs(tabs);
		})();

		const callback = () => {
			(async () => {
				const tabs = await chrome.tabs.query({});
				setTabs(tabs);
			})();
		};
		chrome.tabs.onCreated.addListener(callback);
		chrome.tabs.onUpdated.addListener(callback);
		chrome.tabs.onRemoved.addListener(callback);
		return () => {
			chrome.tabs.onCreated.removeListener(callback);
			chrome.tabs.onUpdated.removeListener(callback);
			chrome.tabs.onRemoved.removeListener(callback);
		};
	}, []);

	const items = useMemo(() => {
		return tabs
			.filter((tab) => (tab.url ?? "").startsWith("http"))
			.filter((tab) => tab.audible || tab.active)
			.map((tab) => {
				const volume = volumes[tab.id] ?? 100;

				return {
					tabId: tab.id ?? -1,
					title: tab.title ?? "",
					url: tab.url ?? "",
					audible: tab.audible ?? false,
					active: tab.active ?? false,
					volume,
				};
			});
	}, [tabs, volumes]);

	return { items, setVolume };
}

window.addEventListener("DOMContentLoaded", () => {
	const root = document.getElementById("root");
	if (root === null) {
		alert("Root is not found");
		return;
	}
	createRoot(root).render(<App />);
});

// https://developer.chrome.com/docs/extensions/how-to/ui/favicons
function getFaviconUrl(url: string) {
	const faviconUrl = new URL(chrome.runtime.getURL("/_favicon/"));
	faviconUrl.searchParams.set("pageUrl", url);
	// faviconUrl.searchParams.set("size", "32");
	return faviconUrl.toString();
}
