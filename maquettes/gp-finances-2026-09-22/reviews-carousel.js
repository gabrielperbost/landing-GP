(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-review-carousel]').forEach(section => {
    const viewport = section.querySelector('.review-viewport');
    const cards = Array.from(section.querySelectorAll('.proof-card'));
    const toolbar = section.querySelector('.review-toolbar');
    const toggle = section.querySelector('[data-review-toggle]');
    const previous = section.querySelector('[data-review-prev]');
    const next = section.querySelector('[data-review-next]');
    const position = section.querySelector('.review-position');
    let requested = !reducedMotion.matches;
    let explicitlyStarted = false;
    let hovered = false;
    let inView = false;
    let timer;
    const maxScroll = () => Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const stops = () => [...new Set([0, ...cards.map(card => Math.min(card.offsetLeft, maxScroll())), maxScroll()])];
    const updateControls = () => {
      const list = stops();
      const index = list.reduce((best, point, i) => Math.abs(point - viewport.scrollLeft) < Math.abs(list[best] - viewport.scrollLeft) ? i : best, 0);
      const scrollable = maxScroll() > 2;
      toolbar.hidden = !scrollable;
      previous.disabled = !scrollable;
      next.disabled = !scrollable;
      position.textContent = `${index + 1} / ${list.length}`;
      toggle.setAttribute('aria-pressed', String(!requested));
      toggle.querySelector('span').textContent = requested ? 'Mettre en pause' : 'Relancer le défilement';
      const symbol = toggle.querySelector('path');
      symbol.setAttribute('d', requested ? 'M8 5v14M16 5v14' : 'm9 5 11 7-11 7V5Z');
      symbol.setAttribute('fill', requested ? 'none' : 'currentColor');
      symbol.setAttribute('stroke', requested ? 'currentColor' : 'none');
      symbol.setAttribute('stroke-width', '3');
      section.dataset.reviewAutoplay = requested ? 'on' : 'off';
    };
    const canAdvance = () => requested && (!hovered || (explicitlyStarted && toggle.matches(':hover'))) && inView && !document.hidden && (!section.contains(document.activeElement) || (explicitlyStarted && document.activeElement === toggle)) && !document.querySelector('dialog[open]') && maxScroll() > 2;
    const schedule = () => {
      clearTimeout(timer);
      if (canAdvance()) timer = setTimeout(() => { if (canAdvance()) move(1); schedule(); }, 6500);
    };
    const move = direction => {
      const list = stops();
      const current = viewport.scrollLeft;
      const destination = direction > 0 ? (list.find(point => point > current + 2) ?? 0) : ([...list].reverse().find(point => point < current - 2) ?? maxScroll());
      viewport.scrollTo({left:destination, behavior:reducedMotion.matches ? 'instant' : 'smooth'});
    };
    const stop = () => { requested = false; explicitlyStarted = false; updateControls(); schedule(); };
    const manualMove = direction => { stop(); move(direction); };
    previous.addEventListener('click', () => manualMove(-1));
    next.addEventListener('click', () => manualMove(1));
    toggle.addEventListener('click', () => { requested = !requested; explicitlyStarted = requested; updateControls(); schedule(); });
    section.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovered = true; schedule(); } });
    section.addEventListener('pointerleave', () => { hovered = false; schedule(); });
    section.addEventListener('pointermove', event => {
      if (event.pointerType === 'mouse' && explicitlyStarted && !toggle.contains(event.target)) {
        explicitlyStarted = false;
        schedule();
      }
    });
    section.addEventListener('focusin', schedule);
    section.addEventListener('focusout', () => setTimeout(schedule, 0));
    viewport.addEventListener('pointerdown', stop, {passive:true});
    viewport.addEventListener('wheel', stop, {passive:true});
    viewport.addEventListener('scroll', updateControls, {passive:true});
    viewport.addEventListener('keydown', event => {
      if (event.target === viewport && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
        event.preventDefault(); manualMove(event.key === 'ArrowRight' ? 1 : -1);
      }
    });
    section.querySelectorAll('.review-read-more').forEach(button => {
      button.addEventListener('click', () => {
        const expanded = button.getAttribute('aria-expanded') !== 'true';
        button.setAttribute('aria-expanded', String(expanded));
        button.textContent = expanded ? 'Réduire le commentaire' : 'Lire la suite';
        document.getElementById(button.getAttribute('aria-controls')).classList.toggle('is-collapsed', !expanded);
        stop();
      });
    });
    document.addEventListener('visibilitychange', schedule);
    document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('close', schedule));
    reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) stop(); });
    new IntersectionObserver(entries => { inView = entries[0].isIntersecting; schedule(); }, {threshold:0.15}).observe(section);
    new ResizeObserver(() => { updateControls(); schedule(); }).observe(viewport);
    updateControls();
  });
})();
