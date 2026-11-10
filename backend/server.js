const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { db, initDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize SQLite database
initDatabase();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Upload directory setup (persistent volume support if /data exists)
let defaultUploads = path.join(__dirname, 'uploads');
if (fs.existsSync('/data') && fs.statSync('/data').isDirectory()) {
  defaultUploads = '/data/uploads';
}
const uploadsDir = process.env.UPLOADS_DIR || defaultUploads;
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'club-logo-' + uniqueSuffix + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées (JPG, PNG, WebP, SVG).'));
    }
  }
});

// Helper to generate tracking code
function generateTrackingCode() {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let random = '';
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CLUB-${year}-${random}`;
}

// ----------------- API ROUTES -----------------

// 1. Upload Club Logo
app.post('/api/upload', upload.single('logo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier téléchargé.' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, url: fileUrl, filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Submit New Club Application
app.post('/api/clubs', (req, res) => {
  try {
    const b = req.body;

    // Basic validation
    if (!b.official_name || !b.typology || !b.president_name || !b.president_email || !b.main_mission) {
      return res.status(400).json({
        error: 'Veuillez remplir tous les champs obligatoires (Nom officiel, Typologie, Président, Mission).'
      });
    }

    let trackingCode = generateTrackingCode();
    // Ensure uniqueness
    let exists = db.prepare('SELECT id FROM clubs WHERE tracking_code = ?').get(trackingCode);
    while (exists) {
      trackingCode = generateTrackingCode();
      exists = db.prepare('SELECT id FROM clubs WHERE tracking_code = ?').get(trackingCode);
    }

    const fundingSourcesStr = typeof b.funding_sources === 'object'
      ? JSON.stringify(b.funding_sources)
      : (b.funding_sources || '[]');

    const additionalMembersStr = typeof b.additional_members === 'object'
      ? JSON.stringify(b.additional_members)
      : (b.additional_members || '[]');

    const submissionDate = b.submission_date || new Date().toISOString().slice(0, 10);

    const stmt = db.prepare(`
      INSERT INTO clubs (
        tracking_code, status, admin_notes,
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
        ?, 'SOUMIS', '',
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

    const result = stmt.run(
      trackingCode,
      b.official_name,
      b.acronym || '',
      b.slogan || '',
      b.typology,
      b.logo_url || '',
      b.president_name,
      b.president_filiere || '',
      b.president_email,
      b.president_phone || '',
      b.vp_name || '',
      b.vp_filiere || '',
      b.vp_contact || '',
      b.sg_name || '',
      b.sg_filiere || '',
      b.sg_contact || '',
      b.treasurer_name || '',
      b.treasurer_filiere || '',
      b.treasurer_contact || '',
      b.comm_lead_name || '',
      b.comm_lead_filiere || '',
      b.comm_lead_contact || '',
      additionalMembersStr,
      b.faculty_advisor_name || '',
      b.advisor_agreement || 'En attente',
      b.main_mission,
      b.measurable_objectives || '',
      b.campus_value_add || '',
      b.target_audience_type || 'Ouvert à toute l\'université',
      b.target_audience_details || '',
      b.event1_title || '',
      b.event1_description || '',
      b.event1_date || '',
      b.event1_logistics || '',
      b.event2_title || '',
      b.event2_description || '',
      b.event2_date || '',
      b.meeting_frequency || 'Bimensuel',
      parseFloat(b.annual_budget_mad) || 0,
      fundingSourcesStr,
      b.facility_needs || '',
      b.honor_declaration ? 1 : 0,
      b.charter_agreement ? 1 : 0,
      b.declarant_name || b.president_name,
      submissionDate
    );

    try { db.exec('PRAGMA wal_checkpoint(PASSIVE);'); } catch (e) {}

    const inserted = db.prepare('SELECT * FROM clubs WHERE id = ?').get(result.lastInsertRowid);
    inserted.funding_sources = JSON.parse(inserted.funding_sources || '[]');
    inserted.additional_members = JSON.parse(inserted.additional_members || '[]');

    res.status(201).json({
      success: true,
      message: 'Demande de création de club enregistrée avec succès.',
      tracking_code: trackingCode,
      club: inserted
    });
  } catch (err) {
    console.error('Error submitting club:', err);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement : ' + err.message });
  }
});

