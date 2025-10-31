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

// Ensure each new client session uses UTF8 client encoding so accented characters and emojis
// are preserved when inserted into Postgres. This sets the session client_encoding for
// every connection returned from the pool.
pool.on('connect', async (client) => {
  try {
    // SET client_encoding is supported by Postgres
    await client.query("SET client_encoding = 'UTF8'")
  } catch (e) {
    // non-blocking: log but don't crash the app if this fails for some reason
    console.warn('Failed to set client_encoding on new PG client', e && e.message)
  }
})

export async function query(text, params) {
  const res = await pool.query(text, params)
  return res
}

export default pool
