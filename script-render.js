/* script-render.js — render pipeline & layout */
(() => {
  const CB = (window.CB = window.CB || {});
  const preview = document.getElementById('preview');

  function ensureSpecialPage(kind, templateId, elementId) {
    if (!preview || document.getElementById(elementId)) return;
    const tpl = document.getElementById(templateId)?.content.cloneNode(true);
    if (!tpl) { CB.setStatus?.(`Error: ${templateId} not found`); return; }
    CB.ensureCoverPage?.();
    const cover = document.getElementById('coverPage');
    if (cover) cover.after(tpl); else preview.appendChild(tpl);
    CB.refreshPreview();
    CB.setStatus?.(`${kind === 'toc' ? 'Table of Contents' : 'Index'} page added`);
  }

  function numberPages() {
    const autoNumber = document.getElementById('auto-number');
    if (!autoNumber || !autoNumber.checked) return;
    const startAfterCover = document.getElementById('count-cover')?.checked;
    let count = 0;
    const pages = Array.from(preview?.querySelectorAll('.page') || []);
    pages.forEach(p => {
      if (p.dataset.kind === 'cover') {
        if (startAfterCover) {
          p.dataset.page = 'cover';
        } else {
          count += 1;
          p.dataset.page = count;
        }
        return;
      }
      count += 1;
      p.dataset.page = count;
    });
  }

  function collectTOCItems() {
    const items = [];
    preview?.querySelectorAll('.page').forEach(page => {
      const pageNum = page.dataset.page;
      page.querySelectorAll('h1, h2, h3, [data-toc]').forEach(h => {
        const level = h.hasAttribute('data-toc') ? (parseInt(h.getAttribute('data-toc')) || 2) : parseInt(h.tagName.substring(1));
        const text = h.textContent.trim();
        if (!text) return;
        let id = h.id || text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        h.id = id;
        items.push({ level, text, id, page: pageNum });
      });
    });
    return items;
  }

  function buildTOC() {
    const items = collectTOCItems();
    const tocList = document.getElementById('tocList');
    if (tocList) {
      tocList.innerHTML = '';
      items.forEach(it => {
        const li = document.createElement('li');
        li.className = `toc-level-${Math.min(Math.max(it.level, 1), 3)}`;
        li.innerHTML = `<a href="#${it.id}">${it.text}</a> <span class="pages">${it.page ?? ''}</span>`;
        tocList.appendChild(li);
      });
    }

    const tocMount = document.getElementById('tocMount');
    if (tocMount) {
      const col = document.createElement('div');
      items.forEach(it => {
        const line = document.createElement('div');
        line.style.display = 'flex';
        line.style.gap = '.5rem';
        line.style.alignItems = 'baseline';
        line.style.fontSize = it.level === 1 ? '1rem' : it.level === 2 ? '.95rem' : '.9rem';
        line.style.paddingLeft = (it.level - 1) * 16 + 'px';
        const a = document.createElement('a');
        a.href = '#' + it.id;
        a.textContent = it.text;
        const dots = document.createElement('div');
        dots.style.flex = '1';
        dots.style.borderBottom = '1px dotted #aaa';
        const pg = document.createElement('div');
        pg.textContent = it.page ?? '';
        pg.style.width = '2.5rem';
        pg.style.textAlign = 'right';
        pg.style.fontVariantNumeric = 'tabular-nums';
        line.append(a, dots, pg);
        col.appendChild(line);
      });
      tocMount.innerHTML = '';
      tocMount.appendChild(col);
    }
  }

  function buildIndex() {
    const map = new Map();
    preview?.querySelectorAll('[data-index]').forEach(span => {
      const term = span.getAttribute('data-index').trim();
      const page = span.closest('.page')?.dataset.page;
      if (!term || !page) return;
      if (!map.has(term)) map.set(term, new Set());
      const num = page === 'cover' ? null : parseInt(page, 10);
      if (num != null && !Number.isNaN(num)) map.get(term).add(num);
    });
    const entries = Array.from(map.entries()).map(([term, set]) => ({
      term, pages: Array.from(set).sort((a,b)=>a-b)
    })).sort((a,b)=> a.term.localeCompare(b.term, undefined, { sensitivity:'base' }));

    const indexList = document.getElementById('indexList');
    if (indexList) {
      indexList.innerHTML = '';
      entries.forEach(({ term, pages }) => {
        const div = document.createElement('div');
        div.className = 'index-term';
        div.innerHTML = `<strong>${term}</strong> <span class="pages">${pages.join(', ')}</span>`;
        indexList.appendChild(div);
      });
    }

    const indexMount = document.getElementById('indexMount');
    if (indexMount) {
      const wrap = document.createElement('div');
      entries.forEach(({ term, pages }) => {
        const line = document.createElement('div');
        line.style.display = 'flex';
        line.style.gap = '.5rem';
        line.style.alignItems = 'baseline';
        const t = document.createElement('div');
        t.style.minWidth = '10ch';
        t.textContent = term;
        const dots = document.createElement('div');
        dots.style.flex = '1';
        dots.style.borderBottom = '1px dotted #aaa';
        const p = document.createElement('div');
        p.textContent = pages.join(', ');
        p.style.fontVariantNumeric = 'tabular-nums';
        line.append(t, dots, p);
        wrap.appendChild(line);
      });
      indexMount.innerHTML = '';
      indexMount.appendChild(wrap);
    }
  }

  function paginateSpecial(kind) {
    const first = document.getElementById(kind === 'toc' ? 'tocPage' : 'indexPage');
    if (!first) return;
    const pageBlock = first.querySelector('.block');
    const heading = pageBlock.querySelector('h1');
    const mount = first.querySelector(kind === 'toc' ? '#tocMount' : '#indexMount');
    if (!mount) return;

    const available = pageBlock.clientHeight - (heading?.offsetHeight || 0) - 12;
    if (available <= 0) return;

    const rowsContainer = mount.firstElementChild || mount;
    const rows = Array.from(rowsContainer.children);
    if (!rows.length) return;

    const measurer = document.createElement('div');
    const w = mount.clientWidth || 600;
    measurer.style.cssText = `position:absolute;left:-9999px;top:-9999px;width:${w}px;`;
    document.body.appendChild(measurer);

    const slices = [];
    let slice = [];
    for (const row of rows) {
      measurer.innerHTML = '';
      const holder = document.createElement('div');
      slice.forEach(r => holder.appendChild(r.cloneNode(true)));
      holder.appendChild(row.cloneNode(true));
      measurer.appendChild(holder);
      const h = holder.scrollHeight;
      if (h <= available) slice.push(row);
      else { if (slice.length) slices.push(slice); slice = [row]; }
    }
    if (slice.length) slices.push(slice);
    measurer.remove();

    if (slices.length <= 1) return;

    const newFirst = document.createElement('div');
    newFirst.className = rowsContainer.className;
    newFirst.style.cssText = rowsContainer.style.cssText;
    mount.innerHTML = '';
    slices[0].forEach(r => newFirst.appendChild(r));
    mount.appendChild(newFirst);

    function buildSpecialPage(rowsSlice) {
      const tplId = kind === 'toc' ? 'tocPageTemplate' : 'indexPageTemplate';
      const tpl = document.getElementById(tplId)?.content.cloneNode(true);
      if (!tpl) return null;
      const pageEl = tpl.querySelector('.page');
      pageEl.id = '';
      pageEl.dataset.kind = kind + '-mp';
      const m = pageEl.querySelector(kind === 'toc' ? '#tocMount' : '#indexMount');
      const container = document.createElement('div');
      rowsSlice.forEach(r => container.appendChild(r));
      m.innerHTML = '';
      m.appendChild(container);
      return pageEl;
    }

    const insertionAnchor = Array.from(preview?.querySelectorAll(`.page[data-kind="${kind}"], .page[data-kind="${kind}-mp"]`) || []).pop() || first;
    let last = insertionAnchor;
    for (let i = 1; i < slices.length; i++) {
      const pageEl = buildSpecialPage(slices[i]);
      if (pageEl) last.after(pageEl);
      last = pageEl;
    }
  }

  function formatTokens(tpl, ctx) {
    const map = {
      '{book}': ctx.book || '',
      '{chapter}': ctx.chapter || '',
      '{page}': ctx.page != null ? String(ctx.page) : '',
      '{date}': new Date().toLocaleDateString()
    };
    return tpl.replace(/\{book\}|\{chapter\}|\{page\}|\{date\}/g, m => map[m] ?? m);
  }

  function applyHeadersFooters() {
    const showHeader = document.getElementById('showHeader')?.checked;
    const showFooter = document.getElementById('showFooter')?.checked;
    const hdrL = document.getElementById('hdrLeft')?.value || '';
    const hdrR = document.getElementById('hdrRight')?.value || '';
    const ftrL = document.getElementById('ftrLeft')?.value || '';
    const ftrR = document.getElementById('ftrRight')?.value || '';
    const book = document.getElementById('coverTitle')?.textContent.trim() || '';

    // NEW: actually hide via CSS toggles
    if (preview) {
      preview.classList.toggle('rh-off', !showHeader);
      preview.classList.toggle('rf-off', !showFooter);
    }

    const haveTOC = !!preview?.querySelector('#tocPage, .page[data-kind="toc-mp"]');
    const haveIndex = !!preview?.querySelector('#indexPage, .page[data-kind="index-mp"]');

    preview?.querySelectorAll('.page').forEach(p => {
      const pageNum = p.dataset.page === 'cover' ? '' : parseInt(p.dataset.page, 10);
      const chapter = p.dataset.chapter || '';
      const h = p.querySelector('.page-header');
      const f = p.querySelector('.page-footer');
      if (h && showHeader) {
        h.children[0].textContent = formatTokens(hdrL, { book, chapter, page: pageNum });
        h.children[1].textContent = formatTokens(hdrR, { book, chapter, page: pageNum });
      }
      if (f && showFooter) {
        if (f.children.length < 3) {
          const mid = document.createElement('div');
          mid.className = 'center-links';
          f.insertBefore(mid, f.children[1] || null);
        }
        const center = f.querySelector('.center-links');
        let links = [];
        if (haveTOC && haveIndex) {
          if (p.dataset.kind === 'toc' || p.dataset.kind === 'toc-mp') links = [`<a href="#indexPage">Index</a>`];
          else if (p.dataset.kind === 'index' || p.dataset.kind === 'index-mp') links = [`<a href="#tocPage">TOC</a>`];
          else links = [`<a href="#tocPage">TOC</a> • <a href="#indexPage">Index</a>`];
        } else if (haveTOC) {
          if (!(p.dataset.kind === 'toc' || p.dataset.kind === 'toc-mp')) links = [`<a href="#tocPage">TOC</a>`];
        } else if (haveIndex) {
          if (!(p.dataset.kind === 'index' || p.dataset.kind === 'index-mp')) links = [`<a href="#indexPage">Index</a>`];
        }
        center.innerHTML = links.join(' ');
        f.children[0].textContent = formatTokens(ftrL, { book, chapter, page: pageNum });
        f.children[f.children.length - 1].textContent = formatTokens(ftrR, { book, chapter, page: pageNum });
      }
    });
  }

  function resolveXrefs() {
    preview?.querySelectorAll('a[data-xref]').forEach(a => {
      const targetSel = a.getAttribute('data-xref');
      if (!targetSel) return;
      const target = preview.querySelector(targetSel);
      let baseText = a.getAttribute('data-xref-text');
      if (!baseText) {
        baseText = (a.getAttribute('data-xref-text') || a.textContent.trim()).replace(/\s*\(p\.\s*\d+\)\s*$/i, '');
        a.setAttribute('data-xref-text', baseText);
      }
      if (!target) {
        a.textContent = baseText;
        a.removeAttribute('data-xref-applied');
        return;
      }
      const page = target.closest('.page')?.dataset.page;
      if (!page || page === 'cover') {
        a.textContent = baseText;
        a.removeAttribute('data-xref-applied');
        return;
      }
      const pageStr = String(page);
      if (a.getAttribute('data-xref-applied') === pageStr) return;
      a.textContent = `${baseText} (p. ${pageStr})`;
      a.setAttribute('data-xref-applied', pageStr);
    });
  }

  function render() {
    if (!preview) return;
    CB.ensureCoverPage?.();
    const cover = document.getElementById('coverPage');
    const tocPage = document.getElementById('tocPage');
    const indexPage = document.getElementById('indexPage');
    const placeIndexAfter = document.getElementById('index-after-chapters')?.checked;

    Array.from(preview.querySelectorAll('.page[data-kind="toc-mp"], .page[data-kind="index-mp"]')).forEach(n => n.remove());

    preview.innerHTML = '';
    if (cover) preview.appendChild(cover);
    if (tocPage) preview.appendChild(tocPage);
    if (!placeIndexAfter && indexPage) preview.appendChild(indexPage);

    (CB.getChaptersData?.() || []).forEach(ch => {
      if (!ch.include) return;
      const tmp = document.createElement('div');
      tmp.innerHTML = ch.text;
      const pages = tmp.querySelectorAll('.page');
      if (pages.length) {
        pages.forEach(p => { p.dataset.chapter = ch.title; preview.appendChild(p); });
      } else {
        const page = document.getElementById('blankPageTemplate')?.content.cloneNode(true);
        if (page) {
          page.querySelector('.page').dataset.chapter = ch.title;
          page.querySelector('.block').insertAdjacentHTML('beforeend', ch.text);
          preview.appendChild(page);
        }
      }
    });

    if (placeIndexAfter && indexPage) preview.appendChild(indexPage);

    numberPages();
    buildTOC();
    buildIndex();
    CB.applyCoverTextColors?.();
    applyHeadersFooters();
    resolveXrefs();
    paginateSpecial('toc');
    paginateSpecial('index');
    numberPages();
    applyHeadersFooters();
    resolveXrefs();
  }

  function initRender() {
    // Live bindings for toggles/inputs
    ['count-cover','auto-number','index-after-chapters','showHeader','showFooter']
      .forEach(id => document.getElementById(id)?.addEventListener('change', () => { CB.saveLocal?.(); CB.refreshPreview(); }));

    ['hdrLeft','hdrRight','ftrLeft','ftrRight']
      .forEach(id => document.getElementById(id)?.addEventListener('input', () => { CB.saveLocal?.(); CB.refreshPreview(); }));

    document.getElementById('insert-toc')?.addEventListener('click', () => ensureSpecialPage('toc','tocPageTemplate','tocPage'));
    document.getElementById('insert-index')?.addEventListener('click', () => ensureSpecialPage('index','indexPageTemplate','indexPage'));
  }

  // Expose
  CB.ensureSpecialPage = ensureSpecialPage;
  CB.render = render;
  CB.initRender = initRender;
})();
