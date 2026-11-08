/* Wirtschaft am Schlössli · Verhalten der Website (Station 07, 19.10.2026). Keine Bibliothek, nativer Scroll, bewegt wird nur transform.
   1 Auftakt öffnet sich von selbst · 2 Lader mit Reihenfolge · 3 Auftritte am Rand · 4 Titel aus dem Schlitz · 5 Leiste
   6 Menü am Handy · 7 Fenster auf der Seite (Reservation, Anfrage, Gutschein) · 8 Auswahl und Kalender im Stil des Hauses */
(function () {
  var D = document, H = D.documentElement;
  var ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]nomotion/.test(location.search);
  if (ruhig) H.classList.add('ruhig');

  /* 1 Auftakt: startet, sobald das Heldenbild dekodiert ist (spätestens nach 1,2 s), damit es vom ersten Moment an scharf ist */
  var held = D.querySelector('.auftakt picture img, .kopf__bild img, .wkopf__bild img, .wkb__bild img, .epp__bild img, .esp__bild img');
  function auf() { requestAnimationFrame(function () { requestAnimationFrame(function () { H.classList.add('auf'); }); }); }
  if (held && held.decode && !held.complete) { var los = false; var go = function () { if (!los) { los = true; auf(); } }; held.decode().then(go, go); setTimeout(go, 1200); }
  else auf();

  /* 2 Lader: erster Schirm sofort, Nahes drei Bildschirme voraus, Fernes nach dem Laden der Seite der Reihe nach */
  var spaet = [].slice.call(D.querySelectorAll('img[data-src]'));
  function lade(im) {
    if (!im.dataset.src) return;
    if (im.dataset.srcset) { im.srcset = im.dataset.srcset; im.removeAttribute('data-srcset'); }
    im.src = im.dataset.src; im.removeAttribute('data-src');
  }
  if ('IntersectionObserver' in window) {
    var nah = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { lade(e.target); nah.unobserve(e.target); } }); }, { rootMargin: '300% 0px 300% 0px' });
    spaet.forEach(function (im) { nah.observe(im); });
  } else spaet.forEach(lade);
  addEventListener('load', function () {
    var rest = spaet.filter(function (im) { return im.dataset.src; }), i = 0;
    (function weiter() { if (i >= rest.length) return; var im = rest[i++]; if (im.dataset.src) { im.addEventListener('load', weiter, { once: true }); im.addEventListener('error', weiter, { once: true }); lade(im); } else weiter(); })();
  });

  /* 4 Titel zeilenweise aus dem Schlitz: Wörter nach dem echten Umbruch in Zeilen fassen */
  function teile(el) {
    if (!el.dataset.text) el.dataset.text = el.innerHTML;
    el.innerHTML = el.dataset.text;
    var teile = [];
    (function lauf(knoten, em) {
      [].slice.call(knoten.childNodes).forEach(function (k) {
        if (k.nodeType === 3) k.textContent.split(/(\s+)/).forEach(function (w) { if (w.trim()) teile.push({ w: w, em: em }); });
        else if (k.nodeName === 'BR') teile.push({ br: true });
        else lauf(k, em || k.nodeName === 'EM');
      });
    })(el, false);
    el.innerHTML = teile.map(function (t) { return t.br ? '<br>' : '<span class="w">' + (t.em ? '<em>' + t.w + '</em>' : t.w) + '</span>'; }).join(' ');
    var zeilen = [], top = null;
    [].slice.call(el.querySelectorAll('.w')).forEach(function (w) {
      var y = w.offsetTop;
      if (top === null || Math.abs(y - top) > 4) { zeilen.push([]); top = y; }
      zeilen[zeilen.length - 1].push(w.innerHTML);
    });
    el.innerHTML = zeilen.map(function (z, i) { return '<span class="z" style="--zi:' + i + '"><span>' + z.join(' ') + '</span></span>'; }).join('');
    el.classList.add('geteilt');
  }
  var schlitze = [].slice.call(D.querySelectorAll('[data-schlitz]'));
  function alleTeilen() { schlitze.forEach(teile); }
  (D.fonts && D.fonts.ready ? D.fonts.ready : Promise.resolve()).then(function () { alleTeilen(); beobachte(); });
  var breite = innerWidth;
  addEventListener('resize', function () { if (Math.abs(innerWidth - breite) < 30) return; breite = innerWidth; alleTeilen(); });

  /* 3 Auftritte: sobald das Stück den unteren Rand berührt; nichts wartet, nichts federt */
  function beobachte() {
    var ziele = [].slice.call(D.querySelectorAll('[data-r],[data-schlitz],.etage--zwei,.mk,.woche,.tag'));
    if (ruhig || !('IntersectionObserver' in window)) { ziele.forEach(function (z) { z.classList.add('da'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('da'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px 0px 0px', threshold: 0 });
    ziele.forEach(function (z) {
      if (z.closest('.fenster')) return;
      io.observe(z);
    });
    /* Fenster: der Satz rollt, sobald der Ausschnitt ein Drittel freigibt */
    var fio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.intersectionRatio >= .33) { e.target.querySelectorAll('[data-schlitz]').forEach(function (s) { s.classList.add('da'); }); fio.unobserve(e.target); } });
    }, { threshold: [0, .33, .6] });
    D.querySelectorAll('.fenster').forEach(function (f) { fio.observe(f); });
  }

  /* 3b Zahlen steigen, sobald ihr Stück im Bild ist (nur die grossen Zahlen, ease-out) */
  D.addEventListener('DOMContentLoaded', function () {});
  var zio = 'IntersectionObserver' in window && !ruhig ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return; zio.unobserve(e.target);
      var el = e.target, ziel = +el.dataset.zahl, t0 = null, dauer = 1700;
      (function lauf(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / dauer); el.textContent = Math.round(ziel * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(lauf); })(performance.now());
    });
  }, { threshold: .4 }) : null;
  if (zio) D.querySelectorAll('[data-zahl]').forEach(function (z) { z.style.minWidth = z.getBoundingClientRect().width + 'px'; z.textContent = '0'; zio.observe(z); });

  /* 5 Leiste: verschwindet beim Hinunterscrollen, kommt beim Hinaufscrollen zurück; im Auftakt immer da */
  var leiste = D.querySelector('.leiste'), letzt = scrollY, tick = false;
  addEventListener('scroll', function () {
    if (tick) return; tick = true;
    requestAnimationFrame(function () {
      var y = scrollY, weg = y > innerHeight * .6 && y > letzt + 2;
      if (y < letzt - 2 || y < innerHeight * .6) weg = false;
      if (Math.abs(y - letzt) > 2) { leiste && leiste.classList.toggle('weg', weg); letzt = y; }
      tick = false;
    });
  }, { passive: true });

  /* 6 Menü am Handy */
  var menue = D.querySelector('.menue');
  D.querySelectorAll('[data-menue]').forEach(function (b) { b.addEventListener('click', function () { var o = !menue.classList.contains('offen'); menue.classList.toggle('offen', o); menue.setAttribute('aria-hidden', o ? 'false' : 'true'); }); });
  if (menue) menue.addEventListener('click', function (e) { if (e.target.closest('a')) menue.classList.remove('offen'); });

  /* 7 Fenster auf der Seite: Reservation (Buchungsmaske des Hauses bleibt), Bankettanfrage, Gutschein */
  function oeffne(id, opts) {
    var d = D.getElementById(id); if (!d) return;
    d.classList.remove('gesendet');
    var fr = d.querySelector('iframe[data-src]'); if (fr) { fr.src = fr.dataset.src; fr.removeAttribute('data-src'); }
    if (opts && opts.wahl) { var w = d.querySelector('[data-wahl="' + opts.wahl[0] + '"]'); if (w) setze(w, opts.wahl[1]); }
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  }
  D.addEventListener('click', function (e) {
    var a = e.target.closest('[data-fenster]');
    if (a) { e.preventDefault(); var w = a.dataset.vorwahl ? a.dataset.vorwahl.split('=') : null; oeffne(a.dataset.fenster, { wahl: w }); return; }
    var z = e.target.closest('.fe__zu'); if (z) { z.closest('dialog').close(); return; }
    if (e.target.nodeName === 'DIALOG') e.target.close();
  });
  D.querySelectorAll('dialog.fe form').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!f.reportValidity()) return;
      f.closest('dialog').classList.add('gesendet');
    });
  });
  /* Auf Unterseiten ruft ?fenster=… ein Fenster direkt auf (Links aus dem Fuss und von der Startseite) */
  var q = location.search.match(/[?&]fenster=([\w-]+)/); if (q) addEventListener('load', function () { oeffne(q[1]); });

  /* 8 Auswahl und Kalender im Stil des Hauses (nie die graue Systemliste, nie der Kalender des Browsers) */
  function setze(w, wert) {
    var k = w.querySelector('.wahl-k'), inp = w.querySelector('input[type=hidden]');
    k.firstChild.textContent = wert; inp.value = wert;
    w.querySelectorAll('.wahl-l [data-v]').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.v === wert ? 'true' : 'false'); });
  }
  function zu(ausser) { D.querySelectorAll('.wahl-l.offen').forEach(function (l) { if (l !== ausser) { l.classList.remove('offen'); l.previousElementSibling.setAttribute('aria-expanded', 'false'); } }); }
  D.querySelectorAll('[data-wahl]').forEach(function (w) {
    var k = w.querySelector('.wahl-k'), l = w.querySelector('.wahl-l');
    k.addEventListener('click', function (e) { e.preventDefault(); var o = !l.classList.contains('offen'); zu(l); l.classList.toggle('offen', o); k.setAttribute('aria-expanded', o ? 'true' : 'false'); if (o && w.dataset.kal !== undefined) kal(w); });
    l.addEventListener('click', function (e) {
      var b = e.target.closest('[data-v]'); if (b) { e.preventDefault(); setze(w, b.dataset.v); l.classList.remove('offen'); k.setAttribute('aria-expanded', 'false'); return; }
      var m = e.target.closest('[data-mon]'); if (m) { e.preventDefault(); w.dataset.mon = +w.dataset.mon + (+m.dataset.mon); kal(w); }
    });
  });
  D.addEventListener('click', function (e) { if (!e.target.closest('[data-wahl]')) zu(null); });
  var MON = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  /* Tage in Zürcher Zeit; Dienstag und Mittwoch Ruhetag, Ferien des Hauses gesperrt (aus inhalt/haus.json, im Fenster als data-zu) */
  function heuteZh() { var s = new Date().toLocaleString('en-CA', { timeZone: 'Europe/Zurich', hour12: false }).slice(0, 10).split('-'); return new Date(+s[0], +s[1] - 1, +s[2]); }
  function kal(w) {
    var l = w.querySelector('.wahl-l'), h = heuteZh();
    if (w.dataset.mon === undefined) w.dataset.mon = 0;
    var m = new Date(h.getFullYear(), h.getMonth() + (+w.dataset.mon), 1), zuL = (w.dataset.zu || '').split(',');
    var s = '<div class="kal"><div class="kal__k"><button type="button" data-mon="-1" aria-label="Monat zurück"' + (+w.dataset.mon <= 0 ? ' disabled' : '') + '>‹</button><span>' + MON[m.getMonth()] + ' ' + m.getFullYear() + '</span><button type="button" data-mon="1" aria-label="Monat weiter">›</button></div><div class="kal__g">';
    ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].forEach(function (t) { s += '<span>' + t + '</span>'; });
    var start = (m.getDay() + 6) % 7; for (var i = 0; i < start; i++) s += '<span></span>';
    var n = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    for (var t = 1; t <= n; t++) {
      var d = new Date(m.getFullYear(), m.getMonth(), t), wt = d.getDay();
      var iso = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + t).slice(-2);
      var gesperrt = d < h || wt === 2 || wt === 3 || zuL.some(function (z) { var p = z.split('/'); return p.length === 2 && iso >= p[0] && iso <= p[1]; });
      var txt = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][wt] + ', ' + t + '. ' + MON[d.getMonth()] + ' ' + d.getFullYear();
      s += '<button type="button" data-v="' + txt + '"' + (gesperrt ? ' disabled' : '') + ' aria-label="' + txt + '">' + t + '</button>';
    }
    l.innerHTML = s + '</div></div>';
  }
})();

