/* ============================================================
   Maison Orée — Sélecteur de périmètre à 3 niveaux (démonstration)
   Essentiel · Signature · Prestige FULL
   Persisté en localStorage, partagé entre le site public et les
   deux back-offices : dashboard-light = Essentiel (4 modules) ·
   dashboard = Signature (nav réduite) & Prestige FULL (nav complète),
   le même back-office étant utilisé pour ces deux derniers paliers
   (voir dashboard/app.js et [data-min-package="full"]).
   ============================================================ */
(function () {
  const KEY = 'moPackage';
  const LEVELS = ['essentiel', 'signature', 'full'];
  const DEFAULT = 'full';

  function getPackage() {
    try {
      const v = localStorage.getItem(KEY);
      return LEVELS.includes(v) ? v : DEFAULT;
    } catch (e) { return DEFAULT; }
  }

  function applyAttribute(level) {
    document.documentElement.setAttribute('data-package', level);
    if (document.body) document.body.setAttribute('data-package', level);
  }

  // Chemins relatifs vers les deux back-offices, résolus depuis n'importe
  // quelle profondeur (site public à la racine, dashboards à un niveau).
  function dashUrl(which, hash) {
    const inSub = /\/dashboard(-light)?\//.test(location.pathname);
    const base = inSub ? '../' : '';
    return base + (which === 'full' ? 'dashboard/' : 'dashboard-light/') + 'index.html' + (hash || '#/dashboard');
  }

  function setPackage(level) {
    if (!LEVELS.includes(level)) return;
    try { localStorage.setItem(KEY, level); } catch (e) {}
    applyAttribute(level);
    syncToggle();
    document.dispatchEvent(new CustomEvent('mopackage:change', { detail: { level } }));

    const onFullDash = /\/dashboard\/(index\.html)?/.test(location.pathname);
    const onLightDash = /\/dashboard-light\//.test(location.pathname);
    if (level !== 'essentiel' && onLightDash) { location.href = dashUrl('full'); return; }
    if (level === 'essentiel' && onFullDash) { location.href = dashUrl('light'); return; }
  }

  function syncToggle() {
    const cur = getPackage();
    document.querySelectorAll('[data-pkg-toggle] [data-pkg]').forEach((b) => {
      b.classList.toggle('active', b.dataset.pkg === cur);
      b.setAttribute('aria-pressed', String(b.dataset.pkg === cur));
    });
  }

  function wire() {
    applyAttribute(getPackage());
    document.querySelectorAll('[data-pkg-toggle]').forEach((el) => {
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-pkg]');
        if (!b) return;
        setPackage(b.dataset.pkg);
      });
    });
    syncToggle();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  window.MoPackage = { get: getPackage, set: setPackage, LEVELS, dashUrl };
})();
