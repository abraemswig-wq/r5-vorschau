/* EINWILLIGUNG (CookieFirst) — vollstaendig verdrahtet, in der Vorschau still.

   Anlass: Aric hat am 23.10. den Google-Tag-Schnipsel geschickt
   (`G-C75C9ZMSEJ`) und nach einem Cookiebanner gefragt, ausdruecklich mit dem
   Ziel, es "jetzt schon einzubauen, dass das nachher funktioniert, wenn das
   live geht".

   WARUM DER SCHNIPSEL NICHT IN DIE SEITE KOMMT. Nachgesehen statt angenommen:
   rehab-five.com laedt gar keinen gtag im Quelltext. Dort laeuft CookieFirst
   (`consent-eu.cookiefirst.com/sites/rehab-five.com-31d2e90f-…/consent.js`),
   und in dessen Konfiguration steht Google Analytics als Dienst mit
   `integration: "banner_load"`. Das heisst: CookieFirst haelt den
   gtag-Schnipsel selbst vor und schiebt ihn erst NACH der Einwilligung ins
   Dokument. Wuerden wir den Schnipsel zusaetzlich fest in den <head> legen,
   liefe die Messung ohne Einwilligung und zweimal. Deshalb steht hier nur der
   Lader — und keine einzige Google-Kennung.

   DIE KENNUNG WEICHT AB, DAS IST EINE AUFGABE FUER ARIC, KEIN FEHLER IM CODE:
   in CookieFirst liegt `G-YJMLBK0ZB3`, geschickt hat er `G-C75C9ZMSEJ`. Welche
   Property gemessen werden soll, entscheidet er; geaendert wird das im
   CookieFirst-Dashboard, nicht in dieser Datei. Der Bau hier ist davon
   unabhaengig richtig.

   WAS IN DER LIVE-KONFIGURATION STEHT (ausgelesen, nicht vermutet): Kategorien
   `necessary/performance/functional/advertising`, alles ausser `necessary` vor
   der Einwilligung aus; Google Analytics haengt an `performance`.

   Aus `okAcceptsAll: true` plus `bannerToggles: false` hatte ich hier zuerst
   geschlossen, im ersten Banner bleibe praktisch nur "alles annehmen" oder der
   Umweg ueber die Einstellungen. Das war aus der Konfiguration GERATEN, und
   das Banner selbst sagt etwas anderes: es zeigt auf der ersten Ebene
   „Alle akzeptieren", „Ablehnen" und „Nein, anpassen" — Ablehnen steht also
   gleichberechtigt daneben, in derselben Groesse, und der Weg ist gemessen
   (Ablehnen -> kein Google-Skript, nur `cookiefirst-consent`, alle Kategorien
   ausser necessary auf false). Was bleibt, ist eine Geschmacks- und
   Risikofrage fuer Aric, keine Fehlfunktion: „Alle akzeptieren" ist gefuellt,
   „Ablehnen" nur umrandet. Gleiche Ebene und gleiche Groesse ja, gleiche
   optische Wucht nein. Geaendert wird das im CookieFirst-Dashboard.

   Was ich dagegen weiter zur Pruefung vorlege: `autoblockKnownServices: false`
   heisst, dass CookieFirst nichts von selbst blockt. Jeder kuenftige Dienst
   muss dort von Hand eingetragen werden, sonst laeuft er ohne Einwilligung
   mit. Das ist kein Problem von heute — heute gibt es genau zwei Eintraege —,
   aber die Stelle, an der so etwas spaeter leise schiefgeht.

   WARUM IN DER VORSCHAU NICHTS LAEDT — und eine Korrektur an mir selbst. Hier
   stand zuerst, der Lader pruefe die Domain nicht und wuerde auf
   `abraemswig-wq.github.io` anstandslos starten und Cookies setzen. Ich habe
   es ausprobiert, statt es stehen zu lassen, und es ist falsch: der Lader
   prueft wirklich nichts, aber das von ihm nachgezogene Banner baut seine
   Konfigurations-Adresse aus dem Hostnamen —
   `/sites/<hostname>-31d2e90f-…/version.json`. Auf einem fremden Host
   antwortet das mit 404, das Banner bricht ab, und es entsteht KEIN Cookie.
   Gemessen auf 127.0.0.1: drei Anfragen an cookiefirst.com, dann
   `[CF] Request to …/sites/127.0.0.1-31d2e90f-…/version.json failed: 404`,
   danach Stille; `window.CookieFirst` entsteht nie.

   Der Host-Schalter unten ist damit nicht das, was die Vorschau cookiefrei
   haelt — das tut CookieFirst selbst, eine Schicht spaeter. Er bleibt
   trotzdem, und zwar fuer das, was VOR dem 404 passiert: drei Anfragen an
   einen fremden Server tragen die IP-Adresse jedes Vorschau-Besuchers
   hinueber, fuer ein Banner, das dort ohnehin nie erscheint. Genau diese
   Uebermittlung soll nicht stattfinden, solange sie nichts leistet.

   DARAUS FOLGT EINE SACHE FUER DEN GO-LIVE, die man sonst erst im Ernstfall
   merkt: das Banner erscheint auf KEINER Testdomain, sondern ausschliesslich
   unter dem Hostnamen, der in CookieFirst eingetragen ist. Wer das live
   stellt, prueft es also auf der echten Domain — oder traegt die Testdomain
   vorher im CookieFirst-Dashboard als weitere Domain ein. Und wenn die Seite
   je auf einen anderen Hostnamen zieht, muessen ZWEI Stellen nachziehen: die
   Zeile `PRODUKTIV` hier und die Domain in CookieFirst. Ein Probelauf-Schalter
   (`?einwilligung=test`) stand hier kurz und ist wieder raus: er fuehrt nur
   den 404 vor und waere eine Falle fuer den naechsten Leser.
   Ansehen laesst sich das echte Banner heute schon — es laeuft auf
   rehab-five.com.

   DER WIDERRUF IST TEIL DER PFLICHT, NICHT EIN EXTRA: Art. 7 Abs. 3 DSGVO
   verlangt, dass das Zuruecknehmen so leicht ist wie das Geben. Dafuer steht
   in jeder Fusszeile "Cookies verwalten" (dieselbe Beschriftung wie live).
   Der Link ist im Markup `hidden` und wird erst sichtbar, wenn der Dienst
   wirklich antwortet — ein Knopf, der nichts oeffnet, ist schlimmer als
   keiner. */
