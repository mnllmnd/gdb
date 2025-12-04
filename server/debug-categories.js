import { query as dbQuery } from './src/db.js';

console.log('🔍 Vérifier les produits et leurs catégories:\n');

const result = await dbQuery(`
  SELECT p.id, p.title, c.name as category, p.price 
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
`);

result.rows.forEach(p => {
  console.log(`  ${p.title.padEnd(15)} -> ${p.category || 'NO CATEGORY'}`);
});

process.exit(0);
