/* Cookies, consentement (RGPD / CNIL) et mesure d'audience lisible.
 * Rien n'est chargé ni envoyé avant un « Accepter ». « Refuser » a le même poids que « Accepter ».
 * Le choix est conservé 6 mois, puis redemandé. Réouverture : bouton « Gérer mes cookies » du pied de page.
 * Les événements portent des noms lisibles en français (voir docs/tracking-kpi-guide.md). */
(function () {
  'use strict';
  const KEY = 'gp_consent_v1', MONTHS6 = 1000 * 60 * 60 * 24 * 182;
  const read = () => { try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); return v && Date.now() - v.at < MONTHS6 ? v : null; } catch { return null; } };
  const write = choice => { try { localStorage.setItem(KEY, JSON.stringify({choice, at:Date.now()})); } catch {} };
  let granted = false, ready = false;
  const queue = [];

  function loadScript(src) { const s = document.createElement('script'); s.async = true; s.src = src; document.head.appendChild(s); }
  function pageInfo() {
    const first = (document.querySelector('h1') || {}).textContent || '';
    return {page_title:document.title, page_path:location.pathname + location.hash.replace(/^#/, '#'), page_h1:first.trim().slice(0, 80)};
  }

  function start() {
    if (ready) return;
    fetch('/api/site-config', {cache:'no-store'}).then(r => r.ok ? r.json() : {}).then(cfg => {
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      if (cfg.ga4Id) {
        window.gtag('js', new Date());
        window.gtag('config', cfg.ga4Id, {send_page_view:false, anonymize_ip:true});
        loadScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(cfg.ga4Id));
      }
      if (cfg.metaPixelId && !window.fbq) {
        /* eslint-disable */
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
        /* eslint-enable */
        window.fbq('init', cfg.metaPixelId);
        window.fbq('track', 'PageView');
      }
      ready = true;
      send('page_view', pageInfo());
      queue.splice(0).forEach(([n, p]) => send(n, p));
    }).catch(() => { ready = true; queue.length = 0; });
  }

  function send(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
    if (typeof window.fbq === 'function' && name !== 'page_view') window.fbq('trackCustom', name, params || {});
  }
  /* API publique : window.gpTrack('nom_lisible', {parametres}) */
  window.gpTrack = function (name, params) {
    if (!granted) return;
    const full = Object.assign({page_path:location.pathname}, params || {});
    if (ready) send(name, full); else queue.push([name, full]);
  };

  /* ---------- Bandeau ---------- */
  let banner;
  function closeBanner() { if (banner) { banner.remove(); banner = null; } }
  function openBanner() {
    if (banner) return;
    banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Choix sur les cookies');
    banner.innerHTML = '<div class="cookie-copy"><strong>Vos données, votre choix</strong><p>Avec votre accord, nous mesurons l’audience du site (pages vues, simulations lancées) pour l’améliorer. Aucune donnée n’est collectée avant votre choix. <a href="/politique-de-confidentialite">En savoir plus</a></p></div><div class="cookie-actions"><button type="button" class="cookie-btn" data-choice="refuse">Tout refuser</button><button type="button" class="cookie-btn cookie-btn-primary" data-choice="accept">Tout accepter</button></div>';
    banner.addEventListener('click', e => {
      const b = e.target.closest('[data-choice]');
      if (!b) return;
      decide(b.dataset.choice);
    });
    document.body.appendChild(banner);
  }
  function decide(choice) {
    write(choice);
    closeBanner();
    if (choice === 'accept') { granted = true; start(); } else { granted = false; }
  }

  document.addEventListener('click', e => {
    if (e.target.closest('[data-cookie-settings]')) { e.preventDefault(); openBanner(); }
  });

  const saved = read();
  if (!saved) openBanner(); else if (saved.choice === 'accept') { granted = true; start(); }

  /* ---------- Événements lisibles ---------- */
  const text = el => (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  document.addEventListener('click', e => {
    if (!granted) return;
    const a = e.target.closest('a,button');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (href.startsWith('tel:')) return window.gpTrack('clic_telephone', {emplacement:text(a)});
    if (href.startsWith('mailto:')) return window.gpTrack('clic_email', {emplacement:text(a)});
    if (a.closest('.review-ticker') || a.closest('.google-rating') || a.closest('.client-proof-link') || /google\.com\/maps|maps\.app\.goo\.gl/.test(href)) return window.gpTrack('clic_avis_google', {emplacement:a.closest('.review-ticker') ? 'bandeau' : 'encart'});
    if (a.closest('.desktop-nav') || a.closest('.services-strip') || a.closest('.mobile-nav') || a.closest('.footer-services')) return window.gpTrack('clic_menu_service', {service:text(a)});
    if (a.dataset.video) return window.gpTrack('video_temoignage_ouverte', {video:a.dataset.videoTitle || text(a)});
    if (a.hasAttribute('data-book') || a.hasAttribute('data-callback') || a.hasAttribute('data-project') || /calendly\.com/.test(href)) return window.gpTrack('clic_prise_rendez_vous', {bouton:text(a), sujet:a.dataset.project || ''});
    if (a.closest('[data-cookie-settings]')) return;
  }, true);

  /* Simulateurs : démarrage à la première interaction, par type de simulateur */
  const started = new Set();
  const simulators = [['[data-borrower-quote]', 'assurance_emprunteur'], ['[data-per-simulator]', 'per'], ['[data-life-simulator]', 'assurance_vie']];
  document.addEventListener('input', e => {
    if (!granted) return;
    simulators.forEach(([selector, type]) => {
      if (!started.has(type) && e.target.closest && e.target.closest(selector)) { started.add(type); window.gpTrack('simulation_demarree', {simulateur:type}); }
    });
  }, true);
  document.addEventListener('change', e => {
    if (!granted) return;
    simulators.forEach(([selector, type]) => {
      if (!started.has(type) && e.target.closest && e.target.closest(selector)) { started.add(type); window.gpTrack('simulation_demarree', {simulateur:type}); }
    });
  }, true);

  /* Profondeur de lecture : 50 % et 90 % de la page, une seule fois chacune */
  const depth = new Set();
  addEventListener('scroll', () => {
    if (!granted) return;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (max <= 0) return;
    const pct = scrollY / max;
    [[0.5, 'lecture_50_pourcent'], [0.9, 'lecture_90_pourcent']].forEach(([limit, name]) => { if (pct >= limit && !depth.has(name)) { depth.add(name); window.gpTrack(name, {page:document.title}); } });
  }, {passive:true});
})();
