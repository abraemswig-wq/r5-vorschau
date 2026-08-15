/* Entwurf 1: Das Vorschaubild haengt am Zeiger statt in der Zeile zu stehen.
   Damit bleibt die Liste ruhig und die Ueberschriften behalten ihre Groesse. */
(() => {
  const peek = document.querySelector('.reg__peek');
  const zeilen = [...document.querySelectorAll('.reg__a')];
  if (!peek || !zeilen.length) return;
  // Ohne Zeiger gibt es nichts zu verfolgen; dort steht das Bild in der Zeile.
  if (!matchMedia('(hover:hover)').matches) return;
  if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;

  const bild = document.createElement('img');
  bild.alt = '';
  // Gleich eine Quelle setzen: ein Bild ohne src ist ein totes Bild — fuer den
  // Browser wie fuer die Pruefung. Nebenbei liegt das erste Motiv damit warm
  // im Cache, bevor der Zeiger die erste Zeile erreicht.
  bild.src = zeilen[0].dataset.bild;
  peek.append(bild);
  let zx = 0, zy = 0, x = 0, y = 0, lauf = 0;

  const folge = () => {
    x += (zx - x) * 0.16;
    y += (zy - y) * 0.16;
    peek.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
    lauf = requestAnimationFrame(folge);
  };

  zeilen.forEach(z => {
    z.addEventListener('pointerenter', e => {
      if (bild.getAttribute('src') !== z.dataset.bild) bild.src = z.dataset.bild;
      zx = x = e.clientX;
      zy = y = e.clientY;
      peek.style.transform = `translate3d(${x}px,${y}px,0)`;
      peek.classList.add('an');
      if (!lauf) lauf = requestAnimationFrame(folge);
    });
    z.addEventListener('pointermove', e => { zx = e.clientX; zy = e.clientY; });
    z.addEventListener('pointerleave', () => {
      peek.classList.remove('an');
      cancelAnimationFrame(lauf);
      lauf = 0;
    });
  });
})();
