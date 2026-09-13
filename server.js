const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const BIN = path.join(__dirname, 'node_modules', '@embedded-postgres', 'linux-x64', 'native', 'bin');
const PGDATA = path.join(__dirname, 'pgdata');
const PGPORT = Number(process.env.PGPORT || 5432);
const DB = { user: 'demo', host: '127.0.0.1', port: PGPORT, database: 'demoapp' };
// Make the credential PATH visible to live-process introspection (A26/H33).
process.env.DATABASE_URL = `postgres://${DB.user}@${DB.host}:${DB.port}/${DB.database}`;

function runInitDb(pgData) {
  return new Promise((resolve, reject) => {
    const p = spawn(path.join(BIN, 'initdb'), [
      `--pgdata=${pgData}`,
      '--auth=trust',
      `--username=${DB.user}`,
      '--encoding=UTF8',
    ], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    p.stdout.on('data', (c) => { out += c; });
    p.stderr.on('data', (c) => { out += c; });
    p.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`initdb exit ${code}: ${out.slice(-400)}`)));
    p.on('error', reject);
  });
}

function startPostgres(pgData, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const proc = spawn(path.join(BIN, 'postgres'), [
      '-D', pgData,
      '-p', String(DB.port),
      '-c', 'listen_addresses=127.0.0.1',
    ], { stdio: ['ignore', 'pipe', 'pipe'] });
    let ready = false;
    let tail = '';
    const timer = setTimeout(() => {
      if (!ready) { proc.kill('SIGKILL'); reject(new Error(`postgres not ready in ${timeoutMs}ms; tail: ${tail.slice(-300)}`)); }
    }, timeoutMs);
    proc.stdout.on('data', (c) => {
      tail += c;
      if ((tail + c).includes('database system is ready to accept connections') && !ready) {
        ready = true; clearTimeout(timer); resolve(proc);
      }
    });
    proc.stderr.on('data', (c) => {
      tail += c;
      if (tail.includes('database system is ready to accept connections') && !ready) {
        ready = true; clearTimeout(timer); resolve(proc);
      }
    });
    proc.on('exit', (code) => {
      clearTimeout(timer);
      if (!ready) reject(new Error(`postgres exited code ${code}: ${tail.slice(-300)}`));
    });
  });
}

async function bootstrapDb() {
  if (!fs.existsSync(path.join(PGDATA, 'PG_VERSION'))) {
    fs.rmSync(PGDATA, { recursive: true, force: true });
    fs.mkdirSync(PGDATA, { recursive: true });
    await runInitDb(PGDATA);
  }
  return startPostgres(PGDATA);
}

async function main() {
  try {
    const pgProc = await bootstrapDb();
    console.log('postgres started on port', DB.port, ', pid', pgProc.pid);
  } catch (e) {
    console.error('postgres bootstrap failed:', e.message);
    process.exit(1);
  }

  const admin = new Pool({ user: DB.user, host: DB.host, port: DB.port, database: 'postgres' });
  await admin.query(`CREATE DATABASE ${DB.database}`);
  await admin.end();

  const pool = new Pool({ user: DB.user, host: DB.host, port: DB.port, database: DB.database });
  await pool.query('CREATE TABLE IF NOT EXISTS notes (id serial primary key, body text, created_at timestamptz default now())');
  const c = await pool.query('SELECT count(*)::int AS n FROM notes');
  if (c.rows[0].n === 0) {
    await pool.query("INSERT INTO notes (body) SELECT md5(random()::text) FROM generate_series(1,25)");
  }
  console.log('notes table ready');

  const app = express();
  app.get('/healthz', async (_req, res) => {
    try { await pool.query('SELECT 1'); res.json({ ok: true, db: true }); }
    catch (e) { res.status(503).json({ ok: false, db: false, err: e.message }); }
  });
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
      res.status(503).send('db error: ' + e.message);
    }
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`demo app listening on port ${port}`));
}

main();
