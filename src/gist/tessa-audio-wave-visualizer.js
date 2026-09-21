// ===================================================
// AUDIO WAVE VISUALIZER (TESSA PREMIUM UI v3 - Gist Ready)
// ===================================================

return function AudioWaveVisualizer({ audioElement, isPlaying }) {
  const { useRef, useEffect } = React;
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (!audioElement || !isPlaying) return;

    // ===================================================
    // SINGLETON AUDIO CONTEXT
    // ===================================================
    if (!audioElement.audioContext) {
      const AudioContext =
        window.AudioContext || window.webkitAudioContext;

      audioElement.audioContext = new AudioContext();

      audioElement.analyser =
        audioElement.audioContext.createAnalyser();

      audioElement.source =
        audioElement.audioContext.createMediaElementSource(audioElement);

      audioElement.source.connect(audioElement.analyser);
      audioElement.analyser.connect(
        audioElement.audioContext.destination
      );
    }

    if (audioElement.audioContext.state === "suspended") {
      audioElement.audioContext.resume();
    }

    const analyser = audioElement.analyser;

    // ===================================================
    // TIME DOMAIN SETTINGS
    // ===================================================
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.88;

    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    let phase = 0;
    let smoothVolume = 0;

    // Threshold untuk memotong noise/sisa sinyal audio TTS
    const SILENCE_THRESHOLD = 0.008; 

    const drawVisualizer = () => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const draw = () => {
        if (!isPlaying) return;

        animationFrameRef.current =
          requestAnimationFrame(draw);

        // Responsive
        if (
          canvas.width !== canvas.offsetWidth ||
          canvas.height !== canvas.offsetHeight
        ) {
          canvas.width = canvas.offsetWidth;
          canvas.height = canvas.offsetHeight;
        }

        if (
          canvas.width === 0 ||
          canvas.height === 0
        )
          return;

        analyser.getByteTimeDomainData(dataArray);

        // ===================================================
        // RMS VOLUME
        // ===================================================
        let rms = 0;

        for (let i = 0; i < bufferLength; i++) {
          const sample =
            (dataArray[i] - 128) / 128;

          rms += sample * sample;
        }

        rms = Math.sqrt(rms / bufferLength);

        // Noise Gate: Jika di bawah threshold, anggap volume 0 (Flat)
        let targetVolume = rms < SILENCE_THRESHOLD ? 0 : rms;

        // Transisi interpolasi yang responsif (~100ms) untuk menghindari patah
        smoothVolume += (targetVolume - smoothVolume) * 0.38;

        let volume = Math.min(smoothVolume * 7.5, 1.2);

        ctx.clearRect(
          0,
          0,
          canvas.width,
          canvas.height
        );

        // Dynamic glow & alpha ikut mengecil ke 0 saat hening
        const glow = volume > 0 ? 2 + volume * 10 : 0;
        const alpha = Math.min(0.40 + volume * 0.55, 1);

        // ===================================================
        // PREMIUM WAVE (Optimized Frequency & Adaptive Amplitude)
        // ===================================================
        const drawWave = (
          color,
          amplitude,
          offset,
          width
        ) => {
          ctx.beginPath();

          ctx.lineWidth = width;
          ctx.strokeStyle = color;

          ctx.lineCap = "round";
          ctx.lineJoin = "round";

          // Matikan shadow jika volume benar-benar 0 untuk kebersihan visual
          if (volume > 0) {
            ctx.shadowBlur = glow;
            ctx.shadowColor = color;
          } else {
            ctx.shadowBlur = 0;
          }

          const center =
            canvas.height / 2;

          const maxAmp =
            canvas.height *
            0.18 *
            amplitude *
            volume;

          const waveLength =
            canvas.width / 3.2;

          for (
            let x = 0;
            x <= canvas.width;
            x += 2
          ) {
            const t =
              x / waveLength;

            const envelope =
              Math.sin(
                (x / canvas.width) *
                  Math.PI
              );

            // Kombinasi fungsi sin harmonis
            const primaryWave = Math.sin(t * Math.PI * 2 + phase + offset);
            const secondaryRipple = Math.sin(t * Math.PI * 4.5 - phase * 0.8 + offset) * 0.35;

            // Jika volume = 0, perkalian ini otomatis menghasilkan 0 (Garis lurus sempurna)
            const y =
              center +
              (primaryWave + secondaryRipple) *
                maxAmp *
                envelope;

            if (x === 0)
              ctx.moveTo(x, y);
            else
              ctx.lineTo(x, y);
          }

          ctx.stroke();
        };

        // ===================================================
        // COLOR LAYERS (Tetap 3 Garis Tunggal, Lebih Dinamis)
        // ===================================================

        // Menggunakan conditional alpha: jika volume 0, opacity layer ikut diturunkan perlahan
        const currentAlpha = volume > 0 ? alpha : alpha * 0.4;

        drawWave(
          `rgba(217,119,6,${currentAlpha * 0.55})`,
          0.75,
          0,
          1.2
        );

        drawWave(
          `rgba(245,158,11,${currentAlpha})`,
          1.0,
          Math.PI / 3,
          1.8
        );

        drawWave(
          `rgba(168,85,247,${currentAlpha * 0.75})`,
          0.6,
          Math.PI * 0.8,
          1.1
        );

        // Hanya gerakkan fase jika memang ada aktivitas suara
        if (volume > 0.001) {
          phase -= 0.015 + volume * 0.05;
        }
      };

      draw();
    };

    drawVisualizer();

    // ==========================
    // CLEANUP
    // ==========================
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioElement, isPlaying]);

  // ==========================
  // CANVAS (React Vanilla / Plain JS)
  // ==========================
  return React.createElement("canvas", {
    ref: canvasRef,
    className: "absolute inset-0 w-full h-full pointer-events-none",
    style: {
      width: "100%",
      height: "100%",
      opacity: 1,
      transition: "opacity .35s ease",
    },
  });
};