// 3. List Clubs with Filters & Search
app.get('/api/clubs', (req, res) => {
  try {
    const { status, typology, q } = req.query;
    let query = `
      SELECT clubs.*, COALESCE(m.members_count, 0) as members_count
      FROM clubs
      LEFT JOIN (
        SELECT club_id, COUNT(*) as members_count FROM club_members GROUP BY club_id
      ) m ON m.club_id = clubs.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'ALL') {
      query += ' AND status = ?';
      params.push(status);
    }
    if (typology && typology !== 'ALL') {
      query += ' AND typology = ?';
      params.push(typology);
    }
    if (q && q.trim()) {
      query += ' AND (official_name LIKE ? OR acronym LIKE ? OR president_name LIKE ? OR tracking_code LIKE ?)';
      const term = `%${q.trim()}%`;
      params.push(term, term, term, term);
    }

    query += ' ORDER BY created_at DESC';
    const rows = db.prepare(query).all(...params);

    const clubs = rows.map(r => ({
      ...r,
      funding_sources: JSON.parse(r.funding_sources || '[]'),
      additional_members: JSON.parse(r.additional_members || '[]')
    }));

    res.json(clubs);
  } catch (err) {
    console.error('Error fetching clubs:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Track Application by Tracking Code
app.get('/api/clubs/track/:code', (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const club = db.prepare('SELECT * FROM clubs WHERE UPPER(tracking_code) = ?').get(code);
    if (!club) {
      return res.status(404).json({ error: 'Aucun dossier trouvé avec ce code de suivi.' });
    }
    club.funding_sources = JSON.parse(club.funding_sources || '[]');
    club.additional_members = JSON.parse(club.additional_members || '[]');
    res.json(club);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Get Club by ID or Tracking Code
app.get('/api/clubs/:id', (req, res) => {
  try {
    const rawParam = req.params.id;
    const numId = parseInt(rawParam, 10);
    const idToMatch = isNaN(numId) ? -1 : numId;
    const club = db.prepare(`
      SELECT clubs.*, COALESCE(m.members_count, 0) as members_count
      FROM clubs
      LEFT JOIN (
        SELECT club_id, COUNT(*) as members_count FROM club_members GROUP BY club_id
      ) m ON m.club_id = clubs.id
      WHERE clubs.id = ? OR UPPER(clubs.tracking_code) = UPPER(?)
    `).get(idToMatch, rawParam);
    if (!club) {
      return res.status(404).json({ error: 'Club introuvable.' });
    }
    club.funding_sources = JSON.parse(club.funding_sources || '[]');
    club.additional_members = JSON.parse(club.additional_members || '[]');
    club.members = db.prepare('SELECT * FROM club_members WHERE club_id = ? ORDER BY joined_at DESC').all(club.id);
    res.json(club);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5b. Add Club Member (Student Join Registration)
app.post('/api/clubs/:id/members', (req, res) => {
  try {
    const rawParam = req.params.id;
    const numId = parseInt(rawParam, 10);
    const idToMatch = isNaN(numId) ? -1 : numId;
    const club = db.prepare('SELECT id, official_name, acronym FROM clubs WHERE id = ? OR UPPER(tracking_code) = UPPER(?)').get(idToMatch, rawParam);
    if (!club) {
      return res.status(404).json({ error: 'Club introuvable.' });
    }

    const { full_name, filiere, academic_year, loisir, competence, project_idea, email, phone } = req.body;
    if (!full_name || !filiere || !academic_year || !loisir || !competence) {
      return res.status(400).json({
        error: 'Veuillez renseigner tous les champs obligatoires (Nom et prénom, Filière, Année scolaire, Loisir, Compétence).'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO club_members (club_id, full_name, filiere, academic_year, loisir, competence, project_idea, hobbies_skills, email, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const combined = `${loisir.trim()} | ${competence.trim()}`;

    const result = stmt.run(
      club.id,
      full_name.trim(),
      filiere.trim(),
      academic_year.trim(),
      loisir.trim(),
      competence.trim(),
      (project_idea || '').trim(),
      combined,
      email ? email.trim() : null,
      phone ? phone.trim() : null
    );

    try { db.exec('PRAGMA wal_checkpoint(PASSIVE);'); } catch (e) {}

    const member = db.prepare('SELECT * FROM club_members WHERE id = ?').get(result.lastInsertRowid);
    const totalMembers = db.prepare('SELECT COUNT(*) as count FROM club_members WHERE club_id = ?').get(club.id).count;

    res.status(201).json({
      success: true,
      message: `Félicitations ${member.full_name}, vous avez rejoint le club « ${club.official_name} » avec succès !`,
      member,
      total_members: totalMembers
    });
  } catch (err) {
    console.error('Error adding member:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5c. List Club Members
app.get('/api/clubs/:id/members', (req, res) => {
  try {
    const rawParam = req.params.id;
    const numId = parseInt(rawParam, 10);
    const idToMatch = isNaN(numId) ? -1 : numId;
    const club = db.prepare('SELECT id FROM clubs WHERE id = ? OR UPPER(tracking_code) = UPPER(?)').get(idToMatch, rawParam);
    if (!club) {
      return res.json([]);
    }
    const members = db.prepare('SELECT * FROM club_members WHERE club_id = ? ORDER BY joined_at DESC').all(club.id);
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Update Club Status & Validation Notes
app.patch('/api/clubs/:id/status', (req, res) => {
  try {
    const rawParam = req.params.id;
    const numId = parseInt(rawParam, 10);
    const idToMatch = isNaN(numId) ? -1 : numId;
    const { status, admin_notes, reviewed_by } = req.body;

    const validStatuses = ['SOUMIS', 'EN_COURS_DE_REVUE', 'APPROUVE', 'REFUSE', 'RETOUCHE_DEMANDEE'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Statut invalide.' });
    }

    const reviewedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const stmt = db.prepare(`
      UPDATE clubs
      SET status = ?, admin_notes = ?, reviewed_at = ?, reviewed_by = ?, updated_at = datetime('now')
      WHERE id = ? OR UPPER(tracking_code) = UPPER(?)
    `);

    const result = stmt.run(status, admin_notes || '', reviewedAt, reviewed_by || 'Commission Vie Étudiante', idToMatch, rawParam);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Dossier introuvable.' });
    }

    try { db.exec('PRAGMA wal_checkpoint(PASSIVE);'); } catch (e) {}

    const updated = db.prepare('SELECT * FROM clubs WHERE id = ? OR UPPER(tracking_code) = UPPER(?)').get(idToMatch, rawParam);
    updated.funding_sources = JSON.parse(updated.funding_sources || '[]');
    updated.additional_members = JSON.parse(updated.additional_members || '[]');

    res.json({
      success: true,
      message: 'Statut du club mis à jour avec succès.',
      club: updated
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6b. Update Full Club Information
app.put('/api/clubs/:id', (req, res) => {
  try {
    const rawParam = req.params.id;
    const numId = parseInt(rawParam, 10);
    const idToMatch = isNaN(numId) ? -1 : numId;
    const existing = db.prepare('SELECT * FROM clubs WHERE id = ? OR UPPER(tracking_code) = UPPER(?)').get(idToMatch, rawParam);
    if (!existing) {
      return res.status(404).json({ error: 'Club introuvable.' });
    }

    const b = req.body;
    const fundingSourcesStr = typeof b.funding_sources === 'object'
      ? JSON.stringify(b.funding_sources)
      : (b.funding_sources !== undefined ? b.funding_sources : existing.funding_sources);

    const additionalMembersStr = typeof b.additional_members === 'object'
      ? JSON.stringify(b.additional_members)
      : (b.additional_members !== undefined ? b.additional_members : existing.additional_members);

    const stmt = db.prepare(`
      UPDATE clubs SET
        official_name = COALESCE(?, official_name),
        acronym = COALESCE(?, acronym),
        slogan = COALESCE(?, slogan),
        typology = COALESCE(?, typology),
        logo_url = COALESCE(?, logo_url),
        president_name = COALESCE(?, president_name),
        president_filiere = COALESCE(?, president_filiere),
        president_email = COALESCE(?, president_email),
        president_phone = COALESCE(?, president_phone),
        vp_name = COALESCE(?, vp_name),
        vp_filiere = COALESCE(?, vp_filiere),
        vp_contact = COALESCE(?, vp_contact),
        sg_name = COALESCE(?, sg_name),
        sg_filiere = COALESCE(?, sg_filiere),
        sg_contact = COALESCE(?, sg_contact),
        treasurer_name = COALESCE(?, treasurer_name),
        treasurer_filiere = COALESCE(?, treasurer_filiere),
        treasurer_contact = COALESCE(?, treasurer_contact),
        comm_lead_name = COALESCE(?, comm_lead_name),
        comm_lead_filiere = COALESCE(?, comm_lead_filiere),
        comm_lead_contact = COALESCE(?, comm_lead_contact),
        additional_members = ?,
        faculty_advisor_name = COALESCE(?, faculty_advisor_name),
        advisor_agreement = COALESCE(?, advisor_agreement),
        main_mission = COALESCE(?, main_mission),
        measurable_objectives = COALESCE(?, measurable_objectives),
        campus_value_add = COALESCE(?, campus_value_add),
        target_audience_type = COALESCE(?, target_audience_type),
        target_audience_details = COALESCE(?, target_audience_details),
        event1_title = COALESCE(?, event1_title),
        event1_description = COALESCE(?, event1_description),
        event1_date = COALESCE(?, event1_date),
        event1_logistics = COALESCE(?, event1_logistics),
        event2_title = COALESCE(?, event2_title),
        event2_description = COALESCE(?, event2_description),
        event2_date = COALESCE(?, event2_date),
        meeting_frequency = COALESCE(?, meeting_frequency),
        annual_budget_mad = COALESCE(?, annual_budget_mad),
        funding_sources = ?,
        facility_needs = COALESCE(?, facility_needs),
        updated_at = datetime('now')
      WHERE id = ?
    `);

    stmt.run(
      b.official_name !== undefined ? b.official_name : null,
      b.acronym !== undefined ? b.acronym : null,
      b.slogan !== undefined ? b.slogan : null,
      b.typology !== undefined ? b.typology : null,
      b.logo_url !== undefined ? b.logo_url : null,
      b.president_name !== undefined ? b.president_name : null,
      b.president_filiere !== undefined ? b.president_filiere : null,
      b.president_email !== undefined ? b.president_email : null,
      b.president_phone !== undefined ? b.president_phone : null,
      b.vp_name !== undefined ? b.vp_name : null,
      b.vp_filiere !== undefined ? b.vp_filiere : null,
      b.vp_contact !== undefined ? b.vp_contact : null,
      b.sg_name !== undefined ? b.sg_name : null,
      b.sg_filiere !== undefined ? b.sg_filiere : null,
      b.sg_contact !== undefined ? b.sg_contact : null,
      b.treasurer_name !== undefined ? b.treasurer_name : null,
      b.treasurer_filiere !== undefined ? b.treasurer_filiere : null,
      b.treasurer_contact !== undefined ? b.treasurer_contact : null,
      b.comm_lead_name !== undefined ? b.comm_lead_name : null,
      b.comm_lead_filiere !== undefined ? b.comm_lead_filiere : null,
      b.comm_lead_contact !== undefined ? b.comm_lead_contact : null,
      additionalMembersStr,
      b.faculty_advisor_name !== undefined ? b.faculty_advisor_name : null,
      b.advisor_agreement !== undefined ? b.advisor_agreement : null,
      b.main_mission !== undefined ? b.main_mission : null,
      b.measurable_objectives !== undefined ? b.measurable_objectives : null,
      b.campus_value_add !== undefined ? b.campus_value_add : null,
      b.target_audience_type !== undefined ? b.target_audience_type : null,
      b.target_audience_details !== undefined ? b.target_audience_details : null,
      b.event1_title !== undefined ? b.event1_title : null,
      b.event1_description !== undefined ? b.event1_description : null,
      b.event1_date !== undefined ? b.event1_date : null,
      b.event1_logistics !== undefined ? b.event1_logistics : null,
      b.event2_title !== undefined ? b.event2_title : null,
      b.event2_description !== undefined ? b.event2_description : null,
      b.event2_date !== undefined ? b.event2_date : null,
      b.meeting_frequency !== undefined ? b.meeting_frequency : null,
      b.annual_budget_mad !== undefined ? parseFloat(b.annual_budget_mad) : null,
      fundingSourcesStr,
      b.facility_needs !== undefined ? b.facility_needs : null,
      existing.id
    );

    try { db.exec('PRAGMA wal_checkpoint(PASSIVE);'); } catch (e) {}

    const updated = db.prepare('SELECT * FROM clubs WHERE id = ?').get(existing.id);
    updated.funding_sources = JSON.parse(updated.funding_sources || '[]');
    updated.additional_members = JSON.parse(updated.additional_members || '[]');

    res.json({
      success: true,
      message: 'Club mis à jour avec succès.',
      club: updated
    });
  } catch (err) {
    console.error('Error updating club:', err);
    res.status(500).json({ error: err.message });
  }
});

// 7. Delete Club
app.delete('/api/clubs/:id', (req, res) => {
  try {
    const rawParam = req.params.id;
    const numId = parseInt(rawParam, 10);
    const idToMatch = isNaN(numId) ? -1 : numId;
    const result = db.prepare('DELETE FROM clubs WHERE id = ? OR UPPER(tracking_code) = UPPER(?)').run(idToMatch, rawParam);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Dossier introuvable.' });
    }
    try { db.exec('PRAGMA wal_checkpoint(PASSIVE);'); } catch (e) {}
    res.json({ success: true, message: 'Dossier supprimé.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Dashboard Statistics
app.get('/api/stats', (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM clubs').get().count;
    const approved = db.prepare("SELECT COUNT(*) as count FROM clubs WHERE status = 'APPROUVE'").get().count;
    const pending = db.prepare("SELECT COUNT(*) as count FROM clubs WHERE status IN ('SOUMIS', 'EN_COURS_DE_REVUE')").get().count;
    const rejected = db.prepare("SELECT COUNT(*) as count FROM clubs WHERE status = 'REFUSE'").get().count;
    const changesRequested = db.prepare("SELECT COUNT(*) as count FROM clubs WHERE status = 'RETOUCHE_DEMANDEE'").get().count;

    const typologyStats = db.prepare(`
      SELECT typology, COUNT(*) as count
      FROM clubs
      GROUP BY typology
    `).all();

    const budgetSum = db.prepare('SELECT SUM(annual_budget_mad) as total_budget FROM clubs').get().total_budget || 0;

    res.json({
      total,
      approved,
      pending,
      rejected,
      changesRequested,
      typologyStats,
      budgetSum
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Club Creation Portal Backend', timestamp: new Date() });
});

// Serve frontend build if present
const clientDistPath = path.join(__dirname, '../frontend/dist/frontend/browser');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend Club Portal running on http://0.0.0.0:${PORT}`);
});
