const KNOWN_NAMES = [
  'Alex', 'Maya', 'Chris', 'Sam', 'Jordan', 'Nina', 'Tom', 'Sarah', 'David', 'Francisco', 'Sunita',
]

const NAME_STOP_WORDS = new Set([
  'I', 'He', 'She', 'They', 'We', 'The', 'My', 'His', 'Her', 'It', 'This', 'That',
  'When', 'After', 'Before', 'Today', 'Tomorrow', 'Tonight', 'Monday', 'Tuesday',
  'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December', 'Just', 'Confirming',
  'USB', 'PM', 'AM', 'Meet', 'Random', 'Confirming', 'Hey', 'Here', 'There',
])

const ROLE_PHRASES = [
  { pattern: /\b(?:my|the)\s+landlord\b/i, label: 'Landlord' },
  { pattern: /\b(?:my|the)\s+roommate\b/i, label: 'Roommate' },
  { pattern: /\b(?:my|the)\s+friend\b/i, label: 'Friend' },
  { pattern: /\b(?:my|the)\s+manager\b/i, label: 'Manager' },
  { pattern: /\b(?:the)\s+contractor\b/i, label: 'Contractor' },
]

const TYPE_KEYWORDS = {
  'Borrowed item': [
    'lent', 'borrowed', 'loaned', 'gave', 'charger', 'laptop', 'book', 'umbrella',
    'jacket', 'cable', 'adapter', 'camera', 'keys',
  ],
  'Money owed': [
    'pay', 'paid', 'owe', 'owes', 'money', 'pounds', 'dollars', 'euros', 'split',
    'bill', 'taxi', 'dinner', 'lunch', 'coffee', 'refund',
  ],
  'Meeting plan': [
    'meet', 'meeting', 'see', 'booth', 'call', 'dinner', 'coffee', 'appointment',
    'at 6', 'at 9:15',
  ],
  'Task/promise': [
    'fix', 'repair', 'deliver', 'finish', 'send', 'complete', 'submit', 'review',
    'update', 'bring', 'water', 'feed', 'pick up', 'drop off',
  ],
  'Return/dropoff': [
    'returned', 'return', 'dropped off', 'handed over', 'gave back', 'brought back', 'keys',
  ],
  'Condition proof': [
    'damage', 'scratch', 'broken', 'condition', 'room', 'before', 'after', 'arrived',
    'left', 'deposit', 'rental', 'car', 'package',
  ],
}

const ITEM_WORDS = [
  'charger', 'laptop', 'book', 'umbrella', 'jacket', 'cable', 'adapter', 'camera', 'keys', 'phone', 'bag',
]

const DUE_PATTERNS = [
  { re: /\bafter demos\b/i, value: 'After demos' },
  { re: /\bbefore demos\b/i, value: 'Before demos' },
  { re: /\bafter the event\b/i, value: 'After the event' },
  { re: /\bafter lunch\b/i, value: 'After lunch' },
  { re: /\bin (\d+) hours?\b/i, value: (m) => `In ${m[1]} hours` },
  { re: /\bby (Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i, value: (m) => `By ${capitalize(m[1])}` },
  { re: /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i, value: (m) => capitalize(m[1]) },
  { re: /\bnext week\b/i, value: 'Next week' },
  { re: /\bnext month\b/i, value: 'Next month' },
  { re: /\btomorrow\b/i, value: 'Tomorrow' },
  { re: /\btonight\b/i, value: 'Tonight' },
  { re: /\btoday\b/i, value: 'Today' },
  { re: /\bat 9:15\b/i, value: 'Today, 9:15 PM' },
  { re: /\b9:15\b/, value: 'Today, 9:15 PM' },
  { re: /\bat 6:?\s*pm\b/i, value: 'Today, 6:00 PM' },
  { re: /\bat 6\b/i, value: 'Today, 6:00 PM' },
  { re: /\b6:00\b/, value: 'Today, 6:00 PM' },
  { re: /\b(May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr)\s+\d{1,2},?\s+\d{4}\b/i, value: (m) => m[0] },
]

function isLikelyPersonName(name, note, index) {
  if (KNOWN_NAMES.some((n) => n.toLowerCase() === name.toLowerCase())) return true
  const before = note.slice(Math.max(0, index - 14), index)
  if (/\b(and|with|to|from|lent|borrowed|loaned|meet|see|hey|by)\s+$/i.test(before)) return true
  const after = note.slice(index + name.length, index + name.length + 8)
  if (/^\s+and\b/i.test(after)) return true
  return false
}

function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

function classifyType(note) {
  const lower = note.toLowerCase()

  if (/\b(lent|borrowed|loaned)\b/.test(lower)) return 'Borrowed item'
  if (/\b(returned|dropped off|handed over|gave back|brought back)\b/.test(lower)) return 'Return/dropoff'
  if (/\breturn\b/.test(lower) && /\bkeys\b/.test(lower)) return 'Return/dropoff'

  let bestType = 'Agreement'
  let bestScore = 0

  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    let score = 0
    for (const kw of keywords) {
      if (lower.includes(kw)) score++
    }
    if (score > bestScore) {
      bestScore = score
      bestType = type
    }
  }

  return bestScore > 0 ? bestType : 'Agreement'
}

