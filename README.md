# Maison Orée — Front-end immobilier de prestige

HTML5 · Tailwind CSS v3 · Vanilla JS. Pas de framework, pas d’étape de build JS.

## Structure

```
maison-oree/
├── index.html              Homepage « Aura / Bento Luxury »
├── acheter.html            Catalogue (filtres, tri, vue grille / liste, état vide)
├── feng-shui.html          Page Feng Shui & Bien-être
├── bien-standard.html      Gabarit fiche bien Standard Haut de Gamme (80 % du catalogue)
├── bien-prestige.html      Gabarit fiche bien Prestige / Collection Privée (split-screen)
├── maison.html             La Maison : manifeste, fondatrice, valeurs, frise, équipe, bureaux
├── rendez-vous.html        Prise de rendez-vous : objet, format, bureau, calendrier, créneaux, récapitulatif
├── estimer.html            Estimation confidentielle en 6 étapes + pré-estimation animée
├── tailwind.config.js      Design tokens (couleurs, typo, rayons, ombres, easing, animations)
├── src/
│   ├── input.css           Feuille de style source : @layer base / components + CSS spécifique
│   └── pages/*.html        Sources des pages (avec balises {{HEADER}}, {{FOOTER}}…)
├── build.py                Injecte les partials communs (head, header, menu mobile, footer)
└── assets/
    ├── css/styles.css      CSS compilé et minifié
    ├── js/main.js          Toutes les interactions (modules auto-activés)
    ├── img/*.webp          Visuels
    └── favicon.svg
```

## Build

```bash
npm i -D tailwindcss@3
python3 build.py                                                   # assemble les pages
npx tailwindcss -i src/input.css -o assets/css/styles.css --minify # compile le CSS
# en développement : ajouter --watch
```

## Design system

| Token | Valeur | Usage |
|---|---|---|
| `moka` | `#1C1917` | Fonds sombres, texte principal, boutons |
| `ivoire` | `#F8F9FA` | Fond principal, texte sur sombre |
| `noir` | `#111111` | Touches profondes, scrims photo |
| `sage` | `#8B9467` (échelle 50–800) | Univers Feng Shui, accents |
| `sable` | `#E9E1D4` (échelle 50–400) | Fonds chauds, cartes éditoriales |
| `terre` | `#A47E5E` | Accents terre / bronze |

- Titres : Cormorant Garamond (400, italique pour les mots-clés via `<em>`)
- Texte & données : Plus Jakarta Sans (400/500/600)
- Échelle fluide : `text-display`, `text-h1`, `text-h2`, `text-h3`, `text-eyebrow`
- Rayons : `rounded-3xl` pour cartes & conteneurs, `rounded-full` pour pilules
- Easing : `ease-lux` (cubic-bezier(.22,1,.36,1)), `ease-curtain` pour les transitions jour/nuit

## Composants (classes `@layer components`)

`.shell` · `.eyebrow` · `.btn-dark` `.btn-light` `.btn-sage` `.btn-ghost` `.btn-glass` `.btn-arrow` ·
`.pill-glass` `.pill-soft` `.pill-line` `.chip` · `.price-badge` (translucide) ·
`.card` `.card-media` `.card-scrim` · `.field` · `.rule` · `.reveal` `.reveal-img` · `.blob` `.arch` `.grain`

## Interactions (assets/js/main.js)

| Module | Déclencheur | Description |
|---|---|---|
| Jour / Nuit | `[data-daynight]`, `[data-dn]` | Révélation circulaire (clip-path) depuis l’interrupteur ; mode initial selon l’heure |
| Recherche | `.search-seg`, `[data-value]` | Pilules Ville / Type / Prix / Pièces avec popovers |
| Header | `#siteHeader[data-tone][data-scroll]` | Verre dépoli au scroll, masquage en descente |
| Révélations | `.reveal`, `.reveal-img` | IntersectionObserver, délai via `style="--d:120ms"` |
| Compteurs | `[data-count]` | Animation des chiffres clés |
| Favoris | `[data-fav]` | Bascule + toast |
| RDV agent | `[data-booking]` | Jours générés dynamiquement, créneaux, confirmation |
| Financement | `[data-loan]` | Simulateur de mensualité |
| Catalogue | `[data-results]` | Données JS, filtres type / région / budget / pièces / prestations, tri, vues, favoris (en mémoire), lecture des paramètres de la recherche d’accueil |
| Visionneuse | `[data-lb]`, `[data-lb-open]` | Plein écran, flèches clavier, swipe, miniatures |
| Transitions | liens `*.html` | Rideau moka entre les pages |
| Estimation | `[data-estimate]` | 6 étapes validées (typologie, adresse avec suggestions, surfaces, atouts, calendrier / off-market, coordonnées), image et jauge de précision par étape, calcul indicatif (barème fictif €/m² × coefficients), fourchette animée, récapitulatif, créneaux d’expertise |
| Frise | `[data-timeline]` | Défilement horizontal, flèches, barre de progression |
| Bureaux | `[data-offices]` | Onglets : image, adresse, horaires, lien de rendez-vous prérempli |
| Rendez-vous | `[data-rdv]` | Calendrier 3 mois (dimanches fermés, disponibilités simulées), créneaux, conseiller attribué selon l’objet, récapitulatif en direct, validation, confirmation ; lit `?bureau=` |
| Galerie Prestige | `[data-slide]` | Compteur, chapitre, barre de progression, points de navigation |

## À brancher côté back-office

Remplacer les contenus fictifs (biens, prix, praticienne, conseiller, n° de carte T) par les données du CMS / flux immobilier, et relier les formulaires (`data-fake-submit`, estimation) à votre CRM. Le barème d’estimation (`data-ppm`, `data-coef`, `data-pct`) est fictif et doit être remplacé par vos données de marché.
