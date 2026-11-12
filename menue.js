// Menü auf dem Handy auf- und zuklappen
(function () {
  var kopf = document.querySelector('.kopf');
  var knopf = document.querySelector('.menue-knopf');
  if (!kopf || !knopf) return;
  function setzen(offen) {
    kopf.classList.toggle('offen', offen);
    knopf.setAttribute('aria-expanded', offen ? 'true' : 'false');
    knopf.setAttribute('aria-label', offen ? 'Menü schließen' : 'Menü öffnen');
  }
  knopf.addEventListener('click', function () { setzen(!kopf.classList.contains('offen')); });
  document.querySelectorAll('.nav a').forEach(function (a) {
    a.addEventListener('click', function () { setzen(false); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setzen(false); });
})();

// Sanftes Einblenden beim Scrollen (nur wenn der Browser es kann und Bewegung erwünscht ist)
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var auswahl = [
    'main section:not(.start) h2', 'main section:not(.start) .einleitung', 'main section:not(.start) .kennzeile',
    '.karte', '.format', '.fotoreihe figure', '.person-karte', '.presse', '.stimmen blockquote',
    '.partner', '.zahlen > *', '.video-karte', '.zweispaltig > *', '.haken', 'main h3'
  ].join(',');
  var elemente = Array.prototype.slice.call(document.querySelectorAll(auswahl))
    .filter(function (el) { return !el.closest('.start') && !el.closest('.recht'); });
  // verschachtelte Treffer nur einmal animieren
  elemente = elemente.filter(function (el) {
    return !elemente.some(function (anderes) { return anderes !== el && anderes.contains(el); });
  });
  elemente.forEach(function (el) {
    var geschwister = Array.prototype.indexOf.call(el.parentNode.children, el);
    var gleiche = el.parentNode.querySelectorAll(':scope > .' + (el.classList[0] || 'x')).length > 1;
    el.classList.add('einblenden');
    if (gleiche) el.style.transitionDelay = Math.min(geschwister, 4) * 80 + 'ms';
  });
  var beobachter = new IntersectionObserver(function (eintraege) {
    eintraege.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      el.classList.add('sichtbar'); beobachter.unobserve(el);
      // danach aufräumen, damit Hover-Effekte wieder schnell reagieren
      setTimeout(function () { el.classList.remove('einblenden', 'sichtbar'); el.style.transitionDelay = ''; }, 1100);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  elemente.forEach(function (el) { beobachter.observe(el); });
})();
