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
