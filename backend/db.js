const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'clubs.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const db = new DatabaseSync(dbPath);

// Enable WAL mode for high concurrency
db.exec('PRAGMA journal_mode = WAL;');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clubs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tracking_code TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'SOUMIS',
      admin_notes TEXT DEFAULT '',
      reviewed_at TEXT,
      reviewed_by TEXT,

      -- 1. Identité & Catégorisation
      official_name TEXT NOT NULL,
      acronym TEXT,
      slogan TEXT,
      typology TEXT NOT NULL,
      logo_url TEXT,

      -- 2. Bureau Exécutif & Membres Fondateurs
      president_name TEXT NOT NULL,
      president_filiere TEXT NOT NULL,
      president_email TEXT NOT NULL,
      president_phone TEXT NOT NULL,
      vp_name TEXT,
      vp_filiere TEXT,
      vp_contact TEXT,
      sg_name TEXT,
      sg_filiere TEXT,
      sg_contact TEXT,
      treasurer_name TEXT,
      treasurer_filiere TEXT,
      treasurer_contact TEXT,
      comm_lead_name TEXT,
      comm_lead_filiere TEXT,
      comm_lead_contact TEXT,
      additional_members TEXT DEFAULT '[]',
      faculty_advisor_name TEXT,
      advisor_agreement TEXT DEFAULT 'En attente',

      -- 3. Vision, Objectifs & Valeurs
      main_mission TEXT NOT NULL,
      measurable_objectives TEXT NOT NULL,
      campus_value_add TEXT NOT NULL,
      target_audience_type TEXT NOT NULL,
      target_audience_details TEXT,

      -- 4. Plan d'Action Annuel Prévisionnel
      event1_title TEXT,
      event1_description TEXT,
      event1_date TEXT,
      event1_logistics TEXT,
      event2_title TEXT,
      event2_description TEXT,
      event2_date TEXT,
      meeting_frequency TEXT,

      -- 5. Estimation Budgétaire & Ressources
      annual_budget_mad REAL DEFAULT 0,
      funding_sources TEXT DEFAULT '[]',
      facility_needs TEXT,

      -- 6. Engagement & Signature
      honor_declaration INTEGER NOT NULL DEFAULT 1,
      charter_agreement INTEGER NOT NULL DEFAULT 1,
      declarant_name TEXT NOT NULL,
      submission_date TEXT NOT NULL,

      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_clubs_tracking_code ON clubs(tracking_code);
    CREATE INDEX IF NOT EXISTS idx_clubs_status ON clubs(status);
    CREATE INDEX IF NOT EXISTS idx_clubs_typology ON clubs(typology);

    CREATE TABLE IF NOT EXISTS club_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      club_id INTEGER NOT NULL,
      full_name TEXT NOT NULL,
      filiere TEXT NOT NULL,
      academic_year TEXT NOT NULL,
      loisir TEXT NOT NULL DEFAULT '',
      competence TEXT NOT NULL DEFAULT '',
      project_idea TEXT DEFAULT '',
      email TEXT,
      phone TEXT,
      joined_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_club_members_club_id ON club_members(club_id);
  `);

  // Migration: add columns if table already existed without them
  try {
    db.exec(`
      ALTER TABLE club_members ADD COLUMN loisir TEXT NOT NULL DEFAULT '';
    `);
  } catch (e) {}
  try {
    db.exec(`
      ALTER TABLE club_members ADD COLUMN competence TEXT NOT NULL DEFAULT '';
    `);
  } catch (e) {}
  try {
    db.exec(`
      ALTER TABLE club_members ADD COLUMN project_idea TEXT DEFAULT '';
    `);
  } catch (e) {}

  // Seed sample members if empty and clubs exist
  const countMembers = db.prepare('SELECT COUNT(*) as count FROM club_members').get();
  if (countMembers.count === 0) {
    seedMembers();
  }

  // Seed sample data if empty
  const countRow = db.prepare('SELECT COUNT(*) as count FROM clubs').get();
  if (countRow.count === 0) {
    seedDatabase();
  }
}

function seedMembers() {
  const insertMember = db.prepare(`
    INSERT INTO club_members (club_id, full_name, filiere, academic_year, loisir, competence, project_idea, email, phone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Check if clubs 1 to 5 exist
  const clubs = db.prepare('SELECT id FROM clubs').all();
  if (clubs.length === 0) return;

  const sampleMembers = [
    { club_id: 1, full_name: 'Salma Berrada', filiere: 'UPSSA Santé', academic_year: '3ème année', loisir: 'Course à pied, basketball, randonnée', competence: 'Secourisme sportif & organisation de tournois', project_idea: 'Lancer un challenge de cross-training santé inter-promotions', email: 's.berrada@upssa.ac.ma', phone: '+212 6 11 22 33 44' },
    { club_id: 1, full_name: 'Youssef Kabbaj', filiere: 'UPSSA Santé', academic_year: '2ème année', loisir: 'Football universitaire, musculation', competence: 'Arbitrage officiel et échauffement musculaire adapté', project_idea: 'Créer une équipe permanente UPSSA pour le championnat universitaire', email: 'y.kabbaj@upssa.ac.ma', phone: '+212 6 22 33 44 55' },
    { club_id: 2, full_name: 'Lina Chraibi', filiere: 'UPSSA Santé', academic_year: '2ème année', loisir: 'Peinture acrylique, calligraphie, piano', competence: 'Conception graphique d affiches et scénographie', project_idea: 'Exposition vivante mêlant art floral et histoire de la pharmacopée', email: 'l.chraibi@upssa.ac.ma', phone: '+212 6 33 44 55 66' },
    { club_id: 2, full_name: 'Karim Naciri', filiere: 'UPSSA Santé', academic_year: '3ème année', loisir: 'Photographie argentique, théâtre d improvisation', competence: 'Captation vidéo HD et mise en scène', project_idea: 'Pièce de théâtre satirique sur la vie des internes en santé', email: 'k.naciri@upssa.ac.ma', phone: '+212 6 44 55 66 77' },
    { club_id: 3, full_name: 'Mehdi Benkirane', filiere: 'UPSSA Santé', academic_year: '4ème année', loisir: 'Lecture scientifique, échecs, vulgarisation', competence: 'Recherche bibliographique PubMed & analyse biostatistique', project_idea: 'Journal Club mensuel avec analyse critique d articles du Lancet et NEJM', email: 'm.benkirane@upssa.ac.ma', phone: '+212 6 55 66 77 88' },
    { club_id: 4, full_name: 'Anas Tazi', filiere: 'UPSSA Ingénierie', academic_year: '4ème année', loisir: 'Impression 3D, aéromodélisme, tech IoT', competence: 'Programmation Python, modélisation CAD SolidWorks et micro-contrôleurs', project_idea: 'Prototyper un stéthoscope électronique connecté avec analyse du signal sonore', email: 'a.tazi@upssa.ac.ma', phone: '+212 6 66 77 88 99' },
    { club_id: 5, full_name: 'Kenza Lahlou', filiere: 'UPSSA Business School', academic_year: '3ème année', loisir: 'Psychologie cognitive, méditation, podcasting', competence: 'Animation de cercles de parole et vulgarisation en neurosciences', project_idea: 'Campagne de sensibilisation à la santé mentale et ateliers de gestion du sommeil', email: 'k.lahlou@upssa.ac.ma', phone: '+212 6 77 88 99 00' }
  ];

  for (const m of sampleMembers) {
    const clubExists = db.prepare('SELECT id FROM clubs WHERE id = ?').get(m.club_id);
    if (clubExists) {
      insertMember.run(m.club_id, m.full_name, m.filiere, m.academic_year, m.loisir, m.competence, m.project_idea, m.email, m.phone);
    }
  }
}

