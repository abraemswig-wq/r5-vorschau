/* REHAB FIVE — Fünf Säulen
   Kino-Engine nach dem Vorbild von cornrevolution.resn.global:
   Das Dokument scrollt nicht. Wheel/Touch/Tastatur treiben eine virtuelle
   Zeitachse, die Kapitel per Diagonal-Wipe ineinander überführt. */
(() => {
'use strict';

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

const beats = $$('.beat');
const N = beats.length;
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const cinema = !reduced && matchMedia('(min-width: 821px)').matches;

/* ---------------- Preloader ---------------- */

const pre = $('#preloader');
const bar = $('.preloader__bar i');

function preload() {
  /* Pfad aus dem Markup ziehen statt neu zusammenzusetzen: beim Ausliefern
     werden die Asset-Pfade umgeschrieben, ein zweiter hart kodierter Pfad
     liefe dabei still auf 404 — der Preloader zählt Fehler wie Treffer. */
  const srcs = beats.map(b => b.querySelector('.beat__bg').style.backgroundImage.slice(5, -2));
  let done = 0;
  return Promise.all(srcs.map(src => new Promise(res => {
    const i = new Image();
    const tick = () => { done++; bar.style.setProperty('--p', done / srcs.length); res(); };
    i.onload = i.onerror = tick;
    i.src = src;
  })));
}

/* ---------------- Scramble ---------------- */

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜabcdefghijklmnopqrstuvwxyzäöü0123456789▚▞▛▜▙▟◤◣';

/* Die Zeilenbreite ist eingefroren (siehe lockLineWidths). Ein Ersatzglyph, der
   breiter läuft als das Original, schiebt den Text darum aus dem Cream-Block
   heraus — dunkle Schrift landet dann direkt auf dem dunklen Foto. Deshalb wird
   pro Buchstabe nur aus den Glyphen gewählt, die nicht breiter sind.
   Gemessen wird in der Form, die der Browser wirklich zeichnet: die Headline
   steht unter text-transform:uppercase, Kleinbuchstaben-Metrik wäre die falsche
   Grundlage. Die feste Messgröße ist unkritisch, Verhältnisse skalieren mit. */
function glyphFitter(upper) {
  const c = document.createElement('canvas').getContext('2d');
  c.font = '900 100px Barlow, system-ui, sans-serif';
  const shown = ch => upper ? ch.toUpperCase() : ch;
  const pool = [...new Set([...GLYPHS].map(shown))].filter(g => [...g].length === 1);
  const w = new Map(pool.map(g => [g, c.measureText(g).width]));
  const cache = new Map();
  return ch => {
    const target = shown(ch);
    let fits = cache.get(target);
    if (!fits) cache.set(target, fits = pool.filter(g => w.get(g) <= c.measureText(target).width));
    return fits.length ? fits[(Math.random() * fits.length) | 0] : ch;
  };
}
const fitters = new Map();
const rndFor = el => {
  const upper = getComputedStyle(el).textTransform === 'uppercase';
  if (!fitters.has(upper)) fitters.set(upper, glyphFitter(upper));
  return fitters.get(upper);
};

function makeScrambler(el) {
  const full = el.textContent;
  let raf = 0, playing = false;

  return function play() {
    if (playing || reduced) { el.textContent = full; return; }
    playing = true;
    const rnd = rndFor(el);
    const chars = [...full];
    // jeder Buchstabe löst sich links → rechts auf, mit etwas Streuung
    const settle = chars.map((_, i) => i * 26 + Math.random() * 240);
    const total = Math.max(...settle) + 90;
    const t0 = performance.now();

    const step = now => {
      const t = now - t0;
      el.textContent = chars.map((c, i) =>
        c === ' ' ? ' ' : t >= settle[i] ? c : rnd(c)
      ).join('');
      if (t < total) raf = requestAnimationFrame(step);
      else { el.textContent = full; playing = false; }
    };
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(step);
  };
}

/* Zeilenbreite einfrieren, damit das Scrambling kein Reflow-Zittern erzeugt. */
function lockLineWidths() {
  $$('.hl__line').forEach(l => {
    l.style.width = '';
    l.style.width = Math.ceil(l.getBoundingClientRect().width) + 'px';
  });
}

const scramblers = new Map();
beats.forEach((b, i) => {
  const lines = $$('.hl__line', b).map(l => makeScrambler(l));
  const links = $$('[data-scramble-link]', b).map(l => makeScrambler(l));
  scramblers.set(b, [...lines, ...links]);
  b.style.setProperty('--zi', i + 2);
});

/* ---------------- Kapitelmenü ---------------- */

const nav = $('#chapters');
const navList = $('.chapters__list');
const burger = $('#burger');

beats.forEach((b, i) => {
  const li = document.createElement('li');
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.style.setProperty('--d', (i * 38) + 'ms');
  btn.innerHTML = `<span>${i === 0 ? '00' : String(i).padStart(2, '0')}</span>${b.dataset.key}`;
  btn.addEventListener('click', () => { goTo(i); closeNav(); });
  li.append(btn);
  navList.append(li);
});
const navBtns = $$('button', navList);

function openNav()  { nav.dataset.open = 'true';  burger.setAttribute('aria-expanded', 'true');  navBtns[0].focus(); }
function closeNav() { nav.dataset.open = 'false'; burger.setAttribute('aria-expanded', 'false'); burger.focus(); }
burger.addEventListener('click', () => nav.dataset.open === 'true' ? closeNav() : openNav());
addEventListener('keydown', e => { if (e.key === 'Escape' && nav.dataset.open === 'true') closeNav(); });

/* ---------------- Virtuelle Scroll-Achse ---------------- */

const WHEEL_PER_BEAT = 1100;
let target = 0, cur = 0, snapTimer = 0, live = -1;

const ring   = $('.progress__fill');
const label  = $('#progressLabel');
const hint   = $('#hint');
const RING_C = 2 * Math.PI * 19;

function goTo(i) {
  const n = clamp(i, 0, N - 1);
  if (cinema) target = n;
  else beats[n].scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
}

function scheduleSnap() {
  clearTimeout(snapTimer);
  snapTimer = setTimeout(() => { target = Math.round(target); }, 150);
}

function paint() {
  for (let i = 0; i < N; i++) {
    const b = beats[i];
    const d = cur - i;
    const ad = Math.abs(d);

    if (ad > 1.06) { if (b.style.visibility !== 'hidden') b.style.visibility = 'hidden'; continue; }
    if (b.style.visibility) b.style.visibility = '';

    // Diagonaler Wipe: Kante wandert von unterhalb des Viewports nach oben durch.
    const p = clamp(1 + d, 0, 1);
    b.style.setProperty('--wipe', (115 - p * 130).toFixed(2) + '%');

    /* Inhalt: breites Lese-Plateau statt spitzer Kurve.
       Vorher lief die Deckkraft linear von 1 (nur exakt auf dem Kapitel) auf 0.
       Beim durchgehenden Scrollen steht cur fast nie auf einem ganzen Wert — die
       Headline war dadurch die meiste Zeit unsichtbar. Jetzt volle Deckkraft,
       solange das Kapitel das nächstgelegene ist, und ein kurzer harter Wechsel
       an der Grenze. Weil ad(i) + ad(i+1) = 1 gilt, kommt immer nur eines der
       beiden Kapitel unter ad = .5 — es können nie zwei Headlines übereinander
       stehen. */
    b.style.setProperty('--o', clamp((.5 - ad) / .12, 0, 1).toFixed(3));
    b.style.setProperty('--ty', (d * -46).toFixed(1) + 'px');

    // Parallax der Bildebene
    const bg = b.firstElementChild.firstElementChild;
    bg.style.transform = `translate3d(0,${(d * -7).toFixed(2)}%,0)`;
  }

  // Chrome
  const prog = N > 1 ? cur / (N - 1) : 0;
  ring.style.strokeDashoffset = (RING_C * (1 - prog)).toFixed(2);
  const near = Math.round(cur);
  label.textContent = beats[near].dataset.key;
  hint.dataset.off = cur > .12 ? 'true' : 'false';
  navBtns.forEach((b, i) => b.setAttribute('aria-current', i === near ? 'true' : 'false'));

  /* Kapitelwechsel → Scramble + Fokus-/Screenreader-Sichtbarkeit.
     Kein Abstands-Schwellwert mehr: `near` ist per Definition höchstens .5 entfernt,
     die alte Schranke von .42 hat den Reveal nur verzögert. Er startet jetzt in dem
     Moment, in dem das Kapitel das nächstgelegene wird, und hat damit den ganzen
     Anlauf Zeit, die Cream-Blöcke aufzuziehen. */
  if (near !== live) {
    live = near;
    beats.forEach((b, i) => {
      const on = i === near;
      b.dataset.live = on ? 'true' : 'false';
      /* Einmal aufgezogen, bleibt aufgezogen: sonst klappen die Cream-Blöcke beim
         Weiterscrollen wieder zu und die Headline verschwindet mitten im Lesen.
         Das Aus- und Einblenden übernimmt allein --o. */
      if (on) b.dataset.seen = 'true';
      b.toggleAttribute('inert', !on);
      b.setAttribute('aria-hidden', on ? 'false' : 'true');
      $$('.hl__line', b).forEach((l, k) => l.style.setProperty('--hd', (k * 70) + 'ms'));
      if (on) scramblers.get(b).forEach((play, k) => setTimeout(play, 120 + k * 90));
    });
  }
}

function loop() {
  const diff = target - cur;
  if (Math.abs(diff) > .0004) cur += diff * .09;
  else cur = target;
  paint();
  requestAnimationFrame(loop);
}

/* ---------------- Eingaben ---------------- */

function bindCinema() {
  addEventListener('wheel', e => {
    e.preventDefault();
    target = clamp(target + e.deltaY / WHEEL_PER_BEAT, 0, N - 1);
    scheduleSnap();
  }, { passive: false });

  let ty = 0;
  addEventListener('touchstart', e => { ty = e.touches[0].clientY; }, { passive: true });
  addEventListener('touchmove', e => {
    const y = e.touches[0].clientY;
    target = clamp(target + (ty - y) / (innerHeight * .55), 0, N - 1);
    ty = y;
    scheduleSnap();
  }, { passive: true });

  addEventListener('keydown', e => {
    if (nav.dataset.open === 'true') return;
    const k = e.key;
    if (k === 'ArrowDown' || k === 'PageDown' || k === ' ') { e.preventDefault(); goTo(Math.round(cur) + 1); }
    else if (k === 'ArrowUp' || k === 'PageUp')             { e.preventDefault(); goTo(Math.round(cur) - 1); }
    else if (k === 'Home')                                   { e.preventDefault(); goTo(0); }
    else if (k === 'End')                                    { e.preventDefault(); goTo(N - 1); }
  });

  addEventListener('resize', lockLineWidths);
}

/* Flow-Modus: normales Scrollen, Scramble per IntersectionObserver. */
function bindFlow() {
  $('.progress').remove();
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.dataset.live = 'true';
    scramblers.get(e.target).forEach((play, k) => setTimeout(play, 120 + k * 90));
    io.unobserve(e.target);
  }), { threshold: .35 });
  beats.forEach(b => io.observe(b));
  addEventListener('scroll', () => { hint.dataset.off = scrollY > 60 ? 'true' : 'false'; }, { passive: true });
}

