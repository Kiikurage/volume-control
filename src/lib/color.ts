const getContext = (() => {
	let context: CanvasRenderingContext2D | null = null;
	return () => {
		if (context === null) {
			const canvas = document.createElement("canvas");
			context = canvas.getContext("2d");
		}
		return context;
	};
})();

function imageToUint8Array(image: HTMLImageElement): Uint8ClampedArray {
	const context = getContext();
	if (context === null) {
		throw new Error("CanvasRenderingContext2D is null");
	}

	context.canvas.width = image.width;
	context.canvas.height = image.height;
	context.clearRect(0, 0, image.width, image.height);
	context.drawImage(image, 0, 0);

	const imageData = context.getImageData(0, 0, image.width, image.height);
	return imageData.data;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
	const normalizedR = r / 255;
	const normalizedG = g / 255;
	const normalizedB = b / 255;

	const max = Math.max(normalizedR, normalizedG, normalizedB);
	const min = Math.min(normalizedR, normalizedG, normalizedB);
	let h = 0;
	let s = 0;
	const l = (max + min) / 2;

	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

		switch (max) {
			case normalizedR:
				h =
					(normalizedG - normalizedB) / d + (normalizedG < normalizedB ? 6 : 0);
				break;
			case normalizedG:
				h = (normalizedB - normalizedR) / d + 2;
				break;
			case normalizedB:
				h = (normalizedR - normalizedG) / d + 4;
				break;
		}

		h /= 6;
	}

	return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
	let r = 0;
	let g = 0;
	let b = 0;

	if (s === 0) {
		r = g = b = l;
	} else {
		const hue2rgb = (p: number, q: number, _t: number) => {
			let t = _t;
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		};

		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}

	return [r * 255, g * 255, b * 255];
}

/**
 * Compute the key color as follows:
 * 1. count the frequency of each color.
 * 2. Repeat follow routine until pick 8 colors.
 * 2.1. find the most frequent color and let it as primary color
 * 2.2. remove similar colors from the list. Here, similar means close in RGB color space.
 * 3. From the 8 colors, pick the most frequent color as the key color.
 * 4. Add white(#fff) and black(#000) to the list.
 * 5. From other 9 colors, pick the most opposite color from the key color as the secondary color.
 * 6. return primary and secondary colors.
 * @param image
 */
export function computePalette(image: HTMLImageElement): [string, string] {
	const data = imageToUint8Array(image);
	const colorMap = new Map<number, number>();
	for (let i = 0; i < data.length; i += 4) {
		const a = data[i + 3];
		if (a === 0) continue;

		const r = data[i];
		const g = data[i + 1];
		const b = data[i + 2];

		const [h, s, l] = rgbToHsl(r, g, b);

		// ignore colors that is close to white or black
		if (l < 0.1 || l > 0.9) continue;

		const key = (r << 16) | (g << 8) | b;
		colorMap.set(key, (colorMap.get(key) ?? 0) + 1);
	}

	const colors = Array.from(colorMap.entries())
		.sort((a, b) => b[1] - a[1])
		.map(([key]) => {
			const r = (key >> 16) & 0xff;
			const g = (key >> 8) & 0xff;
			const b = key & 0xff;
			return { r, g, b };
		});

	const primaryColor = colors[0];
	const primary = toColorCode(primaryColor.r, primaryColor.g, primaryColor.b);

	colors.push({ r: 255, g: 255, b: 255 });
	colors.push({ r: 0, g: 0, b: 0 });

	const secondaryColor = colors.sort((a, b) => {
		const aDiff =
			Math.abs(a.r - primaryColor.r) +
			Math.abs(a.g - primaryColor.g) +
			Math.abs(a.b - primaryColor.b);
		const bDiff =
			Math.abs(b.r - primaryColor.r) +
			Math.abs(b.g - primaryColor.g) +
			Math.abs(b.b - primaryColor.b);
		return -(aDiff - bDiff);
	})[0];
	const secondary = toColorCode(
		secondaryColor.r,
		secondaryColor.g,
		secondaryColor.b,
	);

	return [primary, secondary];
}

export function toColorCode(r: number, g: number, b: number): string {
	return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b
		.toString(16)
		.padStart(2, "0")}`;
}
