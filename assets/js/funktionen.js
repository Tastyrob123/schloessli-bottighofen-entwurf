/* Gäste-Funktionen der Wirtschaft am Schlössli (Station 07, Runde 3, 19.10.2026). Läuft nach haus.js, nichts wird verschickt.
   1 Weinberater mit Wein-Kärtchen · 2 Flasche zur Reservierung · 4 Wein zum Gang · 5 Abend zusammenstellen · 6 Reiter der Reservation
   7 Gutschein-Karte · 8 Kalender · 10 Der See heute (Sonnenuntergang aus dem Sonnenstand gerechnet, keine fremde Abfrage) */
(function () {
  var D = document;
  var $ = function (s, r) { return (r || D).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || D).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var weine = null, bilder = {}, infos = { weine: {}, stile: {}, weingut: {}, gruppen: {} }, bildchen = { gruppe: {}, aroma: {}, speise: {} }, laden = null;
  function holeWeine() {
    if (!laden) laden = Promise.all([
      fetch('assets/data/weine.json').then(function (r) { return r.json(); }),
      fetch('assets/data/wein-bilder.json').then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }),
      fetch('assets/data/wein-infos.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
      fetch('assets/data/wein-bildchen.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
    ]).then(function (x) { weine = x[0]; bilder = x[1] || {}; if (x[2]) infos = x[2]; if (x[3]) bildchen = x[3]; return weine; });
    return laden;
  }
  function info(id) { return infos.weine[id] || {}; }
  var KURZ = { 'Champagner & Schaumwein': 'Schaumwein', 'Weisswein': 'Weiss', 'Rosé': 'Rosé', 'Rotwein': 'Rot', 'Süsswein': 'Süss' };
  var KLASSE = { 'Champagner & Schaumwein': 'sch', 'Weisswein': 'wei', 'Rosé': 'ros', 'Rotwein': 'rot', 'Süsswein': 'sue' };
  function gross(f) { return f.gross.replace('.', ',').replace('l', ' l'); }
  function preisText(w) { return w.flaschen.map(function (f) { return gross(f) + ' · ' + f.preis; }).join('   '); }
  /* Flaggen kommen aus dem Vorrat der Seite (funktionen.py), eine Quelle; gezeichnete Flaschen stehen nirgends mehr (Robert 20.10.2026) */
  var ZV = D.getElementById('wf-zeichen');
  function zeichen(sel) { var t = ZV && ZV.content.querySelector(sel); return t ? t.innerHTML : ''; }
  function flaggeVon(land) { return zeichen('[data-land="' + land + '"]'); }

  /* Ein Wein-Kärtchen: Landschaft der Herkunft oben, die echte Flasche freigestellt davor, Flagge des Landes.
     Ohne Foto steht die gezeichnete Flasche seiner Art, nie das Etikett eines anderen Weins. */
  function kaertchen(w, i) {
    var b = bilder[w.id] || {};
    var fl = b.f ? '<span class="wf__schatten"></span><img class="wf__fl" src="' + b.f + '" alt="" loading="lazy" decoding="async">' : '';
    var land = b.rk || b.r ? '<img class="wf__land" src="' + (b.rk || b.r) + '" alt="" loading="lazy" decoding="async">' : '';
    return '<button type="button" class="wf wf--' + KLASSE[w.art] + (b.f ? '' : ' wf--ohne-flasche') + (b.r ? '' : ' wf--ohne-land') + '" data-wein="' + w.id + '" style="--i:' + (i % 4) + '">' +
      '<span class="wf__bild">' + land + fl + '<span class="wf__flagge">' + flaggeVon(w.land) + '</span></span>' +
      '<span class="wf__text"><span class="wf__art">' + esc(KURZ[w.art]) + (w.region ? ' · ' + esc(w.region) : (w.land ? ' · ' + esc(w.land) : '')) + '</span>' +
      '<span class="wf__name">' + esc(w.name) + '</span>' +
      '<span class="wf__erz">' + esc(w.erzeuger || '') + '</span>' +
      '<span class="wf__fuss"><span class="wf__jahr">' + (w.jahr ? esc(w.jahr) : '<small>ohne Jahrgang</small>') + '</span><span class="wf__preis">' + esc(preisText(w)) + '</span></span></span></button>';
  }

  /* 1 Weinberater «Der Keller»: klassisch (Art, Herkunft, Rebsorte, Preis, Flasche) oder nach Geschmack (Körper, Säure, Süsse, Tannin, Aromen, Speisen).
     Beide Auswahlen gelten zusammen; jede Möglichkeit zeigt, wie viele Weine danach noch passen. */
  var form = $('[data-berater]'), raster = $('[data-weine]');
  if (form && raster) {
    var gezeigt = 12, mehr = $('[data-mehr]'), neu = $('[data-neu]');
    var FELDER = ['art', 'land', 'rebe', 'preis', 'gross', 'g_k', 'g_sa', 'g_su', 'g_t', 'speise'];
    /* Stufen auf der Skala 1 bis 5 von Vivino: [Feld, Grenze unten/Mitte, Grenze Mitte/oben] */
    var STUFE = { g_k: ['k', 2.8, 3.8], g_sa: ['sa', 2.8, 3.8], g_su: ['su', 1.8, 3], g_t: ['t', 2.5, 3.5] };
    function wert(n) { var c = $('input[name="' + n + '"]', form); if (c && c.type === 'hidden' && !c.hasAttribute('hidden')) return c.value; c = $('input[name="' + n + '"]:checked', form); return c ? c.value : ''; }
    function stand() { var s = {}; FELDER.forEach(function (f) { s[f] = wert(f); }); s.aroma = $$('input[name=aroma]:checked', form).map(function (i) { return i.value; }); return s; }
    function passt(w, s) {
      if (s.art && w.art !== s.art) return false;
      if (s.land && w.land !== s.land) return false;
      if (s.rebe && w.reben.indexOf(s.rebe) < 0) return false;
      if (s.gross) { if (s.gross === 'gross') { if (!w.flaschen.some(function (f) { return parseFloat(f.gross) > 1.5; })) return false; } else if (!w.flaschen.some(function (f) { return f.gross === s.gross; })) return false; }
      if (s.preis) { var q = s.preis.split('-'), lo = +q[0], hi = +q[1]; if (!w.flaschen.some(function (f) { return f.preis >= lo && f.preis <= hi; })) return false; }
      var x = info(w.id);
      for (var g in STUFE) {
        if (!s[g]) continue;
        var v = x.s && x.s[STUFE[g][0]]; if (!v) return false;
        var stufe = v < STUFE[g][1] ? 1 : v <= STUFE[g][2] ? 2 : 3; if (stufe !== +s[g]) return false;
      }
      if (s.aroma.length) { var hat = (x.a || []).map(function (a) { return a[0]; }); if (!s.aroma.every(function (a) { return hat.indexOf(a) >= 0; })) return false; }
      if (s.speise && (x.sp || []).indexOf(s.speise) < 0) return false;
      return true;
    }
    function zaehle(s, feld, v) { var t = {}; for (var k in s) t[k] = s[k]; t[feld] = v; return weine.filter(function (w) { return passt(w, t); }).length; }
    /* Bilder zuerst: Weine mit echtem Flaschenfoto vorne, innerhalb nach Preis */
    function filtern() {
      var s = stand();
      return weine.filter(function (w) { return passt(w, s); }).sort(function (x, y) {
        var bx = bilder[x.id] && bilder[x.id].f ? 0 : 1, by = bilder[y.id] && bilder[y.id].f ? 0 : 1;
        return bx - by || x.flaschen[0].preis - y.flaschen[0].preis;
      });
    }
    function zahlen() {
      var s = stand();
      $$('input[type=radio]:not([hidden])', form).forEach(function (i) { var n = zaehle(s, i.name, i.value), z = $('[data-z]', i.parentNode); if (z) z.textContent = n; i.parentNode.classList.toggle('leer', !n && !i.checked); });
      $$('input[name=aroma]', form).forEach(function (i) { var a = s.aroma.indexOf(i.value) >= 0 ? s.aroma : s.aroma.concat([i.value]); var n = zaehle(s, 'aroma', a); $('[data-z]', i.parentNode).textContent = n; i.parentNode.classList.toggle('leer', !n && !i.checked); });
      $$('[data-kw]', form).forEach(function (k) { var f = k.dataset.kw; $$('[data-v]', k).forEach(function (b) { var n = zaehle(s, f, b.dataset.v); $('[data-z]', b).textContent = n; b.classList.toggle('leer', !n); }); });
      neu.hidden = !(FELDER.some(function (f) { return s[f]; }) || s.aroma.length);
    }
    function zeigen() {
      var t = filtern();
      $('[data-treffer]').textContent = t.length;
      $('[data-treffer-t]').textContent = t.length === 1 ? 'Wein passt' : 'Weine passen';
      raster.innerHTML = t.length ? t.slice(0, gezeigt).map(kaertchen).join('') : '<p class="wk-leer">Zu dieser Auswahl steht kein Wein auf der Karte. Lassen Sie eine Angabe weg, oder fragen Sie Jonas Volpert.</p>';
      mehr.hidden = t.length <= gezeigt;
      zahlen();
      requestAnimationFrame(function () { $$('.wf', raster).forEach(function (k) { k.classList.add('da'); }); });
    }
    holeWeine().then(zeigen);
    form.addEventListener('change', function () { gezeigt = 12; zeigen(); });
    mehr.addEventListener('click', function () { var alt = gezeigt; gezeigt += 12; var t = filtern(); raster.insertAdjacentHTML('beforeend', t.slice(alt, gezeigt).map(kaertchen).join('')); mehr.hidden = t.length <= gezeigt; requestAnimationFrame(function () { $$('.wf', raster).forEach(function (k) { k.classList.add('da'); }); }); });
    /* Klassisch oder nach Geschmack: nur die sichtbare Auswahl wechselt, die Wahl bleibt */
    $$('[data-modus]', form).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('[data-modus]', form).forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
        $$('[data-fach-k]', form).forEach(function (f) { f.hidden = f.dataset.fachK !== b.dataset.modus; });
      });
    });
    /* Skala: ein zweiter Klick auf die gewählte Stufe hebt sie wieder auf */
    $$('.skala__p', form).forEach(function (p) {
      var i = $('input', p);
      p.addEventListener('pointerdown', function () { p.dataset.war = i.checked ? '1' : ''; });
      p.addEventListener('click', function (ev) { if (p.dataset.war) { ev.preventDefault(); p.dataset.war = ''; $('input[value=""]', p.parentNode).checked = true; gezeigt = 12; zeigen(); } });
    });
    /* Auswahl im Stil des Hauses für Rebsorte, Preis, Flasche und Speise */
    function zuAlle(ausser) { $$('.keller__l.offen', form).forEach(function (l) { if (l !== ausser) { l.classList.remove('offen'); l.previousElementSibling.setAttribute('aria-expanded', 'false'); } }); }
    $$('[data-kw]', form).forEach(function (k) {
      var knopf = $('.keller__k', k), l = $('.keller__l', k), inp = $('input', k);
      knopf.addEventListener('click', function () { var o = !l.classList.contains('offen'); zuAlle(l); l.classList.toggle('offen', o); knopf.setAttribute('aria-expanded', o ? 'true' : 'false'); });
      l.addEventListener('click', function (ev) {
        var b = ev.target.closest('[data-v]'); if (!b) return;
        inp.value = b.dataset.v; knopf.firstChild.textContent = b.dataset.l; k.classList.toggle('gewaehlt', !!b.dataset.v);
        $$('[data-v]', l).forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
        l.classList.remove('offen'); knopf.setAttribute('aria-expanded', 'false');
        gezeigt = 12; zeigen();
      });
    });
    D.addEventListener('click', function (ev) { if (!ev.target.closest('[data-kw]')) zuAlle(null); });
    neu.addEventListener('click', function () {
      $$('input[type=radio][value=""]', form).forEach(function (i) { i.checked = true; });
      $$('input[name=aroma]', form).forEach(function (i) { i.checked = false; });
      $$('[data-kw]', form).forEach(function (k) { var b = $('[data-v=""]', k); $('input', k).value = ''; $('.keller__k', k).firstChild.textContent = b.dataset.l; k.classList.remove('gewaehlt'); });
      gezeigt = 12; zeigen();
    });
  }

  /* Wein-Ansicht im Fenster: die Welt des Weins (Landschaft der Herkunft, Flasche, Flagge, Angaben mit Zeichen, Weine desselben Weinguts) */
  var aktuell = null;
  var ZZ = {
    erz: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 20h18M5 20V10l7-5 7 5v10M10 20v-5h4v5"/></svg>',
    jahr: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>',
    ort: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6-6.2-6-11a6 6 0 0 1 12 0c0 4.8-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/></svg>',
    rebe: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="10" r="2.4"/><circle cx="14" cy="10" r="2.4"/><circle cx="11.5" cy="14" r="2.4"/><circle cx="16.5" cy="14" r="2.4"/><circle cx="14" cy="18" r="2.4"/><path d="M12 7.5C12 5 13.5 3.5 16 3"/></svg>',
    notiz: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l3 3v15H6z"/><path d="M9 10h6M9 14h6M9 18h4"/></svg>',
    flasche: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 2h4v5c0 1.5 3 2.5 3 5v9a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-9c0-2.5 3-3.5 3-5z"/><path d="M7.5 13h9"/></svg>'
  };
  function zeigeWein(w) {
    aktuell = w;
    var d = $('#fe-wein'), b = bilder[w.id] || {};
    d.className = 'fe ww ww--' + KLASSE[w.art] + (b.f ? '' : ' ww--ohne-flasche') + (b.r ? '' : ' ww--ohne-land');
    $('[data-w-land]', d).innerHTML = b.r ? '<img src="' + b.r + '" alt="Landschaft in ' + esc(w.region || w.land) + '" decoding="async" style="background:url(' + (b.rk || b.r) + ') center/cover">' : '';
    $('[data-w-flasche]', d).innerHTML = b.f ? '<img src="' + b.f + '" alt="Flasche ' + esc(w.name) + '" decoding="async">' : '';
    $('[data-w-flagge]', d).innerHTML = flaggeVon(w.land);
    $('[data-w-herkunft]', d).textContent = [KURZ[w.art] === 'Schaumwein' ? 'Schaumwein' : w.art, w.land, w.region].filter(Boolean).join(' · ');
    $('[data-w-titel]', d).textContent = w.name;
    $('[data-w-erz]', d).textContent = w.erzeuger || '';
    var zeilen = [['jahr', 'Jahrgang', w.jahr || 'ohne Angabe'], ['ort', 'Herkunft', [w.region, w.land].filter(Boolean).join(', ')], ['rebe', 'Rebsorte', w.reben.join(', ')], ['flasche', 'Flaschen und Preise', w.flaschen.map(function (f) { return gross(f) + ' für ' + f.preis + ' Franken'; }).join(' · ')], ['notiz', 'Auf der Karte', w.notiz]];
    $('[data-w-angaben]', d).innerHTML = zeilen.filter(function (z) { return z[2]; }).map(function (z) { return '<div><dt>' + ZZ[z[0]] + esc(z[1]) + '</dt><dd>' + esc(z[2]) + '</dd></div>'; }).join('');
    var x = info(w.id);
    if (x.al) $('[data-w-angaben]', d).insertAdjacentHTML('beforeend', '<div><dt>' + ZZ.flasche + 'Alkohol' + (x.vs ? ' und Verschluss' : '') + '</dt><dd>' + String(x.al).replace('.', ',') + ' %' + (x.vs ? ' · ' + esc(x.vs) : '') + '</dd></div>');
    if (x.rb && x.rb.join() !== w.reben.join()) { var rz = $$('[data-w-angaben] dt', d).filter(function (t) { return /Rebsorte/.test(t.textContent); })[0]; if (rz) rz.nextElementSibling.textContent = x.rb.join(', '); else $('[data-w-angaben]', d).insertAdjacentHTML('beforeend', '<div><dt>' + ZZ.rebe + 'Rebsorte</dt><dd>' + esc(x.rb.join(', ')) + '</dd></div>'); }
    /* Im Glas: Struktur auf der Skala 1 bis 5 */
    var SK = [['k', 'Körper', 'leicht', 'voll'], ['sa', 'Säure', 'mild', 'frisch'], ['su', 'Süsse', 'trocken', 'süss'], ['t', 'Tannin', 'weich', 'kräftig'], ['p', 'Perlage', 'zart', 'kräftig']];
    var glas = x.s ? SK.filter(function (k) { return x.s[k[0]]; }).map(function (k) { var v = x.s[k[0]]; return '<div class="wg__z wg__z--' + k[0] + '"><span class="wg__n">' + k[1] + '</span><span class="wg__l">' + k[2] + '</span><span class="wg__bahn"><i style="--p:' + ((Math.min(5, Math.max(1, v)) - 1) / 4).toFixed(3) + '"></i></span><span class="wg__l">' + k[3] + '</span></div>'; }).join('') : '';
    $('[data-w-glas]', d).innerHTML = glas;
    $('[data-w-glas-t]', d).hidden = !glas;
    var ar = (x.a || []).filter(function (a, i) { return i < 2 || a[1] >= 2; });
    $('[data-w-aromen]', d).innerHTML = ar.map(function (a) {
      var bl = a[2].map(function (w) { return bildchen.aroma[w]; }).filter(Boolean).slice(0, 3);
      if (!bl.length && bildchen.gruppe[a[0]]) bl = [bildchen.gruppe[a[0]]];
      return '<div class="wa"><span class="wa__m wa__m--' + bl.length + '">' + bl.map(function (b) { return '<img src="' + b + '" alt="" loading="lazy">'; }).join('') + '</span><div><b>' + esc(infos.gruppen[a[0]] || a[0]) + '</b><span>' + esc(a[2].join(', ')) + '</span></div></div>';
    }).join('');
    $('[data-w-aromen-t]', d).hidden = !ar.length;
    $('[data-w-speisen]', d).innerHTML = (x.sp || []).map(function (f) { return '<li>' + (bildchen.speise[f] ? '<img src="' + bildchen.speise[f] + '" alt="" loading="lazy">' : '') + esc(f.replace(/ \(.*\)$/, '')) + '</li>'; }).join('');
    $('[data-w-speisen-t]', d).hidden = !(x.sp || []).length;
    var st = infos.stile[x.st];
    $('[data-w-stil]', d).innerHTML = st ? '<h3>' + esc(st.name) + '</h3>' + (st.kurz ? '<p class="ww__kurz">' + esc(st.kurz) + (st.koerper ? ' · ' + esc(st.koerper) : '') + '</p>' : (st.koerper ? '<p class="ww__kurz">' + esc(st.koerper) + (st.saeure ? ', Säure ' + esc(st.saeure.toLowerCase()) : '') + '</p>' : '')) + (st.text ? '<p>' + esc(st.text) + '</p>' : '') + ((st.fakten || []).length ? '<ul>' + st.fakten.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' : '') : '';
    $('[data-w-stil-t]', d).hidden = !st;
    var gut = infos.weingut[x.wg] || infos.weingut[w.erzeuger];
    var host = gut ? gut.quelle.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] : '';
    $('[data-w-gut]', d).innerHTML = gut ? '<p>' + esc(gut.text) + '</p><a class="ww__quelle" href="' + gut.quelle + '" target="_blank" rel="noopener">Quelle: ' + esc(host) + '</a>' : '';
    $('[data-w-gut-t]', d).hidden = !gut;
    $('[data-w-hk]', d).textContent = x.hk || ''; $('[data-w-hk-t]', d).hidden = !x.hk;
    $('[data-w-bes]', d).textContent = x.bes || ''; $('[data-w-bes-t]', d).hidden = !x.bes;
    $('[data-w-herkunftsnachweis]', d).hidden = !(glas || ar.length || st);
    var gleiche = weine.filter(function (x) { return x.erzeuger && x.erzeuger === w.erzeuger && x.id !== w.id; }).slice(0, 4);
    $('[data-w-haus]', d).hidden = !gleiche.length;
    $('[data-w-liste]', d).innerHTML = gleiche.map(function (x) {
      var bx = bilder[x.id] || {};
      return '<button type="button" class="ww__mini" data-mini="' + x.id + '">' + (bx.f ? '<span class="ww__mb"><img src="' + bx.f + '" alt="" loading="lazy"></span>' : '<span class="ww__mb ww__mb--jahr"><em>' + (x.jahr ? esc(x.jahr) : 'NV') + '</em><i>' + esc(KURZ[x.art]) + '</i></span>') + '<b>' + esc(x.name) + '</b><small>' + esc((bx.f ? [x.jahr] : []).concat(x.flaschen.map(function (f) { return gross(f) + ' · ' + f.preis; })).filter(Boolean).join('  ')) + '</small></button>';
    }).join('');
  }
  D.addEventListener('click', function (ev) {
    var m = ev.target.closest('[data-mini]');
    if (m) { var x = weine.filter(function (w) { return w.id === +m.dataset.mini; })[0]; if (x) { zeigeWein(x); $('#fe-wein').scrollTop = 0; } return; }
    var k = ev.target.closest('[data-wein]'); if (!k || k.closest('dialog')) return;
    holeWeine().then(function () {
      var w = weine.filter(function (x) { return x.id === +k.dataset.wein; })[0]; if (!w) return;
      zeigeWein(w);
      var d = $('#fe-wein'); d.showModal ? d.showModal() : d.setAttribute('open', '');
    });
  });

  /* 2 Flasche zur Reservierung: wird gemerkt und in jede Anfrage eingesetzt */
  var KEY = 'schloessli-flasche';
  function flasche() { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function setzeFlasche(w) { try { if (w) sessionStorage.setItem(KEY, JSON.stringify(w)); else sessionStorage.removeItem(KEY); } catch (e) {} zeigeFlasche(); }
  function zeigeFlasche() {
    var w = flasche();
    $$('[data-flasche]').forEach(function (f) {
      $('.flasche__leer', f).hidden = !!w; $('.flasche__voll', f).hidden = !w;
      $('input[name=flasche]', f).value = w ? (w.erzeuger ? w.erzeuger + ', ' : '') + w.name + (w.jahr ? ' ' + w.jahr : '') + ' (' + w.flaschen[0].gross + ', ' + w.flaschen[0].preis + ')' : '';
      if (w) { $('[data-f-name]', f).textContent = w.name + (w.jahr ? ' ' + w.jahr : ''); $('[data-f-info]', f).textContent = [w.erzeuger, w.land, preisText(w)].filter(Boolean).join(' · '); }
    });
    D.dispatchEvent(new Event('flasche'));
  }
  zeigeFlasche();
  if (/[?&]von=abend/.test(location.search)) { try { sessionStorage.setItem('schloessli-von', 'abend'); } catch (e) {} }
  D.addEventListener('click', function (ev) {
    if (ev.target.closest('[data-bereitlegen]') && aktuell) {
      setzeFlasche(aktuell); $('#fe-wein').close();
      /* aus «Ihr Abend» gekommen: zurück zum Abend, die Flasche steht dort schon (20.10.2026) */
      var von = /[?&]von=abend/.test(location.search); try { von = von || sessionStorage.getItem('schloessli-von') === 'abend'; } catch (e) {}
      if (von) { try { sessionStorage.removeItem('schloessli-von'); } catch (e) {} location.href = 'abend.html#az-wein'; return; }
      var r = $('#fe-reservation'); if (r) { waehleReiter(r, 'anfrage'); r.classList.remove('gesendet'); r.showModal(); }
    }
    if (ev.target.closest('[data-f-weg]')) setzeFlasche(null);
  });

  /* 6 Reiter der Reservation: Anfrage mit Wünschen oder direkt in der Buchungsmaske des Hauses */
  function waehleReiter(d, n) {
    $$('[data-reiter]', d).forEach(function (b) { b.setAttribute('aria-selected', b.dataset.reiter === n ? 'true' : 'false'); });
    $$('[data-fach]', d).forEach(function (f) { f.hidden = f.dataset.fach !== n; });
    if (n === 'direkt') { var fr = $('iframe[data-src]', d); if (fr) { fr.src = fr.dataset.src; fr.removeAttribute('data-src'); } }
  }
  D.addEventListener('click', function (ev) { var b = ev.target.closest('[data-reiter]'); if (b) waehleReiter(b.closest('dialog'), b.dataset.reiter); });
  /* Vorwahl aus Knöpfen («Platz draussen wünschen»): Wahlfeld im Fenster setzen */
  D.addEventListener('click', function (ev) {
    var a = ev.target.closest('[data-fenster][data-vorwahl]'); if (!a) return;
    var q = a.dataset.vorwahl.split('='), d = D.getElementById(a.dataset.fenster);
    setTimeout(function () { var w = d && d.querySelector('[data-wahl="' + q[0] + '"]'); if (!w) return; $('.wahl-k', w).firstChild.textContent = q[1]; $('input[type=hidden]', w).value = q[1]; if (d.id === 'fe-reservation') waehleReiter(d, 'anfrage'); }, 0);
  });

  /* 4 Wein zum Gang (Robert 19.10.2026, Fassung 4 «Jonas schenkt ein»): Küche wählen, drei Kärtchen fliegen von weit unten herein
     (wie die Abzüge im Keller: deckend, 1,7 s, je 180 ms versetzt, nur transform). Die Weine stehen fertig im HTML. */
  var wzg = $('[data-wzg]');
  if (wzg) {
    var ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;
    function fliege(d) {
      if (ruhig || !d) return;
      d.classList.add('unten'); void d.offsetWidth;
      requestAnimationFrame(function () { d.classList.remove('unten'); });
    }
    var erste = $('.wzg4__drei:not([hidden])', wzg);
    if (!ruhig && erste && 'IntersectionObserver' in window) {
      erste.classList.add('unten');
      var io = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { io.disconnect(); erste.classList.remove('unten'); }
      }, { rootMargin: '0px 0px -30% 0px' });
      io.observe($('.wzg4__wahl', wzg));
    }
    wzg.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-kue]'); if (!b || b.getAttribute('aria-pressed') === 'true') return;
      $$('[data-kue]', wzg).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      $$('.wzg4__drei', wzg).forEach(function (d) { d.hidden = d.dataset.fuer !== b.dataset.kue; if (!d.hidden) fliege(d); });
    });
  }

  /* 5 Abend zusammenstellen: Zettel rechnet live mit, aus den Preisen der Karte */
  var ab = $('[data-abend]');
  if (ab) {
    var zettel = $('[data-zettel]'), summe = $('[data-summe]');
    function wertA(n) { var c = $('[name="' + n + '"]:checked', ab); return c ? c.value : ''; }
    function feld(n) { var f = $('[name="' + n + '"]', ab); return f ? f.value : ''; }
    function lies() {
      var menue = wertA('menue'), pers = Math.max(1, parseInt(feld('personen'), 10) || 1);
      $('[data-alacarte]').hidden = menue !== 'alacarte';
      var ger = $$('[name=gerichte]:checked', ab), betrag = 0, mtext = '';
      if (menue === 'alacarte') { ger.forEach(function (g) { betrag += +g.dataset.preis; }); mtext = ger.length ? ger.map(function (g) { return g.value.charAt(0) + g.value.slice(1).toLowerCase(); }).join(', ') : 'à la carte, noch nichts gewählt'; betrag *= pers; }
      else { var lab = $('[name=menue]:checked', ab).nextElementSibling.textContent; mtext = lab; var m = lab.match(/(\d+) Franken/); betrag = m ? +m[1] * pers : 0; }
      var all = $$('[name=allergene]:checked', ab).map(function (c) { return c.nextElementSibling.textContent; });
      var z = [['Anlass', wertA('anlass')], ['Tag', feld('datum') || 'noch offen'], ['Uhrzeit', feld('uhrzeit') || 'noch offen'], ['Personen', pers], ['Platz', feld('platz')], ['Menü', mtext], ['Wein', feld('flasche') || 'noch keine Flasche'], ['Allergien', all.join(', ') || 'keine angegeben'], ['Wünsche', feld('wunsch').trim() || 'keine'], ['Name', feld('name').trim() || 'noch offen'], ['Kontakt', feld('kontakt').trim() || 'noch offen']];
      zettel.innerHTML = z.map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('');
      summe.hidden = !betrag; summe.innerHTML = 'Richtwert für das Essen, ohne Getränke: <b>' + betrag + ' Franken</b> <small>aus den Preisen der Karte</small>';
    }
    ab.addEventListener('change', lies); ab.addEventListener('input', lies); D.addEventListener('flasche', lies);
    ab.addEventListener('click', function () { setTimeout(lies, 0); });
    lies();
    $('[data-abend-senden]').addEventListener('click', function () {
      if (!ab.reportValidity()) return;
      $('.zettel__danke').hidden = false; this.hidden = true;
    });
  }

  /* 7 Gutschein als gestaltete Karte */
  var gs = $('[data-gutschein]');
  if (gs) {
    var HAUS = { schloessli: 'Wirtschaft am Schlössli · Bottighofen', schaefli: 'Taverne zum Schäfli · Wigoltingen', beide: 'Schlössli · Schäfli · Familie Kuchler' };
    function gsZeigen() {
      var b = ($('[name=frei]', gs).value || '').replace(/\D/g, '') || (($('[name=betrag]:checked', gs) || {}).value) || '100';
      $('[data-g-betrag]').textContent = b;
      $('[data-g-haus]').textContent = HAUS[($('[name=haus]:checked', gs) || {}).value || 'schloessli'];
      $('[data-g-fuer]').textContent = $('[name=fuer]', gs).value || '…';
      $('[data-g-von]').textContent = $('[name=von]', gs).value || '…';
      $('[data-g-satz]').textContent = $('[name=satz]', gs).value || 'Für einen Abend unter der Platane.';
      var gb = D.getElementById('g-betrag'); if (gb) gb.value = b;
    }
    gs.addEventListener('input', gsZeigen); gs.addEventListener('change', function (ev) { if (ev.target.name === 'betrag') $('[name=frei]', gs).value = ''; gsZeigen(); });
    gsZeigen();
    $('[data-drucken]').addEventListener('click', function () { D.documentElement.classList.add('druck-gutschein'); print(); setTimeout(function () { D.documentElement.classList.remove('druck-gutschein'); }, 500); });
  }

  /* 8 Kalender: Termin antippen, Angaben zeigen, Plätze anfragen */
  var det = $('[data-termin-detail]');
  if (det) {
    var A = JSON.parse(D.getElementById('anlaesse-daten').textContent);
    // Karte des Hauses (Robert 19.10.2026, 21:2x): alle Termine liegen übereinander im selben Feld, damit sich keine Grösse nach der Textmenge richtet;
    // gezeigt werden Tag, Titel, Zeit und der erste Satz, der ganze Text steht im Fenster «Alles lesen»
    var PF = '<span class="kn"><svg class="pf" viewBox="0 0 16 10"><path d="M0 5h14M10 1l4 4-4 4"/></svg></span>';
    function knoepfe(a) {
      return a.bevorstehend ? '<button type="button" class="knopf knopf--dunkel knopf--klein" data-plaetze="' + esc(a.titel) + '">Plätze anfragen ' + PF + '</button>'
        : '';  // vergangene Anlässe: kein Vormerken (Robert 20.10.2026)
    }
    det.innerHTML = A.map(function (a) {
      var tg = (a.datum.match(/\d+\./g) || []).join('–'), mo = (a.datum.match(/(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember) \d{4}/) || [''])[0],
        wt = a.datum.indexOf(',') > 0 ? a.datum.split(',')[0] : '', zt = a.zeit.split(' · ');
      return '<div class="ktd" data-ktd="' + esc(a.titel) + '"><img class="ktd__zeichen" src="assets/svg/zeichen.svg" alt=""><div class="ktd__l"><p class="ktd__tag">' + esc(tg) + '</p><p class="mono ktd__mon">' + esc(mo) + (wt ? ' · ' + esc(wt) : '') + '</p><h3>' + esc(a.titel) + '</h3><span class="ktd__strich"></span><p class="mono ktd__zeit">' + esc(zt[0]) + (zt[1] ? '<br>' + esc(zt[1]) : '') + '</p></div>' +
        '<p class="ktd__lead">' + esc(a.text[0]) + '</p><div class="knoepfe">' + knoepfe(a) + '<button type="button" class="leise" data-alles="' + esc(a.titel) + '">Alles lesen</button></div></div>';
    }).join('');
    function termin(t) {
      $$('[data-termin]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.termin === t ? 'true' : 'false'); });
      $$('[data-ktd]', det).forEach(function (k) { k.classList.toggle('an', k.dataset.ktd === t); });
    }
    D.addEventListener('click', function (ev) {
      var al = ev.target.closest('[data-alles]'); if (!al) return;
      var a = A.filter(function (x) { return x.titel === al.dataset.alles; })[0], f = $('#fe-termin'); if (!a || !f) return;
      $('[data-t-titel]', f).textContent = a.titel; $('[data-t-zeit]', f).textContent = a.datum + ' · ' + a.zeit;
      $('[data-t-text]', f).innerHTML = a.text.map(function (s) { return '<p class="lauf">' + esc(s) + '</p>'; }).join('') + (a.link ? '<p><a class="leise" href="' + esc(a.link) + '" rel="noopener" target="_blank">' + esc(a.link_text) + '</a></p>' : '');
      $('[data-t-knoepfe]', f).innerHTML = knoepfe(a); f.showModal();
    });
    D.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-termin]');
      if (b && b.classList.contains('ap__p')) { var tt = b.dataset.termin; tauschen(b, function () { termin(tt); }); return; }
      if (b) termin(b.dataset.termin);
      var p = ev.target.closest('[data-plaetze]'); if (p) { var fo = p.closest('dialog'); if (fo && fo.id === 'fe-termin') fo.close(); var d = $('#fe-plaetze'); d.classList.remove('gesendet'); $('[data-p-titel]', d).textContent = p.dataset.plaetze; $('[name=anlass]', d).value = p.dataset.plaetze; d.showModal(); }
    });
    // Tausch: das angetippte kleine Plakat wird gross, das grosse geht an seinen Platz; beide fliegen mit Feder (nur transform), nichts springt
    function tauschen(k, danach) {
      var g = $('.ap__gross'); if (!g) { danach(); return; }
      var r1 = g.getBoundingClientRect(), r2 = k.getBoundingClientRect();
      var h = g.innerHTML, t = g.dataset.termin, sg = g.querySelector('img').getAttribute('sizes'), sk = k.querySelector('img').getAttribute('sizes');
      g.innerHTML = k.innerHTML; g.dataset.termin = k.dataset.termin; k.innerHTML = h; k.dataset.termin = t;
      g.querySelector('img').setAttribute('sizes', sg); k.querySelector('img').setAttribute('sizes', sk);
      danach();
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      var n1 = g.getBoundingClientRect(), n2 = k.getBoundingClientRect();
      [[g, r2, n1], [k, r1, n2]].forEach(function (x) {
        var el = x[0], von = x[1], nach = x[2];
        el.style.transition = 'none';
        el.style.transform = 'translate(' + (von.left - nach.left) + 'px,' + (von.top - nach.top) + 'px) scale(' + (von.width / nach.width) + ',' + (von.height / nach.height) + ')';
      });
      k.classList.add('ap__flug'); g.parentNode.classList.add('ap--tausch'); void g.offsetWidth;
      [g, k].forEach(function (el) { el.style.transition = 'transform .7s cubic-bezier(.34,1.25,.5,1)'; el.style.transform = ''; });
      setTimeout(function () { [g, k].forEach(function (el) { el.style.transition = ''; }); k.classList.remove('ap__flug'); g.parentNode.classList.remove('ap--tausch'); }, 760);
    }
    var erst = A.filter(function (x) { return x.bevorstehend; })[0] || A[0]; termin(erst.titel);
  }

  /* 10 Der See heute: Sonnenuntergang nach dem Sonnenstand (NOAA-Näherung), Terrasse nach Öffnungszeiten und Ferien */
  var see = $('[data-see]');
  if (see) {
    var lat = +see.dataset.lat, lon = +see.dataset.lon;
    function zh() { var s = new Date().toLocaleString('en-CA', { timeZone: 'Europe/Zurich', hour12: false }); return { iso: s.slice(0, 10), d: new Date(s.slice(0, 10) + 'T12:00:00Z') }; }
    function untergang(d) {
      var r = Math.PI / 180, n = Math.floor((d - Date.UTC(d.getUTCFullYear(), 0, 0)) / 864e5);
      var g = 2 * Math.PI / 365 * (n - 1);
      var eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
      var dek = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
      var ha = Math.acos(Math.cos(90.833 * r) / (Math.cos(lat * r) * Math.cos(dek)) - Math.tan(lat * r) * Math.tan(dek)) / r;
      var utcMin = 720 - 4 * (lon - ha) - eq;
      var t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0) + utcMin * 6e4);
      return t.toLocaleTimeString('de-CH', { timeZone: 'Europe/Zurich', hour: '2-digit', minute: '2-digit' });
    }
    var h = zh();
    $('[data-see-sonne]').textContent = untergang(h.d) + ' Uhr';
    var tag = new Date(h.iso + 'T12:00:00Z').getUTCDay(), ferien = see.dataset.zu.split(',').some(function (z) { var p = z.split('/'); return h.iso >= p[0] && h.iso <= p[1]; });
    var offen = !ferien && tag !== 2 && tag !== 3;
    $('[data-see-offen]').textContent = ferien ? 'Ferien' : (offen ? 'Geöffnet' : 'Ruhetag');
    $('[data-see-offen-text]').textContent = offen ? 'Heute 11:30 bis 23:00 Uhr, Lästermeile den ganzen Tag' : (ferien ? 'Das Haus macht gerade Ferien' : 'Dienstag und Mittwoch ist Ruhetag');
  }
})();

