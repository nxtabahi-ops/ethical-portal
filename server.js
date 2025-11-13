// server.js (backend for Render / local)
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const Database = require('better-sqlite3');
const QRCode = require('qrcode');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// static frontend served (for local testing). In production, frontend can be hosted on Netlify.
// Serve public static files if present
app.use(express.static(path.join(__dirname, 'public')));

// --- SQLite DB ---
const dbFile = path.join(__dirname, 'data.sqlite');
const db = new Database(dbFile);

// Create tables if not exist
db.prepare(`CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE,
  title TEXT,
  description TEXT,
  price INTEGER
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_slug TEXT,
  payer TEXT,
  amount INTEGER,
  merchant_upi TEXT,
  user_upi_ref TEXT,
  target TEXT,
  details TEXT,
  utr TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`).run();

// Seed default services if empty
const count = db.prepare('SELECT COUNT(*) as c FROM services').get().c;
if(count === 0) {
  const insert = db.prepare('INSERT INTO services (slug,title,description,price) VALUES (?,?,?,?)');
  insert.run('tg-account','Report Telegram Account','Report impersonation or abuse via official channels',999);
  insert.run('tg-channel','Report Telegram Channel','Report channel for disinformation or illegal content',999);
  insert.run('ig-account','Report Instagram Account','Report abuse, impersonation or IP violations',999);
  insert.run('linux','Linux Learning Package','Ethical Linux training and consulting',499);
  insert.run('tg-unfreeze','Telegram Account Unfreeze','Consultation & recovery guidance',999);
  insert.run('ig-unfreeze','Instagram Account Unfreeze','Recovery guidance and appeals',999);
}

// set default merchant UPI if not present
const cur = db.prepare('SELECT value FROM settings WHERE key = ?').get('merchant_upi');
if(!cur) {
  db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)').run('merchant_upi','lnxempire@ibl');
}

// --- API ---

app.get('/api/services', (req,res) => {
  const services = db.prepare('SELECT slug,title,description,price FROM services').all();
  const merchantUpi = db.prepare('SELECT value FROM settings WHERE key = ?').get('merchant_upi').value;
  res.json({ services, merchantUpi });
});

app.get('/api/admin/settings', (req,res) => {
  const rows = db.prepare('SELECT key,value FROM settings').all();
  const obj = {};
  rows.forEach(r => obj[r.key] = r.value);
  res.json(obj);
});

app.post('/api/admin/settings', (req,res) => {
  const { merchant_upi } = req.body;
  if(!merchant_upi) return res.status(400).json({ error:'merchant_upi required' });
  db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)').run('merchant_upi', merchant_upi);
  res.json({ ok:true });
});

app.get('/api/admin/services', (req,res) => {
  const rows = db.prepare('SELECT * FROM services').all();
  res.json(rows);
});
app.post('/api/admin/services', (req,res) => {
  const { slug, title, description, price } = req.body;
  if(!slug || !title || !price) return res.status(400).json({ error:'slug,title,price required' });
  const stmt = db.prepare('INSERT OR REPLACE INTO services (slug,title,description,price) VALUES (?,?,?,?)');
  stmt.run(slug, title, description||'', price);
  res.json({ ok:true });
});
app.delete('/api/admin/services/:slug', (req,res) => {
  db.prepare('DELETE FROM services WHERE slug = ?').run(req.params.slug);
  res.json({ ok:true });
});

app.post('/api/payments', (req,res) => {
  const { service_slug, payer, amount, merchant_upi, user_upi_ref, target, details, utr } = req.body;
  if(!service_slug || !amount) return res.status(400).json({ error:'service_slug and amount required' });
  const stmt = db.prepare(`INSERT INTO payments (service_slug,payer,amount,merchant_upi,user_upi_ref,target,details,utr) VALUES (?,?,?,?,?,?,?,?)`);
  const info = stmt.run(service_slug, payer||'Anonymous', amount, merchant_upi||'', user_upi_ref||'', target||'', details||'', utr||'');
  res.json({ ok:true, id: info.lastInsertRowid });
});

app.get('/api/admin/payments', (req,res) => {
  const rows = db.prepare('SELECT * FROM payments ORDER BY created_at DESC').all();
  res.json(rows);
});

app.get('/api/qr', async (req,res) => {
  const upi = req.query.upi;
  const amount = req.query.amount;
  const name = req.query.name || '';
  if(!upi) return res.status(400).send('upi required');
  const uriParts = [`pa=${encodeURIComponent(upi)}`];
  if(name) uriParts.push(`pn=${encodeURIComponent(name)}`);
  if(amount) uriParts.push(`am=${encodeURIComponent(amount)}`);
  uriParts.push('cu=INR');
  const upiUri = `upi://pay?${uriParts.join('&')}`;
  try{
    const dataUrl = await QRCode.toDataURL(upiUri, { margin:1, width:300 });
    res.json({ qr: dataUrl, upiUri });
  }catch(err){
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req,res) => {
  res.sendFile(path.join(__dirname, 'public','index.html'));
});
app.get('/admin', (req,res) => {
  res.sendFile(path.join(__dirname, 'public','admin.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('Server running on port', PORT));
