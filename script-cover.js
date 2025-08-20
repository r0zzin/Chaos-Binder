/* script-cover.js — cover inputs & visuals */
(() => {
  const CB = (window.CB = window.CB || {});

  function applyCoverTextColors() {
    const t = document.getElementById('coverTitle');
    const s = document.getElementById('coverSubtitle');
    if (t) t.style.color = CB.coverTitleColor || '';
    if (s) s.style.color = CB.coverSubtitleColor || '';
  }

  function applyCoverBg() {
    const page = document.getElementById('coverPage');
    const coverBgEnabled = document.getElementById('coverBgEnabled');
    const coverBgUrl = document.getElementById('coverBgUrl');
    const coverBgFit = document.getElementById('coverBgFit');
    const coverBgPos = document.getElementById('coverBgPos');
    if (!page) return;
    page.classList.toggle('has-bg', coverBgEnabled?.checked && !!coverBgUrl?.value);
    page.style.setProperty('--cover-url', coverBgUrl?.value ? `url("${coverBgUrl.value}")` : '');
    page.style.setProperty('--cover-size', (coverBgFit?.value === 'contain') ? 'contain' : 'cover');
    page.style.setProperty('--cover-pos', coverBgPos?.value || 'center');
  }

  function applySigil() {
    const fig = document.getElementById('coverFigure');
    const img = document.getElementById('coverSigil');
    const cap = document.getElementById('coverSigilCaption');
    const coverPage = document.getElementById('coverPage');
    const sigilEnabled = document.getElementById('sigilEnabled');
    const sigilUrl = document.getElementById('sigilUrl');
    const sigilSize = document.getElementById('sigilSize');
    const sigilCaption = document.getElementById('sigilCaption');
    if (!fig || !img || !cap || !coverPage) return;
    if (sigilEnabled?.checked && sigilUrl?.value) {
      img.src = sigilUrl.value;
      fig.style.display = '';
    } else {
      fig.style.display = 'none';
    }
    cap.textContent = sigilCaption?.value || '';
    coverPage.classList.remove('sigil-small', 'sigil-medium', 'sigil-large');
    coverPage.classList.add('sigil-' + (sigilSize?.value || 'medium'));
  }

  function initCover() {
    const coverTitleInput = document.getElementById('coverTitleInput');
    const coverSubtitleInput = document.getElementById('coverSubtitleInput');
    const coverAuthorInput = document.getElementById('coverAuthorInput');
    const coverTitleColorPicker = document.getElementById('coverTitleColorPicker');
    const coverSubtitleColorPicker = document.getElementById('coverSubtitleColorPicker');

    if (coverTitleInput) coverTitleInput.addEventListener('input', () => {
      const el = document.getElementById('coverTitle'); if (el) el.textContent = coverTitleInput.value; CB.refreshPreview();
    });
    if (coverSubtitleInput) coverSubtitleInput.addEventListener('input', () => {
      const el = document.getElementById('coverSubtitle'); if (el) el.textContent = coverSubtitleInput.value; CB.refreshPreview();
    });
    if (coverAuthorInput) coverAuthorInput.addEventListener('input', () => {
      const el = document.getElementById('coverAuthor'); if (el) el.textContent = coverAuthorInput.value; CB.refreshPreview();
    });

    [document.getElementById('coverBgEnabled'), document.getElementById('coverBgUrl'),
     document.getElementById('coverBgFit'), document.getElementById('coverBgPos')]
      .filter(Boolean).forEach(el => el.addEventListener('input', () => { applyCoverBg(); CB.saveLocal?.(); CB.refreshPreview(); }));

    [document.getElementById('sigilEnabled'), document.getElementById('sigilUrl'),
     document.getElementById('sigilSize'), document.getElementById('sigilCaption')]
      .filter(Boolean).forEach(el => el.addEventListener('input', () => { applySigil(); CB.saveLocal?.(); CB.refreshPreview(); }));

    if (coverTitleColorPicker) coverTitleColorPicker.addEventListener('input', e => { CB.coverTitleColor = e.target.value || '#402020'; CB.refreshPreview(); CB.saveLocal?.(); });
    if (coverSubtitleColorPicker) coverSubtitleColorPicker.addEventListener('input', e => { CB.coverSubtitleColor = e.target.value || '#555555'; CB.refreshPreview(); CB.saveLocal?.(); });
  }

  // Expose
  CB.applyCoverTextColors = applyCoverTextColors;
  CB.applyCoverBg = applyCoverBg;
  CB.applySigil = applySigil;
  CB.initCover = initCover;
})();
