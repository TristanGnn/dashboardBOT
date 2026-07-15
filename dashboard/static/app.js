/* ============================================================
   Sentinel — app.js
   Partie 1 (FAITE) : navigation SPA entre les sections.
   Partie 2 (À FAIRE) : branchement des données réelles — voir
   les TODO en bas de fichier et le CLAUDE.md à la racine du
   projet pour le contrat complet (IDs, classes CSS, formats).
   ============================================================ */

"use strict";

/**
 * Affiche la section demandée et masque les cinq autres.
 * Appelée par les onclick de la nav : showSection('dashboard'), etc.
 * IDs valides : dashboard | watchlist | alerts | scans | logs | docs
 *
 * Le CSS contient `main > section.active { display: block !important }`
 * qui l'emporte sur le style inline `display:none` des sections —
 * il suffit donc de déplacer la classe .active, ne pas toucher
 * à element.style.display.
 */
function showSection(id) {
  document.querySelectorAll("main > section").forEach((section) => {
    section.classList.toggle("active", section.id === id);
  });
  // La nav porte data-section="<id>" sur chaque lien (même valeur que l'id de section)
  document.querySelectorAll(".topbar nav a[data-section]").forEach((link) => {
    link.classList.toggle("active", link.dataset.section === id);
  });
}

/* ------------------------------------------------------------
   TODO (agent suivant) — branchement des données réelles.

   Le HTML est entièrement statique avec des données fictives ;
   chaque zone dynamique a un id stable prévu pour être remplacé :

     GET /api/status     -> #market-status (textContent "Ouvert"/"Fermé"
                            + basculer .badge-open / rien),
                            #last-scan-time, #next-scan-time,
                            #status-ibkr / #status-anthropic / #status-telegram
                            (textContent + .status-ok ou .status-ko)
     GET /api/watchlist  -> lignes <tr> dans #watchlist-table
     GET /api/alerts     -> lignes <tr> dans #alerts-table
     GET /api/scans      -> lignes <tr> dans #scans-table
     GET /api/logs       -> texte brut dans #logs-content (textContent)

   Reproduire le balisage des lignes fictives existantes
   (classes td.sym / td.num / .badge-a|b|c / .btn-ghost, etc.)
   pour conserver le style. Détail complet dans CLAUDE.md.
   ------------------------------------------------------------ */
