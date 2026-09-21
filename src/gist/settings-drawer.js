const SettingsDrawer = (props) => {
  // === PASTIKAN BARIS INI ADA (DESTRUCTURE PROPS) ===
  const {
    showSettings, openSettingsAccordion, setOpenSettingsAccordion,
    customApiKey, tempApiKeyInput, setTempApiKeyInput, showApiKeyPlain, setShowApiKeyPlain,
    handleSaveApiKey, handleClearApiKey, aiOrchestrator, setAiOrchestrator,
    preFlightSafety, setPreFlightSafety, hfToken, setHfToken,
    mainLoadingIcon, chatLoadingIcon, customVoiceGif, headerLogo, selectedFont,
    handleMainIconUpload, handleChatIconUpload, handleVoiceGifUpload,
    handleHeaderLogoUpload, handleHeaderLogoUrlChange, removeMainIcon,
    removeChatIcon, removeVoiceGif, removeHeaderLogo, changeFontFamily,
    addLog, isChatOpen, ANTITHESIS_CONSTANTS,
    // ICONS WAJIB ADA DI SINI:
    Key, Bot, Palette, History, Settings, ChevronUp, ChevronDown, 
    ToggleLeft, ToggleRight, Upload
  } = props;

  const e = React.createElement;

  if (!showSettings) return null;

  return e('div', {
    className: `bg-neutral-955 border-b border-neutral-850 collapse-settings shadow-2xl backdrop-blur-xl z-[90] animate-in slide-in-from-top duration-300 overflow-y-auto ${isChatOpen ? 'fixed top-20 left-0 right-0 max-h-[calc(100vh-80px)]' : 'relative'}`
  },
    e('div', { className: 'max-w-4xl mx-auto p-4 md:p-6 space-y-3 font-sans' },
      
      // HEADER
      e('div', { className: 'flex justify-between items-center pb-2 border-b border-neutral-850' },
        e('span', { className: 'text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5 font-cinzel' },
          e(Settings, { className: 'w-4 h-4 text-rose-500' }), ' SYSTEM CONFIGURATION DRAWER'
        ),
        e('span', { className: 'text-[9px] font-mono font-medium text-neutral-500' }, 'v13.2.0 PRO')
      ),

      // ACCORDION 1: API KEY
      e('div', { className: 'border border-neutral-850 rounded-xl overflow-hidden bg-neutral-900/45' },
        e('button', {
          onClick: () => setOpenSettingsAccordion(openSettingsAccordion === 'apikey' ? '' : 'apikey'),
          className: 'w-full px-4 py-3.5 bg-neutral-900/90 hover:bg-neutral-900 flex items-center justify-between transition-colors border-b border-neutral-850'
        },
          e('div', { className: 'flex items-center gap-2.5' },
            e(Key, { className: 'w-4 h-4 text-amber-400' }),
            e('span', { className: 'text-[11px] font-bold uppercase tracking-wider text-neutral-200' }, '1. Gemini API Key Config')
          ),
          e('div', { className: 'flex items-center gap-2' },
            customApiKey 
              ? e('span', { className: 'bg-green-955/40 text-green-400 border border-green-900/50 text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase' }, 'Personal Key Active')
              : e('span', { className: 'bg-neutral-800 text-neutral-400 text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase' }, 'Runtime Key'),
            openSettingsAccordion === 'apikey' ? e(ChevronUp, { className: 'w-4 h-4 text-neutral-400' }) : e(ChevronDown, { className: 'w-4 h-4 text-neutral-400' })
          )
        ),
        openSettingsAccordion === 'apikey' && e('div', { className: 'p-4 bg-neutral-955/20 text-xs space-y-4' },
          e('div', { className: 'space-y-1.5' },
            e('p', { className: 'text-[11px] font-bold text-neutral-200' }, 'Atur Gemini API Key Pribadi Anda'),
            e('p', { className: 'text-[10px] text-neutral-400 leading-relaxed' }, 'Memasukkan API Key pribadi dari Google AI Studio akan memastikan stabilitas penuh.')
          ),
          e('div', { className: 'flex flex-col sm:flex-row gap-2' },
            e('div', { className: 'relative flex-1' },
              e('input', {
                type: showApiKeyPlain ? "text" : "password",
                value: tempApiKeyInput,
                onChange: (ev) => setTempApiKeyInput(ev.target.value),
                placeholder: "Masukkan AI Studio Gemini API Key (AIzaSy...)",
                className: "w-full bg-neutral-955 border border-neutral-800 focus:border-rose-500 rounded-lg px-3 py-2.5 text-xs text-neutral-200 font-mono placeholder-neutral-750 outline-none"
              }),
              tempApiKeyInput && e('button', {
                type: "button",
                onClick: () => setShowApiKeyPlain(!showApiKeyPlain),
                className: "absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 font-mono text-[9px] font-bold uppercase"
              }, showApiKeyPlain ? "Sembunyikan" : "Lihat")
            ),
            e('div', { className: 'flex gap-2 shrink-0' },
              e('button', { onClick: handleSaveApiKey, className: "px-4 py-2.5 bg-rose-500 hover:bg-rose-400 text-[#0b0b0f] font-bold rounded-lg text-xs" }, "Simpan Key"),
              customApiKey && e('button', { onClick: handleClearApiKey, className: "px-3 py-2.5 bg-neutral-900 border border-neutral-800 text-red-400 hover:text-red-300 font-bold rounded-lg text-xs" }, "Hapus")
            )
          )
        )
      ),

      // ACCORDION 2: AI ORCHESTRATOR
      e('div', { className: 'border border-neutral-850 rounded-xl overflow-hidden bg-neutral-900/45' },
        e('button', {
          onClick: () => setOpenSettingsAccordion(openSettingsAccordion === 'orchestrator' ? '' : 'orchestrator'),
          className: 'w-full px-4 py-3.5 bg-neutral-900/90 hover:bg-neutral-900 flex items-center justify-between transition-colors border-b border-neutral-850'
        },
          e('div', { className: 'flex items-center gap-2.5' },
            e(Bot, { className: 'w-4 h-4 text-purple-400' }),
            e('span', { className: 'text-[11px] font-bold uppercase tracking-wider text-neutral-200' }, '3. AI Orchestrator Suite')
          ),
          e('div', { className: 'flex items-center gap-2' },
            e('span', { className: `w-2 h-2 rounded-full ${aiOrchestrator ? 'bg-purple-500 shadow-md shadow-purple-500/80 animate-pulse' : 'bg-neutral-700'}` }),
            openSettingsAccordion === 'orchestrator' ? e(ChevronUp, { className: 'w-4 h-4 text-neutral-400' }) : e(ChevronDown, { className: 'w-4 h-4 text-neutral-400' })
          )
        ),
        openSettingsAccordion === 'orchestrator' && e('div', { className: 'p-4 bg-neutral-955/20 text-xs space-y-4' },
          e('div', { className: 'flex items-center justify-between border-b border-neutral-800 pb-3' },
            e('div', { className: 'pr-4' },
              e('p', { className: 'text-[11px] font-bold text-neutral-200' }, 'AI Orchestrator'),
              e('p', { className: 'text-[9.5px] text-neutral-400 mt-0.5 leading-relaxed' }, 'Obrolan langsung memicu penenunan gambar otomatis.')
            ),
            e('button', {
              type: "button",
              onClick: () => {
                const newOrch = !aiOrchestrator;
                setAiOrchestrator(newOrch);
                localStorage.setItem('antitesis_ai_orchestrator', newOrch.toString());
                addLog(`AI Orchestrator: ${newOrch ? 'Active' : 'Inactive'}`, "info");
              },
              className: "transition-transform active:scale-95 shrink-0"
            },
              aiOrchestrator 
                ? e('div', { className: 'flex items-center gap-1 bg-purple-955/40 text-purple-400 px-2.5 py-1.5 rounded-lg border border-purple-900/40 font-mono text-[9px] font-bold' }, "AUTO ", e(ToggleRight, { className: 'w-4 h-4 text-purple-500 ml-0.5' }))
                : e('div', { className: 'flex items-center gap-1 bg-neutral-900 text-neutral-500 px-2.5 py-1.5 rounded-lg border border-neutral-800 font-mono text-[9px] font-bold' }, "MANUAL ", e(ToggleLeft, { className: 'w-4 h-4 text-neutral-700 ml-0.5' }))
            )
          ),
         
          e('div', { className: 'flex items-center justify-between border-b border-neutral-800 pb-3' },
            e('div', { className: 'pr-4' },
              e('p', { className: 'text-[11px] font-bold text-neutral-200' }, 'Pre-Flight Safety Check'),
              e('p', { className: 'text-[9.5px] text-neutral-400 mt-0.5 leading-relaxed' }, 'Melakukan pemindaian draf prompt final sebelum dikirim ke server, mensubstitusi kata-kata blacklist dengan sinonim artistik demi rendering tanpa penolakan.')
            ),
            e('button', {
              type: "button",
              onClick: () => {
                const newSafety = !preFlightSafety;
                setPreFlightSafety(newSafety);
                localStorage.setItem('antitesis_pre_flight_safety', newSafety.toString());
                addLog(`Pre-Flight Safety Check diatur ke: ${newSafety ? 'SECURE' : 'BYPASS'}`, "info");
              },
              className: "transition-transform active:scale-95 shrink-0"
            },
              preFlightSafety 
                ? e('div', { className: 'flex items-center gap-1 bg-green-955/40 text-green-400 px-2.5 py-1.5 rounded-lg border border-green-900/40 font-mono text-[9px] font-bold' }, "SECURE ", e(ToggleRight, { className: 'w-4 h-4 text-green-500 ml-0.5' }))
                : e('div', { className: 'flex items-center gap-1 bg-neutral-900 text-neutral-500 px-2.5 py-1.5 rounded-lg border border-neutral-800 font-mono text-[9px] font-bold' }, "INACTIVE ", e(ToggleLeft, { className: 'w-4 h-4 text-neutral-700 ml-0.5' }))
            )
          ),
          e('div', { className: 'pt-1 flex flex-col gap-2' },
            e('div', null,
              e('p', { className: 'text-[11px] font-bold text-neutral-200 flex items-center gap-1.5' }, "🌸 Modul Suara (Qwen3-TTS Token)"),
              e('p', { className: 'text-[9.5px] text-neutral-400 mt-0.5 leading-relaxed' }, "Token Hugging Face (", e('code', { className: 'text-purple-400 font-mono bg-neutral-900 px-1 py-0.5 rounded' }, "Read"), ") untuk suara kawaii.")
            ),
            e('input', {
              type: "password",
              placeholder: "Masukkan token hf_...",
              value: hfToken,
              onChange: (ev) => {
                setHfToken(ev.target.value);
                localStorage.setItem('antitesis_hf_token', ev.target.value);
              },
              className: "w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500 rounded-lg px-3 py-2 text-[11px] text-neutral-200 font-mono outline-none placeholder:text-neutral-600"
            })
          )
        )
      ),

      // ACCORDION 3: CUSTOMIZE VISUAL
      e('div', { className: 'border border-neutral-850 rounded-xl overflow-hidden bg-neutral-900/45' },
        e('button', {
          onClick: () => setOpenSettingsAccordion(openSettingsAccordion === 'customize' ? '' : 'customize'),
          className: 'w-full px-4 py-3.5 bg-neutral-900/90 hover:bg-neutral-900 flex items-center justify-between transition-colors border-b border-neutral-850'
        },
          e('div', { className: 'flex items-center gap-2.5' },
            e(Palette, { className: 'w-4 h-4 text-pink-400' }),
            e('span', { className: 'text-[11px] font-bold uppercase tracking-wider text-neutral-200' }, '2. Customize Visual System')
          ),
          openSettingsAccordion === 'customize' ? e(ChevronUp, { className: 'w-4 h-4 text-neutral-400' }) : e(ChevronDown, { className: 'w-4 h-4 text-neutral-400' })
        ),
        openSettingsAccordion === 'customize' && e('div', { className: 'p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-neutral-955/20 text-xs' },
          
          // Loader Utama
          e('div', { className: 'bg-neutral-955 p-3 rounded-lg border border-neutral-850 flex flex-col justify-between space-y-3' },
            e('div', null,
              e('h4', { className: 'font-bold text-neutral-200 text-[10.5px] uppercase tracking-wide flex items-center gap-1.5' }, e('div', { className: 'w-1.5 h-1.5 rounded-full bg-pink-500' }), " Loader Utama"),
              e('p', { className: 'text-neutral-400 text-[9.5px] leading-relaxed' }, "Ganti GIF loading preview.")
            ),
            (mainLoadingIcon && !mainLoadingIcon.startsWith('https://lh3.googleusercontent.com'))
              ? e('div', { className: 'flex items-center gap-2 bg-neutral-900 p-1.5 rounded border border-neutral-800' },
                  e('img', { src: mainLoadingIcon, alt: "Preview", className: 'w-6 h-6 object-contain rounded' }),
                  e('div', { className: 'overflow-hidden flex-1' },
                    e('p', { className: 'text-[8.5px] text-pink-400 font-bold truncate' }, "File Kustom Aktif"),
                    e('button', { onClick: removeMainIcon, className: 'text-[8px] text-red-400 hover:text-red-300 underline font-mono' }, "Reset")
                  )
                )
              : e('label', { className: 'w-full bg-neutral-900 border border-dashed border-neutral-800 hover:border-neutral-700 py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1.5' },
                  e(Upload, { className: 'w-3.5 h-3.5 text-neutral-500' }),
                  e('span', { className: 'text-neutral-400 font-bold text-[10px]' }, "Pilih File"),
                  e('input', { type: "file", accept: "image/png, image/jpeg, image/gif", onChange: handleMainIconUpload, className: 'hidden' })
                )
          ),

          // Loader Chat
          e('div', { className: 'bg-neutral-955 p-3 rounded-lg border border-neutral-850 flex flex-col justify-between space-y-3' },
            e('div', null,
              e('h4', { className: 'font-bold text-neutral-200 text-[10.5px] uppercase tracking-wide flex items-center gap-1.5' }, e('div', { className: 'w-1.5 h-1.5 rounded-full bg-pink-500' }), " Loader Chat"),
              e('p', { className: 'text-neutral-400 text-[9.5px] leading-relaxed' }, "GIF saat asisten menggambar di chat.")
            ),
            (chatLoadingIcon && !chatLoadingIcon.startsWith('https://lh3.googleusercontent.com/d/1aSJCh6Ds96igfWjCB22tnmOzd4q_ZmTX'))
              ? e('div', { className: 'flex items-center gap-2 bg-neutral-900 p-1.5 rounded border border-neutral-800' },
                  e('img', { src: chatLoadingIcon, alt: "Preview", className: 'w-6 h-6 object-contain rounded' }),
                  e('div', { className: 'overflow-hidden flex-1' },
                    e('p', { className: 'text-[8.5px] text-pink-400 font-bold' }, "Chat Loader Aktif"),
                    e('button', { onClick: removeChatIcon, className: 'text-[8px] text-red-400 hover:text-red-300 underline font-mono' }, "Reset")
                  )
                )
              : e('label', { className: 'w-full bg-neutral-900 border border-dashed border-neutral-800 hover:border-neutral-700 py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1.5' },
                  e(Upload, { className: 'w-3.5 h-3.5 text-neutral-500' }),
                  e('span', { className: 'text-neutral-400 font-bold text-[10px]' }, "Pilih File"),
                  e('input', { type: "file", accept: "image/png, image/jpeg, image/gif", onChange: handleChatIconUpload, className: 'hidden' })
                )
          ),

          // Loader Voice
          e('div', { className: 'bg-neutral-955 p-3 rounded-lg border border-neutral-850 flex flex-col justify-between space-y-3' },
            e('div', null,
              e('h4', { className: 'font-bold text-neutral-200 text-[10.5px] uppercase tracking-wide flex items-center gap-1.5' }, e('div', { className: 'w-1.5 h-1.5 rounded-full bg-pink-500' }), " Loader Voice"),
              e('p', { className: 'text-neutral-400 text-[9.5px] leading-relaxed' }, "GIF saat Tessa memproses suara.")
            ),
            (customVoiceGif && !customVoiceGif.startsWith('https://lh3.googleusercontent.com/d/10bwIfDmLcXdwUMMuynnqopRQSFBln747'))
              ? e('div', { className: 'flex items-center gap-2 bg-neutral-900 p-1.5 rounded border border-neutral-800' },
                  e('img', { src: customVoiceGif, alt: "Preview", className: 'w-6 h-6 object-contain rounded' }),
                  e('div', { className: 'overflow-hidden flex-1' },
                    e('p', { className: 'text-[8.5px] text-pink-400 font-bold' }, "Voice Loader Aktif"),
                    e('button', { onClick: removeVoiceGif, className: 'text-[8px] text-red-400 hover:text-red-300 underline font-mono' }, "Reset")
                  )
                )
              : e('label', { className: 'w-full bg-neutral-900 border border-dashed border-neutral-800 hover:border-neutral-700 py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1.5' },
                  e(Upload, { className: 'w-3.5 h-3.5 text-neutral-500' }),
                  e('span', { className: 'text-neutral-400 font-bold text-[10px]' }, "Pilih File GIF"),
                  e('input', { type: "file", accept: "image/gif", onChange: handleVoiceGifUpload, className: 'hidden' })
                )
          ),

          // Font
          e('div', { className: 'bg-neutral-955 p-3 rounded-lg border border-neutral-850 flex flex-col justify-between space-y-3' },
            e('div', null,
              e('h4', { className: 'font-bold text-neutral-200 text-[10.5px] uppercase tracking-wide flex items-center gap-1.5' }, e('div', { className: 'w-1.5 h-1.5 rounded-full bg-pink-500' }), " Tipografi"),
              e('p', { className: 'text-neutral-400 text-[9.5px] leading-relaxed' }, "Gaya tulisan aplikasi.")
            ),
            e('div', { className: 'grid grid-cols-2 gap-1' },
              [{ key: 'sans', label: 'Sans' }, { key: 'playfair', label: 'Playfair' }, { key: 'serif', label: 'Classic' }, { key: 'mono', label: 'Cyber' }].map((f) => 
                e('button', {
                  key: f.key,
                  onClick: () => changeFontFamily(f.key),
                  className: `py-1 rounded font-bold transition text-[9px] ${selectedFont === f.key ? 'bg-rose-500 text-[#0b0b0f]' : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'}`
                }, f.label)
              )
            )
          ),

          // Custom Logo
          e('div', { className: 'bg-neutral-955 p-3 rounded-lg border border-neutral-850 flex flex-col justify-between space-y-2' },
            e('div', null,
              e('h4', { className: 'font-bold text-neutral-200 text-[10.5px] uppercase tracking-wide flex items-center gap-1.5' }, e('div', { className: 'w-1.5 h-1.5 rounded-full bg-pink-500' }), " Custom Logo"),
              e('p', { className: 'text-neutral-400 text-[9.5px] leading-relaxed' }, "Ganti logo kiri atas.")
            ),
            e('div', { className: 'space-y-1.5' },
              e('input', {
                type: "text",
                placeholder: "Tempel URL Logo...",
                defaultValue: headerLogo.startsWith('data:') ? '' : headerLogo,
                onBlur: (ev) => handleHeaderLogoUrlChange(ev.target.value),
                className: "w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-[9px] focus:outline-none focus:border-rose-500 text-neutral-300 font-mono"
              }),
              e('div', { className: 'flex gap-1' },
                e('label', { className: 'flex-1 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 py-1 rounded cursor-pointer flex items-center justify-center gap-1 text-[9px] font-bold text-neutral-400' },
                  e(Upload, { className: 'w-3.5 h-3.5' }), " Upload",
                  e('input', { type: "file", accept: "image/*", onChange: handleHeaderLogoUpload, className: 'hidden' })
                ),
                e('button', { onClick: removeHeaderLogo, className: 'px-2 bg-neutral-900 border border-neutral-800 text-red-400 rounded text-[9px]' }, "Reset")
              )
            )
          )
        )
      ),

      // ACCORDION 4: VERSION HISTORY
      e('div', { className: 'border border-neutral-850 rounded-xl overflow-hidden bg-neutral-900/45' },
        e('button', {
          onClick: () => setOpenSettingsAccordion(openSettingsAccordion === 'versions' ? '' : 'versions'),
          className: 'w-full px-4 py-3.5 bg-neutral-900/90 hover:bg-neutral-900 flex items-center justify-between transition-colors border-b border-neutral-850'
        },
          e('div', { className: 'flex items-center gap-2.5' },
            e(History, { className: 'w-4 h-4 text-teal-400' }),
            e('span', { className: 'text-[11px] font-bold uppercase tracking-wider text-neutral-200' }, '4. Version Logs')
          ),
          openSettingsAccordion === 'versions' ? e(ChevronUp, { className: 'w-4 h-4 text-neutral-400' }) : e(ChevronDown, { className: 'w-4 h-4 text-neutral-400' })
        ),
        openSettingsAccordion === 'versions' && ANTITHESIS_CONSTANTS?.SYSTEM_VERSIONS && e('div', { className: 'p-4 max-h-[280px] overflow-y-auto bg-neutral-955/20 text-xs space-y-4' },
          ANTITHESIS_CONSTANTS.SYSTEM_VERSIONS.map((item, index) =>
            e('div', { key: index, className: 'bg-neutral-955 border border-neutral-850 p-3.5 rounded-xl flex flex-col md:flex-row gap-4' },
              e('div', { className: 'md:w-1/4 shrink-0' },
                e('span', { className: 'font-mono text-xs font-bold text-rose-500 block' }, item.version),
                e('span', { className: 'text-[10px] text-neutral-500 font-medium block mt-0.5' }, item.date)
              ),
              e('div', { className: 'md:w-3/4' },
                e('ul', { className: 'list-disc list-inside space-y-1.5 text-neutral-300 text-[10.5px] leading-relaxed font-semibold' },
                  item.changes.map((change, cIdx) => e('li', { key: cIdx, className: 'marker:text-rose-500 pl-1' }, change))
                )
              )
            )
          )
        )
      )
    )
  );
};

return SettingsDrawer;