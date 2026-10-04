/* =====================================================================
   Maison Orée — Back-Office Essentiel · app.js
   Même architecture que Prestige FULL : une IIFE, routeur par hash, table
   `renderers`, rendu complet via innerHTML, actions déclarées par
   data-action="…" dans un gestionnaire de clic global.

   Périmètre : 4 vues (Tableau de bord, Biens, Messages, Paramètres).
   Retiré : matching, mandats, offres, tâches/kanban, rapports propriétaires,
   pipeline clients, finances, équipe, agenda hebdo, Chart.js, Leaflet,
   recherche globale ⌘K, notifications, export CSV.
   ===================================================================== */
(() => {
  'use strict';

  const DB = window.DB;
  const { properties, demandes, appointments, agence, user, ref, TODAY } = DB;

  /* ------------------------------------------------------------------
     Couche API — compatible XAMPP
     Laisser API_BASE à null : les données restent en mémoire (démo).
     Renseigner par ex. 'http://localhost/triadeconceptimmo/api' pour brancher
     vos scripts PHP. Chaque appel renvoie l'objet à jour (même forme que data.js).
     ------------------------------------------------------------------ */
  const API_BASE = DB.apiBase || null;

  async function call(method, path, body, local) {
    if (!API_BASE) return local();
    const res = await fetch(API_BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`);
    return res.json();
  }

  const replaceIn = (arr, obj) => {
    const i = arr.findIndex((x) => x.id === obj.id);
    i === -1 ? arr.unshift(obj) : (arr[i] = obj);
    return obj;
  };

  const api = {
    // POST /biens
    createBien: async (data) => replaceIn(properties, await call('POST', '/biens', data, () => ({
      ...data,
      id: 'p' + Date.now(),
      statut: 'Disponible',
      ajout: TODAY,
      img: data.img || `assets/prop-${1 + Math.floor(Math.random() * 6)}.jpg`
    }))),
    // PATCH /biens/:id
    updateBien: async (id, patch) => replaceIn(properties, await call('PATCH', `/biens/${id}`, patch, () => ({
      ...properties.find((p) => p.id === id), ...patch
    }))),
    // PATCH /demandes/:id   ({ lu } ou { statut })
    updateDemande: async (id, patch) => replaceIn(demandes, await call('PATCH', `/demandes/${id}`, patch, () => ({
      ...demandes.find((d) => d.id === id), ...patch
    }))),
    // PATCH /agence
    saveAgence: async (data) => Object.assign(agence, await call('PATCH', '/agence', data, () => data)),
    // PATCH /utilisateur
    saveUser: async (data) => Object.assign(user, await call('PATCH', '/utilisateur', data, () => data))
  };

  /* ------------------------------------------------------------------
     Helpers
     ------------------------------------------------------------------ */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s = '') => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

  function money(v, { perMonth = false } = {}) {
    let out;
    if (v >= 1e9) out = `${nf.format(v / 1e9)} Md€`;
    else if (v >= 1e6) out = `${nf.format(Math.round(v / 1e5) / 10)} M€`;
    else if (v >= 1e3) out = `${nf.format(Math.round(v / 1e3))} k€`;
    else out = `${nf.format(v)} €`;
    return perMonth ? `${out}/mois` : out;
  }
  const priceOf = (p) => money(p.prix, { perMonth: p.transaction === 'Location' });
  const propById = (id) => properties.find((p) => p.id === id);

  const toDate = (iso) => new Date(iso + 'T12:00:00');
  const fmtDate = (iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
    new Intl.DateTimeFormat('fr-FR', opts).format(toDate(iso));
  const relDay = (iso) => {
    const d = Math.round((toDate(TODAY) - toDate(iso)) / 864e5);
    if (d === 0) return "Aujourd'hui";
    if (d === 1) return 'Hier';
    if (d < 7) return `Il y a ${d} jours`;
    return fmtDate(iso, { day: 'numeric', month: 'short' });
  };
  const initials = (n) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  const statutBadge = (s) => {
    const cls = s === 'Disponible' ? 'ok' : s === 'Nouveau' ? 'gold' : s === 'Traité' ? 'ok' : '';
    return `<span class="badge ${cls}">${esc(s)}</span>`;
  };
  const isClosed = (p) => p.statut === 'Vendu' || p.statut === 'Loué';

  // Image de repli si assets/ absent (aperçu en ligne) — sans effet sous XAMPP
  const FALLBACK = [
    'photo-1613490493576-7fde63acd811', 'photo-1600607687939-ce8a6c25118c', 'photo-1512917774080-9991f1c4c750',
    'photo-1564013799919-ab600027ffc6', 'photo-1600585154340-be6161a56a0c', 'photo-1600596542815-ffad4c1539a9'
  ];
  window.__imgFb = (el) => {
    el.onerror = null;
    const n = parseInt((el.getAttribute('src').match(/prop-(\d)/) || [0, 1])[1], 10) - 1;
    el.src = `https://images.unsplash.com/${FALLBACK[n % 6]}?auto=format&fit=crop&w=800&q=70`;
  };
  const img = (p, cls = '') => `<img src="${esc(p.img)}" alt="" class="${cls}" loading="lazy" onerror="__imgFb(this)">`;

  const I = {
    home: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
    mail: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    cal: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
    grid: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
    list: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    edit: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
    x: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    plus: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 5v14M5 12h14"/></svg>',
    back: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M15 18l-6-6 6-6"/></svg>'
  };

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* ------------------------------------------------------------------
     État applicatif (réduit)
     ------------------------------------------------------------------ */
  const state = {
    theme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    biensView: 'grid',          // 'grid' | 'table'
    biensQ: '',
    biensStatut: 'Tous',        // Tous | Disponible | Vendu | Loué
    msgFilter: 'actifs',        // actifs | nouveaux | traites | archives
    msgId: null,
    settingsTab: 'agence'       // agence | profil
  };

  function setTheme(t) {
    state.theme = t;
    document.documentElement.dataset.theme = t;
  }

  /* ------------------------------------------------------------------
     Vue 1 — Tableau de bord
     ------------------------------------------------------------------ */
  const upcoming = () =>
    appointments.filter((a) => a.date >= TODAY).sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure));
  const unreadCount = () => demandes.filter((d) => !d.lu && d.statut !== 'Archivé').length;

  function upgradeStrip() {
    if (!DB.showUpgrade) return '';
    return `<div class="upgrade">
      <div>
        <span class="serif">Prestige FULL</span> — pilotez toute l'activité de l'agence.
        <div class="locked"><span>Pipeline clients</span><span>Matching acheteurs</span><span>Mandats & alertes</span><span>Offres & négociations</span><span>Agenda équipe</span><span>Finances & rapports</span></div>
      </div>
      <button class="btn btn-sm" data-action="upgrade-full">Découvrir l'offre</button>
    </div>`;
  }

  function renderDashboard() {
    const online = properties.filter((p) => p.statut === 'Disponible').length;
    const closed = properties.filter(isClosed).length;
    const unread = unreadCount();
    const next = upcoming();
    const first = user.nom.split(' ')[0];
    const hour = 10; // à remplacer par new Date().getHours()

    const recentProps = [...properties].sort((a, b) => b.ajout.localeCompare(a.ajout)).slice(0, 5);
    const recentMsgs = [...demandes].filter((d) => d.statut !== 'Archivé')
      .sort((a, b) => (b.date + b.heure).localeCompare(a.date + a.heure)).slice(0, 5);

    $('#view-dashboard').innerHTML = `
      <div class="welcome">
        <div>
          <h1>${hour < 18 ? 'Bonjour' : 'Bonsoir'}, <span class="serif">${esc(first)}</span></h1>
          <p>${fmtDate(TODAY, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · ${unread ? `${unread} demande${unread > 1 ? 's' : ''} en attente de réponse` : 'Toutes les demandes ont été lues'}</p>
        </div>
        <button class="btn btn-gold" data-action="new-bien">${I.plus} Ajouter un bien</button>
      </div>

      <div class="kpis">
        <a class="card kpi" href="#/biens">
          <div class="kpi-top"><span>Biens en ligne</span><span class="kpi-ico">${I.home}</span></div>
          <div class="kpi-val num">${online}</div>
          <div class="kpi-foot">${properties.length} au catalogue · ${closed} vendu${closed > 1 ? 's' : ''} ou loué${closed > 1 ? 's' : ''}</div>
        </a>
        <a class="card kpi" href="#/messages">
          <div class="kpi-top"><span>Nouveaux messages</span><span class="kpi-ico">${I.mail}</span></div>
          <div class="kpi-val num">${unread}</div>
          <div class="kpi-foot">${demandes.length} demandes reçues via le site</div>
        </a>
        <div class="card kpi">
          <div class="kpi-top"><span>RDV à venir</span><span class="kpi-ico">${I.cal}</span></div>
          <div class="kpi-val num">${next.length}</div>
          <div class="kpi-foot">${next[0] ? `Prochain : ${fmtDate(next[0].date, { weekday: 'short', day: 'numeric', month: 'short' })} · ${next[0].heure}` : 'Aucun rendez-vous planifié'}</div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-head"><h2 class="card-title">Derniers biens ajoutés</h2><a class="link" href="#/biens">Tout le catalogue</a></div>
          <div class="card-body">
            <ul class="list">${recentProps.map((p) => `
              <li><button class="li" data-action="edit-bien" data-prop="${p.id}">
                ${img(p, 'thumb')}
                <span class="li-main"><span class="li-title" style="display:block">${esc(p.titre)}</span><span class="li-sub" style="display:block">${esc(p.type)} · ${esc(p.quartier)} · ${fmtDate(p.ajout, { day: 'numeric', month: 'short' })}</span></span>
                <span class="li-end"><span class="num" style="display:block;color:var(--ink);font-size:13px">${priceOf(p)}</span>${statutBadge(p.statut)}</span>
              </button></li>`).join('')}
            </ul>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:20px">
          <div class="card">
            <div class="card-head"><h2 class="card-title">Derniers messages</h2><a class="link" href="#/messages">Boîte de réception</a></div>
            <div class="card-body">
              <ul class="list">${recentMsgs.map((d) => `
                <li><a class="li" href="#/messages/${d.id}">
                  <span class="${d.lu ? 'dot-read' : 'dot-new'}"></span>
                  <span class="li-main"><span class="li-title" style="display:block">${esc(d.nom)}</span><span class="li-sub" style="display:block">${esc(d.sujet)}${d.bien && propById(d.bien) ? ' · ' + esc(propById(d.bien).titre) : ''}</span></span>
                  <span class="li-end">${relDay(d.date)}</span>
                </a></li>`).join('') || '<li class="empty">Aucun message.</li>'}
              </ul>
            </div>
          </div>

          <div class="card">
            <div class="card-head"><h2 class="card-title">Rendez-vous à venir</h2></div>
            <div class="card-body">
              <ul class="list">${next.slice(0, 4).map((a) => `
                <li><div class="li">
                  <span class="date-chip"><b class="num">${toDate(a.date).getDate()}</b><span>${fmtDate(a.date, { month: 'short' }).replace('.', '')}</span></span>
                  <span class="li-main"><span class="li-title" style="display:block">${esc(a.type)} · ${esc(a.contact)}</span><span class="li-sub" style="display:block">${a.bien && propById(a.bien) ? esc(propById(a.bien).titre) + ' · ' : ''}${esc(a.lieu || '')}</span></span>
                  <span class="li-end num">${a.heure}</span>
                </div></li>`).join('') || '<li class="empty">Aucun rendez-vous.</li>'}
              </ul>
            </div>
          </div>
        </div>
      </div>
      ${upgradeStrip()}`;
  }

  /* ------------------------------------------------------------------
     Vue 2 — Gestion des biens (grille / table, ajout, édition, statut)
     ------------------------------------------------------------------ */
  function filteredBiens() {
    const q = state.biensQ.trim().toLowerCase();
    return properties
      .filter((p) => state.biensStatut === 'Tous' || p.statut === state.biensStatut)
      .filter((p) => !q || `${p.titre} ${p.quartier} ${p.type} ${p.adresse}`.toLowerCase().includes(q))
      .sort((a, b) => b.ajout.localeCompare(a.ajout));
  }

  const statusBtnLabel = (p) => (isClosed(p) ? 'Remettre disponible' : p.transaction === 'Location' ? 'Marquer loué' : 'Marquer vendu');

  function renderBiens() {
    $('#view-biens').innerHTML = `
      <div class="page-head">
        <div>
          <p class="eyebrow">Catalogue</p>
          <h1 class="page-title">Vos <span class="serif">biens</span></h1>
          <p class="page-sub">Ajoutez, modifiez et mettez à jour la disponibilité des biens publiés sur votre site vitrine.</p>
        </div>
        <button class="btn btn-gold" data-action="new-bien">${I.plus} Ajouter un bien</button>
      </div>
      <div class="toolbar">
        <label class="search"><span class="sr-only">Rechercher un bien</span>${I.search}
          <input id="biens-q" type="search" placeholder="Rechercher un bien, un quartier…" value="${esc(state.biensQ)}" autocomplete="off">
        </label>
        <select class="select" id="biens-statut" aria-label="Filtrer par statut">
          ${['Tous', 'Disponible', 'Vendu', 'Loué'].map((s) => `<option ${s === state.biensStatut ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
        <span class="spacer"></span>
        <span class="muted num" id="biens-count" style="font-size:13px"></span>
        <div class="seg" role="group" aria-label="Affichage">
          <button data-action="biens-view" data-v="grid" aria-pressed="${state.biensView === 'grid'}">${I.grid} Grille</button>
          <button data-action="biens-view" data-v="table" aria-pressed="${state.biensView === 'table'}">${I.list} Liste</button>
        </div>
      </div>
      <div id="biens-body"></div>`;

    $('#biens-q').addEventListener('input', (e) => { state.biensQ = e.target.value; renderBiensBody(); });
    $('#biens-statut').addEventListener('change', (e) => { state.biensStatut = e.target.value; renderBiensBody(); });
    renderBiensBody();
  }

  function renderBiensBody() {
    const list = filteredBiens();
    $('#biens-count').textContent = `${list.length} bien${list.length > 1 ? 's' : ''}`;
    const host = $('#biens-body');

    if (!list.length) {
      host.innerHTML = `<div class="card empty"><span class="serif">Aucun bien trouvé</span>Modifiez votre recherche ou ajoutez un nouveau bien.</div>`;
      return;
    }

    if (state.biensView === 'grid') {
      host.innerHTML = `<div class="prop-grid">${list.map((p) => `
        <article class="card prop">
          <div class="prop-media">${img(p)}${statutBadge(p.statut)}${p.exclusif ? '<span class="excl">Exclusivité</span>' : ''}</div>
          <div class="prop-body">
            <span class="cell-sub">${esc(p.type)} · ${esc(p.transaction)} · ${esc(p.quartier)}</span>
            <h3 class="cell-title" style="margin:0;font-size:1rem">${esc(p.titre)}</h3>
            <span class="prop-price num">${priceOf(p)}</span>
            <span class="prop-meta num"><span>${p.surface} m²</span>${p.chambres ? `<span>${p.chambres} ch.</span>` : ''}${p.sdb ? `<span>${p.sdb} sdb</span>` : ''}${p.terrain ? `<span>${p.terrain} m² terrain</span>` : ''}</span>
          </div>
          <div class="prop-foot">
            <button class="btn btn-sm" data-action="edit-bien" data-prop="${p.id}">${I.edit} Modifier</button>
            <button class="btn btn-sm ${isClosed(p) ? '' : 'btn-ghost'}" data-action="toggle-statut" data-prop="${p.id}">${statusBtnLabel(p)}</button>
          </div>
        </article>`).join('')}</div>`;
    } else {
      host.innerHTML = `<div class="card table-wrap"><table>
        <thead><tr><th>Bien</th><th>Type</th><th>Transaction</th><th>Prix</th><th>Surface</th><th>Statut</th><th>Ajouté le</th><th><span class="sr-only">Actions</span></th></tr></thead>
        <tbody>${list.map((p) => `
          <tr>
            <td><div class="cell-prop">${img(p, 'thumb')}<div><div class="cell-title">${esc(p.titre)}</div><div class="cell-sub">${esc(p.quartier)} · ${esc(p.adresse)}</div></div></div></td>
            <td>${esc(p.type)}</td>
            <td>${esc(p.transaction)}</td>
            <td class="num">${priceOf(p)}</td>
            <td class="num">${p.surface} m²</td>
            <td>${statutBadge(p.statut)}</td>
            <td class="num muted">${fmtDate(p.ajout)}</td>
            <td><div class="row-actions">
              <button class="btn btn-sm btn-ghost" data-action="toggle-statut" data-prop="${p.id}">${statusBtnLabel(p)}</button>
              <button class="icon-btn" data-action="edit-bien" data-prop="${p.id}" aria-label="Modifier ${esc(p.titre)}">${I.edit}</button>
            </div></td>
          </tr>`).join('')}</tbody></table></div>`;
    }
  }

  function bienForm(p) {
    const v = p || { titre: '', adresse: '', quartier: ref.quartiers[0], type: 'Villa', transaction: 'Vente', prix: '', surface: '', terrain: '', chambres: '', sdb: '', exclusif: false, desc: '', img: '' };
    const opt = (arr, cur) => arr.map((x) => `<option ${x === cur ? 'selected' : ''}>${esc(x)}</option>`).join('');
    openModal(`
      <div class="modal-head">
        <div><p class="eyebrow">${p ? 'Modifier le bien' : 'Nouveau bien'}</p><h2 class="modal-title" id="modal-title">${p ? esc(p.titre) : 'Ajouter un <span class="serif">bien</span>'}</h2></div>
        <button class="icon-btn" data-action="close-modal" aria-label="Fermer">${I.x}</button>
      </div>
      <form class="modal-body" id="form-bien" novalidate>
        <div class="form-grid">
          <div class="field full"><label for="f-titre">Titre de l'annonce *</label><input id="f-titre" name="titre" required value="${esc(v.titre)}" placeholder="Ex. Villa Les Palmiers"></div>
          <div class="field"><label for="f-type">Type</label><select id="f-type" name="type">${opt(ref.types, v.type)}</select></div>
          <div class="field"><label for="f-tr">Transaction</label><select id="f-tr" name="transaction">${opt(ref.transactions, v.transaction)}</select></div>
          <div class="field"><label for="f-q">Quartier</label><select id="f-q" name="quartier">${opt(ref.quartiers, v.quartier)}</select></div>
          <div class="field"><label for="f-adr">Adresse</label><input id="f-adr" name="adresse" value="${esc(v.adresse)}"></div>
          <div class="field"><label for="f-prix">Prix (€) * <span class="muted">— loyer mensuel si location</span></label><input id="f-prix" name="prix" type="number" min="0" step="100" required value="${v.prix}"></div>
          <div class="field"><label for="f-surf">Surface (m²) *</label><input id="f-surf" name="surface" type="number" min="0" required value="${v.surface}"></div>
          <div class="field"><label for="f-ch">Chambres</label><input id="f-ch" name="chambres" type="number" min="0" value="${v.chambres}"></div>
          <div class="field"><label for="f-sdb">Salles de bain</label><input id="f-sdb" name="sdb" type="number" min="0" value="${v.sdb}"></div>
          <div class="field"><label for="f-ter">Terrain (m²)</label><input id="f-ter" name="terrain" type="number" min="0" value="${v.terrain}"></div>
          <div class="field"><label for="f-img">Image (chemin ou URL)</label><input id="f-img" name="img" value="${esc(v.img)}" placeholder="assets/prop-1.jpg"></div>
          <div class="field full"><label for="f-desc">Description</label><textarea id="f-desc" name="desc">${esc(v.desc || '')}</textarea></div>
          <label class="check full"><input type="checkbox" name="exclusif" ${v.exclusif ? 'checked' : ''}> Afficher le bandeau « Exclusivité » sur le site</label>
        </div>
        <div class="form-foot">
          <button type="button" class="btn btn-ghost" data-action="close-modal">Annuler</button>
          <button type="submit" class="btn btn-gold">${p ? 'Enregistrer' : 'Publier le bien'}</button>
        </div>
      </form>`);

    $('#form-bien').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      let ok = true;
      ['titre', 'prix', 'surface'].forEach((n) => {
        const el = f.elements[n];
        const bad = !String(el.value).trim();
        el.setAttribute('aria-invalid', String(bad));
        if (bad) ok = false;
      });
      if (!ok) { toast('Merci de compléter les champs obligatoires.'); return; }

      const num = (n) => Number(f.elements[n].value) || 0;
      const data = {
        titre: f.elements.titre.value.trim(), adresse: f.elements.adresse.value.trim(),
        quartier: f.elements.quartier.value, type: f.elements.type.value, transaction: f.elements.transaction.value,
        prix: num('prix'), surface: num('surface'), terrain: num('terrain'), chambres: num('chambres'), sdb: num('sdb'),
        img: f.elements.img.value.trim() || (p ? p.img : ''), exclusif: f.elements.exclusif.checked, desc: f.elements.desc.value.trim()
      };
      try {
        if (p) {
          // Un bien vendu/loué qui change de transaction garde un statut cohérent
          if (isClosed(p)) data.statut = data.transaction === 'Location' ? 'Loué' : 'Vendu';
          await api.updateBien(p.id, data);
          toast('Bien mis à jour');
        } else {
          await api.createBien(data);
          toast('Bien publié sur le catalogue');
        }
        closeModal();
        route();
      } catch (err) { toast("Erreur d'enregistrement — réessayez"); console.error(err); }
    });
  }

  /* ------------------------------------------------------------------
     Vue 3 — Messages & demandes (boîte de réception simple)
     ------------------------------------------------------------------ */
  const MSG_TABS = [
    { id: 'actifs', label: 'Toutes', test: (d) => d.statut !== 'Archivé' },
    { id: 'nouveaux', label: 'Non lues', test: (d) => !d.lu && d.statut !== 'Archivé' },
    { id: 'traites', label: 'Traitées', test: (d) => d.statut === 'Traité' },
    { id: 'archives', label: 'Archivées', test: (d) => d.statut === 'Archivé' }
  ];

  function renderMessages() {
    const tab = MSG_TABS.find((t) => t.id === state.msgFilter) || MSG_TABS[0];
    const list = demandes.filter(tab.test).sort((a, b) => (b.date + b.heure).localeCompare(a.date + a.heure));
    const cur = demandes.find((d) => d.id === state.msgId);

    $('#view-messages').innerHTML = `
      <div class="page-head">
        <div>
          <p class="eyebrow">Boîte de réception</p>
          <h1 class="page-title">Messages <span class="serif">& demandes</span></h1>
          <p class="page-sub">Les formulaires de contact envoyés depuis votre site arrivent ici.</p>
        </div>
      </div>
      <div class="card inbox" data-reading="${!!cur}">
        <div class="inbox-list">
          <div class="inbox-tabs" role="group" aria-label="Filtrer les demandes">
            ${MSG_TABS.map((t) => {
              const c = demandes.filter(t.test).length;
              return `<button data-action="msg-filter" data-f="${t.id}" aria-pressed="${t.id === tab.id}">${t.label} <span class="muted num">${c}</span></button>`;
            }).join('')}
          </div>
          ${list.map((d) => `
            <a class="msg ${d.lu ? '' : 'unread'}" href="#/messages/${d.id}" aria-current="${d.id === state.msgId}">
              <span class="initials">${esc(initials(d.nom))}</span>
              <span style="flex:1;min-width:0">
                <span class="msg-top"><span class="msg-name">${esc(d.nom)}</span><span class="muted" style="font-size:11.5px;white-space:nowrap">${relDay(d.date)}</span></span>
                <span class="msg-subject" style="display:block">${esc(d.sujet)}${d.bien && propById(d.bien) ? ' · ' + esc(propById(d.bien).titre) : ''}</span>
                <span class="msg-preview">${esc(d.message)}</span>
              </span>
            </a>`).join('') || `<div class="empty"><span class="serif">Rien à signaler</span>Aucune demande dans cette catégorie.</div>`}
        </div>
        <div class="reader-pane">${cur ? readerTpl(cur) : `<div class="empty" style="padding-top:140px"><span class="serif">Sélectionnez une demande</span>Son contenu s'affichera ici.</div>`}</div>
      </div>`;
  }

  function readerTpl(d) {
    const p = d.bien && propById(d.bien);
    const subj = encodeURIComponent(`Re : ${d.sujet}${p ? ' — ' + p.titre : ''}`);
    return `<div class="reader">
      <button class="btn btn-sm btn-ghost back-btn" data-action="msg-back" style="align-self:flex-start">${I.back} Retour</button>
      <div class="reader-head">
        <div>
          <p class="eyebrow">${esc(d.sujet)}</p>
          <h2 class="reader-name">${esc(d.nom)}</h2>
          <div class="reader-contact"><a class="link" href="mailto:${esc(d.email)}">${esc(d.email)}</a><a class="link" href="tel:${esc(d.tel.replace(/\s/g, ''))}">${esc(d.tel)}</a></div>
        </div>
        <div class="reader-meta">
          ${statutBadge(d.statut)}
          <div class="muted num" style="font-size:12px;margin-top:8px">${fmtDate(d.date, { weekday: 'long', day: 'numeric', month: 'long' })} · ${d.heure}</div>
        </div>
      </div>
      ${p ? `<div class="reader-prop">${img(p)}<div><div class="cell-sub">Bien concerné</div><div class="cell-title">${esc(p.titre)}</div><div class="cell-sub num">${priceOf(p)} · ${esc(p.quartier)}</div></div></div>` : ''}
      <div class="reader-msg">${esc(d.message)}</div>
      <div class="reader-actions">
        <a class="btn btn-gold" href="mailto:${esc(d.email)}?subject=${subj}">Répondre par e-mail</a>
        <a class="btn" href="tel:${esc(d.tel.replace(/\s/g, ''))}">Appeler</a>
        <span class="spacer"></span>
        ${d.statut === 'Traité'
          ? `<button class="btn btn-ghost" data-action="msg-status" data-id="${d.id}" data-s="Nouveau">Rouvrir</button>`
          : d.statut === 'Nouveau' ? `<button class="btn" data-action="msg-status" data-id="${d.id}" data-s="Traité">Marquer comme traitée</button>` : ''}
        ${d.statut === 'Archivé'
          ? `<button class="btn btn-ghost" data-action="msg-status" data-id="${d.id}" data-s="Nouveau">Désarchiver</button>`
          : `<button class="btn btn-ghost" data-action="msg-status" data-id="${d.id}" data-s="Archivé">Archiver</button>`}
      </div>
    </div>`;
  }

  async function openDemande(id) {
    const d = demandes.find((x) => x.id === id);
    if (!d) { state.msgId = null; return; }
    state.msgId = id;
    if (!d.lu) await api.updateDemande(id, { lu: true });
  }

  /* ------------------------------------------------------------------
     Vue 4 — Paramètres (Agence, Profil)
     ------------------------------------------------------------------ */
  function renderParametres() {
    const tab = state.settingsTab;
    const field = (id, label, val, type = 'text', full = false) =>
      `<div class="field ${full ? 'full' : ''}"><label for="${id}">${label}</label><input id="${id}" name="${id.replace(/^s-/, '')}" type="${type}" value="${esc(val)}"></div>`;

    const agenceTpl = `
      <form class="card" id="form-agence">
        <div class="card-head"><h2 class="card-title">Informations de l'agence</h2><span class="muted" style="font-size:12px">Affichées sur le site vitrine</span></div>
        <div class="card-body">
          <div class="form-grid">
            ${field('s-nom', "Nom de l'agence", agence.nom)}
            ${field('s-slogan', 'Signature', agence.slogan)}
            ${field('s-adresse', 'Adresse', agence.adresse, 'text', true)}
            ${field('s-tel', 'Téléphone', agence.tel, 'tel')}
            ${field('s-email', 'E-mail de contact', agence.email, 'email')}
            ${field('s-site', 'Site web', agence.site)}
            ${field('s-horaires', "Horaires d'ouverture", agence.horaires)}
            ${field('s-registre', 'Registre du commerce', agence.registre, 'text', true)}
          </div>
          <div class="form-foot"><button type="submit" class="btn btn-gold">Enregistrer</button></div>
        </div>
      </form>`;

    const profilTpl = `
      <form class="card" id="form-profil">
        <div class="card-head"><h2 class="card-title">Mon profil</h2></div>
        <div class="card-body">
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
            <span class="avatar" style="width:56px;height:56px;font-size:16px">${esc(user.initiales)}</span>
            <div><div class="cell-title">${esc(user.nom)}</div><div class="cell-sub">${esc(user.role)}</div></div>
          </div>
          <div class="form-grid">
            ${field('s-nom', 'Nom complet', user.nom)}
            ${field('s-role', 'Fonction', user.role)}
            ${field('s-email', 'E-mail', user.email, 'email')}
            ${field('s-tel', 'Téléphone', user.tel, 'tel')}
            <div class="field full"><label>Apparence</label>
              <div class="seg" role="group" aria-label="Thème">
                <button type="button" data-action="set-theme" data-t="light" aria-pressed="${state.theme === 'light'}">Clair</button>
                <button type="button" data-action="set-theme" data-t="dark" aria-pressed="${state.theme === 'dark'}">Sombre</button>
              </div>
            </div>
          </div>
          <div class="form-foot"><button type="submit" class="btn btn-gold">Enregistrer</button></div>
        </div>
      </form>
      <div class="card" style="margin-top:20px">
        <div class="card-head"><h2 class="card-title">Votre formule</h2><span class="badge gold plain">Essentiel</span></div>
        <div class="card-body" style="color:var(--ink-2);font-size:14px">
          Catalogue de biens, réception des demandes du site et paramètres de l'agence. 1 utilisateur.
          ${DB.showUpgrade ? `<div class="locked" style="margin-top:14px"><span>Multi-utilisateurs</span><span>CRM & pipeline</span><span>Mandats</span><span>Offres</span><span>Finances</span></div>` : ''}
        </div>
      </div>`;

    $('#view-parametres').innerHTML = `
      <div class="page-head"><div><p class="eyebrow">Configuration</p><h1 class="page-title"><span class="serif">Paramètres</span></h1></div></div>
      <div class="settings">
        <nav class="settings-nav" aria-label="Sections des paramètres">
          <button data-action="settings-tab" data-t="agence" aria-pressed="${tab === 'agence'}">Agence</button>
          <button data-action="settings-tab" data-t="profil" aria-pressed="${tab === 'profil'}">Profil utilisateur</button>
        </nav>
        <div>${tab === 'agence' ? agenceTpl : profilTpl}</div>
      </div>`;

    const read = (form) => Object.fromEntries([...new FormData(form)].map(([k, v]) => [k, String(v).trim()]));
    $('#form-agence')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await api.saveAgence(read(e.target));
      toast('Informations de l\'agence enregistrées');
    });
    $('#form-profil')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = read(e.target);
      data.initiales = initials(data.nom || user.nom);
      await api.saveUser(data);
      syncChrome();
      renderParametres();
      toast('Profil mis à jour');
    });
  }

  /* ------------------------------------------------------------------
     Modale
     ------------------------------------------------------------------ */
  let lastFocus = null;
  function openModal(html) {
    lastFocus = document.activeElement;
    $('#modal').innerHTML = html;
    const ov = $('#overlay-modal');
    ov.classList.add('open');
    ov.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('#modal input, #modal select')?.focus(), 60);
  }
  function closeModal() {
    const ov = $('#overlay-modal');
    ov.classList.remove('open');
    ov.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lastFocus?.focus?.();
  }

  /* ------------------------------------------------------------------
     Actions (data-action)
     ------------------------------------------------------------------ */
  const actions = {
    'upgrade-full': () => { if (window.MoPackage) window.MoPackage.set('full'); },
    'new-bien': () => bienForm(null),
    'edit-bien': (el) => bienForm(propById(el.dataset.prop)),
    'toggle-statut': async (el) => {
      const p = propById(el.dataset.prop);
      const statut = isClosed(p) ? 'Disponible' : p.transaction === 'Location' ? 'Loué' : 'Vendu';
      await api.updateBien(p.id, { statut });
      toast(`${p.titre} — ${statut}`);
      route();
    },
    'biens-view': (el) => { state.biensView = el.dataset.v; $$('[data-action="biens-view"]').forEach((b) => b.setAttribute('aria-pressed', String(b === el))); renderBiensBody(); },
    'msg-filter': (el) => { state.msgFilter = el.dataset.f; renderMessages(); },
    'msg-back': () => { location.hash = '#/messages'; },
    'msg-status': async (el) => {
      const s = el.dataset.s;
      await api.updateDemande(el.dataset.id, { statut: s });
      toast(s === 'Archivé' ? 'Demande archivée' : s === 'Traité' ? 'Demande marquée comme traitée' : 'Demande rouverte');
      if (s === 'Archivé') { location.hash = '#/messages'; return; }
      syncChrome(); renderMessages();
    },
    'settings-tab': (el) => { location.hash = `#/parametres/${el.dataset.t}`; },
    'set-theme': (el) => { setTheme(el.dataset.t); $$('[data-action="set-theme"]').forEach((b) => b.setAttribute('aria-pressed', String(b === el))); },
    'toggle-theme': () => setTheme(state.theme === 'dark' ? 'light' : 'dark'),
    'close-modal': () => closeModal()
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (el && actions[el.dataset.action]) { e.preventDefault(); actions[el.dataset.action](el); return; }
    if (e.target.id === 'overlay-modal') closeModal();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  /* ------------------------------------------------------------------
     Routeur par hash
     ------------------------------------------------------------------ */
  const renderers = {
    dashboard: renderDashboard,
    biens: renderBiens,
    messages: renderMessages,
    parametres: renderParametres
  };

  const PKG_LABELS = { essentiel: 'Essentiel', signature: 'Signature', full: 'Prestige FULL' };
  function syncChrome() {
    const n = unreadCount();
    const c = $('#nav-count');
    c.hidden = !n;
    c.textContent = n;
    $('#avatar').textContent = user.initiales;
    const ed = $('.brand-ed');
    if (ed && window.MoPackage) ed.textContent = PKG_LABELS[MoPackage.get()] || 'Essentiel';
  }
  document.addEventListener('mopackage:change', syncChrome);

  async function route() {
    const [, name = 'dashboard', sub] = (location.hash || '#/dashboard').split('/');
    const view = renderers[name] ? name : 'dashboard';

    if (view === 'messages') {
      if (sub) await openDemande(sub); else state.msgId = null;
    }
    if (view === 'parametres') state.settingsTab = sub === 'profil' ? 'profil' : 'agence';

    $$('.view').forEach((v) => v.classList.toggle('active', v.id === `view-${view}`));
    $$('#nav a').forEach((a) => (a.dataset.route === view ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    renderers[view]();
    syncChrome();
    if (!(view === 'messages' && sub)) window.scrollTo({ top: 0 });
  }

  setTheme(state.theme);
  window.addEventListener('hashchange', route);
  route();
})();
