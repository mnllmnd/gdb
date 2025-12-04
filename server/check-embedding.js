#!/usr/bin/env node
import db from './src/db.js';

const r = await db.query('SELECT id, title, embedding::text as emb_text FROM products WHERE title LIKE \'%Sac%\' LIMIT 1');
if (r.rows && r.rows[0]) {
  console.log('Title:', r.rows[0].title);
  console.log('Raw embedding (first 300 chars):');
  console.log(r.rows[0].emb_text.substring(0, 300));
  const parsed = JSON.parse(r.rows[0].emb_text);
  console.log('Parsed type:', typeof parsed);
  console.log('Array?:', Array.isArray(parsed));
  if (Array.isArray(parsed)) {
    console.log('Length:', parsed.length);
    console.log('Sample values:', parsed.slice(0, 5));
  }
}
await db.end();
