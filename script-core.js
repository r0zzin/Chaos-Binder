/* script-core.js — shared state, glue, and boot */
(() => {
  const CB = (window.CB = window.CB || {});

  // ===== Refs & state
  CB.STORAGE_KEY = 'chaosBinder.state.v6_9_split';
  CB.preview = document.getElementById('preview');
  CB.editorPane = document.getElementById('editorPane');
  CB.tocList = document.getElementById('tocList');
  CB.indexList = document.getElementById('indexList');
  CB.customCssStyleEl = document.getElementById('customCssStyle');
  CB.statusEl = document.getElementById('status');
  CB.metaPane = document.getElementById('metaPane');
  CB.toggleMetaBtn = document.getElementById('toggleMeta');
  CB.currentFocusedTextarea = null;
  CB.coverTitleColor = '#402020';
  CB.coverSubtitleColor = '#555555';
  CB.currentFileHandle = null;

  // ===== Utilities
  CB.setStatus = (msg) => { if (CB.statusEl) CB.statusEl.textContent = msg; };

  let debounceTimer;
  CB.refreshPreview = function() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (typeof CB.render === 'function') CB.render();
    }, 100);
  };

  CB.ensureCoverPage = function ensureCoverPage() {
    if (!CB.preview || document.getElementById('coverPage')) return;
    const tpl = document.getElementById('coverPageTemplate')?.content.cloneNode(true);
    if (tpl) CB.preview.appendChild(tpl);
  };

  // ===== Local storage helpers
  CB.getState = function getState() {
    const titleEl = document.getElementById('coverTitle');
    const subEl = document.getElementById('coverSubtitle');
    const authEl = document.getElementById('coverAuthor');
    return {
      version: '6.9-split',
      chapters: (CB.getChaptersData?.() || []),
      cover: {
        title: titleEl?.textContent || 'Chaos Binder',
        subtitle: subEl?.textContent || 'Crafted for GMs, scribes, and scribblers of the void.',
        author: authEl?.textContent || 'r0zzin',
        bg: {
          enabled: !!document.getElementById('coverBgEnabled')?.checked,
          url: document.getElementById('coverBgUrl')?.value || '',
          fit: document.getElementById('coverBgFit')?.value || 'cover',
          pos: document.getElementById('coverBgPos')?.value || 'center'
        },
        sigil: {
          enabled: !!document.getElementById('sigilEnabled')?.checked,
          url: document.getElementById('sigilUrl')?.value || '',
          size: document.getElementById('sigilSize')?.value || 'medium',
          caption: document.getElementById('sigilCaption')?.value || ''
        }
      },
      coverColors: { title: CB.coverTitleColor, subtitle: CB.coverSubtitleColor },
      headers: {
        showHeader: !!document.getElementById('showHeader')?.checked,
        showFooter: !!document.getElementById('showFooter')?.checked,
        hdrLeft: document.getElementById('hdrLeft')?.value || '',
        hdrRight: document.getElementById('hdrRight')?.value || '',
        ftrLeft: document.getElementById('ftrLeft')?.value || '',
        ftrRight: document.getElementById('ftrRight')?.value || ''
      },
      css: document.getElementById('customCssInput')?.value || '',
      metaPaneVisible: CB.metaPane && !CB.metaPane.classList.contains('hidden')
    };
  };

  CB.setState = function setState(s) {
    if (!s) return;
    CB.setChaptersData?.(s.chapters || []);

    CB.ensureCoverPage();
    const titleEl = document.getElementById('coverTitle');
    const subEl = document.getElementById('coverSubtitle');
    const authEl = document.getElementById('coverAuthor');
    if (s.cover) {
      if (titleEl) titleEl.textContent = s.cover.title || titleEl.textContent;
      if (subEl) subEl.textContent = s.cover.subtitle || subEl.textContent;
      if (authEl) authEl.textContent = s.cover.author || authEl.textContent;
      const coverTitleInput = document.getElementById('coverTitleInput');
      const coverSubtitleInput = document.getElementById('coverSubtitleInput');
      const coverAuthorInput = document.getElementById('coverAuthorInput');
      if (coverTitleInput) coverTitleInput.value = titleEl?.textContent || '';
      if (coverSubtitleInput) coverSubtitleInput.value = subEl?.textContent || '';
      if (coverAuthorInput) coverAuthorInput.value = authEl?.textContent || '';

      if (s.cover.bg) {
        const coverBgEnabled = document.getElementById('coverBgEnabled');
        const coverBgUrl = document.getElementById('coverBgUrl');
        const coverBgFit = document.getElementById('coverBgFit');
        const coverBgPos = document.getElementById('coverBgPos');
        if (coverBgEnabled) coverBgEnabled.checked = !!s.cover.bg.enabled;
        if (coverBgUrl) coverBgUrl.value = s.cover.bg.url || '';
        if (coverBgFit) coverBgFit.value = s.cover.bg.fit || 'cover';
        if (coverBgPos) coverBgPos.value = s.cover.bg.pos || 'center';
        CB.applyCoverBg?.();
      }
      if (s.cover.sigil) {
        const sigilEnabled = document.getElementById('sigilEnabled');
        const sigilUrl = document.getElementById('sigilUrl');
        const sigilSize = document.getElementById('sigilSize');
        const sigilCaption = document.getElementById('sigilCaption');
        if (sigilEnabled) sigilEnabled.checked = !!s.cover.sigil.enabled;
        if (sigilUrl) sigilUrl.value = s.cover.sigil.url || '';
        if (sigilSize) sigilSize.value = s.cover.sigil.size || 'medium';
        if (sigilCaption) sigilCaption.value = s.cover.sigil.caption || '';
        CB.applySigil?.();
      }
    }

    if (s.coverColors) {
      CB.coverTitleColor = s.coverColors.title || CB.coverTitleColor;
      CB.coverSubtitleColor = s.coverColors.subtitle || CB.coverSubtitleColor;
      const pc1 = document.getElementById('coverTitleColorPicker');
      const pc2 = document.getElementById('coverSubtitleColorPicker');
      if (pc1) pc1.value = CB.coverTitleColor;
      if (pc2) pc2.value = CB.coverSubtitleColor;
      CB.applyCoverTextColors?.();
    }

    if (s.headers) {
      const showHeader = document.getElementById('showHeader');
      const showFooter = document.getElementById('showFooter');
      const hdrLeft = document.getElementById('hdrLeft');
      const hdrRight = document.getElementById('hdrRight');
      const ftrLeft = document.getElementById('ftrLeft');
      const ftrRight = document.getElementById('ftrRight');
      if (showHeader) showHeader.checked = !!s.headers.showHeader;
      if (showFooter) showFooter.checked = !!s.headers.showFooter;
      if (hdrLeft) hdrLeft.value = s.headers.hdrLeft || hdrLeft.value;
      if (hdrRight) hdrRight.value = s.headers.hdrRight || hdrRight.value;
      if (ftrLeft) ftrLeft.value = s.headers.ftrLeft || ftrLeft.value;
      if (ftrRight) ftrRight.value = s.headers.ftrRight || ftrRight.value;
    }

    if (typeof s.css === 'string' && CB.customCssStyleEl) {
      const customCssInput = document.getElementById('customCssInput');
      if (customCssInput) customCssInput.value = s.css;
      CB.customCssStyleEl.textContent = s.css;
    }

    if (typeof s.metaPaneVisible === 'boolean' && CB.metaPane && CB.toggleMetaBtn) {
      CB.metaPane.classList.toggle('hidden', !s.metaPaneVisible);
      CB.toggleMetaBtn.textContent = s.metaPaneVisible ? 'Hide Meta' : 'Show Meta';
    }

    CB.refreshPreview();
  };

  CB.saveLocal = () => localStorage.setItem(CB.STORAGE_KEY, JSON.stringify(CB.getState()));
  CB.loadLocal = () => {
    const raw = localStorage.getItem(CB.STORAGE_KEY);
    if (!raw) { alert('No saved data.'); return; }
    try { CB.setState(JSON.parse(raw)); } catch (e) { alert('Failed to load saved data: ' + e.message); }
  };
  CB.clearLocal = () => {
    if (confirm('Clear all saved data? This cannot be undone.')) {
      localStorage.removeItem(CB.STORAGE_KEY);
      alert('Cleared saved data.');
    }
  };

  CB.downloadJSON = function(filename, dataObj) {
    const dataStr = JSON.stringify(dataObj, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  CB.fsSupported = () => ('showOpenFilePicker' in window && 'showSaveFilePicker' in window);

  // Toggle meta pane
  function toggleMetaPane() {
    if (CB.metaPane && CB.toggleMetaBtn) {
      CB.metaPane.classList.toggle('hidden');
      CB.toggleMetaBtn.textContent = CB.metaPane.classList.contains('hidden') ? 'Show Meta' : 'Hide Meta';
      CB.saveLocal();
    }
  }
  CB.toggleMetaPane = toggleMetaPane;

  // Boot orchestrator
  function init() {
    CB.ensureCoverPage();
    // Give sub-modules a chance to wire listeners
    CB.initEditor?.();
    CB.initCover?.();
    CB.initRender?.();
    CB.initIO?.();

    // Load or seed
    if (localStorage.getItem(CB.STORAGE_KEY)) {
      try { CB.setState(JSON.parse(localStorage.getItem(CB.STORAGE_KEY))); }
      catch (e) { console.warn('State parse error', e); CB.seedIfEmpty?.(); }
    } else {
      CB.seedIfEmpty?.();
    }

    CB.wireChapterTitleGuards?.(document);
    CB.refreshPreview();
    CB.setStatus(CB.fsSupported() ? 'Tip: You can Open/Save JSON directly using the browser.' : 'Tip: Use Import/Save As to handle JSON files.');
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (CB.toggleMetaBtn) CB.toggleMetaBtn.addEventListener('click', toggleMetaPane);
    init();
  });
})();