/* ---------------- Hintergrundvideo ---------------- */

/* Die Quelle steht als data-video im Markup und wird erst hier gesetzt. Stünde
   sie als src im HTML, lüde jedes Handy die 1,8 MB mit — sichtbar wäre das Video
   dort nie, weil unterhalb von 821px und bei reduzierter Bewegung das Standbild
   stehen bleibt. Eingeblendet wird erst nach dem ersten gezeigten Frame: ein
   sofort sichtbares <video> zeigt sonst kurz ein leeres Rechteck. */
function bindVideo() {
  beats.forEach(b => {
    const bg = b.querySelector('.beat__bg');
    const src = bg?.dataset.video;
    if (!src) return;

    const v = document.createElement('video');
    Object.assign(v, { muted: true, loop: true, autoplay: true, playsInline: true, preload: 'auto' });
    v.className = 'beat__video';
    v.setAttribute('aria-hidden', 'true');
    v.addEventListener('playing', () => { v.dataset.laeuft = 'true'; }, { once: true });
    v.src = src;
    bg.appendChild(v);

    /* Safari/iOS lehnt play() ohne Geste gelegentlich trotzdem ab. Dann bleibt es
       beim Standbild — kein Grund, den Seitenstart scheitern zu lassen. */
    v.play().catch(() => {});
  });
}

/* ---------------- Start ---------------- */

(async () => {
  if (document.fonts) { try { await document.fonts.ready; } catch (_) {} }
  await preload();

  lockLineWidths();

  if (cinema) {
    root.classList.add('cinema');
    lockLineWidths();
    bindCinema();
    bindVideo();
    requestAnimationFrame(loop);
  } else {
    bindFlow();
  }

  pre.dataset.contract = 'true';
  setTimeout(() => { pre.dataset.done = 'true'; }, 780);
})();

})();
