async function sendMessage(message, userProfile) {
  // Use Vite env or fallback to localhost port used in dev. This matches `src/services/api.ts` behaviour.
  const API_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : 'http://localhost:3001'
  const res = await fetch(`${API_URL}/api/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, userProfile })
  });
  return await res.json();
}
