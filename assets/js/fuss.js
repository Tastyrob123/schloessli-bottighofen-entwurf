/* Fuss aller Seiten (fuss_bau.py): jedes Stück schwebt mit dem Scrollen an seinen Platz (Robert 19.10.2026), nur transform, deckend.
   Fortschritt je Stück: 0, wenn seine Oberkante den unteren Bildrand erreicht, 1 nach rund 40 % der Bildhöhe. Liegt ein Stück so tief,
   dass die Seite nicht mehr so weit scrollt, endet sein Weg am Seitenende, damit nichts halb unten hängen bleibt. «Nach oben» ohne Anker. */
(function () {
  var fz = document.querySelector('.fz'); if (!fz) return;
  var ruhig = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hoch = fz.querySelector('.fz__hoch');
  if (hoch) hoch.addEventListener('click', function (ev) { ev.preventDefault(); window.scrollTo({ top: 0, behavior: ruhig ? 'auto' : 'smooth' }); });
  if (ruhig) return;

  var stuecke = [];
  fz.querySelectorAll('[data-a]').forEach(function (el) {
    var art = el.getAttribute('data-a'), i = +(getComputedStyle(el).getPropertyValue('--i') || 0) || 0;
    if (art === 'zoom') { var im = el.querySelector('img'); if (im) stuecke.push({ el: im, mass: el, art: 'zoom', i: i }); }
    else stuecke.push({ el: el, mass: el, art: art, i: i });
  });
  fz.querySelectorAll('.slit').forEach(function (s) { s.querySelectorAll('.si').forEach(function (si, k) { stuecke.push({ el: si, mass: s, art: 'schlitz', i: k }); }); });

  var weich = function (p) { return 1 - Math.pow(1 - p, 3); };           // sanft auslaufend, ohne Überschiessen
  var oben = [], vh = innerHeight, maxY = 0;
  function messen() {
    vh = innerHeight; maxY = document.documentElement.scrollHeight - vh;
    stuecke.forEach(function (s) { s.el.style.transform = ''; s.letzt = ''; });
    oben = stuecke.map(function (s) { return s.mass.getBoundingClientRect().top + scrollY; });
    zeichnen();
  }
  function zeichnen() {
    var y = scrollY;
    for (var k = 0; k < stuecke.length; k++) {
      var s = stuecke[k], top = oben[k] - y;
      var weg = Math.min(vh * .42, Math.max(80, vh - (oben[k] - maxY)));   // am Seitenende kürzer, damit es ankommt
      var start = vh + s.i * 26;                                            // Nachbarn einer Reihe leicht versetzt
      var p = Math.max(0, Math.min(1, (start - top) / (weg + s.i * 26))), q = weich(p);
      var t;
      if (s.art === 'auf') t = 'translate3d(0,' + (64 * (1 - q)).toFixed(1) + 'px,0)';
      else if (s.art === 'feder') t = 'translate3d(0,' + (36 * (1 - q)).toFixed(1) + 'px,0) scale(' + (.86 + .14 * q).toFixed(4) + ')';
      else if (s.art === 'linie') t = 'scaleX(' + q.toFixed(4) + ')';
      else if (s.art === 'zoom') t = 'scale(' + (1.14 - .14 * q).toFixed(4) + ')';
      else t = 'translate3d(0,' + (108 * (1 - q)).toFixed(1) + '%,0)';
      if (s.letzt !== t) { s.el.style.transform = t; s.letzt = t; }
    }
  }
  var an = false, wartet = false;
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { an = es[0].isIntersecting; if (an) zeichnen(); }, { rootMargin: '25% 0px 25% 0px' }).observe(fz);
  else an = true;
  addEventListener('scroll', function () { if (an && !wartet) { wartet = true; requestAnimationFrame(function () { wartet = false; zeichnen(); }); } }, { passive: true });
  addEventListener('resize', messen);
  addEventListener('load', messen);
  if ('ResizeObserver' in window) new ResizeObserver(function () { messen(); }).observe(document.body);
  messen();
})();
