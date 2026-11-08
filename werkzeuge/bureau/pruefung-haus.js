/* pruefung-haus.js · Prüfseite im Rahmen des Schlössli (Demo-Check 21.10.2026): «Zum Werkzeug» führt ins Schaufenster des Hauses, nicht in den Stamm ohne Rahmen. */
(function () { var z = document.getElementById('wsp-zurueck'); if (z) z.href = '/_werkzeuge/bureau/'; var n = document.querySelector('[data-werkzeug]'); if (n && window.WO_HAUS) n.textContent = WO_HAUS.namen.website; })();
