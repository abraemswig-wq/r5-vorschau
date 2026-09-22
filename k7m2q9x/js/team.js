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

  /* ---------- Passt die Auswahl ins Bild? ---------- */
  // Bei „Mediendesign" oder „Ernaehrung & Praevention" bleiben zwei Personen
  // uebrig. Als Reihe behandelt standen die dann in der linken Haelfte, die
  // rechte war leer, eine der beiden war weggekippt und abgedunkelt, und die
  // Pfeile boten ein Blaettern an, das nichts mehr bewegte. Das sah wie ein
  // Fehler aus und war es der Wirkung nach auch (Aric, 21.09.2026).
  //
  // Gemessen wird der reine Platzbedarf der Karten, NICHT scrollWidth: die
  // Einrueckung der Reihe ist eine halbe Fensterbreite pro Seite, damit auch
  // die erste und letzte Person in die Mitte kommen. scrollWidth zaehlt sie mit
  // und meldete deshalb selbst bei einer einzigen Karte Ueberlauf.
  const gal = rail.closest('.gal');
  const hintZeile = gal && gal.querySelector('.gal__hint');
  const hinweis = hintZeile && hintZeile.querySelector('span');
  const HINWEIS_REIHE = hinweis ? hinweis.textContent : '';

  const platzbedarf = () => {
    const s = offen();
    if (!s.length) return 0;
    // offsetWidth, nicht die sichtbare Box: die Karten sind gedreht und
    // verschoben, ihre Bildschirmkanten sind kein Layoutmass.
    const lz = parseFloat(getComputedStyle(rail).columnGap) || 0;
    return s.reduce((a, k) => a + k.offsetWidth, 0) + lz * (s.length - 1);
  };
  // Der Rand links und rechts ist --gut, und den gibt es nur als vw-Wert. Statt
  // ihn nachzurechnen wird er dort abgelesen, wo er als Pixelwert im Layout
  // steht: die Hinweiszeile unter der Galerie hat genau dieses Innenmass.
  const rand = () => (hintZeile ? parseFloat(getComputedStyle(hintZeile).paddingLeft) || 0 : 0);
  // Ab wie wenigen Personen ein Wischen nichts mehr taugt: bei drei Karten auf
  // dem Telefon bleibt genau ein Schritt Weg. Wer wischt, erwartet mehr als das.
  const STAPEL_BIS = 3;
  let knapp = false;          // gruppe ODER stapel — beides ohne Reihen-Logik
  let art = 'reihe';
  const modus = () => {
    // Rahmenbreite, nicht clientWidth: clientWidth haengt an der Einrueckung,
    // und die aendert dieses Verfahren selbst — die Messung wuerde sich bei
    // jedem Durchlauf ihr eigenes Ergebnis bestaetigen.
    const n = offen().length;
    const passt = platzbedarf() <= rail.getBoundingClientRect().width - 2 * rand();
    art = passt ? 'gruppe' : (n && n <= STAPEL_BIS ? 'stapel' : 'reihe');
    knapp = art !== 'reihe';
    rail.dataset.modus = art;
    if (gal) gal.dataset.modus = art;
    if (hinweis) hinweis.textContent = knapp ? 'Antippen für das Profil' : HINWEIS_REIHE;
    return knapp;
  };

  /* ---------- Fortschritt ---------- */
  const mess = () => {
    if (knapp) return;   // Strich und Pfeile sind in diesem Modus ausgeblendet
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
  // Ausgeblendete Karten behalten sonst is-mitte und die letzte Transformation.
  // Sichtbar ist das nicht (display:none), aber jede Zaehlung ueber .is-mitte
  // liest danach Personen mit, die gar nicht mehr in der Auswahl sind — der
  // Bereich „Ernaehrung & Praevention" meldete drei Mitten bei zwei Karten.
  const zuruecksetzen = k => {
    k.classList.remove('is-mitte');
    const d = k.firstElementChild;
    if (d) { d.style.transform = ''; d.style.filter = ''; }
    k.style.zIndex = '';
  };

  const raum = () => {
    karten.forEach(k => { if (k.hidden) zuruecksetzen(k); });
    // Passt alles ins Bild, gibt es keine Mitte: dann steht jede Person gerade,
    // hell und beschriftet da. Eine Tiefenkurve ueber zwei Karten sortiert
    // nichts, sie dunkelt nur eine der beiden ohne Grund ab.
    if (knapp) {
      offen().forEach(k => { zuruecksetzen(k); k.classList.add('is-mitte'); });
      return;
    }
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

  /* ---------- Startpunkt ---------- */
  // Auf die erste Karte zentriert stand die halbe Reihe leer: links vom Anfang
  // liegt nichts, auf 1440px waren das 536 tote Pixel neben einem Gesicht. Die
  // Reihe startet deshalb so weit eingerueckt, wie links tatsaechlich Karten
  // hinpassen — die Mitte bleibt die Mitte, sie hat nur beide Seiten belegt.
  const anfang = () => {
    const s = offen();
    if (!s.length) return;
    // Im knappen Modus gibt es nichts einzurücken: die Gruppe steht zentriert
    // und die Reihe hat gar keinen Scrollweg mehr.
    if (modus()) { rail.scrollLeft = 0; return; }
    const raster = schritt();
    const platz = Math.max(0, Math.floor((rail.clientWidth / raster - 1) / 2));
    const z = s[Math.min(platz, s.length - 1)];
    rail.scrollLeft = z.offsetLeft + z.offsetWidth / 2 - rail.clientWidth / 2;
  };

  let angefordert = false;
  // modus() zuerst: mess() und raum() rechnen beide anders, je nachdem ob die
  // Auswahl ins Bild passt. Stuende die Pruefung hinter ihnen, arbeitete der
  // erste Durchlauf nach jedem Filterwechsel noch mit dem alten Modus.
  const zeichne = () => { angefordert = false; modus(); mess(); raum(); };
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
    // Im knappen Modus gibt es keinen Scrollweg. Ohne diese Sperre haette ein
    // Zug den anschliessenden Klick verschluckt — die Profilkarte oeffnete dann
    // manchmal nicht, und zwar ohne sichtbaren Grund.
    if (knapp) return;
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
    const gitter = karten[aktiv].querySelector('img');
    /* srcset MUSS mitgesetzt werden, und zwar vor src. Im Markup traegt #pcimg
       ein festes srcset auf aric-braemswig-*.webp — das ist nur der Zustand vor
       dem ersten Klick. Ein vorhandenes srcset schlaegt src aber immer. Solange
       hier nur src gesetzt wurde, zeigte die Profilkarte deshalb bei JEDER
       Person Arics Portrait, unter dem fremden Namen. Gemessen am 21.09.2026:
       64 von 66 Oeffnungen (33 Personen x 2 Fenstergroessen). */
    bild.srcset = gitter.getAttribute('srcset') || '';
    bild.src = gitter.getAttribute('src');
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
  // Beide Seiten sind Mengen, nicht einzelne Werte: Freddy und Luana sind
  // Physiotherapeutinnen *und* Rezeption, und der Knopf „Buero & Verwaltung"
  // fasst zwei Adressen zusammen. Ein Treffer ist eine Schnittmenge.
  const trifft = (karte, merkmal, wert) => {
    if (wert === 'alle') return true;
    const hat = (karte.dataset[merkmal] || '').split(' ');
    return wert.split(' ').some(w => hat.includes(w));
  };
  const bereich = document.querySelector('.teamfilter:not(.teamfilter--ort)');
  const ortLeiste = document.querySelector('.teamfilter--ort');
  if (bereich || ortLeiste) {
    let wahlBereich = 'alle', wahlOrt = 'alle';

    const anwenden = () => {
      karten.forEach(k => {
        k.hidden = !trifft(k, 'gruppe', wahlBereich) || !trifft(k, 'ort', wahlOrt);
      });
      anfang();
      zeichne();
      // Die Zahl auf dem Knopf gilt fuer die jeweils andere Achse mit: wer nach
      // Standort filtert, will wissen, wie viele Physios dort sitzen — nicht wie
      // viele es insgesamt gibt. Sonst verspricht ein Knopf 16 und zeigt 4.
      zaehlen(bereich, 'filter', k => trifft(k, 'ort', wahlOrt), 'gruppe');
      zaehlen(ortLeiste, 'ort', k => trifft(k, 'gruppe', wahlBereich), 'ort');
    };

    const zaehlen = (leiste, feld, passt, merkmal) => {
      if (!leiste) return;
      leiste.querySelectorAll('button').forEach(b => {
        const wert = b.dataset[feld];
        const n = karten.filter(k => passt(k) && trifft(k, merkmal, wert)).length;
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

    // Die Standortseiten verlinken hierher mit #ort=scharnhorststrasse. Der Wert
    // wird Knopf fuer Knopf verglichen, nicht per Selektor gesucht: „Buero &
    // Verwaltung" traegt zwei Adressen mit Leerzeichen im data-ort.
    const ausHash = () => {
      const wunsch = (location.hash.match(/ort=([\w-]+)/) || [])[1];
      if (!wunsch || !ortLeiste) return;
      const knopf = [...ortLeiste.querySelectorAll('button')]
        .find(b => b.dataset.ort === wunsch);
      if (!knopf) return;
      ortLeiste.querySelectorAll('button')
        .forEach(x => x.setAttribute('aria-pressed', String(x === knopf)));
      wahlOrt = wunsch;
    };
    ausHash();
    addEventListener('hashchange', () => { ausHash(); anwenden(); });
    anwenden();
  }
})();
