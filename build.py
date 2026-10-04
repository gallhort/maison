#!/usr/bin/env python3
"""Assemble les pages (src/pages/*.html) avec les partials communs
(head, header, menu mobile, footer) puis écrit les fichiers à la racine.
Usage : python3 build.py && npx tailwindcss -i src/input.css -o assets/css/styles.css --minify
"""
import pathlib, re, time

ROOT = pathlib.Path(__file__).parent
BUILD_ID = str(int(time.time()))  # casse le cache navigateur sur styles.css/main.js à chaque build

LOGO = '''<span class="brand-mark relative inline-block h-9 w-9 shrink-0">
    <img src="assets/img/logo-maison-oree-blanc.svg" class="brand-mark-blanc absolute inset-0 h-9 w-9 object-contain" alt="" aria-hidden="true" />
    <img src="assets/img/logo-maison-oree-dore.svg" class="brand-mark-dore absolute inset-0 h-9 w-9 object-contain" alt="" aria-hidden="true" />
    <img src="assets/img/logo-maison-oree-noir.svg" class="brand-mark-noir absolute inset-0 h-9 w-9 object-contain" alt="" aria-hidden="true" />
  </span>'''

def logo(extra=""):
    return f'''<a href="index.html" class="flex items-center gap-2.5 {extra}" aria-label="Maison Orée — accueil">
  {LOGO}
  <span class="brand-word font-serif text-[1.45rem] leading-none tracking-tight">Maison <em class="italic">Orée</em></span>
</a>'''

NAV = [
    ("buy", "acheter.html", "Collection Privée"),
    ("transactions", "index.html#references-privees", "Transactions"),
    ("maison", "maison.html", "La Maison"),
    ("fengshui", "feng-shui.html", "Art de vivre"),
    ("journal", "actualites.html", "Journal"),
]

# Pages réservées aux périmètres de démonstration « Signature » et « Prestige FULL »
# (masquées de la navigation en périmètre « Essentiel » — voir assets/js/package.js)
MIN_PKG = {"journal": "signature"}

def head(title, desc):
    return f'''<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title}</title>
  <meta name="description" content="{desc}" />
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" onload="this.onload=null;this.rel='stylesheet'" />
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" /></noscript>
  <link rel="stylesheet" href="assets/css/styles.css?v={BUILD_ID}" />
</head>'''

def mobile_menu():
    return f'''<div id="mobileMenu" class="mobile-menu fixed inset-0 z-[60] flex flex-col bg-moka p-6 text-ivoire lg:hidden">
  <div class="flex items-center justify-between">{logo()}<button class="grid h-11 w-11 place-items-center rounded-full bg-white/10" data-menu-toggle aria-label="Fermer le menu"><i data-lucide="x" class="h-5 w-5"></i></button></div>
  <nav class="mt-16 flex flex-col gap-2" aria-label="Navigation mobile">
    {"".join(f'<a href="{h}" class="font-serif text-5xl leading-tight"{f" data-min-package=\"{MIN_PKG[k]}\"" if k in MIN_PKG else ""}>{l}</a>' for k, h, l in NAV)}
    <a href="estimer.html" class="mt-6 inline-flex items-center gap-2 self-start rounded-full border border-white/20 px-5 py-3 text-sm">Valoriser un bien <i data-lucide="arrow-up-right" class="h-4 w-4"></i></a>
  </nav>
  <div class="mt-auto space-y-3 text-sm text-ivoire/60"><p>+33 4 42 96 10 20</p><p>conciergerie@triadeconceptimmo.fr</p></div>
</div>'''

