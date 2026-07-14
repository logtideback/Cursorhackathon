const BLOCKED_PROPERTY_KEYS = new Set([
  'password',
  'passwordConfirm',
  'confirmPassword',
  'token',
  'accessToken',
  'refreshToken',
  'note',
  'privateNote',
  'notes',
  'email',
  'phone',
  'query',
  'searchQuery',
  'fullName',
  'displayName',
  'bio',
]);

/**
 * Strips sensitive keys and truncates unexpected free-text fields.
 * Search query strings are never allowed through — use queryLength/hasQuery instead.
 */
export function sanitizeProperties(
  properties: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!properties) {
    return {};
  }

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (BLOCKED_PROPERTY_KEYS.has(key)) {
      continue;
    }
    if (key.toLowerCase().includes('password')) {
      continue;
    }
    if (typeof value === 'string' && value.length > 200) {
      clean[key] = `${value.slice(0, 200)}…`;
      continue;
    }
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      clean[key] = value;
    }
  }
  return clean;
}
