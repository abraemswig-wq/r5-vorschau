/* Team-Galerie: waagerecht wischen, Klick oeffnet die Profilkarte. */
(() => {
  const rail = document.getElementById('rail');
  const pc   = document.getElementById('pc');
  if (!rail || !pc) return;

  const daten = JSON.parse(document.getElementById('teamdaten').textContent);
  const karten = [...rail.querySelectorAll('.member')];
  const el = id => document.getElementById(id);
  const bar = el('railbar');

  /* ---------- Fortschritt ---------- */
  const mess = () => {
    const rest = rail.scrollWidth - rail.clientWidth;
    bar.style.transform = `scaleX(${rest > 0 ? rail.scrollLeft / rest : 1})`;
    el('railprev').disabled = rail.scrollLeft < 4;
    el('railnext').disabled = rail.scrollLeft > rest - 4;
  };
  rail.addEventListener('scroll', mess, {passive: true});
  addEventListener('resize', mess);
  mess();

  /* ---------- Pfeile ---------- */
  // Um genau ein Kartenraster weiterspringen, nicht um eine feste Pixelzahl:
  // die Kartenbreite haengt am Viewport.
  const schritt = () => {
    const a = karten[0], b = karten[1];
    return b ? b.getBoundingClientRect().left - a.getBoundingClientRect().left : 300;
  };
  const ruecke = d => rail.scrollBy({left: d * schritt(), behavior: 'smooth'});
  el('railprev').addEventListener('click', () => ruecke(-1));
  el('railnext').addEventListener('click', () => ruecke(1));

  rail.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); ruecke(1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); ruecke(-1); }
  });

  /* ---------- Ziehen mit der Maus ---------- */
  // Touch kann der Browser selbst. Fuer die Maus gibt es kein Wischen, deshalb
  // hier: gedrueckt halten und ziehen. Ein Zug darf hinterher keinen Klick
  // ausloesen, sonst springt beim Loslassen die Profilkarte auf.
  // Kein setPointerCapture: das leitet den anschliessenden Klick auf die Reihe
  // um, die Person darunter bekaeme ihn nie und die Karte oeffnete nicht mehr.
  // Der Browser startet auf einem Bild sein eigenes Drag-and-Drop und stellt
  // danach jedes weitere pointermove ein — die Reihe bliebe nach 20px stehen.
  rail.addEventListener('dragstart', e => e.preventDefault());

  let zieht = false, startX = 0, startL = 0, weit = false;
  rail.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    zieht = true; weit = false;
    startX = e.clientX; startL = rail.scrollLeft;
    rail.classList.add('is-zieht');
  });
  addEventListener('pointermove', e => {
    if (!zieht) return;
    const d = e.clientX - startX;
    if (Math.abs(d) > 4) weit = true;
    if (weit) { e.preventDefault(); rail.scrollLeft = startL - d; }
  });
  addEventListener('pointerup', () => {
    if (!zieht) return;
    zieht = false;
    rail.classList.remove('is-zieht');
    // erst nach dem Klick zuruecksetzen, sonst oeffnet das Loslassen die Karte
    setTimeout(() => { weit = false; }, 0);
  });
  rail.addEventListener('click', e => { if (weit) { e.preventDefault(); e.stopPropagation(); } }, true);

  /* ---------- Profilkarte ---------- */
  const LEER = 'noch nicht hinterlegt';
  const setz = (knoten, wert) => {
    knoten.textContent = wert || LEER;
    knoten.classList.toggle('is-leer', !wert);
  };

  let aktiv = 0;
  const zeige = i => {
    aktiv = (i + daten.length) % daten.length;
    const d = daten[aktiv];
    const bild = el('pcimg');
    bild.src = d.bild;
    bild.alt = d.ohne ? `${d.name} — noch kein Portrait` : d.name;
    el('pcname').textContent = d.name;
    el('pcrole').textContent = d.rolle;
    setz(el('pcort'), d.standort);
    setz(el('pcfokus'), d.fokus);
    setz(el('pcsatz'), d.satz);
    el('pczaehler').textContent = `${aktiv + 1} / ${daten.length}`;
    // Die Karte hinter der Galerie mitziehen, damit nach dem Schliessen die
    // zuletzt gesehene Person im Bild steht.
    karten[aktiv]?.scrollIntoView({block: 'nearest', inline: 'center'});
  };

  karten.forEach((k, i) => k.addEventListener('click', () => {
    zeige(i);
    pc.showModal();
  }));

  el('pcx').addEventListener('click', () => pc.close());
  el('pcprev').addEventListener('click', () => zeige(aktiv - 1));
  el('pcnext').addEventListener('click', () => zeige(aktiv + 1));
  pc.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') zeige(aktiv + 1);
    if (e.key === 'ArrowLeft')  zeige(aktiv - 1);
  });
  // Klick auf die Flaeche neben der Karte schliesst — ohne den Rahmen selbst
  // zu treffen, sonst schliesst jeder Klick im Inneren mit.
  pc.addEventListener('click', e => { if (e.target === pc) pc.close(); });

  /* Wischen innerhalb der Karte */
  let tx = 0;
  pc.addEventListener('touchstart', e => { tx = e.changedTouches[0].clientX; }, {passive: true});
  pc.addEventListener('touchend', e => {
    const d = e.changedTouches[0].clientX - tx;
    if (Math.abs(d) > 60) zeige(aktiv + (d < 0 ? 1 : -1));
  }, {passive: true});
})();