function extractPeople(note) {
  const found = []
  const seen = new Set()

  for (const name of KNOWN_NAMES) {
    if (new RegExp(`\\b${name}\\b`, 'i').test(note) && !seen.has(name.toLowerCase())) {
      found.push(name)
      seen.add(name.toLowerCase())
    }
  }

  for (const match of note.matchAll(/\b([A-Z][a-z]+)\b/g)) {
    const name = match[1]
    const index = match.index ?? 0
    const before = note.slice(0, index)
    const isSentenceStart = index === 0 || /[.!?]\s*$/.test(before)
    const isKnown = KNOWN_NAMES.some((n) => n.toLowerCase() === name.toLowerCase())

    if (NAME_STOP_WORDS.has(name) || seen.has(name.toLowerCase())) continue
    if (isSentenceStart && !isKnown) continue
    if (!isKnown && !isLikelyPersonName(name, note, index)) continue

    found.push(name)
    seen.add(name.toLowerCase())
  }

  for (const { pattern, label } of ROLE_PHRASES) {
    if (pattern.test(note) && !seen.has(label.toLowerCase())) {
      found.push(label)
      seen.add(label.toLowerCase())
    }
  }

  if (found.length === 0) return 'Me, Other person'
  return `Me, ${found.join(', ')}`
}

function getPrimaryPerson(people) {
  if (people === 'Me, Other person') return null
  const parts = people.replace(/^Me,\s*/, '').split(', ')
  return parts[0] || null
}

function extractDue(note) {
  for (const { re, value } of DUE_PATTERNS) {
    const match = note.match(re)
    if (match) {
      return typeof value === 'function' ? value(match) : value
    }
  }
  return 'Not specified'
}

function extractItem(note) {
  const lower = note.toLowerCase()
  if (lower.includes('usb') && lower.includes('charger')) return 'Charger'
  for (const item of ITEM_WORDS) {
    if (lower.includes(item)) return capitalize(item)
  }
  return null
}

function extractMeetingTime(note, due) {
  if (due.startsWith('Today,')) return due.replace('Today, ', '')
  if (/\b9:15\b/.test(note)) return '9:15 PM'
  if (/\b6:?\s*pm\b/i.test(note) || /\bat 6\b/i.test(note)) return '6:00 PM'
  const timeMatch = note.match(/\b(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)\b/)
  if (timeMatch) return timeMatch[1]
  return null
}

