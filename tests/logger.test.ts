import { describe, expect, it } from 'vitest';
import { createLogger } from '../src/logger.js';

describe('createLogger', () => {
  it('returns an object with log methods', () => {
    const log = createLogger({ logLevel: 'info' });
    expect(typeof log.info).toBe('function');
    expect(typeof log.error).toBe('function');
    expect(typeof log.warn).toBe('function');
    expect(typeof log.debug).toBe('function');
  });

  it('does not throw when logging an object', () => {
    const log = createLogger({ logLevel: 'silent' });
    expect(() => log.info({ foo: 'bar' }, 'message')).not.toThrow();
  });
});