function seedDatabase() {
  const insertStmt = db.prepare(`
    INSERT INTO clubs (
      tracking_code, status, admin_notes, reviewed_at, reviewed_by,
      official_name, acronym, slogan, typology, logo_url,
      president_name, president_filiere, president_email, president_phone,
      vp_name, vp_filiere, vp_contact,
      sg_name, sg_filiere, sg_contact,
      treasurer_name, treasurer_filiere, treasurer_contact,
      comm_lead_name, comm_lead_filiere, comm_lead_contact,
      additional_members, faculty_advisor_name, advisor_agreement,
      main_mission, measurable_objectives, campus_value_add,
      target_audience_type, target_audience_details,
      event1_title, event1_description, event1_date, event1_logistics,
      event2_title, event2_description, event2_date,
      meeting_frequency, annual_budget_mad, funding_sources, facility_needs,
      honor_declaration, charter_agreement, declarant_name, submission_date
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?
    )
  `);

  // 1. Club Sport (Approuvé)
  insertStmt.run(
    'CLUB-2026-SP01',
    'APPROUVE',
    'Dossier complet et d excellence approuvé par la commission des sports et de la vie étudiante.',
    '2026-10-10 11:00:00',
    'Commission Vie Étudiante & Sports',
    'Club Sport',
    'CSP',
    'Dépassement de soi, esprit d équipe et bien-être physique sur le campus.',
    'Sport & Bien-être',
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=400&q=80',
    'Youssef Mansouri',
    'Kinésithérapie - 3ème année',
    'y.mansouri@upssa.ac.ma',
    '+212 6 61 11 22 33',
    'Aya El Fassi',
    'Médecine Générale - 3ème année',
    'a.elfassi@upssa.ac.ma',
    'Karim Tazi',
    'Sciences Paramédicales - 2ème année',
    'k.tazi@upssa.ac.ma',
    'Salma Bennani',
    'Pharmacie - 2ème année',
    's.bennani@upssa.ac.ma',
    'Nizar Idrissi',
    'Génie Biomédical - 3ème année',
    'n.idrissi@upssa.ac.ma',
    JSON.stringify([
      { name: 'Mehdi Alami', filiere: 'Médecine 2A', role: 'Resp. Tournois Football', contact: 'm.alami@upssa.ac.ma' },
      { name: 'Lina Chraibi', filiere: 'Kinésithérapie 2A', role: 'Resp. Fitness & Yoga', contact: 'l.chraibi@upssa.ac.ma' }
    ]),
    'Dr. Loubna Agouzal',
    'Oui',
    'Promouvoir la pratique sportive régulière, encourager un mode de vie sain et actif, et renforcer la cohésion inter-filières au sein de l UPSSA.',
    '1. Organiser le Tournoi Universitaire Omnisports UPSSA (16 équipes participantes).\n2. Mettre en place 3 séances hebdomadaires de renforcement musculaire et yoga.\n3. Fédérer au moins 200 étudiants réguliers sur l année.',
    'Favorise l équilibre physique et psychologique indispensable aux étudiants en santé à travers le sport.',
    'Ouvert à toute l université',
    '',
    'Tournoi Universitaire Omnisports UPSSA',
    'Grand tournoi inter-facultés (Football, Basketball, Volleyball et Tennis de table) sur deux week-ends.',
    '2026-11-22',
    'Terrains omnisports UPSSA, ballons, chasubles, arbitrage officiel, trousse de secours médical.',
    'Journée Campus Santé & Course Solidaire',
    'Course à pied solidaire de 5 km ouverte aux étudiants, enseignants et personnel.',
    '2027-03-14',
    'Hebdomadaire',
    28000,
    JSON.stringify(['Cotisations des membres', 'Sponsoring / Partenariats externes', 'Subvention demandée à l université']),
    'Accès prioritaire aux installations sportives du campus et local de rangement pour le matériel sportif.',
    1, 1, 'Youssef Mansouri', '2026-10-05'
  );

  // 2. Club Artistique (Approuvé)
  insertStmt.run(
    'CLUB-2026-AR02',
    'APPROUVE',
    'Programme culturel remarquable. Dossier validé avec félicitations du jury.',
    '2026-10-12 14:30:00',
    'Commission Affaires Culturelles',
    'Club Artistique',
    'CART',
    'L art et la créativité pour sublimer l expérience universitaire et l épanouissement personnel.',
    'Culturel & Artistique',
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=400&q=80',
    'Sofia Senoussi',
    'Médecine Dentaire - 3ème année',
    's.senoussi@upssa.ac.ma',
    '+212 6 62 33 44 55',
    'Amine Laraqui',
    'Pharmacie - 3ème année',
    'a.laraqui@upssa.ac.ma',
    'Kenza Berrada',
    'Communication & Santé - Master 1',
    'k.berrada@upssa.ac.ma',
    'Omar Naciri',
    'Médecine Générale - 2ème année',
    'o.naciri@upssa.ac.ma',
    'Rita Filali',
    'Design & Médias - 2ème année',
    'r.filali@upssa.ac.ma',
    JSON.stringify([
      { name: 'Hamza Kabbaj', filiere: 'Médecine 3A', role: 'Resp. Atelier Peinture & Dessin', contact: 'h.kabbaj@upssa.ac.ma' },
      { name: 'Yasmine Tahiri', filiere: 'Pharmacie 2A', role: 'Resp. Troupe Théâtrale', contact: 'y.tahiri@upssa.ac.ma' }
    ]),
    'Dr. Loubna Agouzal',
    'Oui',
    'Fédérer et valoriser les talents artistiques de l université dans les domaines de la peinture, de la photographie, du théâtre et de la musique.',
    '1. Réaliser une grande exposition d art contemporain au hall central de l université.\n2. Organiser une soirée des talents et spectacle vivant (250+ spectateurs).\n3. Animer des ateliers d art-thérapie pour la gestion du stress pré-examens.',
    'Enrichit la vie culturelle du campus et offre un espace d épanouissement personnel et d art-thérapie aux étudiants.',
    'Ouvert à toute l université',
    '',
    'Festival des Arts & Nuit des Talents UPSSA',
    'Grande soirée pluridisciplinaire : exposition de peinture et photographie, récital musical et sketchs théâtraux.',
    '2026-12-19',
    'Auditorium UPSSA, cimaises d exposition, éclairage scénique tamisé, sono professionnelle.',
    'Ateliers d Art-Thérapie & Peinture Intuitive',
    'Sessions de relaxation par la création artistique ouvertes à tous les étudiants.',
    '2027-04-10',
    'Bimensuel',
    22000,
    JSON.stringify(['Cotisations des membres', 'Ventes / Activités d autofinancement', 'Subvention demandée à l université']),
    'Salle polyvalente avec éclairage naturel pour les ateliers de dessin/peinture et stockage sécurisé des toiles.',
    1, 1, 'Sofia Senoussi', '2026-10-08'
  );

  // 3. Club Scientifique (Approuvé)
  insertStmt.run(
    'CLUB-2026-SC03',
    'APPROUVE',
    'Excellent alignement avec les priorités académiques et la recherche médicale de l UPSSA.',
    '2026-10-18 16:00:00',
    'Commission Scientifique & Vie Étudiante',
    'Club Scientifique',
    'CSCI',
    'Rigueur, découverte et partage de l excellence du savoir médical et biomédical.',
    'Académique / Scientifique & Médical',
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=400&q=80',
    'Yassine El Mansouri',
    'Médecine Générale - 4ème année',
    'yassine.elmansouri@upssa.ac.ma',
    '+212 6 61 72 83 94',
    'Hiba Zniber',
    'Pharmacie - 3ème année',
    'h.zniber@upssa.ac.ma',
    'Omar Bennani',
    'Sciences Infirmières & Santé - 3ème année',
    'o.bennani@upssa.ac.ma',
    'Kenza Tazi',
    'Génie Biomédical - Master 1',
    'k.tazi@upssa.ac.ma',
    'Amine Cherkaoui',
    'Communication Médicale & Santé Digitale',
    'a.cherkaoui@upssa.ac.ma',
    JSON.stringify([
      { name: 'Nour Idrissi', filiere: 'Médecine 2A', role: 'Resp. Veille & Journal Club', contact: 'n.idrissi@upssa.ac.ma' },
      { name: 'Driss Lahlou', filiere: 'Kinésithérapie 3A', role: 'Logistique Conférences', contact: 'd.lahlou@upssa.ac.ma' }
    ]),
    'Dr. Loubna Agouzal',
    'Oui',
    'Stimuler la culture scientifique, initier les étudiants à la recherche médicale, décrypter les publications internationales et organiser des conférences scientifiques de pointe.',
    '1. Publier 8 revues bibliographiques médicales étudiantes.\n2. Organiser 4 conférences thématiques avec des professeurs et chercheurs invités.\n3. Encadrer 30 étudiants dans la rédaction de leurs premiers abstracts scientifiques.',
    'Développe l esprit critique médical, la maîtrise de l Evidence-Based Medicine et la vocation de recherche chez les étudiants.',
    'Ouvert à toute l université',
    '',
    'Colloque Annuel des Jeunes Chercheurs en Santé',
    'Journée d étude avec présentations orales d étudiants, posters scientifiques et tables rondes avec des experts hospitalo-universitaires.',
    '2026-12-08',
    'Amphithéâtre Pasteur, panneaux pour posters scientifiques A0, micros sans fil, captation vidéo.',
    'Ateliers Pratiques d Écriture Scientifique & PubMed',
    'Formation méthodologique à la recherche bibliographique et à la publication médicale.',
    '2027-02-18',
    'Bimensuel',
    30000,
    JSON.stringify(['Cotisations des membres', 'Sponsoring / Partenariats externes', 'Subvention demandée à l université']),
    'Amphithéâtre pour les conférences et accès aux salles informatiques pour les sessions bibliographiques.',
    1, 1, 'Yassine El Mansouri', '2026-10-12'
  );

  // 4. Club Science et Innovation (Approuvé)
  insertStmt.run(
    'CLUB-2026-IN04',
    'APPROUVE',
    'Projet hautement innovant à fort potentiel technologique et médical. Félicitations.',
    '2026-10-22 09:30:00',
    'Commission Innovation & Partenariats',
    'Club Science et Innovation',
    'CSI',
    'Bâtir l avenir des technologies de santé par l innovation, l IA et l intelligence collective.',
    'Entrepreneuriat, Débat & Innovation',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=400&q=80',
    'Mehdi El Alami',
    'Génie Biomédical & IA Santé - 4ème année',
    'm.elalami@upssa.ac.ma',
    '+212 6 70 80 90 10',
    'Salma Chraibi',
    'Technologies Médicales - 3ème année',
    's.chraibi@upssa.ac.ma',
    'Amine Tazi',
    'Informatique & Santé Digitale - 3ème année',
    'a.tazi@upssa.ac.ma',
    'Noura Berrada',
    'Management de la Santé - Master 1',
    'n.berrada@upssa.ac.ma',
    'Youssef Kabbaj',
    'Design & Prototypage 3D - 2ème année',
    'y.kabbaj@upssa.ac.ma',
    JSON.stringify([
      { name: 'Kenza Zaki', filiere: 'Génie Biomédical 3A', role: 'Resp. FabLab & Impression 3D', contact: 'k.zaki@upssa.ac.ma' },
      { name: 'Omar Mansouri', filiere: 'Génie Informatique 2A', role: 'Développeur IoT Médical', contact: 'o.mansouri@upssa.ac.ma' }
    ]),
    'Dr. Loubna Agouzal',
    'Oui',
    'Favoriser l émergence de solutions technologiques innovantes appliquées à la santé : impression 3D prothétique, capteurs IoT médicaux, télémédecine et intelligence artificielle diagnostique.',
    '1. Prototyper 3 dispositifs médicaux fonctionnels en open-source au FabLab.\n2. Organiser le Hackathon HealthTech UPSSA (48h de challenge, 100 participants).\n3. Accompagner 2 projets étudiants vers l incubation de startup.',
    'Positionne l UPSSA comme pôle d excellence en innovation technologique et entrepreneuriale dans la santé.',
    'Ouvert à toute l université',
    '',
    'Hackathon UPSSA HealthTech & MedTech Challenge',
    'Compétition de 48 heures de prototypage rapide combinant médecine, ingénierie biomédicale et intelligence artificielle.',
    '2026-11-28',
    'FabLab UPSSA, imprimantes 3D, kits micro-contrôleurs Arduino/ESP32, réseau haut débit dédié, espace repos.',
    'Journée Démonstration & Pitch Santé Numérique',
    'Présentation devant des investisseurs et partenaires hospitaliers des meilleurs prototypes.',
    '2027-03-25',
    'Hebdomadaire',
    35000,
    JSON.stringify(['Sponsoring / Partenariats externes', 'Subvention demandée à l université', 'Cotisations des membres']),
    'Accès régulier au FabLab universitaire et armoire sécurisée pour les équipements de prototypage et composants électroniques.',
    1, 1, 'Mehdi El Alami', '2026-10-15'
  );

  // 5. Club Synapse (Approuvé)
  insertStmt.run(
    'CLUB-2026-SY05',
    'APPROUVE',
    'Initiative remarquable dédiée aux neurosciences, à la santé cognitive et à l échange interdisciplinaire.',
    '2026-10-25 15:45:00',
    'Commission Vie Étudiante & Médicale',
    'Club Synapse',
    'SYNAPSE',
    'Créer des connexions, explorer l esprit et rapprocher les disciplines médicales.',
    'Académique / Scientifique & Médical',
    'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=400&q=80',
    'Zineb Laraqui',
    'Médecine Générale (Neurologie) - 4ème année',
    'z.laraqui@upssa.ac.ma',
    '+212 6 63 99 88 77',
    'Tariq Filali',
    'Pharmacie & Neuropharmacologie - 3ème année',
    't.filali@upssa.ac.ma',
    'Meriem Saadi',
    'Psychologie Clinique & Santé Mentale - Master 1',
    'm.saadi@upssa.ac.ma',
    'Ilyas Benmoussa',
    'Kinésithérapie & Rééducation Neurologique - 3A',
    'i.benmoussa@upssa.ac.ma',
    'Reda Idrissi',
    'Sciences de la Santé - 2ème année',
    'r.idrissi@upssa.ac.ma',
    JSON.stringify([
      { name: 'Ghita Chami', filiere: 'Médecine 3A', role: 'Resp. Ateliers Neuro-Anatomie', contact: 'g.chami@upssa.ac.ma' },
      { name: 'Anas Tazi', filiere: 'Pharmacie 3A', role: 'Resp. Conférences Neurosciences', contact: 'a.tazi@upssa.ac.ma' }
    ]),
    'Dr. Loubna Agouzal',
    'Oui',
    'Explorer les neurosciences cliniques, sensibiliser la communauté à la santé mentale et aux pathologies neuro-dégénératives, et décloisonner les spécialités médicales et paramédicales.',
    '1. Organiser la Semaine du Cerveau UPSSA (conférences, ateliers interactifs de neuro-anatomie).\n2. Lancer une campagne de sensibilisation et déstigmatisation de la santé mentale chez les étudiants.\n3. Animer 6 sessions cliniques d analyse de cas neurologiques complexes.',
    'Sensibilisation essentielle au bien-être psychologique des soignants et renforcement de l expertise en neurosciences.',
    'Ouvert à toute l université',
    '',
    'Semaine UPSSA du Cerveau & des Neurosciences',
    'Cycle de conférences interactives, ateliers pratiques de modélisation cérébrale 3D et sessions d échanges sur la santé mentale.',
    '2026-12-14',
    'Grand Hall UPSSA et Salle de conférence, modèles anatomiques du cerveau, casques VR pour exploration neuronale, vidéoprojecteur HD.',
    'Colloque Santé Mentale & Prévention du Burnout Médical',
    'Journée d échange et tables rondes avec des psychiatres et psychologues spécialistes.',
    '2027-04-05',
    'Bimensuel',
    26000,
    JSON.stringify(['Cotisations des membres', 'Sponsoring / Partenariats externes', 'Subvention demandée à l université']),
    'Salle polyvalente avec équipement audiovisuel pour les réunions et stockage du matériel didactique de simulation.',
    1, 1, 'Zineb Laraqui', '2026-10-20'
  );
}

module.exports = {
  db,
  initDatabase,
  seedDatabase
};
