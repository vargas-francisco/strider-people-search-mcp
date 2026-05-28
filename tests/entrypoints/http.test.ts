import { describe, expect, it } from 'vitest';
import { extractBearer } from '../../src/entrypoints/http.js';

describe('extractBearer', () => {
  it('returns the token from a well-formed Authorization header', () => {
    expect(extractBearer('Bearer abc123')).toBe('abc123');
  });

  it('returns null when header is missing', () => {
    expect(extractBearer(undefined)).toBeNull();
  });

  it('returns null when scheme is not Bearer', () => {
    expect(extractBearer('Basic xyz')).toBeNull();
  });

  it('handles bearer case-insensitively', () => {
    expect(extractBearer('bearer xyz')).toBe('xyz');
  });
});
