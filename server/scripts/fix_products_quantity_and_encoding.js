#!/usr/bin/env node
/*
 Script to fix products with quantity = 0 by setting a sane default quantity
 and attempt to repair mojibake/encoding issues in title and description.

 Usage:
   node fix_products_quantity_and_encoding.js [--dry-run] [--default=1]

 The script connects to the same DATABASE_URL as the server and updates rows in place.
*/

import { query } from '../src/db.js'

import process from 'process'

function decodeLatin1ToUtf8(s) {
  if (s == null) return s
  try {
    return Buffer.from(s, 'latin1').toString('utf8')
  } catch (e) {
    return s
  }
}

function scoreString(s) {
  if (!s) return 0
  // penalize weird mojibake characters sequences often seen
  const badPatterns = [/�/, /�/, /├/, /Ô/, /Ã/, /Ã©/, /Ãª/]
  let score = 0
  // reward letters and spaces
  const letters = (s.match(/[A-Za-zÀ-ÖØ-öø-ÿ\u00C0-\u024F]/g) || []).length
  score += letters
  // penalize bad patterns
  for (const p of badPatterns) {
    const m = s.match(p)
    if (m) score -= (m.length || 1) * 5
  }
  return score
}

function fixString(s) {
  if (!s || typeof s !== 'string') return s
  const candidates = [s, decodeLatin1ToUtf8(s)]
  // some strings might be double-encoded; try decode again
  try {
    const c2 = decodeLatin1ToUtf8(candidates[1])
    if (c2 !== candidates[1]) candidates.push(c2)
  } catch (e) {}

  // choose best scored candidate
  let best = candidates[0]
  let bestScore = scoreString(best)
  for (const c of candidates.slice(1)) {
    const sc = scoreString(c)
    if (sc > bestScore) {
      best = c
      bestScore = sc
    }
  }
  // quick replacements for common artifacts if still present
  const replaced = best
    .replace(/\u00A0/g, ' ')
    .replace(/\uFFFD/g, '')
    .replace(/\u2018|\u2019|â€™|â€˜|ÔÇÖ/g, "'")
    .replace(/â€”/g, '-')
    .replace(/Ã©|Ã¨|Ãª|Ã«/g, 'e')
    .replace(/├®/g, 'é')
    .replace(/Ã©/g, 'é')
    .replace(/\s+\+/g, ' ')

  return replaced
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const defaultArg = args.find(a => a.startsWith('--default='))
  const defaultQty = defaultArg ? parseInt(defaultArg.split('=')[1], 10) : 1

  console.log('Connecting to DB, dryRun=', dryRun, 'defaultQty=', defaultQty)

  try {
    const res = await query('SELECT id, title, description, quantity FROM products WHERE quantity = 0')
    const rows = res.rows || []
    console.log('Found', rows.length, 'products with quantity = 0')
    let updatedCount = 0
    for (const r of rows) {
      const { id, title, description } = r
      const hasTitle = title && String(title).trim().length > 0
      const hasDesc = description && String(description).trim().length > 0
      if (!hasTitle && !hasDesc) {
        // skip empty products
        continue
      }

      const fixedTitle = fixString(title)
      const fixedDesc = fixString(description)

      const needUpdateTitle = fixedTitle !== title
      const needUpdateDesc = fixedDesc !== description
      const newQty = defaultQty

      if (dryRun) {
        console.log('[DRY] Would update product', id, { needUpdateTitle, needUpdateDesc, newQty })
      } else {
        const params = []
        let setParts = []
        if (needUpdateTitle) {
          params.push(fixedTitle)
          setParts.push(`title = $${params.length}`)
        }
        if (needUpdateDesc) {
          params.push(fixedDesc)
          setParts.push(`description = $${params.length}`)
        }
        // always set quantity to default
        params.push(newQty)
        setParts.push(`quantity = $${params.length}`)
        params.push(id)
        const sql = `UPDATE products SET ${setParts.join(', ')} WHERE id = $${params.length}`
        try {
          await query(sql, params)
          console.log('Updated product', id, 'set quantity=', newQty, 'titleChanged=', needUpdateTitle, 'descChanged=', needUpdateDesc)
          updatedCount++
        } catch (e) {
          console.error('Failed to update product', id, e && e.message)
        }
      }
    }
    console.log('Done. Updated', updatedCount, 'products')
    if (!dryRun && updatedCount > 0) {
      try {
        const cache = await import('../src/cache.js')
        await cache.default.refresh(query)
        console.log('Cache refreshed after updates')
      } catch (e) {
        console.warn('Failed to refresh cache after updates', e && e.message)
      }
    }
    process.exit(0)
  } catch (err) {
    console.error('Script failed', err && err.message)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('fix_products_quantity_and_encoding.js')) {
  main()
}
