/* Compteur de visites de la page webinaire (venues des publicités) : une visite par chargement,
 * envoyée en arrière-plan, sans cookie ni stockage. Indépendant du formulaire d'inscription :
 * une erreur ici n'a aucun effet sur la page. */
(function () {
  'use strict';
  try {
    var form = document.getElementById('webinar-per-form');
    var session = form && form.dataset.session;
    var p = new URLSearchParams(location.search);
    if (!session || !p.get('utm_source') || !navigator.sendBeacon || location.protocol === 'file:') return;
    var envoyer = function (clic) {
      var data = { session: session, source: p.get('utm_source'), medium: p.get('utm_medium'), campaign: p.get('utm_campaign'), content: p.get('utm_content'), clic: clic };
      navigator.sendBeacon('/api/webinar-per/visit', new Blob([JSON.stringify(data)], { type: 'text/plain' }));
    };
    var fbclid = p.get('fbclid');
    // L'identifiant de clic Meta n'est jamais transmis tel quel : seulement une empreinte courte, pour compter les clics uniques.
    if (fbclid && window.crypto && crypto.subtle && window.TextEncoder) {
      crypto.subtle.digest('SHA-256', new TextEncoder().encode(fbclid)).then(function (h) {
        envoyer(Array.from(new Uint8Array(h)).slice(0, 8).map(function (b) { return b.toString(16).padStart(2, '0'); }).join(''));
      }, function () { envoyer('v' + Math.random().toString(36).slice(2, 12)); });
    } else {
      envoyer('v' + Math.random().toString(36).slice(2, 12));
    }
  } catch (e) { /* jamais bloquant */ }
})();
