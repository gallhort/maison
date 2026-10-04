/* ==========================================================================
   Maison Orée — Interactions (Vanilla JS, sans dépendance hors icônes Lucide)
   Chaque module s'active uniquement si ses éléments sont présents.
   ========================================================================== */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = (n) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

  /* ---------- Icônes ---------- */
  const icons = () => window.lucide && window.lucide.createIcons({ attrs: { 'stroke-width': 1.5 } });
  icons();

  /* ---------- Toast ---------- */
  const toastEl = $('#toast');
  let toastT;
  function toast(msg) {
    if (!toastEl) return;
    $('[data-toast-msg]', toastEl).textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('is-visible'), 3600);
  }
  window.oreeToast = toast;

  /* ---------- Favoris (partagés entre toutes les pages, localStorage) ---------- */
  const FAV_KEY = 'mo_favs';
  const getFavs = () => { try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')); } catch (e) { return new Set(); } };
  const saveFavs = (set) => { try { localStorage.setItem(FAV_KEY, JSON.stringify([...set])); } catch (e) {} };
  function updateFavBadge() {
    const n = getFavs().size;
    $$('[data-fav-badge]').forEach((el) => { el.textContent = n; el.hidden = !n; });
  }
  window.oreeFavs = { get: getFavs, save: saveFavs, refresh: updateFavBadge };

  /* ---------- Transitions de page (rideau) ---------- */
  const curtain = document.createElement('div');
  curtain.className = 'curtain'; curtain.setAttribute('aria-hidden', 'true');
  curtain.innerHTML = '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><path d="M11 32V18a9 9 0 0 1 18 0v14"/><path d="M5 32h30"/><path d="M15 32a5 5 0 0 1 10 0"/></svg>';
  document.body.appendChild(curtain);
  requestAnimationFrame(() => document.documentElement.classList.add('is-loaded'));
  function go(url) {
    if (reduced) { location.href = url; return; }
    curtain.classList.add('is-leaving');
    setTimeout(() => { location.href = url; }, 620);
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const href = a.getAttribute('href');
    if (!/^[\w-]+\.html(\?.*)?$/.test(href)) return;
    const cur = location.pathname.split('/').pop() || 'index.html';
    if (href.split('?')[0] === cur && !href.includes('?')) return;
    e.preventDefault(); go(href);
  });
  window.addEventListener('pageshow', (e) => { if (e.persisted) curtain.classList.remove('is-leaving'); });

  /* ---------- Header flottant ---------- */
  const header = $('#siteHeader');
  if (header) {
    let last = 0;
    const onScroll = () => {
      const y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 40);
      header.classList.toggle('is-hidden', y > 600 && y > last + 4);
      if (y < last - 4) header.classList.remove('is-hidden');
      last = y;
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Périmètre de démonstration (popover header) ---------- */
  const demoBtn = $('[data-demo-toggle]');
  const demoPop = $('[data-demo-pop]');
  if (demoBtn && demoPop) {
    const closeDemo = () => { demoPop.classList.add('hidden'); demoPop.classList.remove('flex'); demoBtn.setAttribute('aria-expanded', 'false'); };
    const toggleDemo = () => {
      const open = demoPop.classList.contains('hidden');
      demoPop.classList.toggle('hidden', !open);
      demoPop.classList.toggle('flex', open);
      demoBtn.setAttribute('aria-expanded', String(open));
    };
    demoBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleDemo(); });
    document.addEventListener('click', (e) => { if (!e.target.closest('[data-demo-pop],[data-demo-toggle]')) closeDemo(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDemo(); });
    demoPop.addEventListener('click', (e) => { if (e.target.closest('[data-pkg]')) closeDemo(); });
  }

  /* ---------- Menu mobile ---------- */
  const menu = $('#mobileMenu');
  $$('[data-menu-toggle]').forEach((b) => b.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    document.body.style.overflow = open ? 'hidden' : '';
    $$('[data-menu-toggle]').forEach((x) => x.setAttribute('aria-expanded', String(open)));
  }));

  /* ---------- Révélations ---------- */
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { threshold: 0, rootMargin: '0px 0px 20% 0px' });
  $$('.reveal, .reveal-img').forEach((el) => io.observe(el));

  /* ---------- Compteurs ---------- */
  const countIO = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target; countIO.unobserve(el);
    const end = parseFloat(el.dataset.count); const dec = +(el.dataset.decimals || 0);
    const t0 = performance.now(); const dur = reduced ? 1 : 1800;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur); const v = end * (1 - Math.pow(1 - p, 4));
      el.textContent = v.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }), { threshold: 0.6 });
  $$('[data-count]').forEach((el) => countIO.observe(el));

  /* ---------- Hero 4 ambiances : Aube / Jour / Soir / Nuit ----------
     Automatique selon l'heure locale du visiteur, avec reprise manuelle
     via l'interrupteur et bouton « Auto » pour revenir à l'heure réelle. */
  const hero = $('[data-daynight]');
  if (hero) {
    const PHASES = ['dawn', 'day', 'dusk', 'night'];
    const LABELS = { dawn: 'Aube', day: 'Plein jour', dusk: 'Début de soirée', night: 'Nocturne' };
    // Plages horaires (heure locale) : aube 5 h–9 h, jour 9 h–17 h 30, soirée 17 h 30–21 h, nuit 21 h–5 h
    const phaseAt = (d = new Date()) => {
      const m = d.getHours() * 60 + d.getMinutes();
      if (m >= 300 && m < 540) return 'dawn';
      if (m >= 540 && m < 1050) return 'day';
      if (m >= 1050 && m < 1260) return 'dusk';
      return 'night';
    };
    const toggle = $('.daynight', hero);
    const layers = Object.fromEntries($$('[data-phase-layer]', hero).map((l) => [l.dataset.phaseLayer, l]));
    const label = $('[data-phase-label]', hero);
    let current = null, manual = false, busy;
    const setOrigin = (btn) => {
      const h = hero.getBoundingClientRect(); const t = (btn || toggle).getBoundingClientRect();
      hero.style.setProperty('--cx', `${t.left + t.width / 2 - h.left}px`);
      hero.style.setProperty('--cy', `${t.top + t.height / 2 - h.top}px`);
    };
    // Les couches sont chargées à la demande : l'ambiance active d'abord, les autres une fois la page chargée.
    const loadLayer = (l) => { if (l && l.dataset.src && !l.getAttribute('src')) { if (l.dataset.srcset) l.srcset = l.dataset.srcset; l.src = l.dataset.src; } };
    const setPhase = (next, btn, instant = false) => {
      if (next === current) return;
      loadLayer(layers[next]);
      const prev = current; current = next;
      hero.dataset.phase = next;
      toggle.style.setProperty('--pi', PHASES.indexOf(next));
      $$('[data-dn]', hero).forEach((b) => b.setAttribute('aria-checked', String(b.dataset.dn === next)));
      label.style.opacity = 0; setTimeout(() => { label.textContent = LABELS[next]; label.style.opacity = 1; }, 250);
      clearTimeout(busy);
      Object.values(layers).forEach((l) => l.classList.remove('is-base', 'is-top', 'is-reveal'));
      if (!prev || instant || reduced) { layers[next].classList.add('is-base'); return; }
      setOrigin(btn);
      layers[prev].classList.add('is-base');
      const top = layers[next];
      top.classList.add('is-top');
      top.getBoundingClientRect(); // force le point de départ du cercle
      top.classList.add('is-reveal');
      busy = setTimeout(() => { layers[prev].classList.remove('is-base'); top.classList.remove('is-top', 'is-reveal'); top.classList.add('is-base'); }, 1650);
    };
    $$('[data-dn]', hero).forEach((b) => b.addEventListener('click', () => {
      manual = b.dataset.dn !== phaseAt(); hero.classList.toggle('is-manual', manual);
      setPhase(b.dataset.dn, b);
    }));
    // Navigation clavier (flèches) dans le groupe radio
    toggle.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      const i = (PHASES.indexOf(current) + (e.key === 'ArrowRight' ? 1 : 3)) % 4;
      const b = $(`[data-dn="${PHASES[i]}"]`, hero); b.focus(); b.click();
    });
    $('[data-dn-auto]', hero)?.addEventListener('click', () => { manual = false; hero.classList.remove('is-manual'); setPhase(phaseAt(), $(`[data-dn="${phaseAt()}"]`, hero)); });
    addEventListener('resize', () => setOrigin());
    setPhase(phaseAt(), null, true);
    addEventListener('load', () => setTimeout(() => Object.values(layers).forEach(loadLayer), 1200), { once: true });
    const clock = $('[data-hero-clock]');
    const tick = () => {
      if (clock) clock.textContent = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      if (!manual) setPhase(phaseAt(), $(`[data-dn="${phaseAt()}"]`, hero)); // bascule en direct au changement d'heure
    };
    tick(); setInterval(tick, 30000);
  }

  /* ---------- Barre de recherche (pilules) ---------- */
  const segs = $$('.search-seg');
  const closeAll = (except) => segs.forEach((s) => { if (s !== except) { s.classList.remove('is-open'); $('.search-trigger', s).setAttribute('aria-expanded', 'false'); } });
  segs.forEach((seg) => {
    const trig = $('.search-trigger', seg);
    trig.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = !seg.classList.contains('is-open');
      closeAll(seg); seg.classList.toggle('is-open', open); trig.setAttribute('aria-expanded', String(open));
    });
    $$('[data-value]', seg).forEach((opt) => opt.addEventListener('click', (e) => {
      e.stopPropagation();
      $$('[data-value]', seg).forEach((o) => o.setAttribute('aria-pressed', 'false'));
      opt.setAttribute('aria-pressed', 'true');
      $('[data-display]', seg).textContent = opt.dataset.value;
      seg.dataset.selected = opt.dataset.value;
      setTimeout(() => closeAll(), 180);
    }));
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.search-seg')) closeAll(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });
  const searchForm = $('[data-search]');
  if (searchForm) searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const n = segs.filter((s) => s.dataset.selected).length;
    const count = Math.max(4, 248 - n * 57 + (n ? 3 : 0));
    const q = new URLSearchParams();
    segs.forEach((sg) => { if (sg.dataset.selected && sg.dataset.key) q.set(sg.dataset.key, sg.dataset.selected); });
    toast(n ? `${count} demeures correspondent à votre recherche` : 'Toute la sélection Maison Orée');
    setTimeout(() => go(`acheter.html${q.toString() ? '?' + q : ''}`), 650);
  });

  /* ---------- Favoris ---------- */
  $$('[data-fav]').forEach((b) => {
    const id = b.dataset.fav;
    if (id && getFavs().has(id)) { b.setAttribute('aria-pressed', 'true'); const svg = $('svg', b); if (svg) svg.style.fill = 'currentColor'; }
    b.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      const on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', String(on));
      const svg = $('svg', b); if (svg) svg.style.fill = on ? 'currentColor' : 'none';
      if (id) { const favs = getFavs(); on ? favs.add(id) : favs.delete(id); saveFavs(favs); updateFavBadge(); }
      toast(on ? 'Ajouté à votre sélection privée' : 'Retiré de votre sélection');
    });
  });
  updateFavBadge();

  /* ---------- Cartes Éléments (tactile) ---------- */
  $$('.element-card').forEach((c) => c.addEventListener('click', () => {
    const open = !c.classList.contains('is-open');
    $$('.element-card').forEach((x) => x.classList.remove('is-open'));
    c.classList.toggle('is-open', open);
  }));

  /* ---------- Texte extensible ---------- */
  $$('[data-expand]').forEach((b) => b.addEventListener('click', () => {
    const t = document.getElementById(b.dataset.expand);
    const open = t.classList.toggle('clamp-text') === false;
    b.querySelector('span').textContent = open ? 'Réduire' : 'Lire la suite';
    b.setAttribute('aria-expanded', String(open));
  }));

  /* ---------- Prise de rendez-vous (carte agent) ---------- */
  const booking = $('[data-booking]');
  if (booking) {
    const daysWrap = $('[data-days]', booking); const slotsWrap = $('[data-slots]', booking);
    const cta = $('[data-book-cta]', booking); const done = $('[data-book-done]', booking);
    const form = $('[data-book-form]', booking);
    let day = null; let slot = null; let mode = 'Sur place';
    const d0 = new Date(); const days = [];
    for (let i = 1; days.length < 8; i++) { const d = new Date(d0); d.setDate(d0.getDate() + i); if (d.getDay() !== 0) days.push(d); }
    daysWrap.innerHTML = days.map((d, i) => `
      <button type="button" class="day-btn flex w-[62px] shrink-0 flex-col items-center gap-1 rounded-2xl border border-moka/10 py-3 transition hover:border-moka/40" data-i="${i}" aria-pressed="false">
        <span class="text-[11px] uppercase tracking-wider opacity-60">${d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}</span>
        <span class="font-serif text-2xl leading-none">${d.getDate()}</span>
        <span class="text-[11px] opacity-60">${d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}</span>
      </button>`).join('');
    const SLOTS = ['09:30', '11:00', '12:30', '14:30', '16:00', '17:30'];
    const renderSlots = (i) => {
      slotsWrap.innerHTML = SLOTS.map((s, k) => {
        const busy = (i * 7 + k * 3) % 5 === 0;
        return `<button type="button" class="slot-btn rounded-full border border-moka/10 py-2.5 text-sm transition hover:border-moka/40" data-s="${s}" aria-pressed="false" ${busy ? 'disabled' : ''}>${s}</button>`;
      }).join('');
      $$('.slot-btn', slotsWrap).forEach((b) => b.addEventListener('click', () => {
        $$('.slot-btn', slotsWrap).forEach((x) => x.setAttribute('aria-pressed', 'false'));
        b.setAttribute('aria-pressed', 'true'); slot = b.dataset.s; sync();
      }));
    };
    const sync = () => {
      cta.disabled = !(day !== null && slot);
      cta.querySelector('span').textContent = cta.disabled ? 'Choisissez un créneau' : `Confirmer · ${days[day].toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à ${slot}`;
    };
    $$('.day-btn', daysWrap).forEach((b) => b.addEventListener('click', () => {
      $$('.day-btn', daysWrap).forEach((x) => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true'); day = +b.dataset.i; slot = null; renderSlots(day); sync();
    }));
    $$('[data-mode]', booking).forEach((b) => b.addEventListener('click', () => {
      $$('[data-mode]', booking).forEach((x) => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true'); mode = b.dataset.mode;
    }));
    renderSlots(0); sync();
    cta.addEventListener('click', () => {
      if (cta.disabled) return;
      $('[data-done-text]', done).textContent = `${mode} · ${days[day].toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à ${slot}`;
      form.hidden = true; done.hidden = false; icons();
    });
    $('[data-book-reset]', booking)?.addEventListener('click', () => { form.hidden = false; done.hidden = true; });
  }

  /* ---------- Simulateur de financement ---------- */
  const loan = $('[data-loan]');
  if (loan) {
    const price = +loan.dataset.price;
    const r = { apport: $('[name="apport"]', loan), duree: $('[name="duree"]', loan), taux: $('[name="taux"]', loan) };
    const out = (k) => $(`[data-out="${k}"]`, loan);
    const calc = () => {
      Object.values(r).forEach((el) => el.style.setProperty('--p', `${((el.value - el.min) / (el.max - el.min)) * 100}%`));
      const apport = price * (r.apport.value / 100); const capital = price - apport;
      const n = r.duree.value * 12; const t = r.taux.value / 100 / 12;
      const m = t ? (capital * t) / (1 - Math.pow(1 + t, -n)) : capital / n;
      out('apport').textContent = `${r.apport.value} % · ${fmt(apport)} €`;
      out('duree').textContent = `${r.duree.value} ans`;
      out('taux').textContent = `${(+r.taux.value).toFixed(2).replace('.', ',')} %`;
      out('mensualite').textContent = fmt(m);
      out('capital').textContent = `${fmt(capital)} €`;
    };
    Object.values(r).forEach((el) => el.addEventListener('input', calc));
    calc();
  }

  /* ---------- Galerie Prestige (split-screen) ---------- */
  const slides = $$('[data-slide]');
  if (slides.length) {
    const counter = $('[data-counter]'); const chapter = $('[data-chapter]'); const bar = $('[data-progress]');
    const dots = $$('.dot-nav a');
    const sio = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const i = slides.indexOf(e.target);
      e.target.classList.add('is-in');
      if (counter) counter.textContent = String(i + 1).padStart(2, '0');
      if (chapter) { chapter.style.opacity = 0; setTimeout(() => { chapter.textContent = e.target.dataset.slide; chapter.style.opacity = 1; }, 250); }
      if (bar) bar.style.transform = `scaleY(${(i + 1) / slides.length})`;
      dots.forEach((d, k) => d.classList.toggle('is-active', k === i));
    }), { threshold: 0.55 });
    slides.forEach((s) => sio.observe(s));
  }

  /* ---------- Catalogue (acheter.html) ---------- */
  const results = $('[data-results]');
  if (results) {
    const DATA = [
      { id: 'palmiers', title: 'Villa Les <em>Palmiers</em>', place: 'Cap d’Antibes', region: 'Côte d’Azur', type: 'Villa', price: 2.85, rooms: 9, beds: 6, surface: 520, img: 'villa-1', href: 'bien-prestige.html', tags: ['Piscine', 'Vue mer', 'Jardin', 'Feng Shui'], label: 'Collection Privée', order: 0 },
      { id: 'haussmann', title: 'Villa <em>Belharra</em>', place: 'Biarritz · Côte Basque', region: 'Côte Basque', type: 'Villa', price: 1.68, rooms: 6, beds: 4, surface: 240, img: 'biarritz-hero-day', href: 'bien-standard.html', tags: ['Vue mer'], label: 'Sous offre', order: 1 },
      { id: 'cypres', title: 'Bastide des <em>Cyprès</em>', place: 'Le Tholonet · Pays d’Aix', region: 'Provence', type: 'Bastide', price: 2.12, rooms: 8, beds: 5, surface: 430, img: 'prop-luberon', href: 'bien-standard.html', tags: ['Jardin', 'Feng Shui'], order: 2 },
      { id: 'verre', title: 'Maison de <em>Verre</em>', place: 'Puyricard · Pays d’Aix', region: 'Provence', type: 'Villa', price: 6.5, perMonth: true, rooms: 6, beds: 4, surface: 310, img: 'prop-tropez', href: 'bien-standard.html', tags: ['Jardin'], label: 'Location', order: 3 },
      { id: 'croisette', title: 'Rooftop <em>La Croisette</em>', place: 'Cannes · La Californie', region: 'Côte d’Azur', type: 'Appartement', price: 4.8, perMonth: true, rooms: 5, beds: 3, surface: 185, img: 'standard-3', href: 'bien-standard.html', tags: ['Vue mer'], label: 'Location', order: 4 },
      { id: 'notredame', title: 'Duplex <em>Notre-Dame</em>', place: 'Èze', region: 'Côte d’Azur', type: 'Appartement', price: 0.96, rooms: 6, beds: 4, surface: 210, img: 'prop-marais', href: 'bien-standard.html', tags: [], order: 5 },
      { id: 'golf', title: 'Appartement <em>Golf</em>', place: 'Aix-en-Provence', region: 'Provence', type: 'Appartement', price: 0.74, rooms: 5, beds: 3, surface: 165, img: 'prop-luberon', href: 'bien-standard.html', tags: [], order: 6 },
      { id: 'vieuxnice', title: 'Loft <em>Vieux-Nice</em>', place: 'Nice · Carré d’Or', region: 'Côte d’Azur', type: 'Appartement', price: 3.2, perMonth: true, rooms: 4, beds: 2, surface: 140, img: 'prop-marais', href: 'bien-standard.html', tags: [], label: 'Location', order: 7 },
      { id: 'boisdespins', title: 'Villa Bois des <em>Pins</em>', place: 'Grasse', region: 'Provence', type: 'Villa', price: 1.48, rooms: 8, beds: 5, surface: 380, img: 'standard-2', href: 'bien-standard.html', tags: ['Jardin'], order: 8 },
      { id: 'palaisjustice', title: 'Pied-à-terre <em>historique</em>', place: 'Centre historique · Aix-en-Provence', region: 'Provence', type: 'Appartement', price: 0.28, rooms: 2, beds: 1, surface: 42, img: 'prop-marais', href: 'bien-pied-a-terre.html', tags: [], order: 9 },
      { id: 'quartierarts', title: 'Appartement de <em>charme</em>', place: 'Quartier des Arts · Nice', region: 'Côte d’Azur', type: 'Appartement', price: 0.45, rooms: 3, beds: 2, surface: 68, img: 'standard-3', href: 'bien-pied-a-terre.html', tags: ['Vue mer'], order: 10 },
    ];
    const st = { type: '', region: '', budget: 20, rooms: 0, tags: new Set(), sort: 'recent', view: 'grid', favorisOnly: false };
    const favs = getFavs();
    const price = (p) => `${fmt(p.price * (p.perMonth ? 1e3 : 1e6))} €${p.perMonth ? '/mois' : ''}`;

    // Paramètres venant de la recherche d'accueil
    const params = new URLSearchParams(location.search);
    if (params.get('favoris')) st.favorisOnly = true;
    const regionOf = { 'Cap d’Antibes': 'Côte d’Azur', 'Nice': 'Côte d’Azur', 'Cannes': 'Côte d’Azur', 'Aix-en-Provence': 'Provence', 'Le Tholonet': 'Provence', 'Grasse': 'Provence' };
    if (params.get('ville')) st.region = regionOf[params.get('ville')] || '';
    if (params.get('type')) st.type = params.get('type') === 'Penthouse' ? 'Appartement' : params.get('type');
    const pmax = { '1 – 3 M€': 3, '3 – 6 M€': 6, '6 – 12 M€': 12 }[params.get('prix')];
    if (pmax) st.budget = pmax;
    const pr = parseInt(params.get('pieces') || '0', 10); if (pr) st.rooms = pr >= 10 ? 10 : pr >= 7 ? 7 : pr >= 5 ? 5 : 0;

    const card = (p, i) => `
      <article class="cat-card group" style="--i:${i}">
        <a href="${p.href}" class="cat-media card block" aria-label="${p.title.replace(/<[^>]+>/g, '')}">
          <img src="assets/img/${p.img}.webp" alt="" class="card-media" loading="lazy" />
          <div class="card-scrim opacity-60"></div>
          <div class="absolute inset-x-4 top-4 flex items-start justify-between">
            ${p.label ? `<span class="pill-glass">${p.label === 'Collection Privée' ? '<i data-lucide="sparkles" class="h-3.5 w-3.5"></i> ' : ''}${p.label}</span>` : '<span></span>'}
          </div>
          <span class="price-badge absolute bottom-4 left-4">${price(p)}</span>
        </a>
        <button type="button" class="cat-fav" data-cat-fav="${p.id}" aria-pressed="${favs.has(p.id)}" aria-label="Ajouter aux favoris"><i data-lucide="heart" class="h-4 w-4"></i></button>
        <div class="cat-body">
          <p class="eyebrow text-moka/45">${p.place}</p>
          <h3 class="mt-2 font-serif text-[1.9rem] leading-tight"><a href="${p.href}" class="hover:opacity-70">${p.title}</a></h3>
          <ul class="mt-4 flex flex-wrap gap-1.5 text-[12.5px] text-moka/70">
            <li class="pill-soft !px-3 !py-1.5"><i data-lucide="layout-panel-left" class="h-3.5 w-3.5"></i>${p.rooms} pièces</li>
            <li class="pill-soft !px-3 !py-1.5"><i data-lucide="bed-double" class="h-3.5 w-3.5"></i>${p.beds} ch.</li>
            <li class="pill-soft !px-3 !py-1.5"><i data-lucide="ruler" class="h-3.5 w-3.5"></i>${fmt(p.surface)} m²</li>
            ${p.tags.includes('Feng Shui') ? '<li class="pill !px-3 !py-1.5 bg-sage/15 text-sage-700"><i data-lucide="leaf" class="h-3.5 w-3.5"></i>Feng Shui</li>' : ''}
          </ul>
          <a href="${p.href}" class="cat-more-link mt-5 inline-flex items-center gap-2 text-sm font-medium">Découvrir la demeure <i data-lucide="arrow-right" class="i i-go h-4 w-4"></i></a>
        </div>
      </article>`;

    const countEl = $('[data-cat-count]'), labelEl = $('[data-count-label]'), activeEl = $('[data-active-filters]'), emptyEl = $('[data-empty]'), moreCount = $('[data-more-count]');
    function render() {
      let list = DATA.filter((p) => (!st.favorisOnly || favs.has(p.id)) && (!st.type || p.type === st.type) && (!st.region || p.region === st.region) && (st.budget >= 20 || p.price <= st.budget) && p.rooms >= st.rooms && [...st.tags].every((t) => p.tags.includes(t)));
      const sorters = { recent: (a, b) => a.order - b.order, 'price-desc': (a, b) => b.price - a.price, 'price-asc': (a, b) => a.price - b.price, surface: (a, b) => b.surface - a.surface };
      list.sort(sorters[st.sort]);
      results.innerHTML = list.map(card).join('');
      results.dataset.viewMode = st.view;
      countEl.textContent = list.length;
      labelEl.textContent = list.length > 1 ? 'demeures' : 'demeure';
      const act = [st.type, st.region, st.budget < 20 ? `≤ ${String(st.budget).replace('.', ',')} M€` : '', st.rooms ? `${st.rooms}+ pièces` : '', ...st.tags].filter(Boolean);
      activeEl.textContent = act.length ? '· ' + act.join(' · ') : '';
      const adv = (st.budget < 20) + (st.rooms > 0) + st.tags.size;
      moreCount.textContent = adv; moreCount.hidden = !adv;
      emptyEl.classList.toggle('hidden', list.length > 0);
      results.classList.toggle('hidden', !list.length);
      icons();
      requestAnimationFrame(() => results.querySelectorAll('.cat-card').forEach((c) => c.classList.add('is-in')));
    }
    function syncUI() {
      $$('[data-type]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.type === st.type)));
      $('[data-filter-region]').value = st.region;
      const r = $('[data-filter-budget]'); r.value = st.budget; r.dispatchEvent(new Event('input'));
      $$('[data-rooms]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.rooms === st.rooms)));
      $$('[data-tag]').forEach((b) => b.setAttribute('aria-pressed', String(st.tags.has(b.dataset.tag))));
    }
    $$('[data-type]').forEach((b) => b.addEventListener('click', () => { st.type = b.dataset.type; syncUI(); render(); }));
    $('[data-filter-region]').addEventListener('change', (e) => { st.region = e.target.value; render(); });
    const bud = $('[data-filter-budget]'), budOut = $('[data-budget-out]');
    bud.addEventListener('input', () => {
      st.budget = +bud.value;
      bud.style.setProperty('--p', `${((bud.value - bud.min) / (bud.max - bud.min)) * 100}%`);
      budOut.textContent = st.budget >= 20 ? 'Sans limite' : `${String(st.budget).replace('.', ',')} M€`;
    });
    bud.addEventListener('change', render);
    $$('[data-rooms]').forEach((b) => b.addEventListener('click', () => { st.rooms = +b.dataset.rooms; syncUI(); render(); }));
    $$('[data-tag]').forEach((b) => b.addEventListener('click', () => { st.tags.has(b.dataset.tag) ? st.tags.delete(b.dataset.tag) : st.tags.add(b.dataset.tag); syncUI(); render(); }));
    $('[data-sort]').addEventListener('change', (e) => { st.sort = e.target.value; render(); });
    $$('[data-view]').forEach((b) => b.addEventListener('click', () => { st.view = b.dataset.view; $$('[data-view]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); render(); }));
    const moreBtn = $('[data-toggle-more]'), more = $('[data-more]');
    moreBtn.addEventListener('click', () => { const o = !more.classList.contains('is-open'); more.classList.toggle('is-open', o); moreBtn.setAttribute('aria-expanded', String(o)); });
    $('[data-reset]').addEventListener('click', () => { Object.assign(st, { type: '', region: '', budget: 20, rooms: 0 }); st.tags.clear(); syncUI(); render(); });
    results.addEventListener('click', (e) => {
      const b = e.target.closest('[data-cat-fav]'); if (!b) return;
      const id = b.dataset.catFav, on = !favs.has(id);
      on ? favs.add(id) : favs.delete(id);
      saveFavs(favs);
      updateFavBadge();
      b.setAttribute('aria-pressed', String(on));
      if (st.favorisOnly && !on) render();
      toast(on ? 'Ajouté à votre sélection privée' : 'Retiré de votre sélection');
    });
    syncUI(); render();
    if ([...params.keys()].length) toast(`${countEl.textContent} ${labelEl.textContent} pour votre recherche`);
  }

  /* ---------- Visionneuse photo (lightbox) ---------- */
  const lbItems = $$('[data-lb]');
  if (lbItems.length) {
    const lb = document.createElement('div');
    lb.className = 'lightbox'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Galerie photo');
    lb.innerHTML = `
      <div class="lb-top"><span class="font-serif text-2xl italic" data-lb-cap></span><span class="text-sm tabular-nums text-ivoire/60" data-lb-count></span>
        <button type="button" class="lb-btn" data-lb-close aria-label="Fermer"><i data-lucide="x" class="h-5 w-5"></i></button></div>
      <div class="lb-stage"><img alt="" data-lb-img /></div>
      <button type="button" class="lb-btn lb-prev" data-lb-prev aria-label="Photo précédente"><i data-lucide="arrow-left" class="h-5 w-5"></i></button>
      <button type="button" class="lb-btn lb-next" data-lb-next aria-label="Photo suivante"><i data-lucide="arrow-right" class="h-5 w-5"></i></button>
      <div class="lb-thumbs" data-lb-thumbs></div>`;
    document.body.appendChild(lb);
    const imgs = lbItems.map((el) => ({ src: el.dataset.lbSrc || $('img', el)?.getAttribute('src'), cap: el.dataset.lb || $('img', el)?.alt || '' }));
    $('[data-lb-thumbs]', lb).innerHTML = imgs.map((m, i) => `<button type="button" data-lb-go="${i}" aria-label="Photo ${i + 1}"><img src="${m.src}" alt="" /></button>`).join('');
    let cur = 0, lastFocus;
    const show = (i) => {
      cur = (i + imgs.length) % imgs.length;
      const im = $('[data-lb-img]', lb);
      im.classList.remove('is-in'); 
      setTimeout(() => { im.src = imgs[cur].src; im.alt = imgs[cur].cap; requestAnimationFrame(() => im.classList.add('is-in')); }, reduced ? 0 : 180);
      $('[data-lb-cap]', lb).textContent = imgs[cur].cap;
      $('[data-lb-count]', lb).textContent = `${String(cur + 1).padStart(2, '0')} / ${String(imgs.length).padStart(2, '0')}`;
      $$('[data-lb-go]', lb).forEach((t, k) => t.classList.toggle('is-active', k === cur));
    };
    const open = (i) => { lastFocus = document.activeElement; show(i); lb.classList.add('is-open'); document.documentElement.style.overflow = 'hidden'; icons(); $('[data-lb-close]', lb).focus(); };
    const close = () => { lb.classList.remove('is-open'); document.documentElement.style.overflow = ''; lastFocus?.focus(); };
    lbItems.forEach((el, i) => { el.style.cursor = 'zoom-in'; el.addEventListener('click', (e) => { if (e.target.closest('a,[data-fav],button')) return; open(i); }); });
    $$('[data-lb-open]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); open(0); }));
    $('[data-lb-close]', lb).addEventListener('click', close);
    $('[data-lb-prev]', lb).addEventListener('click', () => show(cur - 1));
    $('[data-lb-next]', lb).addEventListener('click', () => show(cur + 1));
    $('[data-lb-thumbs]', lb).addEventListener('click', (e) => { const t = e.target.closest('[data-lb-go]'); if (t) show(+t.dataset.lbGo); });
    lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('lb-stage')) close(); });
    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') show(cur + 1); if (e.key === 'ArrowLeft') show(cur - 1);
    });
    let tx = 0; lb.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', (e) => { const d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 50) show(cur + (d < 0 ? 1 : -1)); });
  }

  /* ---------- Vidéo du bien (modale) ---------- */
  const videoBtns = $$('[data-video-open]');
  if (videoBtns.length) {
    const vb = document.createElement('div');
    vb.className = 'lightbox'; vb.setAttribute('role', 'dialog'); vb.setAttribute('aria-modal', 'true'); vb.setAttribute('aria-label', 'Vidéo du bien');
    vb.innerHTML = `
      <div class="lb-top"><span class="font-serif text-2xl italic">Film du bien</span>
        <button type="button" class="lb-btn" data-vb-close aria-label="Fermer"><i data-lucide="x" class="h-5 w-5"></i></button></div>
      <div class="lb-stage"><video data-vb-video controls playsinline></video></div>
      <div></div>`;
    document.body.appendChild(vb);
    const video = $('[data-vb-video]', vb);
    const openVideo = (src, poster) => {
      video.src = src; if (poster) video.poster = poster;
      vb.classList.add('is-open'); document.documentElement.style.overflow = 'hidden'; icons();
      video.play().catch(() => {});
    };
    const closeVideo = () => { vb.classList.remove('is-open'); document.documentElement.style.overflow = ''; video.pause(); };
    videoBtns.forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); openVideo(b.dataset.videoOpen, b.dataset.videoPoster); }));
    $('[data-vb-close]', vb).addEventListener('click', closeVideo);
    vb.addEventListener('click', (e) => { if (e.target === vb || e.target.classList.contains('lb-stage')) closeVideo(); });
    document.addEventListener('keydown', (e) => { if (vb.classList.contains('is-open') && e.key === 'Escape') closeVideo(); });
  }

  /* ---------- Visite virtuelle 360° (modale) ---------- */
  const tourBtns = $$('[data-tour-open]');
  if (tourBtns.length) {
    const tb = document.createElement('div');
    tb.className = 'lightbox'; tb.setAttribute('role', 'dialog'); tb.setAttribute('aria-modal', 'true'); tb.setAttribute('aria-label', 'Visite virtuelle 360°');
    tb.innerHTML = `
      <div class="lb-top"><span class="font-serif text-2xl italic">Visite virtuelle 360°</span>
        <button type="button" class="lb-btn" data-tb-close aria-label="Fermer"><i data-lucide="x" class="h-5 w-5"></i></button></div>
      <div class="lb-stage"><iframe data-tb-frame style="width:100%;height:100%;border:0;border-radius:1.5rem" allow="xr-spatial-tracking" allowfullscreen></iframe></div>
      <div></div>`;
    document.body.appendChild(tb);
    const frame = $('[data-tb-frame]', tb);
    const openTour = (src) => { frame.src = src; tb.classList.add('is-open'); document.documentElement.style.overflow = 'hidden'; icons(); };
    const closeTour = () => { tb.classList.remove('is-open'); document.documentElement.style.overflow = ''; frame.src = ''; };
    tourBtns.forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); openTour(b.dataset.tourOpen); }));
    $('[data-tb-close]', tb).addEventListener('click', closeTour);
    tb.addEventListener('click', (e) => { if (e.target === tb) closeTour(); });
    document.addEventListener('keydown', (e) => { if (tb.classList.contains('is-open') && e.key === 'Escape') closeTour(); });
  }

  /* ---------- Estimation pas à pas (estimer.html) ---------- */
  const est = $('[data-estimate]');
  if (est) {
    const form = $('[data-est-form]', est);
    const steps = $$('.est-step', form);
    const segs = $$('.est-seg', est);
    const imgs = $$('[data-aside-img]', est);
    const prevBtn = $('[data-prev]', est), nextLabel = $('[data-next-label]', est);
    const quote = $('[data-aside-quote]', est);
    const QUOTES = [
      'Six questions, quelques minutes. Une première lecture de marché fondée sur nos ventes récentes — puis l’œil d’un expert, sur place.',
      'Une rue, une exposition, une vue : l’emplacement compte pour près de 60 % de la valeur d’une demeure.',
      'Nous raisonnons en volumes et en lumière autant qu’en mètres carrés.',
      'Un bassin, une vue dégagée, une signature d’architecte : ce qui ne se reproduit pas se valorise.',
      'Discrétion absolue : un tiers de nos ventes se conclut sans aucune publicité.',
      'Un seul interlocuteur vous accompagnera, de l’estimation jusqu’à l’acte.',
      'Votre pré-estimation est prête. Elle sera affinée lors d’une visite d’expertise.',
    ];
    let cur = 0;
    const val = (n) => form.querySelector(`[name="${n}"]:checked`);
    const precision = () => {
      let p = 12;
      if (val('type')) p += 14;
      if (val('region') || $('[data-address]', form).value.trim().length > 3) p += 20;
      if (cur >= 2) p += 18;
      p += Math.min(12, $$('[name="assets"]:checked', form).length * 3);
      if (cur >= 4) p += 8;
      if (form.email.value.includes('@')) p += 8;
      return Math.min(p, 96);
    };
    const updatePrecision = () => { const p = precision(); $('[data-precision]', est).textContent = `${p} %`; est.style.setProperty('--prec', `${p}%`); };
    const setAside = (i) => {
      imgs.forEach((im, k) => im.classList.toggle('is-active', k === i));
      quote.style.opacity = 0; setTimeout(() => { quote.textContent = QUOTES[i]; quote.style.opacity = 1; }, 300);
    };
    quote.style.transition = 'opacity .4s';
    const show = (i, back = false) => {
      steps.forEach((st, k) => { st.classList.toggle('is-active', k === i); st.classList.toggle('is-back', back && k === i); st.classList.remove('has-error'); });
      segs.forEach((sg, k) => { sg.classList.toggle('is-done', k < i); sg.classList.toggle('is-active', k === i); });
      $('[data-step-num]', est).textContent = String(i + 1).padStart(2, '0'); $('[data-step-of]', est).hidden = false;
      $('[data-step-name]', est).textContent = steps[i].dataset.name;
      prevBtn.disabled = i === 0;
      nextLabel.textContent = i === steps.length - 1 ? 'Découvrir mon estimation' : 'Continuer';
      cur = i; setAside(i); updatePrecision();
      if (show.ready && innerWidth < 1024) scrollTo({ top: form.parentElement.getBoundingClientRect().top + scrollY - 96, behavior: reduced ? 'auto' : 'smooth' });
    };
    const validate = (i) => {
      const st = steps[i];
      let ok = true;
      if (i === 0) ok = !!val('type');
      if (i === 1) ok = !!val('region') || $('[data-address]', form).value.trim().length > 3;
      if (i === 5) {
        const mailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.value.trim());
        const lastOk = form.last.value.trim().length > 1;
        form.email.parentElement.classList.toggle('is-invalid', !mailOk);
        form.last.parentElement.classList.toggle('is-invalid', !lastOk);
        ok = mailOk && lastOk && form.consent.checked;
      }
      st.classList.remove('has-error'); if (!ok) { void st.offsetWidth; st.classList.add('has-error'); }
      return ok;
    };
    // Avance automatique après le choix d'une typologie
    $$('[name="type"]', form).forEach((r) => r.addEventListener('change', () => { updatePrecision(); setTimeout(() => cur === 0 && show(1), 450); }));
    form.addEventListener('change', updatePrecision);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validate(cur)) return;
      if (cur < steps.length - 1) show(cur + 1); else compute();
    });
    prevBtn.addEventListener('click', () => cur > 0 && show(cur - 1, true));

    // Curseurs
    $$('[data-range]', form).forEach((r) => {
      const out = $(`[data-out="${r.dataset.range}"]`, form);
      const upd = () => {
        r.style.setProperty('--p', `${((r.value - r.min) / (r.max - r.min)) * 100}%`);
        const v = +r.value;
        out.textContent = r.dataset.range === 'land' ? (v === 0 ? 'Aucun' : v >= 10000 ? `${String(+(v / 10000).toFixed(2)).replace('.', ',')} ha` : `${fmt(v)} m²`) : `${fmt(v)} m²`;
      };
      r.addEventListener('input', upd); upd();
    });
    // Compteurs +/-
    const counts = {};
    $$('[data-stepper]', form).forEach((sp) => {
      const k = sp.dataset.stepper, o = $('[data-val]', sp);
      counts[k] = +o.textContent;
      const set = (d) => { counts[k] = Math.max(+sp.dataset.min, Math.min(+sp.dataset.max, counts[k] + d)); o.textContent = counts[k]; o.classList.remove('bump'); void o.offsetWidth; o.classList.add('bump'); };
      $('[data-dec]', sp).addEventListener('click', () => set(-1));
      $('[data-inc]', sp).addEventListener('click', () => set(1));
    });
    // Suggestions d'adresses (fictives)
    const ADDR = [
      ['12, avenue d’Iéna', 'Paris 16ᵉ', 'Paris'], ['4, place des Vosges', 'Paris 3ᵉ', 'Paris'], ['27, quai d’Orléans', 'Paris 4ᵉ', 'Paris'],
      ['Chemin des Nielles', 'Cap d’Antibes', 'Côte d’Azur'], ['Boulevard du Général de Gaulle', 'Saint-Jean-Cap-Ferrat', 'Côte d’Azur'], ['Route des Plages', 'Ramatuelle', 'Côte d’Azur'],
      ['Chemin du Calvaire', 'Megève', 'Alpes'], ['Route du Jardin Alpin', 'Courchevel 1850', 'Alpes'],
      ['Route de Murs', 'Gordes', 'Provence'], ['Chemin des Oliviers', 'Saint-Rémy-de-Provence', 'Provence'],
      ['Avenue de l’Impératrice', 'Biarritz', 'Côte Basque'], ['Rue du Maréchal Joffre', 'Saint-Germain-en-Laye', 'Ouest parisien'],
    ];
    const addr = $('[data-address]', form), sug = $('[data-suggest]', form);
    let hl = -1;
    const renderSug = () => {
      const q = addr.value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const list = q.length < 2 ? [] : ADDR.filter((a) => norm(a[0] + ' ' + a[1]).includes(q)).slice(0, 5);
      sug.innerHTML = list.map((a, i) => `<li><button type="button" data-i="${ADDR.indexOf(a)}" class="${i === hl ? 'is-hl' : ''}"><i data-lucide="map-pin" class="h-4 w-4 text-moka/40"></i><span><b class="font-medium">${a[0]}</b><span class="block text-xs text-moka/50">${a[1]} · ${a[2]}</span></span></button></li>`).join('');
      sug.classList.toggle('is-open', list.length > 0); icons();
    };
    addr.addEventListener('input', () => { hl = -1; renderSug(); updatePrecision(); });
    addr.addEventListener('keydown', (e) => {
      const btns = $$('button', sug);
      if (!sug.classList.contains('is-open') || !btns.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); hl = (hl + (e.key === 'ArrowDown' ? 1 : btns.length - 1)) % btns.length; btns.forEach((b, k) => b.classList.toggle('is-hl', k === hl)); }
      if (e.key === 'Enter' && hl >= 0) { e.preventDefault(); btns[hl].click(); }
      if (e.key === 'Escape') sug.classList.remove('is-open');
    });
    sug.addEventListener('click', (e) => {
      const b = e.target.closest('[data-i]'); if (!b) return;
      const a = ADDR[+b.dataset.i];
      addr.value = `${a[0]}, ${a[1]}`; sug.classList.remove('is-open');
      const r = form.querySelector(`[name="region"][value="${a[2]}"]`); if (r) r.checked = true;
      updatePrecision();
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('[data-suggest],[data-address]')) sug.classList.remove('is-open'); });

    // Calcul (données de démonstration)
    const compute = () => {
      const type = val('type'), region = val('region') || form.querySelector('[name="region"][value="Côte d’Azur"]');
      const surface = +form.surface.value, land = +form.land.value;
      const state = val('state');
      const assets = $$('[name="assets"]:checked', form);
      const pct = assets.reduce((a, c) => a + +c.dataset.pct, 0);
      const ppm = +region.dataset.ppm * +type.dataset.coef * +state.dataset.coef;
      const roomsAdj = 1 + Math.max(-0.05, Math.min(0.06, (counts.suites - Math.round(counts.rooms / 2)) * 0.015));
      const base = surface * ppm * roomsAdj;
      const withAssets = base * (1 + pct / 100);
      const landV = Math.min(land, 40000) * +region.dataset.ppm * 0.018;
      const mid = withAssets + landV;
      const round = (n) => Math.round(n / 10000) * 10000;
      const low = round(mid * 0.93), high = round(mid * 1.07);
      const conf = Math.min(94, 68 + assets.length * 2 + (form.address.value.trim() ? 8 : 0) + (state ? 4 : 0));
      const M = (n) => n >= 1e6 ? `${String(+(n / 1e6).toFixed(2)).replace('.', ',')} M€` : `${fmt(n / 1000)} k€`;
      const timing = val('timing').value;
      const offm = form.offmarket.checked;
      // Écran de calcul
      form.hidden = true; $('[data-est-progress]', est).hidden = true;
      const load = $('[data-est-loading]', est); load.hidden = false;
      const lis = $$('[data-loading-steps] li', load); lis.forEach((l) => l.classList.remove('is-on'));
      lis.forEach((l, k) => setTimeout(() => l.classList.add('is-on'), 450 + k * 650));
      imgs.forEach((im, k) => im.classList.toggle('is-active', k === 6));
      quote.textContent = QUOTES[6];
      est.style.setProperty('--prec', '100%'); $('[data-precision]', est).textContent = `${conf} %`;
      setTimeout(() => {
        load.hidden = true;
        const res = $('[data-est-result]', est); res.hidden = false;
        $('[data-est-progress]', est).hidden = false; $('[data-est-restart]', est).hidden = false;
        $('[data-step-num]', est).textContent = '✓'; $('[data-step-of]', est).hidden = true; $('[data-step-name]', est).textContent = 'Pré-estimation';
        segs.forEach((sg) => { sg.classList.add('is-done'); sg.classList.remove('is-active'); });
        $('[data-r-type]', res).textContent = type.value === 'Villa' ? 'Maison · Villa' : type.value;
        $('[data-r-place]', res).textContent = form.address.value.trim() ? form.address.value.split(',').pop().trim() : region.value;
        const countUp = (el, target) => {
          if (reduced) { el.textContent = M(target); return; }
          const t0 = performance.now(), d = 1600;
          const step = (t) => { const k = Math.min(1, (t - t0) / d); const e = 1 - Math.pow(1 - k, 3); el.textContent = M(round(target * e)); if (k < 1) requestAnimationFrame(step); };
          requestAnimationFrame(step);
        };
        countUp($('[data-r-low]', res), low); countUp($('[data-r-high]', res), high);
        $('[data-r-conf]', res).textContent = `${conf} %`;
        $('[data-r-mid]', res).textContent = M(round(mid));
        $('[data-r-ppm]', res).textContent = `${fmt(Math.round(mid / surface / 100) * 100)} €`;
        $('[data-r-delay]', res).textContent = offm ? '60 – 90 j' : timing === 'Sous 3 mois' ? '75 – 110 j' : '90 – 140 j';
        $('[data-r-assets]', res).textContent = pct ? `+ ${pct} %` : '—';
        const marker = $('[data-r-marker]', res); marker.style.setProperty('--m', '8%');
        requestAnimationFrame(() => setTimeout(() => marker.style.setProperty('--m', `${50 + Math.min(18, pct)}%`), 60));
        const rows = [
          ['Typologie', type.value], ['Localisation', form.address.value.trim() || region.value], ['Surface', `${fmt(surface)} m²`],
          ['Pièces · suites', `${counts.rooms} · ${counts.suites}`], ['Terrain', land ? `${fmt(land)} m²` : 'Aucun'], ['État', state.value],
          ['Atouts', assets.length ? assets.map((a) => a.value).join(', ') : '—'], ['Calendrier', timing], ['Diffusion', offm ? 'Off-market' : 'Publique'],
        ];
        $('[data-r-summary]', res).innerHTML = rows.map(([k, v]) => `<div><dt class="text-xs text-moka/45">${k}</dt><dd class="mt-1">${v}</dd></div>`).join('');
        icons();
        scrollTo({ top: res.parentElement.getBoundingClientRect().top + scrollY - 100, behavior: reduced ? 'auto' : 'smooth' });
      }, reduced ? 200 : 2700);
    };
    // Créneaux & réservation
    const slots = $$('[data-r-slots] .chip', est);
    slots.forEach((b) => b.addEventListener('click', () => slots.forEach((x) => x.setAttribute('aria-pressed', String(x === b)))));
    $('[data-r-book]', est).addEventListener('click', () => {
      const sel = slots.find((x) => x.getAttribute('aria-pressed') === 'true');
      toast(sel ? `Visite d’expertise confirmée · ${sel.textContent}` : 'Choisissez d’abord un créneau');
    });
    $('[data-est-restart]', est).addEventListener('click', () => {
      form.reset(); $$('[data-range]', form).forEach((r) => r.dispatchEvent(new Event('input')));
      $('[data-est-result]', est).hidden = true; form.hidden = false; $('[data-est-restart]', est).hidden = true;
      show(0);
    });
    show(0); show.ready = true;
  }

  /* ---------- La Maison : frise & bureaux ---------- */
  const tl = $('[data-timeline]');
  if (tl) {
    const bar = $('[data-tl-bar]');
    const step = () => ($('.tl-item', tl)?.offsetWidth || 320);
    $('[data-tl-prev]').addEventListener('click', () => tl.scrollBy({ left: -step(), behavior: 'smooth' }));
    $('[data-tl-next]').addEventListener('click', () => tl.scrollBy({ left: step(), behavior: 'smooth' }));
    const upd = () => { const m = tl.scrollWidth - tl.clientWidth; bar.style.width = `${m > 0 ? Math.max(8, (tl.scrollLeft / m) * 100) : 100}%`; };
    tl.addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
  }
  const OFFICES = {
    aix: { city: 'Aix-en-Provence', short: 'Aix-en-Provence', addr: '67 Cours Mirabeau<br />13100 Aix-en-Provence', hours: 'Lun.–sam. · 9 h 30 – 19 h', lead: 'Hélène de Varennes', tel: '+33 4 42 96 10 20', agent: 'Hélène de Varennes', role: 'Fondatrice · Aix-en-Provence', img: 'fondatrice', photo: 'maison-hero' },
  };
  const offs = $('[data-offices]');
  if (offs) {
    const panel = $('[data-off-panel]', offs);
    $$('[data-off]', offs).forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.off, o = OFFICES[k];
      $$('[data-off]', offs).forEach((x) => { x.setAttribute('aria-pressed', String(x === b)); x.setAttribute('aria-selected', String(x === b)); });
      $$('[data-off-img]', offs).forEach((im) => im.classList.toggle('is-active', im.dataset.offImg === k));
      $('[data-off-city]', offs).textContent = o.city;
      panel.style.opacity = 0;
      setTimeout(() => {
        ['addr', 'hours', 'lead', 'tel'].forEach((f) => { $(`[data-f="${f}"]`, offs).innerHTML = o[f]; });
        $('[data-f="short"]', offs).textContent = o.short;
        $('[data-off-link]', offs).setAttribute('href', `rendez-vous.html?bureau=${k}`);
        panel.style.opacity = 1;
      }, 300);
    }));
  }

  /* ---------- Rendez-vous : calendrier & récapitulatif ---------- */
  const rdv = $('[data-rdv]');
  if (rdv) {
    const form = $('[data-rdv-form]', rdv);
    const grid = $('[data-cal-grid]', rdv), slotsBox = $('[data-slots]', rdv);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let view = new Date(today.getFullYear(), today.getMonth(), 1);
    let selDate = null, selSlot = null;
    const q = new URLSearchParams(location.search);
    if (q.get('bureau') && OFFICES[q.get('bureau')]) { const r = form.querySelector(`[name="bureau"][value="${q.get('bureau')}"]`); if (r) r.checked = true; }
    if (q.get('motif') === 'vendre') form.querySelector('[name="motif"][value="Vendre une demeure"]').checked = true;
    const dFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const mFmt = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
    // Pseudo-aléatoire stable : même disponibilité pour une date donnée
    const seed = (d, k = 0) => { const x = Math.sin(d.getFullYear() * 400 + d.getMonth() * 40 + d.getDate() + k * 7.3) * 10000; return x - Math.floor(x); };
    const SLOTS = ['09 h 30', '10 h 30', '11 h 30', '14 h 00', '15 h 00', '16 h 30', '17 h 30', '18 h 30'];
    const maxView = new Date(today.getFullYear(), today.getMonth() + 2, 1);
    const isOpen = (d) => d > today && d.getDay() !== 0;
    const renderCal = () => {
      $('[data-cal-title]', rdv).textContent = mFmt.format(view);
      $('[data-cal-prev]', rdv).disabled = view <= new Date(today.getFullYear(), today.getMonth(), 1);
      $('[data-cal-next]', rdv).disabled = view >= maxView;
      const first = (view.getDay() + 6) % 7;
      const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
      let h = '';
      for (let i = 0; i < first; i++) h += '<span></span>';
      for (let d = 1; d <= days; d++) {
        const dt = new Date(view.getFullYear(), view.getMonth(), d);
        const open = isOpen(dt);
        const few = open && seed(dt) > 0.72;
        const sel = selDate && dt.getTime() === selDate.getTime();
        h += `<button type="button" class="cal-day${dt.getTime() === today.getTime() ? ' is-today' : ''}${few ? ' is-few' : ''}" data-d="${dt.getTime()}" ${open ? '' : 'disabled'} aria-selected="${sel}" aria-label="${dFmt.format(dt)}">${d}</button>`;
      }
      grid.innerHTML = h;
    };
    const renderSlots = () => {
      if (!selDate) return;
      $('[data-slot-title]', rdv).textContent = dFmt.format(selDate);
      $('[data-slot-hint]', rdv).textContent = 'Heure de Paris · durée indicative 1 h.';
      const sat = selDate.getDay() === 6;
      const list = sat ? SLOTS.slice(0, 5) : SLOTS;
      slotsBox.innerHTML = list.map((s, i) => {
        const taken = seed(selDate, i + 1) > 0.66;
        return `<button type="button" class="slot" style="--d:${i * 40}ms" ${taken ? 'disabled' : ''} aria-pressed="${s === selSlot}">${s}</button>`;
      }).join('');
    };
    grid.addEventListener('click', (e) => {
      const b = e.target.closest('.cal-day:not(:disabled)'); if (!b) return;
      selDate = new Date(+b.dataset.d); selSlot = null;
      $$('.cal-day', grid).forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      renderSlots(); recap();
    });
    grid.addEventListener('keydown', (e) => {
      const map = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
      if (!(e.key in map)) return;
      const days = $$('.cal-day', grid), i = days.indexOf(document.activeElement);
      if (i < 0) return; e.preventDefault();
      let j = i + map[e.key];
      while (days[j] && days[j].disabled) j += Math.sign(map[e.key]);
      days[j]?.focus();
    });
    slotsBox.addEventListener('click', (e) => {
      const b = e.target.closest('.slot:not(:disabled)'); if (!b) return;
      selSlot = b.textContent;
      $$('.slot', slotsBox).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      $('[data-err="slot"]', rdv).classList.remove('is-on');
      recap();
    });
    $('[data-cal-prev]', rdv).addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); renderCal(); });
    $('[data-cal-next]', rdv).addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderCal(); });

    const val = (n) => form.querySelector(`[name="${n}"]:checked`);
    const setR = (k, v) => { const el = $(`[data-r="${k}"]`, rdv); if (el.textContent !== v) { el.style.opacity = 0; setTimeout(() => { el.textContent = v; el.style.opacity = 1; }, 150); } };
    const recap = () => {
      const fmtV = val('format').value, b = val('bureau'), o = OFFICES[b.value];
      $('[data-office-wrap]', rdv).style.display = fmtV === 'En visio' ? 'none' : '';
      const motif = val('motif').value;
      let agent = o;
      if (motif === 'Consultation Feng Shui') agent = { agent: 'Claire Vasseur', role: 'Pôle Feng Shui', img: 'praticienne' };
      else if (motif === 'Visite d’expertise') agent = { ...o, agent: 'Antoine Mercier', role: 'Expert estimation', img: 'agent' };
      $('[data-r-agent]', rdv).textContent = agent.agent; $('[data-r-role]', rdv).textContent = agent.role;
      $('[data-r-img]', rdv).src = `assets/img/${agent.img}.webp`;
      setR('motif', motif);
      setR('lieu', fmtV === 'En visio' ? 'Visioconférence' : fmtV === 'Chez vous' ? `À domicile · secteur ${b.dataset.label}` : `Salon ${b.dataset.label}`);
      setR('date', selDate ? dFmt.format(selDate).replace(/^./, (c) => c.toUpperCase()) : 'À choisir');
      setR('slot', selSlot || '—');
      setR('dur', motif === 'Visite d’expertise' || motif === 'Consultation Feng Shui' ? '2 h' : fmtV === 'En visio' ? '45 min' : '1 h');
      return { motif, fmtV, o, agent };
    };
    form.addEventListener('change', recap);
    $('[data-rdv-submit]', rdv).addEventListener('click', () => {
      const okSlot = selDate && selSlot;
      const mailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.value.trim());
      const nameOk = form.fullname.value.trim().length > 1;
      form.email.parentElement.classList.toggle('is-invalid', !mailOk);
      form.fullname.parentElement.classList.toggle('is-invalid', !nameOk);
      const eS = $('[data-err="slot"]', rdv), eC = $('[data-err="contact"]', rdv);
      eS.classList.remove('is-on'); eC.classList.remove('is-on'); void eS.offsetWidth;
      if (!okSlot) eS.classList.add('is-on');
      if (!(mailOk && nameOk)) eC.classList.add('is-on');
      if (!okSlot || !mailOk || !nameOk) {
        const target = !okSlot ? eS.closest('.rdv-block') : eC.closest('.rdv-block');
        scrollTo({ top: target.getBoundingClientRect().top + scrollY - 110, behavior: reduced ? 'auto' : 'smooth' });
        toast(!okSlot ? 'Choisissez une date et un créneau' : 'Complétez vos coordonnées');
        return;
      }
      const r = recap();
      const done = $('[data-rdv-done]', rdv);
      $('[data-d="date"]', done).textContent = dFmt.format(selDate);
      const where = r.fmtV === 'En visio' ? 'en visioconférence — le lien privé vous parvient par e-mail' : r.fmtV === 'Chez vous' ? 'à l’adresse de votre choix' : `dans notre salon de ${r.o.city}`;
      $('[data-d="text"]', done).textContent = `${r.agent.agent} vous attend à ${selSlot.replace(' ', ' ')}, ${where}. Une confirmation a été envoyée à ${form.email.value.trim()}.`;
      $('[data-done-img]', done).src = `assets/img/${r.o.photo}.webp`;
      rdv.firstElementChild.style.display = 'none'; done.hidden = false;
      icons();
      scrollTo({ top: rdv.getBoundingClientRect().top + scrollY - 110, behavior: reduced ? 'auto' : 'smooth' });
    });
    $('[data-rdv-again]', rdv).addEventListener('click', () => { $('[data-rdv-done]', rdv).hidden = true; rdv.firstElementChild.style.display = ''; });
    renderCal(); recap();
  }

  /* ---------- Formulaires factices ---------- */
  $$('[data-fake-submit]').forEach((f) => f.addEventListener('submit', (e) => {
    e.preventDefault(); toast(f.dataset.fakeSubmit); f.reset();
  }));

  /* ---------- Connexion (espace professionnel) ---------- */
  const loginForm = $('[data-login-form]');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = $('[data-login-submit]', loginForm), label = $('[data-login-label]', loginForm);
      btn.disabled = true; if (label) label.textContent = 'Connexion…';
      toast('Connexion réussie — redirection vers votre espace…');
      setTimeout(() => {
        const level = (window.MoPackage && MoPackage.get()) || 'full';
        location.href = MoPackage.dashUrl(level === 'full' ? 'full' : 'light');
      }, 900);
    });
  }

  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
