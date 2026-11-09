// Studes — contact.js
// Contact form: validates, then opens the visitor's email app with the subject and body
// already filled in (mailto:). A fallback link is shown in case no email app opens.

(function () {
  'use strict';

  const TO = 'info@studes.example';
  const TOPICS = {
    general: 'General question',
    student: 'Student accommodation help',
    landlord: 'Listing a property',
    feedback: 'Feedback on the website',
    other: 'Something else'
  };

  /* Pure function so it can be tested without a browser */
  function buildMailto(data) {
    const topic = TOPICS[data.topic] || 'Contact form';
    const subject = '[Studes] ' + topic + ' - ' + data.name;
    const body = [
      'Hello Studes team,',
      '',
      data.message,
      '',
      '--',
      'Name: ' + data.name,
      'Email: ' + data.email,
      'Topic: ' + topic
    ].join('\r\n');
    return 'mailto:' + TO + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }

  window.StudesContact = { buildMailto: buildMailto };

  document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('contact-form');
    if (!form) return;
    const V = window.StudesValidation;
    V.attachLiveValidation(form);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!V.validateForm(form)) {
        V.setStatus(form, 'Please fix the highlighted fields and try again.', 'error');
        return;
      }

      const href = buildMailto({
        name: document.getElementById('contact-name').value.trim(),
        email: document.getElementById('contact-email').value.trim(),
        topic: document.getElementById('contact-topic').value,
        message: document.getElementById('contact-message').value.trim()
      });

      const status = form.querySelector('.form-status');
      status.className = 'form-status success';
      status.textContent = 'Thank you! Your email app should open with your message ready to send. If nothing happens, ';
      const link = document.createElement('a');
      link.href = href;
      link.textContent = 'click here to send it';
      status.appendChild(link);
      status.appendChild(document.createTextNode('.'));

      window.location.href = href;
    });
  });
})();