function buildTitle(type, note, due) {
  switch (type) {
    case 'Borrowed item': {
      const item = extractItem(note)
      return item ? `${item} return` : 'Borrowed item'
    }
    case 'Money owed':
      return 'Payment reminder'
    case 'Meeting plan': {
      const time = extractMeetingTime(note, due)
      return time ? `Meet at ${time}` : 'Meeting plan'
    }
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

function stripDueFromNote(note, due) {
  let cleaned = note.trim().replace(/\.+$/, '')

  const stripPatterns = [
    /\s+for (?:dinner|lunch|coffee|taxi|the bill)\.?$/i,
    /\s+(?:tomorrow|tonight|today|next week|next month)\.?$/i,
    /\s+after demos\.?$/i,
    /\s+before demos\.?$/i,
    /\s+after the event\.?$/i,
    /\s+after lunch\.?$/i,
    /\s+by (?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\.?$/i,
    /\s+by (?:tomorrow|tonight|today)\.?$/i,
    /\s+in \d+ hours?\.?$/i,
    /\s+at \d{1,2}(?::\d{2})?\s*(?:am|pm)?\.?$/i,
    /\s+while I'?m away\.?$/i,
  ]

  for (const pattern of stripPatterns) {
    cleaned = cleaned.replace(pattern, '')
  }

  const lower = cleaned.toLowerCase()
  if (due !== 'Not specified') {
    const dueTail = due.toLowerCase()
    if (lower.endsWith(`by ${dueTail}`)) {
      cleaned = cleaned.slice(0, -(due.length + 3)).trim()
    } else if (lower.endsWith(dueTail)) {
      cleaned = cleaned.slice(0, -due.length).trim()
    }
  }

  return cleaned.replace(/\.+$/, '').replace(/\s+by\s*$/i, '').trim()
}

function buildAgreement(type, note, people) {
  const primary = getPrimaryPerson(people)
  const lower = note.toLowerCase()
  const due = extractDue(note)
  const cleaned = stripDueFromNote(note, due)

  if (type === 'Borrowed item') {
    let item = 'item'
    if (lower.includes('usb') && lower.includes('charger')) {
      item = 'USB-C charger'
    } else {
      const extracted = extractItem(note)
      if (extracted) item = extracted.toLowerCase()
    }
    if (primary) return `${primary} borrowed my ${item}`
    return `Someone borrowed my ${item}`
  }

  if (type === 'Money owed') {
    if (primary) {
      if (/\bpay me back\b/i.test(note)) return `${primary} will pay me back`
      if (/\bowe/i.test(note)) return `${primary} owes me money`
      return `${primary} will pay me back`
    }
    return 'Payment is owed'
  }

  if (type === 'Meeting plan') {
    const locationMatch = note.match(
      /(?:meet|see)(?:\s+(?:\w+\s+and\s+\w+|\w+))?\s+(?:at|@)\s+(?:the\s+)?(.+?)(?:\s+at\s+\d|\s+by\s|\.$|$)/i
    )
    let location = locationMatch ? locationMatch[1].trim().replace(/\.$/, '') : 'the agreed location'
    location = location.replace(/\s+(?:tomorrow|tonight|today)$/i, '').trim()
    if (primary) return `Meet ${primary} at ${location}`
    return `Meeting at ${location}`
  }

  if (type === 'Return/dropoff') {
    if (lower.includes('keys') && (lower.includes('landlord') || people.includes('Landlord'))) {
      return 'Keys were returned to the landlord'
    }
    if (primary) return `Returned item to ${primary}`
    return 'Item was returned'
  }

  if (type === 'Condition proof') {
    if (/\broom\b/i.test(note) && /\barrived\b/i.test(note)) {
      return 'Room condition recorded when I arrived'
    }
    if (/\broom\b/i.test(note) && /\bleft\b/i.test(note)) {
      return 'Room condition recorded when I left'
    }
    if (/\bcondition\b/i.test(note)) return 'Condition recorded'
    const short = cleaned.length > 90 ? cleaned.slice(0, 90) + '…' : cleaned
    return short || 'Condition recorded'
  }

  if (type === 'Task/promise') {
    const taskMatch = cleaned.match(
      new RegExp(`(${primary ? primary + '|\\w+' : '\\w+'})\\s+(will|agreed to|promised to)\\s+(.+)`, 'i')
    )
    if (taskMatch) {
      const subject = capitalize(taskMatch[1])
      const verb = taskMatch[2].toLowerCase()
      const rest = taskMatch[3].replace(/\.$/, '')
      if (verb === 'agreed to') return `${subject} agreed to ${rest}`
      if (verb === 'promised to') return `${subject} promised to ${rest}`
      return `${subject} will ${rest}`
    }
    if (primary) return `${primary} made a promise`
    const short = cleaned.length > 90 ? cleaned.slice(0, 90) + '…' : cleaned
    return short || 'Promise recorded'
  }

  const short = cleaned.length > 100 ? cleaned.slice(0, 100) + '…' : cleaned
  return short || 'Agreement recorded'
}

function buildSuggestedMessage(type, agreement, people, due, note) {
  const primary = getPrimaryPerson(people)
  const dueLower = due !== 'Not specified' ? due.toLowerCase() : ''

  if (type === 'Borrowed item' && primary) {
    const itemMatch = agreement.match(/borrowed my (.+)$/i)
    const item = itemMatch ? itemMatch[1] : 'the item'
    const duePart = dueLower ? ` and will return it ${dueLower}` : ''
    return `Hey ${primary}, just confirming you borrowed my ${item}${duePart}.`
  }

  if (type === 'Money owed' && primary) {
    const forMatch = note.match(/\bfor (dinner|lunch|coffee|taxi|the \w+)\b/i)
    const forPart = forMatch ? ` for ${forMatch[1]}` : ''
    const duePart = dueLower ? ` ${dueLower}` : ''
    return `Hey ${primary}, confirming you'll pay me back${duePart}${forPart}.`.replace(/\s+/g, ' ')
  }

  if (type === 'Meeting plan' && primary) {
    const locationMatch = agreement.match(/at (.+)$/i)
    const location = locationMatch ? locationMatch[1] : 'the agreed spot'
    const timePart = due.startsWith('Today,') ? ` at ${due.replace('Today, ', '')}` : ''
    return `Hey ${primary}, confirming we're meeting at ${location}${timePart}.`
  }

  if (type === 'Return/dropoff') {
    if (agreement.toLowerCase().includes('keys')) return 'Confirming the keys were returned.'
    return `Confirming: ${agreement.replace(/\.$/, '')}.`
  }

  if (type === 'Task/promise' && primary) {
    const taskMatch = agreement.match(new RegExp(`${primary}\\s+(will|agreed to|promised to)\\s+(.+)`, 'i'))
    if (taskMatch) {
      const action = taskMatch[2].replace(/\.$/, '').replace(/\s+by\s*$/i, '')
      const duePart = dueLower
        ? (dueLower === 'tomorrow' || dueLower === 'tonight' || dueLower === 'today'
          ? ` by ${dueLower}` : ` ${dueLower}`)
        : ''
      if (taskMatch[1].toLowerCase() === 'will') {
        return `Hey ${primary}, confirming you'll ${action}${duePart}.`
      }
      return `Hey ${primary}, confirming you ${taskMatch[1].toLowerCase()} ${action}${duePart}.`
    }
    return `Hey ${primary}, just confirming: ${agreement.replace(/\.$/, '')}.`
  }

  if (type === 'Condition proof') {
    return `Just confirming this record: ${agreement.replace(/\.$/, '')}.`
  }

  if (primary) {
    return `Hey ${primary}, just confirming: ${agreement.replace(/\.$/, '')}.`
  }

  return `Just confirming this agreement: ${agreement.replace(/\.$/, '')}.`
}

function computeConfidence(people, due) {
  const hasPerson = people !== 'Me, Other person'
  const hasDue = due !== 'Not specified'
  if (hasPerson && hasDue) return 'High'
  if (hasPerson || hasDue) return 'Medium'
  return 'Low'
}

function fallbackCard(note) {
  const cleaned = (note || 'Agreement recorded').replace(/\.$/, '')
  return {
    title: 'Agreement',
    type: 'Agreement',
    people: 'Me, Other person',
    agreement: cleaned || 'Agreement recorded',
    due: 'Not specified',
    status: 'Open',
    confidence: 'Low',
    sourceNote: note || '',
    suggestedMessage: `Just confirming this agreement: ${cleaned || 'Agreement recorded'}.`,
  }
}

export function parseProofNote(note) {
  try {
    const trimmed = (note || '').trim()
    if (!trimmed) return fallbackCard('')

    const type = classifyType(trimmed) || 'Agreement'
    const people = extractPeople(trimmed) || 'Me, Other person'
    const due = extractDue(trimmed) || 'Not specified'
    const title = buildTitle(type, trimmed, due) || 'Agreement'
    const agreement = buildAgreement(type, trimmed, people) || trimmed
    const suggestedMessage = buildSuggestedMessage(type, agreement, people, due, trimmed)
      || `Just confirming this agreement: ${agreement}.`
    const confidence = computeConfidence(people, due) || 'Low'

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
  } catch {
    return fallbackCard((note || '').trim())
  }
}
