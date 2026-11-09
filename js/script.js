// Studes — script.js
// Site-wide behaviour that runs on every page:
//   1. mobile navigation toggle   2. scroll-reveal animation   3. listing filters (Listings page)
//   4. small shared helpers (window.Studes) used by the enquiry and response pages

window.Studes = window.Studes || {};

/* Formats a number as South African rand, e.g. 3200 -> "R 3 200" (manual so it is identical in every browser) */
window.Studes.formatRand = function (amount) {
  const n = Math.round(Number(amount) || 0);
  const sign = n < 0 ? '-' : '';
  return sign + 'R ' + String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

document.addEventListener('DOMContentLoaded', function () {
  initNavToggle();
  initRevealOnScroll();
  initListingFilters();
});

/* 1. Mobile navigation toggle */
function initNavToggle() {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('siteNav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', function () {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Escape closes the menu and returns focus to the button
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });
}

/* 2. Scroll animations: fade elements in as they enter the viewport */
function initRevealOnScroll() {
  const items = document.querySelectorAll('.feature-card, .listing-card, .content-block, .location, .step-card, .faq-item, .summary-card');
  if (!('IntersectionObserver' in window)) return; // older browsers simply show everything

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  items.forEach(function (el) {
    el.classList.add('reveal');
    observer.observe(el);
  });
}

/* 3. Listings page: live search + room type + max price filters */
function initListingFilters() {
  const form = document.getElementById('filter-form');
  const cards = document.querySelectorAll('#listing-grid .listing-card');
  if (!form || cards.length === 0) return;

  const search = document.getElementById('search');
  const typeFilter = document.getElementById('type-filter');
  const priceFilter = document.getElementById('price-filter');
  const count = document.getElementById('results-count');
  const noResults = document.getElementById('no-results');

  function applyFilters() {
    const term = search.value.trim().toLowerCase();
    const type = typeFilter.value;
    const maxPrice = priceFilter.value === 'any' ? Infinity : Number(priceFilter.value);
    let shown = 0;

    cards.forEach(function (card) {
      const matchesText = card.textContent.toLowerCase().includes(term);
      const matchesType = type === 'all' || card.dataset.type === type;
      const matchesPrice = Number(card.dataset.price) <= maxPrice;
      const visible = matchesText && matchesType && matchesPrice;
      card.hidden = !visible;
      if (visible) shown++;
    });

    count.textContent = 'Showing ' + shown + ' of ' + cards.length + ' listings';
    noResults.hidden = shown !== 0;
  }

  search.addEventListener('input', applyFilters);
  typeFilter.addEventListener('change', applyFilters);
  priceFilter.addEventListener('change', applyFilters);
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  form.addEventListener('reset', function () { setTimeout(applyFilters, 0); }); // reset fires before fields clear

  applyFilters();
}
