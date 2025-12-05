// Test pour vérifier que les mots-clés sont bien extraits avant l'embedding

function extractKeywords(query) {
  const stopWords = [
    'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles',
    'cherche', 'veux', 'voudrais', 'recherche', 'acheter', 'trouver',
    'un', 'une', 'le', 'la', 'les', 'de', 'du', 'et', 'ou', 'à', 'pour',
    'rien', 'aucun', 'pas', 'ne', 'non', 'nul', 'vide',
    'je', 'suis', 'ai', 'ais', 'sont', 'est', 'était',
    'le', 'la', 'les', 'l', 'un', 'une', 'des', 'du', 'de',
    'en', 'dans', 'sur', 'sous', 'avec', 'sans', 'par', 'pour', 'vers',
    'ce', 'cet', 'cette', 'ces', 'mon', 'ta', 'son', 'sa', 'mes', 'tes', 'ses',
  ];

  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.includes(w));

  return keywords;
}

// Tests
const testCases = [
  'je veux une fleur',
  'je cherche un livre',
  'trouver des chaussures nike',
  'je voudrais des vêtements de sport',
  'robe rouge',
  'chemise à carreaux',
];

console.log('=== Extraction de mots-clés ===\n');
testCases.forEach(query => {
  const keywords = extractKeywords(query);
  const forEmbedding = keywords.length > 0 ? keywords.join(' ') : query;
  console.log(`Query: "${query}"`);
  console.log(`Keywords: [${keywords.join(', ')}]`);
  console.log(`For Embedding: "${forEmbedding}"`);
  console.log('');
});
