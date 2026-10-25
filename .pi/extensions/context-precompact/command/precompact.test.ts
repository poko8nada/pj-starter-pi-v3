import { describe, expect, it } from 'vitest';
import { parseCommand } from './precompact.ts';

describe('parseCommand', () => {
  it('空 → status、on / off / now → それぞれ', () => {
    expect(parseCommand('')).toEqual({ kind: 'status' });
    expect(parseCommand('on')).toEqual({ kind: 'on' });
    expect(parseCommand('off')).toEqual({ kind: 'off' });
    expect(parseCommand('now')).toEqual({ kind: 'now' });
  });

  it('foo → usage', () => {
    expect(parseCommand('foo')).toEqual({ kind: 'usage' });
  });
});
