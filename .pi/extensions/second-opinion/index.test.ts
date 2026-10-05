import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../test/tmp.ts';
import type { RunResult } from './run/run.ts';
import { bodyOf, parseCommandArgs, runOpinion, toRequest } from './index.ts';

// 子を走らせない分だけを試す（文字列の組み立てと、終わり方の判定）。
// 本物の pi との接続（`context` や `onUpdate`）は、偽物では確かめられないので試さない。

describe('toRequest', () => {
  it('何も渡さなければ空の依頼', () => {
    expect(toRequest({})).toEqual({});
  });

  it('focus の上書き', () => {
    expect(toRequest({ focus: 'is this consistent?' })).toEqual({ focus: 'is this consistent?' });
  });

  it('空の focus は指定なしとみなす', () => {
    expect(toRequest({ focus: '   ' })).toEqual({});
  });

  it('messages の上書き', () => {
    expect(toRequest({ messages: 5 })).toEqual({ messages: 5 });
  });
});

describe('parseCommandArgs', () => {
  it('先頭が数字なら件数、残りが質問', () => {
    expect(parseCommandArgs('10 is this consistent?')).toEqual({
      messages: 10,
      focus: 'is this consistent?',
    });
  });

  it('数字だけなら件数だけ', () => {
    expect(parseCommandArgs('10')).toEqual({ messages: 10 });
  });

  it('数字でなければ質問だけ', () => {
    expect(parseCommandArgs('is this consistent?')).toEqual({ focus: 'is this consistent?' });
  });

  it('空なら空の依頼', () => {
    expect(parseCommandArgs('')).toEqual({});
    expect(parseCommandArgs('   ')).toEqual({});
  });
});

/** 終わった子の結果。`ended` だけを変えて終わり方を作る */
function ended(extra: Partial<RunResult> = {}): RunResult {
  return { stdout: '', stderr: '', code: 0, aborted: false, ended: false, ...extra };
}

const SAY_HI =
  '{"type":"message_end","message":{"role":"assistant","content":[{"type":"text","text":"hi"}],"usage":{"output":1}}}\n';

describe('bodyOf', () => {
  it('本文があり done → 本文だけ', () => {
    expect(bodyOf(ended({ stdout: SAY_HI, ended: true }))).toEqual({ text: 'hi' });
  });

  it('本文があり turn-limit → 本文と打ち切りの理由', () => {
    expect(bodyOf(ended({ stdout: SAY_HI, stopped: 'turn limit reached (20)' }))).toEqual({
      text: 'hi',
      cut: 'turn limit reached (20)',
    });
  });

  it('本文があり aborted → 理由は stopped by the parent', () => {
    expect(bodyOf(ended({ stdout: SAY_HI, aborted: true }))).toEqual({
      text: 'hi',
      cut: 'stopped by the parent',
    });
  });

  it('本文があり error → 理由は stderr の1行', () => {
    expect(bodyOf(ended({ stdout: SAY_HI, code: 1, stderr: 'boom' }))).toEqual({
      text: 'hi',
      cut: 'boom',
    });
  });

  it('生成 0 のまま done の空本文は、空のまま返す', () => {
    expect(bodyOf(ended({ ended: true }))).toEqual({ text: '' });
  });

  it('本文が空で done でない → 投げる', () => {
    expect(() => bodyOf(ended({ code: 1, stderr: 'boom' }))).toThrow(/did not finish.*boom/);
    expect(() => bodyOf(ended({ stopped: 'turn limit reached (20)' }))).toThrow(/did not finish/);
    expect(() => bodyOf(ended({ aborted: true }))).toThrow(/did not finish/);
  });
});

/** 子を走らせずに依頼だけを渡すための面。会話は空 */
function port() {
  return { cwd: tmpDir(), env: process.env, messages: () => [] };
}

describe('不正な messages', () => {
  it('messages: 0 → 子を走らせず投げる', async () => {
    await expect(runOpinion(port(), { messages: 0 })).rejects.toThrow(/positive integer/);
  });
});
