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
    const img  = document.getElementById('oslbimg');
    const film = document.getElementById('oslbvid');

    // Eine Kachel mit `data-film` ist der Rundgang, alle anderen sind Bilder.
    // Die Reihe, das Ziehen, die Pfeile und der Selbstlauf behandeln beide
    // gleich — nur was die Grossansicht zeigt, unterscheidet sich. Dadurch
    // braucht die Friedrich-Ebert-Strasse, sobald es dort einen eigenen Film
    // gibt, genau eine Kachel und keine Zeile hier.
    const zeigeBild = b => {
      if (film) film.hidden = true;
      img.hidden = false;
      // srcset vor src: die Grossansicht ist min(96vw,84rem) breit, ein
      // Telefon braucht davon rund 1200 px, ein 1440er Laptop rund 2700. Ein
      // fester Pfad muesste sich fuer eines von beiden entscheiden — bis zum
      // 18.09.2026 war das das Original-JPEG mit bis zu 509 kB fuer alle.
      img.srcset = b.dataset.vollset || '';
      img.sizes = '(min-width:1400px) 1344px, 96vw';
      img.src = b.dataset.voll;
      img.alt = b.querySelector('img').alt;
    };

    const zeigeFilm = b => {
      img.hidden = true;
      film.hidden = false;
      // Das Standbild der Kachel dient auch als Poster: dann steht beim
      // Oeffnen sofort ein Bild, obwohl vom Film noch kein Byte da ist.
      film.poster = b.querySelector('img').currentSrc
        || b.querySelector('img').src;
      film.src = b.dataset.film;
      // Erst nach dem Oeffnen abspielen — ein <video> in einem noch
      // geschlossenen <dialog> hat keine Groesse, und Safari verweigert den
      // Start dann kommentarlos.
      film.play().catch(() => {});   // Autoplay-Sperre ist kein Fehler:
                                      // dann steht der eigene Startknopf da.
    };

    bilder.forEach(b => b.addEventListener('click', () => {
      // Nach dem Ziehen liegt der Zeiger auf irgendeinem Bild — ohne die Schwelle
      // oeffnete jedes Wischen am Ende eine Grossansicht.
      if (weit > 6) return;
      const istFilm = film && b.dataset.film;
      if (istFilm) { lb.showModal(); zeigeFilm(b); }
      else { zeigeBild(b); lb.showModal(); }
    }));
    document.getElementById('oslbx').addEventListener('click', () => lb.close());
    lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
    // removeAttribute statt src='': ein leeres src laesst den Browser die Seite
    // selbst noch einmal als Bild anfordern. Das srcset muss mit weg — sonst
    // laedt der Browser weiter daraus, obwohl kein src mehr steht.
    lb.addEventListener('close', () => {
      img.removeAttribute('src');
      img.removeAttribute('srcset');
      if (film) {
        // pause() allein reicht nicht: der Browser laedt den Rest des Films
        // im Hintergrund weiter. Erst src weg UND load() bricht den Abruf ab.
        film.pause();
        film.removeAttribute('src');
        film.load();
        film.hidden = true;
      }
      img.hidden = false;
    });
  }
})();