def header(tone, scroll, current):
    links = "\n".join(
        f'<a href="{href}" class="nav-link"{" aria-current=\"page\"" if key == current else ""}{f" data-min-package=\"{MIN_PKG[key]}\"" if key in MIN_PKG else ""}>{label}</a>'
        for key, href, label in NAV
    )
    return f'''<header id="siteHeader" data-tone="{tone}" data-scroll="{scroll}" class="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-5 md:pt-5">
  <div class="nav-shell mx-auto flex max-w-shell items-center justify-between rounded-full py-2 pl-5 pr-2 md:pl-7">
    {logo()}
    <nav class="hidden items-center lg:flex" aria-label="Navigation principale">
      {links}
    </nav>
    <div class="flex items-center gap-1">
      <a href="acheter.html?favoris=1" class="relative hidden h-11 w-11 place-items-center rounded-full transition hover:bg-moka/5 sm:grid" aria-label="Mes favoris" title="Mes favoris">
        <i data-lucide="heart" class="h-4 w-4"></i>
        <span class="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-moka px-1 text-[10px] font-semibold text-ivoire" data-fav-badge hidden>0</span>
      </a>
      <a href="connexion.html" class="hidden h-11 w-11 place-items-center rounded-full transition hover:bg-moka/5 sm:grid" aria-label="Espace professionnel" title="Espace professionnel">
        <i data-lucide="layout-dashboard" class="h-4 w-4"></i>
      </a>
      <div class="relative">
        <button type="button" data-demo-toggle class="hidden h-11 w-11 place-items-center rounded-full transition hover:bg-moka/5 sm:grid" aria-label="Périmètre de démonstration" aria-haspopup="true" aria-expanded="false" title="Périmètre de démonstration">
          <i data-lucide="sliders-horizontal" class="h-4 w-4"></i>
        </button>
        <div data-demo-pop class="absolute right-0 top-full z-20 mt-2 hidden w-56 flex-col gap-2 rounded-2xl border border-moka/10 bg-ivoire p-4 text-moka shadow-float">
          <p class="eyebrow text-moka/45">Périmètre de démonstration</p>
          <div class="mt-1 flex flex-col gap-1.5" data-pkg-toggle role="group" aria-label="Périmètre de démonstration">
            <button type="button" data-pkg="essentiel" class="pill-line justify-center transition aria-pressed:border-moka aria-pressed:bg-moka aria-pressed:text-ivoire">Essentiel</button>
            <button type="button" data-pkg="signature" class="pill-line justify-center transition aria-pressed:border-moka aria-pressed:bg-moka aria-pressed:text-ivoire">Signature</button>
            <button type="button" data-pkg="full" class="pill-line justify-center transition aria-pressed:border-moka aria-pressed:bg-moka aria-pressed:text-ivoire">Prestige FULL</button>
          </div>
        </div>
      </div>
      <a href="estimer.html" class="hidden rounded-full px-4 py-2 text-[13.5px] font-medium opacity-80 transition hover:opacity-100 md:inline-flex"{" aria-current=\"page\"" if current == "estimate" else ""}>Valoriser un bien</a>
      <a href="rendez-vous.html" class="nav-cta hidden items-center gap-2 rounded-full px-5 py-3 text-[13.5px] font-medium sm:inline-flex">Confier un bien <i data-lucide="arrow-up-right" class="h-4 w-4"></i></a>
      <button class="grid h-11 w-11 place-items-center rounded-full lg:hidden" data-menu-toggle aria-expanded="false" aria-controls="mobileMenu" aria-label="Ouvrir le menu"><i data-lucide="menu" class="h-5 w-5"></i></button>
    </div>
  </div>
</header>

{mobile_menu()}'''

def header_flat(current):
    """Nav plate et minimale, réservée aux pages du Journal (identité éditoriale à part)."""
    left = NAV[:2]   # Collection Privée, Transactions
    right = NAV[2:]  # La Maison, Art de vivre, Journal
    def link(key, href, label):
        cur = ' aria-current="page"' if key == current else ''
        return f'<a href="{href}" class="jr-nav-link"{cur}>{label}</a>'
    return f'''<header class="border-b border-moka/10">
  <div class="shell flex items-center justify-between py-5">
    <nav class="hidden items-center gap-6 md:flex" aria-label="Navigation">
      {"".join(link(*n) for n in left)}
    </nav>
    <a href="index.html" class="mx-auto flex flex-col items-center gap-0.5 md:mx-0" aria-label="Maison Orée — accueil">
      <span class="font-serif text-lg italic leading-none tracking-tight">Maison Orée</span>
      <span class="jr-eyebrow !text-[9px] !tracking-[.3em]">Maison de propriétés rares</span>
    </a>
    <div class="flex items-center gap-6">
      <nav class="hidden items-center gap-6 md:flex" aria-label="Navigation">
        {"".join(link(*n) for n in right)}
      </nav>
      <button class="grid h-9 w-9 place-items-center rounded-full md:hidden" data-menu-toggle aria-expanded="false" aria-controls="mobileMenu" aria-label="Ouvrir le menu"><i data-lucide="menu" class="h-5 w-5"></i></button>
    </div>
  </div>
</header>

{mobile_menu()}'''

