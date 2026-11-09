// Studes — response.js
// Reads the enquiry saved by enquiry.js and renders an invoice-style confirmation.
// All values are written with textContent (never innerHTML) so user input cannot inject markup.

(function () {
  'use strict';

  function el(tag, text, cls) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  }

  function table(rows, caption) {
    const t = el('table', undefined, 'summary-table');
    t.appendChild(el('caption', caption, 'visually-hidden'));
    const body = el('tbody');
    rows.forEach(function (r) {
      const tr = el('tr', undefined, r.strong ? 'total-row' : '');
      const th = el('th', r.label);
      th.scope = 'row';
      tr.appendChild(th);
      tr.appendChild(el('td', r.value));
      body.appendChild(tr);
    });
    t.appendChild(body);
    return t;
  }

  function render(record, container) {
    const R = window.Studes.formatRand;
    container.textContent = '';

    const date = new Date(record.submittedAt);
    const dateText = isNaN(date) ? '' : date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });

    const head = el('div', undefined, 'summary-head');
    head.appendChild(el('p', 'Reference number', 'summary-label'));
    head.appendChild(el('p', record.reference, 'summary-ref'));
    if (dateText) head.appendChild(el('p', 'Submitted on ' + dateText, 'summary-date'));
    container.appendChild(head);

    const who = el('section', undefined, 'summary-card');
    who.appendChild(el('h2', 'Your details'));
    const whoRows = [
      { label: 'Name', value: record.name },
      { label: 'Email', value: record.email },
      { label: 'Phone', value: record.phone || 'Not provided' },
      { label: 'Enquiring as', value: record.type === 'student' ? 'Student' : 'Landlord' }
    ];
    who.appendChild(table(whoRows, 'Your contact details'));
    container.appendChild(who);

    const det = el('section', undefined, 'summary-card');
    det.appendChild(el('h2', record.type === 'student' ? 'Accommodation request' : 'Property details'));
    det.appendChild(table(record.details.map(function (d) { return { label: d[0], value: d[1] }; }), 'Enquiry details'));
    container.appendChild(det);

    const est = record.estimate;
    if (est) {
      const costs = el('section', undefined, 'summary-card');
      costs.appendChild(el('h2', 'Estimated costs'));
      let rows;
      if (est.kind === 'student') {
        rows = est.lines.map(function (l) { return { label: l.label, value: R(l.amount) }; });
        rows.push({ label: 'Estimated monthly rent', value: R(est.monthly), strong: true });
        rows.push({ label: 'Refundable deposit (1 month)', value: R(est.deposit) });
        rows.push({ label: 'Once-off booking fee', value: R(est.bookingFee) });
        rows.push({ label: 'Due before move-in', value: R(est.upfront), strong: true });
        rows.push({ label: 'Total rent over ' + est.months + ' month' + (est.months === 1 ? '' : 's') + ' (incl. booking fee)', value: R(est.leaseTotal) });
      } else {
        rows = [
          { label: 'Total monthly rent', value: R(est.gross) },
          { label: 'Studes commission (' + Math.round(est.rate * 100) + '%)', value: '-' + R(est.commission) },
          { label: 'Estimated monthly payout', value: R(est.net), strong: true },
          { label: 'Estimated yearly payout', value: R(est.annualNet) }
        ];
      }
      costs.appendChild(table(rows, 'Estimated costs'));
      costs.appendChild(el('p', 'These figures are estimates only. A Studes team member will confirm final pricing with you.', 'fine-print'));
      container.appendChild(costs);
    }

    const msg = el('section', undefined, 'summary-card');
    msg.appendChild(el('h2', 'Your message'));
    msg.appendChild(el('p', record.message, 'summary-message'));
    container.appendChild(msg);
  }

  document.addEventListener('DOMContentLoaded', function () {
    const container = document.getElementById('summary');
    const empty = document.getElementById('no-enquiry');
    const actions = document.getElementById('summary-actions');
    if (!container) return;

    let record = null;
    try {
      record = JSON.parse(sessionStorage.getItem('studesEnquiry'));
    } catch (err) {
      record = null;
    }

    if (!record || !record.reference) {
      container.hidden = true;
      if (actions) actions.hidden = true;
      if (empty) empty.hidden = false;
      return;
    }

    render(record, container);
    container.hidden = false;
    if (actions) actions.hidden = false;
    if (empty) empty.hidden = true;

    const printBtn = document.getElementById('print-summary');
    if (printBtn) printBtn.addEventListener('click', function () { window.print(); });

    const clearBtn = document.getElementById('clear-summary');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        try { sessionStorage.removeItem('studesEnquiry'); } catch (err) { /* ignore */ }
        window.location.href = 'enquiry.html';
      });
    }
  });
})();
