/*

* ============================================================
* ANTITHESIS CORE
* Module: metadata-utils.js
* ============================================================
* 
* Extracted metadata utilities from the Antithesis monolith.
* 
* Exports:
* - injectJpegMetadata()
* - extractJpegMetadata()
* 
* Implementation intentionally preserved from source-of-truth.
* ============================================================
  */

// Menyuntikkan konfigurasi metadata asimilasi ke biner gambar JPEG secara terenkripsi
function injectJpegMetadata(base64Image, metadataObj) {
if (!base64Image || typeof base64Image !== 'string' || !base64Image.startsWith('data:')) {
return base64Image;
}

try {
if (base64Image.length > 5 * 1024 * 1024) {
return base64Image;
}

const parts = base64Image.split(',');
const mimeType = parts[0].split(':')[1].split(';')[0];
const rawBinaryString = atob(parts[1]);
const len = rawBinaryString.length;
const bytes = new Uint8Array(len);

for (let i = 0; i < len; i++) {
  bytes[i] = rawBinaryString.charCodeAt(i);
}

const encoder = new TextEncoder();
const metadataString = `\n/*ANTITHESIS_METADATA_START*/${JSON.stringify(metadataObj)}/*ANTITHESIS_METADATA_END*/`;
const metadataBytes = encoder.encode(metadataString);

const combinedBytes = new Uint8Array(bytes.length + metadataBytes.length);
combinedBytes.set(bytes, 0);
combinedBytes.set(metadataBytes, bytes.length);

let binary = '';
const chunk = 8192;

for (let i = 0; i < combinedBytes.length; i += chunk) {
  binary += String.fromCharCode.apply(
    null,
    combinedBytes.subarray(i, i + chunk)
  );
}

return `data:${mimeType};base64,${btoa(binary)}`;

} catch (err) {
console.error("Gagal menyuntikkan metadata JPEG:", err);
return base64Image;
}
}

// Mengekstrak metadata asimilasi dari gambar terunggah
function extractJpegMetadata(base64Image) {
if (!base64Image || typeof base64Image !== 'string' || !base64Image.startsWith('data:')) {
return null;
}

try {
const parts = base64Image.split(',');
const rawBinaryString = atob(parts[1]);
const len = rawBinaryString.length;
const bytes = new Uint8Array(len);

for (let i = 0; i < len; i++) {
  bytes[i] = rawBinaryString.charCodeAt(i);
}

const decoder = new TextDecoder();
const fullText = decoder.decode(bytes);

const startTag = "/*ANTITHESIS_METADATA_START*/";
const endTag = "/*ANTITHESIS_METADATA_END*/";
const startIndex = fullText.lastIndexOf(startTag);
const endIndex = fullText.lastIndexOf(endTag);

if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
  const jsonString = fullText.substring(
    startIndex + startTag.length,
    endIndex
  );

  return JSON.parse(jsonString);
}

} catch (err) {
console.error("Gagal mengekstrak metadata JPEG:", err);
}

return null;
}

// ============================================================
// EXPORTS
// ============================================================

return {
injectJpegMetadata,
extractJpegMetadata
};