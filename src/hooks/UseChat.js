async function sendMessage(message, userProfile) {
  const res = await fetch('http://localhost:3001/api/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, userProfile })
  });
  return await res.json();
}
