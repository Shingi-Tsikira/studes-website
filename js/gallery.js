// Studes — gallery.js
// Gallery page: category buttons + keyword search, and an accessible lightbox
// (previous/next, captions, counter, keyboard, swipe, focus trap and focus return).

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;

    const items = Array.from(grid.querySelectorAll('.gallery-item'));
    const buttons = Array.from(document.querySelectorAll('[data-filter]'));
    const search = document.getElementById('gallery-search');
    const count = document.getElementById('gallery-count');
    const empty = document.getElementById('gallery-empty');
    let category = 'all';

    /* ---------------- Filtering ---------------- */
    function applyFilters() {
      const term = search ? search.value.trim().toLowerCase() : '';
      let shown = 0;
      items.forEach(function (item) {
        const text = (item.dataset.caption + ' ' + item.dataset.keywords).toLowerCase();
        const ok = (category === 'all' || item.dataset.category === category) && text.includes(term);
        item.hidden = !ok;
        if (ok) shown++;
      });
      count.textContent = 'Showing ' + shown + ' of ' + items.length + ' photos';
      empty.hidden = shown !== 0;
    }

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        category = btn.dataset.filter;
        buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        applyFilters();
      });
    });
    if (search) search.addEventListener('input', applyFilters);
    const clear = document.getElementById('gallery-clear');
    if (clear) {
      clear.addEventListener('click', function () {
        category = 'all';
        if (search) search.value = '';
        buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.filter === 'all')); });
        applyFilters();
      });
    }
    applyFilters();

    /* ---------------- Lightbox ---------------- */
    const box = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    const caption = document.getElementById('lightbox-caption');
    const counter = document.getElementById('lightbox-counter');
    const closeBtn = document.getElementById('lightbox-close');
    const prevBtn = document.getElementById('lightbox-prev');
    const nextBtn = document.getElementById('lightbox-next');
    let current = 0;
    let opener = null;

    function visibleItems() { return items.filter(function (i) { return !i.hidden; }); }

    function show(index) {
      const list = visibleItems();
      if (!list.length) return;
      current = (index + list.length) % list.length; // wraps around at both ends
      const item = list[current];
      img.src = item.dataset.full;
      img.alt = item.dataset.alt;
      caption.textContent = item.dataset.caption;
      counter.textContent = (current + 1) + ' of ' + list.length;
    }

    function open(item) {
      opener = item;
      const list = visibleItems();
      box.hidden = false;
      document.body.classList.add('lightbox-open');
      show(list.indexOf(item));
      closeBtn.focus();
    }

    function close() {
      box.hidden = true;
      document.body.classList.remove('lightbox-open');
      img.removeAttribute('src');
      if (opener) opener.focus(); // return focus to the thumbnail that opened it
    }

    items.forEach(function (item) {
      item.addEventListener('click', function () { open(item); });
    });
    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', function () { show(current - 1); });
    nextBtn.addEventListener('click', function () { show(current + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); }); // click the dark backdrop

    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(current - 1);
      else if (e.key === 'ArrowRight') show(current + 1);
      else if (e.key === 'Tab') {
        // keep keyboard focus inside the dialog while it is open
        const focusable = [closeBtn, prevBtn, nextBtn];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // Swipe left/right on touch screens
    let startX = null;
    box.addEventListener('touchstart', function (e) { startX = e.changedTouches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) show(dx < 0 ? current + 1 : current - 1);
      startX = null;
    }, { passive: true });
  });
})();
