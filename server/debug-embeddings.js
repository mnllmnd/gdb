import { query as dbQuery } from './src/db.js';

console.log('🔍 DEBUG: Vérifier les embeddings en DB...\n');

// 1. Combien de produits ont des embeddings ?
const result1 = await dbQuery('SELECT COUNT(*) as total, COUNT(embedding) as with_embedding FROM products');
const counts = result1.rows[0];
console.log(`📊 Produits total: ${counts.total}, avec embedding: ${counts.with_embedding}\n`);

// 2. Lister les produits (titre, présence embedding)
const result2 = await dbQuery(`
  SELECT id, title, embedding IS NOT NULL as has_embedding, embedding 
  FROM products 
  LIMIT 20
`);
console.log('📋 Produits:');
result2.rows.forEach(p => {
  const embStr = p.embedding 
    ? (typeof p.embedding === 'string' 
        ? `[${p.embedding.substring(1, 50)}...]` 
        : `[${JSON.stringify(p.embedding).substring(0, 50)}...]`)
    : 'NULL';
  console.log(`  ${p.id}. "${p.title}" - Embedding: ${p.has_embedding ? '✅' : '❌'} ${embStr}`);
});

// 3. Trouver le produit "Fleurs"
console.log('\n🌸 Chercher "Fleurs":');
const result3 = await dbQuery(`SELECT id, title, embedding FROM products WHERE LOWER(title) LIKE '%fleur%'`);
if (result3.rows.length > 0) {
  const fleur = result3.rows[0];
  console.log(`  Trouvé: ID=${fleur.id}, Title="${fleur.title}"`);
  if (fleur.embedding) {
    const emb = typeof fleur.embedding === 'string' ? JSON.parse(fleur.embedding) : fleur.embedding;
    console.log(`  Embedding length: ${emb?.length || 0}`);
    console.log(`  First 5 values: ${JSON.stringify(emb?.slice(0, 5))}`);
  } else {
    console.log(`  ❌ Embedding IS NULL!`);
  }
} else {
  console.log('  ❌ Produit "Fleurs" NOT FOUND');
}

console.log('\nDone.');
process.exit(0);
