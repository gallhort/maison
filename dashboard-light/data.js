/* =====================================================================
   Triade Concept Immo — Back-Office Essentiel · data.js (allégé)
   Données fictives exposées dans window.DB.
   C'est le seul fichier à remplacer par des appels API.
   Collections conservées : agence, user, properties, demandes, appointments.
   Collections SUPPRIMÉES vs Prestige FULL : agents (équipe), clients (pipeline),
   conversations (fil de discussion), transactions, notifications, activites,
   mandats, offres, séries agrégées (moisLabels, caVentes, caLocations,
   visitesSemaine, leadsSources, pipelineEtapes, evolutionPrixM2).
   ===================================================================== */
(function () {
  const TODAY = '2026-09-26'; // À remplacer par la date serveur ou new Date()

  window.DB = {
    TODAY,

    edition: 'essentiel', // 'essentiel' | 'prestige'
    showUpgrade: true,     // Affiche le rappel discret « Prestige FULL »

    agence: {
      nom: 'Triade Concept Immo',
      slogan: 'Expertise et Confiance',
      adresse: '67 Cours Mirabeau, 13100 Aix-en-Provence',
      tel: '+33 4 42 96 10 20',
      email: 'contact@triadeconceptimmo.fr',
      site: 'triadeconceptimmo.fr',
      horaires: 'Du lundi au samedi, 9h – 18h',
      registre: 'Carte professionnelle n° CPI 1301 2026 000 000 000'
    },

    user: {
      id: 'u1',
      nom: 'Thomas Reig',
      initiales: 'TR',
      role: 'Directeur des ventes',
      email: 't.reig@triadeconceptimmo.fr',
      tel: '+33 6 12 34 56 78'
    },

    /* ---------- Biens ----------
       statut : Disponible | Vendu | Loué
       transaction : Vente | Location (prix = loyer mensuel pour une location) */
    properties: [
      { id: 'p1', titre: 'Villa Les Palmiers', adresse: 'chemin des Crêtes', quartier: 'Cap d’Antibes', type: 'Villa', transaction: 'Vente', statut: 'Disponible', prix: 2850000, surface: 520, terrain: 1200, chambres: 6, sdb: 5, img: 'assets/prop-1.jpg', ajout: '2026-09-24', exclusif: true, desc: 'Villa contemporaine avec piscine à débordement et vue mer panoramique.' },
      { id: 'p2', titre: 'Penthouse Haussmann', adresse: 'rue Masséna', quartier: 'Nice · Carré d’Or', type: 'Penthouse', transaction: 'Vente', statut: 'Sous offre', prix: 1680000, surface: 240, terrain: 0, chambres: 4, sdb: 3, img: 'assets/prop-2.jpg', ajout: '2026-09-21', exclusif: true, desc: 'Dernier étage d’un immeuble haussmannien entièrement rénové.' },
      { id: 'p3', titre: 'Rooftop La Croisette', adresse: 'boulevard de la Croisette', quartier: 'Cannes · La Californie', type: 'Appartement', transaction: 'Location', statut: 'Disponible', prix: 4800, surface: 185, terrain: 0, chambres: 3, sdb: 2, img: 'assets/prop-3.jpg', ajout: '2026-09-18', exclusif: true, desc: 'Appartement en dernier étage avec terrasse de 90 m² plein ouest.' },
      { id: 'p4', titre: 'Bastide des Cyprès', adresse: 'chemin des Cyprès', quartier: 'Le Tholonet', type: 'Villa', transaction: 'Vente', statut: 'Disponible', prix: 2120000, surface: 430, terrain: 900, chambres: 5, sdb: 4, img: 'assets/prop-4.jpg', ajout: '2026-09-10', exclusif: false, desc: 'Architecture provençale, patio central et jardin d’oliviers.' },
      { id: 'p5', titre: 'Maison de Verre', adresse: 'chemin des Oliviers', quartier: 'Puyricard', type: 'Maison', transaction: 'Location', statut: 'En location', prix: 6500, surface: 310, terrain: 700, chambres: 4, sdb: 3, img: 'assets/prop-5.jpg', ajout: '2026-09-05', exclusif: false, desc: 'Maison d’architecte en béton brut et verre, terrasse en bois exotique.' },
      { id: 'p6', titre: 'Villa Bois des Pins', adresse: 'chemin du Bois des Pins', quartier: 'Grasse', type: 'Villa', transaction: 'Vente', statut: 'Disponible', prix: 1480000, surface: 380, terrain: 850, chambres: 5, sdb: 3, img: 'assets/prop-6.jpg', ajout: '2026-08-28', exclusif: false, desc: 'Villa familiale au calme absolu, en lisière de forêt.' },
      { id: 'p7', titre: 'Duplex Notre-Dame', adresse: 'chemin du Belvédère', quartier: 'Èze', type: 'Duplex', transaction: 'Vente', statut: 'Disponible', prix: 960000, surface: 210, terrain: 0, chambres: 4, sdb: 2, img: 'assets/prop-2.jpg', ajout: '2026-08-20', exclusif: false, desc: 'Duplex lumineux avec vue dégagée sur le village perché et la mer.' },
      { id: 'p8', titre: 'Loft Vieux-Nice', adresse: 'rue de France', quartier: 'Nice · Carré d’Or', type: 'Appartement', transaction: 'Location', statut: 'Disponible', prix: 3200, surface: 140, terrain: 0, chambres: 2, sdb: 2, img: 'assets/prop-5.jpg', ajout: '2026-08-12', exclusif: false, desc: 'Loft industriel rénové, hauteur sous plafond 4 m.' }
    ],

    /* ---------- Demandes reçues depuis le formulaire de contact du site ----------
       sujet  : Demande de visite | Information | Estimation | Autre
       statut : Nouveau | Traité | Archivé   ·   bien → properties.id | null */
    demandes: [
      { id: 'd1', nom: 'Kévin Hardy', email: 'k.hardy@mail.com', tel: '+33 6 61 22 33 44', sujet: 'Demande de visite', bien: 'p1', date: '2026-09-26', heure: '09:12', lu: false, statut: 'Nouveau', message: 'Bonjour, je souhaiterais visiter la Villa Les Palmiers cette semaine, idéalement jeudi en fin de journée. Est-il possible de recevoir le dossier complet au préalable ?' },
      { id: 'd2', nom: 'Laëtitia Monnier', email: 'laetitia.monnier@mail.com', tel: '+33 7 70 45 67 89', sujet: 'Information', bien: 'p2', date: '2026-09-25', heure: '18:40', lu: false, statut: 'Nouveau', message: "Le penthouse dispose-t-il de places de parking en sous-sol ? Quelles sont les charges annuelles de copropriété ?" },
      { id: 'd3', nom: 'Olivier Béchard', email: 'o.bechard@mail.com', tel: '+33 6 50 98 76 54', sujet: 'Estimation', bien: null, date: '2026-09-25', heure: '11:05', lu: false, statut: 'Nouveau', message: "Je possède une villa de 380 m² à Valbonne et j'envisage de la mettre en vente. Pouvez-vous organiser une estimation ?" },
      { id: 'd4', nom: 'Sarah Caillet', email: 'sarah.caillet@mail.com', tel: '+33 6 98 11 22 33', sujet: 'Demande de visite', bien: 'p3', date: '2026-09-24', heure: '15:22', lu: true, statut: 'Traité', message: 'Intéressée par la location du Rooftop La Croisette à partir de novembre, pour un bail de 12 mois.' },
      { id: 'd5', nom: 'Nathan Fabre', email: 'nathan.fabre@mail.com', tel: '+33 6 61 55 44 33', sujet: 'Information', bien: 'p5', date: '2026-09-23', heure: '10:47', lu: true, statut: 'Nouveau', message: 'Le loyer de la Maison de Verre est-il négociable ? Je peux m\'engager sur un bail d\'un an.' },
      { id: 'd6', nom: 'Amélie Rousset', email: 'amelie.rousset@mail.com', tel: '+33 7 70 00 11 22', sujet: 'Autre', bien: null, date: '2026-09-21', heure: '08:30', lu: true, statut: 'Traité', message: "Je recherche un bien d'exception avec vue mer entre Cannes et Port Grimaud, budget autour de 2,5 M€." },
      { id: 'd7', nom: 'Yannick Delorme', email: 'y.delorme@mail.com', tel: '+33 6 55 66 77 88', sujet: 'Demande de visite', bien: 'p7', date: '2026-09-19', heure: '17:15', lu: true, statut: 'Archivé', message: 'Visite souhaitée pour le Duplex Notre-Dame le week-end prochain.' }
    ],

    /* ---------- Rendez-vous (lecture seule, affichés sur le tableau de bord) ----------
       type : Visite | Estimation | Appel   ·   bien → properties.id | null */
    appointments: [
      { id: 'r1', date: '2026-09-26', heure: '11:00', type: 'Visite', bien: 'p1', contact: 'Kévin Hardy', lieu: 'Sur place' },
      { id: 'r2', date: '2026-09-27', heure: '15:30', type: 'Estimation', bien: null, contact: 'Olivier Béchard', lieu: 'Valbonne' },
      { id: 'r3', date: '2026-09-28', heure: '10:00', type: 'Visite', bien: 'p3', contact: 'Sarah Caillet', lieu: 'Sur place' },
      { id: 'r4', date: '2026-09-30', heure: '17:00', type: 'Appel', bien: 'p5', contact: 'Nathan Fabre', lieu: 'Téléphone' },
      { id: 'r5', date: '2026-10-02', heure: '14:00', type: 'Visite', bien: 'p2', contact: 'Laëtitia Monnier', lieu: 'Sur place' },
      { id: 'r0', date: '2026-09-22', heure: '10:00', type: 'Visite', bien: 'p4', contact: 'M. Simonet', lieu: 'Sur place' }
    ],

    /* Référentiels (listes des formulaires) */
    ref: {
      types: ['Villa', 'Appartement', 'Penthouse', 'Duplex', 'Maison', 'Terrain'],
      transactions: ['Vente', 'Location'],
      quartiers: ['Cap d’Antibes', 'Nice · Carré d’Or', 'Mougins', 'Valbonne', 'Cannes · La Californie', 'Saint-Jean-Cap-Ferrat', 'Èze', 'Port Grimaud', 'Grasse'],
      sujets: ['Demande de visite', 'Information', 'Estimation', 'Autre']
    }
  };
})();
