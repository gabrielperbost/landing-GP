/* Compteur d'économies en temps réel : lit la même route que le vrai site
 * (/api/savings-counter, +100 à 1 000 € par jour, valeur commune à tous).
 * Sans serveur, le chiffre affiché dans le HTML reste tel quel. */
(function () {
  'use strict';
  const targets = document.querySelectorAll('[data-live-savings]');
  if (!targets.length) return;
  const local = location.protocol === 'file:' || (['localhost', '127.0.0.1'].includes(location.hostname) && location.port !== '3111');
  const url = (local ? 'http://localhost:3111' : '') + '/api/savings-counter';
  const format = new Intl.NumberFormat('fr-FR', {maximumFractionDigits:0});
  fetch(url, {cache:'no-store'}).then(r => r.ok ? r.json() : Promise.reject()).then(data => {
    if (!Number.isFinite(data.value) || data.value <= 0) return;
    const text = format.format(Math.round(data.value)).replace(/ | /g, ' ');
    targets.forEach(node => { node.textContent = text; });
  }).catch(() => {});
})();
