/* ============================================================
   Données fictives — Triade Concept Immo (front uniquement)
   ============================================================ */

window.DB = (() => {
  const agents = [
    { id: 'a1', nom: 'Thomas Reig', role: 'Directeur des ventes', initiales: 'TR', couleur: '#C9A46A', tel: '+33 6 12 34 56 78', email: 't.reig@triadeconceptimmo.fr', ventes: 14, ca: 6120000, mandats: 9, note: 4.9, objectif: 7200000 },
    { id: 'a2', nom: 'Antoine Vidal', role: 'Négociateur senior', initiales: 'AV', couleur: '#8A9A7B', tel: '+33 6 61 98 76 54', email: 'a.vidal@triadeconceptimmo.fr', ventes: 11, ca: 4980000, mandats: 7, note: 4.8, objectif: 6000000 },
    { id: 'a3', nom: 'Margaux Ferrand', role: 'Conseillère location', initiales: 'MF', couleur: '#B07C6C', tel: '+33 6 70 45 67 89', email: 'm.ferrand@triadeconceptimmo.fr', ventes: 9, ca: 3180000, mandats: 12, note: 4.7, objectif: 4000000 },
    { id: 'a4', nom: 'Louis Bréa', role: 'Négociateur', initiales: 'LB', couleur: '#6E86A6', tel: '+33 6 55 23 45 67', email: 'l.brea@triadeconceptimmo.fr', ventes: 7, ca: 2760000, mandats: 6, note: 4.6, objectif: 3800000 },
    { id: 'a5', nom: 'Camille Sorel', role: 'Conseillère prestige', initiales: 'CS', couleur: '#9B8AA6', tel: '+33 6 60 11 22 33', email: 'c.sorel@triadeconceptimmo.fr', ventes: 6, ca: 3410000, mandats: 5, note: 4.9, objectif: 4200000 },
  ];

  const properties = [
    { id: 'p1', titre: 'Villa Les Palmiers', adresse: '12 chemin des Crêtes, Cap d’Antibes', quartier: 'Cap d’Antibes', type: 'Villa', transaction: 'Vente', statut: 'Disponible', prix: 2850000, surface: 520, terrain: 1200, chambres: 6, sdb: 5, garage: 3, vues: 2412, favoris: 38, agent: 'a1', img: 'assets/prop-1.jpg', note: 4.9, ajout: '2026-09-02', lat: 43.5528, lng: 7.1276, exclusif: true, desc: 'Villa contemporaine avec piscine à débordement et vue mer panoramique. Prestations haut de gamme, domotique complète, pool-house indépendant.' },
    { id: 'p2', titre: 'Penthouse Haussmann', adresse: '4 rue Masséna, Nice', quartier: 'Nice · Carré d’Or', type: 'Penthouse', transaction: 'Vente', statut: 'Sous offre', prix: 1680000, surface: 240, terrain: 0, chambres: 4, sdb: 3, garage: 2, vues: 1873, favoris: 27, agent: 'a5', img: 'assets/prop-2.jpg', note: 4.8, ajout: '2026-08-21', lat: 43.6970, lng: 7.2680, exclusif: true, desc: 'Dernier étage d’un immeuble haussmannien entièrement rénové. Parquet point de Hongrie, moulures d’origine, cheminée en marbre.' },
    { id: 'p3', titre: 'Bastide des Cyprès', adresse: '27 chemin des Cyprès, Le Tholonet', quartier: 'Le Tholonet', type: 'Villa', transaction: 'Vente', statut: 'Disponible', prix: 2120000, surface: 430, terrain: 900, chambres: 5, sdb: 4, garage: 2, vues: 1540, favoris: 22, agent: 'a2', img: 'assets/prop-3.jpg', note: 4.7, ajout: '2026-09-10', lat: 43.5145, lng: 5.5264, exclusif: false, desc: 'Architecture provençale, patio central avec fontaine en pierre de Rognes, jardin planté de lavande et d’oliviers. Une adresse rare.' },
    { id: 'p4', titre: 'Maison de Verre', adresse: '8 chemin des Oliviers, Puyricard', quartier: 'Puyricard', type: 'Maison', transaction: 'Location', statut: 'En location', prix: 6500, surface: 310, terrain: 700, chambres: 4, sdb: 3, garage: 2, vues: 987, favoris: 15, agent: 'a3', img: 'assets/prop-4.jpg', note: 4.6, ajout: '2026-09-15', lat: 43.5980, lng: 5.4130, exclusif: false, desc: 'Maison d’architecte en béton brut et verre, terrasse en bois exotique, oliveraie. Loyer mensuel, meublée.' },
    { id: 'p5', titre: 'Rooftop La Croisette', adresse: '15 boulevard de la Croisette, Cannes', quartier: 'Cannes · La Californie', type: 'Appartement', transaction: 'Location', statut: 'Disponible', prix: 4800, surface: 185, terrain: 0, chambres: 3, sdb: 2, garage: 1, vues: 2104, favoris: 44, agent: 'a3', img: 'assets/prop-5.jpg', note: 4.9, ajout: '2026-09-18', lat: 43.5490, lng: 7.0270, exclusif: true, desc: 'Appartement en dernier étage avec terrasse de 90 m² plein ouest, vue sur la Croisette. Coucher de soleil garanti chaque soir.' },
    { id: 'p6', titre: 'Palais des Palmes', adresse: '3 avenue Denis Séméria, Saint-Jean-Cap-Ferrat', quartier: 'Saint-Jean-Cap-Ferrat', type: 'Villa', transaction: 'Vente', statut: 'Vendu', prix: 3950000, surface: 780, terrain: 2400, chambres: 8, sdb: 7, garage: 4, vues: 3210, favoris: 61, agent: 'a1', img: 'assets/prop-6.jpg', note: 5.0, ajout: '2026-06-04', lat: 43.6870, lng: 7.3300, exclusif: true, desc: 'Demeure de style Belle Époque, allée bordée de palmiers royaux, dépendances et parc arboré. Vendue en 47 jours.' },
    { id: 'p7', titre: 'Duplex Notre-Dame', adresse: 'chemin du Belvédère, Èze', quartier: 'Èze', type: 'Duplex', transaction: 'Vente', statut: 'Disponible', prix: 960000, surface: 210, terrain: 0, chambres: 4, sdb: 2, garage: 1, vues: 764, favoris: 9, agent: 'a4', img: 'assets/prop-2.jpg', note: 4.5, ajout: '2026-09-20', lat: 43.7280, lng: 7.3620, exclusif: false, desc: 'Duplex lumineux avec vue dégagée sur le village perché et la mer. Cuisine ouverte, deux terrasses.' },
    { id: 'p8', titre: 'Villa Port Grimaud', adresse: 'Marina de Port Grimaud, Grimaud', quartier: 'Port Grimaud', type: 'Villa', transaction: 'Location', statut: 'Loué', prix: 8900, surface: 460, terrain: 1100, chambres: 5, sdb: 5, garage: 3, vues: 1322, favoris: 31, agent: 'a5', img: 'assets/prop-1.jpg', note: 4.8, ajout: '2026-07-12', lat: 43.2760, lng: 6.5780, exclusif: true, desc: 'Pied dans l’eau, accès direct à la marina, piscine chauffée. Louée à l’année.' },
    { id: 'p9', titre: 'Appartement Golf', adresse: '9 résidence Le Golf, Aix-en-Provence', quartier: 'Aix-en-Provence', type: 'Appartement', transaction: 'Vente', statut: 'Disponible', prix: 740000, surface: 165, terrain: 0, chambres: 3, sdb: 2, garage: 2, vues: 1105, favoris: 12, agent: 'a4', img: 'assets/prop-5.jpg', note: 4.4, ajout: '2026-09-22', lat: 43.5297, lng: 5.4474, exclusif: false, desc: 'Résidence sécurisée avec conciergerie, vue sur le golf. Finitions marbre et chêne.' },
    { id: 'p10', titre: 'Terrain Les Hauteurs', adresse: 'Lot 14, Les Hauteurs de Cap d’Antibes', quartier: 'Cap d’Antibes', type: 'Terrain', transaction: 'Vente', statut: 'Sous offre', prix: 1900000, surface: 0, terrain: 1500, chambres: 0, sdb: 0, garage: 0, vues: 611, favoris: 7, agent: 'a2', img: 'assets/prop-6.jpg', note: 4.3, ajout: '2026-08-30', lat: 43.5610, lng: 7.1250, exclusif: false, desc: 'Terrain constructible viabilisé, vue mer, COS avantageux. Idéal projet de villa d’exception.' },
    { id: 'p11', titre: 'Loft Vieux-Nice', adresse: '41 rue de France, Nice', quartier: 'Nice · Carré d’Or', type: 'Appartement', transaction: 'Location', statut: 'Disponible', prix: 3200, surface: 140, terrain: 0, chambres: 2, sdb: 2, garage: 1, vues: 845, favoris: 18, agent: 'a3', img: 'assets/prop-4.jpg', note: 4.6, ajout: '2026-09-24', lat: 43.6960, lng: 7.2620, exclusif: false, desc: 'Loft industriel rénové, hauteur sous plafond 4 m, verrière d’atelier. Meublé, disponible immédiatement.' },
    { id: 'p12', titre: 'Villa Bois des Pins', adresse: '6 chemin du Bois des Pins, Grasse', quartier: 'Grasse', type: 'Villa', transaction: 'Vente', statut: 'Disponible', prix: 1480000, surface: 380, terrain: 850, chambres: 5, sdb: 3, garage: 2, vues: 932, favoris: 14, agent: 'a1', img: 'assets/prop-3.jpg', note: 4.5, ajout: '2026-09-12', lat: 43.6580, lng: 6.9260, exclusif: false, desc: 'Villa familiale au calme absolu, en lisière de forêt. Grand séjour cathédrale, cuisine d’été.' },
  ];

  const clients = [
    { id: 'c1', nom: 'Nicolas Bouchard', type: 'Acheteur', budget: 3000000, etape: 'Négociation', agent: 'a1', dernier: '2026-09-25', source: 'Recommandation', tel: '+33 6 50 00 11 22', email: 'n.bouchard@gmail.com', interet: 'p1', score: 92, quartiers: ['Cap d’Antibes', 'Saint-Jean-Cap-Ferrat'], types: ['Villa'], chambresMin: 5 },
    { id: 'c2', nom: 'Amandine & Fabien Caron', type: 'Acheteur', budget: 1800000, etape: 'Offre', agent: 'a5', dernier: '2026-09-24', source: 'Site web', tel: '+33 6 61 33 44 55', email: 'caron.famille@outlook.fr', interet: 'p2', score: 88, quartiers: ['Nice · Carré d’Or', 'Cap d’Antibes'], types: ['Penthouse', 'Appartement', 'Duplex'], chambresMin: 3 },
    { id: 'c3', nom: 'Groupe Riviera Invest', type: 'Investisseur', budget: 5000000, etape: 'Qualifié', agent: 'a2', dernier: '2026-09-23', source: 'Salon immobilier', tel: '+33 4 93 60 70 80', email: 'contact@riviera-invest.fr', interet: 'p10', score: 76, quartiers: ['Cap d’Antibes', 'Mougins', 'Grasse'], types: ['Terrain', 'Villa'], chambresMin: 0 },
    { id: 'c4', nom: 'Dr. Léa Marchand', type: 'Locataire', budget: 7000, etape: 'Visite', agent: 'a3', dernier: '2026-09-25', source: 'Instagram', tel: '+33 6 70 88 99 00', email: 'lea.marchand@me.com', interet: 'p5', score: 81, quartiers: ['Cannes · La Californie', 'Nice · Carré d’Or'], types: ['Appartement'], chambresMin: 2 },
    { id: 'c5', nom: 'Mathieu Servant', type: 'Vendeur', budget: 0, etape: 'Signé', agent: 'a1', dernier: '2026-09-20', source: 'Recommandation', tel: '+33 6 55 66 77 88', email: 'm.servant@yahoo.fr', interet: 'p6', score: 100, quartiers: [], types: [], chambresMin: 0 },
    { id: 'c6', nom: 'Famille de Montclair', type: 'Locataire', budget: 10000, etape: 'Négociation', agent: 'a5', dernier: '2026-09-22', source: 'Réseau', tel: '+33 6 21 92 00 00', email: 'contact@montclair-family.fr', interet: 'p8', score: 90, quartiers: ['Port Grimaud', 'Cap d’Antibes', 'Saint-Jean-Cap-Ferrat'], types: ['Villa'], chambresMin: 4 },
    { id: 'c7', nom: 'Julien Berger', type: 'Acheteur', budget: 1000000, etape: 'Nouveau', agent: 'a4', dernier: '2026-09-25', source: 'Site web', tel: '+33 6 60 12 12 12', email: 'julien.berger@proton.me', interet: 'p7', score: 54, quartiers: ['Èze', 'Grasse', 'Mougins'], types: ['Duplex', 'Appartement'], chambresMin: 3 },
    { id: 'c8', nom: 'Hélène Dubosc', type: 'Vendeur', budget: 0, etape: 'Qualifié', agent: 'a2', dernier: '2026-09-19', source: 'Appel entrant', tel: '+33 6 50 45 45 45', email: 'h.dubosc@gmail.com', interet: null, score: 70, quartiers: [], types: [], chambresMin: 0 },
    { id: 'c9', nom: 'Yanis & Sarah Lemoine', type: 'Acheteur', budget: 1600000, etape: 'Visite', agent: 'a1', dernier: '2026-09-24', source: 'Recommandation', tel: '+33 6 61 78 78 78', email: 'lemoine.ys@gmail.com', interet: 'p12', score: 79, quartiers: ['Grasse', 'Mougins', 'Valbonne'], types: ['Villa', 'Maison'], chambresMin: 4 },
    { id: 'c10', nom: 'Olivier Delage', type: 'Investisseur', budget: 2500000, etape: 'Nouveau', agent: 'a4', dernier: '2026-09-26', source: 'LinkedIn', tel: '+33 6 55 90 90 90', email: 'o.delage@delage-holding.fr', interet: 'p3', score: 61, quartiers: ['Mougins', 'Cap d’Antibes'], types: ['Villa', 'Terrain'], chambresMin: 0 },
    { id: 'c11', nom: 'Inès Rambert', type: 'Locataire', budget: 4000, etape: 'Offre', agent: 'a3', dernier: '2026-09-25', source: 'Site web', tel: '+33 6 70 10 20 30', email: 'ines.rambert@gmail.com', interet: 'p11', score: 85, quartiers: ['Nice · Carré d’Or'], types: ['Appartement'], chambresMin: 2 },
    { id: 'c12', nom: 'Famille Bertrand', type: 'Acheteur', budget: 2200000, etape: 'Qualifié', agent: 'a2', dernier: '2026-09-21', source: 'Salon immobilier', tel: '+33 6 50 77 66 55', email: 'bertrand.k@gmail.com', interet: 'p3', score: 68, quartiers: ['Mougins', 'Grasse'], types: ['Villa'], chambresMin: 4 },
  ];

  // Semaine du 21 au 27 septembre 2026
  const appointments = [
    { id: 'r1', date: '2026-09-26', heure: '09:00', duree: 60, type: 'Visite', bien: 'p1', client: 'c1', agent: 'a1', statut: 'Confirmé' },
    { id: 'r2', date: '2026-09-26', heure: '11:30', duree: 45, type: 'Estimation', bien: null, client: 'c8', agent: 'a2', statut: 'Confirmé', lieu: 'Villa, Mougins' },
    { id: 'r3', date: '2026-09-26', heure: '14:00', duree: 90, type: 'Signature', bien: 'p6', client: 'c5', agent: 'a1', statut: 'Confirmé', lieu: 'Étude notariale Lefèvre & Associés' },
    { id: 'r4', date: '2026-09-26', heure: '16:30', duree: 60, type: 'Visite', bien: 'p5', client: 'c4', agent: 'a3', statut: 'En attente' },
    { id: 'r5', date: '2026-09-26', heure: '18:00', duree: 30, type: 'Appel', bien: 'p2', client: 'c2', agent: 'a5', statut: 'Confirmé' },
    { id: 'r6', date: '2026-09-27', heure: '10:00', duree: 120, type: 'Shooting', bien: 'p11', client: null, agent: 'a3', statut: 'Confirmé' },
    { id: 'r7', date: '2026-09-27', heure: '15:00', duree: 60, type: 'Visite', bien: 'p12', client: 'c9', agent: 'a1', statut: 'Confirmé' },
    { id: 'r8', date: '2026-09-28', heure: '09:30', duree: 60, type: 'Visite', bien: 'p3', client: 'c12', agent: 'a2', statut: 'Confirmé' },
    { id: 'r9', date: '2026-09-28', heure: '11:00', duree: 45, type: 'Appel', bien: 'p10', client: 'c3', agent: 'a2', statut: 'En attente' },
    { id: 'r10', date: '2026-09-29', heure: '10:00', duree: 60, type: 'Visite', bien: 'p7', client: 'c7', agent: 'a4', statut: 'Confirmé' },
    { id: 'r11', date: '2026-09-29', heure: '14:30', duree: 90, type: 'Signature', bien: 'p8', client: 'c6', agent: 'a5', statut: 'Confirmé', lieu: 'Agence Cap d’Antibes' },
    { id: 'r12', date: '2026-09-30', heure: '09:00', duree: 60, type: 'Estimation', bien: null, client: 'c10', agent: 'a4', statut: 'Confirmé', lieu: 'Immeuble, Antibes' },
    { id: 'r13', date: '2026-10-01', heure: '11:00', duree: 60, type: 'Visite', bien: 'p9', client: 'c9', agent: 'a4', statut: 'Confirmé' },
    { id: 'r14', date: '2026-10-02', heure: '16:00', duree: 60, type: 'Visite', bien: 'p11', client: 'c11', agent: 'a3', statut: 'Confirmé' },
    { id: 'r15', date: '2026-09-24', heure: '10:00', duree: 60, type: 'Visite', bien: 'p1', client: 'c1', agent: 'a1', statut: 'Terminé' },
    { id: 'r16', date: '2026-09-23', heure: '15:00', duree: 60, type: 'Visite', bien: 'p2', client: 'c2', agent: 'a5', statut: 'Terminé' },
    { id: 'r17', date: '2026-09-22', heure: '09:00', duree: 45, type: 'Appel', bien: 'p8', client: 'c6', agent: 'a5', statut: 'Terminé' },
    { id: 'r18', date: '2026-09-25', heure: '17:00', duree: 60, type: 'Visite', bien: 'p12', client: 'c9', agent: 'a1', statut: 'Annulé' },
  ];

  const conversations = [
    { id: 'm1', client: 'c1', nonLus: 2, messages: [
      { de: 'client', texte: 'Bonjour Thomas, nous avons adoré la visite de la Villa Les Palmiers hier.', heure: '08:42' },
      { de: 'agent', texte: 'Bonjour Nicolas, ravi de l’entendre. Souhaitez-vous que je vous transmette le dossier technique complet ?', heure: '08:50' },
      { de: 'client', texte: 'Oui volontiers. Pouvons-nous aussi discuter d’une offre à 2,7 M€ ?', heure: '09:15' },
      { de: 'client', texte: 'Ma banque est prête à s’engager rapidement.', heure: '09:16' },
    ]},
    { id: 'm2', client: 'c2', nonLus: 1, messages: [
      { de: 'agent', texte: 'Bonsoir, le propriétaire a bien reçu votre offre pour le Penthouse Haussmann. Réponse attendue sous 48h.', heure: 'Hier 18:20' },
      { de: 'client', texte: 'Merci Camille, nous croisons les doigts.', heure: 'Hier 19:02' },
    ]},
    { id: 'm3', client: 'c4', nonLus: 0, messages: [
      { de: 'client', texte: 'Le rooftop est-il disponible pour une visite ce vendredi en fin de journée ?', heure: 'Hier 12:10' },
      { de: 'agent', texte: 'Tout à fait, je vous propose 16h30 pour profiter de la lumière du coucher de soleil.', heure: 'Hier 12:30' },
      { de: 'client', texte: 'Parfait, à vendredi.', heure: 'Hier 12:31' },
    ]},
    { id: 'm4', client: 'c6', nonLus: 3, messages: [
      { de: 'client', texte: 'Nous confirmons notre intérêt pour la Villa Port Grimaud pour notre résidence d’été.', heure: 'Mar. 10:05' },
      { de: 'client', texte: 'Le bail devra prévoir une clause de renouvellement automatique.', heure: 'Mar. 10:06' },
      { de: 'client', texte: 'Pouvez-vous nous envoyer un projet de bail ?', heure: 'Mar. 10:07' },
    ]},
    { id: 'm5', client: 'c9', nonLus: 0, messages: [
      { de: 'agent', texte: 'Bonjour, la visite de samedi est confirmée à 15h à la Villa Bois des Pins.', heure: 'Mer. 09:00' },
      { de: 'client', texte: 'Merci, nous serons là avec notre architecte.', heure: 'Mer. 09:40' },
    ]},
    { id: 'm6', client: 'c11', nonLus: 0, messages: [
      { de: 'client', texte: 'Je souhaite faire une offre pour le Loft Vieux-Nice à 3 000 €/mois.', heure: 'Lun. 16:45' },
      { de: 'agent', texte: 'Bien reçu Inès, je transmets au propriétaire et reviens vers vous.', heure: 'Lun. 17:00' },
    ]},
  ];

  const transactions = [
    { id: 't1', date: '2026-09-20', bien: 'p6', type: 'Vente', montant: 3950000, commission: 118500, agent: 'a1', statut: 'Encaissée', client: 'c5' },
    { id: 't2', date: '2026-09-14', bien: 'p8', type: 'Location', montant: 8900, commission: 8900, agent: 'a5', statut: 'Encaissée', client: 'c6' },
    { id: 't3', date: '2026-09-08', bien: 'p4', type: 'Location', montant: 6500, commission: 6500, agent: 'a3', statut: 'Encaissée', client: null },
    { id: 't4', date: '2026-08-28', bien: 'p9', type: 'Vente', montant: 710000, commission: 21300, agent: 'a4', statut: 'En attente', client: null },
    { id: 't5', date: '2026-08-19', bien: 'p2', type: 'Vente', montant: 1680000, commission: 50400, agent: 'a5', statut: 'Compromis', client: 'c2' },
    { id: 't6', date: '2026-08-11', bien: 'p11', type: 'Location', montant: 3200, commission: 3200, agent: 'a3', statut: 'Encaissée', client: null },
    { id: 't7', date: '2026-07-30', bien: 'p12', type: 'Vente', montant: 1520000, commission: 45600, agent: 'a1', statut: 'Encaissée', client: null },
    { id: 't8', date: '2026-07-22', bien: 'p7', type: 'Vente', montant: 980000, commission: 29400, agent: 'a4', statut: 'Encaissée', client: null },
    { id: 't9', date: '2026-07-05', bien: 'p5', type: 'Location', montant: 4800, commission: 4800, agent: 'a3', statut: 'Encaissée', client: null },
    { id: 't10', date: '2026-06-18', bien: 'p3', type: 'Vente', montant: 2050000, commission: 61500, agent: 'a2', statut: 'Encaissée', client: null },
  ];

  const notifications = [
    { id: 'n1', type: 'offre', titre: 'Nouvelle offre reçue', texte: 'Nicolas Bouchard propose 2,7 M€ pour Villa Les Palmiers', temps: 'il y a 12 min', lu: false },
    { id: 'n2', type: 'rdv', titre: 'Visite confirmée', texte: 'Dr. Léa Marchand — Rooftop La Croisette, 16:30', temps: 'il y a 1 h', lu: false },
    { id: 'n3', type: 'doc', titre: 'Document signé', texte: 'Mandat exclusif — Loft Vieux-Nice signé électroniquement', temps: 'il y a 3 h', lu: false },
    { id: 'n4', type: 'lead', titre: 'Nouveau contact', texte: 'Olivier Delage via LinkedIn — budget 2,5 M€', temps: 'il y a 5 h', lu: true },
    { id: 'n5', type: 'alerte', titre: 'Mandat expire bientôt', texte: 'Duplex Notre-Dame — mandat simple expire dans 9 jours', temps: 'Hier', lu: true },
  ];

  const activites = [
    { agent: 'a1', action: 'a conclu la vente de', cible: 'Palais des Palmes', temps: 'il y a 20 min', type: 'vente' },
    { agent: 'a3', action: 'a publié', cible: 'Loft Vieux-Nice', temps: 'il y a 2 h', type: 'bien' },
    { agent: 'a5', action: 'a transmis une offre pour', cible: 'Penthouse Haussmann', temps: 'il y a 4 h', type: 'offre' },
    { agent: 'a2', action: 'a planifié une estimation avec', cible: 'Hélène Dubosc', temps: 'il y a 6 h', type: 'rdv' },
    { agent: 'a4', action: 'a qualifié le contact', cible: 'Julien Berger', temps: 'Hier', type: 'lead' },
    { agent: 'a1', action: 'a baissé le prix de', cible: 'Villa Bois des Pins', temps: 'Hier', type: 'bien' },
    { agent: 'a3', action: 'a signé le bail de', cible: 'Maison de Verre', temps: 'Il y a 2 jours', type: 'vente' },
  ];

  // Chiffre d'affaires mensuel (commissions), 12 derniers mois — en k€
  const moisLabels = ['Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep'];
  const caVentes = [92, 114, 78, 61, 89, 126, 142, 131, 158, 123, 109, 187];      // k€
  const caLocations = [21, 24, 19, 22, 26, 28, 31, 34, 30, 36, 32, 39];          // k€
  const visitesSemaine = [4, 7, 5, 9, 6, 8, 3];
  const leadsSources = { 'Site web': 34, 'Recommandation': 28, 'Réseaux sociaux': 18, 'Salon': 11, 'Autre': 9 };
  const pipelineEtapes = ['Nouveau', 'Qualifié', 'Visite', 'Offre', 'Négociation', 'Signé'];
  /* Références de marché (€ / m²) : vente par quartier et type, location = loyer mensuel / m² (€) */
  const marcheM2 = { vente: { 'Cap d’Antibes': 5050, 'Nice · Carré d’Or': 6600, Mougins: 4700, 'Saint-Jean-Cap-Ferrat': 4900, Èze: 4200, Grasse: 4050, Valbonne: 3600, 'Cannes · La Californie': 3100, 'Port Grimaud': 3800 }, terrain: { 'Cap d’Antibes': 1350, 'Saint-Jean-Cap-Ferrat': 1200, Mougins: 950 }, location: { Valbonne: 19, 'Cannes · La Californie': 26, 'Port Grimaud': 21, 'Nice · Carré d’Or': 23, 'Cap d’Antibes': 28 } };
  const evolutionPrixM2 = [4100, 4180, 4150, 4220, 4310, 4360, 4420, 4490, 4470, 4550, 4620, 4710]; // € / m²


  /* ---------- Mandats (TODAY = 2026-09-26) ---------- */
  const mandats = [
    { id: 'md1', bien: 'p1', type: 'Exclusif', debut: '2026-09-02', fin: '2026-12-02', agent: 'a1', honoraires: 3, prixInitial: 2980000, proprietaire: { nom: 'Famille Reynaud', tel: '+33 6 61 40 12 88' },
      historiquePrix: [{ date: '2026-09-02', prix: 2980000 }, { date: '2026-09-18', prix: 2850000 }],
      documents: [{ nom: 'Mandat de vente exclusif', statut: 'Signé' }, { nom: 'Titre de propriété', statut: 'Reçu' }, { nom: 'Certificat de conformité', statut: 'Reçu' }, { nom: 'Diagnostic énergétique', statut: 'Manquant' }] },
    { id: 'md2', bien: 'p2', type: 'Exclusif', debut: '2026-08-21', fin: '2026-11-21', agent: 'a5', honoraires: 3, prixInitial: 1680000, proprietaire: { nom: 'M. Lefebvre', tel: '+33 6 50 22 71 09' },
      historiquePrix: [{ date: '2026-08-21', prix: 1680000 }],
      documents: [{ nom: 'Mandat de vente exclusif', statut: 'Signé' }, { nom: 'Titre de propriété', statut: 'Reçu' }, { nom: 'Règlement de copropriété', statut: 'Reçu' }, { nom: 'Procès-verbal AG', statut: 'À signer' }] },
    { id: 'md3', bien: 'p3', type: 'Simple', debut: '2026-07-10', fin: '2026-10-10', agent: 'a2', honoraires: 2.5, prixInitial: 2250000, proprietaire: { nom: 'SCI Les Terrasses de Provence', tel: '+33 6 70 10 55 60' },
      historiquePrix: [{ date: '2026-07-10', prix: 2250000 }, { date: '2026-09-10', prix: 2120000 }],
      documents: [{ nom: 'Mandat de vente simple', statut: 'Signé' }, { nom: 'Acte de propriété', statut: 'Reçu' }, { nom: 'Certificat d’urbanisme', statut: 'Reçu' }, { nom: 'Plan cadastral', statut: 'Manquant' }] },
    { id: 'md4', bien: 'p4', type: 'Simple', debut: '2026-09-15', fin: '2027-09-15', agent: 'a3', honoraires: 8, prixInitial: 6500, proprietaire: { nom: 'Mme Roussel', tel: '+33 6 61 89 03 14' },
      historiquePrix: [{ date: '2026-09-15', prix: 6500 }],
      documents: [{ nom: 'Mandat de gestion locative', statut: 'Signé' }, { nom: 'Titre de propriété', statut: 'Reçu' }, { nom: 'État des lieux d’entrée', statut: 'À signer' }] },
    { id: 'md5', bien: 'p5', type: 'Exclusif', debut: '2026-09-18', fin: '2027-03-18', agent: 'a3', honoraires: 8, prixInitial: 4800, proprietaire: { nom: 'M. et Mme Fabre', tel: '+33 6 50 67 21 40' },
      historiquePrix: [{ date: '2026-09-18', prix: 4800 }],
      documents: [{ nom: 'Mandat de location exclusif', statut: 'Signé' }, { nom: 'Titre de propriété', statut: 'Reçu' }, { nom: 'Attestation d’assurance', statut: 'Reçu' }] },
    { id: 'md6', bien: 'p6', type: 'Exclusif', debut: '2026-06-04', fin: '2026-12-04', agent: 'a1', honoraires: 3, prixInitial: 4100000, proprietaire: { nom: 'Succession Valentin', tel: '+33 6 61 33 90 12' },
      historiquePrix: [{ date: '2026-06-04', prix: 4100000 }, { date: '2026-07-20', prix: 3950000 }],
      documents: [{ nom: 'Mandat de vente exclusif', statut: 'Signé' }, { nom: 'Titre de propriété', statut: 'Reçu' }, { nom: 'Compromis de vente', statut: 'Signé' }, { nom: 'Acte définitif', statut: 'Signé' }] },
    { id: 'md7', bien: 'p7', type: 'Simple', debut: '2026-06-28', fin: '2026-09-28', agent: 'a4', honoraires: 2.5, prixInitial: 960000, proprietaire: { nom: 'M. Girard', tel: '+33 6 70 44 18 27' },
      historiquePrix: [{ date: '2026-06-28', prix: 960000 }],
      documents: [{ nom: 'Mandat de vente simple', statut: 'Signé' }, { nom: 'Titre de propriété', statut: 'Reçu' }, { nom: 'Certificat de conformité', statut: 'Manquant' }] },
    { id: 'md8', bien: 'p8', type: 'Exclusif', debut: '2026-07-12', fin: '2027-07-12', agent: 'a5', honoraires: 8, prixInitial: 8900, proprietaire: { nom: 'Mme Chevalier', tel: '+33 6 61 71 06 92' },
      historiquePrix: [{ date: '2026-07-12', prix: 8900 }],
      documents: [{ nom: 'Mandat de gestion locative', statut: 'Signé' }, { nom: 'Bail signé', statut: 'Signé' }, { nom: 'État des lieux d’entrée', statut: 'Signé' }] },
    { id: 'md9', bien: 'p9', type: 'Simple', debut: '2026-09-22', fin: '2026-12-22', agent: 'a4', honoraires: 2.5, prixInitial: 740000, proprietaire: { nom: 'M. Bonnet', tel: '+33 6 50 08 61 33' },
      historiquePrix: [{ date: '2026-09-22', prix: 740000 }],
      documents: [{ nom: 'Mandat de vente simple', statut: 'À signer' }, { nom: 'Titre de propriété', statut: 'Reçu' }, { nom: 'Règlement de copropriété', statut: 'Manquant' }] },
    { id: 'md10', bien: 'p10', type: 'Exclusif', debut: '2026-05-30', fin: '2026-10-04', agent: 'a2', honoraires: 3, prixInitial: 2050000, proprietaire: { nom: 'Groupe Riviera Capital', tel: '+33 6 70 92 10 05' },
      historiquePrix: [{ date: '2026-05-30', prix: 2050000 }, { date: '2026-08-30', prix: 1900000 }],
      documents: [{ nom: 'Mandat de vente exclusif', statut: 'Signé' }, { nom: 'Acte de propriété', statut: 'Reçu' }, { nom: 'Certificat d’urbanisme', statut: 'Reçu' }, { nom: 'Levée topographique', statut: 'Reçu' }] },
    { id: 'md11', bien: 'p11', type: 'Simple', debut: '2026-09-24', fin: '2027-03-24', agent: 'a3', honoraires: 8, prixInitial: 3200, proprietaire: { nom: 'M. Perrin', tel: '+33 6 61 15 78 44' },
      historiquePrix: [{ date: '2026-09-24', prix: 3200 }],
      documents: [{ nom: 'Mandat de location simple', statut: 'Signé' }, { nom: 'Titre de propriété', statut: 'À signer' }] },
    { id: 'md12', bien: 'p12', type: 'Simple', debut: '2026-06-12', fin: '2026-09-12', agent: 'a1', honoraires: 2.5, prixInitial: 1480000, proprietaire: { nom: 'Mme Delattre', tel: '+33 6 50 39 84 21' },
      historiquePrix: [{ date: '2026-06-12', prix: 1480000 }],
      documents: [{ nom: 'Mandat de vente simple', statut: 'Signé' }, { nom: 'Titre de propriété', statut: 'Reçu' }, { nom: 'Certificat de conformité', statut: 'Reçu' }] },
  ];


  /* ---------- Offres & négociations ---------- */
  const offres = [
    { id: 'o1', bien: 'p1', client: 'c1', agent: 'a1', montant: 2680000, date: '2026-09-19', validite: '2026-10-03', statut: 'Contre-proposition', financement: 'Mixte', conditions: 'Sous réserve d’accord de crédit (30 %)',
      historique: [{ date: '2026-09-19', auteur: 'Acheteur', montant: 2550000, note: 'Première offre après 2 visites' }, { date: '2026-09-21', auteur: 'Vendeur', montant: 2780000, note: 'Le propriétaire refuse de descendre sous 2,78 M€' }, { date: '2026-09-24', auteur: 'Acheteur', montant: 2680000, note: 'Effort acheteur, financement validé par la banque' }] },
    { id: 'o2', bien: 'p2', client: 'c2', agent: 'a5', montant: 1600000, date: '2026-09-15', validite: '2026-09-29', statut: 'En attente', financement: 'Crédit', conditions: 'Crédit en cours d’instruction',
      historique: [{ date: '2026-09-15', auteur: 'Acheteur', montant: 1600000, note: 'Offre écrite remise en agence' }] },
    { id: 'o3', bien: 'p10', client: 'c3', agent: 'a2', montant: 1750000, date: '2026-09-10', validite: '2026-10-10', statut: 'Contre-proposition', financement: 'Comptant', conditions: 'Achat via holding, délai de signature 45 jours',
      historique: [{ date: '2026-09-10', auteur: 'Acheteur', montant: 1650000, note: 'Offre initiale pour projet de résidence' }, { date: '2026-09-14', auteur: 'Vendeur', montant: 1850000, note: 'Contre-proposition du groupe propriétaire' }, { date: '2026-09-22', auteur: 'Acheteur', montant: 1750000, note: 'Position finale annoncée' }] },
    { id: 'o4', bien: 'p6', client: 'c3', agent: 'a1', montant: 3800000, date: '2026-06-20', validite: '2026-07-04', statut: 'Acceptée', financement: 'Comptant', conditions: 'Aucune',
      historique: [{ date: '2026-06-20', auteur: 'Acheteur', montant: 3650000, note: 'Offre comptant' }, { date: '2026-06-24', auteur: 'Vendeur', montant: 3850000, note: 'Contre-proposition' }, { date: '2026-06-28', auteur: 'Acheteur', montant: 3800000, note: 'Accord trouvé, compromis signé le 5 juillet' }] },
    { id: 'o5', bien: 'p3', client: 'c12', agent: 'a2', montant: 1950000, date: '2026-09-12', validite: '2026-09-26', statut: 'En attente', financement: 'Crédit', conditions: 'Vente du bien actuel des acquéreurs',
      historique: [{ date: '2026-09-12', auteur: 'Acheteur', montant: 1950000, note: 'Offre conditionnée à la revente de leur appartement' }] },
    { id: 'o6', bien: 'p3', client: 'c10', agent: 'a2', montant: 1850000, date: '2026-09-23', validite: '2026-10-07', statut: 'En attente', financement: 'Comptant', conditions: 'Aucune',
      historique: [{ date: '2026-09-23', auteur: 'Acheteur', montant: 1850000, note: 'Offre comptant, signature rapide possible' }] },
    { id: 'o7', bien: 'p12', client: 'c9', agent: 'a1', montant: 1320000, date: '2026-09-08', validite: '2026-09-22', statut: 'Refusée', financement: 'Crédit', conditions: 'Crédit à 70 %',
      historique: [{ date: '2026-09-08', auteur: 'Acheteur', montant: 1320000, note: 'Offre jugée trop basse' }, { date: '2026-09-11', auteur: 'Vendeur', montant: 1480000, note: 'Propriétaire ferme sur le prix affiché' }] },
    { id: 'o8', bien: 'p7', client: 'c7', agent: 'a4', montant: 880000, date: '2026-09-25', validite: '2026-10-09', statut: 'En attente', financement: 'Mixte', conditions: 'Apport 60 %, crédit 40 %',
      historique: [{ date: '2026-09-25', auteur: 'Acheteur', montant: 880000, note: 'Offre déposée après visite du 24/09' }] },
    { id: 'o9', bien: 'p1', client: 'c6', agent: 'a1', montant: 2400000, date: '2026-08-30', validite: '2026-09-13', statut: 'Retirée', financement: 'Comptant', conditions: 'Aucune',
      historique: [{ date: '2026-08-30', auteur: 'Acheteur', montant: 2400000, note: 'Offre exploratoire' }, { date: '2026-09-06', auteur: 'Acheteur', montant: 2400000, note: 'Offre retirée, changement de projet' }] },
    { id: 'o10', bien: 'p9', client: 'c7', agent: 'a4', montant: 660000, date: '2026-09-02', validite: '2026-09-16', statut: 'Expirée', financement: 'Crédit', conditions: 'Crédit à 50 %',
      historique: [{ date: '2026-09-02', auteur: 'Acheteur', montant: 660000, note: 'Offre sans suite du vendeur' }] },
  ];


  /* ---------- Tâches & rappels ---------- */
  const taches = [
    { id: 'k1', titre: 'Rappeler Nicolas Bouchard après la contre-proposition', type: 'Appel', priorite: 'Haute', echeance: '2026-09-26', heure: '10:30', agent: 'a1', client: 'c1', bien: 'p1', offre: 'o1', statut: 'À faire', rappel: 30, creee: '2026-09-24', note: 'Confirmer si 2,68 M€ est sa position finale avant retour au vendeur.' },
    { id: 'k2', titre: 'Envoyer le dossier technique du Penthouse Haussmann', type: 'Document', priorite: 'Moyenne', echeance: '2026-09-26', heure: '14:00', agent: 'a5', client: 'c2', bien: 'p2', statut: 'En cours', rappel: 60, creee: '2026-09-23', note: 'Plans, PV d’AG et diagnostics.' },
    { id: 'k3', titre: 'Relancer le propriétaire pour le diagnostic énergétique', type: 'Relance', priorite: 'Haute', echeance: '2026-09-25', heure: '16:00', agent: 'a1', bien: 'p1', mandat: 'md1', statut: 'À faire', rappel: 0, creee: '2026-09-18', note: 'Document manquant au mandat exclusif.' },
    { id: 'k4', titre: 'Préparer l’avenant de renouvellement du Duplex Notre-Dame', type: 'Administratif', priorite: 'Haute', echeance: '2026-09-27', heure: '09:00', agent: 'a4', bien: 'p7', mandat: 'md7', statut: 'À faire', rappel: 1440, creee: '2026-09-22', note: 'Mandat simple expirant le 28/09.' },
    { id: 'k5', titre: 'Shooting photo et vidéo drone — Maison de Verre', type: 'Marketing', priorite: 'Moyenne', echeance: '2026-09-29', heure: '08:30', agent: 'a3', bien: 'p4', statut: 'À faire', rappel: 1440, creee: '2026-09-20', note: 'Prestataire confirmé, prévoir accès jardin.' },
    { id: 'k6', titre: 'Qualifier le lead Julien Berger', type: 'Appel', priorite: 'Moyenne', echeance: '2026-09-26', heure: '17:30', agent: 'a4', client: 'c7', statut: 'À faire', rappel: 15, creee: '2026-09-25', note: 'Vérifier financement et délai de décision.' },
    { id: 'k7', titre: 'Envoyer le rapport propriétaire — Terrain Les Hauteurs', type: 'Document', priorite: 'Basse', echeance: '2026-09-30', agent: 'a2', bien: 'p10', mandat: 'md10', statut: 'À faire', rappel: 0, creee: '2026-09-21', note: 'Synthèse mensuelle : vues, visites, offres.' },
    { id: 'k8', titre: 'Faire signer le PV d’AG au syndic', type: 'Administratif', priorite: 'Moyenne', echeance: '2026-09-24', agent: 'a5', bien: 'p2', mandat: 'md2', statut: 'À faire', rappel: 0, creee: '2026-09-15', note: '' },
    { id: 'k9', titre: 'Relancer la Famille de Montclair pour la Villa Port Grimaud', type: 'Relance', priorite: 'Moyenne', echeance: '2026-09-28', heure: '11:00', agent: 'a5', client: 'c6', bien: 'p8', statut: 'À faire', rappel: 60, creee: '2026-09-22', note: 'Renouvellement du bail à discuter.' },
    { id: 'k10', titre: 'Publier le Loft Vieux-Nice sur les portails', type: 'Marketing', priorite: 'Basse', echeance: '2026-10-01', agent: 'a3', bien: 'p11', statut: 'À faire', rappel: 0, creee: '2026-09-24', note: '' },
    { id: 'k11', titre: 'Confirmer la visite du Rooftop La Croisette', type: 'Visite', priorite: 'Haute', echeance: '2026-09-26', heure: '15:30', agent: 'a3', client: 'c4', bien: 'p5', statut: 'Terminée', rappel: 30, creee: '2026-09-25', terminee: '2026-09-26', note: '' },
    { id: 'k12', titre: 'Rédiger le compromis — Palais des Palmes', type: 'Administratif', priorite: 'Haute', echeance: '2026-09-23', agent: 'a1', client: 'c3', bien: 'p6', offre: 'o4', statut: 'Terminée', rappel: 0, creee: '2026-09-15', terminee: '2026-09-22', note: 'Signé chez le notaire le 25/09.' },
    { id: 'k13', titre: 'Mettre à jour les photos de la Villa Bois des Pins', type: 'Marketing', priorite: 'Basse', echeance: '2026-09-22', agent: 'a1', bien: 'p12', statut: 'Terminée', rappel: 0, creee: '2026-09-12', terminee: '2026-09-21', note: '' },
    { id: 'k14', titre: 'Point hebdomadaire équipe — objectifs octobre', type: 'Administratif', priorite: 'Moyenne', echeance: '2026-09-28', heure: '09:00', agent: 'a1', statut: 'À faire', rappel: 60, creee: '2026-09-21', note: 'Salle de réunion, 45 min.' },
    { id: 'k15', titre: 'Appeler Inès Rambert pour sa décision sur le Loft', type: 'Appel', priorite: 'Haute', echeance: '2026-09-27', heure: '10:00', agent: 'a3', client: 'c11', bien: 'p11', statut: 'À faire', rappel: 30, creee: '2026-09-25', note: '' },
    { id: 'k16', titre: 'Contrôler les quittances de septembre — Villa Port Grimaud', type: 'Administratif', priorite: 'Basse', echeance: '2026-10-03', agent: 'a5', bien: 'p8', mandat: 'md8', statut: 'À faire', rappel: 0, creee: '2026-09-25', note: '' },
  ];


  /* ---------- Rapports propriétaires ---------- */
  const rapports = [
    { id: 'r1', mandat: 'md1', bien: 'p1', periode: '2026-09', genere: '2026-09-26', statut: 'Brouillon', envoye: null, consulte: null, canal: 'E-mail',
      stats: { vues: 2412, contacts: 31, visites: 6, favoris: 38, offres: 1 }, vuesSemaine: [480, 620, 710, 602],
      portails: [{ nom: 'Site Triade Concept Immo', vues: 1120, contacts: 14 }, { nom: 'SeLoger Premium', vues: 760, contacts: 11 }, { nom: 'Bien’ici', vues: 340, contacts: 4 }, { nom: 'Réseau international', vues: 192, contacts: 2 }],
      retours: [{ date: '2026-09-08', client: 'Nicolas Bouchard', avis: 'Positif', commentaire: 'Séduit par la vue et la piscine, s’interroge sur le prix.' }, { date: '2026-09-12', client: 'Hélène Dubosc', avis: 'Neutre', commentaire: 'Cherche plus proche des écoles internationales.' }, { date: '2026-09-19', client: 'Groupe Riviera Invest', avis: 'Négatif', commentaire: 'Trouve la surface habitable trop importante pour un investissement locatif.' }],
      actions: [{ date: '2026-09-03', label: 'Publication sur 4 portails et site agence' }, { date: '2026-09-06', label: 'Shooting photo professionnel et vidéo drone' }, { date: '2026-09-15', label: 'Mise en avant premium SeLoger (14 jours)' }, { date: '2026-09-18', label: 'Ajustement du prix : 2,98 → 2,85 M€' }],
      recommandation: 'Le nombre de vues est excellent mais le taux de transformation en visite reste sous la moyenne du quartier. Après l’ajustement du 18 septembre, nous recommandons de maintenir le prix pendant 3 semaines et de cibler les acheteurs internationaux via notre réseau.', ajustement: 0, commentaire: '' },
    { id: 'r2', mandat: 'md2', bien: 'p2', periode: '2026-08', genere: '2026-09-01', statut: 'Consulté', envoye: '2026-09-01', consulte: '2026-09-02', canal: 'E-mail',
      stats: { vues: 940, contacts: 12, visites: 3, favoris: 11, offres: 0 }, vuesSemaine: [180, 240, 260, 260],
      portails: [{ nom: 'Site Triade Concept Immo', vues: 420, contacts: 6 }, { nom: 'SeLoger Premium', vues: 330, contacts: 4 }, { nom: 'Bien’ici', vues: 190, contacts: 2 }],
      retours: [{ date: '2026-08-27', client: 'Amandine & Fabien Caron', avis: 'Positif', commentaire: 'Coup de cœur pour la terrasse, souhaitent revisiter avec les parents.' }],
      actions: [{ date: '2026-08-21', label: 'Mise en ligne de l’annonce' }, { date: '2026-08-24', label: 'Visite virtuelle 3D publiée' }],
      recommandation: 'Démarrage conforme aux attentes pour un penthouse de ce standing. Nous recommandons de poursuivre sans modification de prix.', ajustement: 0, commentaire: 'Premier rapport après 10 jours de commercialisation.' },
    { id: 'r3', mandat: 'md2', bien: 'p2', periode: '2026-09', genere: '2026-09-25', statut: 'Envoyé', envoye: '2026-09-25', consulte: null, canal: 'E-mail',
      stats: { vues: 1873, contacts: 24, visites: 5, favoris: 27, offres: 2 }, vuesSemaine: [380, 470, 520, 503],
      portails: [{ nom: 'Site Triade Concept Immo', vues: 820, contacts: 10 }, { nom: 'SeLoger Premium', vues: 640, contacts: 9 }, { nom: 'Bien’ici', vues: 413, contacts: 5 }],
      retours: [{ date: '2026-09-04', client: 'Amandine & Fabien Caron', avis: 'Positif', commentaire: 'Seconde visite, offre déposée le 20/09.' }, { date: '2026-09-16', client: 'Yannick Bertrand', avis: 'Positif', commentaire: 'Intéressé, attend la vente de son bien.' }],
      actions: [{ date: '2026-09-02', label: 'Relance des 14 contacts d’août' }, { date: '2026-09-20', label: 'Réception d’une offre à 1,6 M€' }, { date: '2026-09-23', label: 'Contre-proposition du vendeur à 1,64 M€' }],
      recommandation: 'Deux offres reçues ce mois : le bien est correctement positionné. Nous conseillons d’accepter une offre supérieure ou égale à 1,62 M€.', ajustement: 0, commentaire: '' },
    { id: 'r4', mandat: 'md3', bien: 'p3', periode: '2026-07', genere: '2026-08-01', statut: 'Consulté', envoye: '2026-08-01', consulte: '2026-08-05', canal: 'Lien sécurisé',
      stats: { vues: 610, contacts: 9, visites: 2, favoris: 8, offres: 0 }, vuesSemaine: [140, 160, 150, 160 ],
      portails: [{ nom: 'Site Triade Concept Immo', vues: 300, contacts: 5 }, { nom: 'SeLoger Premium', vues: 210, contacts: 3 }, { nom: 'Bien’ici', vues: 100, contacts: 1 }],
      retours: [{ date: '2026-07-22', client: 'Groupe Riviera Invest', avis: 'Neutre', commentaire: 'Rendement locatif jugé un peu faible au prix affiché.' }],
      actions: [{ date: '2026-07-10', label: 'Mise en ligne de l’annonce' }],
      recommandation: 'Premier mois de commercialisation. Le marché des villas familiales à Mougins est actif : nous conseillons d’attendre un mois complet avant tout ajustement.', ajustement: 0, commentaire: '' },
    { id: 'r5', mandat: 'md3', bien: 'p3', periode: '2026-08', genere: '2026-09-01', statut: 'Consulté', envoye: '2026-09-01', consulte: '2026-09-01', canal: 'E-mail',
      stats: { vues: 820, contacts: 10, visites: 3, favoris: 9, offres: 0 }, vuesSemaine: [200, 220, 190, 210],
      portails: [{ nom: 'Site Triade Concept Immo', vues: 380, contacts: 5 }, { nom: 'SeLoger Premium', vues: 300, contacts: 4 }, { nom: 'Bien’ici', vues: 140, contacts: 1 }],
      retours: [{ date: '2026-08-12', client: 'Sébastien Meunier', avis: 'Neutre', commentaire: 'Aime l’emplacement, hésite sur l’absence de balcon.' }, { date: '2026-08-26', client: 'Kevin Fernandez', avis: 'Négatif', commentaire: 'Prix jugé 10 % au-dessus du marché.' }],
      actions: [{ date: '2026-08-05', label: 'Nouvelles photos avec home staging virtuel' }, { date: '2026-08-15', label: 'Mise en avant premium (7 jours)' }],
      recommandation: 'Deux mois sans offre et des retours convergents sur le prix : nous recommandons un ajustement de 5 % pour relancer l’intérêt.', ajustement: -5, commentaire: 'Proposition d’ajustement à discuter avec le propriétaire.' },
    { id: 'r6', mandat: 'md6', bien: 'p6', periode: '2026-08', genere: '2026-09-01', statut: 'Consulté', envoye: '2026-09-01', consulte: '2026-09-03', canal: 'E-mail',
      stats: { vues: 2140, contacts: 28, visites: 7, favoris: 44, offres: 2 }, vuesSemaine: [500, 560, 540, 540],
      portails: [{ nom: 'Site Triade Concept Immo', vues: 980, contacts: 13 }, { nom: 'Réseau international', vues: 620, contacts: 9 }, { nom: 'SeLoger Premium', vues: 540, contacts: 6 }],
      retours: [{ date: '2026-08-08', client: 'Mathieu Servant', avis: 'Positif', commentaire: 'Très intéressé, offre déposée après la deuxième visite.' }, { date: '2026-08-19', client: 'Groupe Riviera Invest', avis: 'Positif', commentaire: 'Projet de résidence de prestige, offre en préparation.' }],
      actions: [{ date: '2026-08-02', label: 'Diffusion auprès de 3 partenaires internationaux' }, { date: '2026-08-22', label: 'Réception de deux offres' }],
      recommandation: 'Deux offres compétitives : nous recommandons d’accepter l’offre de 3,8 M€ au comptant.', ajustement: 0, commentaire: 'Vente conclue le 25/09.' },
    { id: 'r7', mandat: 'md7', bien: 'p7', periode: '2026-08', genere: '2026-09-02', statut: 'Envoyé', envoye: '2026-09-02', consulte: null, canal: 'E-mail',
      stats: { vues: 720, contacts: 8, visites: 2, favoris: 6, offres: 0 }, vuesSemaine: [190, 180, 170, 180],
      portails: [{ nom: 'Site Triade Concept Immo', vues: 340, contacts: 4 }, { nom: 'SeLoger Premium', vues: 260, contacts: 3 }, { nom: 'Bien’ici', vues: 120, contacts: 1 }],
      retours: [{ date: '2026-08-14', client: 'Laura Chevalier', avis: 'Neutre', commentaire: 'Trouve les travaux à prévoir trop importants.' }],
      actions: [{ date: '2026-08-10', label: 'Remise en avant de l’annonce' }],
      recommandation: 'Le mandat simple arrive à échéance le 28 septembre. Nous proposons de le renouveler en exclusivité, avec un plan marketing renforcé et un prix ajusté de 8 %.', ajustement: -8, commentaire: '' },
    { id: 'r8', mandat: 'md8', bien: 'p8', periode: '2026-08', genere: '2026-09-01', statut: 'Consulté', envoye: '2026-09-01', consulte: '2026-09-01', canal: 'Lien sécurisé',
      stats: { vues: 0, contacts: 0, visites: 0, favoris: 0, offres: 0 }, vuesSemaine: [0, 0, 0, 0],
      portails: [], retours: [], actions: [{ date: '2026-08-01', label: 'Encaissement du loyer d’août' }, { date: '2026-08-20', label: 'Intervention plomberie (pool-house) — 380 €' }],
      recommandation: 'Bien loué : rapport de gestion. Loyer perçu à échéance, aucun impayé. Renouvellement du bail à préparer pour juillet 2027.', ajustement: 0, commentaire: 'Rapport de gestion locative.' },
    { id: 'r9', mandat: 'md10', bien: 'p10', periode: '2026-08', genere: '2026-09-01', statut: 'Consulté', envoye: '2026-09-01', consulte: '2026-09-06', canal: 'E-mail',
      stats: { vues: 410, contacts: 5, visites: 1, favoris: 4, offres: 0 }, vuesSemaine: [110, 100, 100, 100],
      portails: [{ nom: 'Site Triade Concept Immo', vues: 210, contacts: 3 }, { nom: 'SeLoger Premium', vues: 200, contacts: 2 }],
      retours: [{ date: '2026-08-20', client: 'Groupe Riviera Invest', avis: 'Neutre', commentaire: 'Attend la validation du certificat d’urbanisme.' }],
      actions: [{ date: '2026-08-11', label: 'Diffusion auprès de 6 promoteurs' }],
      recommandation: 'Marché des terrains constructibles ralenti cet été. Le certificat d’urbanisme est l’élément déclencheur : nous relancerons les promoteurs dès sa réception.', ajustement: 0, commentaire: '' },
    { id: 'r10', mandat: 'md10', bien: 'p10', periode: '2026-09', genere: '2026-09-24', statut: 'Envoyé', envoye: '2026-09-24', consulte: null, canal: 'E-mail',
      stats: { vues: 530, contacts: 7, visites: 2, favoris: 5, offres: 0 }, vuesSemaine: [120, 130, 140, 140],
      portails: [{ nom: 'Site Triade Concept Immo', vues: 260, contacts: 4 }, { nom: 'SeLoger Premium', vues: 270, contacts: 3 }],
      retours: [{ date: '2026-09-10', client: 'Groupe Riviera Invest', avis: 'Positif', commentaire: 'Certificat reçu, étude de faisabilité en cours.' }],
      actions: [{ date: '2026-09-08', label: 'Réception du certificat d’urbanisme' }, { date: '2026-09-09', label: 'Relance des 6 promoteurs' }],
      recommandation: 'Le mandat expire le 4 octobre : nous recommandons un renouvellement de 6 mois pour laisser aboutir l’étude de Riviera Invest.', ajustement: 0, commentaire: '' },
    { id: 'r11', mandat: 'md12', bien: 'p12', periode: '2026-08', genere: '2026-09-01', statut: 'Consulté', envoye: '2026-09-01', consulte: '2026-09-04', canal: 'E-mail',
      stats: { vues: 640, contacts: 6, visites: 2, favoris: 7, offres: 0 }, vuesSemaine: [170, 160, 150, 160],
      portails: [{ nom: 'Site Triade Concept Immo', vues: 300, contacts: 3 }, { nom: 'SeLoger Premium', vues: 240, contacts: 2 }, { nom: 'Bien’ici', vues: 100, contacts: 1 }],
      retours: [{ date: '2026-08-18', client: 'Sébastien Meunier', avis: 'Neutre', commentaire: 'Aime le jardin, trouve la cuisine à moderniser.' }],
      actions: [{ date: '2026-08-06', label: 'Nouvelles photos du jardin' }],
      recommandation: 'Mandat expiré le 12 septembre. Nous recommandons un renouvellement en exclusivité avec mise à jour des photos et un prix aligné sur le marché de Grasse.', ajustement: -4, commentaire: '' },
  ];

  return { agents, properties, clients, appointments, conversations, transactions, notifications, activites, mandats, offres, taches, rapports,
    moisLabels, caVentes, caLocations, visitesSemaine, leadsSources, pipelineEtapes, evolutionPrixM2, marcheM2 };
})();
