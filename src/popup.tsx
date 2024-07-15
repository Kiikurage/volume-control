import { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
	GetItemList,
	type Item,
	OnItemCreate,
	OnItemDelete,
	OnItemUpdate,
	SetVolume,
	StartCapture,
} from "./message";

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
					onActivateTab={async () => {
						chrome.tabs.update(item.tabId, { active: true });
					}}
				/>
			))}
		</div>
	);
};

const Control = ({
	item,
	onVolumeChange,
	onActivateTab,
}: {
	item: Item;
	onVolumeChange: (volume: number) => void;
	onActivateTab: () => void;
}) => {
	const hostname = new URL(item.url).host;
	const tld = hostname.split(".").slice(-2).join(".");
	const disabled = !item.active && item.volume === -1;

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
			}}
		>
			<img
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
					fontSize: item.volume === -1 ? "1em" : "1.5em",
					color: item.volume === -1 ? "#a0a0a0" : "#4b8825",
					fontWeight: item.volume === -1 ? "normal" : "bold",
				}}
			>
				{item.volume !== -1 ? `${item.volume.toFixed(1)}%` : "無調整"}
			</span>

			{disabled ? (
				<button
					type="button"
					onClick={onActivateTab}
					css={{
						gridArea: "slider",
						border: "none",
						background: "none",
						cursor: "pointer",
						height: "30px",
						borderRadius: "4px",
						display: "inline-block",
						width: "min-content",
						padding: "0 8px",
						marginLeft: "-8px",
						alignItems: "center",
						justifyContent: "center",
						"&:hover": {
							background: "rgba(0,0,0,0.05)",
						},
						"&:active": {
							background: "rgba(0,0,0,0.15)",
						},
					}}
				>
					タブを開いて音量調整を開始
				</button>
			) : (
				<input
					type="range"
					min={0}
					max={600}
					css={{
						"--color": "#282828",
						gridArea: "slider",
						display: "block",
						margin: 0,
						padding: "8px 0",
						appearance: "none",
						outline: "none",
						"&::-webkit-slider-runnable-track": {
							"--percentage": `${((item.volume === -1 ? 100 : item.volume) / 600) * 100}%`,
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
			)}
		</div>
	);
};

function useItems() {
	const [items, setItems] = useState<Item[]>([]);

	useEffect(() => {
		GetItemList.send().then((items) => {
			if (items === undefined) return;
			setItems(items);
		});
	}, []);

	useEffect(() => {
		const callback = (item: Item) => {
			setItems((items) => {
				return [...items, item];
			});
		};

		OnItemCreate.addListener(callback);
		return () => OnItemCreate.removeListener(callback);
	}, []);

	useEffect(() => {
		const callback = (item: Item) => {
			setItems((items) => {
				return items.map((i) => (i.tabId === item.tabId ? item : i));
			});
		};

		OnItemUpdate.addListener(callback);
		return () => OnItemUpdate.removeListener(callback);
	}, []);

	useEffect(() => {
		const callback = ({ tabId }: { tabId: number }) => {
			setItems((items) => {
				return items.filter((i) => i.tabId !== tabId);
			});
		};

		OnItemDelete.addListener(callback);
		return () => OnItemDelete.removeListener(callback);
	}, []);

	const setVolume = useCallback(
		async (tabId: number, volume: number) => {
			const item = items.find((i) => i.tabId === tabId);
			if (item === undefined) {
				return;
			}

			if (item.volume === -1) {
				await StartCapture.send(item.tabId);
			}

			SetVolume.send({ tabId: item.tabId, volume });
			setItems((items) => {
				return items.map((i) => (i.tabId === tabId ? { ...i, volume } : i));
			});
		},
		[items],
	);

	const filteredItems = useMemo(() => {
		return items
			.filter((item) => item.url.startsWith("http"))
			.filter((item) => item.audible || item.volume !== -1 || item.active);
	}, [items]);

	return { items: filteredItems, setVolume };
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
