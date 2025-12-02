import pkg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const { Pool } = pkg

// ============================================
// DATABASE URL VALIDATION & NORMALIZATION
// ============================================

let connectionString = process.env.DATABASE_URL

if (typeof connectionString !== 'string') {
  throw new TypeError(
    'DATABASE_URL environment variable is not set or not a string. ' +
    'Please set DATABASE_URL in your .env file.'
  )
}

// Trim whitespace
connectionString = connectionString.trim()

// Remove surrounding quotes (from Windows UI environment variables)
if (
  (connectionString.startsWith("'") && connectionString.endsWith("'")) ||
  (connectionString.startsWith('"') && connectionString.endsWith('"'))
) {
  connectionString = connectionString.slice(1, -1)
}

// Remove channel_binding=require if present (can cause issues with some Neon instances)
connectionString = connectionString.replace('&channel_binding=require', '')

console.log('Connecting to database:', connectionString.replace(/:[^@]+@/, ':***@'))

// ============================================
// POOL CONFIGURATION FOR NEON (serverless)
// ============================================

const pool = new Pool({
  connectionString,
  // SSL configuration (required for Neon)
  ssl: {
    rejectUnauthorized: false
  },
  // Connection pool limits (optimized for serverless)
  max: 3,                           // Max connections in pool (Neon free tier has ~5 limit)
  min: 0,                           // Don't maintain idle connections (serverless)
  idleTimeoutMillis: 10000,         // 10s idle before closing (aggressive cleanup)
  connectionTimeoutMillis: 10000,   // 10s to acquire connection (longer for cold starts)
  // Keep-alive settings (disabled for serverless)
  keepAlives: false,
  // Statement timeout (prevent long-running queries)
  statement_timeout: 30000,
  // Allow connection to be reused immediately after release
  connectionString: connectionString
})

// ============================================
// CONNECTION POOL EVENT HANDLERS
// ============================================

pool.on('connect', async (client) => {
  try {
    // Set UTF-8 encoding for accented characters and emojis
    await client.query("SET client_encoding = 'UTF8'")
    console.log('✓ Client connected with UTF8 encoding')
  } catch (error) {
    console.warn('⚠ Failed to set client_encoding:', error?.message)
  }
})

pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client:', err)
})

pool.on('remove', () => {
  console.log('✓ Client removed from pool')
})

// ============================================
// CONNECTION VERIFICATION
// ============================================

async function testConnection() {
  let client
  try {
    client = await pool.connect()
    const result = await client.query('SELECT NOW() as current_time, version() as version')
    console.log('✓ Database connected successfully')
    console.log('  Time:', result.rows[0].current_time)
    console.log('  Version:', result.rows[0].version.split(',')[0])
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error?.message)
    throw error
  } finally {
    if (client) {
      try {
        client.release()
      } catch (e) {
        console.warn('Failed to release client:', e?.message)
      }
    }
  }
}

// Test connection on startup (with retry)
let attempts = 0
const maxAttempts = 3
let lastError

while (attempts < maxAttempts) {
  try {
    await testConnection()
    break
  } catch (err) {
    lastError = err
    attempts++
    if (attempts < maxAttempts) {
      console.log(`Retry attempt ${attempts}/${maxAttempts} in 2 seconds...`)
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
}

if (attempts === maxAttempts) {
  console.error('Failed to connect to database after', maxAttempts, 'attempts:', lastError)
  process.exit(1)
}

// ============================================
// EXPORTS
// ============================================

export async function query(text, params) {
  try {
    const res = await pool.query(text, params)
    return res
  } catch (error) {
    console.error('Query error:', error)
    throw error
  }
}

export { pool }
export default pool
