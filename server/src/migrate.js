import fs from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import pool from './db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
  try {
    await pool.query(sql)
    console.log('Migration finished')
    process.exit(0)
  } catch (err) {
    console.error('Migration failed', err)
    process.exit(1)
  }
}

migrate()
