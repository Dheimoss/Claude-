# 🧳 Malette — checklist de vacances sur-mesure

Un générateur de checklist de valise, adapté à ta destination, la saison,
le nombre de voyageurs (enfants compris) et tes activités. La liste se
coche, se personnalise (ajout/suppression d'objets) et se **partage via un
simple lien** — tout l'état (config, cases cochées, objets ajoutés) est
encodé dans l'URL, sans aucun serveur ni base de données.

## Fonctionnalités

- Configurateur : destination (plage, montagne, ski, ville, camping, road
  trip, exotique), saison, transport, durée, nombre d'adultes/enfants,
  bébé, animal de compagnie, activités sportives, voyage professionnel.
- Génération d'une checklist organisée par catégories (documents,
  vêtements, toilette, santé, électronique, enfants, spécifique à la
  destination, etc.), avec quantités ajustées à la durée et au nombre de
  personnes.
- Ajout d'objets personnalisés par catégorie, suppression de n'importe
  quel objet.
- Barre de progression circulaire + petite animation de célébration à
  100% de la valise emballée.
- Partage : le bouton « Partager le lien » copie (ou ouvre le partage
  natif sur mobile) une URL qui restaure exactement le même état chez la
  personne qui l'ouvre.
- Persistance locale (localStorage) pour retrouver sa liste en revenant
  sur le site, même sans le lien.
- Thème clair / sombre (auto selon les préférences système + bouton pour
  forcer un thème), design "mesh gradient + glassmorphism".

## Stack

Aucun framework, aucune étape de build : HTML / CSS / JS vanilla.

- `index.html` — structure de la page
- `styles.css` — design (mesh gradient animé, glassmorphism, bento grid)
- `data.js` — règles de génération de la checklist (catégories, objets
  conditionnels selon la configuration)
- `app.js` — état de l'application, rendu, encodage/décodage du lien de
  partage, thème, stockage local

## Lancer le site en local

```bash
python3 -m http.server 8080
# puis ouvrir http://localhost:8080
```

(N'importe quel serveur de fichiers statiques fonctionne — aucune API,
aucune variable d'environnement.)

## Déploiement (GitHub Pages)

Un workflow GitHub Actions (`.github/workflows/deploy.yml`) publie
automatiquement le contenu du dépôt sur GitHub Pages à chaque push sur la
branche par défaut. Il suffit d'activer Pages avec la source « GitHub
Actions » dans les paramètres du dépôt (`Settings → Pages → Source`).
