// Read-only API contract probe. Does not create accounts or read/write row data.
// Run: node scripts/validate-weekly-database.mjs
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(readFileSync('.env', 'utf8').split(/\r?\n/)
  .filter(line => line.includes('=') && !line.trim().startsWith('#'))
  .map(line => { const index = line.indexOf('='); return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '')]; }));
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error('The configured Supabase URL and public API key are required.');
const results = [];
for (const table of ['weekly_action_reports', 'weekly_action_entries', 'weekly_action_tasks', 'priorities']) {
  try {
    const response = await fetch(`${url}/rest/v1/${table}?select=*&limit=0`, { headers: { apikey: key }, signal: AbortSignal.timeout(15000) });
    const body = await response.json();
    results.push({ table, httpStatus: response.status, ok: response.ok, code: response.ok ? undefined : body.code, message: response.ok ? 'Endpoint reachable; zero rows requested.' : body.message });
  } catch (error) { results.push({ table, ok: false, message: error.cause?.message || error.message }); }
}
console.log(JSON.stringify({ checkedAt: new Date().toISOString(), endpoint: new URL(url).hostname, mode: 'read-only, zero-row API probe', results,
  limitation: 'This probe does not validate authenticated CRUD, row-level security, relational constraints, transactions, or concurrency. Those checks require a working isolated database and test identities.' }, null, 2));
if (results.some(result => !result.ok)) process.exitCode = 1;
