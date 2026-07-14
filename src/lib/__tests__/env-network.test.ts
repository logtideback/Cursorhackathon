import { describe, expect, it } from 'vitest';

import { auditNetworkSecurity, requiresSecureTransport } from '@/lib/network-security';

describe('network security audit', () => {
  it('flags non-https supabase urls', () => {
    const issues = auditNetworkSecurity({
      supabaseUrl: 'http://example.supabase.co',
      configured: true,
      appEnv: 'production',
    });
    expect(issues.some((issue) => issue.level === 'error')).toBe(true);
  });

  it('accepts https production urls', () => {
    const issues = auditNetworkSecurity({
      supabaseUrl: 'https://example.supabase.co',
      configured: true,
      appEnv: 'production',
    });
    expect(issues).toHaveLength(0);
  });

  it('warns when not configured', () => {
    const issues = auditNetworkSecurity({
      supabaseUrl: '',
      configured: false,
      appEnv: 'development',
    });
    expect(issues[0]?.level).toBe('warning');
  });

  it('requires secure transport outside development', () => {
    expect(requiresSecureTransport('production')).toBe(true);
    expect(requiresSecureTransport('preview')).toBe(true);
  });
});
