// Studes — validation.js
// Shared form validation used by the enquiry and contact forms.
// Each field picks its rule with a data-validate attribute (name, email, phone, number, date, select, required, message).
// Errors are shown inline and linked to the field with aria-describedby so screen readers announce them.

(function (root) {
  'use strict';

  function todayString() {
    const d = new Date();
    const pad = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  const validators = {
    required: function (v) { return v.trim() ? '' : 'This field is required.'; },

    select: function (v) { return v ? '' : 'Please choose an option.'; },

    name: function (v) {
      if (!v.trim()) return 'Please enter your full name.';
      if (v.trim().length < 2) return 'Name is too short.';
      return /^[A-Za-zÀ-ÿ' -]+$/.test(v.trim()) ? '' : 'Name can only contain letters, spaces, hyphens and apostrophes.';
    },

    email: function (v) {
      if (!v.trim()) return 'Please enter your email address.';
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Please enter a valid email, e.g. name@example.com.';
    },

    phone: function (v) {
      if (!v.trim()) return ''; // optional field
      const digits = v.replace(/[\s()-]/g, '');
      return /^(\+27|0)\d{9}$/.test(digits) ? '' : 'Enter a valid SA number, e.g. 082 123 4567.';
    },

    // Whole numbers within the data-min / data-max range set on the input
    number: function (v, field) {
      if (!v.trim()) return 'Please enter a number.';
      const n = Number(v);
      if (!Number.isInteger(n)) return 'Please enter a whole number.';
      const min = field && field.dataset.min !== undefined ? Number(field.dataset.min) : -Infinity;
      const max = field && field.dataset.max !== undefined ? Number(field.dataset.max) : Infinity;
      if (n < min) return 'Please enter a value of at least ' + min + '.';
      if (n > max) return 'Please enter a value of ' + max + ' or less.';
      return '';
    },

    // Dates must be today or later, and within roughly a year
    date: function (v) {
      if (!v) return 'Please choose a date.';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return 'Please use a valid date.';
      if (v < todayString()) return 'The date cannot be in the past.';
      const limit = new Date();
      limit.setFullYear(limit.getFullYear() + 1);
      const pad = function (n) { return String(n).padStart(2, '0'); };
      const limitStr = limit.getFullYear() + '-' + pad(limit.getMonth() + 1) + '-' + pad(limit.getDate());
      return v <= limitStr ? '' : 'Please choose a date within the next 12 months.';
    },

    message: function (v) {
      if (!v.trim()) return 'Please enter a message.';
      return v.trim().length >= 10 ? '' : 'Message must be at least 10 characters.';
    }
  };

  function showFieldError(field, message) {
    const group = field.closest('.form-group');
    let msg = group.querySelector('.error-msg');

    if (message) {
      if (!msg) {
        msg = document.createElement('p');
        msg.className = 'error-msg';
        msg.id = field.id + '-error';
        group.appendChild(msg);
      }
      msg.textContent = message;
      field.classList.add('invalid');
      field.classList.remove('valid');
      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-describedby', msg.id);
    } else {
      if (msg) msg.remove();
      field.classList.remove('invalid');
      field.classList.toggle('valid', field.value.trim() !== '');
      field.removeAttribute('aria-invalid');
      field.removeAttribute('aria-describedby');
    }
  }

  // Returns true when valid. Fields inside a hidden (conditional) section are skipped.
  function validateField(field) {
    const rule = validators[field.dataset.validate];
    if (!rule || field.closest('[hidden]')) return true;
    const error = rule(field.value, field);
    showFieldError(field, error);
    return error === '';
  }

  // Validates every field, focuses the first bad one and returns true only if all pass
  function validateForm(form) {
    let firstInvalid = null;
    form.querySelectorAll('[data-validate]').forEach(function (field) {
      if (!validateField(field) && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) firstInvalid.focus();
    return firstInvalid === null;
  }

  // Validate on blur, then re-check live as the user types once a field has an error
  function attachLiveValidation(form) {
    form.querySelectorAll('[data-validate]').forEach(function (field) {
      field.addEventListener('blur', function () { validateField(field); });
      const live = field.tagName === 'SELECT' ? 'change' : 'input';
      field.addEventListener(live, function () {
        if (field.classList.contains('invalid')) validateField(field);
      });
    });
  }

  function setStatus(form, message, kind) {
    const status = form.querySelector('.form-status');
    if (!status) return;
    status.className = 'form-status' + (kind ? ' ' + kind : '');
    status.textContent = message;
  }

  root.StudesValidation = {
    validators: validators,
    validateField: validateField,
    validateForm: validateForm,
    showFieldError: showFieldError,
    attachLiveValidation: attachLiveValidation,
    setStatus: setStatus
  };
})(window);