(() => {
  const LADER = 'https://consent-eu.cookiefirst.com/sites/'
              + 'rehab-five.com-31d2e90f-05da-4f28-84b4-c19ffec7554e/consent.js';

  // Nur die echte Domain und ihre Unterdomains, nicht `rehab-five.com.boese.tld`.
  const PRODUKTIV = /(^|\.)rehab-five\.com$/i;
  if (!PRODUKTIV.test(location.hostname)) return;

  const skript = document.createElement('script');
  skript.src = LADER;
  skript.async = true;
  document.head.appendChild(skript);

  const schalter = [...document.querySelectorAll('[data-einwilligung]')];
  if (!schalter.length) return;

  // Warten, bis CookieFirst seine Funktion bereitstellt. Kein Horchen auf ein
  // Ereignis: dessen Name ist nicht Teil einer Zusage, die Funktion schon.
  const frist = Date.now() + 10000;
  const nachsehen = () => {
    if (typeof window.cookiefirst_show_settings === 'function') {
      schalter.forEach(huelle => {
        huelle.hidden = false;
        const knopf = huelle.querySelector('a');
        if (knopf) knopf.addEventListener('click', e => {
          e.preventDefault();
          window.cookiefirst_show_settings();
        });
      });
      return;
    }
    if (Date.now() < frist) setTimeout(nachsehen, 120);
  };
  nachsehen();
})();
