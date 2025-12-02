import { decode } from 'https://esm.sh/blurhash@2.0.5';

/**
 * BlurHash string'ini çözer ve verilen canvas elementine çizer.
 * @param {HTMLCanvasElement} canvas - Çizim yapılacak canvas elementi
 * @param {string} hash - Sanity'den gelen blurHash stringi
 */
export const renderBlurHash = (canvas, hash) => {
    if (!canvas || !hash) return;

    const width = 32;
    const height = 32;
    
    try {
        const pixels = decode(hash, width, height);
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(width, height);
        imageData.data.set(pixels);
        ctx.putImageData(imageData, 0, 0);
    } catch (e) {
        console.error("BlurHash decode error:", e);
    }
};

/**
 * Resim yüklendiğinde çalışacak geçiş efekti
 */
export const handleImageLoad = (imgElement, canvasElement) => {
    imgElement.classList.remove('opacity-0'); 
    if (canvasElement) {
        setTimeout(() => {
            canvasElement.style.opacity = '0';
        }, 500);
    }
};

/**
 * HTML'de zaten var olan (static) bir img elementine blur efekti uygular.
 * @param {string} imgId - Resmin HTML ID'si (örn: 'loc-image')
 * @param {string} imageUrl - Resmin URL'i
 * @param {string} blurHash - BlurHash stringi
 */
export const applyBlurToStaticImage = (imgId, imageUrl, blurHash) => {
    const imgElement = document.getElementById(imgId);
    if (!imgElement) return;

    // 1. Resmi ata
    imgElement.src = imageUrl;
    
    // Eğer blurHash yoksa direkt göster ve çık
    if (!blurHash) {
        imgElement.classList.remove('opacity-0');
        return;
    }

    // 2. Resmi gizle ve parent ayarla
    imgElement.classList.add('opacity-0', 'transition-opacity', 'duration-700', 'z-10', 'relative');

    const parent = imgElement.parentElement;
    if (parent) {
        // Parent'ın relative olması canvas'ın düzgün durması için şart
        if (getComputedStyle(parent).position === 'static') {
            parent.classList.add('relative');
        }
        parent.classList.add('overflow-hidden');

        // 3. Canvas var mı kontrol et, yoksa oluştur
        let canvas = parent.querySelector(`#canvas-${imgId}`);
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = `canvas-${imgId}`;
            // Canvas tam arkada durmalı
            canvas.className = 'absolute inset-0 w-full h-full object-cover z-0';
            
            // Resmi canvas'ın önüne al (z-index yetmeyebilir, DOM sırası garantisi)
            parent.insertBefore(canvas, imgElement);
        }

        // 4. Blur'u çiz
        renderBlurHash(canvas, blurHash);
        
        // 5. Yükleme tamamlanınca geçiş yap
        const onImageLoad = () => handleImageLoad(imgElement, canvas);

        if (imgElement.complete && imgElement.naturalHeight !== 0) {
            onImageLoad();
        } else {
            imgElement.onload = onImageLoad;
        }
    }
};