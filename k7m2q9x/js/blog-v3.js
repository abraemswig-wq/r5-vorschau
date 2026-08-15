/* Entwurf 3: Punkt auf der Figur und Zeile in der Liste zeigen aufeinander.
   Die Ziffern tragen die Zuordnung auch dann, wenn niemand ueberfahren kann —
   auf dem Touchscreen gibt es kein Hover und damit kein Label. */
(() => {
  const teile = [...document.querySelectorAll('.dot, .liste__a')];
  if (!teile.length) return;

  const paare = new Map();
  teile.forEach(el => {
    const s = el.dataset.slug;
    if (!paare.has(s)) paare.set(s, []);
    paare.get(s).push(el);
  });

  paare.forEach((els, slug) => {
    const setze = an => paare.get(slug).forEach(e => e.classList.toggle('an', an));
    els.forEach(el => {
      el.addEventListener('pointerenter', () => setze(true));
      el.addEventListener('pointerleave', () => setze(false));
      el.addEventListener('focus', () => setze(true));
      el.addEventListener('blur', () => setze(false));
    });
  });
})();
