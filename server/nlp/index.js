// nlp/index.js
import { NlpManager } from 'node-nlp';
import intents from './intents.js';
import fs from 'fs'
import path from 'path'

const manager = new NlpManager({ 
  languages: ['fr'],
  forceNER: true,
  nlu: { log: false }
});

const modelPath = path.resolve(process.cwd(), 'server', 'model.nlp')

const init = async () => {
  // If a saved model exists, load it once. Otherwise train and save.
  try {
    if (fs.existsSync(modelPath)) {
      await manager.load(modelPath)
      console.log('✅ NLP model loaded from disk')
      return manager
    }
  } catch (err) {
    console.warn('Failed to load saved NLP model:', err.message)
  }

  console.log('🛈 Training NLP manager with', intents.length, 'intents...');
  intents.forEach(intent => {
    intent.utterances.forEach(utterance => {
      manager.addDocument('fr', utterance, intent.label);
    });
    intent.answers.forEach(answer => {
      manager.addAnswer('fr', intent.label, answer);
    });
  });

  // fallback intent
  manager.addDocument('fr', '*', 'fallback');
  manager.addAnswer('fr', 'fallback', 'Je ne suis pas sûr de comprendre. Pouvez-vous reformuler ?');
  manager.addAnswer('fr', 'fallback', 'Désolé, je n\'ai pas saisi. Essayez avec d\'autres mots !');
  manager.addAnswer('fr', 'fallback', 'Je suis spécialisé dans les produits de décoration et meubles. Que cherchez-vous exactement ?');

  await manager.train();
  try {
    await manager.save(modelPath)
    console.log('✅ NLP model trained and saved to disk')
  } catch (err) {
    console.warn('NLP trained but failed to save model:', err.message)
  }

  return manager
}

export default manager
export { init }