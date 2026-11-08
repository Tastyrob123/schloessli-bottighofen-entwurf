/* kleid/schloessli.js · Hauswerte für oberflaeche.js (Wirtschaft am Schlössli, Bottighofen TG, 19.10.2026). Im <head> VOR allen Stilen laden (ohne defer).
   Welt «land» aus marke.json (Station 5), Rahmen «Die Bühne» (gesetzt, nicht von Robert gewählt; Wechsel = eine Zeile hier).
   Liegt vorläufig unter _werkzeuge/oberflaeche/ und wird von den Werkzeug-Servern unter /assets/oberflaeche/ ausgeliefert; Station 14 legt es nach website/assets/oberflaeche/. */
window.WO_HAUS = { kurz: 'schloessli', name: 'Wirtschaft am Schlössli', voll: 'Wirtschaft am Schlössli Bottighofen', ort: 'Bottighofen', welt: 'land', rahmen: 'buehne',
  foto: '/assets/img/haus-1200.webp', zeichen: '/assets/oberflaeche/kleid/schloessli-zeichen.svg', zeichenMass: 0.605,
  /* Namen der sieben Werkzeuge im Schlössli (Robert 19.10.2026 «passt», über den Chef-Chat Kuchler): die EINE Stelle. Dateien, Schlüssel und Adressen bleiben. */
  namen: { zentrale: 'Das Hafenbüro', website: 'Das Schaufenster', karten: 'Das Kartenpult', gaeste: 'Das Reservationsbuch', marke: 'Das Bildarchiv', besuche: 'Die Besucherliste', druck: 'Die Hausdruckerei' },
  wege: { zentrale: '/_werkzeuge/maison/', website: '/_werkzeuge/bureau/', karten: '/_werkzeuge/carte/', gaeste: '/_werkzeuge/reception/', marke: '/_werkzeuge/livre/', besuche: '/_werkzeuge/registre/', druck: '/werkzeuge/imprimerie/' } };
document.documentElement.setAttribute('data-wo-haus', WO_HAUS.kurz);
document.documentElement.setAttribute('data-wo-rahmen', WO_HAUS.rahmen);
try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
