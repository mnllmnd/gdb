export function mapOrderStatus(raw?: string) {
  const s = (raw || '').toString().trim().toLowerCase()
  // mapping of keywords to French label + chakra color
  if (!s) return { label: '—', color: 'gray' }

  if (s.includes('annul') || s.includes('cancel') || s.includes('canceled')) return { label: 'Annulée', color: 'red' }
  if (s.includes('livr') || s.includes('deliv') || s.includes('delivered')) return { label: 'Livrée', color: 'green' }
  if (s.includes('exped') || s.includes('ship') || s.includes('shipped')) return { label: 'Expédiée', color: 'green' }
  if (s.includes('pay') || s.includes('paid')) return { label: 'Payée', color: 'green' }
  if (s.includes('trait') || s.includes('process')) return { label: 'En cours', color: 'blue' }
  if (s.includes('att') || s.includes('pend') || s.includes('waiting') || s.includes('pending')) return { label: 'En attente', color: 'yellow' }
  if (s.includes('term') || s.includes('done') || s.includes('complete')) return { label: 'Terminée', color: 'green' }
  if (s.includes('refus') || s.includes('reject') || s.includes('rejected')) return { label: 'Refusée', color: 'red' }

  // fallback: capitalize and keep in French-friendly form
  const label = raw ? raw.toString() : '—'
  return { label, color: 'gray' }
}

export default mapOrderStatus
