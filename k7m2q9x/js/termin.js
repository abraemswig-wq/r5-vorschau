/* Online-Rezeption (DocMedico). Laedt seit 2026-10-28 WIEDER MIT DER SEITE.

   DIE GESCHICHTE IN DREI SCHRITTEN, weil der mittlere falsch war und man das
   sehen koennen muss:

   BIS 23.10.2026: in 48 von 50 Koepfen stand
   `<script src="https://cdn.docmedico-rezeption.de/j9u4c9m7a/reception_embed.js" async>`
   samt `preconnect`. Damit ging die IP-Adresse jedes Besuchers an einen fremden
   Server, bevor irgendwer einen Termin wollte, und die Rezeption legte
   `sessionStorage.dmrFeatureTeaser` an.

   23.10.2026: umgestellt auf „erst auf Klick". Begruendung damals — § 25 Abs. 2
   Nr. 2 TDDDG erlaubt Speichern und Auslesen auf dem Endgeraet ohne
   Einwilligung nur fuer einen vom Nutzer AUSDRUECKLICH GEWUENSCHTEN Dienst;
   ein Klick macht den Wunsch ausdruecklich, ein Seitenaufruf nicht. Der Preis
   wurde benannt: DocMedicos eigener Knopf unten rechts erscheint dann erst
   nach dem ersten Klick.

   28.10.2026, ERSTER VERSUCH (verworfen, keine 30 Minuten alt): ein EIGENER
   Starter unten rechts, der nichts laedt und abtritt, sobald DocMedicos
   Starter steht. Gebaut, gemessen, funktionierte — und ging trotzdem am
   Problem vorbei.

   28.10.2026, SO IST ES JETZT: zurueck zum Laden mit der Seite. Der Grund ist
   nicht Bequemlichkeit, sondern eine Eigenschaft des Dienstes, die ich nicht
   auf dem Schirm hatte. Aric: „das muss immer so sein, dass da DocMedico
   direkt offen geladen ist, weil unsere Kunden, wenn wir darauf antworten, den
   Link kriegen. Dann koennen die das ueber diesen ‚Termin buchen'-Button von
   dir nicht oeffnen."

   DIE ONLINE-REZEPTION IST KEIN BUCHUNGSFORMULAR, SIE IST EIN NACHRICHTEN-
   KANAL. Das steht auch in dem, was sie nachlaedt: `chats-frontend-store`,
   `chats-store`, `docmed-crypt`. Die Praxis antwortet darin, und der Patient
   muss die Antwort VORFINDEN. Ein Knopf, der erst auf Klick etwas laedt, kann
   nicht anzeigen, dass eine Antwort wartet — er weiss es nicht, weil nichts
   geladen ist. Mein eigener Starter konnte das grundsaetzlich nicht leisten,
   egal wie gut er aussah. Ich hatte den Dienst als „Terminbuchung" gelesen und
   danach entworfen; das war der Fehler unter dem Fehler.

   WAS DAS KOSTET, gemessen am 28.10. nach der Umstellung
   (`pruefung/rezeption-messen.py`, index.html, 4 s nach load):
     BEIM AUFRUF, ohne jedes Zutun — 4 Anfragen an zwei fremde Hosts
     (cdn.docmedico-rezeption.de 1, cdn.docmedico.de 3), keine Cookies, kein
     localStorage, ein Eintrag `sessionStorage.dmrFeatureTeaser=true`.
     ERST BEIM OEFFNEN — 22 weitere, davon 21 an embed.docmedico-rezeption.de.
   Das ist weniger, als ich erwartet hatte, und die Differenz ist kein Detail:
   vorgeladen wird nur der STARTER, die Chat-Anwendung selbst kommt weiter erst
   auf Klick. Der Preis des Vorladens ist also die IP-Adresse plus ein
   sessionStorage-Eintrag — nicht die ganzen 26 Anfragen, wie ich es vorhin
   noch in zwei Kommentaren geschrieben hatte. Hoher Preis bleibt hoher Preis,
   aber er wird hier beziffert und nicht aufgerundet.

   Die Begruendung von oben (§ 25 Abs. 2 Nr. 2 TDDDG) traegt das nur in der
   schwachen Lesart. Das ist eine Entscheidung des Verantwortlichen, nicht
   meine.

   WAS IN DER DATENSCHUTZERKLAERUNG DAZU STEHT — nachgesehen, nicht vermutet,
   und hier stand vorhin das Falsche: ich hatte an dieser Stelle geschrieben,
   der Abschnitt sei „am 28.10. zurueckgedreht". Er ist es nicht, und er war
   es auch nicht. Der Fliesstext von `datenschutz.html` ist seit dem achten
   Durchgang Arics Text, Wort fuer Wort aus seiner Vorlage; MEINE gemessenen
   Saetze („beim blossen Aufruf geht nichts hinaus") sind dort schon damals
   herausgefallen. Es gab also nichts zurueckzudrehen — die Behauptung war
   bequem und ungeprueft, zwei Dateien weiter.

   Der Mangel ist ein anderer und aelter als diese Aenderung: Arics Text sagt
   „Wir haben [...] einen LINK zum Dienst Online-Rezeption integriert" und die
   Uebermittlung erfolge „erst, nachdem Sie [...] zugestimmt haben". Eingebunden
   ist kein Link, sondern ein Skript, und die IP geht vor jeder Zustimmung
   hinaus. Das stimmte vor dem 23.10. schon nicht; fuenf Tage lang stimmte es
   zufaellig, weil der Code strenger war als der Text; jetzt stimmt es wieder
   nicht. Zu entscheiden hat das der Verantwortliche, nicht ich — ich nenne es
   ihm und schreibe es nicht still um. Was ich nicht tue: meine eigene
   Nachlaessigkeit im Kommentar als erledigte Rechtsfrage ausgeben.

   WAS DIESE DATEI DANN NOCH TUT, jetzt wo das Skript von allein kommt:
   1. Unsere Termin-Knoepfe im Text oeffnen die Rezeption, statt auf die
      Kontaktseite zu springen (`openClose()`). Genau das, was Aric mit „das
      Interface nochmal da oeffnet, wenn man da draufdrueckt" meint.
   2. Sie zieht das fehlende alt-Attribut am fremden Logo nach.
   Beides braucht kein Vorladen und keinen eigenen Knopf mehr. */

