export const TYPE_ICONS = {
  'Borrowed item': '🔌',
  'Money owed': '💸',
  'Meeting plan': '📍',
  'Task/promise': '✅',
  'Return/dropoff': '🔑',
  'Condition proof': '📸',
  'Agreement': '🤝',
}

export const TYPE_ACCENTS = {
  'Borrowed item': 'borrowed',
  'Money owed': 'money',
  'Meeting plan': 'meeting',
  'Task/promise': 'task',
  'Return/dropoff': 'return',
  'Condition proof': 'condition',
  'Agreement': 'agreement',
}

export function getTypeIcon(type) {
  return TYPE_ICONS[type] || '🤝'
}

export function getTypeAccent(type) {
  return TYPE_ACCENTS[type] || 'agreement'
}

export const FIELD_ICONS = {
  title: '🏆',
  type: '🏷️',
  people: '👥',
  agreement: '💬',
  due: '⏰',
  status: '🎯',
  confidence: '✨',
}

export const EXAMPLE_CHIPS = [
  { label: 'Borrowed charger', note: "I lent Alex my USB-C charger. He'll return it after demos." },
  { label: 'Pay me back', note: 'Chris will pay me back tomorrow for dinner.' },
  { label: 'Meet at 9', note: 'Maya and I agreed to meet at the Supabase booth at 9:15.' },
  { label: 'Return keys', note: 'I returned the keys to the landlord.' },
]
