import fs from 'fs'
import path from 'path'

// Lightweight wrapper to compute text embeddings using @xenova/transformers.
// This file tries to lazily load a pipeline and expose computeEmbedding(text)
// which returns a Float32Array or a plain Array of numbers.

let embedder = null
let loading = false

export async function computeEmbedding(text) {
  if (!text) return null
  try {
    if (!embedder && !loading) {
      loading = true
      // Lazy import so startup doesn't fail if dependency missing
      const { pipeline } = await import('@xenova/transformers')
      // Model choice: an embedding-capable model. Adjust if you prefer another.
      // Note: model size influences embedding dimension. The schema currently
      // uses vector(1536) — ensure the chosen model produces that dimension or
      // adjust the DB migration/schema accordingly.
      embedder = await pipeline('feature-extraction', 'Xenova/all-miniLM-L6-v2')
      loading = false
    }
    if (!embedder) return null
    // The pipeline returns nested arrays; use mean pooling result if available
    const out = await embedder(text, { pooling: 'mean', normalize: true })
    // Different versions may return typed arrays or arrays; normalize to Array
    // If out.data exists (ndarray-like) prefer that
    if (out && Array.isArray(out)) {
      // out might be [ [f1, f2, ...] ] or Float32Array
      if (Array.isArray(out[0])) return out[0].map(n => Number(n))
      return out.map(n => Number(n))
    }
    if (out && out.data) {
      return Array.from(out.data).map(n => Number(n))
    }
    return null
  } catch (err) {
    console.warn('Embedding computation failed', err && err.message)
    return null
  }
}
