/* Anschluss der Formulare der Website an das Reservationsbuch (La Réception) · Wirtschaft am Schlössli, Bottighofen (19.10.2026, Master Werkzeug-Bau E12/E24).
   Die Website hat fünf Formulare: Reservation mit Wünschen (#fe-reservation, mit Allergien), Bankettanfrage (#fe-bankett), Gutschein (#fe-gutschein),
   Plätze für einen Anlass (#fe-plaetze) und «Ihr Abend» ([data-abend]). Bisher zeigten sie nur «Vielen Dank» (Designstudie, nichts ging weg).
   Mit diesem Baustein geht jede Anfrage in den Eingang des Reservationsbuchs, mit allen Angaben und den Allergien als Kürzel; erst wenn das Reservationsbuch
   sie angenommen hat, zeigt das Fenster «Vielen Dank». Nie mailto, nie ein Mailprogramm.
   Eigenes Fenster braucht es nicht: die Fenster der Website bleiben, wie sie sind (haus.js, funktionen.js unverändert). Der Baustein fängt das
   Abschicken im Fang-Durchlauf am Dokument ab, bevor haus.js «gesendet» setzt, und setzt es selbst, wenn die Anfrage angekommen ist.
   Einbinden (Station 14, Werkbank-Bauer, über bau.py, nicht von Hand): <script src="assets/js/anfrage.js?v={V}" defer></script> nach haus.js und funktionen.js.
   Ziel: /_werkzeuge/reception/api/formular (anders mit <script … data-api="/pfad"> oder window.WS_ANFRAGE_API). */
