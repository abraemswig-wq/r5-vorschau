/* Markiert im Inhaltsverzeichnis den Abschnitt, in dem man gerade liest.
   Reine Zugabe: ohne dieses Skript bleibt das Verzeichnis eine Sprungliste. */
(() => {
  const links = [...document.querySelectorAll('.toc__l a')];
  if (!links.length || !('IntersectionObserver' in window)) return;

  const zu = new Map();
  links.forEach(a => {
    const ziel = document.getElementById(decodeURIComponent(a.hash.slice(1)));
    if (ziel) zu.set(ziel, a);
  });

  const sichtbar = new Set();
  const setzen = () => {
    // Der oberste sichtbare Abschnitt gewinnt; scrollt man aus allen heraus,
    // bleibt die letzte Markierung stehen statt zu flackern.
    let treffer = null;
    for (const el of zu.keys()) if (sichtbar.has(el)) { treffer = el; break; }
    if (!treffer) return;
    links.forEach(a => a.removeAttribute('aria-current'));
    zu.get(treffer).setAttribute('aria-current', 'true');
  };

  const beobachter = new IntersectionObserver(eintraege => {
    eintraege.forEach(e => e.isIntersecting ? sichtbar.add(e.target) : sichtbar.delete(e.target));
    setzen();
  }, { rootMargin: '-96px 0px -70% 0px' });   // rootMargin kennt nur px und %

  zu.forEach((_, el) => beobachter.observe(el));
})();
