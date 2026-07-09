const KNOWN_PEOPLE = ['Alex', 'Maya', 'Chris', 'Sam', 'Landlord']

const TYPE_KEYWORDS = {
  'Return/dropoff': ['returned', 'dropped off', 'handed over', 'gave back'],
  'Borrowed item': ['lent', 'borrowed', 'loaned', 'charger', 'book', 'keys', 'umbrella'],
  'Money owed': ['pay', 'paid', 'owe', 'owes', 'money', 'pounds', 'dollars', 'split', 'dinner'],
  'Meeting plan': ['meet', 'meeting', 'booth', 'coffee', '9:15', '6:00'],
  'Task/promise': ['fix', 'repair', 'deliver', 'finish', 'send', 'complete'],
  'Condition proof': ['damage', 'scratch', 'broken', 'condition', 'room', 'before', 'after'],
}

const ITEM_WORDS = ['charger', 'book', 'keys', 'umbrella', 'laptop', 'phone', 'bag', 'camera']

function classifyType(note) {
  const lower = note.toLowerCase()
  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return type
    }
  }
  return 'Agreement'
}

function extractPerson(note) {
  for (const name of KNOWN_PEOPLE) {
    const regex = new RegExp(`\\b${name}\\b`, 'i')
    if (regex.test(note)) {
      return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() === name
        ? name
        : name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
    }
  }
  return 'Other person'
}

function extractDue(note, type) {
  const lower = note.toLowerCase()

  if (lower.includes('after demos')) return 'After demos'
  if (lower.includes('tomorrow')) return 'Tomorrow'
  if (lower.includes('tonight')) return 'Tonight'
  if (/\b9:15\b/.test(note)) return 'Today, 9:15 PM'
  if (type === 'Meeting plan') {
    const timeMatch = note.match(/\b6:00\b|\b6\b(?!\d)/)
    if (timeMatch) return 'Today, 6:00 PM'
  }
  if (lower.includes('today')) return 'Today'

  const dateMatch = note.match(/\b(May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr)\s+\d{1,2},?\s+\d{4}\b/i)
  if (dateMatch) return dateMatch[0]

  return 'Not specified'
}

function extractItem(note) {
  const lower = note.toLowerCase()
  for (const item of ITEM_WORDS) {
    if (lower.includes(item)) {
      return item.charAt(0).toUpperCase() + item.slice(1)
    }
  }
  const usbMatch = note.match(/USB[-\s]?C?\s*charger/i)
  if (usbMatch) return 'Charger'
  return 'Item'
}

function extractMeetingTime(note) {
  if (/\b9:15\b/.test(note)) return '9:15'
  if (/\b6:00\b/.test(note) || (/\bmeet\b/i.test(note) && /\b6\b/.test(note))) return '6:00 PM'
  const timeMatch = note.match(/\b(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)\b/)
  if (timeMatch) return timeMatch[1]
  return 'time'
}

function buildTitle(type, note) {
  switch (type) {
    case 'Borrowed item':
      return `${extractItem(note)} return`
    case 'Money owed':
      return 'Payment reminder'
    case 'Meeting plan':
      return `Meet at ${extractMeetingTime(note)}`
    case 'Task/promise':
      return 'Promise follow-up'
    case 'Return/dropoff':
      return 'Return confirmed'
    case 'Condition proof':
      return 'Condition record'
    default:
      return 'Agreement'
  }
}

function buildAgreement(type, note, person) {
  const lower = note.toLowerCase()

  if (type === 'Borrowed item') {
    const itemMatch = note.match(/(?:my\s+)?((?:USB[-\s]?C?\s*)?\w+(?:\s+\w+)?\s*charger|\w+(?:\s+\w+)?)/i)
    let item = 'item'
    if (lower.includes('usb') && lower.includes('charger')) {
      item = 'USB-C charger'
    } else {
      item = extractItem(note).toLowerCase()
      if (item === 'Item') item = 'item'
    }
    if (person !== 'Other person') {
      return `${person} borrowed my ${item}`
    }
    return `Someone borrowed my ${item}`
  }

  if (type === 'Money owed') {
    if (person !== 'Other person') {
      return `${person} will pay me back${lower.includes('tomorrow') ? ' tomorrow' : ''}`
    }
    return 'Payment is owed'
  }

  if (type === 'Meeting plan') {
    const locationMatch = note.match(/(?:at|the)\s+(?:the\s+)?(.+?)(?:\s+at\s+\d|$)/i)
    const location = locationMatch ? locationMatch[1].trim() : 'the agreed location'
    if (person !== 'Other person') {
      return `Meet ${person} at ${location}`
    }
    return `Meeting at ${location}`
  }

  if (type === 'Return/dropoff') {
    if (lower.includes('keys') && lower.includes('landlord')) {
      return 'Keys were returned to the landlord'
    }
    if (person !== 'Other person') {
      return `Returned item to ${person}`
    }
    return 'Item was returned'
  }

  if (type === 'Condition proof') {
    return note.length > 80 ? note.slice(0, 80) + '…' : note
  }

  if (type === 'Task/promise') {
    if (person !== 'Other person') {
      return `${person} promised to follow through`
    }
    return note.length > 80 ? note.slice(0, 80) + '…' : note
  }

  return note.length > 100 ? note.slice(0, 100) + '…' : note
}

function buildSuggestedMessage(type, agreement, person, due) {
  if (type === 'Borrowed item' && person !== 'Other person') {
    const duePart = due !== 'Not specified' ? ` and will return it ${due.toLowerCase()}` : ''
    return `Hey ${person}, just confirming you borrowed my ${agreement.replace(/^.*?borrowed my /i, '')}${duePart}.`
  }

  if (type === 'Money owed' && person !== 'Other person') {
    const duePart = due !== 'Not specified' ? ` ${due.toLowerCase()}` : ''
    return `Hey ${person}, confirming you'll pay me back${duePart}.`
  }

  if (type === 'Meeting plan' && person !== 'Other person') {
    const timePart = due !== 'Not specified' ? ` at ${due.replace('Today, ', '')}` : ''
    const locationMatch = agreement.match(/at (.+)$/i)
    const location = locationMatch ? locationMatch[1] : 'the agreed spot'
    return `Hey ${person}, confirming we're meeting at ${location}${timePart}.`
  }

  if (type === 'Return/dropoff') {
    return 'Confirming the keys were returned.'
  }

  if (person !== 'Other person') {
    return `Hey ${person}, just confirming: ${agreement.replace(/\.$/, '')}.`
  }

  return `Confirming: ${agreement.replace(/\.$/, '')}.`
}

function computeConfidence(type, person, due) {
  let score = 0
  if (type !== 'Agreement') score += 1
  if (person !== 'Other person') score += 1
  if (due !== 'Not specified') score += 1
  if (score >= 3) return 'High'
  if (score >= 2) return 'Medium'
  return 'Low'
}

export function parseProofNote(note) {
  const trimmed = note.trim()
  const type = classifyType(trimmed)
  const person = extractPerson(trimmed)
  const people = person === 'Other person' ? 'Me, Other person' : `Me, ${person}`
  const due = extractDue(trimmed, type)
  const title = buildTitle(type, trimmed)
  const agreement = buildAgreement(type, trimmed, person)
  const suggestedMessage = buildSuggestedMessage(type, agreement, person, due)
  const confidence = computeConfidence(type, person, due)

  return {
    title,
    type,
    people,
    agreement,
    due,
    status: 'Open',
    confidence,
    sourceNote: trimmed,
    suggestedMessage,
  }
}
