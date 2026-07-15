# Sentinel — Dashboard du trading bot

Frontend statique d'un dashboard pour un trading bot Python (IBKR + analyse Claude/Anthropic + alertes Telegram). Ce document décrit **exactement** ce qui a été construit, le contrat HTML/CSS/JS, et ce qu'il reste à faire. Lis-le avant de toucher au code.

## État du projet

| Fichier | État | Rôle |
|---|---|---|
| `static/index.html` | **Fait** | Page unique contenant les 6 sections, données fictives en dur |
| `static/style.css` | **Fait** | Tout le style (overrides Pico + composants custom) |
| `static/app.js` | **Partiel** | Navigation SPA faite ; branchement API à faire (TODO dans le fichier) |
| Backend Python | **À faire** | Aucun code backend n'existe encore ; endpoints suggérés ci-dessous |

Aucun framework, aucun build : HTML + CSS + JS vanilla. [Pico CSS v2](https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css) est chargé via CDN en `data-theme="dark"` (attribut posé sur `<html>`).

Pour servir en local : `python -m http.server 8741 --directory static` (une entrée `trading-dashboard-static` existe aussi dans `G:\code\reg-immo\.claude\launch.json`).

## Architecture SPA — comment fonctionne la navigation

- **Une seule page.** Les 6 sections sont des `<section>` enfants directs de `<main>`, chacune avec un `style="display:none"` **inline** (voulu, ne pas retirer).
- La règle CSS `main > section.active { display: block !important }` (style.css) l'emporte sur le style inline. **Pour afficher une section il suffit de déplacer la classe `.active`** — ne jamais manipuler `element.style.display`.
- `showSection(id)` dans `app.js` fait ce travail : elle pose `.active` sur la section visée **et** sur le lien de nav correspondant (les liens portent `data-section="<id>"`, même valeur que l'id de section).
- Les liens de nav ont aussi l'attribut `onclick="showSection('<id>')"` (imposé par la spec d'origine) — c'est le point d'entrée réel des clics.
- Au chargement, `#dashboard` et son lien de nav ont déjà `class="active"` dans le HTML : la page n'est jamais vide, même sans JS.
- Pas de routing URL : pas de hash, pas de history API (choix de la spec d'origine).

## Les 6 sections et leurs IDs

IDs de section (valeurs acceptées par `showSection`) : `dashboard`, `watchlist`, `alerts`, `scans`, `logs`, `docs`.

### IDs dynamiques — le contrat pour le branchement API

Toutes les zones destinées à recevoir des données réelles ont un id stable. **Ne pas renommer ces IDs**, le backend/JS s'y accroche :

| ID | Élément | Contenu attendu (exemple actuel fictif) |
|---|---|---|
| `market-status` | `<span>` badge | `Ouvert` ou `Fermé` (garde la classe `.badge`, bascule `.badge-open` selon l'état) |
| `last-scan-time` | `<span>` | Heure de la dernière analyse, ex. `16:00` |
| `next-scan-time` | `<span>` | Heure de la prochaine analyse, ex. `16:30` |
| `status-ibkr` | `<span>` statut | `Connecté` / `Déconnecté` (classe `.status-ok` ou `.status-ko`) |
| `status-anthropic` | `<span>` statut | `Opérationnel` / `Erreur` (idem) |
| `status-telegram` | `<span>` statut | `Connecté` / `Déconnecté` (idem) |
| `watchlist-table` | `<tbody>` | Lignes de la watchlist (structure ci-dessous) |
| `alerts-table` | `<tbody>` | Lignes des alertes déclenchées |
| `scans-table` | `<tbody>` | Lignes de l'historique des scans |
| `logs-content` | `<pre>` | Texte brut du journal, une ligne par entrée (utiliser `textContent`) |

Les cartes « Résumé du jour » du dashboard (alertes aujourd'hui, symboles actifs, dernier signal) n'ont **pas** d'id — la spec d'origine ne l'exigeait pas. Si tu les rends dynamiques, ajoute des ids du même style (`summary-alerts-today`, `summary-active-symbols`, `summary-last-signal`) plutôt que de cibler par position.

### Structure des lignes de tableau (à reproduire côté JS)

Colonnes dans l'ordre. Reproduire ce balisage à l'identique pour garder le style :

**`#watchlist-table`** — Symbole | Prob. court | Prob. moyen | Scénario | Risque max | Statut

```html
<tr>
  <td class="sym">PLTR</td>
  <td class="num strong">72&nbsp;%</td>   <!-- .strong (doré) si ≥ 65 % -->
  <td class="num">64&nbsp;%</td>
  <td><span class="badge badge-a" title="Acheter et garder">A</span></td>
  <td class="num">6&nbsp;%</td>
  <td><input type="checkbox" role="switch" checked aria-label="Suivi de PLTR"></td>
</tr>
```

**`#alerts-table`** — Date | Symbole | Prob. court | Prob. moyen | Scénario | Risque | (action)

```html
<tr>
  <td class="mono">14/07/2026 16:00</td>
  <td class="sym">PLTR</td>
  <td class="num strong">72&nbsp;%</td>
  <td class="num">64&nbsp;%</td>
  <td><span class="badge badge-a" title="Acheter et garder">A</span></td>
  <td class="num">6&nbsp;%</td>
  <td class="cell-action"><button type="button" class="btn-ghost">Voir analyse</button></td>
</tr>
```

Les boutons « Voir analyse » n'ont **aucun handler** pour l'instant — comportement à définir (modale ? lien Telegram ? page d'analyse ?).

**`#scans-table`** — Date | Symbole | Prob. court | Prob. moyen | Score | Scénario | Déclenchée

```html
<tr>
  <td class="mono">14/07/2026 16:00</td>
  <td class="sym">PLTR</td>
  <td class="num">72&nbsp;%</td>
  <td class="num">64&nbsp;%</td>
  <td class="num strong">8,6</td>            <!-- .strong si score ≥ 8,0 -->
  <td><span class="badge badge-a" title="Acheter et garder">A</span></td>
  <td><span class="badge badge-open">Oui</span></td>   <!-- ou <span class="muted">Non</span> -->
</tr>
```

## Classes CSS réutilisables (style.css)

### Badges de scénario
- `.badge.badge-a` — scénario **A « Acheter et garder »** : doré
- `.badge.badge-b` — scénario **B « Surveiller »** : ivoire neutre
- `.badge.badge-c` — scénario **C « Éviter »** : rouge sourd
- `.badge.badge-open` — badge positif générique (marché « Ouvert », déclenchée « Oui ») : doré
- Toujours mettre le libellé long en `title="…"` sur les badges de scénario.

### Statuts de connecteur
- `.status.status-ok` — doré, avec `<span class="dot"></span>` (point pulsant) à l'intérieur
- `.status.status-ko` — rouge (prévu mais pas encore utilisé dans le HTML fictif)

### Cellules et texte
- `td.sym` — ticker (mono, gras, ivoire)
- `td.num` / `th.num` — valeur numérique (mono, aligné à droite)
- `.strong` — accent doré (valeur au-dessus d'un seuil)
- `.muted` — texte estompé
- `.mono` — police mono
- `.cell-action` — cellule d'action alignée à droite
- `.btn-ghost` — petit bouton discret contour doré (utilisé dans les tableaux)

### Layout
- `.card` — carte panneau (fond `--panel`, bordure `--line`, radius 12px)
- `.grid-3` — grille 3 colonnes (passe en 1 colonne sous 880px)
- `.table-card` + `.table-wrap` — carte contenant un tableau avec scroll horizontal
- `.terminal-card` > `.terminal-head` + `.terminal` > `pre#logs-content` — bloc terminal des logs (max-height 58vh, scrollable)
- `.section-head` (`<hgroup>`) — titre + sous-titre de section
- `.sub-head` (`<h3>`) — micro-label de sous-partie en petites capitales

## Design system

Palette (variables CSS sur `:root[data-theme="dark"]` dans style.css) :

| Variable | Valeur | Usage |
|---|---|---|
| `--ink` | `#0a0d13` | Fond de page (bleu-noir nuit) |
| `--panel` / `--panel-deep` | `#10141c` / `#080b10` | Fonds de cartes / terminal |
| `--line` | `#1d2330` | Bordures |
| `--ivory` / `--text` / `--muted` | `#ede7d9` / `#cfc9ba` / `#948f81` | Texte fort / courant / estompé |
| `--gold` | `#ecbe7a` | Accent principal (positif, actif, A) |
| `--red` | `#e0685f` | Négatif, risque, scénario C |

**Contraintes de palette (préférences utilisateur, à respecter partout)** : jamais de violet, de bleu électrique, de vert ni de marron. Le « positif » se code en **doré**, pas en vert. Titres en **serif** (`--font-serif`), chiffres en **mono tabulaire** (`--font-mono`).

Les overrides Pico passent par ses variables `--pico-*` (déclarées au même endroit). Les switches de la watchlist sont des `<input type="checkbox" role="switch">` stylés par Pico + overrides dorés.

## Icônes

SVG inline (24×24, `stroke="currentColor"`, stroke-width 2), tracés extraits des composants Lucide animés de `G:\code\infrastructureIA\App\Assets\Icones\icons\*.tsx` (source imposée par la spec). Icônes utilisées : gauge (Dashboard), eye (Watchlist), bell (Alertes), search (Scans), terminal (Logs), book-text (Docs), activity, clock, timer, chart-line (IBKR + logo), sparkles (Anthropic), send (Telegram), trending-up. Elles héritent de la couleur du texte via `currentColor` ; taille pilotée par le CSS (`svg { width/height }` contextuels).

## Données fictives — cohérence interne

Les données en dur racontent une seule histoire (utile pour vérifier qu'un branchement ne casse rien) :

- Marché **ouvert**, dernier scan **n°248 à 16:00** (3 symboles, 33 s), prochain à **16:30**, cycle 30 min.
- **PLTR** 72/64 % scénario A, score 8,6 → **seule alerte du scan de 16:00** (visible dans : résumé dashboard, tableau scans « Oui », tableau alertes, logs 16:00:40).
- **NVDA** alerte à 11:30 (score 8,2) → « Alertes aujourd'hui : 2 ».
- **MSFT** est **désactivé** dans la watchlist (switch off, scénario C) → « Symboles actifs : 3 », absent des scans du jour.
- Les logs (`#logs-content`) couvrent les scans n°247 (15:30) et n°248 (16:00), format : `[YYYY-MM-DD HH:MM:SS] LEVEL  message`.

## Endpoints suggérés (backend à créer)

Rien n'est implémenté côté serveur. Suggestion cohérente avec les TODO de `app.js` :

- `GET /api/status` → statut marché, heures dernier/prochain scan, état des 3 connecteurs, résumé du jour
- `GET /api/watchlist` → symboles + probabilités + scénario + risque + actif (bool)
- `POST /api/watchlist/{symbol}/toggle` → pour les switches (aucun handler branché pour l'instant)
- `GET /api/alerts` → historique des alertes
- `GET /api/scans` → historique des scans
- `GET /api/logs` → texte brut des N dernières lignes

Servir `static/` tel quel (FastAPI `StaticFiles` ou Flask `static_folder`) — **pas de Jinja2, pas de templating** dans index.html (contrainte de la spec d'origine).

**Persistance non tranchée** : rien ne précise où stocker l'historique des scans/alertes ni l'état on/off de la watchlist entre deux redémarrages du bot (base SQLite/Postgres ? fichiers JSON ?). À décider avant d'écrire le backend.

## Contraintes héritées de la spec d'origine (ne pas casser)

1. Une seule page `index.html`, sections affichées/masquées via `.active` — pas de rechargement, pas d'URL par section.
2. Les IDs du tableau « contrat » ci-dessus sont **obligatoires et figés**.
3. Tout le style dans `style.css` — aucun style inline sauf les `display:none` des sections.
4. Le `style="display:none"` inline des sections doit rester (le CSS `.active !important` est calibré pour ça).
5. Responsive cible : laptop 13" (~1280 px), sans scroll horizontal.
