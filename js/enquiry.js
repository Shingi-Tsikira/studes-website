// Studes — enquiry.js
// Enquiry form: conditional student/landlord fields, live cost estimate, validation,
// then the submission is saved to sessionStorage and the user is sent to response.html.

(function () {
  'use strict';

  // ---- Pricing model (illustrative figures for the hypothetical organisation) ----
  const RATES = { single: 2800, shared: 2200, studio: 4200 };        // base monthly rent by room type
  const AREA_ADJUSTMENT = { braamfontein: 300, hatfield: 200, 'auckland-park': 0, other: 0 };
  const EXTRAS = {
    wifi: { label: 'Fibre Wi-Fi', price: 250 },
    furnished: { label: 'Furnished', price: 400 },
    parking: { label: 'Secure parking', price: 350 },
    laundry: { label: 'Laundry access', price: 150 }
  };
  const BOOKING_FEE = 200;                                           // once-off Studes booking fee
  const COMMISSION = { standard: 0.05, featured: 0.08 };             // landlord commission on monthly rent

  const LABELS = {
    room: { single: 'Single room', shared: 'Shared apartment / house', studio: 'Studio flat' },
    area: { braamfontein: 'Braamfontein', hatfield: 'Hatfield', 'auckland-park': 'Auckland Park', other: 'Other area' },
    plan: { standard: 'Standard listing (5% commission)', featured: 'Featured listing (8% commission)' }
  };

  /* Pure function: takes form values, returns the cost breakdown. Easy to test without the DOM. */
  function calculateEstimate(d) {
    if (d.type === 'student') {
      if (!RATES[d.room] || !(d.area in AREA_ADJUSTMENT) || !(d.months > 0)) return null;
      const lines = [];
      const base = RATES[d.room];
      lines.push({ label: LABELS.room[d.room] + ' base rent', amount: base });
      if (AREA_ADJUSTMENT[d.area]) lines.push({ label: LABELS.area[d.area] + ' location adjustment', amount: AREA_ADJUSTMENT[d.area] });
      (d.extras || []).forEach(function (key) {
        if (EXTRAS[key]) lines.push({ label: EXTRAS[key].label, amount: EXTRAS[key].price });
      });
      const monthly = lines.reduce(function (sum, l) { return sum + l.amount; }, 0);
      const deposit = monthly;                       // refundable deposit = one month's rent
      const upfront = monthly + deposit + BOOKING_FEE;
      return {
        kind: 'student',
        lines: lines,
        monthly: monthly,
        deposit: deposit,
        bookingFee: BOOKING_FEE,
        upfront: upfront,
        leaseTotal: monthly * d.months + BOOKING_FEE,
        months: d.months
      };
    }

    if (d.type === 'landlord') {
      if (!(d.units > 0) || !(d.rent > 0) || !COMMISSION[d.plan]) return null;
      const gross = d.units * d.rent;
      const rate = COMMISSION[d.plan];
      const commission = Math.round(gross * rate);
      return {
        kind: 'landlord',
        gross: gross,
        rate: rate,
        commission: commission,
        net: gross - commission,
        annualNet: (gross - commission) * 12
      };
    }
    return null;
  }

  function makeReference() {
    const d = new Date();
    const pad = function (n) { return String(n).padStart(2, '0'); };
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let suffix = '';
    for (let i = 0; i < 4; i++) suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    return 'STU-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + suffix;
  }

  window.StudesEnquiry = { calculateEstimate: calculateEstimate, makeReference: makeReference, LABELS: LABELS, EXTRAS: EXTRAS };

  document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('enquiry-form');
    if (!form) return;

    const V = window.StudesValidation;
    const R = window.Studes.formatRand;
    const typeSelect = document.getElementById('enquiry-type');
    const studentGroup = document.getElementById('student-fields');
    const landlordGroup = document.getElementById('landlord-fields');
    const panel = document.getElementById('estimate-panel');
    const panelBody = document.getElementById('estimate-body');

    V.attachLiveValidation(form);

    function val(id) { const el = document.getElementById(id); return el ? el.value : ''; }

    function readValues() {
      const type = typeSelect.value;
      if (type === 'student') {
        return {
          type: type,
          room: val('room-type'),
          area: val('area'),
          months: Number(val('lease-months')) || 0,
          extras: Array.from(form.querySelectorAll('input[name="extras"]:checked')).map(function (c) { return c.value; })
        };
      }
      if (type === 'landlord') {
        return { type: type, units: Number(val('units')) || 0, rent: Number(val('monthly-rent')) || 0, plan: val('plan') };
      }
      return { type: '' };
    }

    function row(label, amount, strong) {
      const tr = document.createElement('tr');
      if (strong) tr.className = 'total-row';
      const th = document.createElement('th');
      th.scope = 'row';
      th.textContent = label;
      const td = document.createElement('td');
      td.textContent = amount;
      tr.appendChild(th);
      tr.appendChild(td);
      return tr;
    }

    function renderEstimate() {
      const est = calculateEstimate(readValues());
      panelBody.textContent = '';
      if (!est) {
        panel.hidden = true;
        return;
      }
      panel.hidden = false;
      if (est.kind === 'student') {
        est.lines.forEach(function (l) { panelBody.appendChild(row(l.label, R(l.amount))); });
        panelBody.appendChild(row('Estimated monthly rent', R(est.monthly), true));
        panelBody.appendChild(row('Refundable deposit (1 month)', R(est.deposit)));
        panelBody.appendChild(row('Once-off booking fee', R(est.bookingFee)));
        panelBody.appendChild(row('Due before move-in', R(est.upfront), true));
      } else {
        panelBody.appendChild(row('Total monthly rent (' + readValues().units + ' units)', R(est.gross)));
        panelBody.appendChild(row('Studes commission (' + Math.round(est.rate * 100) + '%)', '-' + R(est.commission)));
        panelBody.appendChild(row('Estimated monthly payout', R(est.net), true));
        panelBody.appendChild(row('Estimated yearly payout', R(est.annualNet)));
      }
    }

    function toggleGroups() {
      const t = typeSelect.value;
      studentGroup.hidden = t !== 'student';
      landlordGroup.hidden = t !== 'landlord';
      renderEstimate();
    }

    typeSelect.addEventListener('change', toggleGroups);
    form.addEventListener('input', renderEstimate);
    form.addEventListener('change', renderEstimate);

    // Listing cards link here with ?type=student&room=single&area=braamfontein so the form is pre-filled
    const params = new URLSearchParams(window.location.search);
    if (params.get('type') === 'student' || params.get('type') === 'landlord') {
      typeSelect.value = params.get('type');
      if (RATES[params.get('room')]) document.getElementById('room-type').value = params.get('room');
      if (params.get('area') in AREA_ADJUSTMENT) document.getElementById('area').value = params.get('area');
    }
    toggleGroups();

    // Move-in date cannot be in the past (min attribute helps browsers that show a date picker)
    const moveIn = document.getElementById('move-in');
    if (moveIn) {
      const d = new Date();
      const pad = function (n) { return String(n).padStart(2, '0'); };
      moveIn.min = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!V.validateForm(form)) {
        V.setStatus(form, 'Please fix the highlighted fields and try again.', 'error');
        return;
      }

      const values = readValues();
      const record = {
        reference: makeReference(),
        submittedAt: new Date().toISOString(),
        type: values.type,
        name: val('full-name').trim(),
        email: val('email').trim(),
        phone: val('phone').trim(),
        message: val('message').trim(),
        estimate: calculateEstimate(values),
        details: []
      };

      if (values.type === 'student') {
        record.details = [
          ['Campus', val('campus').trim()],
          ['Room type', LABELS.room[values.room]],
          ['Preferred area', LABELS.area[values.area]],
          ['Move-in date', val('move-in')],
          ['Lease length', values.months + ' month' + (values.months === 1 ? '' : 's')],
          ['Extras', values.extras.length ? values.extras.map(function (k) { return EXTRAS[k].label; }).join(', ') : 'None']
        ];
      } else {
        record.details = [
          ['Property area', LABELS.area[val('property-area')] || val('property-area')],
          ['Number of units', String(values.units)],
          ['Rent per unit', R(values.rent) + ' / month'],
          ['Listing plan', LABELS.plan[values.plan]]
        ];
      }

      try {
        sessionStorage.setItem('studesEnquiry', JSON.stringify(record));
      } catch (err) {
        V.setStatus(form, 'Your browser blocked temporary storage, so the summary page cannot be shown. Please email info@studes.example instead.', 'error');
        return;
      }
      window.location.href = 'response.html';
    });
  });
})();
