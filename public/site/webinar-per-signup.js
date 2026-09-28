/* Inscription au webinaire PER grand public : envoie vers la route serveur du site
 * (/api/webinar-per/register), qui écrit dans le Google Sheet et envoie l'e-mail
 * de confirmation (et le SMS si demandé) via Brevo. */
(function () {
  'use strict';
  const form = document.getElementById('webinar-per-form');
  if (!form) return;
  const $ = (s) => form.querySelector(s);
  const errorBox = document.querySelector('[data-wp-error]');
  const submitBtn = document.querySelector('[data-wp-submit]');
  const phoneField = document.querySelector('[data-wp-phone]');
  const smsConsentField = document.querySelector('[data-wp-sms-consent]');

  function endpoint() {
    const local = location.protocol === 'file:' || (['localhost', '127.0.0.1'].includes(location.hostname) && location.port !== '3111');
    return (local ? 'http://localhost:3111' : '') + '/api/webinar-per/register';
  }

  form.querySelectorAll('[name=wantsSms]').forEach((radio) => radio.addEventListener('change', () => {
    const wants = form.elements.wantsSms.value === 'yes';
    phoneField.hidden = !wants;
    smsConsentField.hidden = !wants;
    form.elements.telephone.required = wants;
    form.elements.consentSms.required = wants;
    if (!wants) { form.elements.telephone.value = ''; form.elements.consentSms.checked = false; }
  }));

  const fail = (message) => { errorBox.textContent = message; errorBox.hidden = false; };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.hidden = true;
    const prenom = form.elements.prenom.value.trim();
    const nom = form.elements.nom.value.trim();
    const email = form.elements.email.value.trim();
    const wantsSms = form.elements.wantsSms.value === 'yes';
    const telephone = form.elements.telephone.value.trim();
    const consent = form.elements.consent.checked;

    if (prenom.length < 2) return fail('Indiquez votre prénom.');
    if (nom.length < 2) return fail('Indiquez votre nom.');
    if (!emailRegex.test(email)) return fail('Vérifiez votre adresse e-mail.');
    if (wantsSms && telephone.replace(/\D/g, '').length < 9) return fail('Indiquez un numéro de téléphone valide, ou choisissez « Non » pour le rappel SMS.');
    if (!consent) return fail('Cochez la case pour recevoir les informations du webinaire.');

    submitBtn.disabled = true;
    const params = new URLSearchParams(location.search);
    const source = 'webinaire-per|' + (params.get('utm_source') ? 'utm_source:' + params.get('utm_source') : 'direct') +
      (params.get('utm_campaign') ? '|utm_campaign:' + params.get('utm_campaign') : '');
    try {
      const response = await fetch(endpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom, nom, email, telephone: wantsSms ? telephone : '', consent, consentSms: wantsSms && consent, source })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        if (data.error === 'consentement_requis') return fail('Cochez la case pour recevoir les informations du webinaire.');
        if (data.error === 'email_invalide') return fail('Vérifiez votre adresse e-mail.');
        if (data.error === 'nom_invalide') return fail('Indiquez votre nom.');
        return fail('Inscription momentanément indisponible. Réessayez dans un instant, ou appelez le 06 51 22 42 13.');
      }
      form.hidden = true;
      document.querySelector('[data-wp-success]').hidden = false;
      window.gpTrack && window.gpTrack('webinaire_per_inscription', { sms: wantsSms && consent });
    } catch {
      fail('Le service est momentanément indisponible. Réessayez dans un instant, ou appelez le 06 51 22 42 13.');
    } finally {
      submitBtn.disabled = false;
    }
  });
})();
