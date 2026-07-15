  ## Stack technique

  | Couche | Techno | Notes |
  |---|---|---|
  | Backend | FastAPI + Uvicorn | Python, API REST |
  | Base de données | SQLite | Fichier `data/bot.db` |
  | Templates | Aucun (statique) | HTML pur dans `static/` |
  | Frontend | HTML + CSS | Pages statiques |
  | Glue front-back | JavaScript (fetch) | Écrit par Claude Code |
  | CSS framework | Pico CSS (CDN) | `https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css` |
  | Rafraîchissement | setInterval JS | Pas de WebSocket, pas de HTMX |
  | Déploiement | Docker (port 8080) | Accessible via Tailscale |

  ---

  ## Structure des fichiers

  trading-bot/
  ├── dashboard/
  │   ├── app.py          ← CLAUDE CODE
  │   ├── db.py           ← CLAUDE CODE
  │   └── static/
  │       ├── index.html      ← TON IA
  │       ├── style.css       ← TON IA
  │       └── app.js          ← CLAUDE CODE
  ├── main.py             ← CLAUDE CODE (modif légère : écriture SQLite)
  ├── data/
  │   ├── bot.log         (existant)
  │   └── bot.db          ← CLAUDE CODE (créé automatiquement)
  └── docker-compose.yml  ← CLAUDE CODE (ajout service dashboard)

  ---

  ## Répartition des tâches

  ### TON IA — Frontend (HTML/CSS uniquement)

  Construire `static/index.html` et `static/style.css`.
  **Pas de JavaScript à écrire.** Pas de Jinja2. HTML statique pur.
  Mettre des données fictives en dur pour voir le rendu.
  Claude Code branchera les vraies données via `app.js`.

  #### Pages à créer (navigation dans un seul fichier ou plusieurs)

  1. **Dashboard** — vue d'ensemble
  2. **Watchlist** — gestion des symboles
  3. **Alertes** — historique
  4. **Scans** — historique des cycles
  5. **Logs** — affichage texte brut
  6. **Docs** — documentation statique

  #### IDs HTML obligatoires (le JS en a besoin)

  ```html
  <!-- Dashboard -->
  <span id="market-status"></span>      <!-- "Ouvert" / "Fermé" -->
  <span id="last-scan-time"></span>     <!-- "il y a 3 min" -->
  <span id="next-scan-time"></span>     <!-- "dans 12 min" -->
  <span id="status-ibkr"></span>        <!-- "Connecté" / "Hors ligne" -->
  <span id="status-anthropic"></span>   <!-- "OK" / "Erreur" -->
  <span id="status-telegram"></span>    <!-- "OK" / "Erreur" -->

  <!-- Watchlist -->
  <tbody id="watchlist-table"></tbody>

  <!-- Alertes -->
  <tbody id="alerts-table"></tbody>

  <!-- Scans -->
  <tbody id="scans-table"></tbody>

  <!-- Logs -->
  <pre id="logs-content"></pre>

  Structure d'une ligne watchlist (exemple fictif pour le design)

  <tr>
    <td>AAPL</td>
    <td>67.3%</td>   <!-- probabilité court terme -->
    <td>71.0%</td>   <!-- probabilité moyen terme -->
    <td>A</td>        <!-- scénario -->
    <td>30€</td>      <!-- risque max -->
    <td><button>Actif</button></td>  <!-- toggle -->
  </tr>

  Structure d'une ligne alertes (exemple fictif pour le design)

  <tr>
    <td>14/07/2026 14:32</td>
    <td>PLTR</td>
    <td>72.5%</td>
    <td>A — Acheter et garder</td>
    <td>50€</td>
    <td><button>Voir analyse</button></td>
  </tr>

  ---
  CLAUDE CODE — Backend + JS

  dashboard/app.py

  Serveur FastAPI avec ces routes :

  GET  /                         → sert index.html
  GET  /api/status               → état général
  GET  /api/watchlist            → symboles + scores
  GET  /api/alerts               → historique alertes
  GET  /api/scans                → historique scans
  GET  /api/logs                 → 100 dernières lignes bot.log
  POST /api/watchlist/{symbol}/toggle  → activer/désactiver

  dashboard/db.py

  Gestion SQLite avec 3 tables :

  scans   (id, timestamp, symbol, prob_court, prob_moyen, score, scenario, triggered)
  alerts  (id, timestamp, symbol, prob_court, prob_moyen, scenario, risque, analyse, sent)
  symbols (id, symbol, enabled, added_at)

  dashboard/static/app.js

  - Fetch les endpoints /api/* toutes les 10s
  - Remplit les éléments HTML via leurs id
  - Gère le toggle watchlist (POST)
  - Refresh logs toutes les 5s

  main.py (modification légère)

  Ajouter après chaque scan et chaque alerte : INSERT dans SQLite.
  La logique de trading ne change pas.

  docker-compose.yml (ajout)

  dashboard:
    build: ./dashboard
    container_name: trading-dashboard
    network_mode: host
    restart: unless-stopped
    volumes:
      - ./data:/app/data
    ports:
      - "8080:8080"

  ---
  Format des réponses API

  GET /api/status

  {
    "market_open": true,
    "last_scan": "2026-07-14T14:32:00",
    "next_scan_in_seconds": 720,
    "connectors": {
      "ibkr": true,
      "anthropic": true,
      "telegram": true
    }
  }

  GET /api/watchlist

  [
    {
      "symbol": "PLTR",
      "enabled": true,
      "prob_court": 67.3,
      "prob_moyen": 71.0,
      "scenario": "A",
      "risque": 50,
      "last_alert": "2026-07-14T14:32:00"
    }
  ]

  GET /api/alerts

  [
    {
      "id": 1,
      "timestamp": "2026-07-14T14:32:00",
      "symbol": "PLTR",
      "prob_court": 67.3,
      "prob_moyen": 71.0,
      "scenario": "A",
      "scenario_desc": "Acheter et garder",
      "risque": 50,
      "analyse": "Texte complet de l'analyse Claude..."
    }
  ]

  GET /api/scans

  [
    {
      "id": 1,
      "timestamp": "2026-07-14T14:32:00",
      "symbol": "PLTR",
      "prob_court": 67.3,
      "prob_moyen": 71.0,
      "score": 3,
      "scenario": "A",
      "triggered": true
    }
  ]

  GET /api/logs

  {
    "lines": [
      "2026-07-14 14:32:00 [INFO] Démarrage du cycle...",
      "2026-07-14 14:32:01 [INFO] PLTR | court=67.3% ..."
    ]
  }

  ---
  Workflow de collaboration

  1. TON IA construit index.html + style.css avec données fictives
  2. Tu partages le HTML avec Claude Code
  3. Claude Code build le backend + app.js + Docker
  4. On intègre et on teste ensemble

  ---
  Notes importantes

  - Pico CSS via CDN : pas d'installation nécessaire
  - Le dashboard tourne sur http://<ip-tailscale>:8080
  - Pas d'authentification (réseau Tailscale = privé)
  - Le fichier bot.db est partagé entre le bot et le dashboard via un volume Docker
  - Le dashboard est lecture seule sauf le toggle watchlist