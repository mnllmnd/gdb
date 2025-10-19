import pkg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const { Pool } = pkg

// Normalize DATABASE_URL: trim whitespace and surrounding quotes if any
let connectionString = process.env.DATABASE_URL
if (typeof connectionString !== 'string') {
  throw new TypeError('DATABASE_URL environment variable is not set or not a string')
}
connectionString = connectionString.trim()
// remove surrounding single or double quotes which sometimes appear when envs are set via Windows UI
if ((connectionString.startsWith("'") && connectionString.endsWith("'")) || (connectionString.startsWith('"') && connectionString.endsWith('"'))) {
  connectionString = connectionString.slice(1, -1)
}

const pool = new Pool({ connectionString })

export async function query(text, params) {
  const res = await pool.query(text, params)
  return res
}

export default pool
