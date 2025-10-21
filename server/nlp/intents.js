// nlp/intents.js
const intents = [
  {
    label: 'salutation',
    utterances: [
      'bonjour', 'salut', 'hello', 'coucou', 'yo', 'hey', 'bonsoir',
      'cc', 'slt', 'bjr', 'hey le bot', 'hello there', 'hi',
      'bonjour ça va', 'salut comment tu vas', 'bonjour bonjour',
      'good morning', 'good afternoon', 'yo le bot', 'slt ça va',
      'cc comment ça va', 'hey assistant', 'bonjour assistant'
    ],
    answers: [
      'Bonjour ! 👋 Je suis votre assistant shopping. Comment puis-je vous aider ?',
      'Salut ! Ravie de vous voir. Que cherchez-vous comme produit aujourd\'hui ?',
      'Hello ! 🤗 Besoin d\'aide pour trouver des meubles ou de la décoration ?'
    ]
  },
  {
    label: 'recherche_produit',
    utterances: [
      // Mots-clés généraux
      'je cherche', 'je veux', 'je voudrais', 'je recherche', 'je suis à la recherche',
      'tu as', 'vous avez', 'disponible', 'trouver', 'acheter', 'montre', 'montrer',
      'donne', 'voir', 'affiche', 'afficher', 'liste', 'catalogue',
      
      // Produits spécifiques
      'produit', 'produits', 'article', 'articles', 'item', 'items',
      'meuble', 'meubles', 'mobilier', 'déco', 'décoration', 
      'lampe', 'lampes', 'luminaire', 'luminaires', 'lustre', 'lustres',
      'chaise', 'chaises', 'siège', 'sièges', 'fauteuil', 'fauteuils',
      'table', 'tables', 'bureau', 'bureaux', 'canapé', 'canapés', 'sofa',
      'armoire', 'armoires', 'commode', 'commodes', 'étagère', 'étagères',
      'lit', 'lits', 'matelas', 'vaisselle', 'couvert', 'verre', 'assiette',
      'électroménager', 'frigo', 'lave-linge', 'cuisinière', 'jardin', 'extérieur',
      
      // Phrases complètes
      'je cherche un produit', 'je veux acheter', 'montre moi des produits',
      'quels produits avez-vous', 'tu as quoi comme articles',
      'je recherche un meuble', 'je veux une lampe', 'donne moi des idées déco',
      'montre les chaises', 'affiche les tables', 'je cherche de la décoration',
      'vous avez des canapés', 'je veux du mobilier', 'trouve moi une armoire',
      'je recherche des meubles salon', 'donne moi des lampes', 'montre tout',
      'qu est ce que vous vendez', 'catalogue produits', 'liste des articles'
    ],
    answers: [
      'Je cherche les produits correspondants dans notre catalogue...',
      'Je vais vous montrer nos produits disponibles !',
      'Voici ce que j\'ai trouvé pour vous :'
    ]
  },
  {
    label: 'recommandation',
    utterances: [
      'recommandation', 'recommandations', 'conseil', 'conseils', 'suggestion', 'suggestions',
      'que me conseilles', 'tu recommandes quoi', 'des idées', 'donne des idées',
      'qu est-ce qui est populaire', 'produits tendance', 'top produits',
      'aide-moi à choisir', 'je sais pas quoi prendre', 'je suis indécis',
      'inspire moi', 'nouveautés', 'meilleurs produits', 'coup de cœur',
      'qu est-ce que je devrais acheter', 'tu penses à quoi', 'guide moi',
      'aide à décider', 'je hésite', 'choix difficile', 'best-sellers',
      'produits phares', 'ce qui se vend bien', 'préférés des clients',
      'que prendre', 'quoi choisir', 'donne ton avis'
    ],
    answers: [
      'Je vous recommande ces produits populaires :',
      'Voici mes suggestions basées sur vos goûts :',
      'D\'après ce que je sais, ces articles pourraient vous plaire :'
    ]
  },
  {
    label: 'aide',
    utterances: [
      'aide', 'help', 'assistance', 'support', 'que peux-tu faire', 'fonctionnalités',
      'tu fais quoi', 'aide moi', 'besoin d aide', 'comment ça marche',
      'comment utiliser', 'guide', 'tutoriel', 'je comprends pas', 'explique moi',
      'peux tu m aider', 'à quoi tu sers', 'tes fonctionnalités', 'capacités',
      'que sais-tu faire', 'aide informatique', 'soutien', 'documentation'
    ],
    answers: [
      'Je peux vous aider à : 🔍 Trouver des produits, 💡 Faire des recommandations, 💰 Vous informer sur les prix, 🚚 Donner les infos livraison ! Dites-moi ce que vous cherchez.',
      'Je suis votre assistant shopping ! Je peux rechercher des produits, faire des suggestions et répondre à vos questions sur notre catalogue.'
    ]
  }
];

export default intents;