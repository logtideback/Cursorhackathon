export const TYPE_ICONS = {
  'Borrowed item': '🔌',
  'Money owed': '💸',
  'Meeting plan': '📍',
  'Task/promise': '✅',
  'Return/dropoff': '🔑',
  'Condition proof': '📸',
  'Agreement': '📝',
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
  return TYPE_ICONS[type] || '📝'
}

export function getTypeAccent(type) {
  return TYPE_ACCENTS[type] || 'agreement'
}

export const FIELD_ICONS = {
  title: '📋',
  type: '🏷️',
  people: '👥',
  agreement: '💬',
  due: '⏰',
  status: '●',
  confidence: '✨',
}
