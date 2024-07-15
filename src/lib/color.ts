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
