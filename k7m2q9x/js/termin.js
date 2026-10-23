/* Online-Rezeption (DocMedico). Laedt seit 2026-10-23 ERST AUF KLICK.

   VORHER: in 48 von 50 Koepfen stand
   `<script src="https://cdn.docmedico-rezeption.de/j9u4c9m7a/reception_embed.js" async>`
   samt `preconnect`. Damit ging die IP-Adresse jedes Besuchers an einen fremden
   Server, bevor irgendwer einen Termin wollte, und die Rezeption legte
   `sessionStorage.dmrFeatureTeaser` an. ENTSCHEIDUNG VON ARIC vom 23.10.:
   erst auf Klick.

   Warum das mehr ist als eine Gewichtsfrage: § 25 Abs. 2 Nr. 2 TDDDG erlaubt
   Speichern und Auslesen auf dem Endgeraet ohne Einwilligung nur, soweit es
   fuer einen vom Nutzer AUSDRUECKLICH GEWUENSCHTEN Dienst unbedingt
   erforderlich ist. Beim Auto-Laden war das die schwache Lesart — gewuenscht
   hatte die Rezeption niemand, sie kam mit dem Seitenaufruf. Nach einem Klick
   auf einen Termin-Knopf ist der Wunsch ausdruecklich und die Ausnahme greift
   sauber. Genau deshalb braucht die Rezeption kein Einwilligungsbanner, und
   genau deshalb loest diese Aenderung auch die Sonderrolle von Impressum und
   Datenschutz auf: dort fehlte das Skript bisher absichtlich, weil das Lesen
   der Rechtstexte nicht schon Daten ausloesen sollte. Jetzt loest das Lesen
   nirgends mehr Daten aus.

   DER PREIS, benannt statt versteckt: DocMedicos eigener Knopf unten rechts
   erscheint erst nach dem ersten Klick auf einen unserer Termin-Knoepfe. Wer
   die Rezeption ueber diesen fremden Knopf gesucht hat, findet sie dort nicht
   mehr vor — unsere eigenen Termin-Knoepfe stehen auf jeder Seite und tun
   dasselbe. Zweitens kostet der erste Klick die Ladezeit des fremden Skripts,
   die vorher im Hintergrund lag. Gemessen, nicht geschaetzt: siehe
   `pruefung/rezeption-messen.py`.

   KEIN `preconnect` mehr, auch nicht auf Verdacht: ein Vorverbinden traegt die
   IP-Adresse schon vor dem Klick hinueber und waere damit genau die
   Uebermittlung, die hier wegfallen soll. */

const DOCMEDICO = 'https://cdn.docmedico-rezeption.de/j9u4c9m7a/reception_embed.js';

/* Das fremde Skript haengt sein "powered by"-Logo OHNE alt-Attribut in unser
   Dokument — kein iframe, es steht wirklich in unserem DOM. Fuer einen
   Screenreader ist ein Bild ohne alt keine Dekoration, sondern ein Element
   unbekannter Bedeutung: vorgelesen wird dann der Dateiname. Weil das Logo
   nichts traegt, was nicht daneben schon als Text steht, ist alt="" richtig —
   damit ueberspringt der Screenreader es sauber.

   Warum ein Beobachter und kein einmaliger Lauf: das Logo kommt asynchron und
   erst, wenn die Rezeption sich aufbaut. Zu jedem festen Zeitpunkt danach zu
   suchen waere geraten. Der Beobachter haengt sich ab, sobald er es hatte.

   NEU ab 23.10.: er startet erst mit dem Laden der Rezeption. Vorher lief er
   auf JEDEM Seitenaufruf 30 Sekunden mit und wartete auf ein Logo, das ohne
   Klick nie kam. */
function logoNachziehen() {
  const nachziehen = () => {
    const treffer = [...document.querySelectorAll('img:not([alt])')]
      .filter(i => (i.getAttribute('src') || '').includes('docmedico'));
    treffer.forEach(i => i.setAttribute('alt', ''));
    return treffer.length > 0;
  };
  if (nachziehen()) return;
  const wache = new MutationObserver(() => { if (nachziehen()) wache.disconnect(); });
  wache.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(() => wache.disconnect(), 30000);
}

/* Laedt das fremde Skript genau einmal und liefert seinen Helfer.

   Warum danach noch gewartet wird: `onload` sagt nur, dass die Datei da ist.
   Ob `docmedEmbedHelper` in derselben Mikroaufgabe entsteht, ist eine Zusage,
   die uns niemand gegeben hat — das Skript ist fremd und kann sich morgen
   anders verhalten. Also nachsehen, bis der Helfer da ist, und aufgeben statt
   ewig zu warten. 8 s ist bewusst lang: ein langsames Mobilfunknetz soll den
   Knopf nicht ins Leere laufen lassen. */
let ladeVorgang = null;
function rezeptionLaden() {
  if (ladeVorgang) return ladeVorgang;
  ladeVorgang = new Promise((fertig, scheitern) => {
    const skript = document.createElement('script');
    skript.src = DOCMEDICO;
    skript.async = true;
    skript.onerror = () => scheitern(new Error('Rezeption nicht erreichbar'));
    skript.onload = () => {
      const frist = Date.now() + 8000;
      const nachsehen = () => {
        if (window.docmedEmbedHelper) return fertig(window.docmedEmbedHelper);
        if (Date.now() > frist) return scheitern(new Error('docmedEmbedHelper fehlt'));
        setTimeout(nachsehen, 60);
      };
      nachsehen();
    };
    logoNachziehen();
    document.head.appendChild(skript);
  });
  return ladeVorgang;
}

(() => {
  const ziele = [...document.querySelectorAll('a[data-termin]')];
  if (!ziele.length) return;

  let laeuft = false;

  ziele.forEach(a => a.addEventListener('click', async e => {
    // Zweiter Weg hinein, falls das Skript schon steht: dann kein Umweg.
    if (window.docmedEmbedHelper) {
      e.preventDefault();
      window.docmedEmbedHelper.openClose();
      return;
    }
    // preventDefault muss synchron fallen, vor jedem await.
    e.preventDefault();
    // Doppelklick waehrend des Ladens wuerde sonst zweimal openClose() rufen
    // und das Fenster im selben Atemzug wieder zuklappen.
    if (laeuft) return;
    laeuft = true;
    a.setAttribute('aria-busy', 'true');
    try {
      const hilfe = await rezeptionLaden();
      hilfe.openClose();
    } catch {
      // Das href bleibt stehen und traegt weiter, wenn das fremde Skript nicht
      // kommt — Blocker, Ausfall, Funkloch. Ohne diesen Rueckfall zeigte der
      // wichtigste Knopf der Seite ins Leere. Vorher uebernahm das der Browser
      // von selbst (kein preventDefault); jetzt muss der Sprung von Hand
      // kommen, weil der Klick abgefangen ist.
      window.location.href = a.href;
    } finally {
      laeuft = false;
      a.removeAttribute('aria-busy');
    }
  }));
})();
