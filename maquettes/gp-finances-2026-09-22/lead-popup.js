/* Fenêtre « laissez vos coordonnées » qui s'ouvre après une simulation (assurance de prêt, PER, assurance-vie).
 * Déclenchée par l'événement `gp:simulation-result` envoyé par chaque simulateur.
 * - une seule fois par simulateur et par visite, après un court délai pour laisser lire le résultat ;
 * - jamais sans case de consentement cochée ; « Non merci » ferme sans rien envoyer ;
 * - le contact part vers /api/callback avec le résumé de la simulation (jamais l'identité seule). */
(function () {
  'use strict';
  const COPY = {
    assurance_emprunteur: {
      title: 'Faisons vérifier ces tarifs ensemble',
      lead: 'Ces montants sont indicatifs. Laissez-moi vos coordonnées : je vérifie votre dossier avec vous et je m’occupe des démarches, résiliation de l’ancien contrat comprise.',
      calendly: 'https://calendly.com/gabriel-perbost/30min', calendlyLabel: 'Réserver un créneau'
    },
    per: {
      title: 'Passons de la simulation à votre étude',
      lead: 'Cette estimation dépend de votre situation réelle. Laissez vos coordonnées : je vérifie avec vous votre économie d’impôt et le plafond dont vous disposez.',
      calendly: 'https://calendly.com/gabriel-perbost-gp-finances/votre-etude-d-optimisation-fiscale', calendlyLabel: 'Réserver un créneau'
    },
    assurance_vie: {
      title: 'Parlons de votre projet d’épargne',
      lead: 'Cette projection repose sur des hypothèses. Laissez vos coordonnées : nous regardons ensemble les supports, les frais et ce qui correspond à votre horizon.'
    }
  };
  const DELAY = { assurance_emprunteur: 3500, per: 3000, assurance_vie: 1500 };
  const seen = k => { try { return sessionStorage.getItem('gp_lead_' + k) === '1'; } catch { return false; } };
  const mark = k => { try { sessionStorage.setItem('gp_lead_' + k, '1'); } catch {} };
  const track = (name, params) => { if (window.gpTrack) window.gpTrack(name, params); };
  let dialog, timer;

  function build() {
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.id = 'lead-dialog';
    dialog.className = 'contact-dialog lead-dialog';
    dialog.setAttribute('aria-labelledby', 'lead-title');
    dialog.innerHTML = '<button type="button" class="dialog-close" aria-label="Fermer" data-lead-close><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '<div data-lead-form-view><p class="lead-kicker">Votre estimation est prête</p><h2 id="lead-title"></h2><p class="lead-text" data-lead-text></p>' +
      '<form id="lead-form" novalidate>' +
      '<label>Votre prénom<input name="prenom" autocomplete="given-name" required maxlength="60" placeholder="Prénom"></label>' +
      '<label>Votre téléphone<input name="telephone" type="tel" autocomplete="tel" required maxlength="20" placeholder="06 00 00 00 00"></label>' +
      '<label>Votre e-mail <span class="lead-optional">(facultatif)</span><input name="email" type="email" autocomplete="email" maxlength="120" placeholder="prenom@exemple.fr"></label>' +
      '<label class="consent-line"><input type="checkbox" name="consent" required><span>J’accepte que GP FINANCES utilise ces coordonnées et le résumé de ma simulation pour me recontacter au sujet de mon projet. Je peux retirer mon accord à tout moment. <a href="/politique-de-confidentialite" target="_blank" rel="noopener">Politique de confidentialité</a></span></label>' +
      '<p class="lead-error" data-lead-error role="alert" hidden></p>' +
      '<button class="button button-gold lead-submit" type="submit">Être rappelé(e) <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>' +
      '<button type="button" class="lead-skip" data-lead-close>Non merci, je continue</button></form></div>' +
      '<div data-lead-done-view hidden><p class="lead-kicker">Merci</p><h2>C’est bien reçu.</h2><p class="lead-text">Je vous rappelle au plus vite. Sans engagement.</p><div class="lead-done-actions" data-lead-done-actions></div></div>';
    document.body.appendChild(dialog);
    dialog.addEventListener('click', e => {
      if (e.target.closest('[data-lead-close]')) { dialog.close(); return; }
      if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); }
    });
    dialog.addEventListener('close', () => { document.body.classList.remove('modal-open'); if (!dialog.dataset.done) track('popup_lead_ferme', {simulateur:dialog.dataset.type}); });
    dialog.querySelector('#lead-form').addEventListener('submit', submit);
    return dialog;
  }

  async function submit(e) {
    e.preventDefault();
    const f = e.currentTarget, err = dialog.querySelector('[data-lead-error]'), btn = f.querySelector('.lead-submit');
    const fail = m => { err.textContent = m; err.hidden = false; };
    err.hidden = true;
    const name = f.elements.prenom.value.trim(), phone = f.elements.telephone.value.trim(), email = f.elements.email.value.trim();
    if (name.length < 2) return fail('Indiquez votre prénom.');
    if (phone.replace(/[^\d+]/g, '').length < 9) return fail('Indiquez un numéro de téléphone valide.');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Vérifiez votre adresse e-mail.');
    if (!f.elements.consent.checked) return fail('Cochez la case pour que je puisse vous rappeler.');
    btn.disabled = true;
    const type = dialog.dataset.type, summary = JSON.parse(dialog.dataset.summary || '{}');
    try {
      const r = await fetch('/api/callback', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({
        name, phone, email,
        source:JSON.stringify({form:'simulation_' + type, path:location.pathname, consent:true, simulation:{type, summary}})
      })});
      const d = await r.json().catch(() => ({}));
      if (!r.ok || d.ok === false) return fail('Nous n’avons pas pu enregistrer votre demande. Appelez-moi au 06 51 22 42 13.');
      dialog.dataset.done = '1'; mark(type); mark('done');
      dialog.querySelector('[data-lead-form-view]').hidden = true;
      const done = dialog.querySelector('[data-lead-done-view]'); done.hidden = false;
      const c = COPY[type] || {}, actions = dialog.querySelector('[data-lead-done-actions]');
      actions.innerHTML = c.calendly ? '<a class="button button-outline" target="_blank" rel="noopener" href="' + c.calendly + '">' + c.calendlyLabel + '</a>' : '';
      track('lead_simulation_envoye', {simulateur:type});
    } catch { fail('Le service est momentanément indisponible. Appelez-moi au 06 51 22 42 13.'); }
    finally { btn.disabled = false; }
  }

  function open(type, summary) {
    if (seen('done')) return;                          // déjà laissé ses coordonnées : on ne redemande pas
    if (seen(type)) return;                            // une seule fois par simulateur et par visite
    if (document.querySelector('dialog[open]')) return; // ne jamais empiler deux fenêtres
    const d = build(), c = COPY[type];
    if (!c) return;
    mark(type);
    d.dataset.type = type; d.dataset.summary = JSON.stringify(summary || {}); delete d.dataset.done;
    d.querySelector('#lead-title').textContent = c.title;
    d.querySelector('[data-lead-text]').textContent = c.lead;
    d.querySelector('[data-lead-form-view]').hidden = false; d.querySelector('[data-lead-done-view]').hidden = true;
    d.querySelector('[data-lead-error]').hidden = true;
    d.showModal(); document.body.classList.add('modal-open');
    track('popup_lead_affiche', {simulateur:type});
  }

  window.addEventListener('gp:simulation-result', e => {
    const detail = e.detail || {};
    clearTimeout(timer);
    timer = setTimeout(() => open(detail.type, detail.summary), DELAY[detail.type] || 3000);
  });
})();
