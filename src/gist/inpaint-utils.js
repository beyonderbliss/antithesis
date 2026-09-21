// ===================================================
// ANTITHESIS CORE
// Module: inpaint-utils.js
// ===================================================


function createManualInpaintVisualCue(originalSrc, maskDataUrl) {
  return new Promise((resolve, reject) => {
    const originalImg = new Image();
    const maskImg = new Image();
    originalImg.crossOrigin = "anonymous";
    maskImg.crossOrigin = "anonymous";
    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount !== 2) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = originalImg.naturalWidth || originalImg.width;
        canvas.height = originalImg.naturalHeight || originalImg.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context tidak tersedia."));
          return;
        }
        ctx.drawImage(originalImg, 0, 0, canvas.width, canvas.height);
        const maskCanvas = document.createElement("canvas");
        maskCanvas.width = canvas.width;
        maskCanvas.height = canvas.height;
        const maskCtx = maskCanvas.getContext("2d");
        if (!maskCtx) {
          reject(new Error("Mask canvas context tidak tersedia."));
          return;
        }
        maskCtx.drawImage(maskImg, 0, 0, canvas.width, canvas.height);
        const maskPixels = maskCtx.getImageData(0, 0, canvas.width, canvas.height);
        const overlay = ctx.createImageData(canvas.width, canvas.height);
        for (let i = 0; i < maskPixels.data.length; i += 4) {
          const maskValue = maskPixels.data[i];
          if (maskValue > 30) {
            overlay.data[i] = 255;
            overlay.data[i + 1] = 0;
            overlay.data[i + 2] = 255;
            overlay.data[i + 3] = 170;
          } else {
            overlay.data[i] = 0;
            overlay.data[i + 1] = 0;
            overlay.data[i + 2] = 0;
            overlay.data[i + 3] = 0;
          }
        }
        ctx.putImageData(overlay, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        reject(err);
      }
    };
    originalImg.onload = checkLoaded;
    maskImg.onload = checkLoaded;
    originalImg.onerror = () => reject(new Error("Gagal membaca original image."));
    maskImg.onerror = () => reject(new Error("Gagal membaca mask image."));
    originalImg.src = originalSrc;
    maskImg.src = maskDataUrl;
  });
}