(function () {
  'use strict';
  var D = document, skript = D.currentScript;
  var API = window.WS_ANFRAGE_API || (skript && skript.getAttribute('data-api')) || '/_werkzeuge/reception/api/formular';
  var TEL = '+41 71 688 90 92';
  var $ = function (s, c) { return (c || D).querySelector(s); }, $$ = function (s, c) { return [].slice.call((c || D).querySelectorAll(s)); };
  var wert = function (f, n) { var e = f.querySelector('[name="' + n + '"]'); return e ? String(e.value || '').trim() : ''; };
  var gewaehlt = function (f, n) { var e = f.querySelector('[name="' + n + '"]:checked'); return e ? e.value : ''; };
  var kuerzel = function (f) { return $$('[name=allergene]:checked', f).map(function (c) { return c.value; }); };
  var namen = function (f) { return $$('[name=allergene]:checked', f).map(function (c) { return (c.nextElementSibling || c).textContent.trim(); }); };
  var seiteName = function () { var t = (D.title || '').split(' · ')[0].trim(); return /^Wirtschaft am Schl/.test(t) ? 'Startseite' : t; };

  /* Was jedes Formular mitschickt: dieselben Felder, die der Gast ausgefüllt hat, in Zeilen für das Team */
  var FENSTER = {
    'fe-reservation': function (f) {
      var al = namen(f), z = ['Datum: ' + (wert(f, 'datum') || 'nicht gewählt'), 'Uhrzeit: ' + (wert(f, 'uhrzeit') || 'nicht gewählt'), 'Personen: ' + wert(f, 'personen'), 'Platz: ' + wert(f, 'platz')];
      if (wert(f, 'flasche')) z.push('Flasche: ' + wert(f, 'flasche'));
      z.push('Allergien: ' + (al.join(', ') || 'keine angegeben'));
      if (wert(f, 'wunsch')) z.push('Wünsche: ' + wert(f, 'wunsch'));
      return { art: 'tisch', formular: 'reservation', anliegen: 'Reservation mit Wünschen' + (wert(f, 'platz') ? ', ' + wert(f, 'platz') : ''), datum: wert(f, 'datum'),
        uhrzeit: wert(f, 'uhrzeit'), personen: wert(f, 'personen'), platz: wert(f, 'platz'), allergene: kuerzel(f), name: wert(f, 'name'), kontakt: wert(f, 'kontakt'), zeilen: z };
    },
    'fe-bankett': function (f) {
      var z = ['Datum: ' + (wert(f, 'datum') || 'nicht gewählt'), 'Uhrzeit: ' + (wert(f, 'uhrzeit') || 'nicht gewählt'), 'Personenzahl: ' + wert(f, 'personen'),
        'Gewünschte Speisenform: ' + wert(f, 'speisenform'), 'Anzahl Gänge: ' + (wert(f, 'gaenge') || '-'), 'Richt-Budget: ' + (wert(f, 'budget') || '-')];
      if (wert(f, 'text')) z.push('Gericht, Allergien: ' + wert(f, 'text'));
      return { art: 'bankett', formular: 'bankett', anliegen: 'Bankettanfrage, ' + wert(f, 'speisenform'), datum: wert(f, 'datum'), uhrzeit: wert(f, 'uhrzeit'), personen: wert(f, 'personen'),
        name: wert(f, 'name'), kontakt: wert(f, 'kontakt'), zeilen: z };
    },
    'fe-gutschein': function (f) {
      return { art: 'gutschein', formular: 'gutschein', anliegen: 'Gutschein über ' + wert(f, 'betrag') + ' Franken', name: wert(f, 'name'), kontakt: wert(f, 'mail'),
        zeilen: ['Name Käufer: ' + wert(f, 'name'), 'E-Mail: ' + wert(f, 'mail'), 'Adresse: ' + wert(f, 'adresse'), 'Betrag in Franken: ' + wert(f, 'betrag')] };
    },
    'fe-plaetze': function (f) {
      var z = ['Anlass: ' + wert(f, 'anlass'), 'Personen: ' + wert(f, 'personen')];
      if (wert(f, 'wunsch')) z.push('Wünsche, Allergien: ' + wert(f, 'wunsch'));
      return { art: 'anlass', formular: 'plaetze', anliegen: 'Plätze für ' + wert(f, 'anlass'), personen: wert(f, 'personen'), name: wert(f, 'name'), kontakt: wert(f, 'kontakt'), zeilen: z };
    }
  };
  function abend(f) {
    var menue = gewaehlt(f, 'menue'), anlass = gewaehlt(f, 'anlass'), z = $$('[data-zettel] dt').map(function (dt) { return dt.textContent.trim() + ': ' + ((dt.nextElementSibling || {}).textContent || '').trim(); });
    var summe = $('[data-summe]'); if (summe && !summe.hidden) z.push(summe.textContent.replace(/\s+/g, ' ').trim());
    if (wert(f, 'wunsch')) z.push('Wünsche: ' + wert(f, 'wunsch'));
    var gross = /^bankett-/.test(menue) || /familienfeier|firmenanlass/i.test(anlass);
    return { art: gross ? 'bankett' : 'tisch', formular: 'abend', anliegen: 'Ihr Abend: ' + (anlass || 'Anlass offen'), datum: wert(f, 'datum'), uhrzeit: wert(f, 'uhrzeit'),
      personen: wert(f, 'personen'), platz: wert(f, 'platz'), allergene: kuerzel(f), name: wert(f, 'name'), kontakt: wert(f, 'kontakt'), zeilen: z };
  }

  /* Feld, das Menschen nicht sehen: nur Maschinen füllen es aus (das Reservationsbuch nimmt solche Anfragen still an und legt nichts ab) */
  function falle(f) {
    if (f.querySelector('[name=website]')) return;
    var i = D.createElement('input'); i.type = 'text'; i.name = 'website'; i.tabIndex = -1; i.autocomplete = 'off'; i.setAttribute('aria-hidden', 'true');
    i.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0';
    f.appendChild(i);
  }
  function meldung(f, text) {
    var p = f.querySelector('.ws-anfrage-fehler');
    if (!p) { p = D.createElement('p'); p.className = 'fe__hinweis ws-anfrage-fehler'; p.setAttribute('role', 'alert'); (f.querySelector('.fe__senden') || f).insertAdjacentElement('afterend', p); }
    p.textContent = text; p.hidden = !text;
  }
  function senden(f, d, knopf, fertig) {
    if (f.dataset.sendet) return;
    f.dataset.sendet = '1'; if (knopf) knopf.disabled = true; meldung(f, '');
    var koerper = { art: d.art, formular: d.formular, name: d.name, kontakt: d.kontakt, datum: d.datum || '', uhrzeit: d.uhrzeit || '', personen: d.personen || '',
      platz: d.platz || '', allergene: d.allergene || [], anliegen: d.anliegen, nachricht: d.zeilen.join('\n'), seite: location.pathname + location.search,
      seite_name: seiteName(), sprache: (D.documentElement.lang || 'de').slice(0, 2), website: wert(f, 'website') };
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(koerper) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) {
        if (!x.ok) throw new Error(String((x.j && x.j.fehler) || '').replace(/^[A-ZÄÖÜ-]+ · /, '') || 'Die Anfrage kam nicht an.');
        fertig();
      })
      .catch(function (e) { meldung(f, (e && e.message && !/fetch|network|load/i.test(e.message) ? e.message : 'Die Anfrage kam nicht an.') + ' Bitte noch einmal versuchen oder anrufen: ' + TEL + '.'); })
      .then(function () { delete f.dataset.sendet; if (knopf) knopf.disabled = false; });
  }

  D.addEventListener('submit', function (e) {
    var f = e.target, dlg = f.closest && f.closest('dialog');
    var bau = dlg && FENSTER[dlg.id];
    if (!bau) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (!f.reportValidity()) return;
    senden(f, bau(f), f.querySelector('[type=submit]'), function () { dlg.classList.add('gesendet'); f.reset && $$('[name=allergene]', f).forEach(function (c) { c.checked = false; }); });
  }, true);
  D.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-abend-senden]');
    if (!b) return;
    var f = $('[data-abend]'); if (!f) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (!f.reportValidity()) return;
    senden(f, abend(f), b, function () { var d = $('.zettel__danke'); if (d) d.hidden = false; b.hidden = true; });
  }, true);
  function bereit() { $$('dialog.fe form').concat($$('[data-abend]')).forEach(falle); }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', bereit); else bereit();
})();
