/* ============================================================
   Maison Orée — Application front (données fictives)
   ============================================================ */
(() => {
  const { agents, properties, clients, appointments, conversations, transactions, notifications, activites, mandats, offres, taches, rapports,
    moisLabels, caVentes, caLocations, visitesSemaine, leadsSources, pipelineEtapes, evolutionPrixM2, marcheM2 } = window.DB;

  const TODAY = '2026-09-26';
  const state = {
    theme: 'light', currency: 'EUR', rate: 1,
    favs: new Set(['p1', 'p5']),
    biensFilters: { q: '', quartier: '', type: '', statut: '', transaction: '', tri: 'recent', mode: 'grid' },
    mandatFilters: { q: '', statut: '', type: '', agent: '', tri: 'fin' },
    offreFilters: { q: '', statut: '', agent: '', financement: '', tri: 'recent', mode: 'table' },
    tacheFilters: { q: '', statut: '', priorite: '', type: '', agent: '', mode: 'list' },
    rapportFilters: { q: '', statut: '', periode: '', agent: '' },
    dashFilters: { quartier: '', type: '', statut: '', q: '', sort: { key: 'ajout', dir: -1 } },
    dashPage: 1,
    clientsMode: 'kanban',
    conv: 'm1',
    weekOffset: 0,
    avgPeriod: 'mois',
    notifOpen: false,
    demoOpen: false,
    settingsTab: 'agence',
    charts: {},
    maps: {},
  };

  /* ---------- Utilitaires ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const agentOf = id => agents.find(a => a.id === id);
  const propOf = id => properties.find(p => p.id === id);
  const clientOf = id => clients.find(c => c.id === id);
  const nf = new Intl.NumberFormat('fr-FR');

  function money(v, { short = false, perMonth = false } = {}) {
    if (v == null) return '—';
    let val = state.currency === 'EUR' ? v / state.rate : v;
    const unit = state.currency === 'EUR' ? '€' : 'DA';
    let out;
    if (short) {
      if (val >= 1e9) out = (val / 1e9).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' Md';
      else if (val >= 1e6) out = (val / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' M';
      else if (val >= 1e3) out = (val / 1e3).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' k';
      else out = nf.format(Math.round(val));
      out += ' ' + unit;
    } else out = nf.format(Math.round(val)) + ' ' + unit;
    return perMonth ? out + '/mois' : out;
  }
  const priceOf = p => money(p.prix, { short: true, perMonth: p.transaction === 'Location' });
  const dateFR = (iso, opts = { day: 'numeric', month: 'short' }) => new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', opts);
  const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const statutTag = s => ({ 'Disponible': 'ok', 'Sous offre': 'warn', 'Vendu': 'dark', 'Loué': 'dark', 'En location': 'info' }[s] || 'muted');
  const etapeTag = s => ({ 'Nouveau': 'muted', 'Qualifié': 'info', 'Visite': 'warn', 'Offre': 'terra', 'Négociation': 'warn', 'Signé': 'ok' }[s] || 'muted');
  const rdvTag = s => ({ 'Confirmé': 'ok', 'En attente': 'warn', 'Terminé': 'muted', 'Annulé': 'danger' }[s] || 'muted');
  const avatar = (a, size = '') => `<span class="avatar ${size}" style="background:${a.couleur}" title="${esc(a.nom)}">${a.initiales}</span>`;
  const avatarClient = (c, size = '') => { const ini = c.nom.split(/[\s&]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase(); return `<span class="avatar ${size}" style="background:var(--ink-4)">${ini}</span>`; };

  /* ---------- Matching acheteurs ↔ biens (calcul côté navigateur) ---------- */
  function matchScore(c, p) {
    if (!c || !p || c.type === 'Vendeur' || ['Vendu', 'Loué'].includes(p.statut)) return null;
    const wantLoc = c.type === 'Locataire';
    if ((p.transaction === 'Location') !== wantLoc) return null;
    const why = []; let s = 0;
    if (c.budget) {
      if (p.prix <= c.budget) { s += 30 + Math.round(10 * p.prix / c.budget); why.push('Dans le budget'); }
      else if (p.prix <= c.budget * 1.1) { s += 25; why.push('Budget dépassé de ' + Math.round((p.prix / c.budget - 1) * 100) + ' %'); }
      else if (p.prix <= c.budget * 1.25) { s += 10; why.push('Budget dépassé de ' + Math.round((p.prix / c.budget - 1) * 100) + ' %'); }
      else why.push('Hors budget');
      if (p.prix < c.budget * 0.45) { s -= 15; why.push('Bien en dessous du budget'); }
    }
    if (!c.quartiers?.length) s += 20; else if (c.quartiers.includes(p.quartier)) { s += 30; why.push('Quartier recherché'); } else why.push('Autre quartier');
    if (!c.types?.length) s += 12; else if (c.types.includes(p.type)) { s += 18; why.push('Type ' + p.type); } else why.push('Type non recherché');
    if (!c.chambresMin || p.type === 'Terrain') s += 8; else if (p.chambres >= c.chambresMin) { s += 12; why.push(p.chambres + ' chambres'); } else why.push('Trop peu de chambres');
    if (c.interet === p.id) { s = Math.min(100, s + 10); why.unshift('Déjà intéressé'); }
    return { score: Math.max(0, Math.min(100, s)), why };
  }
  const matchesForProp = p => clients.map(c => ({ c, m: matchScore(c, p) })).filter(x => x.m && x.m.score >= 40).sort((a, b) => b.m.score - a.m.score);
  const matchesForClient = c => properties.map(p => ({ p, m: matchScore(c, p) })).filter(x => x.m && x.m.score >= 40).sort((a, b) => b.m.score - a.m.score);
  const allMatches = () => clients.flatMap(c => matchesForClient(c).map(x => ({ c, ...x }))).sort((a, b) => b.m.score - a.m.score);
  const scoreTag = s => s >= 80 ? 'ok' : s >= 60 ? 'warn' : 'muted';
  const matchRow = ({ c, p, m }, mode) => `<div class="match-row" data-${mode === 'prop' ? 'client' : 'prop'}="${mode === 'prop' ? c.id : p.id}">
      ${mode === 'prop' ? avatarClient(c, 'sm') : `<img src="${p.img}" alt="" class="match-img" />`}
      <div class="match-body"><b>${esc(mode === 'prop' ? c.nom : p.titre)}</b><small>${mode === 'prop' ? `${c.type} · budget ${money(c.budget, { short: true })}` : `${esc(p.quartier)} · ${priceOf(p)}`}</small><div class="match-why">${m.why.slice(0, 3).map(w => `<span>${esc(w)}</span>`).join('')}</div></div>
      <div class="match-score"><span class="tag ${scoreTag(m.score)} no-dot">${m.score} %</span><i><b style="width:${m.score}%"></b></i></div></div>`;

  const I = {
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7l10 10M17 8v9H8"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3.3 5 6.9 5c2 0 3.4 1.1 5.1 3 1.7-1.9 3.1-3 5.1-3 3.6 0 5.7 3.6 4.4 6.8C19.5 16.4 12 21 12 21Z"/></svg>',
    heartO: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3.3 5 6.9 5c2 0 3.4 1.1 5.1 3 1.7-1.9 3.1-3 5.1-3 3.6 0 5.7 3.6 4.4 6.8C19.5 16.4 12 21 12 21Z"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="#C9A46A"><path d="m12 2 3 6.5 7 .9-5.2 4.8L18.2 21 12 17.5 5.8 21l1.4-6.8L2 9.4l7-.9Z"/></svg>',
    bed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 18h18M5 10V6h6v4M13 10V7h6v3"/></svg>',
    bath: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3ZM6 12V5a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2"/></svg>',
    area: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4h16v16H4zM4 9h5V4M15 20v-5h5"/></svg>',
    car: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H3v-5l2-5h14l2 5v5h-2M5 17a2 2 0 1 0 4 0M15 17a2 2 0 1 0 4 0M9 17h6M3 12h18"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h18l-7 8v6l-4-2v-4Z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6M8 13h8M8 17h6"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12 12 20l-9-9V3h8Z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.6a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.8.3 1.7.5 2.6.7a2 2 0 0 1 1.7 2Z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>',
    chevL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg>',
    chevR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    trend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 17 6-6 4 4 8-8M14 7h7v7"/></svg>',
  };
  const delta = (v, suffix = '%') => { const cls = v > 0 ? 'up' : v < 0 ? 'down' : 'flat'; const ic = v > 0 ? I.up : v < 0 ? I.down : ''; return `<span class="delta ${cls}">${ic}${v > 0 ? '+' : ''}${v.toLocaleString('fr-FR')}${suffix}</span>`; };
  const sparkline = arr => { const m = Math.max(...arr); return `<div class="spark" aria-hidden="true">${arr.map((v, i) => `<i style="height:${Math.max(12, v / m * 100)}%" class="${i === arr.length - 1 ? 'hi' : ''}"></i>`).join('')}</div>`; };

  const toast = (msg) => { const t = $('#toast'); t.innerHTML = I.check + esc(msg); t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2600); };

  /* Chart.js défauts */
  const chartTheme = () => {
    const dark = state.theme === 'dark';
    Chart.defaults.font.family = "'Switzer', 'Inter', system-ui, sans-serif";
    Chart.defaults.font.size = 11;
    Chart.defaults.maintainAspectRatio = false;
    Chart.defaults.responsive = true;
    Chart.defaults.color = dark ? '#8F8C83' : '#85827B';
    Chart.defaults.borderColor = dark ? 'rgba(255,255,255,.06)' : 'rgba(26,25,23,.06)';
    Chart.defaults.plugins.legend.display = false;
    Chart.defaults.plugins.tooltip.backgroundColor = dark ? '#F2F0EA' : '#1A1917';
    Chart.defaults.plugins.tooltip.titleColor = dark ? '#1A1917' : '#fff';
    Chart.defaults.plugins.tooltip.bodyColor = dark ? '#1A1917' : '#fff';
    Chart.defaults.plugins.tooltip.cornerRadius = 10;
    Chart.defaults.plugins.tooltip.padding = 10;
    return { ink: dark ? '#F2F0EA' : '#1A1917', accent: '#C9A46A', accent2: '#E4B98C', sage: '#8A9A7B', terra: '#B07C6C', slate: '#6E86A6', muted: dark ? '#3A3833' : '#D9D6CE' };
  };
  const mkChart = (id, cfg) => { const c = document.getElementById(id); if (!c) return; if (state.charts[id]) state.charts[id].destroy(); state.charts[id] = new Chart(c, cfg); };

  /* ============================================================
     TABLEAU DE BORD
     ============================================================ */
  function renderDashboard() {
    const v = $('#view-dashboard');
    const caMois = (caVentes.at(-1) + caLocations.at(-1)) * 1e6;
    const caPrev = (caVentes.at(-2) + caLocations.at(-2)) * 1e6;
    const dCa = Math.round((caMois - caPrev) / caPrev * 100);
    const ventesMois = transactions.filter(t => t.type === 'Vente' && t.date >= '2026-09-01');
    const locsMois = transactions.filter(t => t.type === 'Location' && t.date >= '2026-09-01');
    const volVentes = ventesMois.reduce((s, t) => s + t.montant, 0);
    const volLocs = locsMois.reduce((s, t) => s + t.montant, 0) * 12;
    const dispo = properties.filter(p => ['Disponible', 'Sous offre'].includes(p.statut)).length;
    const featured = ['p1', 'p5', 'p3'].map(propOf);
    const todayRdv = appointments.filter(a => a.date === TODAY && a.statut !== 'Annulé').sort((a, b) => a.heure.localeCompare(b.heure));
    const avgByQuartier = Object.entries(properties.filter(p => p.transaction === 'Vente').reduce((acc, p) => { (acc[p.quartier] ||= []).push(p.prix); return acc; }, {})).map(([q, arr]) => [q, arr.reduce((a, b) => a + b, 0) / arr.length]).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxAvg = avgByQuartier[0][1];
    const avgSale = properties.filter(p => p.transaction === 'Vente').reduce((s, p) => s + p.prix, 0) / properties.filter(p => p.transaction === 'Vente').length;

    v.innerHTML = `
      <div class="grid dash-top">
        <div class="col">
          <div class="card">
            <div class="card-head"><div><h3 class="card-title">Volume du mois</h3><div class="card-sub">Septembre 2026 · vs objectif</div></div><a class="card-link" href="#/finances" aria-label="Voir les finances">${I.arrow}</a></div>
            <div class="hero-bars" style="grid-template-columns:1fr; gap:14px; max-width:none">
              <div class="hero-bar"><label>Ventes conclues</label><div class="val">${money(volVentes, { short: true })}</div><div class="track"><div class="fill dark" data-w="${Math.min(100, Math.round(volVentes / 5e8 * 100))}"></div></div></div>
              <div class="hero-bar"><label>Locations (loyers annualisés)</label><div class="val">${money(volLocs, { short: true })}</div><div class="track"><div class="fill gold" data-w="${Math.min(100, Math.round(volLocs / 4e7 * 100))}"></div></div></div>
            </div>
          </div>
          <div class="card kpi">
            <div class="card-head" style="margin:0"><h3 class="card-title">Chiffre d’affaires</h3><a class="card-link" href="#/finances" aria-label="Détail">${I.arrow}</a></div>
            <div class="kpi-value">${money(caMois, { short: true })}</div>
            <div class="kpi-foot"><div><span class="label">Commissions ce mois</span><br>${delta(dCa)}</div>${sparkline(caVentes.map((x, i) => x + caLocations[i]))}</div>
          </div>
        </div>

        <div class="col">
          <div class="card" style="flex:1">
            <div class="card-head"><div><h3 class="card-title">Valeur moyenne de vente</h3><div class="card-sub">Par quartier · biens en portefeuille</div></div>
              <div class="segmented" id="avg-seg">${['jour', 'semaine', 'mois'].map(p => `<button class="${state.avgPeriod === p ? 'active' : ''}" data-p="${p}">${p[0].toUpperCase() + p.slice(1)}</button>`).join('')}</div></div>
            <div class="kpi-value" style="margin:6px 0 2px">${money(avgSale, { short: true })}</div>
            <div class="label" style="font-size:12px;color:var(--ink-3)">Ce mois · ${delta(6.4)}</div>
            <div class="hbars">${avgByQuartier.map(([q, val]) => `<div class="hbar"><span class="lbl">${esc(q)}</span><div class="bar"><i data-w="${Math.round(val / maxAvg * 100)}">${money(val, { short: true })}</i></div></div>`).join('')}</div>
            <div class="axis"><span>0</span><span>100 M</span><span>200 M</span><span>300 M</span></div>
          </div>
          <div class="card kpi">
            <div class="card-head" style="margin:0"><h3 class="card-title">Transactions conclues</h3><a class="card-link" href="#/finances" aria-label="Détail">${I.arrow}</a></div>
            <div class="kpi-value">${transactions.filter(t => t.statut === 'Encaissée').length + 1262}</div>
            <div class="kpi-foot"><div><span class="label">Depuis la création · ${transactions.filter(t => t.date >= '2026-09-01').length} ce mois</span><br>${delta(12)}</div>${sparkline([5, 7, 4, 6, 8, 9, 7, 10, 8, 11, 9, 12])}</div>
          </div>
        </div>

        <div class="col">
          <div class="hero card" style="grid-column:auto; flex:1; min-height:220px">
            <div>
              <div class="hero-eyebrow">Bonjour Thomas · ${dateFR(TODAY, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
              <h1>${dispo} biens <em>d’exception</em> à placer ce mois.</h1>
              <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" data-action="add-bien">${I.plus} Ajouter un bien</button><a class="btn" href="#/agenda">${I.cal} ${todayRdv.length} rendez-vous aujourd’hui</a></div>
            </div>
            <div class="hero-visual"><img src="assets/hero-villa.jpg" alt="Villa de prestige" /></div>
          </div>
          <div class="card">
            <div class="card-head"><div><h3 class="card-title">Agenda du jour</h3><div class="card-sub">${todayRdv.length} rendez-vous · ${todayRdv.filter(a => a.type === 'Visite').length} visites</div></div><a class="card-link" href="#/agenda" aria-label="Voir l’agenda">${I.arrow}</a></div>
            <div class="agenda-list">${todayRdv.slice(0, 4).map(agendaItem).join('')}</div>
          </div>
        </div>
      </div>

      <div class="grid kpi-row" style="margin-top:16px">
        ${kpiCompact('Mandats actifs', properties.filter(p => !['Vendu', 'Loué'].includes(p.statut)).length, '', 3, [6, 7, 7, 8, 9, 9, 10], 'dont ' + properties.filter(p => p.exclusif && !['Vendu', 'Loué'].includes(p.statut)).length + ' exclusifs')}
        ${kpiCompact('Visites cette semaine', visitesSemaine.reduce((a, b) => a + b, 0), '', 18, visitesSemaine, 'moy. 6 / jour')}
        ${kpiCompact('Nouveaux contacts', 23, '', 9, [3, 4, 2, 5, 4, 3, 2], '7 derniers jours')}
        ${kpiCompact('Taux de conversion', 14.2, '%', 1.8, [10, 11, 12, 11, 13, 13, 14], 'visite → offre')}
      </div>

      <div class="grid dash-mid" style="margin-top:16px">
        <div class="card props-card">
          <div class="card-head"><div><h3 class="card-title">Biens à la une</h3><div class="card-sub">Sélection de la semaine · les plus consultés</div></div><a class="card-link" href="#/biens" aria-label="Tous les biens">${I.arrow}</a></div>
          <div class="props">${featured.map(propCard).join('')}</div>
        </div>
        <div class="card">
          <div class="card-head"><div><h3 class="card-title">Pipeline commercial</h3><div class="card-sub">${clients.length} contacts actifs</div></div><a class="card-link" href="#/clients" aria-label="Voir les clients">${I.arrow}</a></div>
          <div class="hbars">${pipelineEtapes.map(e => { const n = clients.filter(c => c.etape === e).length; return `<div class="hbar"><span class="lbl">${e}</span><div class="bar"><i data-w="${Math.max(12, n / 4 * 100)}" style="background:${e === 'Signé' ? 'var(--sage)' : ''}">${n}</i></div></div>`; }).join('')}</div>
          <div class="stats-line"><span>Budget cumulé <b>${money(clients.reduce((s, c) => s + c.budget, 0), { short: true })}</b></span><span>Offres en cours <b>${clients.filter(c => ['Offre', 'Négociation'].includes(c.etape)).length}</b></span></div>
        </div>
      </div>

      <div class="grid dash-bottom" style="margin-top:16px">
        <div class="card">
          <div class="filters" id="dash-filters">
            ${selectCtl('quartier', 'Quartier', [...new Set(properties.map(p => p.quartier))], state.dashFilters.quartier, I.pin)}
            ${selectCtl('type', 'Type', [...new Set(properties.map(p => p.type))], state.dashFilters.type, I.home)}
            ${selectCtl('statut', 'Statut', [...new Set(properties.map(p => p.statut))], state.dashFilters.statut, I.tag)}
            <span class="spacer"></span>
            <label class="input" style="min-width:200px">${I.search}<input type="search" id="dash-q" placeholder="Rechercher un bien" value="${esc(state.dashFilters.q)}" /></label>
            <a class="card-link" href="#/biens" aria-label="Ouvrir les biens">${I.arrow}</a>
          </div>
          <div class="table-wrap" id="dash-table"></div>
        </div>
        <div class="card map-card">
          <div class="card-head"><h3 class="card-title">Carte des biens</h3><a class="card-link" href="#/biens" data-mode="map" aria-label="Agrandir">${I.arrow}</a></div>
          <div id="map"></div>
          <div class="map-legend"><span class="pill-glass"><i style="width:8px;height:8px;border-radius:50%;background:#1A1917;display:inline-block"></i> Vente</span><span class="pill-glass"><i style="width:8px;height:8px;border-radius:50%;background:#C9A46A;display:inline-block"></i> Location</span></div>
        </div>
      </div>

      <div class="grid dash-three" style="margin-top:16px">
        <div class="card">
          <div class="card-head"><div><h3 class="card-title">Équipe</h3><div class="card-sub">Progression vs objectif annuel</div></div><a class="card-link" href="#/agents" aria-label="Voir l’équipe">${I.arrow}</a></div>
          <div class="team-list">${[...agents].sort((a, b) => b.ca - a.ca).map(a => `<div class="team-item">${avatar(a, 'sm')}<div><b>${esc(a.nom)}</b><small>${a.ventes} transactions · ${esc(a.role)}</small><div class="prog"><i data-w="${Math.round(a.ca / a.objectif * 100)}" style="background:${a.couleur}"></i></div></div><div class="num">${money(a.ca, { short: true })}<small>${Math.round(a.ca / a.objectif * 100)} %</small></div></div>`).join('')}</div>
        </div>
        <div class="card">
          <div class="card-head"><div><h3 class="card-title">Activité récente</h3><div class="card-sub">Fil d’équipe</div></div></div>
          <div class="feed">${activites.map(ac => { const a = agentOf(ac.agent); return `<div class="feed-item">${avatar(a, 'xs')}<div><p><b>${esc(a.nom.split(' ')[0])}</b> ${esc(ac.action)} <b>${esc(ac.cible)}</b></p><small>${esc(ac.temps)}</small></div></div>`; }).join('')}</div>
        </div>
        <div class="card">
          <div class="card-head"><div><h3 class="card-title">Origine des contacts</h3><div class="card-sub">30 derniers jours</div></div></div>
          <div class="chart-box short"><canvas id="ch-leads"></canvas></div>
          <div class="legend" style="margin-top:12px;justify-content:center">${Object.entries(leadsSources).map(([k, v], i) => `<span><i style="background:${['#1A1917', '#C9A46A', '#8A9A7B', '#B07C6C', '#D9D6CE'][i]}"></i>${k} ${v} %</span>`).join('')}</div>
        </div>
      </div>`;

    renderDashTable();
    animateBars(v);
    // Chart leads
    const th = chartTheme();
    mkChart('ch-leads', { type: 'doughnut', data: { labels: Object.keys(leadsSources), datasets: [{ data: Object.values(leadsSources), backgroundColor: [th.ink, th.accent, th.sage, th.terra, th.muted], borderWidth: 0, hoverOffset: 6 }] }, options: { cutout: '72%', plugins: { tooltip: { callbacks: { label: c => ` ${c.label} : ${c.parsed} %` } } } } });
    // Filtres
    $('#dash-filters').addEventListener('change', e => { if (e.target.dataset.key) { state.dashFilters[e.target.dataset.key] = e.target.value; state.dashPage = 1; renderDashTable(); } });
    $('#dash-q').addEventListener('input', e => { state.dashFilters.q = e.target.value; state.dashPage = 1; renderDashTable(); });
    $('#avg-seg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; state.avgPeriod = b.dataset.p; $$('#avg-seg button').forEach(x => x.classList.toggle('active', x === b)); toast('Période : ' + b.textContent); });
    setTimeout(() => initMap('map', properties), 50);
  }

  function kpiCompact(label, value, unit, d, spark, sub) {
    return `<div class="card kpi compact"><div class="card-head" style="margin:0"><h3 class="card-title" style="font-size:14px">${label}</h3>${delta(d, unit === '%' ? ' pt' : '%')}</div><div class="kpi-value">${typeof value === 'number' ? value.toLocaleString('fr-FR') : value}<span class="unit">${unit}</span></div><div class="kpi-foot"><span class="label">${sub}</span>${sparkline(spark)}</div></div>`;
  }
  function selectCtl(key, label, options, value, icon) {
    return `<label class="select">${icon || ''}<select data-key="${key}" aria-label="${label}"><option value="">${label}</option>${options.map(o => `<option ${o === value ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`;
  }
  function agendaItem(a) {
    const p = a.bien ? propOf(a.bien) : null; const c = a.client ? clientOf(a.client) : null; const ag = agentOf(a.agent);
    return `<div class="agenda-item" data-rdv="${a.id}"><time>${a.heure}<small>${a.duree} min</small></time><span class="bar ${a.type.toLowerCase()}"></span><div><b>${a.type}${p ? ' · ' + esc(p.titre) : a.lieu ? ' · ' + esc(a.lieu) : ''}</b><small>${c ? esc(c.nom) + ' · ' : ''}${esc(ag.nom)}</small></div><span class="tag ${rdvTag(a.statut)}">${a.statut}</span></div>`;
  }
  function propCard(p) {
    const fav = state.favs.has(p.id);
    return `<article class="prop" data-prop="${p.id}" tabindex="0" role="button" aria-label="${esc(p.titre)}">
      <div class="prop-img"><img src="${p.img}" alt="${esc(p.titre)}" loading="lazy" />
        <div class="ov"><button class="fav ${fav ? 'on' : ''}" data-fav="${p.id}" aria-label="Favori">${fav ? I.heart : I.heartO}</button><button class="dark" aria-label="Ouvrir">${I.arrow}</button></div>
        <div class="bl"><span class="pill-glass">${p.transaction === 'Location' ? 'À louer' : 'À vendre'}</span><span class="pill-glass">${I.star} ${p.note.toFixed(1)}</span>${p.exclusif ? '<span class="pill-glass" style="background:#1A1917;color:#fff">Exclusivité</span>' : ''}</div>
      </div>
      <div class="prop-body">
        <div class="prop-title"><h4>${esc(p.titre)}</h4><span class="price">${priceOf(p)}</span></div>
        <div class="prop-addr">${esc(p.adresse)}</div>
        <div class="specs">${p.surface ? `<span>${I.area}${p.surface} m²</span>` : `<span>${I.area}${p.terrain} m² terrain</span>`}${p.chambres ? `<span>${I.bed}${p.chambres} ch.</span>` : ''}${p.sdb ? `<span>${I.bath}${p.sdb} sdb</span>` : ''}${p.garage ? `<span>${I.car}${p.garage}</span>` : ''}</div>
      </div></article>`;
  }
  function animateBars(root) { requestAnimationFrame(() => setTimeout(() => $$('[data-w]', root).forEach(el => el.style.width = el.dataset.w + '%'), 40)); }

  function filteredDash() {
    const f = state.dashFilters; const q = f.q.toLowerCase();
    let rows = properties.filter(p => (!f.quartier || p.quartier === f.quartier) && (!f.type || p.type === f.type) && (!f.statut || p.statut === f.statut) && (!q || (p.titre + p.adresse + p.quartier + agentOf(p.agent).nom).toLowerCase().includes(q)));
    const { key, dir } = f.sort;
    rows.sort((a, b) => { const va = key === 'agent' ? agentOf(a.agent).nom : a[key]; const vb = key === 'agent' ? agentOf(b.agent).nom : b[key]; return (va > vb ? 1 : va < vb ? -1 : 0) * dir; });
    return rows;
  }
  function renderDashTable() {
    const rows = filteredDash(); const per = 5; const pages = Math.max(1, Math.ceil(rows.length / per)); state.dashPage = Math.min(state.dashPage, pages);
    const slice = rows.slice((state.dashPage - 1) * per, state.dashPage * per);
    const th = (k, label, cls = '') => `<th class="sortable ${cls}" data-sort="${k}">${label}${state.dashFilters.sort.key === k ? `<span class="sort">${state.dashFilters.sort.dir > 0 ? '↑' : '↓'}</span>` : ''}</th>`;
    $('#dash-table').innerHTML = `<table><thead><tr>${th('titre', 'Bien')}${th('type', 'Type')}${th('agent', 'Agent')}${th('prix', 'Prix')}${th('vues', 'Vues')}${th('statut', 'Statut')}<th style="text-align:right">Actions</th></tr></thead>
      <tbody>${slice.length ? slice.map(p => { const a = agentOf(p.agent); return `<tr class="clickable" data-prop="${p.id}"><td><div class="cell-prop"><img src="${p.img}" alt="" /><div><b>${esc(p.titre)}</b><small>${esc(p.adresse)}</small></div></div></td><td>${p.type}</td><td><div class="cell-agent">${avatar(a, 'xs')}${esc(a.nom)}</div></td><td class="num" style="font-weight:600">${priceOf(p)}</td><td class="num">${nf.format(p.vues)} vues</td><td><span class="tag ${statutTag(p.statut)}">${p.statut}</span></td><td><div class="row-actions"><button aria-label="Voir" data-prop="${p.id}">${I.eye}</button><button aria-label="Modifier" data-edit="${p.id}">${I.edit}</button><button aria-label="Plus" data-more="${p.id}">${I.more}</button></div></td></tr>`; }).join('') : `<tr><td colspan="7"><div class="empty">${I.search}<br>Aucun bien ne correspond à ces filtres.</div></td></tr>`}</tbody></table>
      <div class="table-foot"><span>${rows.length} bien${rows.length > 1 ? 's' : ''} · page ${state.dashPage}/${pages}</span><div class="pager">${Array.from({ length: pages }, (_, i) => `<button class="${i + 1 === state.dashPage ? 'active' : ''}" data-page="${i + 1}">${i + 1}</button>`).join('')}</div></div>`;
    $$('#dash-table th.sortable').forEach(h => h.onclick = () => { const k = h.dataset.sort; const s = state.dashFilters.sort; s.dir = s.key === k ? -s.dir : 1; s.key = k; renderDashTable(); });
    $$('#dash-table [data-page]').forEach(b => b.onclick = () => { state.dashPage = +b.dataset.page; renderDashTable(); });
  }

  /* ---------- Carte Leaflet ---------- */
  function initMap(id, list) {
    const el = document.getElementById(id); if (!el || typeof L === 'undefined') return;
    if (state.maps[id]) { state.maps[id].remove(); }
    const map = L.map(el, { zoomControl: false, attributionControl: true, scrollWheelZoom: false }).setView([36.762, 2.975], 12);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    list.forEach(p => {
      const cls = ['Vendu', 'Loué'].includes(p.statut) ? 'sold' : p.transaction === 'Location' ? 'loc' : '';
      const m = L.marker([p.lat, p.lng], { icon: L.divIcon({ className: 'leaflet-div-icon', html: `<div class="price-marker ${cls}">${priceOf(p)}</div>`, iconSize: [0, 0] }) }).addTo(map);
      m.on('click', () => openProp(p.id));
      m.bindTooltip(p.titre, { direction: 'top', offset: [0, -14] });
    });
    state.maps[id] = map;
    setTimeout(() => { map.invalidateSize(); if (list.length) map.fitBounds(L.latLngBounds(list.map(p => [p.lat, p.lng])), { padding: [36, 36] }); }, 200);
  }

  /* ============================================================
     BIENS
     ============================================================ */
  function renderBiens() {
    const v = $('#view-biens'); const f = state.biensFilters;
    v.innerHTML = `
      <div class="page-head"><div><h2>Portefeuille de biens</h2><p>${properties.length} biens · ${properties.filter(p => p.statut === 'Disponible').length} disponibles · ${properties.filter(p => p.exclusif).length} mandats exclusifs</p></div>
        <div class="actions"><button class="btn" data-action="export-biens">${I.download} Exporter</button><button class="btn primary" data-action="add-bien">${I.plus} Ajouter un bien</button></div></div>
      <div class="grid kpi-row" style="margin-bottom:16px">
        ${kpiCompact('Valeur du portefeuille', money(properties.filter(p => p.transaction === 'Vente' && p.statut !== 'Vendu').reduce((s, p) => s + p.prix, 0), { short: true }), '', 8, [60, 65, 70, 68, 74, 80, 85], 'biens à la vente')}
        ${kpiCompact('Loyers mensuels gérés', money(properties.filter(p => p.transaction === 'Location').reduce((s, p) => s + p.prix, 0), { short: true }), '', 5, [2, 2.2, 2.4, 2.3, 2.6, 2.7, 2.7], 'portefeuille locatif')}
        ${kpiCompact('Délai moyen de vente', 54, ' j', -6, [70, 66, 62, 60, 58, 55, 54], 'mandat → compromis')}
        ${kpiCompact('Vues cumulées', properties.reduce((s, p) => s + p.vues, 0), '', 22, [900, 1200, 1100, 1500, 1700, 1600, 2100], '30 derniers jours')}
      </div>
      <div class="card">
        <div class="filters" id="biens-filters">
          <label class="input" style="min-width:220px">${I.search}<input type="search" data-key="q" placeholder="Titre, adresse, quartier…" value="${esc(f.q)}" /></label>
          ${selectCtl('transaction', 'Vente / Location', ['Vente', 'Location'], f.transaction, I.tag)}
          ${selectCtl('quartier', 'Quartier', [...new Set(properties.map(p => p.quartier))].sort(), f.quartier, I.pin)}
          ${selectCtl('type', 'Type', [...new Set(properties.map(p => p.type))], f.type, I.home)}
          ${selectCtl('statut', 'Statut', [...new Set(properties.map(p => p.statut))], f.statut, I.filter)}
          <label class="select">${I.trend}<select data-key="tri" aria-label="Trier"><option value="recent" ${f.tri === 'recent' ? 'selected' : ''}>Plus récents</option><option value="prix-desc" ${f.tri === 'prix-desc' ? 'selected' : ''}>Prix décroissant</option><option value="prix-asc" ${f.tri === 'prix-asc' ? 'selected' : ''}>Prix croissant</option><option value="vues" ${f.tri === 'vues' ? 'selected' : ''}>Plus consultés</option><option value="surface" ${f.tri === 'surface' ? 'selected' : ''}>Surface</option></select></label>
          <span class="spacer"></span>
          <div class="segmented" id="biens-mode"><button data-mode="grid" class="${f.mode === 'grid' ? 'active' : ''}" aria-label="Grille">${I.grid}</button><button data-mode="list" class="${f.mode === 'list' ? 'active' : ''}" aria-label="Liste">${I.list}</button><button data-mode="map" class="${f.mode === 'map' ? 'active' : ''}" aria-label="Carte">${I.pin}</button></div>
        </div>
        <div id="biens-body"></div>
      </div>`;
    $('#biens-filters').addEventListener('input', e => { if (e.target.dataset.key) { f[e.target.dataset.key] = e.target.value; renderBiensBody(); } });
    $('#biens-mode').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; f.mode = b.dataset.mode; $$('#biens-mode button').forEach(x => x.classList.toggle('active', x === b)); renderBiensBody(); });
    renderBiensBody();
  }
  function filteredBiens() {
    const f = state.biensFilters; const q = f.q.toLowerCase();
    let rows = properties.filter(p => (!f.transaction || p.transaction === f.transaction) && (!f.quartier || p.quartier === f.quartier) && (!f.type || p.type === f.type) && (!f.statut || p.statut === f.statut) && (!q || (p.titre + ' ' + p.adresse + ' ' + p.quartier).toLowerCase().includes(q)));
    const s = { 'recent': (a, b) => b.ajout.localeCompare(a.ajout), 'prix-desc': (a, b) => b.prix - a.prix, 'prix-asc': (a, b) => a.prix - b.prix, 'vues': (a, b) => b.vues - a.vues, 'surface': (a, b) => (b.surface || b.terrain) - (a.surface || a.terrain) }[f.tri];
    return rows.sort(s);
  }
  function renderBiensBody() {
    const rows = filteredBiens(); const body = $('#biens-body'); const mode = state.biensFilters.mode;
    if (!rows.length) { body.innerHTML = `<div class="empty">${I.search}<br>Aucun bien ne correspond. <button class="btn sm ghost" data-action="reset-biens">Réinitialiser les filtres</button></div>`; return; }
    if (mode === 'grid') body.innerHTML = `<div class="props" style="grid-template-columns:repeat(4,1fr)">${rows.map(propCard).join('')}</div>`;
    else if (mode === 'list') body.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Bien</th><th>Type</th><th>Transaction</th><th>Surface</th><th>Prix</th><th>Agent</th><th>Ajouté</th><th>Vues</th><th>Statut</th><th style="text-align:right">Actions</th></tr></thead><tbody>${rows.map(p => { const a = agentOf(p.agent); return `<tr class="clickable" data-prop="${p.id}"><td><div class="cell-prop"><img src="${p.img}" alt="" /><div><b>${esc(p.titre)}</b><small>${esc(p.adresse)}</small></div></div></td><td>${p.type}</td><td>${p.transaction}</td><td class="num">${p.surface ? p.surface + ' m²' : p.terrain + ' m² (terrain)'}</td><td class="num" style="font-weight:600">${priceOf(p)}</td><td><div class="cell-agent">${avatar(a, 'xs')}${esc(a.nom.split(' ')[0])}</div></td><td>${dateFR(p.ajout)}</td><td class="num">${nf.format(p.vues)}</td><td><span class="tag ${statutTag(p.statut)}">${p.statut}</span></td><td><div class="row-actions"><button aria-label="Voir" data-prop="${p.id}">${I.eye}</button><button aria-label="Modifier" data-edit="${p.id}">${I.edit}</button></div></td></tr>`; }).join('')}</tbody></table></div><div class="table-foot"><span>${rows.length} biens</span></div>`;
    else { body.innerHTML = `<div class="map-card card flat" style="min-height:560px;border:0;padding:0"><div id="map-biens" style="min-height:560px;border-radius:18px"></div></div>`; setTimeout(() => initMap('map-biens', rows), 30); }
  }

  /* ============================================================
     RENDEZ-VOUS
     ============================================================ */
  function weekStart(offset = 0) { const d = new Date(TODAY + 'T00:00:00'); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day + offset * 7); return d.toISOString().slice(0, 10); }
  function renderAgenda() {
    const v = $('#view-agenda'); const ws = weekStart(state.weekOffset); const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
    const hours = Array.from({ length: 12 }, (_, i) => 8 + i);
    const weekRdv = appointments.filter(a => a.date >= days[0] && a.date <= days[6]);
    const upcoming = appointments.filter(a => a.date >= TODAY && a.statut !== 'Annulé' && a.statut !== 'Terminé').sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure));
    const byType = t => weekRdv.filter(a => a.type === t && a.statut !== 'Annulé').length;
    v.innerHTML = `
      <div class="page-head"><div><h2>Rendez-vous</h2><p>Semaine du ${dateFR(days[0])} au ${dateFR(days[6], { day: 'numeric', month: 'short', year: 'numeric' })} · ${weekRdv.filter(a => a.statut !== 'Annulé').length} rendez-vous</p></div>
        <div class="actions"><div class="segmented"><button id="wk-prev" aria-label="Semaine précédente">${I.chevL}</button><button id="wk-today" class="active">Aujourd’hui</button><button id="wk-next" aria-label="Semaine suivante">${I.chevR}</button></div><button class="btn primary" data-action="add-rdv">${I.plus} Planifier</button></div></div>
      <div class="grid kpi-row" style="margin-bottom:16px">
        ${kpiCompact('Visites', byType('Visite'), '', 12, [4, 6, 5, 7, 6, 8, byType('Visite')], 'cette semaine')}
        ${kpiCompact('Signatures', byType('Signature'), '', 1, [1, 0, 2, 1, 1, 2, byType('Signature')], 'compromis & baux')}
        ${kpiCompact('Estimations', byType('Estimation'), '', 0, [1, 2, 1, 1, 2, 1, byType('Estimation')], 'nouveaux mandats potentiels')}
        ${kpiCompact('Taux de présence', 94, '%', 2, [88, 90, 91, 92, 93, 93, 94], 'visites honorées')}
      </div>
      <div class="grid agenda-grid">
        <div class="card">
          <div class="card-head"><h3 class="card-title">Planning</h3><div class="legend"><span><i style="background:var(--accent)"></i>Visite</span><span><i style="background:var(--ink)"></i>Signature</span><span><i style="background:var(--sage)"></i>Estimation</span><span><i style="background:var(--slate)"></i>Appel</span><span><i style="background:var(--terra)"></i>Shooting</span></div></div>
          <div class="week-wrap"><div class="week">
            <div class="wh"></div>${days.map(d => `<div class="wh ${d === TODAY ? 'today' : ''}">${dateFR(d, { weekday: 'short' })}<b>${+d.slice(8)}</b></div>`).join('')}
            ${hours.map(h => `<div class="hour">${String(h).padStart(2, '0')}:00</div>${days.map(d => { const evts = weekRdv.filter(a => a.date === d && +a.heure.slice(0, 2) === h); return `<div class="cell">${evts.map(a => { const top = (+a.heure.slice(3)) / 60 * 56; const hgt = Math.max(28, a.duree / 60 * 56 - 4); const p = a.bien ? propOf(a.bien) : null; return `<div class="evt ${a.type.toLowerCase()} ${a.statut === 'Annulé' ? 'annule' : ''}" style="top:${top}px;height:${hgt}px" data-rdv="${a.id}" title="${a.type}">${a.type}<small>${p ? esc(p.titre) : esc(a.lieu || '')}</small></div>`; }).join('')}</div>`; }).join('')}`).join('')}
          </div></div>
        </div>
        <div class="col">
          <div class="card"><div class="card-head"><div><h3 class="card-title">Tâches du jour</h3><div class="card-sub">${taches.filter(isLate).length} en retard · ${taches.filter(t => isToday(t) && !isDone(t)).length} aujourd’hui</div></div><a class="card-link" href="#/taches" aria-label="Toutes les tâches">${I.arrow}</a></div>
            ${(() => { const l = taches.filter(t => !isDone(t) && t.echeance <= TODAY).sort((a, b) => a.echeance.localeCompare(b.echeance) || (a.heure || '99').localeCompare(b.heure || '99')); return l.length ? l.slice(0, 5).map(tacheMini).join('') : `<div class="empty" style="padding:16px">Rien à faire aujourd’hui.</div>`; })()}</div>
          <div class="card"><div class="card-head"><h3 class="card-title">À venir</h3><span class="tag muted no-dot">${upcoming.length}</span></div>
            <div class="agenda-list">${upcoming.slice(0, 7).map(a => `<div class="agenda-item" data-rdv="${a.id}"><time>${a.heure}<small>${dateFR(a.date)}</small></time><span class="bar ${a.type.toLowerCase()}"></span><div><b>${a.type}${a.bien ? ' · ' + esc(propOf(a.bien).titre) : a.lieu ? ' · ' + esc(a.lieu) : ''}</b><small>${a.client ? esc(clientOf(a.client).nom) : 'Interne'} · ${esc(agentOf(a.agent).nom.split(' ')[0])}</small></div><span class="tag ${rdvTag(a.statut)}">${a.statut}</span></div>`).join('')}</div></div>
          <div class="card"><div class="card-head"><h3 class="card-title">Disponibilité de l’équipe</h3></div>
            <div class="team-list">${agents.map(a => { const n = appointments.filter(x => x.agent === a.id && x.date === TODAY && x.statut !== 'Annulé').length; return `<div class="team-item">${avatar(a, 'sm')}<div><b>${esc(a.nom)}</b><small>${n} rendez-vous aujourd’hui</small></div><span class="tag ${n >= 3 ? 'warn' : 'ok'}">${n >= 3 ? 'Chargé' : 'Disponible'}</span></div>`; }).join('')}</div></div>
        </div>
      </div>`;
    $('#wk-prev').onclick = () => { state.weekOffset--; renderAgenda(); };
    $('#wk-next').onclick = () => { state.weekOffset++; renderAgenda(); };
    $('#wk-today').onclick = () => { state.weekOffset = 0; renderAgenda(); };
  }

  /* ============================================================
     MESSAGES
     ============================================================ */
  function renderMessages() {
    const v = $('#view-messages');
    const conv = conversations.find(c => c.id === state.conv) || conversations[0]; conv.nonLus = 0; const c = clientOf(conv.client); const ag = agentOf(c.agent); const p = c.interet ? propOf(c.interet) : null;
    v.innerHTML = `
      <div class="page-head"><div><h2>Messages</h2><p>${conversations.reduce((s, c) => s + c.nonLus, 0)} messages non lus · temps de réponse moyen 14 min</p></div><div class="actions"><button class="btn" data-action="show-list" id="btn-show-list" style="display:none">${I.list} Conversations</button><button class="btn primary" data-action="new-msg">${I.plus} Nouveau message</button></div></div>
      <div class="card chat" id="chat">
        <aside class="chat-list">
          <label class="input">${I.search}<input type="search" id="conv-q" placeholder="Rechercher une conversation" /></label>
          <div id="conv-list">${conversations.map(cv => { const cl = clientOf(cv.client); const last = cv.messages.at(-1); return `<div class="conv ${cv.id === conv.id ? 'active' : ''}" data-conv="${cv.id}">${avatarClient(cl, 'sm')}<div><b>${esc(cl.nom)}</b><small>${esc(last.texte)}</small></div><div class="meta">${esc(last.heure.split(' ')[0])}${cv.nonLus ? `<br><span class="unread">${cv.nonLus}</span>` : ''}</div></div>`; }).join('')}</div>
        </aside>
        <div class="chat-main">
          <div class="chat-head"><div style="display:flex;align-items:center;gap:12px">${avatarClient(c)}<div><b>${esc(c.nom)}</b><small>${c.type} · ${p ? 'Intéressé par ' + esc(p.titre) : 'Sans bien associé'} · suivi par ${esc(ag.nom.split(' ')[0])}</small></div></div>
            <div style="display:flex;gap:6px"><button class="icon-btn" style="width:36px;height:36px" aria-label="Appeler" data-action="call" data-tel="${c.tel}">${I.phone}</button><button class="icon-btn" style="width:36px;height:36px" aria-label="Fiche client" data-client="${c.id}">${I.user}</button>${p ? `<button class="icon-btn" style="width:36px;height:36px" aria-label="Voir le bien" data-prop="${p.id}">${I.home}</button>` : ''}</div></div>
          <div class="chat-body" id="chat-body">${conv.messages.map(m => `<div class="bubble ${m.de}">${esc(m.texte)}<time>${esc(m.heure)}</time></div>`).join('')}</div>
          <form class="chat-compose" id="chat-form"><label class="input"><input type="text" id="chat-input" placeholder="Écrire à ${esc(c.nom.split(' ')[0])}…" autocomplete="off" /></label><button class="btn" type="button" data-action="attach" title="Joindre un document">${I.doc}</button><button class="btn primary" type="submit">${I.send} Envoyer</button></form>
        </div>
      </div>`;
    conv.nonLus = 0; updateBadges();
    $('#conv-list').addEventListener('click', e => { const el = e.target.closest('[data-conv]'); if (el) { state.conv = el.dataset.conv; renderMessages(); } });
    $('#conv-q').addEventListener('input', e => { const q = e.target.value.toLowerCase(); $$('#conv-list .conv').forEach(el => el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none'); });
    $('#chat-form').addEventListener('submit', e => { e.preventDefault(); const inp = $('#chat-input'); const t = inp.value.trim(); if (!t) return; const now = new Date(); conv.messages.push({ de: 'agent', texte: t, heure: now.toTimeString().slice(0, 5) }); inp.value = ''; renderMessages(); const b = $('#chat-body'); b.scrollTop = b.scrollHeight; });
    const b = $('#chat-body'); b.scrollTop = b.scrollHeight;
  }

  /* ============================================================
     CLIENTS (CRM)
     ============================================================ */
  function renderClients() {
    const v = $('#view-clients');
    v.innerHTML = `
      <div class="page-head"><div><h2>Clients & prospects</h2><p>${clients.length} contacts · ${clients.filter(c => c.etape === 'Nouveau').length} nouveaux à qualifier</p></div>
        <div class="actions"><div class="segmented" id="clients-mode"><button data-mode="kanban" class="${state.clientsMode === 'kanban' ? 'active' : ''}">Pipeline</button><button data-mode="table" class="${state.clientsMode === 'table' ? 'active' : ''}">Tableau</button></div><button class="btn primary" data-action="add-client">${I.plus} Nouveau contact</button></div></div>
      <div class="grid kpi-row" style="margin-bottom:16px">
        ${kpiCompact('Acheteurs actifs', clients.filter(c => c.type === 'Acheteur').length, '', 2, [3, 3, 4, 4, 5, 5, 5], 'en recherche')}
        ${kpiCompact('Vendeurs', clients.filter(c => c.type === 'Vendeur').length, '', 0, [1, 2, 2, 2, 2, 2, 2], 'mandats en cours')}
        ${kpiCompact('Locataires', clients.filter(c => c.type === 'Locataire').length, '', 1, [2, 2, 3, 3, 3, 3, 3], 'dossiers ouverts')}
        ${kpiCompact('Investisseurs', clients.filter(c => c.type === 'Investisseur').length, '', 1, [1, 1, 1, 1, 2, 2, 2], 'budget > 200 M')}
      </div>
      <div class="card"><div id="clients-body"></div></div>
      <div class="card" style="margin-top:16px"><div class="card-head"><div><h3 class="card-title">Meilleures correspondances</h3><div class="card-sub">Prospects et biens compatibles · calculé sur budget, quartier, type et chambres</div></div><span class="tag muted no-dot">${allMatches().length} paires</span></div>
        <div class="match-grid">${allMatches().slice(0, 6).map(x => `<div class="match-pair"><div class="match-pair-head" data-client="${x.c.id}">${avatarClient(x.c, 'sm')}<div><b>${esc(x.c.nom)}</b><small>${x.c.type} · ${money(x.c.budget, { short: true })}</small></div><span class="tag ${scoreTag(x.m.score)} no-dot" style="margin-left:auto">${x.m.score} %</span></div><div class="match-pair-prop" data-prop="${x.p.id}"><img src="${x.p.img}" alt="" /><div><b>${esc(x.p.titre)}</b><small>${esc(x.p.quartier)} · ${priceOf(x.p)}</small></div>${I.arrow}</div><div class="match-why">${x.m.why.slice(0, 3).map(w => `<span>${esc(w)}</span>`).join('')}</div></div>`).join('')}</div></div>`;
    $('#clients-mode').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; state.clientsMode = b.dataset.mode; $$('#clients-mode button').forEach(x => x.classList.toggle('active', x === b)); renderClientsBody(); });
    renderClientsBody();
  }
  function renderClientsBody() {
    const body = $('#clients-body');
    if (state.clientsMode === 'kanban') {
      body.innerHTML = `<div class="kanban">${pipelineEtapes.map(e => { const list = clients.filter(c => c.etape === e); return `<div class="kcol" data-etape="${e}"><div class="kcol-head">${e}<span>${list.length}</span></div>${list.map(c => { const a = agentOf(c.agent); const p = c.interet ? propOf(c.interet) : null; return `<div class="kcard" draggable="true" data-client="${c.id}"><b>${esc(c.nom)}</b><small>${c.type}${c.budget ? ' · ' + money(c.budget, { short: true }) : ''}</small>${p ? `<small style="margin-top:4px">${I.home.replace('<svg', '<svg style="width:10px;height:10px;vertical-align:-1px"')} ${esc(p.titre)}</small>` : ''}<div class="kfoot"><span class="score"><i><b style="width:${c.score}%"></b></i>${c.score}</span>${avatar(a, 'xs')}</div></div>`; }).join('')}</div>`; }).join('')}</div>`;
      // Drag & drop
      let dragged = null;
      $$('.kcard', body).forEach(k => { k.addEventListener('dragstart', () => { dragged = k; k.classList.add('dragging'); }); k.addEventListener('dragend', () => { k.classList.remove('dragging'); dragged = null; }); });
      $$('.kcol', body).forEach(col => {
        col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('over'); });
        col.addEventListener('dragleave', () => col.classList.remove('over'));
        col.addEventListener('drop', e => { e.preventDefault(); col.classList.remove('over'); if (!dragged) return; const c = clientOf(dragged.dataset.client); c.etape = col.dataset.etape; toast(`${c.nom} → ${c.etape}`); renderClientsBody(); });
      });
    } else {
      body.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Contact</th><th>Type</th><th>Budget</th><th>Bien d’intérêt</th><th>Étape</th><th>Agent</th><th>Source</th><th>Dernier contact</th><th>Score</th><th style="text-align:right">Actions</th></tr></thead><tbody>${[...clients].sort((a, b) => b.dernier.localeCompare(a.dernier)).map(c => { const a = agentOf(c.agent); const p = c.interet ? propOf(c.interet) : null; return `<tr class="clickable" data-client="${c.id}"><td><div class="cell-agent">${avatarClient(c, 'sm')}<div><b style="display:block;font-weight:600">${esc(c.nom)}</b><small style="color:var(--ink-3)">${esc(c.email)}</small></div></div></td><td>${c.type}</td><td class="num">${c.budget ? money(c.budget, { short: true }) : '—'}</td><td>${p ? esc(p.titre) : '—'}</td><td><span class="tag ${etapeTag(c.etape)}">${c.etape}</span></td><td><div class="cell-agent">${avatar(a, 'xs')}${esc(a.nom.split(' ')[0])}</div></td><td>${c.source}</td><td>${dateFR(c.dernier)}</td><td><span class="score"><i><b style="width:${c.score}%"></b></i>${c.score}</span></td><td><div class="row-actions"><button aria-label="Appeler" data-action="call" data-tel="${c.tel}">${I.phone}</button><button aria-label="Message" data-action="msg-client" data-client-msg="${c.id}">${I.mail}</button><button aria-label="Fiche" data-client="${c.id}">${I.eye}</button></div></td></tr>`; }).join('')}</tbody></table></div>`;
    }
  }

  /* ============================================================
     ÉQUIPE
     ============================================================ */
  function renderAgents() {
    const v = $('#view-agents');
    v.innerHTML = `
      <div class="page-head"><div><h2>Équipe</h2><p>${agents.length} conseillers · ${agents.reduce((s, a) => s + a.ventes, 0)} transactions cette année</p></div><div class="actions"><button class="btn" data-action="export-agents">${I.download} Rapport</button><button class="btn primary" data-action="add-agent">${I.plus} Inviter un conseiller</button></div></div>
      <div class="grid agent-grid" style="margin-bottom:16px">${[...agents].sort((a, b) => b.ca - a.ca).map((a, i) => `<div class="card agent-card" data-agent="${a.id}">
        <div class="top">${avatar(a, 'lg')}<div><b>${esc(a.nom)}</b><small>${esc(a.role)} · ${I.star.replace('<svg', '<svg style="width:11px;height:11px;vertical-align:-1px"')} ${a.note}</small></div></div>${i === 0 ? '<span class="tag warn no-dot top-badge">Top vendeuse</span>' : ''}
        <div class="stat3"><div><b>${a.ventes}</b><small>Transactions</small></div><div><b>${money(a.ca, { short: true })}</b><small>Volume</small></div><div><b>${a.mandats}</b><small>Mandats actifs</small></div></div>
        <div class="objective"><span>Objectif annuel</span><span>${Math.round(a.ca / a.objectif * 100)} % de ${money(a.objectif, { short: true })}</span></div><div class="progress"><i data-w="${Math.round(a.ca / a.objectif * 100)}" style="background:${a.couleur}"></i></div>
        <div style="display:flex;gap:6px;margin-top:14px"><button class="btn sm" data-action="call" data-tel="${a.tel}">${I.phone} Appeler</button><button class="btn sm" data-action="mail" data-mail="${a.email}">${I.mail} E-mail</button><button class="btn sm ghost" data-agent-detail="${a.id}">Portefeuille</button></div>
      </div>`).join('')}</div>
      <div class="grid team-grid">
        <div class="card"><div class="card-head"><div><h3 class="card-title">Volume par conseiller</h3><div class="card-sub">Année 2026 · en millions</div></div></div><div class="chart-box"><canvas id="ch-agents"></canvas></div></div>
        <div class="card"><div class="card-head"><div><h3 class="card-title">Classement</h3><div class="card-sub">Mois en cours</div></div></div>
          <div class="table-wrap"><table><thead><tr><th>#</th><th>Conseiller</th><th>Visites</th><th>Offres</th><th>Signatures</th></tr></thead><tbody>${[...agents].sort((a, b) => b.ca - a.ca).map((a, i) => `<tr><td class="num">${i + 1}</td><td><div class="cell-agent">${avatar(a, 'xs')}${esc(a.nom)}</div></td><td class="num">${appointments.filter(x => x.agent === a.id && x.type === 'Visite').length + 6 - i}</td><td class="num">${[4, 3, 2, 2, 1][i]}</td><td class="num">${[3, 2, 2, 1, 1][i]}</td></tr>`).join('')}</tbody></table></div></div>
      </div>`;
    animateBars(v);
    const th = chartTheme(); const sorted = [...agents].sort((a, b) => b.ca - a.ca);
    mkChart('ch-agents', { type: 'bar', data: { labels: sorted.map(a => a.nom.split(' ')[0]), datasets: [{ label: 'Réalisé', data: sorted.map(a => a.ca / 1e6), backgroundColor: sorted.map(a => a.couleur), borderRadius: 8, barThickness: 28 }, { label: 'Objectif', data: sorted.map(a => a.objectif / 1e6), backgroundColor: th.muted, borderRadius: 8, barThickness: 28 }] }, options: { plugins: { legend: { display: true, position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }, tooltip: { callbacks: { label: c => ` ${c.dataset.label} : ${c.parsed.y.toLocaleString('fr-FR')} M€` } } }, scales: { y: { grid: { color: Chart.defaults.borderColor }, ticks: { callback: v => v + ' M€' } }, x: { grid: { display: false } } } } });
  }

  /* ============================================================
     FINANCES
     ============================================================ */
  function renderFinances() {
    const v = $('#view-finances');
    const caAnnuel = (caVentes.reduce((a, b) => a + b, 0) + caLocations.reduce((a, b) => a + b, 0)) * 1000;
    const enAttente = transactions.filter(t => t.statut !== 'Encaissée').reduce((s, t) => s + t.commission, 0);
    const encaisseMois = transactions.filter(t => t.statut === 'Encaissée' && t.date >= '2026-09-01').reduce((s, t) => s + t.commission, 0);
    v.innerHTML = `
      <div class="page-head"><div><h2>Finances</h2><p>Exercice 2026 · commissions, honoraires et prévisions</p></div><div class="actions"><label class="select">${I.cal}<select><option>12 derniers mois</option><option>Trimestre</option><option>Année civile</option></select></label><button class="btn" data-action="export-tx">${I.download} Exporter CSV</button></div></div>
      <div class="grid kpi-row" style="margin-bottom:16px">
        ${kpiCompact('CA sur 12 mois', money(caAnnuel, { short: true }), '', 17, caVentes.map((x, i) => x + caLocations[i]), 'commissions HT')}
        ${kpiCompact('Encaissé ce mois', money(encaisseMois, { short: true }), '', 28, [8, 9, 11, 10, 12, 13, 13.4], 'septembre 2026')}
        ${kpiCompact('En attente', money(enAttente, { short: true }), '', -4, [9, 8, 8, 7, 7, 8, 7.2], 'compromis non actés')}
        ${kpiCompact('Commission moyenne', '3,0', '%', 0.1, [2.8, 2.9, 2.9, 3.0, 3.0, 3.0, 3.0], 'sur les ventes')}
      </div>
      <div class="grid fin-grid" style="margin-bottom:16px">
        <div class="card"><div class="card-head"><div><h3 class="card-title">Chiffre d’affaires mensuel</h3><div class="card-sub">Ventes vs locations · milliers d’euros</div></div><div class="legend"><span><i style="background:var(--ink)"></i>Ventes</span><span><i style="background:var(--accent)"></i>Locations</span></div></div><div class="chart-box tall"><canvas id="ch-ca"></canvas></div></div>
        <div class="col">
          <div class="card"><div class="card-head"><div><h3 class="card-title">Répartition</h3><div class="card-sub">12 derniers mois</div></div></div><div class="chart-box short"><canvas id="ch-split"></canvas></div></div>
          <div class="card"><div class="card-head"><div><h3 class="card-title">Prix moyen au m²</h3><div class="card-sub">Côte d’Azur · secteur prestige · €/m²</div></div>${delta(14.9)}</div><div class="chart-box short"><canvas id="ch-m2"></canvas></div></div>
        </div>
      </div>
      <div class="card"><div class="card-head"><div><h3 class="card-title">Transactions</h3><div class="card-sub">${transactions.length} opérations</div></div><label class="select">${I.filter}<select id="tx-filter"><option value="">Tous les statuts</option><option>Encaissée</option><option>Compromis</option><option>En attente</option></select></label></div>
        <div class="table-wrap" id="tx-table"></div></div>`;
    const th = chartTheme();
    mkChart('ch-ca', { type: 'bar', data: { labels: moisLabels, datasets: [{ label: 'Ventes', data: caVentes, backgroundColor: th.ink, borderRadius: 6, stack: 's' }, { label: 'Locations', data: caLocations, backgroundColor: th.accent, borderRadius: 6, stack: 's' }] }, options: { interaction: { mode: 'index' }, plugins: { tooltip: { callbacks: { label: c => ` ${c.dataset.label} : ${c.parsed.y.toLocaleString('fr-FR')} k€` } } }, scales: { x: { grid: { display: false } }, y: { stacked: true, grid: { color: Chart.defaults.borderColor }, ticks: { callback: v => v + ' k€' } } } } });
    mkChart('ch-split', { type: 'doughnut', data: { labels: ['Ventes', 'Locations', 'Gestion', 'Conseil'], datasets: [{ data: [72, 16, 8, 4], backgroundColor: [th.ink, th.accent, th.sage, th.muted], borderWidth: 0, hoverOffset: 6 }] }, options: { cutout: '70%', plugins: { legend: { display: true, position: 'right', labels: { usePointStyle: true, boxWidth: 8 } }, tooltip: { callbacks: { label: c => ` ${c.label} : ${c.parsed} %` } } } } });
    mkChart('ch-m2', { type: 'line', data: { labels: moisLabels, datasets: [{ data: evolutionPrixM2, borderColor: th.accent, backgroundColor: 'rgba(201,164,106,.15)', fill: true, tension: .4, pointRadius: 0, pointHoverRadius: 4, borderWidth: 2 }] }, options: { plugins: { tooltip: { callbacks: { label: c => ` ${c.parsed.y.toLocaleString('fr-FR')} €/m²` } } }, scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 6 } }, y: { grid: { color: Chart.defaults.borderColor }, ticks: { callback: v => v + ' €' } } } } });
    const renderTx = () => { const f = $('#tx-filter').value; const rows = transactions.filter(t => !f || t.statut === f); $('#tx-table').innerHTML = `<table><thead><tr><th>Date</th><th>Bien</th><th>Type</th><th>Montant</th><th>Commission</th><th>Conseiller</th><th>Client</th><th>Statut</th></tr></thead><tbody>${rows.map(t => { const p = propOf(t.bien); const a = agentOf(t.agent); return `<tr class="clickable" data-prop="${p.id}"><td>${dateFR(t.date, { day: '2-digit', month: 'short', year: 'numeric' })}</td><td><div class="cell-prop"><img src="${p.img}" alt="" /><div><b>${esc(p.titre)}</b><small>${esc(p.quartier)}</small></div></div></td><td>${t.type}</td><td class="num">${money(t.montant, { short: true, perMonth: t.type === 'Location' })}</td><td class="num" style="font-weight:600">${money(t.commission, { short: true })}</td><td><div class="cell-agent">${avatar(a, 'xs')}${esc(a.nom.split(' ')[0])}</div></td><td>${t.client ? esc(clientOf(t.client).nom) : '—'}</td><td><span class="tag ${t.statut === 'Encaissée' ? 'ok' : t.statut === 'Compromis' ? 'warn' : 'muted'}">${t.statut}</span></td></tr>`; }).join('')}</tbody></table><div class="table-foot"><span>${rows.length} transactions</span><span>Total commissions : <b style="color:var(--ink)">${money(rows.reduce((s, t) => s + t.commission, 0), { short: true })}</b></span></div>`; };
    $('#tx-filter').onchange = renderTx; renderTx();
  }

  /* ============================================================
     PARAMÈTRES
     ============================================================ */
  function renderParametres() {
    const v = $('#view-parametres');
    const tabs = { agence: 'Agence', prefs: 'Préférences', equipe: 'Rôles & accès', integrations: 'Intégrations', notifs: 'Notifications' };
    const content = {
      agence: `<h3 class="card-title" style="margin-bottom:14px">Informations de l’agence</h3><div class="form-grid"><div class="field"><label>Nom commercial</label><input value="Maison Orée" /></div><div class="field"><label>Téléphone</label><input value="+33 4 42 96 10 20" /></div><div class="field full"><label>Adresse</label><input value="67 Cours Mirabeau, 13100 Aix-en-Provence" /></div><div class="field"><label>E-mail</label><input value="contact@triadeconceptimmo.fr" /></div><div class="field"><label>Site web</label><input value="triadeconceptimmo.fr" /></div><div class="field"><label>Commission vente par défaut</label><input value="3 %" /></div><div class="field"><label>Honoraires location</label><input value="1 mois de loyer" /></div></div><div class="modal-foot"><button class="btn primary" data-action="save">Enregistrer</button></div>`,
      prefs: `<h3 class="card-title" style="margin-bottom:6px">Préférences d’affichage</h3>
        <div class="setting-row"><div><b>Thème sombre</b><small>Interface adaptée aux environnements peu éclairés</small></div><button class="switch ${state.theme === 'dark' ? 'on' : ''}" data-action="toggle-theme" aria-label="Thème sombre"></button></div>
        <div class="setting-row"><div><b>Devise d’affichage</b><small>Tous les montants sont exprimés en euros</small></div><div class="segmented"><button class="active">€ Euro</button></div></div>
        <div class="setting-row"><div><b>Langue</b><small>Langue de l’interface</small></div><label class="select"><select><option>Français</option><option>العربية</option><option>English</option></select></label></div>
        <div class="setting-row"><div><b>Format des surfaces</b><small>Mètres carrés ou pieds carrés</small></div><label class="select"><select><option>m²</option><option>sq ft</option></select></label></div>
        <div class="setting-row"><div><b>Densité</b><small>Espacement des tableaux</small></div><div class="segmented"><button class="active">Confort</button><button>Compact</button></div></div>`,
      equipe: `<h3 class="card-title" style="margin-bottom:14px">Rôles & accès</h3><div class="table-wrap"><table><thead><tr><th>Membre</th><th>Rôle</th><th>Accès finances</th><th>Dernière connexion</th><th></th></tr></thead><tbody>${agents.map((a, i) => `<tr><td><div class="cell-agent">${avatar(a, 'sm')}<div><b style="display:block;font-weight:600">${esc(a.nom)}</b><small style="color:var(--ink-3)">${esc(a.email)}</small></div></div></td><td><label class="select" style="padding:5px 12px"><select><option ${i === 0 ? 'selected' : ''}>Administrateur</option><option ${i > 0 ? 'selected' : ''}>Conseiller</option><option>Assistant</option><option>Lecture seule</option></select></label></td><td><button class="switch ${i < 2 ? 'on' : ''}" data-action="switch"></button></td><td>${['Aujourd’hui 08:12', 'Aujourd’hui 09:40', 'Hier 18:05', 'Aujourd’hui 10:22', 'Hier 17:30'][i]}</td><td><div class="row-actions"><button aria-label="Plus">${I.more}</button></div></td></tr>`).join('')}</tbody></table></div>`,
      integrations: `<h3 class="card-title" style="margin-bottom:14px">Intégrations</h3>${[['Portails immobiliers', 'Diffusion automatique des annonces (SeLoger, Bien’ici, Le Figaro Immo)', true], ['Signature électronique', 'Mandats et compromis signés à distance', true], ['Google Agenda', 'Synchronisation bidirectionnelle des rendez-vous', true], ['WhatsApp Business', 'Messagerie clients centralisée', false], ['Comptabilité', 'Export des commissions vers votre logiciel comptable', false], ['Visite virtuelle 3D', 'Matterport / visites immersives', false]].map(([t, s, on]) => `<div class="setting-row"><div><b>${t}</b><small>${s}</small></div><button class="switch ${on ? 'on' : ''}" data-action="switch"></button></div>`).join('')}`,
      notifs: `<h3 class="card-title" style="margin-bottom:14px">Notifications</h3>${[['Nouvelle offre reçue', 'E-mail + push', true], ['Rendez-vous confirmé ou annulé', 'Push', true], ['Nouveau contact entrant', 'E-mail', true], ['Mandat proche de l’expiration', 'E-mail · 15 jours avant', true], ['Rapport hebdomadaire', 'E-mail · lundi 8h', false], ['Baisse de prix concurrente', 'Push', false]].map(([t, s, on]) => `<div class="setting-row"><div><b>${t}</b><small>${s}</small></div><button class="switch ${on ? 'on' : ''}" data-action="switch"></button></div>`).join('')}`,
    };
    v.innerHTML = `<div class="page-head"><div><h2>Paramètres</h2><p>Configuration de l’agence, préférences et intégrations</p></div></div>
      <div class="grid settings"><nav class="settings-nav" id="settings-nav">${Object.entries(tabs).map(([k, l]) => `<button class="${state.settingsTab === k ? 'active' : ''}" data-tab="${k}">${l}</button>`).join('')}</nav><div class="card" id="settings-body">${content[state.settingsTab]}</div></div>`;
    $('#settings-nav').onclick = e => { const b = e.target.closest('button'); if (!b) return; state.settingsTab = b.dataset.tab; renderParametres(); };
  }

  /* ============================================================
     MODALES
     ============================================================ */
  const openModal = (html, wide = false) => { const m = $('#modal'); m.className = 'modal' + (wide ? ' wide' : ''); m.innerHTML = `<button class="icon-btn close" data-action="close" aria-label="Fermer">${I.x}</button>` + html; $('#overlay-modal').classList.add('open'); document.body.style.overflow = 'hidden'; };
  const closeModal = () => { $('#overlay-modal').classList.remove('open'); $('#overlay-cmd').classList.remove('open'); document.body.style.overflow = ''; };

  function openProp(id) {
    const p = propOf(id); if (!p) return; const a = agentOf(p.agent); const fav = state.favs.has(p.id);
    const interested = clients.filter(c => c.interet === p.id); const rdvs = appointments.filter(r => r.bien === p.id && r.date >= TODAY && r.statut !== 'Annulé');
    const others = properties.filter(x => x.id !== p.id).slice(0, 3);
    openModal(`<div class="detail">
      <div class="gallery"><img src="${p.img}" alt="${esc(p.titre)}" id="gal-main" /><div class="thumbs"><img src="${p.img}" alt="" />${others.map(o => `<img src="${o.img}" alt="" />`).join('')}</div>
        <div class="stats-line"><span>${I.eye.replace('<svg', '<svg style="width:12px;height:12px;vertical-align:-2px"')} <b>${nf.format(p.vues)}</b> vues</span><span><b>${p.favoris}</b> favoris</span><span><b>${interested.length}</b> prospects</span><span>Ajouté le <b>${dateFR(p.ajout)}</b></span></div></div>
      <div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px"><span class="tag ${statutTag(p.statut)}">${p.statut}</span><span class="tag muted no-dot">${p.type} · ${p.transaction}</span>${p.exclusif ? '<span class="tag dark no-dot">Mandat exclusif</span>' : '<span class="tag muted no-dot">Mandat simple</span>'}</div>
        <h3>${esc(p.titre)}</h3><div class="sub" style="margin-bottom:0">${I.pin.replace('<svg', '<svg style="width:12px;height:12px;vertical-align:-2px"')} ${esc(p.adresse)}</div>
        <div class="price-big">${priceOf(p)} ${p.surface ? `<small>· ${money(Math.round(p.prix / p.surface), { short: true })}/m²</small>` : ''}</div>
        <div class="specs2">${p.surface ? `<div><b>${p.surface} m²</b><small>Habitable</small></div>` : ''}${p.terrain ? `<div><b>${nf.format(p.terrain)} m²</b><small>Terrain</small></div>` : ''}${p.chambres ? `<div><b>${p.chambres}</b><small>Chambres</small></div>` : ''}${p.sdb ? `<div><b>${p.sdb}</b><small>Salles de bain</small></div>` : ''}${p.garage ? `<div><b>${p.garage}</b><small>Garages</small></div>` : ''}<div><b>${p.note.toFixed(1)}</b><small>Note qualité</small></div></div>
        <p class="desc">${esc(p.desc)}</p>
        <div class="agent-line">${avatar(a, 'sm')}<div><b>${esc(a.nom)}</b><small>${esc(a.role)} · ${a.tel}</small></div><button class="btn sm" style="margin-left:auto" data-action="call" data-tel="${a.tel}">${I.phone}</button></div>
        ${rdvs.length ? `<div class="agenda-list" style="margin-top:12px">${rdvs.slice(0, 2).map(agendaItem).join('')}</div>` : ''}
        ${(() => { const l = taches.filter(t => t.bien === p.id).sort((a, b) => (isDone(a) - isDone(b)) || a.echeance.localeCompare(b.echeance)); return l.length ? tachesBlock(l, { bien: p.id, agent: p.agent }) : ''; })()}
        ${(() => { const os = offres.filter(o => o.bien === p.id).sort((x, y) => (isOpen(y) - isOpen(x)) || y.montant - x.montant); if (!os.length && ['Vendu', 'Loué'].includes(p.statut)) return ''; return `<div class="card-head" style="margin:14px 0 8px"><div><h4 class="card-title" style="font-size:14px">Offres reçues</h4><div class="card-sub">${os.filter(isOpen).length} en cours · ${os.length} au total${os.filter(isOpen).length ? ' · meilleure ' + money(Math.max(...os.filter(isOpen).map(o => o.montant)), { short: true }) : ''}</div></div><button class="btn sm" data-action="add-offre" data-prop-id="${p.id}">${I.plus} Offre</button></div>${os.slice(0, 3).map(x => `<div class="mini-offer" data-offre="${x.id}">${avatarClient(clientOf(x.client), 'xs')}<b>${money(x.montant, { short: true })}</b>${ecartHtml(x)}<small>${esc(clientOf(x.client).nom)} · ${dateFR(lastAct(x).date)}</small><span class="tag ${offreTag(x.statut)} no-dot">${x.statut}</span></div>`).join('')}`; })()}
        ${(() => { const m = mandatOfProp(p.id); if (!m) return `<div class="mandat-line none"><span>${I.doc}</span><div><b>Aucun mandat enregistré</b><small>Ce bien n’est pas encore sous mandat</small></div><button class="btn sm" data-action="add-mandat">${I.plus} Créer</button></div>`; const s = mandatStatut(m); const j = daysBetween(TODAY, m.fin); return `<div class="mandat-line" data-mandat="${m.id}"><span>${I.doc}</span><div><b>Mandat ${m.type.toLowerCase()} · ${m.honoraires} %</b><small>${esc(m.proprietaire.nom)} · ${s === 'Clôturé' ? 'clôturé' : joursLabel(j).toLowerCase()} · ${docsOk(m)}/${m.documents.length} documents</small></div><span class="tag ${mandatTag(s)}">${s}</span></div>`; })()}
        ${(() => { const ms = matchesForProp(p); return `<div class="match-block"><div class="card-head" style="margin:14px 0 8px"><div><h4 class="card-title" style="font-size:14px">Acheteurs correspondants</h4><div class="card-sub">${ms.length ? ms.length + ' prospect' + (ms.length > 1 ? 's' : '') + ' compatibles' : 'Aucun prospect compatible pour le moment'}</div></div>${ms.length ? `<button class="btn sm" data-action="propose-all" data-prop-id="${p.id}">${I.send} Proposer à tous</button>` : ''}</div>${ms.slice(0, 4).map(x => matchRow({ c: x.c, p, m: x.m }, 'prop')).join('')}</div>`; })()}
        <div class="actions"><button class="btn primary" data-action="planifier" data-prop-id="${p.id}">${I.cal} Planifier une visite</button><button class="btn" data-fav="${p.id}" data-refresh="1">${fav ? I.heart : I.heartO} ${fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}</button><button class="btn" data-action="share">${I.share} Partager</button><button class="btn ghost" data-edit="${p.id}">${I.edit} Modifier</button></div>
      </div></div>`, true);
    $$('#modal .thumbs img').forEach(t => t.onclick = () => $('#gal-main').src = t.src);
  }
  function openClient(id) {
    const c = clientOf(id); const a = agentOf(c.agent); const p = c.interet ? propOf(c.interet) : null; const rdvs = appointments.filter(r => r.client === id).sort((x, y) => (y.date + y.heure).localeCompare(x.date + x.heure));
    openModal(`<div style="display:flex;gap:14px;align-items:center;margin-bottom:16px">${avatarClient(c, 'lg')}<div><h3 style="margin:0">${esc(c.nom)}</h3><div class="sub" style="margin:0">${c.type} · via ${c.source} · suivi par ${esc(a.nom)}</div></div><span class="tag ${etapeTag(c.etape)}" style="margin-left:auto">${c.etape}</span></div>
      <div class="specs2" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px"><div style="background:var(--surface-2);border-radius:12px;padding:10px 12px"><b style="display:block;font-weight:600">${c.budget ? money(c.budget, { short: true }) : '—'}</b><small style="color:var(--ink-3);font-size:11px">Budget</small></div><div style="background:var(--surface-2);border-radius:12px;padding:10px 12px"><b style="display:block;font-weight:600">${c.score}/100</b><small style="color:var(--ink-3);font-size:11px">Score</small></div><div style="background:var(--surface-2);border-radius:12px;padding:10px 12px"><b style="display:block;font-weight:600">${rdvs.length}</b><small style="color:var(--ink-3);font-size:11px">Rendez-vous</small></div><div style="background:var(--surface-2);border-radius:12px;padding:10px 12px"><b style="display:block;font-weight:600">${dateFR(c.dernier)}</b><small style="color:var(--ink-3);font-size:11px">Dernier contact</small></div></div>
      <div class="form-grid" style="margin-top:16px"><div class="field"><label>Téléphone</label><input value="${c.tel}" readonly /></div><div class="field"><label>E-mail</label><input value="${esc(c.email)}" readonly /></div>
        <div class="field full"><label>Étape du pipeline</label><select id="cl-etape">${pipelineEtapes.map(e => `<option ${e === c.etape ? 'selected' : ''}>${e}</option>`).join('')}</select></div>
        <div class="field full"><label>Notes</label><textarea placeholder="Ajouter une note de suivi…">${c.type === 'Acheteur' ? 'Recherche vue mer, minimum 4 chambres. Financement validé.' : ''}</textarea></div></div>
      ${p ? `<div class="agent-line" style="cursor:pointer" data-prop="${p.id}"><img src="${p.img}" alt="" style="width:56px;height:44px;border-radius:8px;object-fit:cover" /><div><b>${esc(p.titre)}</b><small>${esc(p.adresse)} · ${priceOf(p)}</small></div><span class="card-link" style="margin-left:auto">${I.arrow}</span></div>` : ''}
      ${tachesBlock(taches.filter(t => t.client === c.id).sort((a, b) => (isDone(a) - isDone(b)) || a.echeance.localeCompare(b.echeance)), { client: c.id, agent: c.agent, titre: 'Rappeler ' + c.nom, type: 'Appel' })}
      ${(() => { const os = offres.filter(o => o.client === c.id).sort((x, y) => lastAct(y).date.localeCompare(lastAct(x).date)); if (!os.length) return ''; return `<div class="card-head" style="margin:16px 0 8px"><div><h4 class="card-title" style="font-size:14px">Offres émises</h4><div class="card-sub">${os.filter(isOpen).length} en négociation</div></div><button class="btn sm" data-action="add-offre" data-client-id="${c.id}">${I.plus} Offre</button></div>${os.map(x => `<div class="mini-offer" data-offre="${x.id}"><img src="${propOf(x.bien).img}" alt="" /><b>${money(x.montant, { short: true })}</b>${ecartHtml(x)}<small>${esc(propOf(x.bien).titre)} · ${dateFR(lastAct(x).date)}</small><span class="tag ${offreTag(x.statut)} no-dot">${x.statut}</span></div>`).join('')}`; })()}
      ${(() => { if (c.type === 'Vendeur') return ''; const ms = matchesForClient(c); return `<div class="match-block"><div class="card-head" style="margin:16px 0 8px"><div><h4 class="card-title" style="font-size:14px">Biens correspondants</h4><div class="card-sub">Critères : ${c.quartiers?.length ? c.quartiers.join(', ') : 'tous quartiers'} · ${c.types?.length ? c.types.join(', ') : 'tous types'}${c.chambresMin ? ' · ' + c.chambresMin + '+ ch.' : ''}</div></div>${ms.length ? `<button class="btn sm" data-action="send-selection" data-client-id="${c.id}">${I.send} Envoyer la sélection</button>` : ''}</div>${ms.length ? ms.slice(0, 4).map(x => matchRow({ c, p: x.p, m: x.m }, 'client')).join('') : `<div class="empty" style="padding:16px">Aucun bien du portefeuille ne correspond aux critères.</div>`}</div>`; })()}
      ${rdvs.length ? `<div class="agenda-list" style="margin-top:12px">${rdvs.slice(0, 3).map(agendaItem).join('')}</div>` : ''}
      <div class="modal-foot"><button class="btn" data-action="call" data-tel="${c.tel}">${I.phone} Appeler</button><button class="btn" data-action="msg-client" data-client-msg="${c.id}">${I.mail} Message</button><button class="btn primary" data-action="save-client" data-client-id="${c.id}">Enregistrer</button></div>`);
  }
  function openRdv(id) {
    const r = appointments.find(x => x.id === id); const p = r.bien ? propOf(r.bien) : null; const c = r.client ? clientOf(r.client) : null; const a = agentOf(r.agent);
    openModal(`<span class="tag ${rdvTag(r.statut)}">${r.statut}</span><h3 style="margin-top:10px">${r.type}${p ? ' · ' + esc(p.titre) : ''}</h3><div class="sub">${dateFR(r.date, { weekday: 'long', day: 'numeric', month: 'long' })} à ${r.heure} · ${r.duree} min${r.lieu ? ' · ' + esc(r.lieu) : ''}</div>
      ${p ? `<div class="agent-line" style="cursor:pointer" data-prop="${p.id}"><img src="${p.img}" alt="" style="width:56px;height:44px;border-radius:8px;object-fit:cover" /><div><b>${esc(p.titre)}</b><small>${esc(p.adresse)}</small></div><span class="card-link" style="margin-left:auto">${I.arrow}</span></div>` : ''}
      ${c ? `<div class="agent-line" style="cursor:pointer" data-client="${c.id}">${avatarClient(c, 'sm')}<div><b>${esc(c.nom)}</b><small>${c.type} · ${c.tel}</small></div><span class="card-link" style="margin-left:auto">${I.arrow}</span></div>` : ''}
      <div class="agent-line">${avatar(a, 'sm')}<div><b>${esc(a.nom)}</b><small>Conseiller en charge</small></div></div>
      <div class="modal-foot">${r.statut !== 'Annulé' && r.statut !== 'Terminé' ? `<button class="btn danger ghost" data-action="cancel-rdv" data-rdv-id="${r.id}">Annuler le rendez-vous</button>` : ''}<button class="btn" data-action="close">Fermer</button>${r.statut === 'En attente' ? `<button class="btn primary" data-action="confirm-rdv" data-rdv-id="${r.id}">Confirmer</button>` : ''}</div>`);
  }
  function openAddBien() {
    openModal(`<h3>Ajouter un bien</h3><div class="sub">Renseignez les informations principales du mandat.</div>
      <form id="form-bien" class="form-grid"><div class="field full"><label>Titre de l’annonce</label><input name="titre" required placeholder="Villa Les Jardins" /></div><div class="field full"><label>Adresse</label><input name="adresse" required placeholder="Rue, quartier" /></div>
        <div class="field"><label>Quartier</label><select name="quartier">${[...new Set(properties.map(p => p.quartier))].sort().map(q => `<option>${q}</option>`).join('')}</select></div><div class="field"><label>Type</label><select name="type">${['Villa', 'Appartement', 'Penthouse', 'Duplex', 'Maison', 'Terrain'].map(q => `<option>${q}</option>`).join('')}</select></div>
        <div class="field"><label>Transaction</label><select name="transaction"><option>Vente</option><option>Location</option></select></div><div class="field"><label>Prix (€)</label><input name="prix" type="number" required placeholder="1200000" /></div>
        <div class="field"><label>Surface (m²)</label><input name="surface" type="number" placeholder="320" /></div><div class="field"><label>Terrain (m²)</label><input name="terrain" type="number" placeholder="800" /></div>
        <div class="field"><label>Chambres</label><input name="chambres" type="number" placeholder="4" /></div><div class="field"><label>Salles de bain</label><input name="sdb" type="number" placeholder="3" /></div>
        <div class="field"><label>Conseiller</label><select name="agent">${agents.map(a => `<option value="${a.id}">${a.nom}</option>`).join('')}</select></div><div class="field"><label>Type de mandat</label><select name="exclusif"><option value="1">Exclusif</option><option value="0">Simple</option></select></div>
        <div class="field full"><label>Description</label><textarea name="desc" placeholder="Points forts, prestations, environnement…"></textarea></div>
        <div class="field full"><label>Photos</label><div style="border:1.5px dashed var(--border-strong);border-radius:12px;padding:22px;text-align:center;color:var(--ink-3);font-size:13px">Glissez vos photos ici ou <b style="color:var(--accent-ink)">parcourir</b><br><small>JPG, PNG · 20 Mo max · les photos HD augmentent les vues de 40 %</small></div></div>
      </form><div class="modal-foot"><button class="btn ghost" data-action="close">Annuler</button><button class="btn primary" data-action="submit-bien">Publier le bien</button></div>`);
  }
  function openAddRdv(propId) {
    openModal(`<h3>Planifier un rendez-vous</h3><div class="sub">Le client et le conseiller recevront une confirmation.</div>
      <form id="form-rdv" class="form-grid"><div class="field"><label>Type</label><select name="type"><option>Visite</option><option>Estimation</option><option>Signature</option><option>Appel</option><option>Shooting</option></select></div><div class="field"><label>Bien</label><select name="bien"><option value="">— Aucun —</option>${properties.map(p => `<option value="${p.id}" ${p.id === propId ? 'selected' : ''}>${esc(p.titre)}</option>`).join('')}</select></div>
        <div class="field"><label>Client</label><select name="client"><option value="">— Aucun —</option>${clients.map(c => `<option value="${c.id}">${esc(c.nom)}</option>`).join('')}</select></div><div class="field"><label>Conseiller</label><select name="agent">${agents.map(a => `<option value="${a.id}">${a.nom}</option>`).join('')}</select></div>
        <div class="field"><label>Date</label><input name="date" type="date" value="${addDays(TODAY, 1)}" /></div><div class="field"><label>Heure</label><input name="heure" type="time" value="10:00" /></div>
        <div class="field"><label>Durée (min)</label><input name="duree" type="number" value="60" /></div><div class="field"><label>Lieu (si différent)</label><input name="lieu" placeholder="Agence, étude notariale…" /></div></form>
      <div class="modal-foot"><button class="btn ghost" data-action="close">Annuler</button><button class="btn primary" data-action="submit-rdv">Planifier</button></div>`);
  }
  function openAddClient() {
    openModal(`<h3>Nouveau contact</h3><div class="sub">Créer une fiche prospect ou client.</div>
      <form id="form-client" class="form-grid"><div class="field full"><label>Nom complet</label><input name="nom" required placeholder="Prénom Nom" /></div><div class="field"><label>Type</label><select name="type"><option>Acheteur</option><option>Vendeur</option><option>Locataire</option><option>Investisseur</option></select></div><div class="field"><label>Budget (€)</label><input name="budget" type="number" placeholder="1200000" /></div><div class="field"><label>Téléphone</label><input name="tel" placeholder="+33 6 …" /></div><div class="field"><label>E-mail</label><input name="email" type="email" /></div><div class="field"><label>Source</label><select name="source"><option>Site web</option><option>Recommandation</option><option>Instagram</option><option>LinkedIn</option><option>Salon immobilier</option><option>Appel entrant</option></select></div><div class="field"><label>Conseiller</label><select name="agent">${agents.map(a => `<option value="${a.id}">${a.nom}</option>`).join('')}</select></div><div class="field full"><label>Bien d’intérêt</label><select name="interet"><option value="">— Aucun —</option>${properties.map(p => `<option value="${p.id}">${esc(p.titre)}</option>`).join('')}</select></div>
        <div class="field full"><label>Quartiers recherchés</label><div class="chips" id="chips-q">${[...new Set(properties.map(p => p.quartier))].sort().map(q => `<label class="chip"><input type="checkbox" name="quartiers" value="${q}" /><span>${q}</span></label>`).join('')}</div></div>
        <div class="field"><label>Types recherchés</label><div class="chips">${['Villa', 'Appartement', 'Penthouse', 'Duplex', 'Maison', 'Terrain'].map(t => `<label class="chip"><input type="checkbox" name="types" value="${t}" /><span>${t}</span></label>`).join('')}</div></div>
        <div class="field"><label>Chambres minimum</label><input name="chambresMin" type="number" min="0" placeholder="3" /></div></form>
      <div class="modal-foot"><button class="btn ghost" data-action="close">Annuler</button><button class="btn primary" data-action="submit-client">Créer le contact</button></div>`);
  }
  function openAgentDetail(id) {
    const a = agentOf(id); const list = properties.filter(p => p.agent === id);
    openModal(`<div style="display:flex;gap:14px;align-items:center;margin-bottom:16px">${avatar(a, 'lg')}<div><h3 style="margin:0">${esc(a.nom)}</h3><div class="sub" style="margin:0">${esc(a.role)} · ${a.tel} · ${esc(a.email)}</div></div></div>
      <div class="card-sub" style="margin-bottom:10px">Portefeuille · ${list.length} biens</div><div class="props" style="grid-template-columns:repeat(3,1fr)">${list.map(propCard).join('')}</div>`, true);
  }

  /* ---------- Recherche rapide (⌘K) ---------- */
  function openCmd() {
    const c = $('#cmd'); c.innerHTML = `<label class="input">${I.search}<input id="cmd-input" placeholder="Rechercher un bien, un client, un conseiller…" autocomplete="off" /><span class="tag muted no-dot">Échap</span></label><div class="cmd-results" id="cmd-results"></div>`;
    $('#overlay-cmd').classList.add('open'); document.body.style.overflow = 'hidden';
    const inp = $('#cmd-input'); const res = $('#cmd-results');
    const run = () => { const q = inp.value.trim().toLowerCase(); if (!q) { res.innerHTML = `<div class="cmd-empty">Tapez pour rechercher dans ${properties.length} biens, ${clients.length} contacts et ${agents.length} conseillers.</div>`; return; }
      const items = [...properties.filter(p => (p.titre + p.adresse + p.quartier).toLowerCase().includes(q)).map(p => `<div class="cmd-item" data-prop="${p.id}"><span class="ico">${I.home}</span><div><b>${esc(p.titre)}</b><small>${esc(p.adresse)} · ${priceOf(p)}</small></div><span class="tag ${statutTag(p.statut)}">${p.statut}</span></div>`),
        ...clients.filter(c => (c.nom + c.email).toLowerCase().includes(q)).map(c => `<div class="cmd-item" data-client="${c.id}"><span class="ico">${I.user}</span><div><b>${esc(c.nom)}</b><small>${c.type} · ${c.budget ? money(c.budget, { short: true }) : 'Vendeur'}</small></div><span class="tag ${etapeTag(c.etape)}">${c.etape}</span></div>`),
        ...rapports.filter(r => (propOf(r.bien).titre + ' rapport ' + mandatOf(r.mandat).proprietaire.nom).toLowerCase().includes(q)).slice(0, 4).map(r => `<div class="cmd-item" data-rapport="${r.id}"><span class="ico">${I.doc}</span><div><b>Rapport ${periodeLabel(r.periode)} · ${esc(propOf(r.bien).titre)}</b><small>${r.statut} · ${esc(mandatOf(r.mandat).proprietaire.nom)}</small></div></div>`),
        ...taches.filter(t => !isDone(t) && t.titre.toLowerCase().includes(q)).map(t => `<div class="cmd-item" data-tache="${t.id}"><span class="ico">${I.check}</span><div><b>${esc(t.titre)}</b><small>${echeanceLabel(t)} · ${t.priorite}</small></div></div>`),
        ...offres.filter(o => isOpen(o) && (propOf(o.bien).titre + ' ' + clientOf(o.client).nom + ' offre').toLowerCase().includes(q)).map(o => `<div class="cmd-item" data-offre="${o.id}"><span class="ico">${I.tag}</span><div><b>Offre · ${money(o.montant, { short: true })} · ${esc(propOf(o.bien).titre)}</b><small>${esc(clientOf(o.client).nom)} · ${o.statut}</small></div></div>`),
        ...mandats.filter(m => m.proprietaire.nom.toLowerCase().includes(q) || ('mandat ' + propOf(m.bien).titre).toLowerCase().includes(q)).map(m => `<div class="cmd-item" data-mandat="${m.id}"><span class="ico">${I.doc}</span><div><b>Mandat · ${esc(propOf(m.bien).titre)}</b><small>${esc(m.proprietaire.nom)} · ${mandatStatut(m)}</small></div></div>`),
        ...agents.filter(a => a.nom.toLowerCase().includes(q)).map(a => `<div class="cmd-item" data-agent-detail="${a.id}"><span class="ico">${I.user}</span><div><b>${esc(a.nom)}</b><small>${esc(a.role)}</small></div></div>`)];
      res.innerHTML = items.length ? items.join('') : `<div class="cmd-empty">Aucun résultat pour « ${esc(inp.value)} »</div>`; };
    inp.oninput = run; run(); setTimeout(() => inp.focus(), 30);
  }

  /* ---------- Notifications ---------- */
  function renderNotifs() {
    const pop = $('#notif-pop'); const ico = { offre: I.tag, rdv: I.cal, doc: I.doc, lead: I.user, alerte: I.bell };
    pop.innerHTML = `<div class="pop-head">Notifications<button data-action="read-all">Tout marquer comme lu</button></div>${notifications.map(n => `<div class="notif ${n.lu ? '' : 'unread'}" data-notif="${n.id}"><span class="ico">${ico[n.type]}</span><div><b>${esc(n.titre)}</b><p>${esc(n.texte)}</p><small>${esc(n.temps)}</small></div></div>`).join('')}<div style="padding:10px;text-align:center"><button class="btn sm ghost" data-action="close-notif">Voir toutes les notifications</button></div>`;
    updateBadges();
  }
  function updateBadges() {
    const n = notifications.filter(x => !x.lu).length; const b = $('#notif-badge'); b.textContent = n; b.style.display = n ? '' : 'none';
    const m = conversations.reduce((s, c) => s + c.nonLus, 0); $('#msg-dot').style.display = m ? '' : 'none';
  }

  /* ---------- Export CSV ---------- */
  function downloadCSV(name, rows) {
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 500);
    toast('Export téléchargé : ' + name);
  }


  /* ============================================================
     MANDATS
     ============================================================ */
  const daysBetween = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
  const mandatOf = id => mandats.find(m => m.id === id);
  const mandatOfProp = pid => mandats.find(m => m.bien === pid);
  function mandatStatut(m) {
    const p = propOf(m.bien);
    if (p && ['Vendu', 'Loué'].includes(p.statut)) return 'Clôturé';
    const j = daysBetween(TODAY, m.fin);
    if (j < 0) return 'Expiré'; if (j <= 30) return 'Expire bientôt'; return 'Actif';
  }
  const mandatTag = s => ({ 'Actif': 'ok', 'Expire bientôt': 'warn', 'Expiré': 'danger', 'Clôturé': 'dark' }[s] || 'muted');
  const docTag = s => ({ 'Signé': 'ok', 'Reçu': 'info', 'À signer': 'warn', 'Manquant': 'danger' }[s] || 'muted');
  const docsOk = m => m.documents.filter(x => x.statut === 'Signé' || x.statut === 'Reçu').length;
  const honorairesOf = m => { const p = propOf(m.bien); return p ? (p.transaction === 'Location' ? p.prix * 12 : p.prix) * m.honoraires / 100 : 0; };
  const joursLabel = j => j < 0 ? `Expiré depuis ${-j} j` : j === 0 ? 'Expire aujourd’hui' : `${j} j restants`;

  function filteredMandats() {
    const f = state.mandatFilters; const q = f.q.toLowerCase();
    let rows = mandats.filter(m => { const p = propOf(m.bien); const s = mandatStatut(m);
      return (!f.statut || s === f.statut) && (!f.type || m.type === f.type) && (!f.agent || m.agent === f.agent) && (!q || (p.titre + ' ' + p.quartier + ' ' + m.proprietaire.nom).toLowerCase().includes(q)); });
    const s = { fin: (a, b) => a.fin.localeCompare(b.fin), debut: (a, b) => b.debut.localeCompare(a.debut), prix: (a, b) => propOf(b.bien).prix - propOf(a.bien).prix, honoraires: (a, b) => honorairesOf(b) - honorairesOf(a) }[f.tri];
    return rows.sort(s);
  }
  function renderMandats() {
    const v = $('#view-mandats'); const f = state.mandatFilters;
    const actifs = mandats.filter(m => ['Actif', 'Expire bientôt'].includes(mandatStatut(m)));
    const bientot = mandats.filter(m => mandatStatut(m) === 'Expire bientôt').sort((a, b) => a.fin.localeCompare(b.fin));
    const expires = mandats.filter(m => mandatStatut(m) === 'Expiré');
    const exclusifs = actifs.filter(m => m.type === 'Exclusif').length;
    const docsManquants = actifs.reduce((s, m) => s + m.documents.filter(x => x.statut !== 'Signé' && x.statut !== 'Reçu').length, 0);
    const potentiel = actifs.reduce((s, m) => s + honorairesOf(m), 0);
    const alertes = [...expires, ...bientot];
    v.innerHTML = `
      <div class="page-head"><div><h2>Mandats</h2><p>${actifs.length} mandats actifs · ${exclusifs} exclusifs · ${expires.length} expiré${expires.length > 1 ? 's' : ''} à traiter</p></div>
        <div class="actions"><button class="btn" data-action="export-mandats">${I.download} Exporter</button><button class="btn primary" data-action="add-mandat">${I.plus} Nouveau mandat</button></div></div>
      <div class="grid kpi-row" style="margin-bottom:16px">
        ${kpiCompact('Mandats actifs', actifs.length, '', 4, [7, 8, 8, 9, 9, 10, actifs.length], 'sur ' + mandats.length + ' au total')}
        ${kpiCompact('Part d’exclusivité', Math.round(exclusifs / Math.max(1, actifs.length) * 100), ' %', 6, [30, 35, 38, 40, 42, 45, 50], exclusifs + ' mandats exclusifs')}
        ${kpiCompact('Honoraires potentiels', money(potentiel, { short: true }), '', 9, [20, 22, 24, 23, 27, 30, 32], 'sur les mandats en cours')}
        ${kpiCompact('Documents manquants', docsManquants, '', -2, [9, 8, 8, 7, 6, 6, docsManquants], 'à collecter ou signer')}
      </div>
      ${alertes.length ? `<div class="alert-strip">${I.bell}<div><b>${alertes.length} mandat${alertes.length > 1 ? 's' : ''} à renouveler</b><span>${alertes.map(m => `<a href="#" data-mandat="${m.id}">${esc(propOf(m.bien).titre)} · ${joursLabel(daysBetween(TODAY, m.fin))}</a>`).join('')}</span></div></div>` : ''}
      <div class="card">
        <div class="filters" id="mandat-filters">
          <label class="input" style="min-width:220px">${I.search}<input type="search" data-key="q" placeholder="Bien, quartier, propriétaire…" value="${esc(f.q)}" /></label>
          ${selectCtl('statut', 'Statut', ['Actif', 'Expire bientôt', 'Expiré', 'Clôturé'], f.statut, I.filter)}
          ${selectCtl('type', 'Type de mandat', ['Exclusif', 'Simple'], f.type, I.doc)}
          <label class="select">${I.user}<select data-key="agent" aria-label="Conseiller"><option value="">Conseiller</option>${agents.map(a => `<option value="${a.id}" ${f.agent === a.id ? 'selected' : ''}>${a.nom}</option>`).join('')}</select></label>
          <label class="select">${I.trend}<select data-key="tri" aria-label="Trier"><option value="fin" ${f.tri === 'fin' ? 'selected' : ''}>Échéance proche</option><option value="debut" ${f.tri === 'debut' ? 'selected' : ''}>Plus récents</option><option value="prix" ${f.tri === 'prix' ? 'selected' : ''}>Prix décroissant</option><option value="honoraires" ${f.tri === 'honoraires' ? 'selected' : ''}>Honoraires</option></select></label>
          <span class="spacer"></span><span class="tag muted no-dot" id="mandat-count"></span>
        </div>
        <div id="mandats-body"></div>
      </div>`;
    $('#mandat-filters').addEventListener('input', e => { if (e.target.dataset.key) { f[e.target.dataset.key] = e.target.value; renderMandatsBody(); } });
    renderMandatsBody();
  }
  function renderMandatsBody() {
    const rows = filteredMandats(); $('#mandat-count').textContent = rows.length + ' mandat' + (rows.length > 1 ? 's' : '');
    const body = $('#mandats-body');
    if (!rows.length) { body.innerHTML = `<div class="empty">${I.doc}<div>Aucun mandat ne correspond aux filtres.</div></div>`; return; }
    body.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Bien</th><th>Propriétaire</th><th>Type</th><th>Période</th><th>Échéance</th><th>Prix</th><th>Honoraires</th><th>Documents</th><th>Conseiller</th><th>Statut</th><th style="text-align:right">Actions</th></tr></thead><tbody>
      ${rows.map(m => { const p = propOf(m.bien); const a = agentOf(m.agent); const s = mandatStatut(m); const total = daysBetween(m.debut, m.fin); const j = daysBetween(TODAY, m.fin); const pct = Math.max(0, Math.min(100, Math.round((1 - j / total) * 100))); const var_ = p.prix - m.prixInitial;
        return `<tr class="clickable" data-mandat="${m.id}">
          <td><div class="cell-prop"><img src="${p.img}" alt="" /><div><b>${esc(p.titre)}</b><small>${esc(p.quartier)} · ${p.transaction}</small></div></div></td>
          <td class="owner"><b style="font-weight:600">${esc(m.proprietaire.nom)}</b><br><small style="color:var(--ink-3)">${m.proprietaire.tel}</small></td>
          <td><span class="tag ${m.type === 'Exclusif' ? 'dark' : 'muted'} no-dot">${m.type}</span></td>
          <td class="num">${dateFR(m.debut)} → ${dateFR(m.fin, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
          <td><div class="deadline ${s === 'Expiré' ? 'over' : j <= 30 ? 'soon' : ''}"><small>${s === 'Clôturé' ? 'Clôturé' : joursLabel(j)}</small><i><b style="width:${s === 'Clôturé' ? 100 : pct}%"></b></i></div></td>
          <td class="num"><b>${priceOf(p)}</b>${var_ ? `<br><small class="${var_ < 0 ? 'delta neg' : 'delta pos'}">${var_ < 0 ? I.down : I.up} ${Math.abs(Math.round(var_ / m.prixInitial * 1000) / 10)} %</small>` : ''}</td>
          <td class="num">${money(honorairesOf(m), { short: true })}<br><small style="color:var(--ink-3)">${m.honoraires} %</small></td>
          <td><span class="docs-pill ${docsOk(m) === m.documents.length ? 'ok' : ''}">${I.doc} ${docsOk(m)}/${m.documents.length}</span></td>
          <td><div class="cell-agent">${avatar(a, 'xs')}${esc(a.nom.split(' ')[0])}</div></td>
          <td><span class="tag ${mandatTag(s)}">${s}</span></td>
          <td><div class="row-actions">${['Actif', 'Expire bientôt', 'Expiré'].includes(s) ? `<button aria-label="Renouveler" title="Renouveler" data-action="renew-mandat" data-mandat-id="${m.id}">${I.cal}</button>` : ''}<button aria-label="Voir le bien" title="Voir le bien" data-prop="${p.id}">${I.home}</button><button aria-label="Détail" title="Détail" data-mandat="${m.id}">${I.eye}</button></div></td></tr>`; }).join('')}</tbody></table></div>`;
  }
  function openMandat(id) {
    const m = mandatOf(id); if (!m) return; const p = propOf(m.bien); const a = agentOf(m.agent); const s = mandatStatut(m);
    const total = daysBetween(m.debut, m.fin); const j = daysBetween(TODAY, m.fin); const pct = Math.max(0, Math.min(100, Math.round((1 - j / total) * 100)));
    const hist = [...m.historiquePrix].sort((x, y) => x.date.localeCompare(y.date));
    openModal(`<span class="tag ${mandatTag(s)}">${s}</span><span class="tag ${m.type === 'Exclusif' ? 'dark' : 'muted'} no-dot" style="margin-left:6px">Mandat ${m.type.toLowerCase()}</span>
      <h3 style="margin-top:10px">${esc(p.titre)}</h3><div class="sub">${esc(p.adresse)} · ${p.transaction} · suivi par ${esc(a.nom)}</div>
      <div class="agent-line" style="cursor:pointer;margin-top:0" data-prop="${p.id}"><img src="${p.img}" alt="" style="width:56px;height:44px;border-radius:8px;object-fit:cover" /><div><b>${priceOf(p)}</b><small>${p.chambres ? p.chambres + ' ch. · ' : ''}${p.surface ? p.surface + ' m²' : p.terrain + ' m² de terrain'} · ${p.statut}</small></div><span class="card-link" style="margin-left:auto">${I.arrow}</span></div>
      <div class="stat3" style="grid-template-columns:repeat(4,1fr);margin-top:14px">
        <div><b>${dateFR(m.debut, { day: 'numeric', month: 'short', year: 'numeric' })}</b><small>Début</small></div>
        <div><b>${dateFR(m.fin, { day: 'numeric', month: 'short', year: 'numeric' })}</b><small>Fin</small></div>
        <div><b>${m.honoraires} %</b><small>Honoraires · ${money(honorairesOf(m), { short: true })}</small></div>
        <div><b>${docsOk(m)}/${m.documents.length}</b><small>Documents complets</small></div></div>
      <div class="deadline big ${s === 'Expiré' ? 'over' : j <= 30 ? 'soon' : ''}" style="margin-top:14px"><div class="row-between"><small>${s === 'Clôturé' ? 'Mandat clôturé' : joursLabel(j)}</small><small>${total} jours au total</small></div><i><b style="width:${s === 'Clôturé' ? 100 : pct}%"></b></i></div>
      <div class="two-col" style="margin-top:18px">
        <div><h4 class="card-title" style="font-size:14px;margin:0 0 10px">Propriétaire</h4>
          <div class="owner-box"><div class="avatar sm" style="background:var(--sage)">${m.proprietaire.nom.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</div><div><b>${esc(m.proprietaire.nom)}</b><small>${m.proprietaire.tel}</small></div><button class="icon-btn sm" data-action="call" data-tel="${m.proprietaire.tel}" aria-label="Appeler">${I.phone}</button></div>
          <h4 class="card-title" style="font-size:14px;margin:18px 0 10px">Historique des prix</h4>
          <ul class="timeline">${hist.map((h, i) => `<li><span class="dot"></span><div><b>${money(h.prix, { short: true, perMonth: p.transaction === 'Location' })}</b>${i > 0 ? `<span class="delta ${h.prix < hist[i - 1].prix ? 'neg' : 'pos'}" style="margin-left:6px">${h.prix < hist[i - 1].prix ? I.down : I.up} ${Math.abs(Math.round((h.prix / hist[i - 1].prix - 1) * 1000) / 10)} %</span>` : '<span class="muted-txt" style="margin-left:6px">prix initial</span>'}<small>${dateFR(h.date, { day: 'numeric', month: 'long', year: 'numeric' })}</small></div></li>`).join('')}</ul>
          ${s !== 'Clôturé' ? `<form id="form-prix" class="inline-form"><label class="input" style="flex:1">${I.tag}<input name="prix" type="number" min="1" placeholder="Nouveau prix (€)" required /></label><button class="btn sm" data-action="price-mandat" data-mandat-id="${m.id}">Ajuster</button></form>` : ''}
        </div>
        <div><div class="row-between" style="margin-bottom:10px"><h4 class="card-title" style="font-size:14px;margin:0">Documents</h4><button class="btn sm ghost" data-action="attach">${I.plus} Ajouter</button></div>
          <ul class="doc-list">${m.documents.map((d, i) => `<li><span class="doc-ico">${I.doc}</span><div><b>${esc(d.nom)}</b><small>${d.statut === 'Signé' ? 'Signé électroniquement' : d.statut === 'Reçu' ? 'Reçu et archivé' : d.statut === 'À signer' ? 'En attente de signature' : 'À demander au propriétaire'}</small></div><span class="tag ${docTag(d.statut)} no-dot">${d.statut}</span>${d.statut === 'Signé' || d.statut === 'Reçu' ? '' : `<button class="icon-btn sm" data-action="doc-ok" data-mandat-id="${m.id}" data-doc-index="${i}" aria-label="Marquer comme reçu" title="${d.statut === 'À signer' ? 'Marquer signé' : 'Marquer reçu'}">${I.check}</button>`}</li>`).join('')}</ul>
        </div>
      </div>
      ${rapportsBlock(m)}
      <div class="modal-foot">${s !== 'Clôturé' ? `<button class="btn ghost" data-action="end-mandat" data-mandat-id="${m.id}">Résilier</button>` : ''}<button class="btn" data-action="add-rapport" data-mandat-id="${m.id}">${I.doc} Rapport propriétaire</button>${['Actif', 'Expire bientôt', 'Expiré'].includes(s) ? `<button class="btn primary" data-action="renew-mandat" data-mandat-id="${m.id}">${I.cal} Renouveler 3 mois</button>` : ''}</div>`, true);
  }
  function openAddMandat() {
    const libres = properties.filter(p => !mandatOfProp(p.id));
    openModal(`<h3>Nouveau mandat</h3><div class="sub">Enregistrer un mandat de vente ou de location.</div>
      <form id="form-mandat" class="form-grid">
        <div class="field full"><label>Bien concerné</label><select name="bien" required>${libres.length ? '' : '<option value="">Tous les biens ont déjà un mandat</option>'}${libres.map(p => `<option value="${p.id}">${esc(p.titre)} — ${esc(p.quartier)}</option>`).join('')}</select></div>
        <div class="field"><label>Type de mandat</label><select name="type"><option>Exclusif</option><option>Simple</option></select></div>
        <div class="field"><label>Honoraires (%)</label><input name="honoraires" type="number" step="0.5" min="0" value="3" required /></div>
        <div class="field"><label>Début</label><input name="debut" type="date" value="${TODAY}" required /></div>
        <div class="field"><label>Durée</label><select name="duree"><option value="3">3 mois</option><option value="6">6 mois</option><option value="12">12 mois</option></select></div>
        <div class="field"><label>Propriétaire</label><input name="proprio" placeholder="Nom du propriétaire" required /></div>
        <div class="field"><label>Téléphone</label><input name="tel" placeholder="+33 6 …" /></div>
        <div class="field full"><label>Conseiller</label><select name="agent">${agents.map(a => `<option value="${a.id}">${a.nom}</option>`).join('')}</select></div>
        <div class="field full"><label>Documents à collecter</label><div class="chips">${['Mandat signé', 'Titre de propriété', 'Certificat de conformité', 'Règlement de copropriété', 'Diagnostic énergétique', 'Plan cadastral'].map((d, i) => `<label class="chip"><input type="checkbox" name="docs" value="${d}" ${i < 2 ? 'checked' : ''} /><span>${d}</span></label>`).join('')}</div></div>
      </form><div class="modal-foot"><button class="btn ghost" data-action="close">Annuler</button><button class="btn primary" data-action="submit-mandat">Créer le mandat</button></div>`);
  }

  /* ============================================================
     OFFRES & NÉGOCIATIONS
     ============================================================ */
  const offreOf = id => offres.find(o => o.id === id);
  const offreStatuts = ['En attente', 'Contre-proposition', 'Acceptée', 'Refusée', 'Retirée', 'Expirée'];
  const offreTag = s => ({ 'En attente': 'warn', 'Contre-proposition': 'info', 'Acceptée': 'ok', 'Refusée': 'danger', 'Retirée': 'muted', 'Expirée': 'muted' }[s] || 'muted');
  const isOpen = o => ['En attente', 'Contre-proposition'].includes(o.statut);
  const ecart = o => { const p = propOf(o.bien); return p ? Math.round((o.montant / p.prix - 1) * 1000) / 10 : 0; };
  const ecartHtml = o => { const e = ecart(o); return `<span class="delta ${e < 0 ? 'neg' : 'pos'}">${e < 0 ? I.down : I.up} ${Math.abs(e)} %</span>`; };
  const lastAct = o => o.historique[o.historique.length - 1];
  const validiteLabel = o => { if (!isOpen(o)) return ''; const j = daysBetween(TODAY, o.validite); return j < 0 ? 'Validité dépassée' : j === 0 ? 'Expire aujourd’hui' : `Valable ${j} j`; };

  function filteredOffres() {
    const f = state.offreFilters; const q = f.q.toLowerCase();
    let rows = offres.filter(o => { const p = propOf(o.bien); const c = clientOf(o.client);
      return (!f.statut || (f.statut === 'ouvertes' ? isOpen(o) : o.statut === f.statut)) && (!f.agent || o.agent === f.agent) && (!f.financement || o.financement === f.financement) && (!q || (p.titre + ' ' + p.quartier + ' ' + c.nom).toLowerCase().includes(q)); });
    const s = { recent: (a, b) => lastAct(b).date.localeCompare(lastAct(a).date), montant: (a, b) => b.montant - a.montant, ecart: (a, b) => ecart(b) - ecart(a), validite: (a, b) => a.validite.localeCompare(b.validite) }[f.tri];
    return rows.sort(s);
  }
  function renderOffres() {
    const v = $('#view-offres'); const f = state.offreFilters;
    const ouvertes = offres.filter(isOpen); const closes = offres.filter(o => ['Acceptée', 'Refusée'].includes(o.statut));
    const accept = offres.filter(o => o.statut === 'Acceptée').length;
    const volume = ouvertes.reduce((s, o) => s + o.montant, 0);
    const ecartMoy = ouvertes.length ? Math.round(ouvertes.reduce((s, o) => s + ecart(o), 0) / ouvertes.length * 10) / 10 : 0;
    const urgent = ouvertes.filter(o => daysBetween(TODAY, o.validite) <= 3).sort((a, b) => a.validite.localeCompare(b.validite));
    v.innerHTML = `
      <div class="page-head"><div><h2>Offres et négociations</h2><p>${ouvertes.length} négociations en cours · ${offres.filter(o => o.statut === 'Contre-proposition').length} contre-propositions · ${accept} acceptée${accept > 1 ? 's' : ''}</p></div>
        <div class="actions"><button class="btn" data-action="export-offres">${I.download} Exporter</button><button class="btn primary" data-action="add-offre">${I.plus} Nouvelle offre</button></div></div>
      <div class="grid kpi-row" style="margin-bottom:16px">
        ${kpiCompact('Offres en cours', ouvertes.length, '', 2, [3, 4, 4, 5, 5, 6, ouvertes.length], 'sur ' + new Set(ouvertes.map(o => o.bien)).size + ' biens')}
        ${kpiCompact('Montant en négociation', money(volume, { short: true }), '', 14, [600, 650, 700, 820, 900, 1000, 1150], 'cumul des offres ouvertes')}
        ${kpiCompact('Écart moyen au prix', ecartMoy, ' %', 1.2, [-9, -8.5, -8, -7.5, -7, -6.8, ecartMoy], 'offre vs prix affiché')}
        ${kpiCompact('Taux d’acceptation', closes.length ? Math.round(accept / closes.length * 100) : 0, ' %', 5, [40, 42, 45, 48, 50, 50, 50], accept + ' acceptée' + (accept > 1 ? 's' : '') + ' / ' + closes.length + ' clôturées')}
      </div>
      ${urgent.length ? `<div class="alert-strip">${I.bell}<div><b>${urgent.length} offre${urgent.length > 1 ? 's' : ''} à traiter rapidement</b><span>${urgent.map(o => `<a href="#" data-offre="${o.id}">${esc(propOf(o.bien).titre)} · ${esc(clientOf(o.client).nom)} · ${validiteLabel(o).toLowerCase()}</a>`).join('')}</span></div></div>` : ''}
      <div class="card">
        <div class="filters" id="offre-filters">
          <label class="input" style="min-width:220px">${I.search}<input type="search" data-key="q" placeholder="Bien, acheteur, quartier…" value="${esc(f.q)}" /></label>
          <label class="select">${I.filter}<select data-key="statut" aria-label="Statut"><option value="">Statut</option><option value="ouvertes" ${f.statut === 'ouvertes' ? 'selected' : ''}>Ouvertes</option>${offreStatuts.map(s => `<option ${f.statut === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
          ${selectCtl('financement', 'Financement', ['Comptant', 'Crédit', 'Mixte'], f.financement, I.tag)}
          <label class="select">${I.user}<select data-key="agent" aria-label="Conseiller"><option value="">Conseiller</option>${agents.map(a => `<option value="${a.id}" ${f.agent === a.id ? 'selected' : ''}>${a.nom}</option>`).join('')}</select></label>
          <label class="select">${I.trend}<select data-key="tri" aria-label="Trier"><option value="recent" ${f.tri === 'recent' ? 'selected' : ''}>Dernière activité</option><option value="montant" ${f.tri === 'montant' ? 'selected' : ''}>Montant</option><option value="ecart" ${f.tri === 'ecart' ? 'selected' : ''}>Écart au prix</option><option value="validite" ${f.tri === 'validite' ? 'selected' : ''}>Validité</option></select></label>
          <span class="spacer"></span>
          <div class="segmented" id="offre-mode"><button data-mode="table" class="${f.mode === 'table' ? 'active' : ''}" aria-label="Liste">${I.list}</button><button data-mode="board" class="${f.mode === 'board' ? 'active' : ''}" aria-label="Par bien">${I.grid}</button></div>
        </div>
        <div id="offres-body"></div>
      </div>`;
    $('#offre-filters').addEventListener('input', e => { if (e.target.dataset.key) { f[e.target.dataset.key] = e.target.value; renderOffresBody(); } });
    $('#offre-mode').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; f.mode = b.dataset.mode; $$('#offre-mode button').forEach(x => x.classList.toggle('active', x === b)); renderOffresBody(); });
    renderOffresBody();
  }
  const offreActions = o => isOpen(o) ? `<button aria-label="Accepter" title="Accepter" data-action="accept-offre" data-offre-id="${o.id}">${I.check}</button><button aria-label="Contre-proposer" title="Contre-proposer" data-action="counter-offre" data-offre-id="${o.id}">${I.trend}</button><button aria-label="Refuser" title="Refuser" data-action="refuse-offre" data-offre-id="${o.id}">${I.x}</button>` : `<button aria-label="Détail" title="Détail" data-offre="${o.id}">${I.eye}</button>`;
  function renderOffresBody() {
    const rows = filteredOffres(); const body = $('#offres-body'); const f = state.offreFilters;
    if (!rows.length) { body.innerHTML = `<div class="empty">${I.tag}<div>Aucune offre ne correspond aux filtres.</div></div>`; return; }
    if (f.mode === 'board') {
      const byBien = [...new Set(rows.map(o => o.bien))].map(id => ({ p: propOf(id), list: rows.filter(o => o.bien === id).sort((a, b) => b.montant - a.montant) }));
      body.innerHTML = `<div class="offer-board">${byBien.map(({ p, list }) => { const best = list.find(isOpen) || list[0]; return `<div class="offer-col"><div class="offer-col-head" data-prop="${p.id}"><img src="${p.img}" alt="" /><div><b>${esc(p.titre)}</b><small>${esc(p.quartier)} · prix affiché <b>${priceOf(p)}</b></small></div><span class="tag ${statutTag(p.statut)}">${p.statut}</span></div>
        <div class="offer-gauge"><small>${list.some(isOpen) ? 'Meilleure offre ouverte' : 'Dernière offre'}</small><div class="row-between"><b>${best ? money(best.montant, { short: true }) : '—'}</b>${best ? ecartHtml(best) : ''}</div><i><b style="width:${best ? Math.min(100, Math.round(best.montant / p.prix * 100)) : 0}%"></b></i></div>
        ${list.map(o => { const c = clientOf(o.client); return `<div class="offer-card ${isOpen(o) ? '' : 'closed'}" data-offre="${o.id}"><div class="row-between">${avatarClient(c, 'xs')}<span class="tag ${offreTag(o.statut)}">${o.statut}</span></div><b>${money(o.montant, { short: true })} ${ecartHtml(o)}</b><small>${esc(c.nom)} · ${o.financement}</small><small>${dateFR(lastAct(o).date)} · ${esc(lastAct(o).auteur)}${validiteLabel(o) ? ' · ' + validiteLabel(o).toLowerCase() : ''}</small></div>`; }).join('')}</div>`; }).join('')}</div>`;
      return;
    }
    body.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Bien</th><th>Acheteur</th><th>Offre</th><th>Écart</th><th>Financement</th><th>Dernière action</th><th>Validité</th><th>Conseiller</th><th>Statut</th><th style="text-align:right">Actions</th></tr></thead><tbody>
      ${rows.map(o => { const p = propOf(o.bien); const c = clientOf(o.client); const a = agentOf(o.agent); const l = lastAct(o); const j = daysBetween(TODAY, o.validite);
        return `<tr class="clickable" data-offre="${o.id}">
          <td><div class="cell-prop"><img src="${p.img}" alt="" /><div><b>${esc(p.titre)}</b><small>${esc(p.quartier)} · ${priceOf(p)}</small></div></div></td>
          <td><div class="cell-agent">${avatarClient(c, 'xs')}<div><b style="font-weight:600;display:block">${esc(c.nom)}</b><small style="color:var(--ink-3)">${c.type} · budget ${money(c.budget, { short: true })}</small></div></div></td>
          <td class="num"><b>${money(o.montant, { short: true })}</b><br><small style="color:var(--ink-3)">${o.historique.length} échange${o.historique.length > 1 ? 's' : ''}</small></td>
          <td class="num">${ecartHtml(o)}</td>
          <td><span class="tag muted no-dot">${o.financement}</span></td>
          <td class="last-act"><small style="display:block;font-weight:600">${l.auteur} · ${dateFR(l.date)}</small><small style="color:var(--ink-3)" title="${esc(l.note)}">${esc(l.note)}</small></td>
          <td class="num">${isOpen(o) ? `<span class="${j <= 3 ? 'delta neg' : ''}">${validiteLabel(o)}</span>` : `<small style="color:var(--ink-3)">${dateFR(o.validite)}</small>`}</td>
          <td><div class="cell-agent">${avatar(a, 'xs')}${esc(a.nom.split(' ')[0])}</div></td>
          <td><span class="tag ${offreTag(o.statut)}">${o.statut}</span></td>
          <td><div class="row-actions">${offreActions(o)}</div></td></tr>`; }).join('')}</tbody></table></div>`;
  }
  function openOffre(id) {
    const o = offreOf(id); if (!o) return; const p = propOf(o.bien); const c = clientOf(o.client); const a = agentOf(o.agent);
    const others = offres.filter(x => x.bien === o.bien && x.id !== o.id);
    const pct = Math.min(100, Math.round(o.montant / p.prix * 100)); const open = isOpen(o);
    openModal(`<span class="tag ${offreTag(o.statut)}">${o.statut}</span><span class="tag muted no-dot" style="margin-left:6px">${o.financement}</span>${open ? `<span class="tag ${daysBetween(TODAY, o.validite) <= 3 ? 'danger' : 'muted'} no-dot" style="margin-left:6px">${validiteLabel(o)}</span>` : ''}
      <h3 style="margin-top:10px">${money(o.montant, { short: true })} <span class="muted-txt" style="font-size:14px;font-weight:400">pour</span> ${esc(p.titre)}</h3><div class="sub">Déposée le ${dateFR(o.date, { day: 'numeric', month: 'long' })} · suivie par ${esc(a.nom)}</div>
      <div class="two-col">
        <div>
          <div class="agent-line" style="cursor:pointer;margin-top:0" data-prop="${p.id}"><img src="${p.img}" alt="" style="width:56px;height:44px;border-radius:8px;object-fit:cover" /><div><b>${esc(p.titre)}</b><small>Prix affiché ${priceOf(p)} · ${p.statut}</small></div><span class="card-link" style="margin-left:auto">${I.arrow}</span></div>
          <div class="owner-box" style="margin-top:8px;cursor:pointer" data-client="${c.id}">${avatarClient(c, 'sm')}<div><b>${esc(c.nom)}</b><small>${c.type} · budget ${money(c.budget, { short: true })} · score ${c.score}</small></div><span class="card-link">${I.arrow}</span></div>
          <div class="offer-gauge big" style="margin-top:14px"><div class="row-between"><small>Offre vs prix affiché</small>${ecartHtml(o)}</div><i><b style="width:${pct}%"></b><em style="left:${Math.min(100, Math.round(c.budget / p.prix * 100))}%" title="Budget déclaré"></em></i><div class="row-between"><small>${money(o.montant, { short: true })}</small><small>budget ${money(c.budget, { short: true })} · prix ${money(p.prix, { short: true })}</small></div></div>
          <div class="stat3" style="margin-top:14px"><div><b>${o.historique.length}</b><small>Échanges</small></div><div><b>${daysBetween(o.date, TODAY)} j</b><small>Durée</small></div><div><b>${others.length}</b><small>Offre${others.length > 1 ? 's' : ''} concurrente${others.length > 1 ? 's' : ''}</small></div></div>
          <h4 class="card-title" style="font-size:14px;margin:16px 0 6px">Conditions</h4><p class="cond">${esc(o.conditions)}</p>
          ${others.length ? `<h4 class="card-title" style="font-size:14px;margin:16px 0 8px">Autres offres sur ce bien</h4>${others.map(x => `<div class="mini-offer" data-offre="${x.id}">${avatarClient(clientOf(x.client), 'xs')}<b>${money(x.montant, { short: true })}</b>${ecartHtml(x)}<small>${esc(clientOf(x.client).nom)}</small><span class="tag ${offreTag(x.statut)} no-dot">${x.statut}</span></div>`).join('')}` : ''}
        </div>
        <div>
          <h4 class="card-title" style="font-size:14px;margin:0 0 10px">Fil de négociation</h4>
          <ul class="nego">${[...o.historique].reverse().map((h, i, arr) => { const prev = arr[i + 1]; return `<li class="${h.auteur === 'Vendeur' ? 'seller' : 'buyer'}"><div class="who">${h.auteur === 'Vendeur' ? 'Vendeur' : esc(c.nom.split(' ')[0])}<small>${dateFR(h.date, { day: 'numeric', month: 'short' })}</small></div><div class="bubble"><b>${money(h.montant, { short: true })}${prev && prev.montant !== h.montant ? ` <span class="delta ${h.montant < prev.montant ? 'neg' : 'pos'}">${h.montant < prev.montant ? I.down : I.up} ${Math.abs(Math.round((h.montant / prev.montant - 1) * 1000) / 10)} %</span>` : ''}</b><p>${esc(h.note)}</p></div></li>`; }).join('')}</ul>
          ${open ? `<form id="form-counter" class="counter-form"><div class="field"><label>Contre-proposition (€)</label><label class="input">${I.tag}<input name="montant" type="number" min="1" placeholder="${p.prix}" required /></label></div><div class="field"><label>Message</label><input name="note" placeholder="Commentaire pour l’acheteur" /></div><div class="row-between"><label class="select" style="flex:1">${I.user}<select name="auteur"><option>Vendeur</option><option>Acheteur</option></select></label><button class="btn sm" data-action="counter-submit" data-offre-id="${o.id}">${I.send} Envoyer</button></div></form>` : ''}
        </div>
      </div>
      <div class="modal-foot">${open ? `<button class="btn ghost" data-action="withdraw-offre" data-offre-id="${o.id}">Retirer</button><button class="btn" data-action="refuse-offre" data-offre-id="${o.id}">${I.x} Refuser</button><button class="btn" data-action="planifier" data-prop-id="${p.id}">${I.cal} Rendez-vous</button><button class="btn primary" data-action="accept-offre" data-offre-id="${o.id}">${I.check} Accepter l’offre</button>` : `<button class="btn" data-action="share">${I.share} Exporter le récapitulatif</button>${o.statut !== 'Acceptée' ? `<button class="btn primary" data-action="reopen-offre" data-offre-id="${o.id}">Relancer la négociation</button>` : ''}`}</div>`, true);
  }
  function openAddOffre(propId, clientId) {
    const biens = properties.filter(p => !['Vendu', 'Loué'].includes(p.statut));
    const achs = clients.filter(c => c.type !== 'Vendeur');
    openModal(`<h3>Nouvelle offre</h3><div class="sub">Enregistrer une offre d’achat ou de location reçue.</div>
      <form id="form-offre" class="form-grid">
        <div class="field full"><label>Bien</label><select name="bien" required>${biens.map(p => `<option value="${p.id}" ${p.id === propId ? 'selected' : ''}>${esc(p.titre)} — ${priceOf(p)}</option>`).join('')}</select></div>
        <div class="field full"><label>Acheteur / locataire</label><select name="client" required>${achs.map(c => `<option value="${c.id}" ${c.id === clientId ? 'selected' : ''}>${esc(c.nom)} — ${c.type}${c.budget ? ' · ' + money(c.budget, { short: true }) : ''}</option>`).join('')}</select></div>
        <div class="field"><label>Montant (€)</label><input name="montant" type="number" min="1" required placeholder="2500000" /></div>
        <div class="field"><label>Financement</label><select name="financement"><option>Comptant</option><option>Crédit</option><option>Mixte</option></select></div>
        <div class="field"><label>Date de l’offre</label><input name="date" type="date" value="${TODAY}" required /></div>
        <div class="field"><label>Validité (jours)</label><select name="validite"><option value="7">7 jours</option><option value="14" selected>14 jours</option><option value="30">30 jours</option></select></div>
        <div class="field full"><label>Conditions suspensives</label><input name="conditions" placeholder="Accord de crédit, vente d’un bien…" /></div>
        <div class="field full"><label>Note interne</label><input name="note" placeholder="Contexte de l’offre" /></div>
        <div class="field full"><label>Conseiller</label><select name="agent">${agents.map(a => `<option value="${a.id}">${a.nom}</option>`).join('')}</select></div>
      </form><div class="modal-foot"><button class="btn ghost" data-action="close">Annuler</button><button class="btn primary" data-action="submit-offre">Enregistrer l’offre</button></div>`);
  }
  const refreshOffres = () => { if (current === 'offres') renderOffres(); else if (current === 'dashboard') renderDashboard(); };

  /* ============================================================
     TÂCHES & RAPPELS
     ============================================================ */
  const tacheOf = id => taches.find(t => t.id === id);
  const tacheTypes = ['Appel', 'Relance', 'Document', 'Visite', 'Administratif', 'Marketing'];
  const priorites = ['Haute', 'Moyenne', 'Basse'];
  const prioTag = p => ({ Haute: 'danger', Moyenne: 'warn', Basse: 'muted' }[p] || 'muted');
  const tacheIcon = t => ({ Appel: I.phone, Relance: I.send, Document: I.doc, Visite: I.home, Administratif: I.edit, Marketing: I.share }[t] || I.check);
  const isDone = t => t.statut === 'Terminée';
  const isLate = t => !isDone(t) && t.echeance < TODAY;
  const isToday = t => t.echeance === TODAY;
  const bucketOf = t => { if (isDone(t)) return 'done'; const j = daysBetween(TODAY, t.echeance); if (j < 0) return 'late'; if (j === 0) return 'today'; if (j === 1) return 'tomorrow'; if (j <= 7) return 'week'; return 'later'; };
  const bucketLabels = { late: 'En retard', today: 'Aujourd’hui', tomorrow: 'Demain', week: 'Cette semaine', later: 'Plus tard', done: 'Terminées' };
  const rappelLabel = r => !r ? 'Aucun rappel' : r < 60 ? `Rappel ${r} min avant` : r < 1440 ? `Rappel ${r / 60} h avant` : `Rappel ${r / 1440} j avant`;
  const echeanceLabel = t => { const j = daysBetween(TODAY, t.echeance); const base = j === 0 ? 'Aujourd’hui' : j === 1 ? 'Demain' : j === -1 ? 'Hier' : j < 0 ? `Il y a ${-j} j` : dateFR(t.echeance, { weekday: 'short', day: 'numeric', month: 'short' }); return base + (t.heure ? ' · ' + t.heure : ''); };
  const tacheLinks = t => [t.client && `<span class="link-chip" data-client="${t.client}">${I.user} ${esc(clientOf(t.client).nom)}</span>`, t.bien && `<span class="link-chip" data-prop="${t.bien}">${I.home} ${esc(propOf(t.bien).titre)}</span>`, t.mandat && `<span class="link-chip" data-mandat="${t.mandat}">${I.doc} Mandat</span>`, t.offre && `<span class="link-chip" data-offre="${t.offre}">${I.tag} Offre ${money(offreOf(t.offre).montant, { short: true })}</span>`].filter(Boolean).join('');

  /* Rappels automatiques déduits des autres modules (non stockés) */
  function autoRappels() {
    const out = [];
    mandats.filter(m => ['Expire bientôt', 'Expiré'].includes(mandatStatut(m))).forEach(m => { if (!taches.some(t => t.mandat === m.id && !isDone(t))) out.push({ key: 'm-' + m.id, titre: `Renouveler le mandat — ${propOf(m.bien).titre}`, type: 'Administratif', priorite: 'Haute', echeance: m.fin < TODAY ? TODAY : m.fin, agent: m.agent, bien: m.bien, mandat: m.id, source: joursLabel(daysBetween(TODAY, m.fin)) }); });
    mandats.filter(m => ['Actif', 'Expire bientôt'].includes(mandatStatut(m))).forEach(m => { const miss = m.documents.filter(d => d.statut === 'Manquant' || d.statut === 'À signer'); if (miss.length && !taches.some(t => t.mandat === m.id && t.type === 'Document' && !isDone(t))) out.push({ key: 'd-' + m.id, titre: `Collecter ${miss.length} document${miss.length > 1 ? 's' : ''} — ${propOf(m.bien).titre}`, type: 'Document', priorite: 'Moyenne', echeance: addDays(TODAY, 3), agent: m.agent, bien: m.bien, mandat: m.id, source: miss.map(d => d.nom).join(', ') }); });
    offres.filter(o => isOpen(o) && daysBetween(TODAY, o.validite) <= 3).forEach(o => { if (!taches.some(t => t.offre === o.id && !isDone(t))) out.push({ key: 'o-' + o.id, titre: `Répondre à l’offre de ${clientOf(o.client).nom}`, type: 'Appel', priorite: 'Haute', echeance: o.validite < TODAY ? TODAY : o.validite, agent: o.agent, client: o.client, bien: o.bien, offre: o.id, source: validiteLabel(o) }); });
    clients.filter(c => c.type !== 'Vendeur' && c.etape !== 'Signé' && daysBetween(c.dernier, TODAY) >= 7).forEach(c => { if (!taches.some(t => t.client === c.id && !isDone(t))) out.push({ key: 'c-' + c.id, titre: `Relancer ${c.nom}`, type: 'Relance', priorite: 'Moyenne', echeance: TODAY, agent: c.agent, client: c.id, source: `Sans contact depuis ${daysBetween(c.dernier, TODAY)} j` }); });
    return out;
  }

  function filteredTaches() {
    const f = state.tacheFilters; const q = f.q.toLowerCase();
    return taches.filter(t => (!f.statut || (f.statut === 'ouvertes' ? !isDone(t) : f.statut === 'retard' ? isLate(t) : t.statut === f.statut)) && (!f.priorite || t.priorite === f.priorite) && (!f.type || t.type === f.type) && (!f.agent || t.agent === f.agent) && (!q || (t.titre + ' ' + (t.note || '') + ' ' + (t.client ? clientOf(t.client).nom : '') + ' ' + (t.bien ? propOf(t.bien).titre : '')).toLowerCase().includes(q)))
      .sort((a, b) => (isDone(a) - isDone(b)) || a.echeance.localeCompare(b.echeance) || (a.heure || '99').localeCompare(b.heure || '99') || priorites.indexOf(a.priorite) - priorites.indexOf(b.priorite));
  }
  function renderTaches() {
    const v = $('#view-taches'); const f = state.tacheFilters;
    const open = taches.filter(t => !isDone(t)); const late = taches.filter(isLate); const today = taches.filter(t => isToday(t) && !isDone(t));
    const doneWeek = taches.filter(t => isDone(t) && t.terminee && daysBetween(t.terminee, TODAY) <= 7);
    const echues = taches.filter(t => t.echeance <= TODAY);
    const mine = open.filter(t => t.agent === 'a1').length; const auto = autoRappels();
    v.innerHTML = `
      <div class="page-head"><div><h2>Tâches et rappels</h2><p>${open.length} tâches ouvertes · ${today.length} aujourd’hui · ${late.length} en retard · ${mine} pour vous</p></div>
        <div class="actions"><button class="btn" data-action="export-taches">${I.download} Exporter</button><button class="btn primary" data-action="add-tache">${I.plus} Nouvelle tâche</button></div></div>
      <div class="grid kpi-row" style="margin-bottom:16px">
        ${kpiCompact('À faire aujourd’hui', today.length, '', 0, [3, 5, 4, 6, 4, 5, today.length], late.length ? late.length + ' en retard à traiter' : 'aucun retard')}
        ${kpiCompact('En retard', late.length, '', -1, [4, 4, 3, 3, 2, 3, late.length], 'échéance dépassée')}
        ${kpiCompact('Terminées (7 jours)', doneWeek.length, '', 12, [4, 5, 6, 5, 7, 8, doneWeek.length], 'sur toute l’équipe')}
        ${kpiCompact('Taux de complétion', Math.round(echues.filter(isDone).length / Math.max(1, echues.length) * 100), ' %', 4, [55, 58, 60, 62, 61, 65, 68], 'tâches arrivées à échéance')}
      </div>
      ${auto.length ? `<div class="card auto-card" style="margin-bottom:16px"><div class="card-head"><div><h3 class="card-title">Rappels suggérés</h3><div class="card-sub">Déduits des mandats, offres et contacts sans suivi · non enregistrés tant que vous ne les acceptez pas</div></div><span class="tag warn no-dot">${auto.length}</span></div>
        <div class="auto-grid">${auto.slice(0, 6).map(r => `<div class="auto-item"><span class="t-ico">${tacheIcon(r.type)}</span><div><b>${esc(r.titre)}</b><small>${esc(r.source)} · ${agentOf(r.agent).nom.split(' ')[0]} · ${dateFR(r.echeance)}</small></div><button class="btn sm" data-action="accept-auto" data-key="${r.key}">${I.plus} Créer</button></div>`).join('')}</div></div>` : ''}
      <div class="card">
        <div class="filters" id="tache-filters">
          <label class="input" style="min-width:220px">${I.search}<input type="search" data-key="q" placeholder="Tâche, client, bien…" value="${esc(f.q)}" /></label>
          <label class="select">${I.filter}<select data-key="statut" aria-label="Statut"><option value="">Statut</option><option value="ouvertes" ${f.statut === 'ouvertes' ? 'selected' : ''}>Ouvertes</option><option value="retard" ${f.statut === 'retard' ? 'selected' : ''}>En retard</option><option ${f.statut === 'À faire' ? 'selected' : ''}>À faire</option><option ${f.statut === 'En cours' ? 'selected' : ''}>En cours</option><option ${f.statut === 'Terminée' ? 'selected' : ''}>Terminée</option></select></label>
          ${selectCtl('priorite', 'Priorité', priorites, f.priorite, I.tag)}
          ${selectCtl('type', 'Type', tacheTypes, f.type, I.list)}
          <label class="select">${I.user}<select data-key="agent" aria-label="Conseiller"><option value="">Conseiller</option>${agents.map(a => `<option value="${a.id}" ${f.agent === a.id ? 'selected' : ''}>${a.nom}</option>`).join('')}</select></label>
          <span class="spacer"></span>
          <div class="segmented" id="tache-mode"><button data-mode="list" class="${f.mode === 'list' ? 'active' : ''}" aria-label="Liste">${I.list}</button><button data-mode="board" class="${f.mode === 'board' ? 'active' : ''}" aria-label="Tableau">${I.grid}</button></div>
        </div>
        <div id="taches-body"></div>
      </div>`;
    $('#tache-filters').addEventListener('input', e => { if (e.target.dataset.key) { f[e.target.dataset.key] = e.target.value; renderTachesBody(); } });
    $('#tache-mode').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; f.mode = b.dataset.mode; $$('#tache-mode button').forEach(x => x.classList.toggle('active', x === b)); renderTachesBody(); });
    renderTachesBody();
  }
  const tacheRow = t => { const a = agentOf(t.agent); return `<div class="task ${isDone(t) ? 'done' : ''} ${isLate(t) ? 'late' : ''}" data-tache="${t.id}" draggable="true">
      <button class="check" data-action="toggle-tache" data-tache-id="${t.id}" aria-label="${isDone(t) ? 'Rouvrir' : 'Terminer'}">${I.check}</button>
      <span class="t-ico">${tacheIcon(t.type)}</span>
      <div class="t-body"><b>${esc(t.titre)}</b><div class="t-meta"><span class="${isLate(t) ? 'delta neg' : ''}">${I.cal} ${echeanceLabel(t)}</span><span class="tag ${prioTag(t.priorite)} no-dot">${t.priorite}</span><span class="tag muted no-dot">${t.type}</span>${t.statut === 'En cours' ? '<span class="tag info no-dot">En cours</span>' : ''}${tacheLinks(t)}</div></div>
      <div class="t-right">${avatar(a, 'xs')}<div class="row-actions"><button aria-label="Reporter" title="Reporter d’un jour" data-action="postpone-tache" data-tache-id="${t.id}" data-days="1">${I.cal}</button><button aria-label="Détail" title="Détail" data-tache="${t.id}">${I.eye}</button></div></div></div>`; };
  function renderTachesBody() {
    const rows = filteredTaches(); const body = $('#taches-body'); const f = state.tacheFilters;
    if (!rows.length) { body.innerHTML = `<div class="empty">${I.check}<div>Aucune tâche ne correspond aux filtres.</div></div>`; return; }
    if (f.mode === 'board') {
      const cols = ['À faire', 'En cours', 'Terminée'];
      body.innerHTML = `<div class="kanban tasks-kanban">${cols.map(s => { const list = rows.filter(t => t.statut === s); return `<div class="kcol" data-statut="${s}"><div class="kcol-head">${s}<span>${list.length}</span></div>${list.map(t => `<div class="kcard task-card ${isLate(t) ? 'late' : ''}" draggable="true" data-tache="${t.id}"><div class="row-between"><span class="t-ico sm">${tacheIcon(t.type)}</span><span class="tag ${prioTag(t.priorite)} no-dot">${t.priorite}</span></div><b>${esc(t.titre)}</b><small class="${isLate(t) ? 'delta neg' : ''}">${echeanceLabel(t)}</small>${t.bien ? `<small>${I.home.replace('<svg', '<svg style="width:10px;height:10px;vertical-align:-1px"')} ${esc(propOf(t.bien).titre)}</small>` : ''}<div class="kfoot"><span></span>${avatar(agentOf(t.agent), 'xs')}</div></div>`).join('')}</div>`; }).join('')}</div>`;
      let dragged = null;
      $$('.task-card', body).forEach(k => { k.addEventListener('dragstart', () => { dragged = k; k.classList.add('dragging'); }); k.addEventListener('dragend', () => { k.classList.remove('dragging'); dragged = null; }); });
      $$('.kcol', body).forEach(col => { col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('over'); }); col.addEventListener('dragleave', () => col.classList.remove('over')); col.addEventListener('drop', e => { e.preventDefault(); col.classList.remove('over'); if (!dragged) return; setTacheStatut(tacheOf(dragged.dataset.tache), col.dataset.statut); renderTachesBody(); }); });
      return;
    }
    const groups = ['late', 'today', 'tomorrow', 'week', 'later', 'done'].map(k => ({ k, list: rows.filter(t => bucketOf(t) === k) })).filter(g => g.list.length);
    body.innerHTML = groups.map(g => `<div class="task-group"><div class="task-group-head ${g.k}"><b>${bucketLabels[g.k]}</b><span>${g.list.length}</span></div>${g.list.map(tacheRow).join('')}</div>`).join('');
  }
  function setTacheStatut(t, s) { t.statut = s; if (s === 'Terminée') { t.terminee = TODAY; toast('Tâche terminée'); } else { delete t.terminee; toast('Tâche → ' + s); } }
  const refreshTaches = () => { if (current === 'taches') renderTaches(); else if (current === 'agenda' || current === 'dashboard') route(); updateTaskDot(); };
  function updateTaskDot() { const n = taches.filter(t => isLate(t) || (isToday(t) && !isDone(t))).length; const d = $('#task-dot'); if (d) d.style.display = n ? '' : 'none'; }
  function openTache(id) {
    const t = tacheOf(id); if (!t) return; const a = agentOf(t.agent);
    openModal(`<span class="tag ${isDone(t) ? 'ok' : isLate(t) ? 'danger' : t.statut === 'En cours' ? 'info' : 'warn'}">${isDone(t) ? 'Terminée' : isLate(t) ? 'En retard' : t.statut}</span><span class="tag ${prioTag(t.priorite)} no-dot" style="margin-left:6px">Priorité ${t.priorite.toLowerCase()}</span><span class="tag muted no-dot" style="margin-left:6px">${t.type}</span>
      <h3 style="margin-top:10px">${esc(t.titre)}</h3><div class="sub">${echeanceLabel(t)} · ${rappelLabel(t.rappel).toLowerCase()} · créée le ${dateFR(t.creee)}${t.terminee ? ' · terminée le ' + dateFR(t.terminee) : ''}</div>
      ${t.note ? `<p class="cond">${esc(t.note)}</p>` : ''}
      <div class="stat3" style="margin-top:14px"><div><b>${esc(a.nom)}</b><small>Assignée à</small></div><div><b>${isDone(t) ? '—' : daysBetween(TODAY, t.echeance) < 0 ? -daysBetween(TODAY, t.echeance) + ' j de retard' : daysBetween(TODAY, t.echeance) + ' j'}</b><small>${isDone(t) ? 'Clôturée' : 'Délai restant'}</small></div><div><b>${t.heure || 'Journée'}</b><small>Heure</small></div></div>
      ${tacheLinks(t) ? `<h4 class="card-title" style="font-size:14px;margin:16px 0 8px">Éléments liés</h4><div class="t-meta big">${tacheLinks(t)}</div>` : ''}
      <h4 class="card-title" style="font-size:14px;margin:16px 0 8px">Modifier</h4>
      <form id="form-tache-edit" class="form-grid">
        <div class="field"><label>Échéance</label><input name="echeance" type="date" value="${t.echeance}" /></div><div class="field"><label>Heure</label><input name="heure" type="time" value="${t.heure || ''}" /></div>
        <div class="field"><label>Priorité</label><select name="priorite">${priorites.map(p => `<option ${t.priorite === p ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
        <div class="field"><label>Assigner à</label><select name="agent">${agents.map(x => `<option value="${x.id}" ${t.agent === x.id ? 'selected' : ''}>${x.nom}</option>`).join('')}</select></div>
        <div class="field full"><label>Rappel</label><select name="rappel">${[[0, 'Aucun'], [15, '15 min avant'], [30, '30 min avant'], [60, '1 h avant'], [1440, '1 jour avant']].map(([v, l]) => `<option value="${v}" ${t.rappel === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      </form>
      <div class="modal-foot"><button class="btn ghost" data-action="delete-tache" data-tache-id="${t.id}">Supprimer</button>${!isDone(t) ? `<button class="btn" data-action="postpone-tache" data-tache-id="${t.id}" data-days="1">${I.cal} +1 jour</button><button class="btn" data-action="postpone-tache" data-tache-id="${t.id}" data-days="7">${I.cal} +1 semaine</button>` : ''}<button class="btn" data-action="save-tache" data-tache-id="${t.id}">Enregistrer</button><button class="btn primary" data-action="toggle-tache" data-tache-id="${t.id}">${I.check} ${isDone(t) ? 'Rouvrir' : 'Terminer'}</button></div>`);
  }
  function openAddTache(pre = {}) {
    const tpl = [['Appel', 'Rappeler le client'], ['Relance', 'Relancer après visite'], ['Document', 'Envoyer le dossier du bien'], ['Administratif', 'Préparer le compromis'], ['Marketing', 'Programmer le shooting photo']];
    openModal(`<h3>Nouvelle tâche</h3><div class="sub">Créer une tâche ou un rappel, éventuellement lié à un client ou un bien.</div>
      <div class="chips" style="margin-bottom:14px">${tpl.map(([ty, ti]) => `<button type="button" class="chip-btn" data-action="tpl-tache" data-type="${ty}" data-titre="${ti}">${tacheIcon(ty)} ${ti}</button>`).join('')}</div>
      <form id="form-tache" class="form-grid">
        <div class="field full"><label>Titre</label><input name="titre" required placeholder="Que faut-il faire ?" value="${esc(pre.titre || '')}" /></div>
        <div class="field"><label>Type</label><select name="type">${tacheTypes.map(x => `<option ${pre.type === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
        <div class="field"><label>Priorité</label><select name="priorite">${priorites.map(x => `<option ${(pre.priorite || 'Moyenne') === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
        <div class="field"><label>Échéance</label><input name="echeance" type="date" value="${pre.echeance || TODAY}" required /></div><div class="field"><label>Heure</label><input name="heure" type="time" /></div>
        <div class="field"><label>Client lié</label><select name="client"><option value="">— Aucun —</option>${clients.map(c => `<option value="${c.id}" ${pre.client === c.id ? 'selected' : ''}>${esc(c.nom)}</option>`).join('')}</select></div>
        <div class="field"><label>Bien lié</label><select name="bien"><option value="">— Aucun —</option>${properties.map(p => `<option value="${p.id}" ${pre.bien === p.id ? 'selected' : ''}>${esc(p.titre)}</option>`).join('')}</select></div>
        <div class="field"><label>Assigner à</label><select name="agent">${agents.map(x => `<option value="${x.id}" ${(pre.agent || 'a1') === x.id ? 'selected' : ''}>${x.nom}</option>`).join('')}</select></div>
        <div class="field"><label>Rappel</label><select name="rappel"><option value="0">Aucun</option><option value="15">15 min avant</option><option value="30" selected>30 min avant</option><option value="60">1 h avant</option><option value="1440">1 jour avant</option></select></div>
        <div class="field full"><label>Note</label><textarea name="note" placeholder="Contexte, points à aborder…"></textarea></div>
        <input type="hidden" name="mandat" value="${pre.mandat || ''}" /><input type="hidden" name="offre" value="${pre.offre || ''}" />
      </form><div class="modal-foot"><button class="btn ghost" data-action="close">Annuler</button><button class="btn primary" data-action="submit-tache">Créer la tâche</button></div>`);
  }
  const tacheMini = t => `<div class="task mini ${isDone(t) ? 'done' : ''} ${isLate(t) ? 'late' : ''}" data-tache="${t.id}"><button class="check" data-action="toggle-tache" data-tache-id="${t.id}" aria-label="Terminer">${I.check}</button><div class="t-body"><b>${esc(t.titre)}</b><small class="${isLate(t) ? 'delta neg' : ''}">${echeanceLabel(t)} · ${agentOf(t.agent).nom.split(' ')[0]}</small></div><span class="tag ${prioTag(t.priorite)} no-dot">${t.priorite}</span></div>`;
  const tachesBlock = (list, pre, titre = 'Tâches liées') => `<div class="card-head" style="margin:16px 0 8px"><div><h4 class="card-title" style="font-size:14px">${titre}</h4><div class="card-sub">${list.filter(t => !isDone(t)).length} ouverte${list.filter(t => !isDone(t)).length > 1 ? 's' : ''}${list.some(isLate) ? ' · ' + list.filter(isLate).length + ' en retard' : ''}</div></div><button class="btn sm" data-action="add-tache" data-pre="${esc(JSON.stringify(pre))}">${I.plus} Tâche</button></div>${list.length ? list.slice(0, 4).map(tacheMini).join('') : ''}`;

  /* ============================================================
     RAPPORTS PROPRIÉTAIRES
     ============================================================ */
  const rapportOf = id => rapports.find(r => r.id === id);
  const PERIODE = TODAY.slice(0, 7);
  const periodeLabel = p => { const d = new Date(p + '-01T00:00:00').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }); return d[0].toUpperCase() + d.slice(1); };
  const prevPeriode = p => { const d = new Date(p + '-01T00:00:00'); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); };
  const rapportTag = s => ({ Brouillon: 'muted', Envoyé: 'warn', Consulté: 'ok' }[s] || 'muted');
  const avisTag = a => ({ Positif: 'ok', Neutre: 'muted', Négatif: 'danger' }[a] || 'muted');
  const prixM2 = p => p.surface ? p.prix / p.surface / 1000 : p.terrain ? p.prix / p.terrain / 1000 : 0;
  const quartierM2 = p => { const t = p.transaction === 'Location' ? 'location' : p.type === 'Terrain' ? 'terrain' : 'vente'; return marcheM2[t][p.quartier] || (t === 'location' ? 2.2 : t === 'terrain' ? 110 : evolutionPrixM2[evolutionPrixM2.length - 1]); };
  const fmtM2 = v => v < 10 ? nf.format(Math.round(v * 100) / 100) : nf.format(Math.round(v));
  const aProduire = () => mandats.filter(m => ['Actif', 'Expire bientôt'].includes(mandatStatut(m)) && !rapports.some(r => r.mandat === m.id && r.periode === PERIODE));
  const delaiLecture = () => { const l = rapports.filter(r => r.consulte && r.envoye); return l.length ? (l.reduce((s, r) => s + daysBetween(r.envoye, r.consulte), 0) / l.length).toFixed(1).replace('.', ',') : '—'; };
  const rapportOffres = r => offres.filter(o => o.bien === r.bien && o.date.slice(0, 7) === r.periode);
  function filteredRapports() {
    const f = state.rapportFilters; const q = f.q.toLowerCase();
    return rapports.filter(r => { const m = mandatOf(r.mandat); const p = propOf(r.bien); return (!f.statut || r.statut === f.statut) && (!f.periode || r.periode === f.periode) && (!f.agent || m.agent === f.agent) && (!q || (p.titre + ' ' + p.quartier + ' ' + m.proprietaire.nom).toLowerCase().includes(q)); })
      .sort((a, b) => b.periode.localeCompare(a.periode) || b.genere.localeCompare(a.genere));
  }
  function renderRapports() {
    const v = $('#view-rapports'); const f = state.rapportFilters;
    const envoyesMois = rapports.filter(r => r.envoye && r.envoye.slice(0, 7) === PERIODE); const lus = rapports.filter(r => r.statut === 'Consulté'); const sent = rapports.filter(r => r.statut !== 'Brouillon');
    const todo = aProduire(); const brouillons = rapports.filter(r => r.statut === 'Brouillon'); const periodes = [...new Set(rapports.map(r => r.periode))].sort().reverse();
    v.innerHTML = `
      <div class="page-head"><div><h2>Rapports propriétaires</h2><p>${rapports.length} rapports · ${envoyesMois.length} envoyés ce mois · ${todo.length} à produire pour ${periodeLabel(PERIODE).toLowerCase()}</p></div>
        <div class="actions"><button class="btn" data-action="export-rapports">${I.download} Exporter</button><button class="btn primary" data-action="add-rapport">${I.plus} Générer un rapport</button></div></div>
      <div class="grid kpi-row" style="margin-bottom:16px">
        ${kpiCompact('Envoyés ce mois', envoyesMois.length, '', 25, [3, 4, 5, 6, 5, 7, envoyesMois.length], `${brouillons.length} brouillon${brouillons.length > 1 ? 's' : ''} en attente`)}
        ${kpiCompact('Taux de consultation', Math.round(lus.length / Math.max(1, sent.length) * 100), ' %', 6, [60, 64, 70, 68, 72, 75, Math.round(lus.length / Math.max(1, sent.length) * 100)], 'rapports ouverts par les propriétaires')}
        ${kpiCompact('Délai de lecture', delaiLecture(), ' j', -1, [4, 3.5, 3, 3.2, 2.8, 2.4, 2.1], 'moyenne entre envoi et ouverture')}
        ${kpiCompact('À produire', todo.length, '', 0, [6, 5, 6, 4, 5, 4, todo.length], 'mandats actifs sans rapport ce mois')}
      </div>
      ${todo.length ? `<div class="card auto-card" style="margin-bottom:16px"><div class="card-head"><div><h3 class="card-title">À produire — ${periodeLabel(PERIODE)}</h3><div class="card-sub">Mandats actifs sans rapport pour la période en cours</div></div><span class="tag warn no-dot">${todo.length}</span></div>
        <div class="auto-grid">${todo.map(m => { const p = propOf(m.bien); const last = rapports.filter(r => r.mandat === m.id).sort((a, b) => b.periode.localeCompare(a.periode))[0]; return `<div class="auto-item"><img src="${p.img}" alt="" class="auto-thumb" /><div><b>${esc(p.titre)}</b><small>${esc(m.proprietaire.nom)} · ${last ? 'dernier rapport ' + periodeLabel(last.periode).toLowerCase() : 'aucun rapport envoyé'}</small></div><button class="btn sm" data-action="add-rapport" data-mandat-id="${m.id}">${I.plus} Générer</button></div>`; }).join('')}</div></div>` : ''}
      <div class="card">
        <div class="filters" id="rapport-filters">
          <label class="input" style="min-width:220px">${I.search}<input type="search" data-key="q" placeholder="Bien, quartier, propriétaire…" value="${esc(f.q)}" /></label>
          ${selectCtl('statut', 'Statut', ['Brouillon', 'Envoyé', 'Consulté'], f.statut, I.filter)}
          <label class="select">${I.cal}<select data-key="periode" aria-label="Période"><option value="">Période</option>${periodes.map(p => `<option value="${p}" ${f.periode === p ? 'selected' : ''}>${periodeLabel(p)}</option>`).join('')}</select></label>
          <label class="select">${I.user}<select data-key="agent" aria-label="Conseiller"><option value="">Conseiller</option>${agents.map(a => `<option value="${a.id}" ${f.agent === a.id ? 'selected' : ''}>${a.nom}</option>`).join('')}</select></label>
        </div>
        <div id="rapports-body"></div>
      </div>`;
    $('#rapport-filters').addEventListener('input', e => { if (e.target.dataset.key) { f[e.target.dataset.key] = e.target.value; renderRapportsBody(); } });
    renderRapportsBody();
  }
  function renderRapportsBody() {
    const rows = filteredRapports(); const body = $('#rapports-body');
    if (!rows.length) { body.innerHTML = `<div class="empty">${I.doc}<div>Aucun rapport ne correspond aux filtres.</div></div>`; return; }
    body.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Bien · propriétaire</th><th>Période</th><th class="num">Vues</th><th class="num">Contacts</th><th class="num">Visites</th><th class="num">Offres</th><th>Reco.</th><th>Statut</th><th>Suivi</th><th></th></tr></thead>
      <tbody>${rows.map(r => { const p = propOf(r.bien); const m = mandatOf(r.mandat); return `<tr class="clickable" data-rapport="${r.id}">
        <td><div class="cell-prop"><img src="${p.img}" alt="" /><div><b>${esc(p.titre)}</b><small>${esc(m.proprietaire.nom)} · ${esc(agentOf(m.agent).nom.split(' ')[0])}</small></div></div></td>
        <td>${periodeLabel(r.periode)}</td><td class="num">${nf.format(r.stats.vues)}</td><td class="num">${r.stats.contacts}</td><td class="num">${r.stats.visites}</td><td class="num">${r.stats.offres}</td>
        <td>${r.ajustement ? `<span class="delta neg">${I.down} ${r.ajustement} %</span>` : '<span class="tag muted no-dot">Maintien</span>'}</td>
        <td><span class="tag ${rapportTag(r.statut)}">${r.statut}</span></td>
        <td class="owner"><small>${r.statut === 'Brouillon' ? 'Généré le ' + dateFR(r.genere) : r.statut === 'Envoyé' ? 'Envoyé le ' + dateFR(r.envoye) + ' · non lu' : 'Lu le ' + dateFR(r.consulte)}</small></td>
        <td><div class="row-actions"><button aria-label="Aperçu" title="Aperçu" data-rapport="${r.id}">${I.eye}</button>${r.statut === 'Brouillon' ? `<button aria-label="Envoyer" title="Envoyer au propriétaire" data-action="send-rapport" data-rapport-id="${r.id}">${I.send}</button>` : `<button aria-label="Renvoyer" title="Renvoyer" data-action="resend-rapport" data-rapport-id="${r.id}">${I.send}</button>`}</div></td></tr>`; }).join('')}</tbody></table></div>`;
  }
  const refreshRapports = () => { if (current === 'rapports') renderRapports(); };
  function openRapport(id) {
    const r = rapportOf(id); if (!r) return; const p = propOf(r.bien); const m = mandatOf(r.mandat); const a = agentOf(m.agent); const th = chartTheme();
    const os = rapportOffres(r); const pm2 = prixM2(p); const qm2 = quartierM2(p); const ecartM2 = qm2 ? Math.round((pm2 - qm2) / qm2 * 100) : 0; const draft = r.statut === 'Brouillon';
    const maxPortail = Math.max(1, ...r.portails.map(x => x.vues)); const gestion = p.transaction === 'Location' && ['Loué', 'En location'].includes(p.statut);
    openModal(`<span class="tag ${rapportTag(r.statut)}">${r.statut}</span><span class="tag muted no-dot" style="margin-left:6px">${periodeLabel(r.periode)}</span><span class="tag muted no-dot" style="margin-left:6px">${r.canal}</span>
      <h3 style="margin-top:10px">Rapport propriétaire — ${esc(p.titre)}</h3><div class="sub">À l’attention de ${esc(m.proprietaire.nom)} · mandat ${m.type.toLowerCase()} suivi par ${esc(a.nom)} · ${draft ? 'généré le ' + dateFR(r.genere) : 'envoyé le ' + dateFR(r.envoye) + (r.consulte ? ', consulté le ' + dateFR(r.consulte) : ', non consulté')}</div>
      <div class="report">
        <div class="report-hero"><img src="${p.img}" alt="" /><div><small>${esc(p.adresse)}</small><b>${priceOf(p)}</b><small>${p.surface ? p.surface + ' m²' : p.terrain + ' m² de terrain'}${p.chambres ? ' · ' + p.chambres + ' chambres' : ''} · en commercialisation depuis ${daysBetween(m.debut, TODAY)} jours</small></div><span class="tag ${p.statut === 'Disponible' ? 'ok' : 'warn'}">${p.statut}</span></div>
        <div class="report-stats">${[['Vues', nf.format(r.stats.vues)], ['Contacts', r.stats.contacts], ['Visites', r.stats.visites], ['Favoris', r.stats.favoris], ['Offres', r.stats.offres]].map(([l, v]) => `<div><b>${v}</b><small>${l}</small></div>`).join('')}</div>
        ${gestion ? '' : `<div class="two-col" style="margin-top:16px">
          <div><h4 class="card-title" style="font-size:14px;margin:0 0 10px">Audience par semaine</h4><div class="chart-box" style="height:150px"><canvas id="ch-rapport"></canvas></div></div>
          <div><h4 class="card-title" style="font-size:14px;margin:0 0 10px">Répartition par canal</h4>${r.portails.length ? r.portails.map(x => `<div class="portail"><div class="row-between"><span>${esc(x.nom)}</span><small>${nf.format(x.vues)} vues · ${x.contacts} contact${x.contacts > 1 ? 's' : ''}</small></div><i><b style="width:${Math.round(x.vues / maxPortail * 100)}%"></b></i></div>`).join('') : '<div class="empty" style="padding:12px">Aucune diffusion.</div>'}</div>
        </div>`}
        <div class="two-col" style="margin-top:18px">
          <div><h4 class="card-title" style="font-size:14px;margin:0 0 10px">Retours de visites</h4>
            ${r.retours.length ? `<ul class="retours">${r.retours.map(x => `<li><div class="row-between"><b>${esc(x.client)}</b><span class="tag ${avisTag(x.avis)} no-dot">${x.avis}</span></div><small>${dateFR(x.date)} · ${esc(x.commentaire)}</small></li>`).join('')}</ul>` : '<div class="empty" style="padding:12px">Aucune visite sur la période.</div>'}
            <h4 class="card-title" style="font-size:14px;margin:18px 0 10px">Actions menées</h4>
            <ul class="timeline">${r.actions.map(x => `<li><span class="dot"></span><div><b>${esc(x.label)}</b><small>${dateFR(x.date)}</small></div></li>`).join('')}</ul></div>
          <div>${gestion ? '' : `<h4 class="card-title" style="font-size:14px;margin:0 0 10px">Positionnement prix</h4>
            <div class="price-pos"><div><b>${fmtM2(pm2)} €</b><small>votre bien / m²${p.transaction === 'Location' ? ' / mois' : ''}</small></div><div><b>${fmtM2(qm2)} €</b><small>marché ${esc(p.quartier)} / m²</small></div><div><b class="${ecartM2 > 5 ? 'neg' : ecartM2 < -5 ? 'pos' : ''}">${ecartM2 > 0 ? '+' : ''}${ecartM2} %</b><small>écart au marché</small></div></div>
            ${os.length ? `<h4 class="card-title" style="font-size:14px;margin:18px 0 10px">Offres reçues</h4>${os.map(o => `<div class="mini-offer" data-offre="${o.id}">${avatarClient(clientOf(o.client), 'xs')}<b>${money(o.montant, { short: true })}</b>${ecartHtml(o)}<small>${esc(clientOf(o.client).nom)} · ${o.financement} · ${dateFR(o.date)}</small><span class="tag ${offreTag(o.statut)} no-dot">${o.statut}</span></div>`).join('')}` : ''}`}
            <h4 class="card-title" style="font-size:14px;margin:${gestion ? 0 : 18}px 0 10px">Recommandation de l’agence</h4>
            <p class="cond">${esc(r.recommandation)}</p>
            ${r.ajustement ? `<div class="reco-adjust"><span class="delta neg">${I.down} ${r.ajustement} %</span><div><b>Prix proposé : ${money(Math.round(p.prix * (1 + r.ajustement / 100) / 1e5) * 1e5, { short: true, perMonth: p.transaction === 'Location' })}</b><small>au lieu de ${money(p.prix, { short: true, perMonth: p.transaction === 'Location' })}</small></div>${draft ? '' : `<button class="btn sm" data-action="apply-adjust" data-rapport-id="${r.id}">Appliquer</button>`}</div>` : ''}
            <h4 class="card-title" style="font-size:14px;margin:18px 0 8px">Mot du conseiller</h4>
            ${draft ? `<textarea id="rapport-comment" placeholder="Message personnalisé au propriétaire…" style="width:100%">${esc(r.commentaire)}</textarea>` : `<p class="cond" style="border-color:var(--ink-4)">${r.commentaire ? esc(r.commentaire) : '<i style="color:var(--ink-3)">Aucun message ajouté.</i>'}</p>`}
          </div>
        </div>
      </div>
      <div class="modal-foot">${draft ? `<button class="btn ghost" data-action="delete-rapport" data-rapport-id="${r.id}">Supprimer</button>` : ''}<button class="btn" data-action="pdf-rapport">${I.download} PDF</button><button class="btn" data-action="share">${I.share} Lien</button>
        ${draft ? `<button class="btn" data-action="save-rapport" data-rapport-id="${r.id}">Enregistrer</button><button class="btn primary" data-action="send-rapport" data-rapport-id="${r.id}">${I.send} Envoyer au propriétaire</button>` : r.statut === 'Envoyé' ? `<button class="btn" data-action="resend-rapport" data-rapport-id="${r.id}">${I.send} Renvoyer</button><button class="btn primary" data-action="read-rapport" data-rapport-id="${r.id}">${I.check} Marquer consulté</button>` : `<button class="btn primary" data-action="resend-rapport" data-rapport-id="${r.id}">${I.send} Renvoyer</button>`}</div>`, true);
    if (!gestion) requestAnimationFrame(() => mkChart('ch-rapport', { type: 'bar', data: { labels: ['Sem. 1', 'Sem. 2', 'Sem. 3', 'Sem. 4'], datasets: [{ data: r.vuesSemaine, backgroundColor: [th.muted, th.muted, th.muted, th.ink], borderRadius: 6, barThickness: 26 }] }, options: { plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${nf.format(c.parsed.y)} vues` } } }, scales: { x: { grid: { display: false } }, y: { ticks: { maxTicksLimit: 4 }, beginAtZero: true } } } }));
  }
  function openAddRapport(mandatId) {
    const eligibles = mandats.filter(m => ['Actif', 'Expire bientôt', 'Expiré'].includes(mandatStatut(m)));
    openModal(`<h3>Générer un rapport propriétaire</h3><div class="sub">Les statistiques sont pré-remplies à partir de l’annonce, des visites et des offres de la période.</div>
      <form id="form-rapport" class="form-grid">
        <div class="field full"><label>Mandat</label><select name="mandat" required>${eligibles.map(m => `<option value="${m.id}" ${m.id === mandatId ? 'selected' : ''}>${esc(propOf(m.bien).titre)} — ${esc(m.proprietaire.nom)}</option>`).join('')}</select></div>
        <div class="field"><label>Période</label><select name="periode"><option value="${PERIODE}">${periodeLabel(PERIODE)}</option><option value="${prevPeriode(PERIODE)}">${periodeLabel(prevPeriode(PERIODE))}</option></select></div>
        <div class="field"><label>Canal d’envoi</label><select name="canal"><option>E-mail</option><option>Lien sécurisé</option><option>Courrier</option></select></div>
        <div class="field full"><label>Sections incluses</label><div class="chips">${[['retours', 'Retours de visites', true], ['prix', 'Positionnement prix', true], ['offres', 'Offres reçues', true], ['actions', 'Actions menées', true]].map(([k, l, on]) => `<label class="chip"><input type="checkbox" name="sec-${k}" ${on ? 'checked' : ''} /><span>${l}</span></label>`).join('')}</div></div>
        <div class="field"><label>Recommandation</label><select name="reco"><option value="0">Maintenir le prix</option><option value="-3">Ajuster le prix de 3 %</option><option value="-5">Ajuster le prix de 5 %</option><option value="-8">Ajuster le prix de 8 %</option><option value="renouveler">Proposer un renouvellement</option></select></div>
        <div class="field"><label>Mot du conseiller</label><input name="commentaire" placeholder="Optionnel" /></div>
      </form><div class="modal-foot"><button class="btn ghost" data-action="close">Annuler</button><button class="btn primary" data-action="submit-rapport">Générer le brouillon</button></div>`);
  }
  function genererRapport(m, periode, canal, reco, commentaire) {
    const p = propOf(m.bien); const ratio = periode === PERIODE ? 0.42 : 0.35;
    const visites = appointments.filter(x => x.bien === p.id && x.type === 'Visite' && x.date.slice(0, 7) === periode && x.statut !== 'Annulé');
    const os = offres.filter(o => o.bien === p.id && o.date.slice(0, 7) === periode);
    const vues = Math.round(p.vues * ratio); const contacts = Math.max(visites.length + 2, Math.round(vues / 75)); const parts = [0.2, 0.25, 0.28, 0.27];
    const canaux = [['Site Maison Orée', 0.46], ['SeLoger Premium', 0.32], ['Bien’ici', 0.14], ['Réseau international', 0.08]];
    const avis = ['Positif', 'Neutre', 'Positif', 'Négatif']; const coms = ['Très bonne impression générale, réfléchit.', 'Aime l’emplacement, hésite sur le prix.', 'Souhaite revisiter avec la famille.', 'Ne correspond pas à ses critères de surface.'];
    const recoTxt = reco === 'renouveler' ? `Le mandat arrive à son terme le ${dateFR(m.fin, { day: 'numeric', month: 'long' })} : nous recommandons un renouvellement avec un plan de diffusion renforcé.` : +reco ? `Au regard des retours de visites et du positionnement par rapport au marché de ${p.quartier}, nous recommandons un ajustement du prix de ${Math.abs(+reco)} % afin de relancer les contacts qualifiés.` : `Les indicateurs d’audience sont conformes au marché de ${p.quartier}. Nous recommandons de maintenir le prix et de poursuivre la diffusion en cours.`;
    const r = { id: 'r' + Date.now(), mandat: m.id, bien: p.id, periode, genere: TODAY, statut: 'Brouillon', envoye: null, consulte: null, canal,
      stats: { vues, contacts, visites: visites.length, favoris: Math.round(p.favoris * ratio), offres: os.length }, vuesSemaine: parts.map(x => Math.round(vues * x)),
      portails: canaux.map(([nom, k]) => ({ nom, vues: Math.round(vues * k), contacts: Math.round(contacts * k) })),
      retours: visites.map((x, i) => ({ date: x.date, client: x.client ? clientOf(x.client).nom : 'Visiteur', avis: avis[i % avis.length], commentaire: coms[i % coms.length] })),
      actions: [{ date: periode + '-01' > m.debut ? periode + '-01' : m.debut, label: 'Diffusion sur le site agence et 3 portails partenaires' }, ...m.historiquePrix.filter(h => h.date.slice(0, 7) === periode && h.date !== m.debut).map(h => ({ date: h.date, label: `Ajustement du prix : ${money(h.prix, { short: true })}` })), ...os.map(o => ({ date: o.date, label: `Réception d’une offre à ${money(o.montant, { short: true })}` }))].sort((x, y) => x.date.localeCompare(y.date)),
      recommandation: recoTxt, ajustement: reco === 'renouveler' ? 0 : +reco, commentaire: commentaire || '' };
    rapports.unshift(r); return r;
  }
  const rapportsBlock = m => { const l = rapports.filter(r => r.mandat === m.id).sort((a, b) => b.periode.localeCompare(a.periode)); return `<div class="row-between" style="margin:18px 0 10px"><h4 class="card-title" style="font-size:14px;margin:0">Rapports propriétaire</h4><button class="btn sm ghost" data-action="add-rapport" data-mandat-id="${m.id}">${I.plus} Générer</button></div>
    ${l.length ? l.slice(0, 3).map(r => `<div class="mini-report" data-rapport="${r.id}"><span class="doc-ico">${I.doc}</span><div><b>${periodeLabel(r.periode)}</b><small>${nf.format(r.stats.vues)} vues · ${r.stats.visites} visites · ${r.stats.offres} offre${r.stats.offres > 1 ? 's' : ''}</small></div><span class="tag ${rapportTag(r.statut)}">${r.statut}</span></div>`).join('') : '<div class="empty" style="padding:10px">Aucun rapport envoyé pour ce mandat.</div>'}`; };
  /* ============================================================
     ROUTAGE & ÉVÉNEMENTS GLOBAUX
     ============================================================ */
  const renderers = { dashboard: renderDashboard, biens: renderBiens, mandats: renderMandats, offres: renderOffres, taches: renderTaches, rapports: renderRapports, agenda: renderAgenda, messages: renderMessages, clients: renderClients, agents: renderAgents, finances: renderFinances, parametres: renderParametres };
  const FULL_ONLY_VIEWS = ['offres', 'taches', 'rapports', 'agents', 'finances'];
  function syncNavForPackage() {
    const lbl = $('[data-nav-label][data-view="mandats"]');
    if (lbl) lbl.textContent = (window.MoPackage && MoPackage.get() === 'full') ? 'Mandats' : 'Mandats & Offres';
  }
  document.addEventListener('mopackage:change', () => { syncNavForPackage(); if (FULL_ONLY_VIEWS.includes(current)) route(); });
  let current = null;
  function route() {
    const hash = location.hash.replace('#/', '') || 'dashboard'; const [view, param] = hash.split('/');
    let name = renderers[view] ? view : 'dashboard';
    if (FULL_ONLY_VIEWS.includes(name) && (!window.MoPackage || MoPackage.get() !== 'full')) {
      toast('Module réservé au périmètre Prestige FULL');
      location.hash = '#/dashboard';
      name = 'dashboard';
    }
    $$('.nav a').forEach(a => a.classList.toggle('active', a.dataset.view === name));
    $$('.view').forEach(s => s.classList.toggle('active', s.id === 'view-' + name));
    if (name === 'biens' && param === 'carte') state.biensFilters.mode = 'map';
    renderers[name](); current = name; window.scrollTo({ top: 0 });
    document.title = `Maison Orée — ${{ dashboard: 'Tableau de bord', biens: 'Biens', mandats: 'Mandats', offres: 'Offres', taches: 'Tâches', rapports: 'Rapports', agenda: 'Rendez-vous', messages: 'Messages', clients: 'Clients', agents: 'Équipe', finances: 'Finances', parametres: 'Paramètres' }[name]}`;
  }
  const renderAll = () => { route(); renderNotifs(); updateTaskDot(); };

  document.addEventListener('click', e => {
    const t = e.target;
    const act = t.closest('[data-action]');
    if (t.closest('#btn-notif')) { state.notifOpen = !state.notifOpen; $('#notif-pop').classList.toggle('open', state.notifOpen); return; }
    if (!t.closest('#notif-pop') && state.notifOpen) { state.notifOpen = false; $('#notif-pop').classList.remove('open'); }
    if (t.closest('#btn-demo')) { state.demoOpen = !state.demoOpen; $('#demo-pop').classList.toggle('open', state.demoOpen); return; }
    if (!t.closest('#demo-pop') && state.demoOpen) { state.demoOpen = false; $('#demo-pop').classList.remove('open'); }
    if (t.closest('#btn-theme')) { setTheme(state.theme === 'dark' ? 'light' : 'dark'); return; }
    if (t.closest('#btn-search')) { openCmd(); return; }
    if (t.classList.contains('overlay')) { closeModal(); return; }

    const fav = t.closest('[data-fav]');
    if (fav) { e.stopPropagation(); const id = fav.dataset.fav; state.favs.has(id) ? state.favs.delete(id) : state.favs.add(id); toast(state.favs.has(id) ? 'Ajouté aux favoris' : 'Retiré des favoris'); if (fav.dataset.refresh) openProp(id); else { fav.classList.toggle('on'); fav.innerHTML = state.favs.has(id) ? I.heart : I.heartO; } return; }

    if (act) {
      const a = act.dataset.action;
      const actions = {
        'close': closeModal, 'close-notif': () => { state.notifOpen = false; $('#notif-pop').classList.remove('open'); },
        'add-bien': openAddBien, 'add-rdv': () => openAddRdv(), 'planifier': () => openAddRdv(act.dataset.propId), 'add-client': openAddClient,
        'add-agent': () => toast('Invitation envoyée (démo)'), 'toggle-theme': () => { setTheme(state.theme === 'dark' ? 'light' : 'dark'); renderParametres(); },
        'switch': () => { act.classList.toggle('on'); toast(act.classList.contains('on') ? 'Activé' : 'Désactivé'); },
        'save': () => toast('Paramètres enregistrés'), 'share': () => toast('Lien de partage copié'), 'attach': () => toast('Sélectionnez un document (démo)'),
        'call': () => toast('Appel vers ' + act.dataset.tel), 'mail': () => toast('Nouveau message à ' + act.dataset.mail),
        'msg-client': () => { const cv = conversations.find(c => c.client === act.dataset.clientMsg); if (cv) state.conv = cv.id; else { conversations.unshift({ id: 'm' + Date.now(), client: act.dataset.clientMsg, nonLus: 0, messages: [{ de: 'agent', texte: 'Bonjour, merci pour votre intérêt. Je reste à votre disposition.', heure: 'Maintenant' }] }); state.conv = conversations[0].id; } closeModal(); location.hash = '#/messages'; if (current === 'messages') renderMessages(); },
        'read-all': () => { notifications.forEach(n => n.lu = true); renderNotifs(); $('#notif-pop').classList.add('open'); },
        'reset-biens': () => { Object.assign(state.biensFilters, { q: '', quartier: '', type: '', statut: '', transaction: '' }); renderBiens(); },
        'export-biens': () => downloadCSV('biens.csv', [['Titre', 'Adresse', 'Quartier', 'Type', 'Transaction', 'Prix', 'Surface', 'Chambres', 'Statut', 'Agent', 'Vues'], ...filteredBiens().map(p => [p.titre, p.adresse, p.quartier, p.type, p.transaction, p.prix, p.surface, p.chambres, p.statut, agentOf(p.agent).nom, p.vues])]),
        'export-tx': () => downloadCSV('transactions.csv', [['Date', 'Bien', 'Type', 'Montant', 'Commission', 'Conseiller', 'Statut'], ...transactions.map(t => [t.date, propOf(t.bien).titre, t.type, t.montant, t.commission, agentOf(t.agent).nom, t.statut])]),
        'export-agents': () => downloadCSV('equipe.csv', [['Nom', 'Rôle', 'Transactions', 'Volume', 'Mandats', 'Objectif'], ...agents.map(a => [a.nom, a.role, a.ventes, a.ca, a.mandats, a.objectif])]),
        'new-msg': () => toast('Choisissez un contact dans la liste'),
        'add-rapport': () => openAddRapport(act.dataset.mandatId),
        'submit-rapport': () => { const f = $('#form-rapport'); if (!f.reportValidity()) return; const d = Object.fromEntries(new FormData(f)); const m = mandatOf(d.mandat); if (rapports.some(r => r.mandat === m.id && r.periode === d.periode)) { toast('Un rapport existe déjà pour cette période'); return; } const r = genererRapport(m, d.periode, d.canal, d.reco, d.commentaire); toast('Brouillon généré'); refreshRapports(); openRapport(r.id); },
        'save-rapport': () => { const r = rapportOf(act.dataset.rapportId); const t = $('#rapport-comment'); if (t) r.commentaire = t.value.trim(); toast('Brouillon enregistré'); },
        'send-rapport': () => { e.stopPropagation(); const r = rapportOf(act.dataset.rapportId); const t = $('#rapport-comment'); if (t) r.commentaire = t.value.trim(); r.statut = 'Envoyé'; r.envoye = TODAY; r.consulte = null; closeModal(); toast(`Rapport envoyé à ${mandatOf(r.mandat).proprietaire.nom} par ${r.canal.toLowerCase()}`); refreshRapports(); },
        'resend-rapport': () => { e.stopPropagation(); const r = rapportOf(act.dataset.rapportId); r.envoye = TODAY; if (r.statut === 'Consulté') { r.statut = 'Envoyé'; r.consulte = null; } closeModal(); toast('Rapport renvoyé au propriétaire'); refreshRapports(); },
        'read-rapport': () => { const r = rapportOf(act.dataset.rapportId); r.statut = 'Consulté'; r.consulte = TODAY; closeModal(); toast('Rapport marqué comme consulté'); refreshRapports(); },
        'delete-rapport': () => { const i = rapports.findIndex(r => r.id === act.dataset.rapportId); if (i > -1) rapports.splice(i, 1); closeModal(); toast('Brouillon supprimé'); refreshRapports(); },
        'apply-adjust': () => { const r = rapportOf(act.dataset.rapportId); const m = mandatOf(r.mandat); const p = propOf(r.bien); const np = Math.round(p.prix * (1 + r.ajustement / 100) / 1e5) * 1e5; p.prix = np; m.historiquePrix.push({ date: TODAY, prix: np }); closeModal(); toast(`Prix ajusté à ${money(np, { short: true })}`); refreshRapports(); },
        'pdf-rapport': () => toast('Export PDF en préparation…'),
        'export-rapports': () => downloadCSV('rapports.csv', [['Bien', 'Propriétaire', 'Période', 'Vues', 'Contacts', 'Visites', 'Offres', 'Ajustement', 'Statut', 'Envoyé le', 'Consulté le'], ...filteredRapports().map(r => [propOf(r.bien).titre, mandatOf(r.mandat).proprietaire.nom, r.periode, r.stats.vues, r.stats.contacts, r.stats.visites, r.stats.offres, r.ajustement + ' %', r.statut, r.envoye || '', r.consulte || ''])]),
        'add-tache': () => openAddTache(act.dataset.pre ? JSON.parse(act.dataset.pre) : {}),
        'tpl-tache': () => { const f = $('#form-tache'); f.titre.value = act.dataset.titre; f.type.value = act.dataset.type; f.titre.focus(); },
        'submit-tache': () => { const f = $('#form-tache'); if (!f.reportValidity()) return; const d = Object.fromEntries(new FormData(f)); taches.unshift({ id: 'k' + Date.now(), titre: d.titre, type: d.type, priorite: d.priorite, echeance: d.echeance, heure: d.heure || undefined, agent: d.agent, client: d.client || undefined, bien: d.bien || undefined, mandat: d.mandat || undefined, offre: d.offre || undefined, statut: 'À faire', rappel: +d.rappel, creee: TODAY, note: d.note || '' }); closeModal(); toast('Tâche créée'); refreshTaches(); },
        'accept-auto': () => { const r = autoRappels().find(x => x.key === act.dataset.key); if (!r) return; taches.unshift({ id: 'k' + Date.now(), titre: r.titre, type: r.type, priorite: r.priorite, echeance: r.echeance, agent: r.agent, client: r.client, bien: r.bien, mandat: r.mandat, offre: r.offre, statut: 'À faire', rappel: 60, creee: TODAY, note: r.source }); toast('Rappel ajouté'); refreshTaches(); },
        'toggle-tache': () => { e.stopPropagation(); const t = tacheOf(act.dataset.tacheId); setTacheStatut(t, isDone(t) ? 'À faire' : 'Terminée'); if ($('#overlay-modal').classList.contains('open')) closeModal(); refreshTaches(); if (current !== 'taches' && current !== 'agenda' && current !== 'dashboard') { /* modale fiche : rien d'autre */ } },
        'postpone-tache': () => { e.stopPropagation(); const t = tacheOf(act.dataset.tacheId); const base = t.echeance < TODAY ? TODAY : t.echeance; t.echeance = addDays(base, +act.dataset.days); closeModal(); toast('Reportée au ' + dateFR(t.echeance, { weekday: 'long', day: 'numeric', month: 'long' })); refreshTaches(); },
        'save-tache': () => { const d = Object.fromEntries(new FormData($('#form-tache-edit'))); const t = tacheOf(act.dataset.tacheId); Object.assign(t, { echeance: d.echeance || t.echeance, heure: d.heure || undefined, priorite: d.priorite, agent: d.agent, rappel: +d.rappel }); closeModal(); toast('Tâche mise à jour'); refreshTaches(); },
        'delete-tache': () => { const i = taches.findIndex(t => t.id === act.dataset.tacheId); if (i > -1) taches.splice(i, 1); closeModal(); toast('Tâche supprimée'); refreshTaches(); },
        'export-taches': () => downloadCSV('taches.csv', [['Titre', 'Type', 'Priorité', 'Échéance', 'Heure', 'Statut', 'Conseiller', 'Client', 'Bien'], ...filteredTaches().map(t => [t.titre, t.type, t.priorite, t.echeance, t.heure || '', t.statut, agentOf(t.agent).nom, t.client ? clientOf(t.client).nom : '', t.bien ? propOf(t.bien).titre : ''])]),
        'add-offre': () => openAddOffre(act.dataset.propId, act.dataset.clientId),
        'export-offres': () => downloadCSV('offres.csv', [['Bien', 'Acheteur', 'Montant', 'Prix affiché', 'Écart %', 'Financement', 'Date', 'Validité', 'Conseiller', 'Statut'], ...filteredOffres().map(o => [propOf(o.bien).titre, clientOf(o.client).nom, o.montant, propOf(o.bien).prix, ecart(o), o.financement, o.date, o.validite, agentOf(o.agent).nom, o.statut])]),
        'accept-offre': () => { e.stopPropagation(); const o = offreOf(act.dataset.offreId); const p = propOf(o.bien); const c = clientOf(o.client); o.statut = 'Acceptée'; o.historique.push({ date: TODAY, auteur: 'Vendeur', montant: o.montant, note: 'Offre acceptée par le propriétaire' }); offres.filter(x => x.bien === o.bien && x.id !== o.id && isOpen(x)).forEach(x => { x.statut = 'Refusée'; x.historique.push({ date: TODAY, auteur: 'Vendeur', montant: x.montant, note: 'Une autre offre a été retenue' }); }); p.statut = 'Sous offre'; if (['Nouveau', 'Qualifié', 'Visite', 'Offre'].includes(c.etape)) c.etape = 'Négociation'; closeModal(); toast('Offre acceptée · ' + p.titre + ' passe « Sous offre »'); refreshOffres(); },
        'refuse-offre': () => { e.stopPropagation(); const o = offreOf(act.dataset.offreId); o.statut = 'Refusée'; o.historique.push({ date: TODAY, auteur: 'Vendeur', montant: o.montant, note: 'Offre refusée par le propriétaire' }); closeModal(); toast('Offre refusée'); refreshOffres(); },
        'withdraw-offre': () => { const o = offreOf(act.dataset.offreId); o.statut = 'Retirée'; o.historique.push({ date: TODAY, auteur: 'Acheteur', montant: o.montant, note: 'Offre retirée par l’acheteur' }); closeModal(); toast('Offre retirée'); refreshOffres(); },
        'reopen-offre': () => { const o = offreOf(act.dataset.offreId); o.statut = 'En attente'; o.validite = addDays(TODAY, 14); o.historique.push({ date: TODAY, auteur: 'Acheteur', montant: o.montant, note: 'Négociation relancée' }); toast('Négociation relancée'); openOffre(o.id); refreshOffres(); },
        'counter-offre': () => { e.stopPropagation(); openOffre(act.dataset.offreId); setTimeout(() => $('#form-counter input[name=montant]')?.focus(), 50); },
        'counter-submit': () => { const f = $('#form-counter'); if (!f.reportValidity()) return; const d = Object.fromEntries(new FormData(f)); const o = offreOf(act.dataset.offreId); const m = +d.montant; o.historique.push({ date: TODAY, auteur: d.auteur, montant: m, note: d.note || (d.auteur === 'Vendeur' ? 'Contre-proposition du vendeur' : 'Nouvelle proposition de l’acheteur') }); if (d.auteur === 'Acheteur') o.montant = m; o.statut = 'Contre-proposition'; o.validite = addDays(TODAY, 14); toast('Contre-proposition enregistrée'); openOffre(o.id); refreshOffres(); },
        'submit-offre': () => { const f = $('#form-offre'); if (!f.reportValidity()) return; const d = Object.fromEntries(new FormData(f)); const c = clientOf(d.client); offres.unshift({ id: 'o' + Date.now(), bien: d.bien, client: d.client, agent: d.agent, montant: +d.montant, date: d.date, validite: addDays(d.date, +d.validite), statut: 'En attente', financement: d.financement, conditions: d.conditions || 'Aucune', historique: [{ date: d.date, auteur: 'Acheteur', montant: +d.montant, note: d.note || 'Offre enregistrée' }] }); if (['Nouveau', 'Qualifié', 'Visite'].includes(c.etape)) c.etape = 'Offre'; closeModal(); toast('Offre enregistrée pour ' + propOf(d.bien).titre); refreshOffres(); },
        'add-mandat': openAddMandat,
        'export-mandats': () => downloadCSV('mandats.csv', [['Bien', 'Propriétaire', 'Type', 'Début', 'Fin', 'Prix', 'Honoraires %', 'Documents', 'Conseiller', 'Statut'], ...filteredMandats().map(m => [propOf(m.bien).titre, m.proprietaire.nom, m.type, m.debut, m.fin, propOf(m.bien).prix, m.honoraires, docsOk(m) + '/' + m.documents.length, agentOf(m.agent).nom, mandatStatut(m)])]),
        'renew-mandat': () => { e.stopPropagation(); const m = mandatOf(act.dataset.mandatId); const base = m.fin < TODAY ? TODAY : m.fin; const d = new Date(base + 'T00:00:00'); d.setMonth(d.getMonth() + 3); m.fin = d.toISOString().slice(0, 10); m.documents.push({ nom: 'Avenant de renouvellement', statut: 'À signer' }); closeModal(); toast('Mandat renouvelé jusqu’au ' + dateFR(m.fin, { day: 'numeric', month: 'long', year: 'numeric' })); if (current === 'mandats') renderMandats(); },
        'end-mandat': () => { const m = mandatOf(act.dataset.mandatId); m.fin = addDays(TODAY, -1); closeModal(); toast('Mandat résilié'); if (current === 'mandats') renderMandats(); },
        'doc-ok': () => { const m = mandatOf(act.dataset.mandatId); const d = m.documents[+act.dataset.docIndex]; d.statut = d.statut === 'À signer' ? 'Signé' : 'Reçu'; toast(d.nom + ' · ' + d.statut); openMandat(m.id); if (current === 'mandats') renderMandats(); },
        'price-mandat': () => { const f = $('#form-prix'); if (!f.reportValidity()) return; const m = mandatOf(act.dataset.mandatId); const p = propOf(m.bien); const prix = +new FormData(f).get('prix'); if (!prix || prix === p.prix) return; m.historiquePrix.push({ date: TODAY, prix }); p.prix = prix; toast('Prix ajusté à ' + priceOf(p)); openMandat(m.id); if (current === 'mandats') renderMandats(); },
        'submit-mandat': () => { const f = $('#form-mandat'); if (!f.reportValidity()) return; const fd = new FormData(f); const d = Object.fromEntries(fd); if (!d.bien) return; const p = propOf(d.bien); const fin = new Date(d.debut + 'T00:00:00'); fin.setMonth(fin.getMonth() + +d.duree);
          mandats.unshift({ id: 'md' + Date.now(), bien: d.bien, type: d.type, debut: d.debut, fin: fin.toISOString().slice(0, 10), agent: d.agent, honoraires: +d.honoraires, prixInitial: p.prix, proprietaire: { nom: d.proprio, tel: d.tel || '—' }, historiquePrix: [{ date: d.debut, prix: p.prix }], documents: fd.getAll('docs').map(n => ({ nom: n, statut: n === 'Mandat signé' ? 'À signer' : 'Manquant' })) });
          p.exclusif = d.type === 'Exclusif'; closeModal(); toast('Mandat créé pour ' + p.titre); if (current === 'mandats') renderMandats(); },
        'propose-all': () => { const n = matchesForProp(propOf(act.dataset.propId)).length; toast(`Bien proposé à ${n} prospect${n > 1 ? 's' : ''} (démo)`); },
        'send-selection': () => { const n = matchesForClient(clientOf(act.dataset.clientId)).length; toast(`Sélection de ${n} bien${n > 1 ? 's' : ''} envoyée (démo)`); },
        'submit-bien': () => { const f = $('#form-bien'); if (!f.reportValidity()) return; const d = Object.fromEntries(new FormData(f)); properties.unshift({ id: 'p' + Date.now(), titre: d.titre, adresse: d.adresse, quartier: d.quartier, type: d.type, transaction: d.transaction, statut: 'Disponible', prix: +d.prix, surface: +d.surface || 0, terrain: +d.terrain || 0, chambres: +d.chambres || 0, sdb: +d.sdb || 0, garage: 0, vues: 0, favoris: 0, agent: d.agent, img: 'assets/prop-' + (1 + Math.floor(Math.random() * 6)) + '.jpg', note: 4.5, ajout: TODAY, lat: 36.75 + Math.random() * .04, lng: 2.95 + Math.random() * .1, exclusif: d.exclusif === '1', desc: d.desc || 'Description à compléter.' }); closeModal(); toast('Bien publié : ' + d.titre); route(); },
        'submit-rdv': () => { const d = Object.fromEntries(new FormData($('#form-rdv'))); appointments.push({ id: 'r' + Date.now(), date: d.date, heure: d.heure, duree: +d.duree, type: d.type, bien: d.bien || null, client: d.client || null, agent: d.agent, statut: 'Confirmé', lieu: d.lieu || undefined }); closeModal(); toast('Rendez-vous planifié le ' + dateFR(d.date) + ' à ' + d.heure); if (current === 'agenda' || current === 'dashboard') route(); },
        'submit-client': () => { const f = $('#form-client'); if (!f.reportValidity()) return; const d = Object.fromEntries(new FormData(f)); const fd = new FormData(f); clients.unshift({ id: 'c' + Date.now(), nom: d.nom, type: d.type, budget: +d.budget || 0, etape: 'Nouveau', agent: d.agent, dernier: TODAY, source: d.source, tel: d.tel, email: d.email, interet: d.interet || null, score: 50, quartiers: fd.getAll('quartiers'), types: fd.getAll('types'), chambresMin: +d.chambresMin || 0 }); closeModal(); toast('Contact créé : ' + d.nom); route(); },
        'save-client': () => { const c = clientOf(act.dataset.clientId); c.etape = $('#cl-etape').value; closeModal(); toast('Fiche mise à jour'); if (current === 'clients') renderClientsBody(); },
        'cancel-rdv': () => { appointments.find(r => r.id === act.dataset.rdvId).statut = 'Annulé'; closeModal(); toast('Rendez-vous annulé'); route(); },
        'confirm-rdv': () => { appointments.find(r => r.id === act.dataset.rdvId).statut = 'Confirmé'; closeModal(); toast('Rendez-vous confirmé'); route(); },
      };
      if (actions[a]) { actions[a](); return; }
    }
    const edit = t.closest('[data-edit]'); if (edit) { e.stopPropagation(); toast('Édition du bien (démo) : ' + propOf(edit.dataset.edit).titre); return; }
    const more = t.closest('[data-more]'); if (more) { e.stopPropagation(); toast('Menu contextuel (démo)'); return; }
    const ag = t.closest('[data-agent-detail]'); if (ag) { closeModal(); openAgentDetail(ag.dataset.agentDetail); return; }
    const rp = t.closest('[data-rapport]'); if (rp && !t.closest('[data-offre],[data-prop]')) { closeModal(); openRapport(rp.dataset.rapport); return; }
    const tk = t.closest('[data-tache]'); if (tk && !t.closest('[data-client],[data-prop],[data-mandat],[data-offre]')) { closeModal(); openTache(tk.dataset.tache); return; }
    const of = t.closest('[data-offre]'); if (of) { e.preventDefault(); closeModal(); openOffre(of.dataset.offre); return; }
    const md = t.closest('[data-mandat]'); if (md) { e.preventDefault(); closeModal(); openMandat(md.dataset.mandat); return; }
    const pr = t.closest('[data-prop]'); if (pr && !t.closest('.fav')) { closeModal(); openProp(pr.dataset.prop); return; }
    const cl = t.closest('[data-client]'); if (cl) { closeModal(); openClient(cl.dataset.client); return; }
    const rd = t.closest('[data-rdv]'); if (rd) { closeModal(); openRdv(rd.dataset.rdv); return; }
    const nt = t.closest('[data-notif]'); if (nt) { const n = notifications.find(x => x.id === nt.dataset.notif); n.lu = true; renderNotifs(); $('#notif-pop').classList.add('open'); state.notifOpen = true; return; }
  });
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openCmd(); }
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Enter' && e.target.classList.contains('prop')) openProp(e.target.dataset.prop);
  });
  function setTheme(t) { state.theme = t; document.documentElement.dataset.theme = t; renderAll(); }
  window.addEventListener('hashchange', route);
  window.addEventListener('resize', () => Object.values(state.maps).forEach(m => m.invalidateSize()));

  // Thème système au premier chargement
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) { state.theme = 'dark'; document.documentElement.dataset.theme = 'dark'; }
  syncNavForPackage();
  renderAll();
})();