FOOTER = '''<footer id="contact" class="px-3 pb-3 md:px-5 md:pb-5">
  <div class="relative overflow-hidden rounded-3xl bg-moka text-ivoire">
    <div class="shell pt-20 md:pt-28">
      <div class="grid gap-14 lg:grid-cols-12">
        <div class="lg:col-span-6">
          <p class="eyebrow text-ivoire/50">Expertise et Confiance</p>
          <h2 class="mt-5 text-h2">Votre patrimoine mérite une stratégie <em>singulière</em>.</h2>
          <p class="mt-4 max-w-md text-sm leading-relaxed text-ivoire/65">Vous envisagez de vendre, transmettre, valoriser ou repositionner une propriété d’exception ? Échangeons en toute confidentialité.</p>
          <form class="mt-8 flex max-w-md items-center gap-2 rounded-full border border-white/15 bg-white/5 p-1.5 pl-6" data-fake-submit="Merci — votre conseiller vous rappelle sous 24 h">
            <label for="nl" class="sr-only">Votre adresse e-mail ou votre numéro de téléphone</label>
            <input id="nl" type="text" required placeholder="Votre adresse e-mail ou votre numéro de téléphone" class="w-full bg-transparent text-sm outline-none placeholder:text-ivoire/40" />
            <button class="btn-light shrink-0 !py-3">Être rappelé par la Maison <i data-lucide="arrow-right" class="i i-go h-4 w-4"></i></button>
          </form>
          <p class="mt-3 text-xs text-ivoire/40">Votre demande est traitée de manière strictement confidentielle.</p>
        </div>
        <div class="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3 lg:col-span-6">
          <div><p class="eyebrow text-ivoire/40">Explorer</p><ul class="mt-5 space-y-3 text-ivoire/80"><li><a class="hover:text-white" href="acheter.html">Collection Privée</a></li><li><a class="hover:text-white" href="patrimoine.html">Accompagnement patrimonial</a></li><li><a class="hover:text-white" href="estimer.html">Estimation confidentielle</a></li><li><a class="hover:text-white" href="index.html#references-privees">Transactions</a></li><li><a class="hover:text-white" href="feng-shui.html">Art de vivre</a></li><li><a class="hover:text-white" href="maison.html">La Maison</a></li><li data-min-package="signature"><a class="hover:text-white" href="actualites.html">Journal</a></li><li><a class="hover:text-white" href="rendez-vous.html">Rendez-vous</a></li></ul></div>
          <div><p class="eyebrow text-ivoire/40">Adresse</p><ul class="mt-5 space-y-3 text-ivoire/80"><li>67 Cours Mirabeau<br/>13100 Aix-en-Provence</li><li><a class="hover:text-white" href="maison.html#bureaux">Voir l’agence <i data-lucide="arrow-up-right" class="h-3.5 w-3.5"></i></a></li></ul></div>
          <div><p class="eyebrow text-ivoire/40"><a class="hover:text-white" href="contact.html">Contact</a></p><ul class="mt-5 space-y-3 text-ivoire/80"><li><a class="hover:text-white" href="tel:+33442961020">+33 4 42 96 10 20</a></li><li><a class="hover:text-white" href="mailto:conciergerie@triadeconceptimmo.fr">conciergerie@<br/>triadeconceptimmo.fr</a></li><li class="flex gap-3 pt-1"><a href="#" aria-label="Instagram" class="grid h-9 w-9 place-items-center rounded-full border border-white/15 hover:bg-white/10"><i data-lucide="instagram" class="h-4 w-4"></i></a><a href="#" aria-label="LinkedIn" class="grid h-9 w-9 place-items-center rounded-full border border-white/15 hover:bg-white/10"><i data-lucide="linkedin" class="h-4 w-4"></i></a></li></ul></div>
        </div>
      </div>
      <p class="pointer-events-none mt-20 select-none whitespace-nowrap font-serif text-[21vw] leading-[0.78] tracking-tighter text-ivoire/[.07] md:mt-28 lg:text-[18.5vw]" aria-hidden="true">Maison <em>Orée</em></p>
      <div class="flex flex-col justify-between gap-3 border-t border-white/10 py-6 text-xs text-ivoire/45 sm:flex-row">
        <p>© <span data-year></span> Maison Orée — Maison d’immobilier rare & d’exception. Carte T n° CPI 1301 2026 000 000 000.</p>
        <p class="flex gap-5"><a href="mentions-legales.html" class="hover:text-ivoire">Mentions légales</a><a href="connexion.html" class="hover:text-ivoire">Espace professionnel</a></p>
      </div>
    </div>
  </div>
</footer>'''