/* 5b Ihr Abend mit Bildkarten (20.10.2026): Platz ins Feld, das der Zettel liest; Personen mit Plus und Minus; die gewählten Bilder oben auf dem Zettel */
(function () {
  var D = document, ab = D.querySelector('[data-abend]'); if (!ab) return;
  var platz = ab.querySelector('input[name=platz]'), box = D.querySelector('[data-zettel-bilder]');
  function bilder() {
    if (!box) return;
    box.innerHTML = ['anlass', 'platz_wahl', 'menue'].map(function (n) {
      var c = ab.querySelector('[name="' + n + '"]:checked'), im = c && c.parentNode.querySelector('img');
      return im ? '<img src="' + im.getAttribute('src') + '" alt="">' : '';
    }).join('');
  }
  ab.addEventListener('change', function (e) { if (e.target.name === 'platz_wahl' && platz) platz.value = e.target.value; bilder(); }, true);
  ab.addEventListener('click', function (e) {
    var b = e.target.closest('[data-pers]'); if (!b) return;
    var i = ab.querySelector('[name=personen]');
    i.value = Math.max(1, Math.min(99, (parseInt(i.value, 10) || 1) + +b.dataset.pers));
    i.dispatchEvent(new Event('input', { bubbles: true }));
  });
  /* Der Zettel als Papier: dieselben Angaben, ruhig gesetzt (liest die Liste, die Teil 5 schreibt) */
  var dl = D.querySelector('[data-zettel]'), schoen = D.querySelector('[data-zettel-schoen]');
  function setze() {
    if (!dl || !schoen) return;
    var w = {}, dt = dl.querySelectorAll('dt');
    [].forEach.call(dt, function (t) { w[t.textContent] = t.nextElementSibling ? t.nextElementSibling.textContent : ''; });
    function x(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
    function offen(v) { return !v || /^noch |^keine/.test(v); }
    var p = w['Personen'], wann = [offen(w['Tag']) ? 'Tag noch offen' : w['Tag'], offen(w['Uhrzeit']) ? 'Uhrzeit noch offen' : w['Uhrzeit'], p + (p === '1' ? ' Person' : ' Personen')];
    var h = '<p class="zb__gross">' + x(w['Anlass']) + '</p><p class="zb__zeile">' + x(wann.join(' · ')) + '</p><p class="zb__zeile">' + x(w['Platz']) + '</p><span class="zb__trenn" aria-hidden="true"></span>';
    function g(t, v, leise) { return '<div class="zb__g' + (leise ? ' zb__g--leise' : '') + '"><small>' + x(t) + '</small><b>' + x(v) + '</b></div>'; }
    h += g('Menü', w['Menü'], /noch nichts/.test(w['Menü'])) + g('Wein', w['Wein'], offen(w['Wein']));
    var aw = [offen(w['Allergien']) ? '' : w['Allergien'], offen(w['Wünsche']) ? '' : w['Wünsche']].filter(Boolean).join(' · ');
    if (aw) h += g('Allergien und Wünsche', aw);
    var wer = [offen(w['Name']) ? '' : w['Name'], offen(w['Kontakt']) ? '' : w['Kontakt']].filter(Boolean).join(' · ');
    if (wer) h += g('Angefragt von', wer);
    schoen.innerHTML = h;
  }
  if (dl && 'MutationObserver' in window) new MutationObserver(setze).observe(dl, { childList: true, subtree: true, characterData: true });
  setze();

  /* Was eingetragen ist, bleibt stehen, auch nach dem Weg in den Weinberater und zurück */
  var KEY = 'schloessli-abend';
  function merke() {
    var w = {};
    [].forEach.call(ab.elements, function (x) {
      if (!x.name || x.name === 'flasche') return;
      if (x.type === 'radio') { if (x.checked) w[x.name] = x.value; }
      else if (x.type === 'checkbox') { (w[x.name] = w[x.name] || []); if (x.checked) w[x.name].push(x.value); }
      else w[x.name] = x.value;
    });
    try { sessionStorage.setItem(KEY, JSON.stringify(w)); } catch (e) {}
  }
  (function hole() {
    var w; try { w = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) {} if (!w) return;
    [].forEach.call(ab.elements, function (x) {
      if (!x.name || !(x.name in w) || x.name === 'flasche') return;
      if (x.type === 'radio') x.checked = x.value === w[x.name];
      else if (x.type === 'checkbox') x.checked = w[x.name].indexOf(x.value) >= 0;
      else x.value = w[x.name];
    });
    ['datum', 'uhrzeit'].forEach(function (n) { var f = ab.querySelector('[data-wahl="' + n + '"]'), v = w[n]; if (f && v) f.querySelector('.wahl-k span').textContent = v; });
    ab.dispatchEvent(new Event('change', { bubbles: true }));
  })();
  ab.addEventListener('change', merke); ab.addEventListener('input', merke); ab.addEventListener('click', function () { setTimeout(merke, 0); });
  bilder();
})();
