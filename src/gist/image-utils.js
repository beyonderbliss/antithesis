// ===================================================
// ANTITHESIS CORE
// Module: image-utils.js
// ===================================================

return {
  getImageMimeAndData(imgStr) {
    if (
      !imgStr ||
      typeof imgStr !== 'string' ||
      !imgStr.startsWith('data:')
    ) {
      return null;
    }

    try {
      const parts = imgStr.split(',');
      const mimeType = parts[0].split(':')[1].split(';')[0];
      const data = parts[1];

      return {
        mimeType,
        data
      };
    } catch (e) {
      console.error(
        "Gagal melakukan parse image data string:",
        e
      );

      return null;
    }
  }
};