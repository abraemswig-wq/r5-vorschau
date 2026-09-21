/* Umschalter zwischen den drei Entwuerfen fuer die Handlungsaufrufe.

   Gehoert NICHT zur Seite — er ist ein Werkzeug fuer die Abnahme und faellt
   mit der Entscheidung wieder raus. Deshalb baut er sich selbst aus dem
   Skript heraus und steht nicht im Markup: so gibt es nachher nichts zu
   vergessen, ausser eine Datei zu loeschen.

   Die Wahl liegt im sessionStorage, damit sie beim Weiterklicken auf
   Unterseiten stehenbleibt. Ohne das muesste man auf jeder Seite neu waehlen
   und vergliche am Ende Aepfel mit Birnen. */
(() => {
  const NAMEN = { a: 'A · Solider Block', b: 'B · Editorial-Zeilen', c: 'C · Ein Knopf' };
  const SPEICHER = 'r5-entwurf';

  // Tiefe aus dem vorhandenen Stylesheet ablesen statt aus dem Pfad raten:
  // die Seiten liegen auf zwei Ebenen, und ein falsches ../ liefert 404 ohne
  // jede Fehlermeldung — das Stylesheet fehlt dann einfach.
  const basis = (document.querySelector('link[href*="css/style.css"]') || {}).getAttribute
    ? document.querySelector('link[href*="css/style.css"]').getAttribute('href').replace('style.css', '')
    : 'css/';

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.id = 'entwurfcss';
  document.head.appendChild(link);

  const setzen = (k) => {
    link.href = `${basis}v-${k}.css`;
    sessionStorage.setItem(SPEICHER, k);
    [...leiste.querySelectorAll('button')].forEach(b =>
      b.setAttribute('aria-pressed', String(b.dataset.k === k)));
  };

  const leiste = document.createElement('div');
  leiste.className = 'entwurfsleiste';
  leiste.innerHTML = '<span>Entwurf</span>' +
    Object.entries(NAMEN).map(([k, n]) =>
      `<button type="button" data-k="${k}" aria-pressed="false" title="${n}">${k.toUpperCase()}</button>`).join('');
  leiste.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (b) setzen(b.dataset.k);
  });

  const stil = document.createElement('style');
  stil.textContent = `
    .entwurfsleiste{
      position:fixed;left:50%;transform:translateX(-50%);
      /* 5.5rem, nicht 1rem: die Online-Rezeption sitzt unten rechts und ist
         auf dem Telefon rund 64px hoch. */
      bottom:5.5rem;z-index:10001;
      display:flex;align-items:center;gap:.4rem;
      padding:.45rem .6rem;border-radius:999px;
      background:rgba(11,22,17,.92);backdrop-filter:blur(10px);
      border:1px solid rgba(251,241,224,.22);
      font-family:Barlow,sans-serif;
    }
    .entwurfsleiste span{
      font-size:.5625rem;letter-spacing:.18em;text-transform:uppercase;
      color:rgba(251,241,224,.55);padding:0 .35rem 0 .25rem;
    }
    .entwurfsleiste button{
      min-width:34px;min-height:34px;border:0;border-radius:999px;cursor:pointer;
      background:rgba(251,241,224,.1);color:rgba(251,241,224,.8);
      font:900 .8125rem/1 Barlow,sans-serif;letter-spacing:.06em;
      transition:background-color .16s,color .16s;
    }
    .entwurfsleiste button[aria-pressed="true"]{background:#D99129;color:#0B1611}
    .entwurfsleiste button:focus-visible{outline:2px solid #FBF1E0;outline-offset:2px}
  `;
  document.head.appendChild(stil);

  const start = () => {
    document.body.appendChild(leiste);
    setzen(sessionStorage.getItem(SPEICHER) || 'b');
  };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', start);
  else start();
})();
