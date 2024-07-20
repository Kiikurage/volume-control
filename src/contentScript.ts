import { GetVolume, SetGain } from "./message";

const CHECK_INTERVAL = 5000;
const managedMediaElements = new Map<
	HTMLMediaElement,
	{
		source: MediaElementAudioSourceNode;
		element: HTMLMediaElement;
		gain: GainNode;
	}
>();

const audioContext = new AudioContext();

let currentGainValue = 100;
GetVolume.send().then(() => setGain(currentGainValue));

setTimeout(check, CHECK_INTERVAL);
SetGain.addListener((message) => setGain(message.volume));

function check() {
	for (const element of managedMediaElements.keys()) {
		releaseAudio(element);
	}

	for (const element of Array.from(document.querySelectorAll("video, audio"))) {
		captureAudio(element as HTMLMediaElement);
	}
}

function setGain(value: number) {
	currentGainValue = value;
	for (const item of managedMediaElements.values()) {
		item.gain.gain.value = (value / 100) ** 2;
	}
}

function captureAudio(element: HTMLMediaElement) {
	if (managedMediaElements.has(element)) return;

	const gain = audioContext.createGain();
	gain.connect(audioContext.destination);
	gain.gain.value = currentGainValue / 100;

	const source = audioContext.createMediaElementSource(element);
	source.connect(gain);

	managedMediaElements.set(element, { source, element, gain });
}

function releaseAudio(element: HTMLMediaElement) {
	const item = managedMediaElements.get(element);
	if (item === undefined) return;

	item.gain.disconnect();
	item.source.disconnect();

	managedMediaElements.delete(item.element);
}