TAIL = f'''<div id="toast" class="toast" role="status" aria-live="polite">
  <div class="flex items-center gap-3 rounded-full bg-moka py-3 pl-3 pr-6 text-sm text-ivoire shadow-float"><span class="grid h-8 w-8 place-items-center rounded-full bg-sage"><i data-lucide="check" class="h-4 w-4"></i></span><span data-toast-msg></span></div>
</div>
<style>
  /* Sélecteur de périmètre de démonstration (assets/js/package.js) : en
     périmètre « Essentiel », les pages Signature/Prestige FULL disparaissent
     de la navigation sans casser la mise en page. */
  :root[data-package="essentiel"] [data-min-package] {{ display: none !important; }}
  /* Estimer mon bien / vidéo / visite 3D : contenu simple en Essentiel, complet en Signature/FULL. */
  :root[data-package="essentiel"] [data-tier="full"] {{ display: none !important; }}
  :root:not([data-package="essentiel"]) [data-tier="simple"] {{ display: none !important; }}

  /* Logotype : blanc sur les headers à fond photo, doré une fois le menu
     scrollé (fond clair), noir sur les pages à header clair dès le départ. */
  .brand-mark-blanc {{ opacity: 1; }}
  .brand-mark-dore, .brand-mark-noir {{ opacity: 0; }}
  .brand-mark-blanc, .brand-mark-dore, .brand-mark-noir {{ transition: opacity .6s var(--ease-lux); }}
  #siteHeader[data-tone="dark"]:not(.is-scrolled) .brand-mark-blanc {{ opacity: 0; }}
  #siteHeader[data-tone="dark"]:not(.is-scrolled) .brand-mark-noir {{ opacity: 1; }}
  #siteHeader.is-scrolled .brand-mark-blanc,
  #siteHeader.is-scrolled .brand-mark-noir {{ opacity: 0; }}
  #siteHeader.is-scrolled .brand-mark-dore {{ opacity: 1; }}
  #siteHeader.is-scrolled .brand-word {{ color: #A47E5E; }}
  #siteHeader[data-scroll="dark"].is-scrolled .brand-mark-dore {{ opacity: 0; }}
  #siteHeader[data-scroll="dark"].is-scrolled .brand-mark-blanc {{ opacity: 1; }}
  #siteHeader[data-scroll="dark"].is-scrolled .brand-word {{ color: inherit; }}
</style>
<script src="https://unpkg.com/lucide@0.469.0/dist/umd/lucide.min.js"></script>
<script src="assets/js/package.js?v={BUILD_ID}"></script>
<script src="assets/js/main.js?v={BUILD_ID}"></script>
</body>
</html>'''

def build():
    for src in sorted((ROOT / "src/pages").glob("*.html")):
        html = src.read_text(encoding="utf-8")
        html = re.sub(r"\{\{HEAD:(.*?)\|(.*?)\}\}", lambda m: head(m[1], m[2]), html)
        html = re.sub(r"\{\{HEADER:(\w+)\|(\w+)\|(\w+)\}\}", lambda m: header(m[1], m[2], m[3]), html)
        html = re.sub(r"\{\{HEADERFLAT:(\w+)\}\}", lambda m: header_flat(m[1]), html)
        html = html.replace("{{FOOTER}}", FOOTER).replace("{{TAIL}}", TAIL).replace("{{LOGO}}", LOGO)
        (ROOT / src.name).write_text(html, encoding="utf-8")
        print("built", src.name)

if __name__ == "__main__":
    build()
