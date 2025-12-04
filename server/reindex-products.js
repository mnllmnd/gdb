import { indexProductsBatch } from './src/services/embeddings.js';
import { query as dbQuery } from './src/db.js';

console.log('🔄 Réindexing produits avec les nouveaux embeddings...\n');

try {
  // Récupérer tous les produits avec catégories
  const result = await dbQuery(`
    SELECT p.id, p.title, COALESCE(c.name, 'general') as category, p.price, p.description, p.image_url 
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
  `);
  const products = result.rows;
  
  console.log(`📊 Found ${products.length} products to reindex`);
  
  // Réindexer
  const indexed = await indexProductsBatch(products);
  
  console.log(`\n✅ Reindexing complete!`);
  console.log(`📋 ${indexed.length} products indexed with new embeddings`);
  
  // Vérifier les embeddings
  const checkResult = await dbQuery('SELECT id, title, embedding FROM products WHERE embedding IS NOT NULL');
  console.log(`✅ ${checkResult.rows.length} products have embeddings in DB`);
  
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
