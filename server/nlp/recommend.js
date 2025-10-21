// nlp/recommend.js
const recommend = (userProfile = {}, userMessage = '') => {
  const { preferences = [], budget } = userProfile;
  const message = userMessage.toLowerCase();
  
  // Base de données de produits
  const products = [
    { id: 1, name: 'Lampe Scandinave Blanche', price: 89.99, category: 'décoration' },
    { id: 2, name: 'Chaise Design Eiffel', price: 129.99, category: 'mobilier' },
    { id: 3, name: 'Table Basse Bois Naturel', price: 199.99, category: 'mobilier' },
    { id: 4, name: 'Canapé 3 Places Velours', price: 899.99, category: 'mobilier' },
    { id: 5, name: 'Vase Céramique Artisanal', price: 45.99, category: 'décoration' }
  ];

  let filteredProducts = [...products];

  // Filtrage par mots-clés dans le message
  if (message.includes('lampe') || message.includes('luminaire')) {
    filteredProducts = filteredProducts.filter(p => p.category === 'décoration');
  } else if (message.includes('chaise') || message.includes('siège')) {
    filteredProducts = filteredProducts.filter(p => p.name.toLowerCase().includes('chaise'));
  } else if (message.includes('table')) {
    filteredProducts = filteredProducts.filter(p => p.name.toLowerCase().includes('table'));
  } else if (message.includes('canapé') || message.includes('sofa')) {
    filteredProducts = filteredProducts.filter(p => p.category === 'mobilier' && p.name.toLowerCase().includes('canapé'));
  }

  // Filtrage par budget
  if (budget) {
    filteredProducts = filteredProducts.filter(p => p.price <= budget);
  }

  return filteredProducts.slice(0, 3);
};

export default recommend;