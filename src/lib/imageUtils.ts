import { decode } from 'blurhash';

export const renderBlurHash = (canvas: HTMLCanvasElement, hash: string): void => {
    if (!canvas || !hash) return;

    const width = 32;
    const height = 32;

    try {
        const pixels = decode(hash, width, height);

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        const imageData = ctx!.createImageData(width, height);
        imageData.data.set(pixels);
        ctx!.putImageData(imageData, 0, 0);
    } catch (e) {
        console.error("BlurHash decode error:", e);
    }
};

export const handleImageLoad = (imgElement: HTMLImageElement, canvasElement: HTMLCanvasElement | null): void => {
    imgElement.classList.remove('opacity-0');
    if (canvasElement) {
        setTimeout(() => {
            canvasElement.style.opacity = '0';
        }, 500);
    }
};

export const applyBlurToStaticImage = (imgId: string, imageUrl: string, blurHash: string): void => {
    const imgElement = document.getElementById(imgId) as HTMLImageElement | null;
    if (!imgElement) return;

    imgElement.src = imageUrl;

    if (!blurHash) {
        imgElement.classList.remove('opacity-0');
        return;
    }

    imgElement.classList.add('opacity-0', 'transition-opacity', 'duration-700', 'z-10', 'relative');

    const parent = imgElement.parentElement;
    if (parent) {
        if (getComputedStyle(parent).position === 'static') {
            parent.classList.add('relative');
        }
        parent.classList.add('overflow-hidden');

        let canvas = parent.querySelector(`#canvas-${imgId}`) as HTMLCanvasElement | null;
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = `canvas-${imgId}`;
            canvas.className = 'absolute inset-0 w-full h-full object-cover z-0';

            imgElement.before(canvas);
        }

        renderBlurHash(canvas, blurHash);

        const onImageLoad = () => handleImageLoad(imgElement, canvas);

        if (imgElement.complete && imgElement.naturalHeight !== 0) {
            onImageLoad();
        } else {
            imgElement.onload = onImageLoad;
        }
    }
};
