/* Bühne für die Köpfe der Werkzeuge (Robert 15.10.2026: «Heroes richtig schön, geil, luxuriös, edel», Vorbild Le Bureau des Carlton).
   Jeder <header class="titel"> wird zur blauen Bühne mit einem Foto des Hauses rechts. Das Foto steht in data-kb am Kopf,
   sonst nimmt die Bühne das Foto des Werkzeugs. Gilt für Le Bureau, Le Registre, La Réception und Le Livre (alle auf studio.css). */
(function () {
  var FOTO = { bu: 'haus-fassade', rg: 'stube-kerze', re: 'stube-tuer', li: 'giebel' };
  var b = document.body, art = ['rg', 're', 'li'].filter(function (k) { return b.classList.contains(k); })[0] || 'bu';
  var basis = (document.currentScript && document.currentScript.src || '').replace(/_?werkzeuge\/reception\/studio\/buehne\.js.*$/, '') + 'assets/img/';
  function baue(h) {
    if (h.__b) return; h.__b = 1;
    var ANSICHT = { uebersicht: 'haus-daemmerung', eingang: 'stube-kerze', gefragt: 'ofestuebli', nachgetragen: 'stube-rund', wissen: 'giebel' };   // je Ansicht ein Foto des Hauses (Ruedihus)
    var k = h.getAttribute('data-kb') || ANSICHT[location.hash.slice(1)] || FOTO[art];
    h.classList.add('buehne');
    var f = document.createElement('div'); f.className = 'buehne__foto'; f.setAttribute('aria-hidden', 'true');
    var im = new Image(); im.alt = ''; im.decoding = 'async';
    im.onload = function () { (im.decode ? im.decode() : Promise.resolve()).then(null, function () {}).then(function () { f.classList.add('da'); }); };   // erst gemalt, dann gilt das Foto als da (Auftakt wartet darauf)
    im.onerror = function () { if (!im.__z) { im.__z = 1; im.src = basis + k + '-s.webp'; } };
    im.src = basis + k + '-m.webp';
    f.appendChild(im); h.insertBefore(f, h.firstChild);
  }
  /* Auftritt wie Le Livre beim Öffnen (Robert 15.10.2026: «wenn ich von der Maison in die anderen Seiten navigiere, bauen sie sich einfach so auf»):
     mit jedem neuen Kopf (neue Ansicht) federn Bühne, Blätter und Kacheln nacheinander herein. Nur transform und opacity, einmal je Ansicht.
     Was schon ein eigenes Schweben hat (data-r, data-sw), bleibt unberührt. */
  var KACHELN = '.lage,.lg,.ag,.bk,.kt,.ab,.mck,.ue-weg__s,.vl,.ae,.karte,.fr,.kh,.re-gr,.rg-zahlen,.rg-tafel,.rg-block,.li-k,.mini-w,.wahl2,.reiter,.filter,.leer-hinweis'   // Vorschau-Rahmen bleiben ruhig: jede Bewegung darüber lässt Safari die ganze Seite neu zeichnen;
  var still = matchMedia('(prefers-reduced-motion:reduce)').matches;
  function feder(h) {
    if (still) return;
    var wurzel = h.parentElement; if (!wurzel) return;
    var oben = innerHeight * 1.3, i = 0, L = [h].concat([].slice.call(wurzel.querySelectorAll(KACHELN)));
    L.forEach(function (el) {
      if (i > 22 || el.closest('[data-r],[data-sw],[data-swz]') || el.__f || (window.__swSel && el.matches(window.__swSel))) return;
      if (el !== h && el.getBoundingClientRect().top > oben) return;   // was unter dem Bild liegt, steht schon da
      el.__f = 1; el.style.setProperty('--fi', i++); el.classList.add('feder');   // Klasse bleibt: nimmt man sie weg, startet ein eigener Auftritt des Elements neu (16.10.2026: Karten verschwanden einmal und kamen wieder)
    });
  }
  function alle() { [].forEach.call(document.querySelectorAll('header.titel'), function (h) { var neu = !h.__b; baue(h); if (neu) feder(h); }); }
  new MutationObserver(alle).observe(b, { childList: true, subtree: true });
  alle();
})();