/* 9 Auftakt «Am Tisch»: Nach dem Auftritt dreht der Schriftring beim Scrollen langsam mit (nur transform, nur solange der Auftakt sichtbar ist). */
(function () {
  var ring = document.querySelector('.auftakt--teller .tl__ring');
  if (!ring || document.documentElement.classList.contains('ruhig')) return;
  var auftakt = ring.closest('.auftakt'), sichtbar = true, wartet = false;
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { sichtbar = es[0].isIntersecting; }).observe(auftakt);
  function drehe() { wartet = false; ring.style.transform = 'rotate(' + (scrollY * 0.06).toFixed(2) + 'deg)'; }
  var los = false;
  function frei() {
    if (los) return; los = true;
    ring.classList.add('frei');
    addEventListener('scroll', function () { if (sichtbar && !wartet) { wartet = true; requestAnimationFrame(drehe); } }, { passive: true });
    drehe();
  }
  ring.addEventListener('transitionend', frei, { once: true });
  setTimeout(frei, 4200);
})();

/* 10 Küche: die Bilder links und rechts vom Blatt laufen beim Scrollen gegeneinander (nur transform, nur am Rechner, nur solange der Abschnitt sichtbar ist). */
(function () {
  var gg = [].slice.call(document.querySelectorAll('[data-gegen]'));
  if (!gg.length || document.documentElement.classList.contains('ruhig') || !matchMedia('(min-width:901px)').matches) return;
  var teil = gg[0].closest('section'), sichtbar = false, wartet = false;
  function lauf() {
    wartet = false;
    var r = teil.getBoundingClientRect(), d = (r.top + r.height / 2 - innerHeight / 2) * 0.3;
    gg.forEach(function (g) { g.style.transform = 'translate3d(0,' + (d * +g.dataset.gegen).toFixed(1) + 'px,0)'; });
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { sichtbar = es[0].isIntersecting; if (sichtbar) lauf(); }, { rootMargin: '200px 0px' }).observe(teil);
  else sichtbar = true;
  addEventListener('scroll', function () { if (sichtbar && !wartet) { wartet = true; requestAnimationFrame(lauf); } }, { passive: true });
  lauf();
})();

