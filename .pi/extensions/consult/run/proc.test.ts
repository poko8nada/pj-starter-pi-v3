import { describe, expect, it } from 'vitest';
import { checkPid, readStartToken, type PsRun } from './proc.ts';

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

describe('readStartToken', () => {
  it('ps が lstart を返す → 前後の空白を落とした文字列', () => {
    const run = ps({
      status: 0,
      stdout: 'Wed Oct 21 12:41:12 2026\n',
      stderr: '',
    });
    expect(readStartToken(123, run)).toBe('Wed Oct 21 12:41:12 2026');
  });

  it('lstart が 28 桁に詰められている → 前後の空白を落として一致する', () => {
    const run = ps({
      status: 0,
      stdout: '  Wed Oct 21 12:41:12 2026  \n',
      stderr: '',
    });
    expect(readStartToken(123, run)).toBe('Wed Oct 21 12:41:12 2026');
  });

  it('ps が exit 1 で出力なし → undefined', () => {
    const run = ps({ status: 1, stdout: '', stderr: '' });
    expect(readStartToken(999999, run)).toBeUndefined();
  });

  it('ps が stderr を返す → undefined', () => {
    const run = ps({ status: 0, stdout: 'Wed Oct 21 12:41:12 2026\n', stderr: 'ps: error' });
    expect(readStartToken(123, run)).toBeUndefined();
  });

  it('ps に渡る引数 → -p、<pid>、-o、lstart= を含む', () => {
    const seen: string[][] = [];
    const run: PsRun = (args) => {
      seen.push([...args]);
      return { status: 0, stdout: 'Wed Oct 21 12:41:12 2026\n', stderr: '' };
    };
    expect(readStartToken(123, run)).toBe('Wed Oct 21 12:41:12 2026');
    expect(seen[0]).toContain('-p');
    expect(seen[0]).toContain('123');
    expect(seen[0]).toContain('-o');
    expect(seen[0]).toContain('lstart=');
  });

  it('0 以下・非整数の pid → undefined（ps を叩かない）', () => {
    let called = 0;
    const run: PsRun = () => {
      called += 1;
      return { status: 0, stdout: 'Wed Oct 21 12:41:12 2026\n', stderr: '' };
    };
    expect(readStartToken(0, run)).toBeUndefined();
    expect(readStartToken(-5, run)).toBeUndefined();
    expect(readStartToken(3.5, run)).toBeUndefined();
    expect(called).toBe(0);
  });
});
