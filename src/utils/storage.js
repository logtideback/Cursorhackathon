const STORAGE_KEY = 'proofmode-proofs'

const SEED_DATA = [
  {
    id: 'seed-1',
    title: 'Charger return',
    type: 'Borrowed item',
    people: 'Me, Alex',
    agreement: 'Alex borrowed my USB-C charger',
    due: 'After demos',
    status: 'Open',
    confidence: 'High',
    sourceNote: 'I lent Alex my USB-C charger. He\'ll return it after demos.',
    suggestedMessage: 'Hey Alex, just confirming you borrowed my USB-C charger and will return it after demos.',
    photo: null,
    createdAt: '2025-05-28T10:00:00.000Z',
  },
  {
    id: 'seed-2',
    title: 'Meet at 6',
    type: 'Meeting plan',
    people: 'Me, Maya',
    agreement: 'Meet Maya at the Supabase booth',
    due: 'Today, 6:00 PM',
    status: 'Open',
    confidence: 'High',
    sourceNote: 'Maya and I agreed to meet at the Supabase booth at 6:00.',
    suggestedMessage: 'Hey Maya, confirming we\'re meeting at the Supabase booth at 6:00 PM.',
    photo: null,
    createdAt: '2025-05-28T11:00:00.000Z',
  },
  {
    id: 'seed-3',
    title: 'Keys returned',
    type: 'Return/dropoff',
    people: 'Me, Landlord',
    agreement: 'Keys were returned to the landlord',
    due: 'May 28, 2025',
    status: 'Complete',
    confidence: 'High',
    sourceNote: 'I returned the keys to the landlord.',
    suggestedMessage: 'Confirming the keys were returned.',
    photo: null,
    createdAt: '2025-05-27T09:00:00.000Z',
  },
  {
    id: 'seed-4',
    title: 'Pay me back tomorrow',
    type: 'Money owed',
    people: 'Me, Chris',
    agreement: 'Chris will pay me back tomorrow',
    due: 'Tomorrow',
    status: 'Open',
    confidence: 'Medium',
    sourceNote: 'Chris will pay me back tomorrow for dinner.',
    suggestedMessage: 'Hey Chris, confirming you\'ll pay me back tomorrow.',
    photo: null,
    createdAt: '2025-05-28T12:00:00.000Z',
  },
]

export function proofFingerprint(proof) {
  return [proof.title, proof.people, proof.agreement, proof.due].join('|')
}

export function isDuplicateProof(a, b) {
  return proofFingerprint(a) === proofFingerprint(b)
}

export function findDuplicate(proofs, proof) {
  return proofs.find((p) => p.id !== proof.id && isDuplicateProof(p, proof))
}

function mergeWithoutDuplicates(existing, incoming) {
  const result = [...existing]
  for (const item of incoming) {
    if (!result.some((p) => isDuplicateProof(p, item))) {
      result.push(item)
    }
  }
  return result
}

export function loadProofs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA))
      return SEED_DATA
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      const merged = mergeWithoutDuplicates([], SEED_DATA)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
      return merged
    }
    if (parsed.length === 0) {
      const merged = mergeWithoutDuplicates([], SEED_DATA)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
      return merged
    }
    return parsed
  } catch {
    return SEED_DATA
  }
}

export function saveProofs(proofs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(proofs))
  } catch {
    // Storage quota exceeded or unavailable
  }
}

export function generateId() {
  return `proof-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