/* 11 Feiern: Menükarten neigen sich am Rechner zur Maus (nur transform), ein Lichtstreif läuft einmal über alle Karten (Hereinkommen oder erstes Berühren),
   Karte für Karte nacheinander, damit immer nur eine glänzt. */
(function () {
  var K = [].slice.call(document.querySelectorAll('[data-mk]'));
  if (!K.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // Robert 20.10.2026: Karten fliegen beim Hereinscrollen nacheinander hoch (haus.css «Auftritt der Menükarten»); nach der Landung gilt wieder das Neigen.
  var T = K[0].closest('.mk-tisch');
  if (T && 'IntersectionObserver' in window) {
    var fio = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return; fio.disconnect(); T.classList.add('los');
      setTimeout(function () { T.classList.add('gelandet'); }, 900 + 120 * K.length + 150);
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
    fio.observe(T);
  } else if (T) T.classList.add('los', 'gelandet');
  // Robert 19.10.2026, 19:4x: jede Karte bekommt einmal ihren eigenen Schein, nacheinander von links nach rechts, egal welche Karte man
  // zuerst berührt (oder beim Hereinkommen); danach nie wieder.
  var gelaufen = false;
  function glanz() {
    if (gelaufen) return; gelaufen = true;
    K.slice().sort(function (a, b) { return a.getBoundingClientRect().left - b.getBoundingClientRect().left; })
      .forEach(function (k, i) { k.style.setProperty('--gd', (i * 900) + 'ms'); k.classList.add('glanz'); });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.intersectionRatio >= .5; })) { io.disconnect(); setTimeout(glanz, 700); }
    }, { threshold: .5 });
    io.observe(K[0].parentElement);
  }
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  K.forEach(function (k) {
    var f = 0, x = .5, y = .5;
    function setz() { f = 0; k.style.setProperty('--rx', ((.5 - y) * 9).toFixed(2) + 'deg'); k.style.setProperty('--ry', ((x - .5) * 11).toFixed(2) + 'deg'); }
    k.addEventListener('pointerenter', function () { k.classList.add('kipp'); glanz(); });
    k.addEventListener('pointermove', function (ev) { var r = k.getBoundingClientRect(); x = (ev.clientX - r.left) / r.width; y = (ev.clientY - r.top) / r.height; if (!f) f = requestAnimationFrame(setz); });
    k.addEventListener('pointerleave', function () { k.classList.remove('kipp'); k.style.setProperty('--rx', '0deg'); k.style.setProperty('--ry', '0deg'); });
  });
})();

