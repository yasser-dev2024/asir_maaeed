import { Router } from 'express';
import pool from './db.js';
import { checkCredentials, createAdminToken, requireAdmin } from './auth.js';

const r = Router();

// ── Health ────────────────────────────────────────────────────────────────────

r.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', ts: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// ── Admin login ───────────────────────────────────────────────────────────────

r.post('/admin/login', (req, res) => {
  const { email = '', password = '' } = req.body ?? {};
  if (!checkCredentials(email, password)) {
    return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
  }
  const token = createAdminToken();
  const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
  res.json({ token, expiresAt });
});

// ── GET all shared data (public — for all devices) ────────────────────────────

r.get('/data', async (_req, res) => {
  try {
    const [events, contents, keywords, doctor, qrLocs, config] = await Promise.all([
      pool.query('SELECT * FROM events ORDER BY created_at DESC'),
      pool.query('SELECT * FROM contents ORDER BY created_at DESC'),
      pool.query('SELECT * FROM keywords ORDER BY created_at DESC'),
      pool.query('SELECT * FROM doctor_questions ORDER BY sort_order ASC, created_at ASC'),
      pool.query('SELECT * FROM qr_locations ORDER BY created_at DESC'),
      pool.query('SELECT config FROM smart_entry_config WHERE id = 1'),
    ]);
    res.json({
      events: events.rows,
      contents: contents.rows,
      keywords: keywords.rows,
      doctorQuestions: doctor.rows,
      qrLocations: qrLocs.rows,
      smartEntryConfig: config.rows[0]?.config ?? null,
    });
  } catch (err) {
    console.error('[GET /api/data]', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Events ────────────────────────────────────────────────────────────────────

r.put('/events/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const b = req.body;
  try {
    await pool.query(
      `INSERT INTO events (id,title,description,location,date,time,audience,category,map_url,active,tone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (id) DO UPDATE SET
         title=$2,description=$3,location=$4,date=$5,time=$6,
         audience=$7,category=$8,map_url=$9,active=$10,tone=$11`,
      [id, b.title??'', b.description??'', b.location??'', b.date??'',
       b.time??'', b.audience??'', b.category??'', b.map_url??'',
       b.active??true, b.tone??'green']
    );
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

r.delete('/events/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM events WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Contents ──────────────────────────────────────────────────────────────────

r.put('/contents/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const b = req.body;
  try {
    await pool.query(
      `INSERT INTO contents (id,title,type,summary,category,action_label,file_url,active,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (id) DO UPDATE SET
         title=$2,type=$3,summary=$4,category=$5,
         action_label=$6,file_url=$7,active=$8,updated_at=$9`,
      [id, b.title??'', b.type??'post', b.summary??'', b.category??'',
       b.action_label??'', b.file_url??'', b.active??true, b.updated_at??'']
    );
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

r.delete('/contents/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM contents WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Keywords ──────────────────────────────────────────────────────────────────

r.put('/keywords/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const b = req.body;
  try {
    await pool.query(
      `INSERT INTO keywords (id,question,keywords,answer,link_label,link_url,image_url,cta_label,cta_url,active,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (id) DO UPDATE SET
         question=$2,keywords=$3,answer=$4,link_label=$5,link_url=$6,
         image_url=$7,cta_label=$8,cta_url=$9,active=$10,updated_at=$11`,
      [id, b.question??'', b.keywords??[], b.answer??'', b.link_label??'',
       b.link_url??'', b.image_url??'', b.cta_label??'', b.cta_url??'',
       b.active??true, b.updated_at??'']
    );
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

r.delete('/keywords/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM keywords WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Doctor questions ──────────────────────────────────────────────────────────

r.put('/doctor-questions/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const b = req.body;
  try {
    await pool.query(
      `INSERT INTO doctor_questions (id,question,answer,keywords,active,sort_order,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (id) DO UPDATE SET
         question=$2,answer=$3,keywords=$4,active=$5,sort_order=$6,updated_at=$7`,
      [id, b.question??'', b.answer??'', b.keywords??[],
       b.active??true, b.order??b.sort_order??999, b.updated_at??'']
    );
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

r.delete('/doctor-questions/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM doctor_questions WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── QR Locations ──────────────────────────────────────────────────────────────

r.put('/qr-locations/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const b = req.body;
  try {
    await pool.query(
      `INSERT INTO qr_locations (id,name,description,slug,active,scans,last_scan_at,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (id) DO UPDATE SET name=$2,description=$3,active=$5`,
      [id, b.name??'', b.description??'', b.slug??id, b.active??true,
       b.scans??0, b.last_scan_at||null, b.created_at||new Date().toISOString()]
    );
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

r.delete('/qr-locations/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM qr_locations WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Public: increment QR scan counter in DB
r.post('/qr-locations/:slug/scan', async (req, res) => {
  try {
    await pool.query(
      `UPDATE qr_locations SET scans=scans+1, last_scan_at=now() WHERE slug=$1`,
      [req.params.slug]
    );
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Smart entry config ────────────────────────────────────────────────────────

r.put('/smart-entry-config', requireAdmin, async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO smart_entry_config (id,config,updated_at)
       VALUES (1,$1,now())
       ON CONFLICT (id) DO UPDATE SET config=$1,updated_at=now()`,
      [JSON.stringify(req.body)]
    );
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default r;