/* Das fremde Skript haengt sein "powered by"-Logo OHNE alt-Attribut in unser
   Dokument — kein iframe, es steht wirklich in unserem DOM. Fuer einen
   Screenreader ist ein Bild ohne alt keine Dekoration, sondern ein Element
   unbekannter Bedeutung: vorgelesen wird dann der Dateiname. Weil das Logo
   nichts traegt, was nicht daneben schon als Text steht, ist alt="" richtig —
   damit ueberspringt der Screenreader es sauber.

   Warum ein Beobachter und kein einmaliger Lauf: das Logo kommt asynchron und
   erst, wenn die Rezeption sich aufbaut. Zu jedem festen Zeitpunkt danach zu
   suchen waere geraten. Der Beobachter haengt sich ab, sobald er es hatte,
   spaetestens nach 30 s — sonst laeuft er auf der Startseite dauerhaft gegen
   jede Kino-Bewegung mit. */
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

/* Wartet auf den Helfer des fremden Skripts.

   Warum ueberhaupt warten, wo das Skript doch im Kopf steht: es laedt `async`.
   Wer auf einer langsamen Verbindung sofort auf „Termin buchen" drueckt, kann
   schneller sein als der Download. Ohne Warten liefe der Klick dann ins Leere
   — und das waere derselbe Fehler wie vorher, nur seltener und damit
   schwerer zu finden.

   8 s ist bewusst lang und die Obergrenze, nicht die Regel: gemessen war der
   Helfer 137 ms nach dem Klick da, wenn das Skript erst dann geholt wurde.
   Mit Vorladen ist er in aller Regel schon vor dem ersten Klick bereit. */
function helferHolen(frist = 8000) {
  if (window.docmedEmbedHelper) return Promise.resolve(window.docmedEmbedHelper);
  return new Promise((fertig, scheitern) => {
    const ende = Date.now() + frist;
    const nachsehen = () => {
      if (window.docmedEmbedHelper) return fertig(window.docmedEmbedHelper);
      if (Date.now() > ende) return scheitern(new Error('docmedEmbedHelper fehlt'));
      setTimeout(nachsehen, 60);
    };
    nachsehen();
  });
}

(() => {
  logoNachziehen();

  const ziele = [...document.querySelectorAll('a[data-termin]')];
  if (!ziele.length) return;

  let laeuft = false;

  ziele.forEach(a => a.addEventListener('click', async e => {
    // Steht der Helfer schon — der Normalfall, weil das Skript mitlaedt —,
    // dann ohne Umweg auf und fertig.
    if (window.docmedEmbedHelper) {
      e.preventDefault();
      window.docmedEmbedHelper.openClose();
      return;
    }
    // preventDefault muss synchron fallen, vor jedem await.
    e.preventDefault();
    // Doppelklick waehrend des Wartens wuerde sonst zweimal openClose() rufen
    // und das Fenster im selben Atemzug wieder zuklappen.
    if (laeuft) return;
    laeuft = true;
    a.setAttribute('aria-busy', 'true');
    try {
      const hilfe = await helferHolen();
      hilfe.openClose();
    } catch {
      // Das href bleibt stehen und traegt weiter, wenn das fremde Skript nicht
      // kommt — Blocker, Ausfall, Funkloch. Ohne diesen Rueckfall zeigte der
      // wichtigste Knopf der Seite ins Leere. Der Sprung muss von Hand kommen,
      // weil der Klick abgefangen ist.
      window.location.href = a.href;
    } finally {
      laeuft = false;
      a.removeAttribute('aria-busy');
    }
  }));
})();
