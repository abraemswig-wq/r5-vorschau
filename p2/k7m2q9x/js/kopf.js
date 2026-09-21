/* Kopfmenue der Unterseiten.

   Die vier Navigationslinks standen bis hierher als 11px-Zeilen im Kopf. Auf
   dem Telefon ergab das Trefferflaechen von 21 bis 33 Pixeln — unter den 44,
   die eine Fingerkuppe zuverlaessig trifft — und sobald der Termin-Knopf
   danebenstand, brach die Zeile um und schnitt die Wortmarke ab.

   Unter 820px werden die Links deshalb zu einer Flaeche hinter einem Burger,
   in derselben Sprache wie das Kapitelmenue der Startseite.

   Der Burger steht als hidden im Markup und wird erst hier sichtbar gemacht:
   faellt dieses Skript aus, bleibt die Navigation als normale Linkzeile
   stehen. Ein Burger, der ohne Skript nichts oeffnet, waere schlimmer als
   eine umbrechende Zeile. */
(() => {
  const burger = document.getElementById('kopfburger');
  const nav = document.querySelector('.page-nav');
  if (!burger || !nav) return;

  burger.hidden = false;
  nav.id = nav.id || 'kopfnav';
  burger.setAttribute('aria-controls', nav.id);

  const auf = (ja) => {
    burger.setAttribute('aria-expanded', String(ja));
    nav.dataset.offen = String(ja);
    document.documentElement.style.overflow = ja ? 'hidden' : '';
    burger.setAttribute('aria-label', ja ? 'Menü schließen' : 'Menü öffnen');
    /* Die Online-Rezeption liegt auf 9999 (gemessen, nicht geraten) und deckte
       den unteren Teil des Menues zu. Das Menue selbst hoeherzulegen bringt
       nichts: es steckt in .page-top, und die macht mit z-index:60 einen
       eigenen Stapelkontext auf — aus dem kommt kein Kind heraus. Also hebt
       sich der ganze Kopf, und nur solange das Menue offen ist. */
    if (ja) document.documentElement.dataset.kopfmenue = 'auf';
    else delete document.documentElement.dataset.kopfmenue;
  };
  auf(false);

  burger.addEventListener('click', () =>
    auf(burger.getAttribute('aria-expanded') !== 'true'));

  // Escape und ein Klick daneben schliessen. Ohne beides ist eine Flaeche, die
  // den ganzen Bildschirm deckt, eine Sackgasse.
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') auf(false);
  });
  nav.addEventListener('click', e => { if (e.target === nav) auf(false); });

  // Wird das Fenster breit, greift wieder die Linkzeile. Bliebe der Zustand
  // stehen, waere overflow:hidden auf einer Seite aktiv, die gar kein Menue
  // mehr offen hat — die Seite liesse sich nicht mehr scrollen.
  matchMedia('(min-width: 821px)').addEventListener('change', e => {
    if (e.matches) auf(false);
  });
})();
