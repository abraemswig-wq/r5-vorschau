/* Entwurf 2: die Artikelleisten. Wischen und Trackpad koennen Browser selbst;
   dazu kommen Pfeile fuer die Maus, ein Balken als Standanzeige und die Blende
   an den Raendern. Alles nur, wenn es tatsaechlich etwas zu scrollen gibt. */
(() => {
  const sanft = !matchMedia('(prefers-reduced-motion:reduce)').matches;
  const BLENDE = '4.5rem';
  const zeichner = [];

  document.querySelectorAll('.rail-wrap').forEach(block => {
    const leiste = block.querySelector('.rail');
    if (!leiste) return;
    const nav = block.querySelector('.rail__nav');
    const knoepfe = [...block.querySelectorAll('.rail__btn')];
    const balken = block.querySelector('.rail__fill');

    const zeichne = () => {
      const weite = leiste.scrollWidth - leiste.clientWidth;
      const scrollbar = weite > 4;
      const anteil = scrollbar ? leiste.clientWidth / leiste.scrollWidth : 1;
      const weg = scrollbar ? leiste.scrollLeft / weite : 0;

      if (nav) nav.hidden = !scrollbar;
      if (balken) {
        // Der Balken ist ein Daumen: seine Breite sagt, wie viel man sieht,
        // seine Lage, wo man steht.
        balken.style.transform =
          `translateX(${(weg * (1 - anteil) * 100).toFixed(2)}%) scaleX(${anteil.toFixed(4)})`;
      }
      leiste.style.setProperty('--blende-l', weg > 0.01 ? BLENDE : '0px');
      leiste.style.setProperty('--blende-r', scrollbar && weg < 0.99 ? BLENDE : '0px');

      knoepfe.forEach(b => {
        b.disabled = Number(b.dataset.rail) < 0 ? weg <= 0.001 : weg >= 0.999;
      });
    };

    knoepfe.forEach(b => b.addEventListener('click', () => {
      // Eine knappe Fensterbreite: die angeschnittene Karte bleibt als Anker stehen.
      const schritt = leiste.clientWidth * 0.82 * Number(b.dataset.rail);
      leiste.scrollBy({ left: schritt, behavior: sanft ? 'smooth' : 'auto' });
    }));

    leiste.addEventListener('scroll', zeichne, { passive: true });
    zeichner.push(zeichne);
    zeichne();
  });

  const alle = () => zeichner.forEach(z => z());
  addEventListener('resize', alle);
  // Erst wenn die Bilder liegen, stimmt die Breite der Leisten.
  addEventListener('load', alle);
})();