function createGeminiCompositeMask(originalSrc, maskDataUrl) {
  return new Promise((resolve, reject) => {
    if (!originalSrc || !maskDataUrl) {
      reject(new Error('Composite mask membutuhkan original image dan mask.'));
      return;
    }
    const originalImg = new Image();
    const maskImg = new Image();
    originalImg.crossOrigin = 'anonymous';
    maskImg.crossOrigin = 'anonymous';
    let loaded = 0;
    const checkLoaded = () => {
      loaded++;
      if (loaded !== 2) return;
      try {
        const width = originalImg.naturalWidth || originalImg.width;
        const height = originalImg.naturalHeight || originalImg.height;
        const maskWidth = maskImg.naturalWidth || maskImg.width;
        const maskHeight = maskImg.naturalHeight || maskImg.height;
        if (!width || !height) throw new Error('Dimensi original image tidak valid.');
        if (!maskWidth || !maskHeight) throw new Error('Dimensi mask tidak valid.');
        if (maskWidth !== width || maskHeight !== height) {
          throw new Error(`Dimension mismatch: original=${width}x${height}, mask=${maskWidth}x${maskHeight}`);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D context tidak tersedia.');
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(originalImg, 0, 0, width, height);
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = width;
        maskCanvas.height = height;
        const maskCtx = maskCanvas.getContext('2d');
        if (!maskCtx) throw new Error('Mask canvas context tidak tersedia.');
        maskCtx.clearRect(0, 0, width, height);
        maskCtx.drawImage(maskImg, 0, 0, width, height);
        const maskPixels = maskCtx.getImageData(0, 0, width, height);
        const overlay = document.createElement('canvas');
        overlay.width = width;
        overlay.height = height;
        const overlayCtx = overlay.getContext('2d');
        if (!overlayCtx) throw new Error('Overlay canvas context tidak tersedia.');
        const overlayPixels = overlayCtx.createImageData(width, height);
        let highlightedPixels = 0;
        for (let i = 0; i < maskPixels.data.length; i += 4) {
          const r = maskPixels.data[i];
          const g = maskPixels.data[i + 1];
          const b = maskPixels.data[i + 2];
          const a = maskPixels.data[i + 3];
          const brightness = (r + g + b) / 3;
          if (a > 0 && brightness > 127) {
            overlayPixels.data[i] = 255;
            overlayPixels.data[i + 1] = 0;
            overlayPixels.data[i + 2] = 0;
            overlayPixels.data[i + 3] = 150;
            highlightedPixels++;
          }
        }
        overlayCtx.putImageData(overlayPixels, 0, 0);
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.drawImage(overlay, 0, 0, width, height);
        ctx.restore();
        if (highlightedPixels === 0) throw new Error('Canonical mask tidak memiliki area putih/target.');
        const compositeDataUrl = canvas.toDataURL('image/png');
        if (!compositeDataUrl) throw new Error('Composite PNG gagal dibuat.');
        resolve(compositeDataUrl);
      } catch (err) {
        reject(err);
      }
    };
    originalImg.onload = checkLoaded;
    maskImg.onload = checkLoaded;
    originalImg.onerror = () => reject(new Error('Gagal membaca original image.'));
    maskImg.onerror = () => reject(new Error('Gagal membaca canonical mask.'));
    originalImg.src = originalSrc;
    maskImg.src = maskDataUrl;
  });
}


function applyProfessionalInpaintBlending(originalSrc, geminiSrc, maskDataUrl) {
  return new Promise((resolve, reject) => {
    const originalImg = new Image();
    const geminiImg = new Image();
    const maskImg = new Image();
    originalImg.crossOrigin = "anonymous";
    geminiImg.crossOrigin = "anonymous";
    maskImg.crossOrigin = "anonymous";
    let loadedCount = 0;
    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount === 3) {
        try {
          const finalCanvas = document.createElement('canvas');
          const ctx = finalCanvas.getContext('2d');
          finalCanvas.width = originalImg.width;
          finalCanvas.height = originalImg.height;
          ctx.drawImage(originalImg, 0, 0);
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          tempCanvas.width = originalImg.width;
          tempCanvas.height = originalImg.height;
          tempCtx.filter = 'blur(14px)';
          tempCtx.drawImage(maskImg, 0, 0, originalImg.width, originalImg.height);
          tempCtx.globalCompositeOperation = 'source-in';
          tempCtx.filter = 'none';
          tempCtx.drawImage(geminiImg, 0, 0, originalImg.width, originalImg.height);
          ctx.drawImage(tempCanvas, 0, 0);
          resolve(finalCanvas.toDataURL('image/jpeg', 1.0));
        } catch (e) {
          reject(e);
        }
      }
    };
    originalImg.onload = checkAllLoaded;
    originalImg.onerror = reject;
    geminiImg.onload = checkAllLoaded;
    geminiImg.onerror = reject;
    maskImg.onload = checkAllLoaded;
    maskImg.onerror = reject;
    originalImg.src = originalSrc;
    geminiImg.src = geminiSrc;
    maskImg.src = maskDataUrl;
  });
}


function generateAutoMaskOnHiddenCanvas(originalSrc, normalizedBox) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const naturalWidth = img.naturalWidth || img.width;
        const naturalHeight = img.naturalHeight || img.height;
        if (!naturalWidth || !naturalHeight) {
          reject(new Error('Natural image dimension tidak valid.'));
          return;
        }
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = naturalWidth;
        maskCanvas.height = naturalHeight;
        const ctx = maskCanvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context tidak tersedia.'));
          return;
        }
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
        const ymin = normalizedBox[0] <= 1 ? normalizedBox[0] * naturalHeight : (normalizedBox[0] / 1000) * naturalHeight;
        const xmin = normalizedBox[1] <= 1 ? normalizedBox[1] * naturalWidth : (normalizedBox[1] / 1000) * naturalWidth;
        const ymax = normalizedBox[2] <= 1 ? normalizedBox[2] * naturalHeight : (normalizedBox[2] / 1000) * naturalHeight;
        const xmax = normalizedBox[3] <= 1 ? normalizedBox[3] * naturalWidth : (normalizedBox[3] / 1000) * naturalWidth;
        const rectW = xmax - xmin;
        const rectH = ymax - ymin;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(xmin, ymin, rectW, rectH);
        resolve(maskCanvas.toDataURL('image/png'));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = reject;
    img.src = originalSrc;
  });
}


return {
  createManualInpaintVisualCue,
  createGeminiCompositeMask,
  applyProfessionalInpaintBlending,
  generateAutoMaskOnHiddenCanvas
};