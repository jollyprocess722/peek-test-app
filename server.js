const express = require('express');
const { Pool } = require('pg');

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.get('/', async (_req, res) => {
  try {
    const r = await pool.query('SELECT id, body, created_at FROM notes ORDER BY id DESC LIMIT 10');
    res.send(`<html><head><title>peek introspection demo</title></head><body>
      <h1>peek introspection demo</h1>
      <p>rows served from postgres: ${r.rowCount}</p>
      <ul>${r.rows.map(n => `<li>#${n.id} ${n.body} (${n.created_at.toISOString()})</li>`).join('')}</ul>
      <p>pid: ${process.pid}</p>
    </body></html>`);
  } catch (e) {
    res.status(500).send('db error: ' + e.message);
  }
});

app.get('/healthz', (_req, res) => res.json({ ok: true }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`demo app listening on port ${port}`));
