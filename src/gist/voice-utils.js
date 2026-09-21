/*
 * ============================================================
 * ANTITHESIS CORE
 * Module: voice-utils.js
 * ============================================================
 *
 * Extracted voice/audio utility from the Antithesis monolith.
 *
 * Exports:
 * - pcmToWavUrl()
 *
 * Implementation intentionally preserved from source-of-truth.
 * ============================================================
 */

// Mengubah raw PCM base64 menjadi WAV Blob URL
function pcmToWavUrl(base64Pcm) {
  const binaryString = atob(base64Pcm);
  const len = binaryString.length;
  const pcmData = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    pcmData[i] = binaryString.charCodeAt(i);
  }

  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate =
    sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign =
    numChannels * (bitsPerSample / 8);

  const buffer = new ArrayBuffer(44 + pcmData.length);
  const view = new DataView(buffer);

  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(
        offset + i,
        string.charCodeAt(i)
      );
    }
  };

  writeString(0, "RIFF");
  view.setUint32(
    4,
    36 + pcmData.length,
    true
  );
  writeString(8, "WAVE");
  writeString(12, "fmt ");

  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(
    22,
    numChannels,
    true
  );
  view.setUint32(
    24,
    sampleRate,
    true
  );
  view.setUint32(
    28,
    byteRate,
    true
  );
  view.setUint16(
    32,
    blockAlign,
    true
  );
  view.setUint16(
    34,
    bitsPerSample,
    true
  );

  writeString(36, "data");

  view.setUint32(
    40,
    pcmData.length,
    true
  );

  const pcm16 = new Int16Array(
    pcmData.buffer
  );

  for (let i = 0; i < pcm16.length; i++) {
    view.setInt16(
      44 + i * 2,
      pcm16[i],
      true
    );
  }

  const wavBlob = new Blob(
    [buffer],
    { type: "audio/wav" }
  );

  return URL.createObjectURL(wavBlob);
}

return {
  pcmToWavUrl
};