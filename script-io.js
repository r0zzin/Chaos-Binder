/* script-io.js — JSON import/export, toolbar drag/drop, FS API */
(() => {
  const CB = (window.CB = window.CB || {});

  async function openJSON_FS() {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'Chaos Binder JSON', accept: { 'application/json': ['.json'] } }]
      });
      const file = await handle.getFile();
      const text = await file.text();
      const json = JSON.parse(text);
      if (!Array.isArray(json.chapters)) json.chapters = [];
      CB.setState?.(json);
      CB.currentFileHandle = handle;
      CB.setStatus?.('Opened: ' + (handle.name || 'untitled.json'));
    } catch (e) {
      if (e && e.name !== 'AbortError') alert('Open failed: ' + e.message);
    }
  }

  async function saveJSON_FS() {
    try {
      if (!CB.currentFileHandle) return await saveAsJSON_FS();
      const writable = await CB.currentFileHandle.createWritable();
      await writable.write(JSON.stringify(CB.getState?.(), null, 2));
      await writable.close();
      CB.setStatus?.('Saved: ' + (CB.currentFileHandle.name || 'untitled.json'));
    } catch (e) {
      alert('Save failed: ' + e.message);
    }
  }

  async function saveAsJSON_FS() {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'ChaosBinder.json',
        types: [{ description: 'Chaos Binder JSON', accept: { 'application/json': ['.json'] } }]
      });
      CB.currentFileHandle = handle;
      await saveJSON_FS();
    } catch (e) {
      if (e && e.name !== 'AbortError') alert('Save As failed: ' + e.message);
    }
  }

  function initIO() {
    // Buttons
    document.getElementById('save-local')?.addEventListener('click', () => { CB.saveLocal?.(); alert('Saved locally.'); });
    document.getElementById('load-local')?.addEventListener('click', CB.loadLocal);
    document.getElementById('clear-local')?.addEventListener('click', CB.clearLocal);

    document.getElementById('open-json')?.addEventListener('click', () => {
      if (CB.fsSupported?.()) openJSON_FS(); else alert('File System Access API not supported in this browser. Use Import JSON instead.');
    });
    document.getElementById('save-json')?.addEventListener('click', () => {
      if (CB.fsSupported?.()) saveJSON_FS(); else CB.downloadJSON?.('ChaosBinder.json', CB.getState?.());
    });
    document.getElementById('save-as-json')?.addEventListener('click', () => {
      if (CB.fsSupported?.()) saveAsJSON_FS(); else CB.downloadJSON?.('ChaosBinder.json', CB.getState?.());
    });

    // Custom CSS
    document.getElementById('applyCss')?.addEventListener('click', () => {
      const customCssInput = document.getElementById('customCssInput');
      if (customCssInput && CB.customCssStyleEl) {
        CB.customCssStyleEl.textContent = customCssInput.value;
        CB.saveLocal?.(); CB.refreshPreview?.();
      }
    });
    document.getElementById('clearCss')?.addEventListener('click', () => {
      const customCssInput = document.getElementById('customCssInput');
      if (customCssInput && CB.customCssStyleEl) {
        customCssInput.value = '';
        CB.customCssStyleEl.textContent = '';
        CB.saveLocal?.(); CB.refreshPreview?.();
      }
    });

    // Import JSON (picker)
    const jsonFileInput = document.getElementById('jsonFile');
    if (jsonFileInput) {
      document.getElementById('import-json')?.addEventListener('click', () => jsonFileInput.click());
      jsonFileInput.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        try {
          const text = await file.text();
          const json = JSON.parse(text);
          if (!Array.isArray(json.chapters)) json.chapters = [];
          CB.setState?.(json);
          CB.setStatus?.('Loaded from JSON.');
        } catch (err) {
          alert('Could not import JSON: ' + err.message);
        } finally {
          jsonFileInput.value = '';
        }
      });
    }

    // Drag & Drop onto toolbar
    const toolbar = document.getElementById('toolbar');
    if (toolbar) {
      ['dragenter', 'dragover'].forEach(ev => toolbar.addEventListener(ev, (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        toolbar.style.outline = '2px dashed #995';
        toolbar.style.background = '#f0e8d8';
      }));
      ['dragleave', 'drop'].forEach(ev => toolbar.addEventListener(ev, (e) => {
        e.preventDefault();
        if (ev === 'drop') {
          const f = e.dataTransfer.files?.[0];
          if (f && f.type === 'application/json') {
            f.text().then(t => { const j = JSON.parse(t); if (!Array.isArray(j.chapters)) j.chapters = []; CB.setState?.(j); })
              .catch(err => alert('Import failed: ' + err.message));
          }
        }
        toolbar.style.outline = '';
        toolbar.style.background = '';
      }));
    }
  }

  // Expose
  CB.initIO = initIO;
  CB.openJSON_FS = openJSON_FS;
  CB.saveJSON_FS = saveJSON_FS;
  CB.saveAsJSON_FS = saveAsJSON_FS;
})();
