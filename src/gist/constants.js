return (React) => {
  return {
    SYSTEM_VERSIONS: [
      {
        version: "v13.2.0 - Manual Inpaint Seamless Blending & Mask Lifecycle",
        date: "Agustus 2026",
        changes: [
          "Fix bug Aspect Ratio dan Menyempurnakan lifecycle Manual Inpaint dengan memisahkan clean original reference, mask editor, dan execution state agar mask tidak lagi menjadi bagian permanen dari asset gambar.",
          "Menambahkan seamless feather blending pada setiap hasil Manual Inpaint menggunakan clean master dan canonical mask sebagai basis compositing.",
          "Memastikan setiap regenerasi Manual Inpaint kembali melakukan blending dari clean master sehingga hasil tidak mengalami chain compositing dari generasi sebelumnya.",
          "Memungkinkan mask/coretan dihapus kembali melalui editor sehingga reference dapat dikembalikan ke kondisi clean tanpa harus memilih atau mengunggah ulang gambar."
        ]
      },
      {
        version: "v13.1.0 - Reference Image Inpainting Feature",
        date: "Agustus 2026",
        changes: ["Menambahkan fitur inpaint terintegrasi langsung pada gambar referensi untuk masking dan pengeditan spesifik."]
      },
      {
        version: "v13.0.0 - Stuff Reference Slot & Syntax Error Hotfix",
        date: "Agustus 2026",
        changes: [
          "Menambahkan slot referensi baru 'Stuff' (properti/aksesoris) dengan instruksi guardrail [ITEM & PROPERTY ANCHOR].",
          "Memperbaiki bug fatal White Screen (crash) akibat terhapusnya struktur pengondisian else-if pada fungsi generateImage.",
          "Mengoptimalkan pemisahan konteks multi-referensi (Identitas, Latar Belakang, Pose/Style, dan Stuff)."
        ]
      }
    ],

    SEMANTIC_CATEGORIES: {
      camera: {
        label: "📷 Hubungan Lensa (Camera Relationship)",
        items: [
          { id: "fully-aware", label: "Fully Aware", desc: "Subjek sadar penuh kamera & menatap langsung" },
          { id: "half-aware", label: "Half-Aware", desc: "Setengah sadar kamera, ekspresi sekilas" },
          { id: "fully-candid", label: "Fully Candid", desc: "Benar-benar candid tanpa menghadap lensa" },
          { id: "mirror-selfie", label: "Mirror Selfie", desc: "Foto pantulan cermin dengan memegang ponsel" },
          { id: "selfie", label: "Selfie Vibe", desc: "Sudut pandang lengan sendiri memegang kamera" },
          { id: "someone-taking-photo", label: "Someone Taking Photo", desc: "Sudut pandang orang lain yang memotret" },
          { id: "security-camera-vibe", label: "Security Camera Vibe", desc: "Sudut tinggi cctv, distorsi agak kasar" },
          { id: "webcam-vibe", label: "Webcam Vibe", desc: "Kualitas kamera laptop datar, pencahayaan layar" },
          { id: "flash-photo", label: "Flash Photo", desc: "Efek jepretan kilat lampu kilat langsung di objek" },
          { id: "screenshot-energy", label: "Screenshot Energy", desc: "Seperti tangkapan layar video call yang terjeda" },
          { id: "timer-photo", label: "Timer Photo", desc: "Foto otomatis dengan jarak jauh pose terburu-buru" },
          { id: "cropped-accidentally", label: "Cropped Accidentally", desc: "Potongan bingkai tidak sempurna di bagian tubuh" },
          { id: "out-of-frame-partially", label: "Out of Frame Partially", desc: "Sebagian subjek keluar dari garis batas bingkai" }
        ]
      },
      emotion: {
        label: "❤️ Suasana Emosi (Emotional Temperature)",
        items: [
          { id: "warm", label: "Warm", desc: "Kehangatan malas, nyaman, bersahabat" },
          { id: "quiet", label: "Quiet", desc: "Hening, sunyi, kontemplasi mendalam" },
          { id: "empty", label: "Empty", desc: "Datar, tatapan kosong tanpa emosi terdefinisi" },
          { id: "intimate", label: "Intimate", desc: "Sangat dekat, romansa tenang, ruang pribadi" },
          { id: "detached", label: "Detached", desc: "Terasing, dingin, jarak emosi yang renggang" },
          { id: "sleepy", label: "Sleepy", desc: "Setengah mengantuk, santai di ranjang/sofa" },
          { id: "awkward", label: "Awkward", desc: "Canggung sosial, pose agak tidak alami" },
          { id: "restless", label: "Restless", desc: "Gelisah, tidak bisa diam, dinamika pose sibuk" },
          { id: "playful", label: "Playful", desc: "Bercanda, jahil, ekspresi wajah ceria tidak serius" },
          { id: "tense", label: "Tense", desc: "Agak tegang, konsentrasi, suasana serius" },
          { id: "lonely", label: "Lonely", desc: "Kesendirian estetis di pojok ruangan" },
          { id: "comfortable-emo", label: "Comfortable", desc: "Nyaman apa adanya, pakaian longgar kasual" },
          { id: "chaotic", label: "Chaotic", desc: "Sedikit berantakan, ekspresi candid super acak" },
          { id: "emotionally-unclear", label: "Emotionally Unclear", desc: "Ambigu, tidak terbaca apakah sedih/senang" },
          { id: "soft", label: "Soft", desc: "Lembut, halus, ekspresi menenang" },
          { id: "unserious", label: "Unserious", desc: "Main-main, pose konyol kasual media sosial" },
          { id: "melancholic", label: "Melancholic", desc: "Melankolis sendu di sore hari" },
          { id: "numb", label: "Numb", desc: "Sangat pasif, lelah, ekspresi tanpa gairah" },
          { id: "affectionate", label: "Affectionate", desc: "Penuh kasih sayang, sentuhan tangan halus" }
        ]
      },
      texture: {
        label: "✨ Tekstur Visual (Visual Texture)",
        items: [
          { id: "raw", label: "Raw Photo", desc: "Foto mentah tanpa filter estetika berat" },
          { id: "clean", label: "Clean", desc: "Bebas noise, penataan furnitur minimalis" },
          { id: "slightly-aesthetic", label: "Slightly Aesthetic", desc: "Estetika indie instagram masa kini" },
          { id: "accidentally-cinematic", label: "Accidentally Cinematic", desc: "Sinematik alami berkat bayangan matahari" },
          { id: "flat-lighting", label: "Flat Lighting", desc: "Cahaya merata tanpa kedalaman kontras" },
          { id: "flash-photo-energy", label: "Flash Photo Energy", desc: "Tekstur bayangan tajam di dinding belakang" },
          { id: "grainy", label: "Grainy ISO", desc: "Butiran halus sensor kamera malam" },
          { id: "overexposed", label: "Overexposed", desc: "Cahaya terlalu terang di beberapa bagian kulit" },
          { id: "slightly-blurry", label: "Slightly Blurry", desc: "Sedikit buram akibat guncangan tangan amatir" },
          { id: "phone-camera-realism", label: "Phone-Camera Realism", desc: "Tekstur kompresi sensor ponsel kelas menengah" },
          { id: "unbalanced-framing", label: "Unbalanced Framing", desc: "Komposisi miring tidak seimbang secara sengaja" },
          { id: "low-light", label: "Low-Light", desc: "Suasana gelap dengan pendaran cahaya seadanya" },
          { id: "harsh-indoor-lighting", label: "Harsh Indoor", desc: "Lampu neon putih langsung dari langit-langit" },
          { id: "soft-daylight", label: "Soft Daylight", desc: "Cahaya pagi masuk dari celah jendela kamar" },
          { id: "casual-realism", label: "Casual Realism", desc: "Detil kehidupan nyata tanpa rekayasa studio" }
        ]
      },
      socialDynamic: {
        label: "👥 Dinamika Sosial (Social Dynamic - Multi-Subject)",
        items: [
          { id: "clingy", label: "Clingy", desc: "Menempel manja, merangkul erat penuh kebergantungan" },
          { id: "comfortable-social", label: "Comfortable Together", desc: "Nyaman bersama tanpa canggung, santai bertumpu" },
          { id: "distant", label: "Distant", desc: "Berjarak dingin, ada sekat emosional yang terasa" },
          { id: "uneven-attention", label: "Uneven Attention", desc: "Perhatian berat sebelah, salah satu fokus ke ponsel" },
          { id: "quiet-coexistence", label: "Quiet Coexistence", desc: "Hening bersama, masing-masing sibuk dengan pikirannya" },
          { id: "teasing", label: "Teasing", desc: "Saling meledek jahil, cubitan kecil, tertawa riang" },
          { id: "soft-romance", label: "Soft Romance", desc: "Sentuhan lembut intim, tatapan penuh kasih sayang" },
          { id: "friendship-energy", label: "Friendship Energy", desc: "Energi persahabatan kausal, pose ceria konyol" },
          { id: "socially-awkward", label: "Socially Awkward", desc: "Pose agak kaku canggung saat berdekatan" },
          { id: "emotionally-mismatched", label: "Emotionally Mismatched", desc: "Ekspresi berbeda kontras (satu ceria, satu datar lelah)" },
          { id: "protective", label: "Protective", desc: "Satu subjek merengkuh melindungi subjek lainnya" },
          { id: "possessive", label: "Possessive", desc: "Dekapan posesif, genggaman protektif yang tegas" },
          { id: "bored-together", label: "Bored Together", desc: "Bosan bersama, merebah lesu di sofa kosong" },
          { id: "chaotic-duo", label: "Chaotic Duo", desc: "Sangat acak, pose gila candid yang berantakan" },
          { id: "one-sided-attention", label: "One-Sided Attention", desc: "Satu subjek menatap lekat, yang lain abai menatap arah lain" }
        ]
      },
      intensity: {
        label: "🔥 Intensitas Emosional & Visual (Intensity)",
        items: [
          { id: "extremely-subtle", label: "Extremely Subtle", desc: "Sangat tipis, hampir tidak terlihat, natural murni" },
          { id: "low-key", label: "Low-Key", desc: "Santai, tidak menonjol, suasana kasual sehari-hari" },
          { id: "emotionally-noticeable", label: "Emotionally Noticeable", desc: "Emosi terasa kental saat dipandang" },
          { id: "visually-striking", label: "Visually Striking", desc: "Kontras visual tinggi, membetot perhatian mata" },
          { id: "strange-believable", label: "Strange but Believable", desc: "Agak aneh/unik namun terasa sangat rill terjadi" },
          { id: "socially-loud", label: "Socially Loud", desc: "Sangat ekspresif, berani, suasana ramai mencolok" },
          { id: "quietly-intense", label: "Quietly Intense", desc: "Senyap namun memiliki kedalaman emosi yang menusuk" }
        ]
      },
      internetEnergy: {
        label: "🌐 Energi & Vibe Internet (Internet Energy)",
        items: [
          { id: "small-private", label: "Small Private Account", desc: "Kualitas foto akun privat terkunci, sangat kasual" },
          { id: "story-post", label: "Story Post Energy", desc: "Vibe jepretan instan Instagram Story 24 jam" },
          { id: "old-facebook", label: "Old Facebook Vibe", desc: "Estetika foto unggahan Facebook lama tahun 2012an" },
          { id: "dump-account", label: "Dump Account", desc: "Foto acak dari galeri pembuangan sampah memori" },
          { id: "late-night", label: "Late-Night Upload", desc: "Unggahan larut malam, agak redup, syahdu sunyi" },
          { id: "couple-spam", label: "Couple Spam Post", desc: "Spam foto kebersamaan pasangan kasual tanpa filter" },
          { id: "mutual-only", label: "Mutual-Only Vibe", desc: "Hanya dibagikan ke lingkaran teman terdekat" },
          { id: "low-effort", label: "Low-Effort Upload", desc: "Tanpa persiapan estetik, asal jepret bernilai rill" },
          { id: "random-archive", label: "Random Archive Photo", desc: "Arsip acak lama yang tersembunyi di folder awan" },
          { id: "viral-accident", label: "Viral-Core Accident", desc: "Ketidaksengajaan momen yang berpotensi ramai di internet" },
          { id: "internet-nostalgia", label: "Internet Nostalgia", desc: "Rasa nostalgia dunia digital awal era ponsel berkamera" },
          { id: "photo-no-reason", label: "Photo Taken for No Reason", desc: "Foto tanpa maksud jelas, mengabadikan kebosanan" }
        ]
      }
    },

    COMPATIBILITY_RULES: {
      socialDynamic: {
        clingy: {
          emotion: { affectionate: 1.0, intimate: 1.0, playful: 0.8, melancholic: 0.6, detached: 0.3, empty: 0.25 },
          camera: { "fully-candid": 1.0, "half-aware": 0.9, selfie: 0.8, "fully-aware": 0.5 }
        },
        disabled: {
          emotion: { detached: 1.0, tense: 0.9, quiet: 0.8, melancholic: 0.7, intimate: 0.4, affectionate: 0.25 },
          camera: { "fully-candid": 1.0, "security-camera-vibe": 0.9, "fully-aware": 0.4 }
        },
        comfortable_social: {
          emotion: { "comfortable-emo": 1.0, sleepy: 0.9, warm: 0.9, quiet: 0.8, playful: 0.8, tense: 0.3 },
          camera: { "fully-candid": 1.0, "half-aware": 0.9, "mirror-selfie": 0.8 }
        },
        socially_awkward: {
          emotion: { awkward: 1.0, quiet: 0.9, tense: 0.8, intimate: 0.6, playful: 0.5 },
          camera: { "half-aware": 1.0, "fully-aware": 0.8, "webcam-vibe": 0.8 }
        }
      }
    },

    GEMINI_SAFETY_SETTINGS: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" }
    ],

    INDONESIAN_LOCALISM_INJECTION: `
[HARD ANCHOR: INDONESIAN REALISM]
Location: Set the scene in a realistic, everyday domestic Indonesian location. Either a cozy but slightly cluttered 'kos-kosan' room (with a single floor mattress, simple walls, a basic wall-mounted fan, and neat but non-curated items), or a simple Indonesian terrace with cement floors, or a simple neighborhood street corner.
Atmosphere: Capture the natural tropical humidity, ambient overhead lights like fluorescent tube lighting or warm low-watt light bulbs, or raw overcast rainy day tropical light filtering through window panes.
Styling: Casual Indonesian daily homewear. Characters wear relaxed, common clothes like a simple t-shirt, tank top, or everyday house-wear. Keep physical features natural, representing realistic Southeast Asian/Indonesian skin tones and features.
Human Spontaneity: DO NOT force stereotypical items like water gallons or plastic chairs unless they fit naturally. Focus on a lived-in, honest, and comforting local atmosphere that feels authentic and completely unstaged.
`,

    SAFETY_BLACKLIST_MAP: {
      "naked": "bare-skinned",
      "nude": "unclad silhouette",
      "sex": "passionate close embrace",
      "porn": "sensual fine art aesthetic",
      "erotic": "deep romantic warmth",
      "vagina": "lower body contours",
      "penis": "male body lines",
      "ass": "curvaceous silhouette",
      "boobs": "gorgeous voluptuous chest lines",
      "breasts": "voluptuous chest lines",
      "bitch": "distant cold woman",
      "fuck": "passionately intimate",
      "rape": "intense dynamic pose",
      "torture": "melancholic quiet expression",
      "kill": "intense gaze",
      "die": "silent static posture"
    },

    PERSONA_WELCOME_MESSAGES: {
      antithesis: "Halo, Senpai! 🎀✨ Aku Antitesis-chan, asisten visual yang siap bantu Senpai bikin foto-foto estetik dan penuh kehangatan berdua! 🥰 Ceritain dong skenario romantis, lucu, atau momen hangat yang lagi ada di kepala Senpai sekarang. Aku bakal dengerin semua imajinasi Senpai dengan penuh semangat! Let's make something beautiful together, Senpai! 💕🌸",
      tessa: "Selamat datang kembali, Tuan Director. ☕ Saya Tessa, asisten visual Anda yang siap mewujudkan arahan artistik dan momen elegan di atas kanvas. Silakan berikan instruksi skenario Anda, dan saya akan memastikannya tersaji dengan sempurna dan penuh estetika. Mari kita ciptakan mahakarya hari ini. 🤍"
    },

    PERSONA_RETURN_MESSAGES: {
      antithesis: "Aku kembali, Senpai! 🎀✨ Maaf ya tadi sempat ditinggal bentar. Yuk, lanjutin lagi obrolan seru kita, aku udah siap dengerin imajinasi manis Senpai berikutnya! 🥰💕",
      tessa: "Saya siap melanjutkan sesi ini, Tuan Director. ☕ Arahan teknis dan estetika Anda tetap tersimpan dengan aman. Silakan berikan instruksi Anda selanjutnya untuk mahakarya kita. 🤍"
    },

    GOOGLE_ASPECT_RATIOS: [
      { label: '1:1 Square', value: '1:1', desc: 'Sempurna untuk media sosial kotak' },
      { label: '3:4 Portrait', value: '3:4', desc: 'Tinggi standar potret (Default)' },
      { label: '4:3 Landscape', value: '4:3', desc: 'Lebar standar lanskap monitor' },
      { label: '9:16 Story/Reels', value: '9:16', desc: 'Sangat vertikal untuk layar ponsel' },
      { label: '16:9 Cinematic', value: '16:9', desc: 'Rasio sinematik layar lebar modern' }
    ],

    CLASSIFICATION_OPTIONS: [
      { key: 'subject', label: '👤 Subjek', color: 'text-rose-400 bg-rose-955/20 border-rose-900/50', desc: 'Mengunci identitas wajah & fisik' },
      { key: 'outfit', label: '👗 Pakaian', color: 'text-indigo-400 bg-indigo-955/20 border-indigo-900/50', desc: 'Hanya menyalin model pakaian & warna busana' },
      { key: 'stuff', label: '♣️ Objek/Benda', color: 'text-cyan-400 bg-cyan-955/20 border-cyan-900/50', desc: 'Hanya menyalin objek, produk, elemen visual khusus, atau benda dalam gambar' },
      { key: 'background', label: '🖼️ Latar', color: 'text-emerald-400 bg-emerald-955/20 border-emerald-900/50', desc: 'Hanya menduplikasi lokasi/latar belakang' },
      { key: 'style', label: '✨ Gaya', color: 'text-amber-400 bg-amber-955/20 border-amber-900/50', desc: 'Hanya mengambil warna, cahaya, & estetika foto' }
    ],

    modeNames: ["Tender", "Romantic", "Passionate"]
  };
}