// Bankett-Rechner «Ihr Menü» auf Feiern: Jahreszeit, drei bis fünf Gerichte, Gäste; die Anfrage übernimmt Auswahl und Richtwert ins Fenster.
(function () {
  var k = document.querySelector('.bm__karte'); if (!k) return;
  var g = k.querySelector('.bm__gaeste input'), o = k.querySelector('.bm__gaeste output');
  function feld() { return k.querySelector('.bm__liste:not([hidden])'); }
  function wahl() { return [].slice.call(feld().querySelectorAll('input:checked')); }
  function rech() {
    var c = wahl(), p = c.reduce(function (a, x) { return a + +x.value; }, 0), n = +g.value;
    o.textContent = n; g.style.setProperty('--v', ((n - g.min) / (g.max - g.min) * 100) + '%');
    k.querySelector('[data-bm-n]').textContent = c.length; k.querySelector('[data-bm-p]').textContent = p;
    k.querySelector('[data-bm-g]').textContent = n; k.querySelector('[data-bm-t]').textContent = (p * n).toLocaleString('de-CH');
    k.querySelector('[data-bm-w]').hidden = c.length >= 3 && c.length <= 5;
  }
  k.querySelectorAll('[data-bm-s]').forEach(function (b) {
    b.addEventListener('click', function () {
      k.querySelectorAll('[data-bm-s]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      k.querySelectorAll('[data-bm-feld]').forEach(function (f) { f.hidden = f.dataset.bmFeld !== b.dataset.bmS; });
      rech();
    });
  });
  k.addEventListener('input', rech); k.addEventListener('change', rech); rech();
  k.querySelector('[data-bm-anfrage]').addEventListener('click', function () {
    var c = wahl(), s = k.querySelector('[data-bm-s][aria-pressed="true"]').textContent, n = +g.value, p = c.reduce(function (a, x) { return a + +x.value; }, 0);
    var set = function (id, v) { var f = document.getElementById(id); if (f) f.value = v; };
    set('b-pers', n); set('b-gaenge', c.length); set('b-budget', 'Richtwert Speisen ' + (p * n).toLocaleString('de-CH') + ' Franken (' + p + ' je Gast)');
    set('b-text', 'Bankett ' + s + ': ' + c.map(function (x) { return x.dataset.name; }).join(', '));
  });
})();

// Rückblick «Kontaktbogen» (19.10.2026): Bild im Filmstreifen oder Pfeil wählt den Anlass für die grosse Kachel; Streifen ruht nur ausser Sicht
(function () {
  var w = document.querySelector('[data-kbg-root]');
  if (!w) return;
  var S = [].slice.call(w.querySelectorAll('[data-kbg-s]')), K = [].slice.call(w.querySelectorAll('[data-kbg]')), st = w.querySelector('[data-kbg-stand]'), i = 0;
  function zeig(n, dir) {
    var alt = i;
    i = (n + S.length) % S.length;
    dir = dir || (n >= alt ? 1 : -1);
    w.style.setProperty('--dir', dir);
    // sanfter Wechsel (Robert 22:32): die neue Kachel startet versetzt in Pfeilrichtung und gleitet an ihren Platz, die alte gleitet weg
    var neu = S[i];
    if (alt !== i && neu.getAttribute('aria-hidden')) { neu.style.transition = 'none'; neu.style.transform = 'translateX(' + (dir * 56) + 'px)'; neu.style.opacity = '0'; neu.offsetWidth; neu.style.transition = neu.style.transform = neu.style.opacity = ''; }
    S.forEach(function (s, j) { if (j === i) s.removeAttribute('aria-hidden'); else s.setAttribute('aria-hidden', 'true'); });
    K.forEach(function (k) { k.setAttribute('aria-pressed', +k.dataset.kbg === i); });
    var h = S[i].querySelector('h3'); if (st && h) st.textContent = h.textContent;
    S[i].querySelectorAll('img[data-src]').forEach(function (m) { m.src = m.dataset.src; if (m.dataset.srcset) m.srcset = m.dataset.srcset; m.removeAttribute('data-src'); });
  }
  w.addEventListener('click', function (ev) {
    var k = ev.target.closest('[data-kbg]'), p = ev.target.closest('[data-kbg-p]');
    if (k) { zeig(+k.dataset.kbg); var b = w.querySelector('.kbg__buehne'); if (b.getBoundingClientRect().top > innerHeight * .7) b.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    else if (p) zeig(i + +p.dataset.kbgP, +p.dataset.kbgP);
  });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (x) { w.classList.toggle('still', !x[0].isIntersecting); }).observe(w.querySelector('.kbg__band'));
  zeig(0);
})();

// Weinliste filtern (19.10.2026): Art, Land und Suche; leere Platten, Kapitel und Arten verschwinden, Zahl der Treffer steht unter dem Filter
(function () {
  var f = document.querySelector('.wl__filter');
  if (!f) return;
  var Z = [].slice.call(document.querySelectorAll('.wl__z')), P = [].slice.call(document.querySelectorAll('.wl__p')),
      K = [].slice.call(document.querySelectorAll('.wl__kap')), G = [].slice.call(document.querySelectorAll('.wk__gruppe[data-art]')),
      q = f.querySelector('[data-f-q]'), stand = f.querySelector('[data-f-stand]'), leer = document.querySelector('[data-f-leer]'), art = '', land = '';
  function norm(t) { return (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  Z.forEach(function (z) { z._q = norm(z.dataset.q); z._p = z.closest('.wl__p'); z._g = z.closest('.wk__gruppe').dataset.art; });
  function los() {
    var w = norm(q.value).trim().split(/\s+/).filter(Boolean), n = 0;
    Z.forEach(function (z) {
      var ok = (!art || z._g === art) && (!land || z._p.dataset.land === land) && w.every(function (x) { return z._q.indexOf(x) > -1; });
      z.hidden = !ok; if (ok) n++;
    });
    P.forEach(function (p) { p.hidden = !p.querySelector('.wl__z:not([hidden])'); });
    K.forEach(function (k) { k.hidden = !k.querySelector('.wl__p:not([hidden])'); });
    G.forEach(function (g) { g.hidden = !g.querySelector('.wl__kap:not([hidden])'); });
    stand.textContent = n + (n === 1 ? ' Wein' : ' Weine');
    leer.hidden = n > 0;
  }
  f.addEventListener('click', function (ev) {
    var b = ev.target.closest('button'); if (!b) return;
    var feld = 'fArt' in b.dataset ? 'fArt' : 'fLand';
    f.querySelectorAll('[data-' + (feld === 'fArt' ? 'f-art' : 'f-land') + ']').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
    if (feld === 'fArt') art = b.dataset.fArt; else land = b.dataset.fLand;
    los();
  });
  var t; q.addEventListener('input', function () { clearTimeout(t); t = setTimeout(los, 120); });
})();

/* 11 Leiste «Speisefolge» (Fassung 66, 20.10.2026): Menü als Karte öffnen und schliessen, Datum des Tages, Escape und Klick daneben schliessen. */
(function () {
  var D = document, sf = D.querySelector('.sf'); if (!sf) return;
  var karte = sf.querySelector('.sf__karte'), vorher = null, uhr;
  var h = sf.querySelector('[data-heute]'), d = new Date();
  if (h) h.textContent = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'][d.getDay()] + ', ' + d.getDate() + '. ' +
    ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'][d.getMonth()] + ' ' + d.getFullYear();
  function auf() {
    vorher = D.activeElement; clearTimeout(uhr);
    sf.classList.remove('zu'); karte.scrollTop = 0; sf.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(function () { sf.classList.add('offen'); });
    setTimeout(function () { var z = sf.querySelector('.sf__zu'); if (z) z.focus({ preventScroll: true }); }, 60);
  }
  function zu(schnell) {
    if (!sf.classList.contains('offen')) return;
    sf.classList.toggle('schnell', !!schnell); sf.classList.add('zu'); sf.classList.remove('offen'); sf.setAttribute('aria-hidden', 'true');
    uhr = setTimeout(function () { sf.classList.remove('zu', 'schnell'); }, schnell ? 320 : 600);
    if (vorher && vorher.focus) vorher.focus({ preventScroll: true });
  }
  D.addEventListener('click', function (e) {
    if (e.target.closest('[data-sf-auf]')) { e.preventDefault(); auf(); return; }
    if (e.target.closest('[data-sf]')) { zu(false); return; }
    if (e.target.closest('.sf a')) zu(true); /* beim Wechsel der Kategorie geht die Karte sofort */
  });
  D.addEventListener('keydown', function (e) { if (e.key === 'Escape') zu(false); });
})();

/* 12 Weg zur nächsten Seite: Auf der Karte trägt die Lästermeile ihren eigenen Weg (wer über #laestermeile kommt, geht danach weiter zum Feiern) */
(function () {
  var D = document, alt = D.querySelectorAll('[data-folge]'); if (alt.length < 2) return;
  function waehle() {
    var h = location.hash.replace('#', ''), da = false;
    [].forEach.call(alt, function (s) { if (s.dataset.folge === h) da = true; });
    [].forEach.call(alt, function (s) { s.hidden = da ? s.dataset.folge !== h : s.dataset.folge !== 'haupt'; });
  }
  waehle(); addEventListener('hashchange', waehle);
})();
