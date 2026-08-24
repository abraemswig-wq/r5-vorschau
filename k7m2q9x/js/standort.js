/* Standortseite: Bildstrecke waagerecht wischen, Klick zeigt das Bild gross. */
(() => {
  const rail = document.getElementById('osrail');
  const lb   = document.getElementById('oslb');
  if (!rail) return;

  const bilder = [...rail.querySelectorAll('.os__bild')];
  const bar    = document.getElementById('osbar');
  const prev   = document.getElementById('osprev');
  const next   = document.getElementById('osnext');
  const flach  = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const rest = () => rail.scrollWidth - rail.clientWidth;
  const schritt = () => bilder[1] ? bilder[1].offsetLeft - bilder[0].offsetLeft
                                  : (bilder[0]?.offsetWidth || 400);

  const zeichne = () => {
    const r = rest();
    bar.style.transform = `scaleX(${r > 0 ? rail.scrollLeft / r : 1})`;
    prev.disabled = rail.scrollLeft < 4;
    next.disabled = rail.scrollLeft > r - 4;
  };

  const rueck = richtung =>
    rail.scrollBy({ left: richtung * schritt(), behavior: flach ? 'auto' : 'smooth' });

  /* ---------- Selbstlauf ---------- */
  // Die Strecke laeuft von allein weiter, aber nur solange sie im Bild ist und
  // niemand sie selbst angefasst hat. Eine Galerie, die unter dem Finger
  // weiterrutscht, ist eine Zumutung — der erste eigene Griff beendet sie
  // deshalb endgueltig, nicht nur bis zur naechsten Pause.
  let takt = null, uebernommen = false;
  const anhalten = () => { clearInterval(takt); takt = null; };
  const abgeben  = () => { uebernommen = true; anhalten(); };
  const laufen   = () => {
    if (takt || flach || uebernommen) return;
    takt = setInterval(() => {
      if (rail.scrollLeft > rest() - 4) rail.scrollTo({ left: 0, behavior: 'smooth' });
      else rueck(1);
    }, 4200);
  };

  prev.addEventListener('click', () => { abgeben(); rueck(-1); });
  next.addEventListener('click', () => { abgeben(); rueck(1); });
  rail.addEventListener('scroll', zeichne, { passive: true });
  addEventListener('resize', zeichne);
  zeichne();

  if (!flach) {
    new IntersectionObserver(([e]) => e.isIntersecting ? laufen() : anhalten(),
      { threshold: .55 }).observe(rail);
    ['pointerdown', 'wheel', 'keydown', 'focusin'].forEach(t =>
      rail.addEventListener(t, abgeben, { passive: true }));
  }

  /* ---------- Ziehen mit der Maus ---------- */
  // Auf dem Handy wischt man ohnehin. Am Schreibtisch ist die Reihe sonst nur
  // ueber die Pfeile erreichbar, weil ein Trackpad selten waagerecht scrollt.
  let zieht = false, startX = 0, startL = 0, weit = 0;
  rail.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch') return;
    zieht = true; weit = 0; startX = e.clientX; startL = rail.scrollLeft;
    rail.classList.add('is-zieht');
  });
  addEventListener('pointermove', e => {
    if (!zieht) return;
    const d = e.clientX - startX;
    weit = Math.max(weit, Math.abs(d));
    rail.scrollLeft = startL - d;
  });
  addEventListener('pointerup', () => {
    if (!zieht) return;
    zieht = false; rail.classList.remove('is-zieht');
  });

  /* ---------- Grossansicht ---------- */
  if (lb) {
    const img = document.getElementById('oslbimg');
    bilder.forEach(b => b.addEventListener('click', () => {
      // Nach dem Ziehen liegt der Zeiger auf irgendeinem Bild — ohne die Schwelle
      // oeffnete jedes Wischen am Ende eine Grossansicht.
      if (weit > 6) return;
      img.src = b.dataset.voll;
      img.alt = b.querySelector('img').alt;
      lb.showModal();
    }));
    document.getElementById('oslbx').addEventListener('click', () => lb.close());
    lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
    // removeAttribute statt src='': ein leeres src laesst den Browser die Seite
    // selbst noch einmal als Bild anfordern.
    lb.addEventListener('close', () => { img.removeAttribute('src'); });
  }
})();
