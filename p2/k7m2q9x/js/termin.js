/* Online-Rezeption (DocMedico). Das eingebundene Skript setzt seinen eigenen
   Knopf unten rechts; hier bekommt zusaetzlich unser Termin-Aufruf im
   Abschluss dieselbe Wirkung, statt auf die Kontaktseite abzubiegen. */
(() => {
  const ziele = [...document.querySelectorAll('[data-termin]')];
  if (!ziele.length) return;

  ziele.forEach(a => a.addEventListener('click', e => {
    // Das href bleibt stehen und traegt weiter, wenn das fremde Skript nicht da
    // ist — Blocker, Ausfall, oder der Klick kommt vor dem async-Ladevorgang.
    // Ohne diesen Rueckfall zeigte der wichtigste Knopf der Seite ins Leere.
    if (!window.docmedEmbedHelper) return;
    e.preventDefault();
    window.docmedEmbedHelper.openClose();
  }));
})();
