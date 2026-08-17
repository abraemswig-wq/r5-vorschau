/* Team-Galerie: waagerecht wischen, Klick oeffnet die Profilkarte. */
(() => {
  const rail = document.getElementById('rail');
  const pc   = document.getElementById('pc');
  if (!rail || !pc) return;

  const daten = JSON.parse(document.getElementById('teamdaten').textContent);
  const karten = [...rail.querySelectorAll('.member')];
  const el = id => document.getElementById(id);
  const bar = el('railbar');

  // Gefiltert wird durch Ausblenden, nicht durch Umsortieren: die Profilkarte
  // greift ueber den Index auf die Daten zu, und der muss stabil bleiben.
  const offen = () => karten.filter(k => !k.hidden);

  /* ---------- Fortschritt ---------- */
  const mess = () => {
    const rest = rail.scrollWidth - rail.clientWidth;
    bar.style.transform = `scaleX(${rest > 0 ? rail.scrollLeft / rest : 1})`;
    el('railprev').disabled = rail.scrollLeft < 4;
    el('railnext').disabled = rail.scrollLeft > rest - 4;
  };

  /* ---------- Rasterweite ---------- */
  // Layoutabstand, nicht sichtbarer Abstand: die Karten werden gedreht und zur
  // Mitte gezogen, ihre sichtbaren Kanten taugen als Mass nicht mehr.
  const schritt = () => {
    const s = offen();
    return s[1] ? s[1].offsetLeft - s[0].offsetLeft : (s[0]?.offsetWidth || 300);
  };

  /* ---------- Tiefe ---------- */
  // Die Person in der Mitte steht gerade, vorn und hell; nach aussen kippen die
  // Bilder weg, ruecken zurueck und dunkeln ab. Der Blick hat dadurch einen
  // Platz, an dem er haengenbleibt, statt 33 gleich laute Karten zu sehen.
  const flach = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const raum = () => {
    const blick = rail.scrollLeft + rail.clientWidth / 2;
    // Gemessen wird in Karten, nicht in Bruchteilen der Reihenbreite: sonst haengt
    // die Staerke am Viewport. Auf dem Handy passen keine zwei Karten neben die
    // Mitte, der Nachbar landete rechnerisch bei 1,2 statt 0,5 und schrumpfte auf
    // einen 71px-Splitter — auf dem Desktop sah dieselbe Formel richtig aus.
    const raster = schritt();
    offen().forEach(k => {
      // offsetLeft ist die Layoutmitte und dreht sich nicht mit. Ueber die
      // sichtbare Box gemessen zoege sich die Rechnung selbst am Schopf: jede
      // Verschiebung veraenderte die naechste Messung.
      const roh = (k.offsetLeft + k.offsetWidth / 2 - blick) / raster;
      const t = Math.max(-2.4, Math.min(2.4, roh));
      const weg = Math.abs(t);
      k.classList.toggle('is-mitte', weg < 0.35);
      if (flach) return;
      // Der Zug nach innen ist das, was den Effekt ausmacht: die Nachbarn
      // schieben sich hinter die Mitte, statt daneben stehen zu bleiben.
      const d = k.firstElementChild;
      // scale zusaetzlich zu translateZ: die Perspektive allein verkleinert bei
      // 240px Tiefe nur auf 86% — zu wenig, um eine Rangfolge zu sehen. Erst der
      // Sprung auf gut die Haelfte macht aus dem Verlauf eine Hierarchie.
      // Der Zug nach innen waechst im Quadrat, die Groesse nimmt linear ab: bei
      // linearem Zug klaffte zwischen der zweiten und dritten Person eine Luecke
      // von 137px, weil jede Karte zwar schrumpft, ihren Platz im Raster aber
      // behaelt. Das Quadrat haelt die sichtbaren Kanten aneinander.
      d.style.transform = `perspective(1500px) translateX(${(-t * weg * raster * 0.135).toFixed(1)}px) `
                        + `translateZ(${(-weg * 120).toFixed(1)}px) `
                        + `rotateY(${(-t * 17).toFixed(2)}deg) `
                        + `scale(${(1 - weg * 0.19).toFixed(3)})`;
      d.style.filter = `brightness(${(1 - weg * 0.21).toFixed(3)}) `
                     + `saturate(${Math.max(0, 1 - weg * 0.48).toFixed(3)})`;
      k.style.zIndex = String(40 - Math.round(weg * 8));
    });
  };

  let angefordert = false;
  const zeichne = () => { angefordert = false; mess(); raum(); };
  const anfordern = () => {
    if (angefordert) return;
    angefordert = true;
    requestAnimationFrame(zeichne);
  };
  rail.addEventListener('scroll', anfordern, {passive: true});
  addEventListener('resize', anfordern);
  zeichne();

  /* ---------- Pfeile ---------- */
  // Um genau ein Kartenraster weiterspringen, nicht um eine feste Pixelzahl:
  // die Kartenbreite haengt am Viewport.
  const ruecke = d => rail.scrollBy({left: d * schritt(), behavior: 'smooth'});
  el('railprev').addEventListener('click', () => ruecke(-1));
  el('railnext').addEventListener('click', () => ruecke(1));

  rail.addEventListener('keydown', e => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    // Steht der Fokus auf einer Person, wandert er mit. Sonst scrollte die Reihe
    // unter dem Fokus weg und Enter oeffnete jemanden, den man nicht mehr sieht.
    const s = offen();
    const i = s.indexOf(document.activeElement);
    if (i < 0) return ruecke(d);
    const naechste = s[Math.max(0, Math.min(s.length - 1, i + d))];
    naechste.focus();
    // Nur hier zentrieren, nicht bei jedem Fokus: die Maus setzt den Fokus schon
    // beim Druecken, ein Zug wuerde sich sonst gegen das Nachruecken stemmen.
    naechste.scrollIntoView({block: 'nearest', inline: 'center'});
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
    aktiv = (i + karten.length) % karten.length;
    const d = daten[aktiv];
    const bild = el('pcimg');
    // Pfad aus der Reihe uebernehmen statt aus den Daten: nur dort steht er in
    // der Form, die auch auf dem Server stimmt.
    bild.src = karten[aktiv].querySelector('img').src;
    bild.alt = d.ohne ? `${d.name} — noch kein Portrait` : d.name;
    el('pcname').textContent = d.name;
    el('pcrole').textContent = d.rolle;
    setz(el('pcort'), d.standort);
    setz(el('pcfokus'), d.fokus);
    setz(el('pcsatz'), d.satz);
    const s = offen();
    el('pczaehler').textContent = `${s.indexOf(karten[aktiv]) + 1} / ${s.length}`;
    // Die Karte hinter der Galerie mitziehen, damit nach dem Schliessen die
    // zuletzt gesehene Person im Bild steht.
    karten[aktiv]?.scrollIntoView({block: 'nearest', inline: 'center'});
  };

  karten.forEach((k, i) => k.addEventListener('click', () => {
    zeige(i);
    pc.showModal();
  }));

  // Blaettern laeuft ueber die sichtbaren Karten: bei aktivem Filter waere es
  // sonst moeglich, aus dem Bereich herauszublaettern, den man gerade ansieht.
  const weiter = d => {
    const s = offen();
    const i = s.indexOf(karten[aktiv]);
    zeige(karten.indexOf(s[(i + d + s.length) % s.length]));
  };

  el('pcx').addEventListener('click', () => pc.close());
  el('pcprev').addEventListener('click', () => weiter(-1));
  el('pcnext').addEventListener('click', () => weiter(1));
  pc.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') weiter(1);
    if (e.key === 'ArrowLeft')  weiter(-1);
  });
  // Klick auf die Flaeche neben der Karte schliesst — ohne den Rahmen selbst
  // zu treffen, sonst schliesst jeder Klick im Inneren mit.
  pc.addEventListener('click', e => { if (e.target === pc) pc.close(); });

  /* Wischen innerhalb der Karte */
  let tx = 0;
  pc.addEventListener('touchstart', e => { tx = e.changedTouches[0].clientX; }, {passive: true});
  pc.addEventListener('touchend', e => {
    const d = e.changedTouches[0].clientX - tx;
    if (Math.abs(d) > 60) weiter(d < 0 ? 1 : -1);
  }, {passive: true});

  /* ---------- Filter: Bereich und Standort ---------- */
  // Zwei Achsen, die sich schneiden — „Physiotherapie" und „Scharnhorststrasse"
  // gelten gleichzeitig. Getrennte Leisten statt einer langen: die Frage „welcher
  // Beruf" und die Frage „welches Haus" sind zwei Fragen.
  const bereich = document.querySelector('.teamfilter:not(.teamfilter--ort)');
  const ortLeiste = document.querySelector('.teamfilter--ort');
  if (bereich || ortLeiste) {
    let wahlBereich = 'alle', wahlOrt = 'alle';

    const anwenden = () => {
      karten.forEach(k => {
        k.hidden = (wahlBereich !== 'alle' && k.dataset.gruppe !== wahlBereich)
                || (wahlOrt !== 'alle' && k.dataset.ort !== wahlOrt);
      });
      rail.scrollLeft = 0;
      zeichne();
      // Die Zahl auf dem Knopf gilt fuer die jeweils andere Achse mit: wer nach
      // Standort filtert, will wissen, wie viele Physios dort sitzen — nicht wie
      // viele es insgesamt gibt. Sonst verspricht ein Knopf 16 und zeigt 4.
      zaehlen(bereich, 'filter', k => wahlOrt === 'alle' || k.dataset.ort === wahlOrt, 'gruppe');
      zaehlen(ortLeiste, 'ort', k => wahlBereich === 'alle' || k.dataset.gruppe === wahlBereich, 'ort');
    };

    const zaehlen = (leiste, feld, passt, merkmal) => {
      if (!leiste) return;
      leiste.querySelectorAll('button').forEach(b => {
        const wert = b.dataset[feld];
        const n = karten.filter(k => passt(k) && (wert === 'alle' || k.dataset[merkmal] === wert)).length;
        b.querySelector('.teamfilter__n').textContent = String(n);
        // Ein Knopf, der auf null fuehrt, ist eine Sackgasse — abschalten statt
        // den Nutzer in eine leere Reihe laufen lassen.
        b.disabled = n === 0 && b.getAttribute('aria-pressed') !== 'true';
      });
    };

    const verdrahten = (leiste, feld, setzen) => {
      if (!leiste) return;
      const knoepfe = [...leiste.querySelectorAll('button')];
      knoepfe.forEach(b => b.addEventListener('click', () => {
        knoepfe.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        setzen(b.dataset[feld]);
        anwenden();
      }));
    };
    verdrahten(bereich, 'filter', w => { wahlBereich = w; });
    verdrahten(ortLeiste, 'ort', w => { wahlOrt = w; });
    anwenden();
  }
})();
