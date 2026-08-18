/* ------------------------------------------------------------------
   Malette — moteur de génération de checklist de vacances
   Toute la logique "métier" (règles, catégories, icônes) vit ici,
   séparée du rendu (app.js).
------------------------------------------------------------------- */

const DESTINATIONS = [
  { id: "plage",     label: "Plage",        icon: "🏖️", gradient: "grad-plage" },
  { id: "montagne",  label: "Montagne",     icon: "🏔️", gradient: "grad-montagne" },
  { id: "ski",       label: "Ski",          icon: "⛷️", gradient: "grad-ski" },
  { id: "ville",     label: "Citytrip",     icon: "🏙️", gradient: "grad-ville" },
  { id: "camping",   label: "Camping",      icon: "⛺",  gradient: "grad-camping" },
  { id: "roadtrip",  label: "Road trip",    icon: "🚐", gradient: "grad-roadtrip" },
  { id: "exotique",  label: "Exotique",     icon: "🌴", gradient: "grad-exotique" },
];

const SEASONS = [
  { id: "ete",       label: "Été",          icon: "☀️" },
  { id: "hiver",     label: "Hiver",        icon: "❄️" },
  { id: "misaison",  label: "Mi-saison",    icon: "🍂" },
];

const TRANSPORTS = [
  { id: "avion",   label: "Avion",   icon: "✈️" },
  { id: "voiture", label: "Voiture", icon: "🚗" },
  { id: "train",   label: "Train",   icon: "🚆" },
];

const CATEGORY_META = {
  documents:   { label: "Documents & argent", icon: "🪪" },
  vetements:   { label: "Vêtements",          icon: "👕" },
  toilette:    { label: "Trousse de toilette", icon: "🧴" },
  sante:       { label: "Santé & pharmacie",  icon: "💊" },
  electronique:{ label: "Électronique",       icon: "🔌" },
  enfants:     { label: "Enfants",            icon: "🧸" },
  bebe:        { label: "Bébé",               icon: "🍼" },
  specifique:  { label: "Spécial destination", icon: "🎒" },
  animaux:     { label: "Animal de compagnie", icon: "🐾" },
  business:    { label: "Travail",            icon: "💼" },
  divers:      { label: "Divers",             icon: "✨" },
};

function qty(n) {
  return n > 1 ? ` ×${n}` : "";
}

/**
 * Génère la liste d'objets à partir de la configuration du voyage.
 * Retourne un tableau { id, category, label } — les ids sont stables
 * pour une config donnée, ce qui permet de coder l'état coché de façon
 * compacte (juste la liste des ids cochés) dans un lien partageable.
 */
