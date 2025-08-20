/* script-editor.js — authoring UI */
(() => {
  const CB = (window.CB = window.CB || {});
  const editorPane = document.getElementById('editorPane');

  function wireChapterTitleGuards(scope = document) {
    scope.querySelectorAll('.chapter-block summary .chapter-title[contenteditable]').forEach(el => {
      el.addEventListener('mousedown', e => e.stopPropagation());
      el.addEventListener('keydown', e => {
        if ((e.key === ' ' || e.key === 'Spacebar') && !e.ctrlKey && !e.metaKey && !e.altKey && !e.altGraphKey) e.stopPropagation();
        if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); }
      });
      el.addEventListener('click', e => e.stopPropagation());
    });
  }

  function createChapter(title = 'Untitled Chapter', content = '', include = true) {
    const tpl = document.getElementById('chapterTemplate')?.content.cloneNode(true);
    if (!tpl) return;
    const wrapper = tpl.querySelector('.chapter-block');
    const titleEl = tpl.querySelector('.chapter-title');
    const textEl = tpl.querySelector('.chapter-text');
    const includeEl = tpl.querySelector('.include-checkbox');

    titleEl.textContent = title;
    textEl.value = content;
    includeEl.checked = include;
    if (!include) wrapper.classList.add('excluded');

    textEl.addEventListener('focus', () => CB.currentFocusedTextarea = textEl);
    textEl.addEventListener('blur', () => CB.refreshPreview());
    includeEl.addEventListener('change', () => {
      wrapper.classList.toggle('excluded', !includeEl.checked);
      CB.refreshPreview();
    });
    wrapper.querySelector('.dup').addEventListener('click', () => {
      createChapter(titleEl.textContent + ' (copy)', textEl.value, includeEl.checked);
      CB.refreshPreview();
    });
    wrapper.querySelector('.del').addEventListener('click', () => {
      wrapper.remove();
      CB.refreshPreview();
    });

    if (editorPane) editorPane.appendChild(tpl);
    wireChapterTitleGuards(editorPane);
    return wrapper;
  }

  function getChaptersData() {
    if (!editorPane) return [];
    return Array.from(editorPane.querySelectorAll('.chapter-block')).map(block => ({
      title: block.querySelector('.chapter-title').textContent.trim() || 'Untitled',
      text: block.querySelector('.chapter-text').value || '',
      include: block.querySelector('.include-checkbox').checked
    }));
  }

  function setChaptersData(list) {
    if (!editorPane) return;
    editorPane.innerHTML = '';
    (list || []).forEach(ch => createChapter(ch.title, ch.text, ch.include));
    wireChapterTitleGuards(editorPane);
  }

  function makePage(h, body, id) {
    return `<div class="page" data-kind="content">
      <div class="page-header" aria-hidden="true"><div></div><div></div></div>
      <div class="block col-12 row-10">${id ? `<h1 id="${id}">${h}</h1>` : `<h1>${h}</h1>`}<p>${body} Try a cross‑ref: <a data-xref="#intro" href="#intro">Intro</a>. <span data-index="TestTerm">Indexed term</span></p></div>
      <div class="page-footer" aria-hidden="true"><div></div><div class="center-links"></div><div></div></div>
    </div>`;
  }

  function seedIfEmpty() {
    if (editorPane?.querySelectorAll('.chapter-block').length) return;
    const ch1 = [
      makePage('Introduction', 'Welcome to the Binder; use headings for TOC and data-index for indexing.', 'intro'),
      makePage('Awakening II', 'Quisque viverra, leo vitae pretium egestas.'),
      makePage('Awakening III', 'Mauris nec justo sed tellus efficitur accumsan.'),
      makePage('Awakening IV', 'Suspendisse potenti. Aliquam erat volutpat.')
    ].join('');
    const ch2 = [
      makePage('Descent I', 'Phasellus posuere velit ut lacinia placerat.'),
      makePage('Descent II', 'Nam quis felis dignissim, consequat velit.'),
      makePage('Descent III', 'Etiam finibus varius urna, nec fringilla arcu.')
    ].join('');
    createChapter('Chapter One: The Awakening', ch1, true);
    createChapter('Chapter Two: The Descent', ch2, true);
  }

  function initEditor() {
    document.getElementById('add-chapter')?.addEventListener('click', () => createChapter('Chapter', '', true));
    document.getElementById('add-page')?.addEventListener('click', () => {
      if (!CB.currentFocusedTextarea) { alert('Click into a chapter first.'); return; }
      const blankPageTemplate = document.getElementById('blankPageTemplate');
      if (blankPageTemplate) {
        CB.currentFocusedTextarea.setRangeText(
          '\n' + blankPageTemplate.innerHTML.trim() + '\n',
          CB.currentFocusedTextarea.selectionStart,
          CB.currentFocusedTextarea.selectionEnd,
          'end'
        );
        CB.refreshPreview();
      }
    });
  }

  // Expose
  CB.wireChapterTitleGuards = wireChapterTitleGuards;
  CB.createChapter = createChapter;
  CB.getChaptersData = getChaptersData;
  CB.setChaptersData = setChaptersData;
  CB.seedIfEmpty = seedIfEmpty;
  CB.initEditor = initEditor;
})();
