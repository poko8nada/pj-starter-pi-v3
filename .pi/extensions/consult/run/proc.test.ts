import { describe, expect, it } from 'vitest';
import { checkPid, type PsRun } from './proc.ts';

function ps(result: {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
}): PsRun {
  return () => result;
}

describe('checkPid', () => {
  it('生きている pid で token が argv にある → running', () => {
    const run = ps({
      status: 0,
      stdout: 'pi --mode json -p --name token-1 --no-session',
      stderr: '',
    });
    expect(checkPid(123, 'token-1', run)).toBe('running');
  });

  it('生きている pid で token が argv に無い → ended', () => {
    const run = ps({
      status: 0,
      stdout: 'pi --mode json -p --name other --no-session',
      stderr: '',
    });
    expect(checkPid(123, 'token-1', run)).toBe('ended');
  });

  it('status 1・出力なし・stderr なし → ended', () => {
    const run = ps({ status: 1, stdout: '', stderr: '' });
    expect(checkPid(999999, 'token-1', run)).toBe('ended');
  });

  it('stderr あり → unknown', () => {
    const run = ps({ status: 0, stdout: 'pi --name token-1', stderr: 'ps: error' });
    expect(checkPid(123, 'token-1', run)).toBe('unknown');
  });

  it('status 2 → unknown', () => {
    const run = ps({ status: 2, stdout: '', stderr: '' });
    expect(checkPid(123, 'token-1', run)).toBe('unknown');
  });

  it('status null → unknown', () => {
    const run = ps({ status: null, stdout: '', stderr: '' });
    expect(checkPid(123, 'token-1', run)).toBe('unknown');
  });

  it('status 0 で stderr あり → unknown', () => {
    const run = ps({ status: 0, stdout: 'pi --name token-1', stderr: 'warning' });
    expect(checkPid(123, 'token-1', run)).toBe('unknown');
  });

  it('status 1 で stderr あり → unknown', () => {
    const run = ps({ status: 1, stdout: '', stderr: 'ps: error' });
    expect(checkPid(123, 'token-1', run)).toBe('unknown');
  });

  it('status 0 で token が出力の後ろにある → running', () => {
    const run = ps({
      status: 0,
      stdout: '/usr/bin/pi --mode json -p --session /tmp/s --name token-9',
      stderr: '',
    });
    expect(checkPid(456, 'token-9', run)).toBe('running');
  });

  it('run に渡る引数 → -ww を含む', () => {
    const seen: string[][] = [];
    const run: PsRun = (args) => {
      seen.push([...args]);
      return { status: 1, stdout: '', stderr: '' };
    };
    expect(checkPid(123, 'token-1', run)).toBe('ended');
    expect(seen[0]).toContain('-ww');
  });

  it('pid が 0 以下・非整数 → ended（ps を叩かない）', () => {
    let called = 0;
    const run: PsRun = () => {
      called += 1;
      return { status: 0, stdout: '', stderr: '' };
    };
    expect(checkPid(0, 'token-1', run)).toBe('ended');
    expect(checkPid(-5, 'token-1', run)).toBe('ended');
    expect(checkPid(3.5, 'token-1', run)).toBe('ended');
    expect(called).toBe(0);
  });

  it('token が空文字 → unknown（ps を叩かない）', () => {
    let called = 0;
    const run: PsRun = () => {
      called += 1;
      return { status: 0, stdout: '', stderr: '' };
    };
    expect(checkPid(123, '', run)).toBe('unknown');
    expect(called).toBe(0);
  });

  it('status 1 で stdout あり → unknown', () => {
    const run = ps({ status: 1, stdout: 'something', stderr: '' });
    expect(checkPid(123, 'token-1', run)).toBe('unknown');
  });
});
