// nlp/emotions.js
const detectEmotion = (message) => {
  const text = message.toLowerCase();
  
  const emotions = {
    happy: ['content', 'heureux', 'super', 'génial', 'parfait', 'ador', 'cool'],
    excited: ['excité', 'impatient', 'envie', 'hâte'],
    neutral: ['ok', 'daccord', 'bien', 'recherche', 'cherche'],
    confused: ['comprends pas', 'explique', 'confus', 'perdu']
  };

  for (const [emotion, keywords] of Object.entries(emotions)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return emotion;
    }
  }

  return 'neutral';
};

export default detectEmotion;