import path from 'path';

(async () => {
  try {
    const mod = await import('./src/services/embeddings.js');
    const { isValidQuery } = mod;

    const tests = [
      'vêtement',
      'vêtements',
      'vetement',
      'je veux des vêtements',
      'aaabbb',
      '  '
    ];

    for (const t of tests) {
      try {
        const ok = isValidQuery(t);
        console.log(JSON.stringify({ query: t, isValid: ok }));
      } catch (err) {
        console.error('error for', t, err.message);
      }
    }
  } catch (e) {
    console.error('failed to import embeddings module:', e.message);
    process.exit(1);
  }
})();
