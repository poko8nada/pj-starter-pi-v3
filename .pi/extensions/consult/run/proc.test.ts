import { describe, expect, it } from 'vitest';
import { checkPid, readStartToken, type PsRun } from './proc.ts';

const START = 'Wed Oct 21 12:41:12 2026';

function ps(result: {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
}): PsRun {
  return () => result;
}

describe('checkPid', () => {
  it('lstart が startToken と一致 → running', () => {
    const run = ps({
      status: 0,
      stdout: `${START}\n`,
      stderr: '',
    });
    expect(checkPid(123, START, run)).toBe('running');
  });

  it('lstart が違う → ended（pid の再利用）', () => {
    const run = ps({
      status: 0,
      stdout: 'Wed Oct 21 12:41:13 2026\n',
      stderr: '',
    });
    expect(checkPid(123, START, run)).toBe('ended');
  });

  it('pid が無い（exit 1・出力なし・stderr なし）→ ended', () => {
    const run = ps({ status: 1, stdout: '', stderr: '' });
    expect(checkPid(999999, START, run)).toBe('ended');
  });

  it('stderr あり → unknown', () => {
    const run = ps({
      status: 0,
      stdout: `${START}\n`,
      stderr: 'ps: error',
    });
    expect(checkPid(123, START, run)).toBe('unknown');
  });

  it('lstart が startToken を含むが一致しない（前後に語がある）→ ended（部分一致では通らない）', () => {
    const run = ps({
      status: 0,
      stdout: `prefix ${START} suffix\n`,
      stderr: '',
    });
    expect(checkPid(123, START, run)).toBe('ended');
  });

  it('ps に渡る引数 → -p、<pid>、-o、lstart= を含み、-ww を含まない', () => {
    const seen: string[][] = [];
    const run: PsRun = (args) => {
      seen.push([...args]);
      return { status: 1, stdout: '', stderr: '' };
    };
    expect(checkPid(123, START, run)).toBe('ended');
    expect(seen[0]).toContain('-p');
    expect(seen[0]).toContain('123');
    expect(seen[0]).toContain('-o');
    expect(seen[0]).toContain('lstart=');
    expect(seen[0]).not.toContain('-ww');
  });

  it('0 以下・非整数の pid → ended（ps を叩かない）', () => {
    let called = 0;
    const run: PsRun = () => {
      called += 1;
      return { status: 0, stdout: '', stderr: '' };
    };
    expect(checkPid(0, START, run)).toBe('ended');
    expect(checkPid(-5, START, run)).toBe('ended');
    expect(checkPid(3.5, START, run)).toBe('ended');
    expect(called).toBe(0);
  });

  it('status 2 → unknown', () => {
    const run = ps({ status: 2, stdout: '', stderr: '' });
    expect(checkPid(123, START, run)).toBe('unknown');
  });

  it('status 1 で出力あり → unknown', () => {
    const run = ps({ status: 1, stdout: `${START}\n`, stderr: '' });
    expect(checkPid(123, START, run)).toBe('unknown');
  });

  it('startToken が空文字 → unknown（ps を叩かない）', () => {
    let called = 0;
    const run: PsRun = () => {
      called += 1;
      return { status: 0, stdout: '', stderr: '' };
    };
    expect(checkPid(123, '', run)).toBe('unknown');
    expect(called).toBe(0);
  });
});

describe('readStartToken', () => {
  it('ps が lstart を返す → 前後の空白を落とした文字列', () => {
    const run = ps({
      status: 0,
      stdout: `  ${START}\n`,
      stderr: '',
    });
    expect(readStartToken(123, run)).toBe(START);
  });

  it('ps が exit 1 で出力なし → undefined', () => {
    const run = ps({ status: 1, stdout: '', stderr: '' });
    expect(readStartToken(999999, run)).toBeUndefined();
  });

  it('ps が stderr を返す → undefined', () => {
    const run = ps({ status: 0, stdout: `${START}\n`, stderr: 'ps: error' });
    expect(readStartToken(123, run)).toBeUndefined();
  });

  it('ps に渡る引数 → -p、<pid>、-o、lstart= を含む', () => {
    const seen: string[][] = [];
    const run: PsRun = (args) => {
      seen.push([...args]);
      return { status: 0, stdout: `${START}\n`, stderr: '' };
    };
    expect(readStartToken(123, run)).toBe(START);
    expect(seen[0]).toContain('-p');
    expect(seen[0]).toContain('123');
    expect(seen[0]).toContain('-o');
    expect(seen[0]).toContain('lstart=');
  });

  it('0 以下・非整数の pid → undefined（ps を叩かない）', () => {
    let called = 0;
    const run: PsRun = () => {
      called += 1;
      return { status: 0, stdout: `${START}\n`, stderr: '' };
    };
    expect(readStartToken(0, run)).toBeUndefined();
    expect(readStartToken(-5, run)).toBeUndefined();
    expect(readStartToken(3.5, run)).toBeUndefined();
    expect(called).toBe(0);
  });

  it('status 0 で出力が空・空白だけ → undefined', () => {
    expect(readStartToken(123, ps({ status: 0, stdout: '', stderr: '' }))).toBeUndefined();
    expect(readStartToken(123, ps({ status: 0, stdout: '   \n  ', stderr: '' }))).toBeUndefined();
  });
});
