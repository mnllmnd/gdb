// nlp/index.js
import { NlpManager } from 'node-nlp';
import intents from './intents.js';

const manager = new NlpManager({ 
  languages: ['fr'],
  forceNER: true,
  nlu: { log: false }
});

// Ajouter les intents et entraîner le modèle
console.log('🛈 Entraînement du NLP avec', intents.length, 'intents...');

intents.forEach(intent => {
  intent.utterances.forEach(utterance => {
    manager.addDocument('fr', utterance, intent.label);
  });
  intent.answers.forEach(answer => {
    manager.addAnswer('fr', intent.label, answer);
  });
});

// Ajouter un intent fallback pour les messages non compris
manager.addDocument('fr', '*', 'fallback');
manager.addAnswer('fr', 'fallback', 'Je ne suis pas sûr de comprendre. Pouvez-vous reformuler ?');
manager.addAnswer('fr', 'fallback', 'Désolé, je n\'ai pas saisi. Essayez avec d\'autres mots !');
manager.addAnswer('fr', 'fallback', 'Je suis spécialisé dans les produits de décoration et meubles. Que cherchez-vous exactement ?');

// Entraînement du modèle
await manager.train();
manager.save();

console.log('✅ NLP entraîné avec succès !');

export default manager;