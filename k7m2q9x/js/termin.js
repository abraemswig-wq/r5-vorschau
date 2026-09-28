/* Online-Rezeption (DocMedico). Das eingebundene Skript setzt seinen eigenen
   Knopf unten rechts; hier bekommt zusaetzlich unser Termin-Aufruf im
   Abschluss dieselbe Wirkung, statt auf die Kontaktseite abzubiegen. */
/* Das fremde Skript haengt sein "powered by"-Logo OHNE alt-Attribut in unser
   Dokument — kein iframe, es steht wirklich in unserem DOM. Fuer einen
   Screenreader ist ein Bild ohne alt keine Dekoration, sondern ein Element
   unbekannter Bedeutung: vorgelesen wird dann der Dateiname. Weil das Logo
   nichts trägt, was nicht daneben schon als Text steht, ist alt="" richtig —
   damit ueberspringt der Screenreader es sauber.

   Warum ein Beobachter und kein einmaliger Lauf: das Logo kommt asynchron und
   erst, wenn die Rezeption sich aufbaut. Zu jedem festen Zeitpunkt danach zu
   suchen waere geraten. Der Beobachter haengt sich ab, sobald er es hatte. */
(() => {
  const nachziehen = () => {
    const treffer = [...document.querySelectorAll('img:not([alt])')]
      .filter(i => (i.getAttribute('src') || '').includes('docmedico'));
    treffer.forEach(i => i.setAttribute('alt', ''));
    return treffer.length > 0;
  };

  if (!nachziehen()) {
    const wache = new MutationObserver(() => { if (nachziehen()) wache.disconnect(); });
    wache.observe(document.documentElement, { childList: true, subtree: true });
    // Nicht ewig lauschen: oeffnet niemand die Rezeption, laeuft der Beobachter
    // sonst die ganze Sitzung mit und kostet bei jedem DOM-Wechsel Rechenzeit.
    setTimeout(() => wache.disconnect(), 30000);
  }
})();

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
