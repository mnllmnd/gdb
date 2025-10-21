import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sql = fs.readFileSync(path.join(__dirname, 'fix_categories.sql'), 'utf8')

const client = new pg.Client({
  connectionString: "postgresql://lamine:BiUnibw5ZnJAuwwlAlovGTY95lVM7MtE@dpg-d3qa220dl3ps73bp6thg-a.oregon-postgres.render.com/gdb_qtb1?sslmode=require"
})

async function runMigration() {
  try {
    await client.connect()
    await client.query(sql)
    console.log('Migration des catégories effectuée avec succès')
  } catch (err) {
    console.error('Erreur lors de la migration:', err)
  } finally {
    await client.end()
  }
}

runMigration()