function generateChecklist(config) {
  const {
    destination, season, transport, days,
    adults, children, hasBaby, hasPet, isSport, isBusiness,
  } = config;

  const items = [];
  const add = (category, id, label) => items.push({ id, category, label });

  const people = Math.max(1, adults);
  const totalPersons = people + children;
  const laundryCycle = days > 7 ? Math.ceil(days / 4) : days;

  // ---------- Documents & argent ----------
  add("documents", "cni", "Carte d'identité / passeport");
  if (destination === "exotique" || transport === "avion") {
    add("documents", "passeport-valide", "Vérifier la validité du passeport (6 mois)");
    add("documents", "visa", "Visa / ESTA si nécessaire");
  }
  add("documents", "billets", "Billets / réservations (numérique + copie papier)");
  add("documents", "assurance", "Attestation d'assurance voyage");
  add("documents", "carte-vitale", "Carte vitale / carte européenne d'assurance maladie");
  add("documents", "argent", "Argent liquide + carte bancaire");
  add("documents", "permis", transport === "voiture" ? "Permis de conduire + carte grise" : "Permis de conduire (au cas où)");
  if (isBusiness) add("documents", "carte-visite", "Cartes de visite / badge");

  // ---------- Vêtements (adaptés à la saison) ----------
  add("vetements", "sousvetements", `Sous-vêtements${qty(laundryCycle + 2)}`);
  add("vetements", "chaussettes", `Chaussettes${qty(laundryCycle + 2)}`);
  add("vetements", "pyjama", "Pyjama / tenue de nuit");

  if (season === "ete") {
    add("vetements", "tshirts", `T-shirts${qty(Math.min(days, 7))}`);
    add("vetements", "short", `Shorts / jupes${qty(Math.min(days, 4))}`);
    add("vetements", "maillot", "Maillot de bain");
    add("vetements", "chapeau", "Chapeau / casquette");
    add("vetements", "sandales", "Sandales / tongs");
    add("vetements", "leger", "Vêtement léger pour les soirées");
  } else if (season === "hiver") {
    add("vetements", "pull", `Pulls chauds${qty(Math.min(days, 4))}`);
    add("vetements", "manteau", "Manteau d'hiver");
    add("vetements", "bonnet", "Bonnet");
    add("vetements", "gants", "Gants");
    add("vetements", "echarpe", "Écharpe");
    add("vetements", "chaussettes-chaudes", "Chaussettes chaudes / thermiques");
    add("vetements", "pantalon-chaud", `Pantalons chauds${qty(Math.min(days, 3))}`);
  } else {
    add("vetements", "tshirts-mix", `T-shirts / hauts${qty(Math.min(days, 6))}`);
    add("vetements", "pull-leger", "Pull léger / veste");
    add("vetements", "impermeable", "Coupe-vent / imperméable");
    add("vetements", "pantalon", `Pantalons${qty(Math.min(days, 3))}`);
  }

  add("vetements", "chaussures", "Chaussures confortables du quotidien");
  add("vetements", "tenue-habillee", "Une tenue plus habillée (soirée / restaurant)");
  add("vetements", "sac-linge-sale", "Sac pour le linge sale");

  // ---------- Trousse de toilette ----------
  add("toilette", "brosse-dents", "Brosse à dents + dentifrice");
  add("toilette", "douche", "Gel douche / shampoing (format voyage)");
  add("toilette", "deo", "Déodorant");
  add("toilette", "rasoir", "Rasoir / kit de rasage");
  add("toilette", "brosse-cheveux", "Brosse à cheveux");
  if (season === "ete" || destination === "plage" || destination === "exotique") {
    add("toilette", "solaire", "Crème solaire haute protection");
    add("toilette", "apres-soleil", "Après-soleil");
  }
  add("toilette", "hygiene", "Nécessaire d'hygiène personnelle");

  // ---------- Santé & pharmacie ----------
  add("sante", "trousse-secours", "Trousse de premiers secours");
  add("sante", "medicaments", "Médicaments habituels / ordonnance");
  add("sante", "doliprane", "Antidouleur / anti-fièvre");
  if (transport === "voiture" || destination === "montagne" || destination === "ski") {
    add("sante", "mal-transport", "Anti-nausées / mal des transports");
  }
  if (destination === "exotique") {
    add("sante", "antimoustique", "Répulsif anti-moustiques");
    add("sante", "vaccins", "Vérifier les vaccins recommandés");
    add("sante", "purification", "Pastilles de purification d'eau");
  }
  add("sante", "masques", "Masques / gel hydroalcoolique");

  // ---------- Électronique ----------
  add("electronique", "chargeurs", `Chargeurs (téléphone${totalPersons > 1 ? ", x" + totalPersons : ""})`);
  add("electronique", "batterie", "Batterie externe");
  if (destination === "exotique" || transport === "avion") {
    add("electronique", "adaptateur", "Adaptateur de prise universel");
  }
  add("electronique", "appareil-photo", "Appareil photo");
  add("electronique", "ecouteurs", "Écouteurs / casque");
  if (isSport) add("electronique", "montre-gps", "Montre GPS / tracker sportif");

  // ---------- Spécifique destination ----------
  if (destination === "plage") {
    add("specifique", "serviette-plage", `Serviette(s) de plage${qty(totalPersons)}`);
    add("specifique", "parasol", "Parasol / tente de plage");
    add("specifique", "tapis", "Natte / tapis de sol");
    add("specifique", "jeux-plage", "Jeux de plage (raquettes, ballon…)");
    add("specifique", "glaciere", "Glacière et bouteilles d'eau");
    add("specifique", "masque-tuba", "Masque et tuba");
  }
  if (destination === "montagne") {
    add("specifique", "chaussures-rando", "Chaussures de randonnée");
    add("specifique", "sac-dos-rando", "Sac à dos de randonnée");
    add("specifique", "gourde", "Gourde");
    add("specifique", "batons", "Bâtons de marche");
    add("specifique", "lunettes-soleil", "Lunettes de soleil (indice élevé)");
    add("specifique", "kway", "Coupe-vent imperméable");
  }
  if (destination === "ski") {
    add("specifique", "combinaison", "Combinaison / veste et pantalon de ski");
    add("specifique", "gants-ski", "Gants de ski");
    add("specifique", "masque-ski", "Masque ou lunettes de ski");
    add("specifique", "sous-vetements-thermiques", `Sous-vêtements thermiques${qty(Math.min(days, 3))}`);
    add("specifique", "casque-ski", "Casque (perso ou à louer)");
    add("specifique", "creme-froid", "Crème protectrice froid / UV neige");
    add("specifique", "forfaits", "Réservation forfaits & matériel");
  }
  if (destination === "ville") {
    add("specifique", "guide", "Guide / plan de la ville téléchargé");
    add("specifique", "chaussures-marche", "Bonnes chaussures de marche");
    add("specifique", "petit-sac", "Petit sac bandoulière anti-vol");
    add("specifique", "billets-visites", "Billets de musées / visites réservés");
  }
  if (destination === "camping") {
    add("specifique", "tente", "Tente + sardines + maillet");
    add("specifique", "sac-couchage", `Sac de couchage${qty(totalPersons)}`);
    add("specifique", "matelas", "Matelas / tapis de sol");
    add("specifique", "lampe-frontale", "Lampe frontale / lanterne");
    add("specifique", "rechaud", "Réchaud + gaz + popote");
    add("specifique", "couteau", "Couteau multifonction");
    add("specifique", "sac-etanche", "Sac étanche");
  }
  if (destination === "roadtrip") {
    add("specifique", "gps", "GPS / carte routière hors-ligne");
    add("specifique", "chargeur-voiture", "Chargeur allume-cigare");
    add("specifique", "snacks", "En-cas et snacks de route");
    add("specifique", "oreiller-voyage", "Coussin de voyage");
    add("specifique", "kit-secours-voiture", "Kit de sécurité voiture (triangle, gilet)");
    add("specifique", "playlist", "Playlists / podcasts téléchargés");
  }
  if (destination === "exotique") {
    add("specifique", "moustiquaire", "Moustiquaire de voyage");
    add("specifique", "tenue-legere-couvrante", "Vêtements légers et couvrants (soirée / respect local)");
    add("specifique", "sac-etanche-exo", "Pochette étanche pour documents");
    add("specifique", "guide-langue", "Guide de conversation / traducteur");
  }

  // ---------- Enfants ----------
  if (children > 0) {
    add("enfants", "doudou", "Doudou(s) / peluche préférée");
    add("enfants", "jeux", "Jeux et livres pour le trajet");
    add("enfants", "gouter", "Goûters / en-cas");
    add("enfants", "vetements-enfants", `Vêtements de rechange enfant${qty(children)}`);
    add("enfants", "carnet-sante", "Carnet de santé");
    if (destination === "plage" || destination === "exotique") {
      add("enfants", "brassards", "Brassards / bouée");
      add("enfants", "solaire-enfant", "Crème solaire spéciale enfant");
    }
    if (destination === "ski") add("enfants", "casque-enfant", "Casque de ski enfant");
  }
  if (hasBaby) {
    add("bebe", "couches", "Couches (prévoir large)");
    add("bebe", "lingettes", "Lingettes");
    add("bebe", "lait", "Lait / petits pots");
    add("bebe", "biberons", "Biberons");
    add("bebe", "poussette", "Poussette");
    add("bebe", "porte-bebe", "Porte-bébé");
    add("bebe", "tetine", "Tétine(s) de rechange");
    add("bebe", "trousse-bebe", "Trousse de toilette bébé");
  }

  // ---------- Animal de compagnie ----------
  if (hasPet) {
    add("animaux", "carnet-vaccin", "Carnet de vaccination / passeport animal");
    add("animaux", "nourriture-animal", "Nourriture et gamelles");
    add("animaux", "laisse", "Laisse / harnais");
    add("animaux", "panier", "Panier de transport");
    add("animaux", "sacs-dejections", "Sacs à déjections");
    add("animaux", "jouet-animal", "Jouet favori");
  }

  // ---------- Travail ----------
  if (isBusiness) {
    add("business", "ordinateur", "Ordinateur portable + chargeur");
    add("business", "tenue-pro", "Tenue professionnelle");
    add("business", "dossiers", "Dossiers / présentations");
  }

  // ---------- Divers ----------
  add("divers", "cadenas", "Petit cadenas");
  add("divers", "livre", "Livre / liseuse");
  add("divers", "lunettes-soleil-d", "Lunettes de soleil");
  if (isSport) add("divers", "tenue-sport", "Tenue et chaussures de sport");
  add("divers", "cle-maison", "Vérifier fermeture du domicile");

  return items;
}

function groupByCategory(items) {
  const order = Object.keys(CATEGORY_META);
  const groups = {};
  for (const item of items) {
    (groups[item.category] ??= []).push(item);
  }
  return order
    .filter((cat) => groups[cat] && groups[cat].length)
    .map((cat) => ({ category: cat, meta: CATEGORY_META[cat], items: groups[cat] }));
}
