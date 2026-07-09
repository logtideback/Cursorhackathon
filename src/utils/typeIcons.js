export const TYPE_ACCENTS = {
  'Borrowed item': 'borrowed',
  'Money owed': 'money',
  'Meeting plan': 'meeting',
  'Task/promise': 'task',
  'Return/dropoff': 'return',
  'Condition proof': 'condition',
  'Agreement': 'agreement',
}

export function getTypeAccent(type) {
  return TYPE_ACCENTS[type] || 'agreement'
}

export const EXAMPLE_CHIPS = [
  { label: 'Borrowed item', note: "I lent Alex my USB-C charger. He'll return it after demos." },
  { label: 'Payment', note: 'Chris will pay me back tomorrow for dinner.' },
  { label: 'Meeting', note: 'Maya and I agreed to meet at the Supabase booth at 9:15.' },
  { label: 'Return', note: 'I returned the keys to the landlord.' },
]
